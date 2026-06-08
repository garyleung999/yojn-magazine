"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Store, Review, PriceMenuItem } from "@/data/mockData";
import { warningKeywords, reviewTags, serviceReviewTags } from "@/data/mockData";

import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import NailPriceMenu from "@/components/NailPriceMenu";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import MerchantClaimModal from "@/components/MerchantClaimModal";
import {
  Clock,
  Check,
  Bookmark,
  ArrowLeft,
  ArrowUpRight,
  Share2,
  MapPin,
  MoreHorizontal,
  ChevronRight,
  Plus,
  ThumbsUp,
  Camera,
  Image,
  X,
  Loader2,
  ShieldCheck,
  Store as StoreIcon,
  Pencil,
} from "lucide-react";
import ImageLightbox from "@/components/ImageLightbox";
import ImageUploadModal from "@/components/ImageUploadModal";
import StoreEditModal from "@/components/StoreEditModal";

/* ========================================
   Helper: Format price display
======================================== */

function formatPrice(price: number | undefined | null): string {
  if (price === undefined || price === null) return "";
  return `$${price.toLocaleString()}`;
}

/* ========================================
   SALON CARD - Featured View (Default)
======================================== */

interface SalonCardProps {
  store: Store;
  onClick: () => void;
  onParentSalonClick?: (parentIg: string) => void;
}

