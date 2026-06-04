"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { X, Loader2, Copy, Check, Image } from "lucide-react";

/* ========================================
   IMAGE UPLOAD MODAL
   Standalone component for uploading images
   to yojn-images bucket under uploads/
======================================== */

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId?: string;
  onUploaded?: () => void;
  onStoreUpdated?: (updatedStore: { image_urls: string[] }) => void;
}

interface UploadedFile {
  url: string;
  fileName: string;
}

export default function ImageUploadModal({ isOpen, onClose, storeId, onUploaded, onStoreUpdated }: ImageUploadModalProps) {
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<boolean[]>([]);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Auth gate
  if (!isAuthenticated || !user) {
    return (
      <>
        {/* Invisible trigger: show AuthModal when not logged in */}
        {isOpen && !showAuthModal && (
          <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4"
          >
            <div className="relative bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <Image className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium mb-2">上傳圖片</h3>
              <p className="text-xs text-muted-foreground mb-4">
                請先登入後即可上傳圖片。
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full py-2.5 bg-foreground text-background rounded-xl text-xs font-medium"
              >
                登入 / 註冊
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => { setShowAuthModal(false); onClose(); }}
          contextMessage="登入後即可上傳圖片至平台。"
        />
      </>
    );
  }

  const insertStoreImage = async (publicUrl: string) => {
    if (!storeId || !user) return;
    try {
      const { error: insertError } = await supabase
        .from("store_images")
        .insert({
          store_id: storeId,
          user_id: user.id,
          image_url: publicUrl,
          is_official: false,
        });

      if (insertError) {
        console.error("Error inserting into store_images:", insertError);
        return;
      }

      // Also update stores.image_urls so StoreCard on the home page shows the image
      const { data: storeData, error: fetchError } = await supabase
        .from("stores")
        .select("image_urls")
        .eq("id", storeId)
        .single();

      if (fetchError) {
        console.error("Error fetching store for image_urls update:", fetchError);
        return;
      }

      const currentUrls: string[] = storeData?.image_urls ?? [];
      // Avoid duplicates
      if (!currentUrls.includes(publicUrl)) {
        const newUrls = [...currentUrls, publicUrl];
        const { error: updateError } = await supabase
          .from("stores")
          .update({ image_urls: newUrls })
          .eq("id", storeId);

        if (updateError) {
          console.error("Error updating stores.image_urls:", updateError);
        } else {
          // Notify parent about the updated image_urls
          onStoreUpdated?.({ image_urls: newUrls });
        }
      }
    } catch (e) {
      console.error("Error inserting into store_images:", e);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const startIdx = uploadedFiles.length;
    setUploadingFiles((prev) => [...prev, ...files.map(() => true)]);
    setError("");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      // Use store-specific path if storeId is provided, otherwise use generic uploads/
      const filePath = storeId
        ? `store-images/${storeId}/${fileName}`
        : `uploads/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from("yojn-images")
          .upload(filePath, file);

        if (uploadError) {
          if (
            uploadError.message?.includes("Bucket not found") ||
            uploadError.message?.includes("bucket")
          ) {
            console.warn(
              "Storage bucket 'yojn-images' not found. Create the bucket in Supabase dashboard to enable uploads."
            );
            setError("儲存空間尚未啟用，請聯繫管理員。");
            continue;
          }
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from("yojn-images")
          .getPublicUrl(filePath);

        const publicUrl = publicUrlData.publicUrl;

        setUploadedFiles((prev) => [
          ...prev,
          { url: publicUrl, fileName },
        ]);

        // If storeId is provided, insert into store_images table
        if (storeId) {
          await insertStoreImage(publicUrl);
        }
      } catch (err: any) {
        if (
          err?.message?.includes("Bucket not found") ||
          err?.message?.includes("bucket")
        ) {
          console.warn("Storage bucket 'yojn-images' not found. Image upload skipped.");
          setError("儲存空間尚未啟用，請聯繫管理員。");
          continue;
        }
        console.error("Error uploading image:", JSON.stringify(err));
        setError(err?.message || "圖片上傳失敗");
      } finally {
        setUploadingFiles((prev) => {
          const next = [...prev];
          next[startIdx + i] = false;
          return next;
        });
      }
    }

    // Notify parent that uploads are complete
    onUploaded?.();

    // Reset input so same files can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (index: number) => {
    const file = uploadedFiles[index];
    if (!file) return;

    try {
      const bucket = "yojn-images";
      const storageUrl = `https://scbdzggkxrrebbpsbruc.supabase.co/storage/v1/object/public/${bucket}/`;
      if (file.url.startsWith(storageUrl)) {
        const filePath = file.url.replace(storageUrl, "");
        await supabase.storage.from(bucket).remove([filePath]);
      }
    } catch (e) {
      console.error("Error deleting image from storage:", e);
    }

    // If storeId is provided, also remove the record from store_images
    if (storeId) {
      try {
        await supabase
          .from("store_images")
          .delete()
          .eq("store_id", storeId)
          .eq("image_url", file.url);
      } catch (e) {
        console.error("Error deleting from store_images:", e);
      }
    }

    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopyUrl = async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4"
    >
      <div className="relative bg-card border border-border rounded-2xl p-5 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">上傳圖片</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-border rounded-xl p-4 mb-4 flex-shrink-0">
          <label className="flex flex-col items-center justify-center gap-2 cursor-pointer py-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <svg
              className="w-8 h-8 text-muted-foreground/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs text-muted-foreground">
              點擊選擇圖片
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              支援 JPG / PNG / WebP
            </span>
          </label>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 mb-3 flex-shrink-0">{error}</p>
        )}

        {/* Uploading Spinners */}
        {uploadingFiles.some(Boolean) && (
          <div className="flex gap-2 flex-wrap mb-3 flex-shrink-0">
            {uploadingFiles.map(
              (isUploading, idx) =>
                isUploading && (
                  <div
                    key={idx}
                    className="w-16 h-16 rounded-lg bg-secondary border border-border flex items-center justify-center"
                  >
                    <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                  </div>
                )
            )}
          </div>
        )}

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
            <p className="text-[10px] text-muted-foreground font-medium flex-shrink-0">
              已上傳 {uploadedFiles.length} 張圖片
            </p>
            {uploadedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2 bg-secondary/50 border border-border rounded-lg"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden border border-border flex-shrink-0">
                  <img
                    src={file.url}
                    alt={`Upload ${idx}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>

                {/* URL */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground truncate">
                    {file.url}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Copy URL */}
                  <button
                    onClick={() => handleCopyUrl(file.url, idx)}
                    className="p-1.5 hover:bg-secondary rounded-md transition-colors"
                    title="複製 URL"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(idx)}
                    className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors"
                    title="刪除"
                  >
                    <X className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {uploadedFiles.length === 0 && !uploadingFiles.some(Boolean) && (
          <div className="text-center py-6">
            <p className="text-xs text-muted-foreground">
              尚未上傳任何圖片
            </p>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 mt-3 bg-foreground text-background rounded-xl text-xs font-medium flex-shrink-0"
        >
          完成
        </button>
      </div>
    </div>
  );
}
