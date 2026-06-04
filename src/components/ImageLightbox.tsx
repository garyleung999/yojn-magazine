"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

/* ========================================
   IMAGE LIGHTBOX
   Full-screen image viewer with keyboard
   navigation and swipe support.
======================================== */

interface ImageLightboxProps {
  images: {
    url: string;
    source: string;
    id?: string;
    userId?: string;
  }[];
  initialIndex: number;
  onClose: () => void;
  currentUserId?: string;
  onDelete?: (index: number) => void;
}

export default function ImageLightbox({
  images,
  initialIndex,
  onClose,
  currentUserId,
  onDelete,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goToPrev, goToNext]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (images.length === 0) return null;

  const current = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={(e) => {
        // Close when clicking the backdrop (not the image or buttons)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
        aria-label="關閉"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Image counter */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-black/40 text-white text-xs">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Delete button — only visible when currentUserId matches image userId */}
      {currentUserId && current.userId && currentUserId === current.userId && onDelete && (
        <button
          onClick={() => onDelete(currentIndex)}
          className="absolute top-4 right-14 z-10 p-2 rounded-full bg-red-500/70 text-white hover:bg-red-600 transition-colors"
          aria-label="刪除圖片"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}

      {/* Source label */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-black/40 text-white text-xs">
        {current.source}
      </div>

      {/* Previous button */}
      {images.length > 1 && (
        <button
          onClick={goToPrev}
          className="absolute left-2 md:left-4 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          aria-label="上一張"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Image */}
      <div className="flex items-center justify-center max-w-[90vw] max-h-[90vh]">
        <img
          src={current.url}
          alt={`Gallery ${currentIndex}`}
          className="max-w-full max-h-[90vh] object-contain rounded-lg select-none"
          draggable={false}
        />
      </div>

      {/* Next button */}
      {images.length > 1 && (
        <button
          onClick={goToNext}
          className="absolute right-2 md:right-4 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          aria-label="下一張"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}
    </div>
  );
}