export function SalonCard({ store, onClick, onParentSalonClick }: SalonCardProps) {
  const initial = store.name.charAt(0);
  const hasImages = store.image_urls && store.image_urls.length > 0;

  return (
    <article
      onClick={onClick}
      className="group cursor-pointer bg-card border border-border rounded-xl overflow-hidden active:scale-[0.98] transition-transform h-full flex flex-col"
    >
      {hasImages && (
        <div className="aspect-[16/10] bg-secondary relative overflow-hidden flex-shrink-0">
          <img
            src={store.image_urls![0]}
            alt={store.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              console.error('SalonCard image load error:', el.src);
              el.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='1.5'%3E%3Cpath d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E";
              el.classList.add("p-4", "object-contain");
            }}
            onLoad={() => console.log('SalonCard image loaded:', store.image_urls![0])}
          />
          <div className="absolute top-2 left-2 bg-card/95 backdrop-blur-sm px-1.5 py-2 rounded text-xs">
            <span className="writing-mode-vertical">{store.area}</span>
          </div>
        </div>
      )}

      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-serif text-lg sm:text-xl font-semibold">{store.name}</h3>
          <Bookmark className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>

        {store.parent_salon_ig && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onParentSalonClick?.(store.parent_salon_ig!);
            }}
            className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors text-left mb-1.5"
          >
            🔗 @{store.parent_salon_ig}
          </button>
        )}

        {/* 動態核心標籤（取代手寫副標） */}
        {store.top_tags && store.top_tags.length > 0 ? (
          <div className="flex items-center gap-2 mb-2 text-sm">
            {store.top_tags.map((tag, idx) => (
              <span key={tag} className="inline-flex items-center gap-1">
                <span className="text-muted-foreground/80 font-light">👑 {tag}</span>
                {idx < (store.top_tags?.length ?? 0) - 1 && <span className="text-border">·</span>}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/50 mb-2">尚無讀者認證特色</p>
        )}

        {store.manicurists && store.manicurists.length > 0 && (
          <p className="text-xs text-muted-foreground/70 mb-2">
            🔍 認證職人: {store.manicurists.join(", ")}
          </p>
        )}

        {/* Bottom info: 投票 + IG 連結 + 價格人數 */}
        <div className="flex flex-col gap-2 pt-2 border-t border-border mt-auto">
          {/* 第一行：投票數，三個膠囊始終顯示 */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>👍寶藏推推 {store.vote_skill ?? 0}</span>
            <span>🤍氛圍絕美 {store.vote_aesthetic ?? 0}</span>
            <span>🧘服務優質 {store.vote_service ?? 0}</span>
          </div>

          {/* 第二行：IG 連結 + 價格人數 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
            <a
              href={`https://instagram.com/${store.ig_username}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:text-foreground transition-colors truncate max-w-[140px]"
            >
              @{store.ig_username}
            </a>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="font-serif">💰 NT${store.single_color_price != null ? store.single_color_price.toLocaleString() : '-'}</span>
              <span className="text-border">·</span>
              <span>🐾{store.visit_count ?? 0}人來過</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ========================================
   SALON CARD - LIST VIEW
======================================== */

export function SalonCardList({ store, onClick, onParentSalonClick }: SalonCardProps) {
  return (
    <article
      onClick={onClick}
      className="cursor-pointer border-b border-[#EAEAEA] py-3 hover:bg-secondary/30 active:bg-secondary/50 transition-colors"
    >
      <div className="flex flex-col gap-1">
        {/* 第一行：店名 + 區域 */}
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-sm font-semibold">{store.name}</h3>
          <span className="text-xs text-muted-foreground flex-shrink-0 px-2 py-0.5 bg-secondary rounded">
            {store.area}
          </span>
        </div>

        {/* 核心標籤（動態） */}
        {store.top_tags && store.top_tags.length > 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
            {store.top_tags.map((tag, idx) => (
              <span key={tag} className="inline-flex items-center gap-0.5">
                <span>👑 {tag}</span>
                {idx < (store.top_tags?.length ?? 0) - 1 && <span className="text-border">·</span>}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/50">尚無讀者認證特色</p>
        )}

        {store.parent_salon_ig && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onParentSalonClick?.(store.parent_salon_ig!);
            }}
            className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors text-left"
          >
            🔗 @{store.parent_salon_ig}
          </button>
        )}

        {store.manicurists && store.manicurists.length > 0 && (
          <p className="text-xs text-muted-foreground/60">
            🔍 認證職人: {store.manicurists.join(", ")}
          </p>
        )}

        {/* 投票行：三個膠囊始終顯示 */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span>👍寶藏推推 {store.vote_skill ?? 0}</span>
          <span>🤍氛圍絕美 {store.vote_aesthetic ?? 0}</span>
          <span>🧘服務優質 {store.vote_service ?? 0}</span>
        </div>

        {/* 底部：IG 連結 + 價格人數 */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <a
            href={`https://instagram.com/${store.ig_username}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hover:text-foreground transition-colors truncate max-w-[140px]"
          >
            @{store.ig_username}
          </a>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="font-serif">💰 NT${store.single_color_price != null ? store.single_color_price.toLocaleString() : '-'}</span>
            <span className="text-border">·</span>
            <span>🐾{store.visit_count ?? 0}人來過</span>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ========================================
   SALON CARD - GRID VIEW
======================================== */

export function SalonCardGrid({ store, onClick, onParentSalonClick }: SalonCardProps) {
  const initial = store.name.charAt(0);
  const hasImages = store.image_urls && store.image_urls.length > 0;

  return (
    <article
      onClick={onClick}
      className="cursor-pointer bg-card border border-border rounded-lg overflow-hidden active:scale-[0.97] transition-transform h-full flex flex-col"
    >
      {hasImages && (
        <div className="aspect-square bg-secondary relative overflow-hidden flex-shrink-0">
          <img
            src={store.image_urls![0]}
            alt={store.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              console.error('SalonCardGrid image load error:', el.src);
              el.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='1.5'%3E%3Cpath d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E";
              el.classList.add("p-4", "object-contain");
            }}
            onLoad={() => console.log('SalonCardGrid image loaded:', store.image_urls![0])}
          />
          <div className="absolute top-1.5 left-1.5 bg-card/90 backdrop-blur-sm px-1 py-0.5 rounded text-xs">
            {store.area}
          </div>
        </div>
      )}
      <div className="p-2 flex flex-col flex-1">
        <h3 className="font-serif text-xs mb-0.5 truncate">{store.name}</h3>
        {store.parent_salon_ig && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onParentSalonClick?.(store.parent_salon_ig!);
            }}
            className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors text-left mb-0.5"
          >
            🔗 @{store.parent_salon_ig}
          </button>
        )}

        {/* 核心標籤（簡短形式） */}
        {store.top_tags && store.top_tags.length > 0 && (
          <p className="text-xs text-muted-foreground/80 truncate mb-1.5">
            {store.top_tags.map((tag, idx) => (
              <span key={tag} className="inline-flex items-center gap-0.5">
                <span>👑{tag}</span>
                {idx < (store.top_tags?.length ?? 0) - 1 && <span className="text-border mx-0.5">·</span>}
              </span>
            ))}
          </p>
        )}

        {store.manicurists && store.manicurists.length > 0 && (
          <p className="text-xs text-muted-foreground/60 truncate mb-1">
            🔍 {store.manicurists.join(", ")}
          </p>
        )}
        {/* Bottom info: 投票 + IG 連結 + 價格人數 */}
        <div className="flex flex-col gap-1.5 pt-1.5 border-t border-border mt-auto">
          {/* 第一行：投票數，三個始終顯示 */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>👍 {store.vote_skill ?? 0}</span>
            <span>🤍 {store.vote_aesthetic ?? 0}</span>
            <span>🧘 {store.vote_service ?? 0}</span>
          </div>

          {/* 第二行：IG 連結 + 價格人數 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <a
              href={`https://instagram.com/${store.ig_username}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:text-foreground transition-colors truncate max-w-[100px]"
            >
              @{store.ig_username}
            </a>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="font-serif">💰${store.single_color_price != null ? store.single_color_price.toLocaleString() : '-'}</span>
              <span className="text-border">·</span>
              <span>🐾{store.visit_count ?? 0}人</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ========================================
   Helper: Format review date
======================================== */

const formatReviewDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
};

/* ========================================
   REVIEW CARD
======================================== */

interface ReviewCardProps {
  review: Review;
  onDelete?: (reviewId: string) => void;
  onEdit?: (updatedReview: Review) => void;
  onReply?: (parentId: string) => void;
  replies?: Review[];
  parentReview?: Review | null;
}

export function ReviewCard({ review, onDelete, onEdit, onReply, replies, parentReview }: ReviewCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Use string comparison to handle potential type mismatches (UUID vs string)
  // If review.user_id is empty (legacy reviews), treat current user as author
  const isAuthor = user && (!review.user_id || String(user.id) === String(review.user_id));

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleDelete = async () => {
    setIsDeleting(false);
    if (!isAuthor) return;
    if (onDelete) onDelete(review.id);
  };

  const getTagStyle = (tag: string) => {
    const isWarning = warningKeywords.some((keyword) => tag.includes(keyword));
    return isWarning
      ? "bg-secondary text-muted-foreground"
      : "bg-secondary text-foreground";
  };

  // Determine if this review should be dimmed due to reports
  const isDimmed = (review.report_count ?? 0) > 5;

  // Edit mode: render inline edit form
  if (isEditing) {
    return (
      <EditReviewForm
        review={review}
        onClose={() => setIsEditing(false)}
        onSave={(updatedReview) => {
          if (onEdit) onEdit(updatedReview);
          setIsEditing(false);
        }}
      />
    );
  }

  return (
    <article className={`p-3 bg-card border rounded-xl ${review.has_proof ? 'border-green-200 border-l-2 border-l-green-400' : 'border-border'} ${isDimmed ? 'opacity-40 pointer-events-none' : ''}`}>
      {/* Dimmed overlay message */}
      {isDimmed && (
        <div className="mb-2 text-center">
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">此情報爭議較大，已由社群降權處理</span>
        </div>
      )}

      {/* Parent reference (for replies) */}
      {review.parent_id && parentReview && (
        <div className="mb-2 pl-3 border-l-2 border-border/50">
          <p className="text-xs text-muted-foreground/60">
            <span className="font-medium">回覆給 @{parentReview.nickname}</span>
            <span className="ml-1">: {parentReview.comment.slice(0, 40)}{parentReview.comment.length > 40 ? '...' : ''}</span>
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C9.38 2 7.25 4.13 7.25 6.75c0 2.57 2.01 4.65 4.63 4.74.08-.01.16-.01.22 0h.07a4.738 4.738 0 004.58-4.74C16.75 4.13 14.62 2 12 2z" />
              <path d="M17.08 14.15c-2.79-1.86-7.34-1.86-10.15 0-1.27.84-1.97 1.98-1.97 3.2s.7 2.35 1.96 3.18c1.4.94 3.24 1.41 5.08 1.41 1.84 0 3.68-.47 5.08-1.41 1.26-.84 1.96-1.97 1.96-3.19s-.71-2.35-1.96-3.19z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium">{review.nickname}</span>
              {/* Credibility badge */}
              {review.has_proof ? (
                <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">📸 精確情報</span>
              ) : (
                <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">💬 路透線報</span>
              )}
              <span className="text-xs text-muted-foreground">
                · {formatReviewDate(review.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground/70 mt-0.5">
              {review.manicurist_name && <span>💅 {review.manicurist_name}</span>}
              {review.actual_price !== undefined && <span>💰 {formatPrice(review.actual_price)}</span>}
            </div>
          </div>
        </div>

        {/* Three-dot menu — only visible to the review author */}
        {isAuthor && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('toggle menu', !showMenu);
                setShowMenu((prev) => !prev);
              }}
              className="p-1 hover:bg-secondary rounded-full"
            >
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-24 bg-card border border-border rounded-lg shadow-lg z-20 py-1 text-xs">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-secondary transition-colors"
                >
                  編輯
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsDeleting(true); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-destructive/10 text-destructive transition-colors"
                >
                  刪除
                </button>
              </div>
            )}
          </div>
        )}
        {/* Show inert icon for non-authors */}
        {!isAuthor && (
          <MoreHorizontal className="w-4 h-4 text-muted-foreground opacity-30" />
        )}
      </div>

      {/* Structured feedback tags */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {review.retention_feedback && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{review.retention_feedback}</span>
        )}
        {review.price_transparency && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${review.price_transparency === '隱形消費' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {review.price_transparency === '隱形消費' ? '❌ 隱形消費' : '💰 價格一致'}
          </span>
        )}
        {review.env_tags?.map(tag => (
          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-secondary">🔹 {tag}</span>
        ))}
        {review.actual_duration && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">⏱️ {review.actual_duration} 小時</span>
        )}
      </div>

      {review.comment && (
        <p className="text-xs leading-relaxed mb-2">{review.comment}</p>
      )}

      {review.image_urls && review.image_urls.length > 0 && (
        <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-hide">
          {review.image_urls.map((url, idx) => (
            <div key={idx} className="w-16 h-16 rounded-lg bg-secondary flex-shrink-0 overflow-hidden border border-border">
              <img
                src={url}
                alt={`Review photo ${idx}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Service experience tags */}
      {review.service_tags && review.service_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {review.service_tags.map(tag => {
            const isWarning = reviewTags.warning.includes(tag);
            return (
              <span
                key={tag}
                className={`px-2 py-0.5 text-xs rounded-full border ${
                  isWarning
                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                    : 'bg-green-50 text-green-700 border-green-200'
                }`}
              >
                {isWarning ? '⚠️ ' : '✅ '}{tag}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {review.tags.map((tag) => (
          <span key={tag} className={`px-2 py-0.5 text-xs rounded-full border border-border ${getTagStyle(tag)}`}>
            #{tag}
          </span>
        ))}
      </div>


      {/* Reply button */}
      {onReply && !review.parent_id && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <button
            onClick={(e) => { e.stopPropagation(); onReply(review.id); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            回覆
          </button>
        </div>
      )}

      {/* Child replies */}
      {replies && replies.length > 0 && (
        <div className="mt-2 space-y-2 pl-4 border-l-2 border-border/30">
          {replies.map((reply) => (
            <ReviewCard
              key={reply.id}
              review={reply}
              onDelete={onDelete}
              onEdit={onEdit}
              parentReview={review}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-4 shadow-lg max-w-xs w-full text-center">
            <p className="text-sm mb-3">確定要刪除此評論嗎？</p>
            <div className="flex justify-center gap-2">
              <button onClick={() => setIsDeleting(false)} className="px-4 py-1.5 text-xs border border-border rounded-full">取消</button>
              <button onClick={handleDelete} className="px-4 py-1.5 text-xs bg-destructive text-white rounded-full">刪除</button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

/* ========================================
   TAG VOTING POPOVER
======================================== */

interface TagVotingPopoverProps {
  storeId: string;
  existingTags: [string, number][];
  onClose: () => void;
  onTagUpdated: () => void;
}

function TagVotingPopover({ storeId, existingTags, onClose, onTagUpdated }: TagVotingPopoverProps) {
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleUpvote = async (tag: string) => {
    if (!user) return;
    setIsSubmitting(true);
    setError("");
    try {
      const { error: voteError } = await supabase.from("tag_votes").insert({
        store_id: storeId,
        user_id: user.id,
        tag_name: tag,
      });
      if (voteError) {
        if (voteError.code === "23505") {
          setError("您已對此標籤投過票");
        } else {
          throw voteError;
        }
      } else {
        onTagUpdated();
      }
    } catch (err: any) {
      console.error("Error upvoting tag:", err);
      setError(err?.message || "投票失敗");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitNewTag = async () => {
    const trimmed = newTag.trim();
    if (!trimmed || !user) return;
    setIsSubmitting(true);
    setError("");
    try {
      const { error: voteError } = await supabase.from("tag_votes").insert({
        store_id: storeId,
        user_id: user.id,
        tag_name: trimmed,
      });
      if (voteError) {
        if (voteError.code === "23505") {
          setError("您已提交過此標籤");
        } else {
          throw voteError;
        }
      } else {
        setNewTag("");
        onTagUpdated();
      }
    } catch (err: any) {
      console.error("Error submitting new tag:", JSON.stringify(err));
      setError(err?.message || "提交失敗");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl p-5 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">補充特徵標籤</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {existingTags.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">現有標籤（點擊 👍 投票）</p>
            <div className="flex flex-wrap gap-1.5">
              {existingTags.map(([tag, count]) => (
                <button
                  key={tag}
                  onClick={() => handleUpvote(tag)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-secondary border border-border rounded-full hover:bg-foreground hover:text-background transition-all disabled:opacity-40"
                >
                  {tag} ({count})
                  <ThumbsUp className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs text-muted-foreground mb-2">新增標籤</p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmitNewTag(); }}
              placeholder="輸入新標籤..."
              className="flex-1 py-2 px-3 text-sm bg-transparent border border-border rounded-lg focus:border-foreground focus:outline-none transition-colors"
            />
            <button
              onClick={handleSubmitNewTag}
              disabled={!newTag.trim() || isSubmitting}
              className="px-3 py-2 bg-foreground text-background rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
}

/* ========================================
   VOTE CHIP — Pill-style 3D Vibe Voting
======================================== */

interface VoteChipProps {
  emoji: string;
  label: string;
  count: number;
  isVoted: boolean;
  onVote: () => void;
  onAuthRequired: () => void;
  isAuthenticated: boolean;
}

function VoteChipPill({ emoji, label, count, isVoted, onVote, onAuthRequired, isAuthenticated }: VoteChipProps) {
  const handleClick = () => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    onVote();
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-all ${
        isVoted
          ? "bg-foreground text-background border-foreground"
          : "bg-card text-foreground border-border hover:bg-secondary opacity-70"
      }`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
      <span className="font-serif text-xs">{count}</span>
    </button>
  );
}

/* ========================================
   AddTagInput — Custom tag input component
======================================== */

const AddTagInput = ({ onAdd, isAuthenticated, onAuthRequired }: { onAdd: (tag: string) => Promise<void>; isAuthenticated: boolean; onAuthRequired: () => void }) => {
  const [input, setInput] = useState("");
  const [show, setShow] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!input.trim()) return;
    if (!isAuthenticated) { onAuthRequired(); return; }
    await onAdd(input.trim());
    setInput("");
    setShow(false);
  };

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="w-full text-xs text-muted-foreground border border-dashed border-border rounded-full px-3 py-1.5 hover:border-foreground hover:text-foreground transition-colors mb-3">
        ＋ 新增認證標籤
      </button>
    );
  }
  return (
    <div className="flex gap-1.5 mb-3">
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="輸入技術或服務名稱..."
        className="flex-1 py-1 px-2 text-xs bg-transparent border border-border rounded-lg focus:border-foreground focus:outline-none"
        autoFocus
      />
      <button onClick={handleSubmit} disabled={!input.trim()} className="px-2 py-1 text-xs bg-foreground text-background rounded-full disabled:opacity-40">新增</button>
      <button onClick={() => setShow(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
    </div>
  );
};

/* ========================================
   CustomTagsSection — Shows custom tags not in predefined groups
======================================== */

const CustomTagsSection = ({ allPredefinedTags, tagVotes, toggleTagVote }: { allPredefinedTags: string[]; tagVotes: Record<string, { count: number; isVoted: boolean }>; toggleTagVote: (tag: string) => Promise<void> }) => {
  const customTags = Object.keys(tagVotes).filter(tag => !allPredefinedTags.includes(tag));
  if (customTags.length === 0) return null;
  return (
    <div className="mb-2">
      <p className="text-xs text-muted-foreground/80 mb-1">其他認證標籤</p>
      <div className="flex flex-wrap gap-1.5">
        {customTags.map(tag => {
          const data = tagVotes[tag] || { count: 0, isVoted: false };
          const hasVotes = data.count > 0;
          return (
            <button
              key={tag}
              onClick={() => toggleTagVote(tag)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border transition-all active:scale-95 ${hasVotes ? "bg-foreground/10 border-foreground/30 text-foreground" : "bg-card border-border text-muted-foreground/60 hover:border-muted-foreground"} ${data.isVoted ? "ring-1 ring-foreground/20" : ""}`}
            >
              <span className={hasVotes ? "" : "opacity-50"}>{hasVotes ? "✨" : "✍️"}</span>
              <span>{tag}</span>
              <span className="font-serif text-xs ml-0.5">{data.count}</span>
              {data.isVoted && <span className="text-xs ml-0.5">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ========================================
   DETAIL VIEW — Refactored 2.0
======================================== */

interface DetailViewProps {
  store: Store;
  reviews: Review[];
  onBack: () => void;
  onInstagramClick: (username: string) => void;
  onAddReview: (review: Review) => void;
  onStoreUpdate?: (store: Store) => void;
}

export function DetailView({
  store,
  reviews,
  onBack,
  onInstagramClick,
  onAddReview,
  onStoreUpdate,
}: DetailViewProps) {
  const initial = store.name.charAt(0);

  /* ========================================
     Tag Groups — Reader Certification
  ======================================== */
  const TAG_GROUPS = [
    {
      id: 'service',
      title: '觀感服務',
      categories: [
        { name: '沙龍體驗', tags: ['I人友善', 'E人天堂', '不強迫推銷', '建構不加價', '不分款'] },
      ],
    },
    {
      id: 'technique',
      title: '美甲技術',
      categories: [
        { name: '風格派系', tags: ['日系', '韓系', '歐美', '中式'] },
        { name: '基礎工藝', tags: ['法式', '貓眼', '漸變', '純色'] },
        { name: '進階工藝', tags: ['暈染', '手繪', '鏡面', '磨砂', '3D立體/浮雕', '燙金/金屬箔', '珠光/水彩'] },
        { name: '技術/材質', tags: ['甲油膠', '水晶甲', '光療延長', '丙烯彩繪', '浸粉/蘸粉', '穿戴甲', '拍拍膠'] },
        { name: '甲型設計', tags: ['橢圓形', '方圓形', '方形', '杏仁形', '梯形', '圓形', '尖形'] },
        { name: '裝飾素材', tags: ['平面', '立體', '功能性'] },
      ],
    },
  ];
  const ALL_TAGS = TAG_GROUPS.flatMap(g => g.categories.flatMap(c => c.tags));

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState("");
  const [tagVotes, setTagVotes] = useState<Record<string, { count: number; isVoted: boolean }>>({});
  const [hasVisited, setHasVisited] = useState(false);
  const [visitCount, setVisitCount] = useState(store.visit_count ?? 0);
  const [isVisiting, setIsVisiting] = useState(false);
  const [localReviews, setLocalReviews] = useState(reviews);
  // UGC 2.0: Manicurist filter + reply
  const [selectedManicurist, setSelectedManicurist] = useState<string | null>(null);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyToNickname, setReplyToNickname] = useState<string>("");
  const [showMerchantClaim, setShowMerchantClaim] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [localPriceMenu, setLocalPriceMenu] = useState<PriceMenuItem[] | undefined>(store.price_menu);
  const [localMenuUpdatedAt, setLocalMenuUpdatedAt] = useState<string | undefined>(store.menu_updated_at);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showEditStore, setShowEditStore] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => { setLocalReviews(reviews); }, [reviews]);
  useEffect(() => { setLocalPriceMenu(store.price_menu); }, [store.price_menu]);
  useEffect(() => { setLocalMenuUpdatedAt(store.menu_updated_at); }, [store.menu_updated_at]);

  const tagSummary = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    localReviews.forEach((r) => {
      r.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [localReviews]);

  const avgPrice = useMemo(() => {
    const prices = localReviews.map((r) => r.actual_price).filter((p): p is number => p !== undefined && p !== null);
    if (prices.length === 0) return store.calculated_avg_price ?? null;
    return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  }, [localReviews, store.calculated_avg_price]);

  /* ========================================
     3D Vibe Voting
  ======================================== */

  const [localStore, setLocalStore] = useState(store);
  // pendingStoreUpdate pattern: avoid calling onStoreUpdate during render
  const [pendingStoreUpdate, setPendingStoreUpdate] = useState<Store | null>(null);

  useEffect(() => { setLocalStore(store); }, [store]);

  // Deferred store update to avoid React cross-component update error
  useEffect(() => {
    if (pendingStoreUpdate && onStoreUpdate) {
      onStoreUpdate(pendingStoreUpdate);
      setPendingStoreUpdate(null);
    }
  }, [pendingStoreUpdate, onStoreUpdate]);

  // Fetch 3D vibe votes from store_votes table on mount
  const fetchVibeVotes = useCallback(async () => {
    if (!user || !store.id) return;
    const { data } = await supabase
      .from('store_votes')
      .select('vote_type')
      .eq('store_id', store.id)
      .eq('user_id', user.id);

    const votedBy = { skill: [] as string[], aesthetic: [] as string[], service: [] as string[] };
    data?.forEach(row => votedBy[row.vote_type as keyof typeof votedBy]?.push(user.id));

    setLocalStore(prev => ({
      ...prev,
      voted_by_skill: votedBy.skill,
      voted_by_aesthetic: votedBy.aesthetic,
      voted_by_service: votedBy.service,
    }));
  }, [store.id, user]);

  useEffect(() => { fetchVibeVotes(); }, [fetchVibeVotes]);

  /* ========================================
     Independent Photo Album (store_images)
  ======================================== */

  const [contributedImages, setContributedImages] = useState<{ id: string; url: string; userId: string; createdAt: string }[]>([]);

  // Build combined image list for lightbox (official first, then contributed, then review)
  const allLightboxImages = useMemo(() => {
    const items: { url: string; source: string; id?: string; userId?: string }[] = [];
    // Official images from store.image_urls
    (store.image_urls ?? []).forEach((url) => items.push({ url, source: "官方提報" }));
    // Contributed images from store_images table
    contributedImages.forEach((img) => items.push({ url: img.url, source: "讀者貢獻", id: img.id, userId: img.userId }));
    // Review images
    localReviews.forEach((r) => {
      (r.image_urls ?? []).forEach((url) => items.push({ url, source: "讀者實拍", userId: r.user_id }));
    });
    return items;
  }, [store.image_urls, localReviews, contributedImages]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("store_visits")
      .select("id")
      .eq("store_id", store.id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          if (error.code === "404" || error.code === "PGRST116") {
            console.warn("store_visits table not available, skipping visit check");
            return;
          }
          console.error("Error checking visit status:", error);
          return;
        }
        if (data) setHasVisited(true);
      });
  }, [user, store.id]);

  const handleBeenHere = async () => {
    if (!isAuthenticated) {
      setAuthModalMessage("登入後即可踩點打卡，記錄你來過的美甲店！");
      setShowAuthModal(true);
      return;
    }
    if (hasVisited || !user) return;
    setIsVisiting(true);
    try {
      const { error: visitError } = await supabase.from("store_visits").insert({ store_id: store.id, user_id: user.id });
      if (visitError) {
        if (visitError.code === "404" || visitError.code === "PGRST116") {
          console.warn("store_visits table not available, visit feature disabled");
          return;
        }
        throw visitError;
      }
      setHasVisited(true);
      const newCount = visitCount + 1;
      setVisitCount(newCount);
      await supabase.from("stores").update({ visit_count: newCount }).eq("id", store.id);
      setPendingStoreUpdate({ ...store, visit_count: newCount });
    } catch (err: any) {
      console.error("Error recording visit:", err);
      if (err?.code === "23505") setHasVisited(true);
    } finally {
      setIsVisiting(false);
    }
  };

  const handleAddReviewLocal = (review: Review) => {
    setLocalReviews((prev) => [review, ...prev]);
    onAddReview(review);
    // Refresh contributed images so review photos appear in hero gallery
    fetchContributedImages();
  };

  const handleDeleteReview = async (reviewId: string) => {
    // Optimistically remove from local state
    setLocalReviews((prev) => prev.filter((r) => r.id !== reviewId));
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
      if (error) {
        if (error.code === "404" || error.code === "PGRST116" || error.code === "42P01") {
          console.warn("reviews table not available, removed from local state only");
          return;
        }
        throw error;
      }
    } catch (err: any) {
      console.error("Error deleting review:", err);
      // Revert on failure
      setLocalReviews((prev) => [...prev]);
    }
  };

  const handleEditReview = (updatedReview: Review) => {
    setLocalReviews((prev) =>
      prev.map((r) => (r.id === updatedReview.id ? updatedReview : r))
    );
  };

  // Fetch contributed images from store_images table
  const fetchContributedImages = useCallback(() => {
    supabase
      .from("store_images")
      .select("id, image_url, user_id, created_at")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          if (error.code === "404" || error.code === "PGRST116" || error.code === "42P01") {
            console.warn("store_images table not available");
            return;
          }
          console.error("Error fetching store_images:", error);
          return;
        }
        if (data) {
          setContributedImages(
            data.map((row: any) => ({
              id: row.id,
              url: row.image_url,
              userId: row.user_id,
              createdAt: row.created_at,
            }))
          );
        }
      });
  }, [store.id]);

  useEffect(() => {
    fetchContributedImages();
  }, [fetchContributedImages]);

  const handleContributeDelete = async (image: { id: string; url: string; userId: string; createdAt: string }) => {
    setContributedImages((prev) => prev.filter((img) => img.id !== image.id));
    try {
      await supabase.from("store_images").delete().eq("id", image.id);
      const bucket = "yojn-images";
      const storageUrl = `https://scbdzggkxrrebbpsbruc.supabase.co/storage/v1/object/public/${bucket}/`;
      if (image.url.startsWith(storageUrl)) {
        const filePath = image.url.replace(storageUrl, "");
        await supabase.storage.from(bucket).remove([filePath]);
      }
    } catch (err: any) {
      console.error("Error deleting contributed image:", err);
      setContributedImages((prev) => [...prev, image]);
    }
  };

  const handleLightboxDelete = async (index: number) => {
    const image = allLightboxImages[index];
    if (!image || !user) return;

    if (image.source === "讀者貢獻" && image.id) {
      // Delete from store_images table
      await supabase.from("store_images").delete().eq("id", image.id);
      // Delete from Storage
      const bucket = "yojn-images";
      const storageUrl = `https://scbdzggkxrrebbpsbruc.supabase.co/storage/v1/object/public/${bucket}/`;
      if (image.url.startsWith(storageUrl)) {
        const filePath = image.url.replace(storageUrl, "");
        await supabase.storage.from(bucket).remove([filePath]);
      }
      // Update contributedImages state
      setContributedImages((prev) => prev.filter((img) => img.id !== image.id));
      // Close lightbox
      setLightboxOpen(false);
    } else if (image.source === "讀者實拍" && image.userId === user.id) {
      // For review images, guide user to use edit review
      alert("此圖片來自您的評論，請透過編輯評論來刪除。");
    }
  };

  const handleVote = async (voteType: "skill" | "aesthetic" | "service") => {
    if (!isAuthenticated) {
      setAuthModalMessage("登入後即可參與投票");
      setShowAuthModal(true);
      return;
    }
    if (!user) return;

    const voteColumnMap = {
      skill: "vote_skill",
      aesthetic: "vote_aesthetic",
      service: "vote_service",
    } as const;

    const column = voteColumnMap[voteType];
    const votedByKey = `voted_by_${voteType}` as keyof Store;

    const alreadyVoted = (localStore[votedByKey] as string[] | undefined)?.includes(user.id);

    // 计算更新后的值
    const currentCount = (localStore[column] as number) ?? 0;
    const currentVotedBy = (localStore[votedByKey] as string[]) ?? [];
    let newCount: number;
    let newVotedBy: string[];

    if (alreadyVoted) {
      newCount = currentCount - 1;
      newVotedBy = currentVotedBy.filter(id => id !== user.id);
    } else {
      newCount = currentCount + 1;
      newVotedBy = [...currentVotedBy, user.id];
    }

    try {
      if (alreadyVoted) {
        const { error: delError } = await supabase
          .from("store_votes")
          .delete()
          .eq("store_id", store.id)
          .eq("user_id", user.id)
          .eq("vote_type", voteType);
        if (delError) throw delError;
      } else {
        const { error: insError } = await supabase
          .from("store_votes")
          .insert({ store_id: store.id, user_id: user.id, vote_type: voteType });
        if (insError) throw insError;
      }

      // 同步更新 stores 表的计数字段和 voted_by 数组
      const { error: storeError } = await supabase
        .from("stores")
        .update({
          [column]: newCount,
          [votedByKey]: newVotedBy,
        })
        .eq("id", store.id);
      if (storeError) throw storeError;

      // 更新本地状态（确保与数据库一致）
      setLocalStore(prev => ({
        ...prev,
        [column]: newCount,
        [votedByKey]: newVotedBy,
      }));
      setPendingStoreUpdate({ ...localStore, [column]: newCount, [votedByKey]: newVotedBy });
    } catch (err: any) {
      console.error("Error toggling vote:", err);
      // 回滚乐观更新
      setLocalStore(prev => ({
        ...prev,
        [column]: currentCount,
        [votedByKey]: currentVotedBy,
      }));
    }
  };

  /* ========================================
     Hero Gallery: 70/30 asymmetric grid
  ======================================== */

  // Collect all images for the hero gallery (official first, deduplicated)
  const heroImages = useMemo(() => {
    const seen = new Set<string>();
    const imgs: { url: string; isOfficial: boolean }[] = [];
    // Official images from store.image_urls
    (store.image_urls ?? []).forEach((url) => {
      if (!seen.has(url)) {
        seen.add(url);
        imgs.push({ url, isOfficial: true });
      }
    });
    // Contributed images
    contributedImages.forEach((img) => {
      if (!seen.has(img.url)) {
        seen.add(img.url);
        imgs.push({ url: img.url, isOfficial: false });
      }
    });
    return imgs;
  }, [store.image_urls, contributedImages]);

  const handleHeroClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  /* ========================================
     Top 3 Tags — Most voted by readers
  ======================================== */

  const top3Tags = useMemo(() => {
    return Object.entries(tagVotes)
      .filter(([_, data]) => data.count > 0)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 3)
      .map(([tag]) => tag);
  }, [tagVotes]);

  /* ========================================
     Tag Voting — Reader Certification Capsules
  ======================================== */

  const fetchTagVotes = useCallback(async () => {
    if (!store.id) return;
    const { data, error } = await supabase
      .from('tag_votes')
      .select('tag_name, user_id')
      .eq('store_id', store.id);

    if (error) {
      console.error('Error fetching tag votes:', error);
      return;
    }

    const votes: Record<string, { count: number; isVoted: boolean }> = {};
    ALL_TAGS.forEach(tag => {
      votes[tag] = { count: 0, isVoted: false };
    });

    data?.forEach(row => {
      if (votes[row.tag_name]) {
        votes[row.tag_name].count += 1;
        if (user && row.user_id === user.id) {
          votes[row.tag_name].isVoted = true;
        }
      }
    });

    setTagVotes(votes);
  }, [store.id, user]);

  useEffect(() => { fetchTagVotes(); }, [fetchTagVotes]);

  const toggleTagVote = async (tagName: string) => {
    if (!isAuthenticated) {
      setAuthModalMessage("登入後即可參與技術認證");
      setShowAuthModal(true);
      return;
    }
    if (!user) return;

    const isVoted = tagVotes[tagName]?.isVoted;
    // 乐观更新
    setTagVotes(prev => ({
      ...prev,
      [tagName]: {
        count: prev[tagName].count + (isVoted ? -1 : 1),
        isVoted: !isVoted,
      },
    }));

    try {
      if (isVoted) {
        await supabase
          .from('tag_votes')
          .delete()
          .eq('store_id', store.id)
          .eq('user_id', user.id)
          .eq('tag_name', tagName);
      } else {
        await supabase
          .from('tag_votes')
          .insert({
            store_id: store.id,
            user_id: user.id,
            tag_name: tagName,
          });
      }
      // 同步 stores.tags
      await syncStoreTags(store.id);
    } catch (err: any) {
      console.error('Error toggling tag vote:', err);
      // 回滚乐观更新
      setTagVotes(prev => ({
        ...prev,
        [tagName]: {
          count: prev[tagName].count + (isVoted ? 1 : -1),
          isVoted: isVoted,
        },
      }));
    }
  };

  /* ========================================
     syncStoreTags — Sync tag_votes to stores.tags
  ======================================== */

  const syncStoreTags = async (storeId: string) => {
    const { data } = await supabase
      .from('tag_votes')
      .select('tag_name')
      .eq('store_id', storeId);
    if (!data) return;
    // 去除重複並排除空值
    const tags = [...new Set(data.map(row => row.tag_name))].filter(Boolean);
    // 更新 stores 表
    await supabase.from('stores').update({ tags }).eq('id', storeId);
    // 更新本地狀態
    const updatedStore = { ...store, tags };
    setLocalStore(updatedStore);
    // 通知父頁面
    setPendingStoreUpdate(updatedStore);
  };

  /* ========================================
     handleAddCustomTag — Add a custom tag and vote for it
  ======================================== */

  const handleAddCustomTag = async (tagName: string) => {
    if (!user) return;
    // 乐观更新：先插入 tagVotes
    setTagVotes(prev => ({
      ...prev,
      [tagName]: {
        count: 1,
        isVoted: true,
      },
    }));

    try {
      await supabase
        .from('tag_votes')
        .insert({
          store_id: store.id,
          user_id: user.id,
          tag_name: tagName,
        });
      // 同步 stores.tags
      await syncStoreTags(store.id);
    } catch (err: any) {
      console.error('Error adding custom tag:', err);
      // 回滚
      setTagVotes(prev => {
        const next = { ...prev };
        delete next[tagName];
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={onBack} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
          <div className="text-center">
            <h1 className="font-serif text-base">YOJN Mégazine</h1>
            <p className="text-xs text-muted-foreground">台中 · 美業職人精選鏡</p>
          </div>
          <button className="p-1"><Share2 className="w-5 h-5" /></button>
        </div>
      </header>

      {/* ========================================
          1. Hero Gallery — 70/30 Asymmetric Grid
      ======================================== */}
      <div className="relative">
        {heroImages.length > 0 ? (
          <div className="flex h-[240px] sm:h-[320px] cursor-pointer" onClick={() => handleHeroClick(0)}>
            {/* Left 70% — main image */}
            <div className="w-[70%] h-full bg-secondary relative overflow-hidden">
              <img
                src={heroImages[0].url}
                alt={store.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='1.5'%3E%3Cpath d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E";
                  el.classList.add("p-8", "object-contain");
                }}
              />
            </div>
            {/* Right 30% — stacked thumbnails with fixed upload button */}
            <div className="w-[30%] h-full flex flex-col relative">
              {heroImages.length >= 2 && (
                /* Second image thumbnail (clickable to lightbox index 1) */
                <div
                  className="flex-1 bg-secondary relative overflow-hidden min-h-[50px]"
                  onClick={(e) => { e.stopPropagation(); handleHeroClick(1); }}
                >
                  <img
                    key={heroImages[1].url}
                    src={heroImages[1].url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      console.error('Thumbnail 2 load error:', el.src);
                      el.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='1.5'%3E%3Cpath d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E";
                      el.classList.add("p-4", "object-contain");
                    }}
                    onLoad={() => console.log('Thumbnail 2 loaded:', heroImages[1].url)}
                  />
                </div>
              )}
              {heroImages.length >= 3 && (
                /* Third image thumbnail with +N overlay if more than 3 */
                <div
                  className="flex-1 bg-secondary relative overflow-hidden border-t border-white/20 min-h-[50px]"
                  onClick={(e) => { e.stopPropagation(); handleHeroClick(2); }}
                >
                  <img
                    key={heroImages[2].url}
                    src={heroImages[2].url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      console.error('Thumbnail 3 load error:', el.src);
                      el.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='1.5'%3E%3Cpath d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E";
                      el.classList.add("p-4", "object-contain");
                    }}
                    onLoad={() => console.log('Thumbnail 3 loaded:', heroImages[2].url)}
                  />
                  {heroImages.length > 3 && (
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="text-white text-xs font-medium px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
                        +{heroImages.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {/* Fixed upload button — always visible */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowImageUpload(true); }}
                className="absolute bottom-2 right-2 w-7 h-7 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors z-10"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        ) : (
          /* Empty state: letter placeholder + upload CTA */
          <div className="h-[200px] sm:h-[260px] bg-secondary flex flex-col items-center justify-center gap-2">
            <span className="font-serif text-6xl text-muted-foreground/20">{initial}</span>
            <button
              onClick={() => setShowImageUpload(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              📷 貢獻首張照片
            </button>
          </div>
        )}
      </div>

      {/* ========================================
          Store Identity + IG Link
      ======================================== */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-serif text-lg">{store.name}</h2>
              {store.is_official && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-foreground text-background rounded-full">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  官方
                </span>
              )}
              {isAuthenticated && (
                <button onClick={() => setShowEditStore(true)} className="ml-1 p-1 hover:bg-secondary rounded-full">
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <button
              onClick={() => onInstagramClick(store.ig_username)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              @{store.ig_username}
              <ArrowUpRight className="w-3 h-3" />
            </button>
            {store.parent_salon_ig && (
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                🔗 關聯帳號: @{store.parent_salon_ig}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{store.area}</span>
          </div>
        </div>
      </div>

      {/* ========================================
          3D Vibe Voting — Pill Chips
      ======================================== */}
      <div className="px-4 pb-2">
        <div className="flex flex-wrap gap-1.5">
          <VoteChipPill
            emoji="👍"
            label="寶藏推推"
            count={localStore.vote_skill ?? 0}
            isVoted={(localStore.voted_by_skill ?? []).includes(user?.id ?? "")}
            onVote={() => handleVote("skill")}
            onAuthRequired={() => { setAuthModalMessage("登入後即可投票"); setShowAuthModal(true); }}
            isAuthenticated={isAuthenticated}
          />
          <VoteChipPill
            emoji="🤍"
            label="氛圍絕美"
            count={localStore.vote_aesthetic ?? 0}
            isVoted={(localStore.voted_by_aesthetic ?? []).includes(user?.id ?? "")}
            onVote={() => handleVote("aesthetic")}
            onAuthRequired={() => { setAuthModalMessage("登入後即可投票"); setShowAuthModal(true); }}
            isAuthenticated={isAuthenticated}
          />
          <VoteChipPill
            emoji="🧘"
            label="服務優質"
            count={localStore.vote_service ?? 0}
            isVoted={(localStore.voted_by_service ?? []).includes(user?.id ?? "")}
            onVote={() => handleVote("service")}
            onAuthRequired={() => { setAuthModalMessage("登入後即可投票"); setShowAuthModal(true); }}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>

      {/* ========================================
          2. Been Here + Top 3 Tags + Specialty Ratio
      ======================================== */}
      <div className="px-4 pb-3">
        <div className="flex items-stretch gap-3">
          {/* 左側：我來過 + Top 3 標籤 */}
          <div className="flex-1 flex flex-col justify-center gap-2">
            {/* 我來過按鈕 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleBeenHere}
                disabled={hasVisited || isVisiting}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-full border transition-all ${
                  hasVisited
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card text-foreground border-border hover:bg-secondary"
                }`}
              >
                <span>🐾</span>
                <span>{hasVisited ? "我來過" : "我來過"}</span>
              </button>
              <span className="text-xs text-muted-foreground font-serif">{visitCount} 人來過</span>
            </div>
            {/* Top 3 技術標籤 */}
            {top3Tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm text-muted-foreground/70">熱門</span>
                {top3Tags.map((tag, idx) => (
                  <span key={tag} className={`px-2 py-0.5 text-xs rounded-full border ${
                    idx === 0 ? "bg-foreground/10 border-foreground/30 text-foreground font-medium" :
                    idx === 1 ? "bg-secondary border-border text-foreground" :
                    "bg-secondary/50 border-border text-muted-foreground"
                  }`}>
                    #{tag} {idx === 0 && '👑'}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 右側：超大專長比例圓圈 */}
          {store.specialties.length > 0 && (
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              {/* 超大圆饼图 */}
              <div className="relative w-[90px] h-[90px] flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5"
                    className="text-border" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeDasharray={`${store.specialties[0].percentage}, 100`}
                    className="text-foreground" strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                  {store.specialties[0].percentage}%
                </span>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground leading-tight">專長比例</p>
                <p className="text-sm font-medium text-foreground">{store.specialties[0].name}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Thin separator */}
      <div className="border-t border-border/50 mx-4 mb-3" />

      {/* ========================================
          Price Menu + Reader Certification Capsules
      ======================================== */}
      <div className="px-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          {/* 左側 40%：價目表 */}
          <div className="sm:w-[40%] flex-shrink-0">
            <NailPriceMenu
              menu={localPriceMenu}
              menuUpdatedAt={localMenuUpdatedAt}
              storeId={store.id}
              onMenuUpdate={async (newMenu) => {
                // 1. 先乐观更新本地状态
                setLocalPriceMenu(newMenu);
                const now = new Date().toISOString();
                setLocalMenuUpdatedAt(now);

                // 从 newMenu 中提取"单色"价格
                let singleColorPrice: number | null = null;
                const foundationCat = newMenu.find(c => c.category === '基礎');
                if (foundationCat) {
                  const singleItem = foundationCat.items.find(i => i.name.includes('單色') || i.name === '單色');
                  if (singleItem?.price) {
                    const parsed = parseInt(singleItem.price);
                    if (!isNaN(parsed)) singleColorPrice = parsed;
                  }
                }

                const updates: any = {
                  price_menu: newMenu,
                  menu_updated_at: now,
                };
                if (singleColorPrice !== null) updates.single_color_price = singleColorPrice;

                try {
                  // 2. 写入 Supabase
                  const { error } = await supabase
                    .from("stores")
                    .update(updates)
                    .eq("id", store.id);

                  if (error) throw error;

                  // 3. 通知父组件更新 stores 列表（保证首页卡片数据一致）
                  const updatedStore = { ...store, ...updates };
                  setLocalStore(updatedStore);
                  setPendingStoreUpdate(updatedStore);
                } catch (err) {
                  console.error("Error saving price menu:", err);
                  // 可选：回滚乐观更新或显示错误提示
                  setLocalPriceMenu(store.price_menu);
                  setLocalMenuUpdatedAt(store.menu_updated_at);
                }
              }}
            />
          </div>

          {/* 右側 60%：讀者認證特長 */}
          <div className="sm:w-[60%]">
            <div className="flex items-center gap-2.5 mt-1">
               <h3 className="text-sm font-medium">✨ 你推薦哪一項？</h3>
               <span className="text-xs text-muted-foreground">Recommended</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3.5 mb-3">點擊標籤投票認證，無需填寫表單</p>

            {/* 自訂標籤輸入區 */}
            <AddTagInput onAdd={handleAddCustomTag} isAuthenticated={isAuthenticated} onAuthRequired={() => { setAuthModalMessage("登入後即可新增標籤"); setShowAuthModal(true); }} />

            {/* 所有技術標籤 — 全面展開 */}
            <div className="border-t border-border/50 pt-1 mt-1">
              {TAG_GROUPS.map(group => (
                <div key={group.id} className="mb-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">{group.title}</p>
                  {group.categories.map(cat => (
                    <div key={cat.name} className="mb-1">
                      <p className="text-xs text-muted-foreground/80 mb-1">{cat.name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.tags.map(tag => {
                          const data = tagVotes[tag] || { count: 0, isVoted: false };
                          const hasVotes = data.count > 0;
                          return (
                            <button
                              key={tag}
                              onClick={() => toggleTagVote(tag)}
                              className={`inline-flex items-center px-2 py-1 text-sm rounded-full border transition-all active:scale-95 ${
                                hasVotes ? "bg-foreground/10 border-foreground/30 text-foreground" : "bg-card border-border text-muted-foreground/60 hover:border-muted-foreground"
                              } ${data.isVoted ? "ring-1 ring-foreground/20" : ""}`}
                            >
                              <span className={hasVotes ? "" : "opacity-50"}>{hasVotes ? "✨" : "✍️"}</span>
                              <span>{tag}</span>
                              <span className="font-serif text-xs ml-0.5">{data.count}</span>
                              {data.isVoted && <span className="text-xs ml-0.5">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* 其他自訂標籤 */}
              <CustomTagsSection
                allPredefinedTags={ALL_TAGS}
                tagVotes={tagVotes}
                toggleTagVote={toggleTagVote}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================
          Reviews Section
      ======================================== */}
      <div className="px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium">讀者回報</h3>
            <p className="text-xs text-muted-foreground">
              {localReviews.length} 則真實評價
            </p>
          </div>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                setAuthModalMessage("登入後即可撰寫評價");
                setShowAuthModal(true);
                return;
              }
              setShowReviewForm(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-foreground text-background rounded-full hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3 h-3" />
            撰寫評價
          </button>
        </div>

        {/* Tag Summary */}
        {tagSummary.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tagSummary.map(([tag, count]) => (
              <span key={tag} className="px-2 py-0.5 text-xs bg-secondary rounded-full border border-border">
                #{tag} ({count})
              </span>
            ))}
          </div>
        )}

        {/* Manicurist aggregation tags */}
        {(() => {
          const manicurists = [...new Set(localReviews.map(r => r.manicurist_name).filter(Boolean) as string[])];
          if (manicurists.length === 0) return null;
          return (
            <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide mb-3">
              <button onClick={() => setSelectedManicurist(null)} className={`px-2.5 py-1 text-xs rounded-full whitespace-nowrap flex-shrink-0 ${!selectedManicurist ? 'bg-foreground text-background' : 'bg-secondary'}`}>全部 ({localReviews.length})</button>
              {manicurists.map(name => (
                <button key={name} onClick={() => setSelectedManicurist(name)} className={`px-2.5 py-1 text-xs rounded-full whitespace-nowrap flex-shrink-0 ${selectedManicurist === name ? 'bg-foreground text-background' : 'bg-secondary'}`}>{name}</button>
              ))}
            </div>
          );
        })()}

        {/* Filtered reviews with reply support */}
        {(() => {
          // Separate top-level reviews from replies
          const topLevelReviews = localReviews.filter(r => !r.parent_id);
          const replies = localReviews.filter(r => r.parent_id);

          // Apply manicurist filter
          const filteredTopLevel = selectedManicurist
            ? topLevelReviews.filter(r => r.manicurist_name === selectedManicurist)
            : topLevelReviews;

          return (
            <div className="space-y-3 mb-4">
              {filteredTopLevel.length > 0 ? (
                filteredTopLevel.map((review) => {
                  const reviewReplies = replies.filter(r => r.parent_id === review.id);
                  return (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      onDelete={handleDeleteReview}
                      onEdit={handleEditReview}
                      onReply={(parentId) => {
                        setReplyToId(parentId);
                        setReplyToNickname(review.nickname);
                      }}
                      replies={reviewReplies}
                    />
                  );
                })
              ) : (
                <div className="text-center py-8 border border-dashed border-border rounded-xl">
                  <p className="text-xs text-muted-foreground mb-2">尚無讀者回報</p>
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setAuthModalMessage("登入後即可撰寫評價");
                        setShowAuthModal(true);
                        return;
                      }
                      setShowReviewForm(true);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    成為第一位評價的讀者
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ========================================
          Review Form Inline
      ======================================== */}
      {showReviewForm && (
        <ReviewFormInline
          storeId={store.id}
          onClose={() => setShowReviewForm(false)}
          onSubmit={handleAddReviewLocal}
          onImageUploaded={() => fetchContributedImages()}
        />
      )}

      {/* ========================================
          Reply Form Inline
      ======================================== */}
      {replyToId && (
        <ReviewFormInline
          storeId={store.id}
          onClose={() => { setReplyToId(null); setReplyToNickname(""); }}
          onSubmit={(review) => {
            handleAddReviewLocal(review);
            setReplyToId(null);
            setReplyToNickname("");
          }}
          onImageUploaded={() => fetchContributedImages()}
          parentId={replyToId}
          parentNickname={replyToNickname}
        />
      )}

      {/* ========================================
          Footer Actions
      ======================================== */}
      <div className="px-4 mt-4 space-y-2">
        <button
          onClick={() => setShowMerchantClaim(true)}
          className="w-full py-2.5 text-xs text-muted-foreground border border-dashed border-border rounded-xl hover:border-foreground hover:text-foreground transition-colors"
        >
          🏪 我是店家，認領此頁面
        </button>
        <LegalDisclaimer />
      </div>

      {/* ========================================
          Modals
      ======================================== */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        contextMessage={authModalMessage}
      />

      {showMerchantClaim && (
        <MerchantClaimModal
          storeId={store.id}
          storeName={store.name}
          onClose={() => setShowMerchantClaim(false)}
        />
      )}

      {showImageUpload && (
        <ImageUploadModal
          isOpen={showImageUpload}
          onClose={() => setShowImageUpload(false)}
          storeId={store.id}
          onUploaded={() => {
            fetchContributedImages();
          }}
          onStoreUpdated={(updated) => {
            // Use pendingStoreUpdate to avoid React cross-component update error
            setPendingStoreUpdate({ ...store, image_urls: updated.image_urls });
          }}
        />
      )}

      {lightboxOpen && (
        <ImageLightbox
          images={allLightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          currentUserId={user?.id}
          onDelete={handleLightboxDelete}
        />
      )}

      {showEditStore && (
        <StoreEditModal
          store={store}
          onClose={() => setShowEditStore(false)}
          onUpdate={(updatedStore) => {
            setLocalStore(updatedStore);
            setPendingStoreUpdate(updatedStore);
          }}
        />
      )}
    </div>
  );
}

/* ========================================
   EDIT REVIEW FORM (Inline)
======================================== */

interface EditReviewFormProps {
  review: Review;
  onClose: () => void;
  onSave: (updated: Review) => void;
}

function EditReviewForm({ review, onClose, onSave }: EditReviewFormProps) {
  const [comment, setComment] = useState(review.comment);
  const [selectedTags, setSelectedTags] = useState<string[]>(review.tags ?? []);
  const [serviceTags, setServiceTags] = useState<string[]>(review.service_tags ?? []);
  const maxServiceTags = 3;
  const [manicuristName, setManicuristName] = useState(review.manicurist_name ?? "");
  const [actualPrice, setActualPrice] = useState(review.actual_price?.toString() ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>(review.image_urls ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const toggleServiceTag = (tagName: string) => {
    setServiceTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : prev.length < maxServiceTags
          ? [...prev, tagName]
          : prev
    );
  };


  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!comment.trim() || !user) return;
    setIsSubmitting(true);
    setError("");
    try {
      // Handle deleted images: compare original vs edited
      const originalUrls = review.image_urls ?? [];
      const deletedUrls = originalUrls.filter(url => !imageUrls.includes(url));

      // Delete from Storage and store_images for each removed image
      const bucket = "yojn-images";
      const storageUrl = `https://scbdzggkxrrebbpsbruc.supabase.co/storage/v1/object/public/${bucket}/`;
      for (const url of deletedUrls) {
        if (url.startsWith(storageUrl)) {
          const filePath = url.replace(storageUrl, "");
          await supabase.storage.from(bucket).remove([filePath]);
        }
        // Also delete from store_images table
        await supabase.from("store_images").delete().eq("image_url", url);
      }

      const { error: updateError } = await supabase
        .from("reviews")
        .update({
          comment: comment.trim(),
          tags: selectedTags,
          manicurist_name: manicuristName.trim() || null,
          actual_price: actualPrice ? parseInt(actualPrice) : null,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
          service_tags: serviceTags.length > 0 ? serviceTags : null,
        })
        .eq("id", review.id)
        .eq("user_id", user.id); // 双重保险

      if (updateError) {
        if (updateError.code === "404" || updateError.code === "PGRST116" || updateError.code === "42P01") {
          console.warn("reviews table not available, updating local state only");
          onSave({
            ...review,
            comment: comment.trim(),
            tags: selectedTags,
            manicurist_name: manicuristName.trim() || undefined,
            actual_price: actualPrice ? parseInt(actualPrice) : undefined,
            image_urls: imageUrls.length > 0 ? imageUrls : undefined,
            service_tags: serviceTags.length > 0 ? serviceTags : undefined,
          });
          return;
        }
        throw updateError;
      }

      onSave({
        ...review,
        comment: comment.trim(),
        tags: selectedTags,
        manicurist_name: manicuristName.trim() || undefined,
        actual_price: actualPrice ? parseInt(actualPrice) : undefined,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
        service_tags: serviceTags.length > 0 ? serviceTags : undefined,
      });

    } catch (err: any) {
      console.error("Error updating review:", err);
      setError(err?.message || "更新失敗");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-3 bg-card border border-border rounded-xl space-y-3">
      <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} className="w-full py-2 px-3 text-xs bg-transparent border border-border rounded-lg focus:border-foreground focus:outline-none resize-none" />
      {/* 标签选择 */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">標籤（可複選）</p>
        <div className="flex flex-wrap gap-1.5">
          {[...reviewTags.positive, ...reviewTags.warning].map(tag => (
            <button key={tag} onClick={() => toggleTag(tag)} className={`px-2 py-0.5 text-xs rounded-full border transition-all ${selectedTags.includes(tag) ? "bg-foreground text-background border-foreground" : "bg-card text-foreground border-border hover:bg-secondary"}`}>{tag}</button>
          ))}
        </div>
      </div>
      {/* 可选字段 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">美甲師</label>
          <input type="text" value={manicuristName} onChange={e => setManicuristName(e.target.value)} className="w-full py-1.5 px-2 text-xs bg-transparent border border-border rounded-lg" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">價格</label>
          <input type="number" value={actualPrice} onChange={e => setActualPrice(e.target.value)} className="w-full py-1.5 px-2 text-xs bg-transparent border border-border rounded-lg" />
        </div>
      </div>
      {/* 现有图片管理 */}
      {imageUrls.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">已上傳圖片（點擊 X 移除）</p>
          <div className="flex gap-2 flex-wrap">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="relative w-16 h-16 rounded-lg bg-secondary overflow-hidden border border-border">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500/80 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 text-xs border border-border rounded-full">取消</button>
        <button onClick={handleSave} disabled={isSubmitting} className="px-3 py-1.5 text-xs bg-foreground text-background rounded-full disabled:opacity-40">{isSubmitting ? "儲存中..." : "儲存"}</button>
      </div>
    </div>
  );
}

/* ========================================
   REVIEW FORM INLINE
======================================== */

interface ReviewFormInlineProps {
  storeId: string;
  onClose: () => void;
  onSubmit: (review: Review) => void;
  onImageUploaded?: () => void;
  parentId?: string | null;
  parentNickname?: string;
}

function ReviewFormInline({ storeId, onClose, onSubmit, onImageUploaded, parentId, parentNickname }: ReviewFormInlineProps) {
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [serviceTags, setServiceTags] = useState<string[]>([]);
  const maxServiceTags = 3;
  const [manicuristName, setManicuristName] = useState("");
  const [actualPrice, setActualPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  // UGC 2.0 structured fields
  const [retention, setRetention] = useState("");
  const [priceTransparency, setPriceTransparency] = useState("");
  const [envTags, setEnvTags] = useState<string[]>([]);
  const [actualDuration, setActualDuration] = useState<number | null>(null);
  const [isReturning, setIsReturning] = useState<boolean | null>(null);
  const { user } = useAuth();
  
  // For replies, limit to 50 chars
  const maxCommentLength = parentId ? 50 : 1000;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleServiceTag = (tagName: string) => {
    setServiceTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : prev.length < maxServiceTags
          ? [...prev, tagName]
          : prev
    );
  };


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);
    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const filePath = `review-photos/${storeId}/${crypto.randomUUID()}.${fileExt}`;
      try {
        const { error: uploadError } = await supabase.storage
          .from("yojn-images")
          .upload(filePath, file);
        if (uploadError) {
          if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("bucket")) {
            console.warn("Storage bucket not found");
            continue;
          }
          throw uploadError;
        }
        const { data: publicUrlData } = supabase.storage
          .from("yojn-images")
          .getPublicUrl(filePath);
        const publicUrl = publicUrlData.publicUrl;
        setUploadedImages((prev) => [...prev, publicUrl]);

        // Also insert into store_images table so review photos appear in the album wall
        if (user) {
          try {
            await supabase.from("store_images").insert({
              store_id: storeId,
              user_id: user.id,
              image_url: publicUrl,
              is_official: false,
            });
            // Notify parent to refresh contributed images immediately
            onImageUploaded?.();
          } catch (siErr) {
            console.error("Error inserting review image into store_images:", siErr);
          }
        }
      } catch (err: any) {
        console.error("Error uploading review image:", err);
      }
    }
    setIsUploading(false);
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setError("請填寫評價內容");
      return;
    }

    // 刷新并获取最新 session，确保携带有效 token
    await supabase.auth.refreshSession();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("登入已過期，請重新登入");
      return;
    }
    const effectiveUserId = session.user.id;

    setIsSubmitting(true);
    setError("");

    try {
      const insertPayload: any = {
        store_id: storeId,
        user_id: effectiveUserId,
        comment: comment.trim(),
        tags: selectedTags,
        has_proof: uploadedImages.length > 0,
        manicurist_name: manicuristName.trim() || null,
        actual_price: actualPrice ? parseInt(actualPrice) : null,
        image_urls: uploadedImages.length > 0 ? uploadedImages : null,
        service_tags: serviceTags.length > 0 ? serviceTags : null,
      };

      // UGC 2.0 fields
      if (parentId) {
        insertPayload.parent_id = parentId;
      }
      if (retention) insertPayload.retention_feedback = retention;
      if (priceTransparency) insertPayload.price_transparency = priceTransparency;
      if (envTags.length > 0) insertPayload.env_tags = envTags;
      if (actualDuration !== null) insertPayload.actual_duration = actualDuration;
      if (isReturning !== null) insertPayload.is_returning = isReturning;


      const { data, error: insertError } = await supabase
        .from("reviews")
        .insert(insertPayload)
        .select()
        .single();


      if (insertError) {
        if (insertError.code === "404" || insertError.code === "PGRST116" || insertError.code === "42P01") {
          console.warn("reviews table not available, using local state");
          onSubmit({
            id: `local-${Date.now()}`,
            store_id: storeId,
            nickname: "匿名讀者",
            comment: comment.trim(),
            tags: selectedTags,
            has_proof: uploadedImages.length > 0,
            created_at: new Date().toISOString(),
            manicurist_name: manicuristName.trim() || undefined,
            actual_price: actualPrice ? parseInt(actualPrice) : undefined,
            image_urls: uploadedImages.length > 0 ? uploadedImages : undefined,
            // UGC 2.0
            retention_feedback: retention || undefined,
            price_transparency: priceTransparency || undefined,
            env_tags: envTags.length > 0 ? envTags : undefined,
            actual_duration: actualDuration ?? undefined,
            is_returning: isReturning ?? undefined,
            parent_id: parentId || undefined,
          });
          onClose();
          return;
        }
        throw insertError;
      }

      if (data) {
        onSubmit({
          id: data.id,
          store_id: data.store_id,
          nickname: "匿名讀者",
          comment: data.comment,
          tags: data.tags,
          has_proof: data.has_proof,
          created_at: data.created_at,
          manicurist_name: data.manicurist_name ?? undefined,
          actual_price: data.actual_price ?? undefined,
          image_urls: data.image_urls ?? undefined,
          // UGC 2.0
          retention_feedback: data.retention_feedback ?? undefined,
          price_transparency: data.price_transparency ?? undefined,
          env_tags: data.env_tags ?? undefined,
          actual_duration: data.actual_duration ?? undefined,
          is_returning: data.is_returning ?? undefined,
          parent_id: data.parent_id ?? undefined,
        });
      }
      onClose();
    } catch (err: any) {
      console.error("Error submitting review:", err);
      if (err?.code === "23505") {
        setError("您已對此店家發表過評論，每位用戶只能評論一次。");
        return;
      }
      setError(err?.message || "提交失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl p-5 max-w-lg w-full shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">{parentId ? '回覆評論' : '撰寫評價'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reply indicator */}
        {parentId && parentNickname && (
          <div className="mb-3 px-3 py-2 bg-secondary/50 rounded-lg border border-border/50">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">回覆給 @{parentNickname}</span>
            </p>
          </div>
        )}

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={parentId ? "輸入回覆（50字以內）..." : "分享你的美甲體驗..."}
          rows={3}
          maxLength={maxCommentLength}
          className="w-full py-2 px-3 text-xs bg-transparent border border-border rounded-lg focus:border-foreground focus:outline-none transition-colors resize-none mb-3"
        />
        {parentId && (
          <p className="text-xs text-muted-foreground/60 mb-2 text-right">{comment.length}/{maxCommentLength}</p>
        )}

        {/* Service Experience Tags */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-1.5">服務體感（最多選 3 個）</p>
          {Object.values(serviceReviewTags).map(cat => (
            <div key={cat.label} className="mb-2">
              <p className="text-[10px] text-muted-foreground/70 mb-1">{cat.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {cat.tags.map(tag => (
                  <button
                    key={tag.name}
                    onClick={() => toggleServiceTag(tag.name)}
                    className={`px-2 py-0.5 text-xs rounded-full border transition-all ${
                      serviceTags.includes(tag.name)
                        ? tag.type === 'positive'
                          ? 'bg-green-50 text-green-700 border-green-300'
                          : 'bg-orange-50 text-orange-700 border-orange-300'
                        : 'bg-card text-muted-foreground border-border hover:bg-secondary'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>


        {/* Optional fields */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">美甲師（選填）</label>
            <input
              type="text"
              value={manicuristName}
              onChange={(e) => setManicuristName(e.target.value)}
              placeholder="如：Amber"
              className="w-full py-1.5 px-2 text-xs bg-transparent border border-border rounded-lg focus:border-foreground focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">實際價格（選填）</label>
            <input
              type="number"
              value={actualPrice}
              onChange={(e) => setActualPrice(e.target.value)}
              placeholder="NT$"
              className="w-full py-1.5 px-2 text-xs bg-transparent border border-border rounded-lg focus:border-foreground focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Image upload */}
        <div className="mb-3">
          <label className="text-xs text-muted-foreground block mb-1">上傳照片（選填）</label>
          <div className="flex gap-2 flex-wrap">
            {uploadedImages.map((url, idx) => (
              <div key={idx} className="relative w-16 h-16 rounded-lg bg-secondary overflow-hidden border border-border">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/50 rounded-full flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
            ))}
            <label className="w-16 h-16 rounded-lg border border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              {isUploading ? (
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-muted-foreground" />
              )}
            </label>
          </div>
        </div>

        {/* UGC 2.0: Structured fields (only for new reviews, not replies) */}
        {!parentId && (
          <>
            {/* 維持度 */}
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1.5">維持度</p>
              <div className="flex gap-2">
                {['撐了 3 週以上', '2 週內就斷裂/起翹', '不確定/只做過一次'].map(opt => (
                  <button key={opt} onClick={() => setRetention(opt)} className={`px-3 py-1.5 text-xs rounded-full border ${retention === opt ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground border-border hover:bg-secondary'}`}>{opt}</button>
                ))}
              </div>
            </div>

            {/* 價格透明度 */}
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1.5">價格透明度</p>
              <div className="flex gap-2">
                <button onClick={() => setPriceTransparency('一致')} className={`px-3 py-1.5 text-xs rounded-full border ${priceTransparency === '一致' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-card text-muted-foreground border-border'}`}>💰 價格與網路上完全一致</button>
                <button onClick={() => setPriceTransparency('隱形消費')} className={`px-3 py-1.5 text-xs rounded-full border ${priceTransparency === '隱形消費' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-card text-muted-foreground border-border'}`}>❌ 現場有非自願的隱形消費</button>
              </div>
            </div>

            {/* 環境標籤 */}
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1.5">現場環境</p>
              <div className="flex flex-wrap gap-2">
                {['🔇 非常安靜', '🍿 影片好看', '🏡 有貓咪', '🎶 有背景音樂', '🅿️ 好停車'].map(tag => (
                  <button key={tag} onClick={() => setEnvTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])} className={`px-3 py-1.5 text-xs rounded-full border ${envTags.includes(tag) ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground border-border hover:bg-secondary'}`}>{tag}</button>
                ))}
              </div>
            </div>

            {/* 實際施作時間與回頭客 */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">實際施作時間</label>
                <select value={actualDuration ?? ''} onChange={e => setActualDuration(e.target.value ? parseFloat(e.target.value) : null)} className="w-full py-2 px-2 text-xs bg-transparent border border-border rounded-lg">
                  <option value="">不確定</option>
                  <option value="1">1 小時</option>
                  <option value="1.5">1.5 小時</option>
                  <option value="2">2 小時</option>
                  <option value="2.5">2.5 小時+</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">是否回頭客</label>
                <div className="flex gap-2">
                  <button onClick={() => setIsReturning(true)} className={`px-3 py-1.5 text-xs rounded-full border ${isReturning === true ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground border-border'}`}>是</button>
                  <button onClick={() => setIsReturning(false)} className={`px-3 py-1.5 text-xs rounded-full border ${isReturning === false ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground border-border'}`}>否</button>
                </div>
              </div>
            </div>
          </>
        )}

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !comment.trim()}
          className="w-full py-2.5 bg-foreground text-background rounded-xl text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {isSubmitting ? "提交中..." : "送出評價"}
        </button>
      </div>
    </div>
  );
}


