"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Store, Review, PriceMenuItem } from "@/data/mockData";
import { DetailView } from "@/components/StoreCard";

/* ========================================
   Supabase row types
======================================== */

interface StoreRow {
  id: string;
  name: string;
  ig_username: string;
  area: string;
  banner_url: string;
  avg_duration_hours: number;
  retention_rate: number;
  vibe_tag: string;
  tags: string[];
  calculated_avg_price?: number;
  manicurists?: string[];
  image_urls?: string[];
  visit_count?: number;
  price_menu?: PriceMenuItem[];
  menu_updated_at?: string;
  is_official?: boolean;
  store_specialties?: SpecialtyRow[];
  parent_salon_ig?: string;
  parent_salon_name?: string;
  single_color_price?: number;
  vote_skill?: number;
  vote_aesthetic?: number;
  vote_service?: number;
  voted_by_skill?: string[];
  voted_by_aesthetic?: string[];
  voted_by_service?: string[];
  created_at?: string;
  branch_name?: string;
  slug: string;
}

interface SpecialtyRow {
  id: string;
  store_id: string;
  name: string;
  percentage: number;
}

interface ReviewRow {
  id: string;
  store_id: string;
  user_id: string;
  comment: string;
  tags: string[];
  has_proof: boolean;
  created_at: string;
  manicurist_name?: string;
  actual_price?: number;
  image_urls?: string[];
  retention_feedback?: string;
  price_transparency?: string;
  env_tags?: string[];
  report_count?: number;
  parent_id?: string | null;
  proof_requests?: number;
  actual_duration?: number;
  is_returning?: boolean;
  service_tags?: string[];
}

function mapStore(row: StoreRow): Store {
  const tags = row.tags ?? [];
  const areaTag = row.area || null;
  if (areaTag && !tags.includes(areaTag)) {
    tags.push(areaTag);
  }
  return {
    id: row.id,
    name: row.name,
    ig_username: row.ig_username,
    area: row.area,
    banner_url: row.banner_url,
    avg_duration_hours: row.avg_duration_hours,
    retention_rate: row.retention_rate,
    vibe_tag: row.vibe_tag,
    specialties: (row.store_specialties ?? []).map((s) => ({
      name: s.name,
      percentage: s.percentage,
    })),
    tags,
    calculated_avg_price: row.calculated_avg_price ?? undefined,
    manicurists: row.manicurists ?? undefined,
    image_urls: row.image_urls ?? undefined,
    visit_count: row.visit_count ?? 0,
    price_menu: row.price_menu ?? undefined,
    menu_updated_at: row.menu_updated_at ?? undefined,
    is_official: row.is_official ?? false,
    parent_salon_ig: row.parent_salon_ig ?? undefined,
    parent_salon_name: row.parent_salon_name ?? undefined,
    single_color_price: row.single_color_price ?? undefined,
    vote_skill: row.vote_skill ?? 0,
    vote_aesthetic: row.vote_aesthetic ?? 0,
    vote_service: row.vote_service ?? 0,
    voted_by_skill: row.voted_by_skill ?? [],
    voted_by_aesthetic: row.voted_by_aesthetic ?? [],
    voted_by_service: row.voted_by_service ?? [],
    created_at: row.created_at ?? '',
    branch_name: row.branch_name ?? undefined,
    slug: row.slug ?? (row.name.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '') || row.ig_username.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '')),
  };
}

function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    store_id: row.store_id,
    nickname: "匿名讀者",
    comment: row.comment,
    tags: row.tags,
    has_proof: row.has_proof,
    created_at: row.created_at,
    manicurist_name: row.manicurist_name ?? undefined,
    actual_price: row.actual_price ?? undefined,
    image_urls: row.image_urls ?? undefined,
    retention_feedback: row.retention_feedback ?? undefined,
    price_transparency: row.price_transparency ?? undefined,
    env_tags: row.env_tags ?? undefined,
    report_count: row.report_count ?? undefined,
    parent_id: row.parent_id ?? undefined,
    proof_requests: row.proof_requests ?? undefined,
    actual_duration: row.actual_duration ?? undefined,
    is_returning: row.is_returning ?? undefined,
    service_tags: row.service_tags ?? undefined,
  };
}

export default function StorePageClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch store by slug
      const { data: storeData, error: storeError } = await supabase
        .from("stores")
        .select("*, store_specialties(*)")
        .eq("slug", slug)
        .single();

      if (storeError) {
        if (storeError.code === "PGRST116") {
          setError("找不到此店家");
        } else {
          throw storeError;
        }
        return;
      }

      const mappedStore = mapStore(storeData as StoreRow);
      setStore(mappedStore);

      // Fetch reviews for this store
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("store_id", mappedStore.id);

      if (reviewsError) {
        console.error("Error fetching reviews:", reviewsError);
      }

      const mappedReviews = (reviewsData ?? []).map((row: any) =>
        mapReview(row as ReviewRow)
      );
      setReviews(mappedReviews);

      // Fetch tag_votes for top_tags
      const { data: tagVotesData } = await supabase
        .from("tag_votes")
        .select("store_id, tag_name")
        .eq("store_id", mappedStore.id);

      if (tagVotesData) {
        const tagCounts: Record<string, number> = {};
        tagVotesData.forEach((row: any) => {
          tagCounts[row.tag_name] = (tagCounts[row.tag_name] || 0) + 1;
        });
        const topTags = Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([tag]) => tag);
        setStore((prev) => prev ? { ...prev, top_tags: topTags } : prev);
      }
    } catch (err: any) {
      console.error("Error fetching store:", err);
      if (err?.message?.includes("Failed to fetch") || err?.message?.includes("NetworkError")) {
        setError("無法連線至伺服器，請確認網路連線後重新整理。");
      } else {
        setError("目前無法載入店家資訊，請確認網路連線後重新整理。");
      }
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBack = () => {
    router.push('/');
  };

  const handleInstagramClick = (igUsername: string) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      const deepLink = `instagram://user?username=${igUsername}`;
      const webFallback = `https://instagram.com/${igUsername}`;
      const startTime = Date.now();
      window.location.href = deepLink;
      setTimeout(() => {
        if (Date.now() - startTime < 2500) {
          window.open(webFallback, '_blank');
        }
      }, 2000);
    } else {
      window.open(`https://instagram.com/${igUsername}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleAddReview = (newReview: Review) => {
    setReviews((prev) => [newReview, ...prev]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="font-serif text-xl text-muted-foreground animate-pulse">
          YOJN Mégazine
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="font-serif text-lg mb-3 text-foreground">載入失敗</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">{error}</p>
          <button onClick={handleBack} className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-lg active:scale-[0.98]">
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-sm">
          <h2 className="font-serif text-lg mb-3 text-foreground">找不到此店家</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">該店家不存在或已被移除。</p>
          <button onClick={handleBack} className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-lg">
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <DetailView
      store={store}
      reviews={reviews}
      onBack={handleBack}
      onInstagramClick={handleInstagramClick}
      onAddReview={handleAddReview}
    />
  );
}
