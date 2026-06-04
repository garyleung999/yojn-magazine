"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { X, Loader2, MessageSquare } from "lucide-react";

/* ========================================
   Minimalist User Feedback Box
   讀者意見回饋箱
======================================== */

export default function FeedbackBox() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean }>({ visible: false });

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("feedbacks").insert({
        content: content.trim(),
        user_id: user?.id,
      });
      if (error) throw error;
      setContent("");
      setContact("");
      setIsOpen(false);
      // Show success toast
      setToast({ visible: true });
      setTimeout(() => setToast({ visible: false }), 3500);
    } catch (err: any) {
      console.error("Error submitting feedback:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
        aria-label="意見回饋"
      >
        <MessageSquare className="w-4 h-4" />
      </button>

      {/* Slide-out Drawer / Popover */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Card */}
          <div className="relative bg-card border border-border rounded-2xl p-5 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium">讀者意見回饋箱</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  您的每一則反饋，都是照妖鏡進化的養分。
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Textarea */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="請告訴我們您的想法、建議或遇到的問題..."
              rows={4}
              className="w-full py-2.5 px-3 text-sm bg-secondary/50 border border-border rounded-xl focus:border-foreground focus:outline-none transition-colors resize-none placeholder:text-muted-foreground/50"
            />

            {/* Contact Input (Optional) */}
            <div className="mt-3">
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Email 或 LINE ID（選填，方便我們向您回報進度）"
                className="w-full py-2.5 px-3 text-sm bg-secondary/50 border border-border rounded-xl focus:border-foreground focus:outline-none transition-colors placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="w-full mt-4 py-2.5 bg-foreground text-background rounded-xl text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  提交中...
                </>
              ) : (
                "提交反饋"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Custom Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-foreground text-background px-5 py-3 rounded-2xl shadow-2xl text-xs font-medium text-center max-w-xs">
            感謝您的提議！照妖鏡因您的反饋而更完整。
          </div>
        </div>
      )}
    </>
  );
}
