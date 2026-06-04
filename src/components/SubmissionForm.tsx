"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Store } from "@/data/mockData";
import { areaOptions, submissionTags } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { Check, X, Loader2 } from "lucide-react";

/* ========================================
   SUBMIT VIEW (Screen 3)
======================================== */

interface SubmitViewProps {
  onBack: () => void;
  onSubmit: (store: Store) => void;
  stores: Store[]; // Existing stores for duplicate check
  onDuplicateRedirect?: (storeId: string) => void; // Redirect to existing store
}

export default function SubmitView({ onBack, onSubmit, stores, onDuplicateRedirect }: SubmitViewProps) {
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    ig_username: "",
    area: "",
    address: "",
    tags: [] as string[],
    comment: "",
    image_urls: [] as string[],
    // UGC 2.0: User-provided fields instead of hardcoded
    avg_duration_hours: "",
    is_returning: null as boolean | null,
    vibe_tag: "",
  });
  const [uploadingImages, setUploadingImages] = useState<boolean[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [duplicateToast, setDuplicateToast] = useState<{ visible: boolean; storeId: string }>({ visible: false, storeId: "" });

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.ig_username || !formData.area) return;

    // --- Duplicate Prevention: Check if ig_username already exists locally ---
    const normalizedIg = formData.ig_username.replace("@", "").toLowerCase().trim();
    const existingStore = stores.find(
      (s) => s.ig_username.toLowerCase() === normalizedIg
    );

    if (existingStore) {
      // Show elegant custom toast and redirect
      setDuplicateToast({ visible: true, storeId: existingStore.id });
      setTimeout(() => {
        setDuplicateToast({ visible: false, storeId: "" });
        if (onDuplicateRedirect) {
          onDuplicateRedirect(existingStore.id);
        }
      }, 2500);
      return;
    }

    // Auth gate: if not authenticated, show modal instead of submitting
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Use user-provided values or null (to be filled by community data)
      const avgDuration = formData.avg_duration_hours ? parseFloat(formData.avg_duration_hours) : null;
      const vibeTag = formData.vibe_tag || formData.tags[0] || "待驗證";

      // 1. Insert store
      const { data: newStore, error: storeError } = await supabase
        .from("stores")
        .insert({
          name: formData.name,
          ig_username: formData.ig_username.replace("@", ""),
          area: formData.area,
          banner_url: "",
          avg_duration_hours: avgDuration,
          retention_rate: null,
          vibe_tag: vibeTag,
          tags: formData.tags,
          image_urls: formData.image_urls.length > 0 ? formData.image_urls : null,
        })
        .select("id")
        .single();

      if (storeError) throw storeError;
      if (!newStore) throw new Error("Failed to create store");

      // 2. Insert specialties
      const specialtiesData = formData.tags.slice(0, 2).map((tag, idx) => ({
        store_id: newStore.id,
        name: tag,
        percentage: idx === 0 ? 70 : 30,
      }));

      if (specialtiesData.length > 0) {
        const { error: specError } = await supabase
          .from("store_specialties")
          .insert(specialtiesData);

        if (specError) throw specError;
      }

      // 3. Build the Store object for optimistic update
      const createdStore: Store = {
        id: newStore.id,
        name: formData.name,
        ig_username: formData.ig_username.replace("@", ""),
        area: formData.area,
        banner_url: "",
        avg_duration_hours: 1.5,
        retention_rate: 90,
        vibe_tag: formData.tags[0] || "待驗證",
        specialties: formData.tags.slice(0, 2).map((tag, idx) => ({
          name: tag,
          percentage: idx === 0 ? 70 : 30,
        })),
        tags: formData.tags,
        image_urls: formData.image_urls.length > 0 ? formData.image_urls : undefined,
      };

      setIsSubmitted(true);
      setTimeout(() => {
        onSubmit(createdStore);
        onBack();
      }, 2000);
    } catch (err: any) {
      console.error("Error submitting store:", err);
      setError(err?.message || "提交失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <Check className="w-6 h-6 text-foreground" />
          </div>
          <h2 className="font-serif text-xl mb-2">情報已收錄</h2>
          <p className="text-sm text-muted-foreground">
            審核中，感謝您的貢獻
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={onBack} className="p-1">
            <X className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="font-serif text-base">YOJN Mégazine</h1>
            <p className="text-[10px] text-muted-foreground">匿名提報</p>
          </div>
          <div className="w-7" />
        </div>
      </header>

      <div className="px-4 pt-6">
        {/* Editorial Headline */}
        <div className="text-center mb-8">
          <h2 className="font-serif text-xl mb-2">提供消費情報 (匿名)</h2>
          <p className="text-xs text-muted-foreground">
            幫助更多人發現值得信賴的職人
          </p>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Store Name */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              店家/工作室名稱 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="例：指尖詩篇"
              className="w-full py-2.5 text-sm bg-transparent border-b border-border focus:border-foreground focus:outline-none transition-colors"
            />
          </div>

          {/* IG Username */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              IG 帳號 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.ig_username}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  ig_username: e.target.value,
                }))
              }
              placeholder="@example_nail"
              className="w-full py-2.5 text-sm bg-transparent border-b border-border focus:border-foreground focus:outline-none transition-colors"
            />
          </div>

          {/* Area */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              所在地區 <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.area}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, area: e.target.value }))
              }
              className="w-full py-2.5 text-sm bg-transparent border-b border-border focus:border-foreground focus:outline-none transition-colors appearance-none"
            >
              <option value="">請選擇地區</option>
              {areaOptions.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              大致地址或地標 (選填)
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder="例：逢甲夜市附近"
              className="w-full py-2.5 text-sm bg-transparent border-b border-border focus:border-foreground focus:outline-none transition-colors"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">
              核心特徵標籤
            </label>
            <div className="flex flex-wrap gap-1.5">
              {submissionTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    formData.tags.includes(tag)
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card text-foreground border-border"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload Area - Native File Upload via Supabase Storage */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              店家照片 (選填)
            </label>
            <div className="border-2 border-dashed border-border rounded-xl p-4">
              {/* File Input Trigger */}
              <label className="flex flex-col items-center justify-center gap-2 cursor-pointer py-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    const startIdx = formData.image_urls.length;
                    setUploadingImages((prev) => [...prev, ...files.map(() => true)]);
                    for (let i = 0; i < files.length; i++) {
                      const file = files[i];
                      const fileExt = file.name.split(".").pop();
                      const filePath = `store-submissions/${crypto.randomUUID()}.${fileExt}`;
                      try {
                        const { error: uploadError } = await supabase.storage
                          .from("yojn-images")
                          .upload(filePath, file);
                        if (uploadError) {
                          // Gracefully handle missing storage bucket
                          if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("bucket")) {
                            console.warn("Storage bucket 'yojn-images' not found. Image upload skipped. Create the bucket in Supabase dashboard to enable uploads.");
                            continue;
                          }
                          throw uploadError;
                        }
                        const { data: publicUrlData } = supabase.storage
                          .from("yojn-images")
                          .getPublicUrl(filePath);
                        const publicUrl = publicUrlData.publicUrl;
                        setFormData((prev) => ({
                          ...prev,
                          image_urls: [...prev.image_urls, publicUrl],
                        }));
                      } catch (err: any) {
                        // Skip storage errors silently — image upload is optional
                        if (err?.message?.includes("Bucket not found") || err?.message?.includes("bucket")) {
                          console.warn("Storage bucket 'yojn-images' not found. Image upload skipped.");
                          continue;
                        }
                        console.error("Error uploading image:", err);
                        setError(err?.message || "圖片上傳失敗");
                      } finally {
                        setUploadingImages((prev) => {
                          const next = [...prev];
                          next[startIdx + i] = false;
                          return next;
                        });
                      }
                    }
                    // Reset the input so the same file can be re-selected
                    e.target.value = "";
                  }}
                />
                <svg className="w-8 h-8 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-muted-foreground">點擊選擇相簿照片</span>
                <span className="text-[10px] text-muted-foreground/60">支援 JPG / PNG / WebP</span>
              </label>

              {/* Uploaded Images Preview */}
              {formData.image_urls.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-2">
              {formData.image_urls.map((url, idx) => (
                    <div key={idx} className="relative w-14 h-14 rounded-lg bg-secondary overflow-hidden border border-border">
                      <img
                        src={url}
                        alt={`Upload ${idx}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <button
                        onClick={async () => {
                          // Remove from Storage
                          try {
                            const bucket = "yojn-images";
                            const storageUrl = `https://scbdzggkxrrebbpsbruc.supabase.co/storage/v1/object/public/${bucket}/`;
                            if (url.startsWith(storageUrl)) {
                              const filePath = url.replace(storageUrl, "");
                              await supabase.storage.from(bucket).remove([filePath]);
                            }
                          } catch (e) {
                            console.error("Error deleting image from storage:", e);
                          }
                          // Remove from form state
                          setFormData((prev) => ({ ...prev, image_urls: prev.image_urls.filter((_, i) => i !== idx) }));
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Uploading Spinners */}
              {uploadingImages.some(Boolean) && (
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {uploadingImages.map(
                    (isUploading, idx) =>
                      isUploading && (
                        <div
                          key={idx}
                          className="w-14 h-14 rounded-lg bg-secondary border border-border flex items-center justify-center"
                        >
                          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                        </div>
                      )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* UGC 2.0: Average duration & returning */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                平均施作時間 (選填)
              </label>
              <select
                value={formData.avg_duration_hours}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, avg_duration_hours: e.target.value }))
                }
                className="w-full py-2.5 text-sm bg-transparent border-b border-border focus:border-foreground focus:outline-none transition-colors appearance-none"
              >
                <option value="">不確定</option>
                <option value="1">1 小時</option>
                <option value="1.5">1.5 小時</option>
                <option value="2">2 小時</option>
                <option value="2.5">2.5 小時+</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                是否回頭客 (選填)
              </label>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setFormData((prev) => ({ ...prev, is_returning: true }))}
                  className={`px-3 py-1.5 text-xs rounded-full border ${formData.is_returning === true ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground border-border'}`}
                >
                  是
                </button>
                <button
                  onClick={() => setFormData((prev) => ({ ...prev, is_returning: false }))}
                  className={`px-3 py-1.5 text-xs rounded-full border ${formData.is_returning === false ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground border-border'}`}
                >
                  否
                </button>
              </div>
            </div>
          </div>

          {/* Vibe tag - user fills in instead of using first tag */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              一句話形容這家店 (選填)
            </label>
            <input
              type="text"
              value={formData.vibe_tag}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, vibe_tag: e.target.value }))
              }
              placeholder="例：貓咪超可愛、環境很安靜"
              className="w-full py-2.5 text-sm bg-transparent border-b border-border focus:border-foreground focus:outline-none transition-colors"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              首次匿名留言 (選填)
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, comment: e.target.value }))
              }
              placeholder="分享你對這間店的初步印象..."
              rows={3}
              className="w-full py-2.5 text-sm bg-transparent border-b border-border focus:border-foreground focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={
              !formData.name || !formData.ig_username || !formData.area || isSubmitting
            }
            className="w-full py-3.5 bg-foreground text-background rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed mt-4"
          >
            {isSubmitting ? "提交中..." : "提交情報"}
          </button>
        </div>
      </div>

      {/* Duplicate Store Toast Notification */}
      {duplicateToast.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="relative bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-secondary flex items-center justify-center">
              <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium mb-1">此店家已被建立！</p>
            <p className="text-xs text-muted-foreground">
              系統已為您自動跳轉至該店的「情報補充頁」。
            </p>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        contextMessage="為確保情報真實性，請先登入後提交（系統仍會為您保持完全匿名）。"
      />
    </div>
  );
}
