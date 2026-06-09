"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth, type AuthProviderType } from "@/context/AuthContext";
import { X } from "lucide-react";

/* ========================================
   AUTH MODAL — Japanese Magazine Aesthetic
======================================== */

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional context message shown above the form */
  contextMessage?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  contextMessage,
}: AuthModalProps) {
  const { loginWithProvider, loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showLineNotice, setShowLineNotice] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("請輸入 Email 與密碼");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await loginWithEmail(email, password);
      onClose();
    } catch {
      setError("登入失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProviderLogin = async (provider: AuthProviderType) => {
    setError("");
    setIsSubmitting(true);
    try {
      await loginWithProvider(provider);
      onClose();
    } catch {
      setError("第三方登入失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
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
      <div className="relative w-full max-w-sm bg-[#FBF9F6] border border-[#EAEAEA] shadow-xl">
        {/* LINE Notice Overlay */}
        {showLineNotice && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FBF9F6]/95 z-10">
            <div className="text-center p-6">
              <div className="text-4xl mb-3">🛠️</div>
              <p className="text-sm font-medium text-[#2B2B2B] mb-2">
                LINE 登入功能正在開發中
              </p>
              <p className="text-xs text-[#6B6B6B] mb-4">
                敬請期待後續更新
              </p>
              <button
                onClick={() => setShowLineNotice(false)}
                className="px-4 py-1.5 text-xs bg-[#2B2B2B] text-[#FBF9F6] rounded-full hover:opacity-80 transition-opacity"
              >
                關閉
              </button>
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-[#6B6B6B] hover:text-[#2B2B2B] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-8 py-10">
          {/* Editorial Header */}
          <div className="text-center mb-8">
            <h2 className="font-serif text-lg tracking-tight text-[#2B2B2B] mb-1">
              YOJN Mégazine
            </h2>
            <p className="text-[10px] text-[#6B6B6B] tracking-widest uppercase">
              讀者登入
            </p>
          </div>

          {/* Context Message */}
          {contextMessage && (
            <p className="text-xs text-[#6B6B6B] text-center mb-6 leading-relaxed">
              {contextMessage}
            </p>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-[#D4A5A5] text-center mb-4">{error}</p>
          )}

          {/* Email / Password Form */}
          <div className="space-y-4 mb-6">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full py-2.5 px-0 text-sm bg-transparent border-b border-[#EAEAEA] focus:border-[#2B2B2B] focus:outline-none transition-colors placeholder:text-[#9B9B9B]"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密碼"
                className="w-full py-2.5 px-0 text-sm bg-transparent border-b border-[#EAEAEA] focus:border-[#2B2B2B] focus:outline-none transition-colors placeholder:text-[#9B9B9B]"
              />
            </div>
            <button
              onClick={handleEmailLogin}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#2B2B2B] text-[#FBF9F6] text-sm font-medium tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {isSubmitting ? "登入中…" : "登入"}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <span className="flex-1 h-px bg-[#EAEAEA]" />
            <span className="text-[10px] text-[#6B6B6B] tracking-widest">
              OR
            </span>
            <span className="flex-1 h-px bg-[#EAEAEA]" />
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            {/* LINE Login */}
            <button
              onClick={() => setShowLineNotice(true)}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-[#EAEAEA] bg-transparent hover:bg-[#F5F3F0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {/* LINE Icon */}
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 flex-shrink-0"
                fill="#06C755"
              >
                <path d="M12 2C6.48 2 2 5.85 2 10.6c0 3.08 1.83 5.78 4.62 7.36-.2.74-.7 2.64-.8 3.04-.12.5.18.5.38.37.14-.09 2.26-1.48 3.14-2.06.86.24 1.78.37 2.66.37 5.52 0 10-3.85 10-8.6S17.52 2 12 2zm-1.2 11.2H8.4V9.6h.8v2.8h1.6v.8zm2.4 0h-.8v-3.2h.8v3.2zm2.8 0h-.8V9.6h.8v3.6zm1.6-4h-.8V7.6h.8v1.6z" />
              </svg>
              <span className="text-xs text-[#2B2B2B] tracking-wide">
                使用 LINE 一鍵連動
              </span>
            </button>

            {/* Google Login */}
            <button
              onClick={() => handleProviderLogin("google")}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-[#EAEAEA] bg-transparent hover:bg-[#F5F3F0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {/* Google Icon */}
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 flex-shrink-0"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-xs text-[#2B2B2B] tracking-wide">
                使用 Google 帳號登入
              </span>
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-[9px] text-[#9B9B9B] text-center mt-6 leading-relaxed">
            登入即表示同意服務條款與隱私權政策。
            <br />
            您的身分將保持完全匿名。
          </p>
        </div>
      </div>
    </div>
  );
}
