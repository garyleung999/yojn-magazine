"use client";

import { useState } from "react";
import { X, Copy, Check, Mail, MessageCircle } from "lucide-react";

/* ========================================
   Merchant Claim Modal
======================================== */

interface MerchantClaimModalProps {
  storeId: string;
  storeName: string;
  onClose: () => void;
}

export default function MerchantClaimModal({
  storeId,
  storeName,
  onClose,
}: MerchantClaimModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(storeId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = storeId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 hover:bg-secondary rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
          <svg
            className="w-6 h-6 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-center mb-2">
          店家官方認領功能籌備中！
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground text-center leading-relaxed mb-4">
          親愛的 {storeName} 店長您好，
          <br />
          店家官方認領功能正在開發中，敬請期待！
          <br />
          請透過以下管道聯繫我們，我們將優先為您處理。
        </p>

        {/* Contact Methods */}
        <div className="space-y-2 mb-4">
          <a
            href="#"
            className="flex items-center gap-2 px-3 py-2.5 border border-border rounded-xl hover:bg-secondary transition-colors text-xs"
          >
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">LINE 官方帳號</span>
            <span className="ml-auto text-muted-foreground">建立中</span>
          </a>
          <a
            href="mailto:merchant@yojn.tw"
            className="flex items-center gap-2 px-3 py-2.5 border border-border rounded-xl hover:bg-secondary transition-colors text-xs"
          >
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">Email 聯繫</span>
            <span className="ml-auto text-muted-foreground">yojnnail@gmail.com</span>
          </a>
        </div>

        {/* Store ID Copy */}
        <div className="bg-secondary/50 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground mb-1.5">
            您的店家 ID（提供給客服以加速處理）
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[10px] font-mono bg-card border border-border rounded-lg px-2 py-1.5 truncate">
              {storeId}
            </code>
            <button
              onClick={handleCopyId}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] border border-border rounded-lg hover:bg-card transition-colors text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-green-500" />
                  已複製
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  複製
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
