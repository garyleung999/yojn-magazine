"use client";

import { useAuth } from "@/context/AuthContext";
import { X } from "lucide-react";
import { useState } from "react";

/**
 * A yellow warning banner displayed at the top of the page when
 * authentication initialization fails (e.g. expired tokens, network error).
 *
 * The banner is dismissible — once closed, it won't reappear until
 * the error state changes.
 */
export function AuthErrorBanner() {
  const { error } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Don't render if there's no error, or if the user dismissed it
  if (!error || dismissed) return null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2 text-sm text-amber-800">
        {/* Warning Icon */}
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <span>{error}</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-1 rounded-full hover:bg-amber-100 transition-colors"
        aria-label="關閉提示"
      >
        <X className="w-4 h-4 text-amber-600" />
      </button>
    </div>
  );
}
