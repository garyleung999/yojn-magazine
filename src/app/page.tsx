"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

import { supabase } from "@/lib/supabase";
import type { Store, Review, PriceMenuItem } from "@/data/mockData";
import TieredFilterPanel from "@/components/FilterDrawer";
import {
  SalonCard,
  SalonCardList,
  SalonCardGrid,
  DetailView,
} from "@/components/StoreCard";
import SubmitView from "@/components/SubmissionForm";
import AuthModal from "@/components/AuthModal";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Menu,
  Heart,
  MapPin,
  ChevronDown,
  X,
  Plus,
  List,
  LayoutGrid,
  Sparkles,
  Check,
  LogOut,
} from "lucide-react";

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
  // IG Association fields
  parent_salon_ig?: string;
  parent_salon_name?: string;
  single_color_price?: number;
  // 3D Vibe voting fields
  vote_skill?: number;
  vote_aesthetic?: number;
  vote_service?: number;
  voted_by_skill?: string[];
  voted_by_aesthetic?: string[];
  voted_by_service?: string[];
  created_at?: string;
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
  // UGC 2.0 fields
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


/* ========================================
   Mapping helpers
======================================== */

function mapStore(row: StoreRow): Store {
  const tags = row.tags ?? [];
  // Inject pure district name (e.g., "西屯區") into tags for filter matching
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
    // UGC 2.0 fields
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


/* ========================================
   Budget filter helper
======================================== */

function getBudgetRange(tag: string): [number, number] | null {
  switch (tag) {
    case "1000元以下":
      return [0, 1000];
    case "1000-1500元":
      return [1000, 1500];
    case "1500-2000元":
      return [1500, 2000];
    case "2000元以上":
      return [2000, Infinity];
    default:
      return null;
  }
}

function matchesBudgetFilter(store: Store, budgetTags: string[]): boolean {
  if (budgetTags.length === 0) return true;
  const price = store.single_color_price;
  if (price == null || price === 0) return false; // 無價格則不匹配
  return budgetTags.some((tag) => {
    const range = getBudgetRange(tag);
    if (!range) return false;
    return price >= range[0] && price < range[1];
  });
}

export default function HomePage() {
  const [currentView, setCurrentView] = useState<"home" | "detail" | "submit">(
    "home"
  );
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState("台中市");
  const [selectedSort, setSelectedSort] = useState("🏆 推薦排序");

  const [stores, setStores] = useState<Store[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [storesResult, reviewsResult, tagVotesResult] = await Promise.all([
        supabase.from("stores").select("*, store_specialties(*)"),
        supabase.from("reviews").select("*"),
        supabase.from("tag_votes").select("store_id, tag_name"),
      ]);

      if (storesResult.error) {
        throw storesResult.error;
      }

      // Build tag counts per store for top 3 computation
      const tagCountsByStore: Record<string, Record<string, number>> = {};
      (tagVotesResult.data ?? []).forEach((row: any) => {
        if (!tagCountsByStore[row.store_id]) tagCountsByStore[row.store_id] = {};
        tagCountsByStore[row.store_id][row.tag_name] = (tagCountsByStore[row.store_id][row.tag_name] || 0) + 1;
      });

      const mappedStores = (storesResult.data ?? []).map((row: any) => {
        const store = mapStore(row as StoreRow);
        const tagCounts = tagCountsByStore[store.id] || {};
        store.top_tags = Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([tag]) => tag);
        return store;
      });
      setStores(mappedStores);

      if (reviewsResult.error) {
        throw reviewsResult.error;
      }
      const mappedReviews = (reviewsResult.data ?? []).map((row: any) =>
        mapReview(row as ReviewRow)
      );
      setReviews(mappedReviews);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      // Provide a user-friendly error message
      if (err?.name === "AbortError") {
        setError("連線逾時，請確認網路連線後重新整理。");
      } else if (err?.message?.includes("Failed to fetch") || err?.message?.includes("NetworkError")) {
        setError("無法連線至伺服器，請確認網路連線後重新整理。");
      } else {
        setError("目前無法載入店家資訊，請確認網路連線後重新整理。");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Safety timeout: force loading to end after 8 seconds
    // Prevents the page from being permanently stuck if data fetching hangs
    // (e.g., network unreachable but no error thrown, or request never resolves)
    const safetyTimeout = setTimeout(() => {
      setIsLoading((prev) => {
        if (prev) {
          console.warn("Data fetch timed out after 8s — forcing loading to end");
          setError("資料載入逾時，請檢查網路連線後重新整理。");
          return false;
        }
        return prev;
      });
    }, 8000);

    return () => clearTimeout(safetyTimeout);
  }, [fetchData]);



  // Separate budget tags from regular tags
  const budgetTags = useMemo(
    () => activeFilters.filter((t) => getBudgetRange(t) !== null),
    [activeFilters]
  );
  const regularTags = useMemo(
    () => activeFilters.filter((t) => getBudgetRange(t) === null),
    [activeFilters]
  );

  // AND intersection match - stores must have ALL selected regular tags
  // AND match budget filter
  const filteredStores = useMemo(() => {
    let result = stores.filter((store) => {
      if (!store || !store.name || !store.area) return false;

      const matchesSearch =
        searchQuery === "" ||
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.ig_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (store.parent_salon_ig && store.parent_salon_ig.toLowerCase().includes(searchQuery.toLowerCase())) ||
        store.area.toLowerCase().includes(searchQuery.toLowerCase());

      const storeTags = store.tags || [];
      const matchesFilters =
        regularTags.length === 0 ||
        regularTags.every((filterTag) => storeTags.includes(filterTag));

      const matchesBudget = matchesBudgetFilter(store, budgetTags);

      return matchesSearch && matchesFilters && matchesBudget;
    });

    // Apply sorting
    switch (selectedSort) {
      case "🏆 推薦排序":
        // 综合三维投票总分
        result.sort((a, b) => {
          const scoreA = (a.vote_skill ?? 0) + (a.vote_aesthetic ?? 0) + (a.vote_service ?? 0);
          const scoreB = (b.vote_skill ?? 0) + (b.vote_aesthetic ?? 0) + (b.vote_service ?? 0);
          return scoreB - scoreA;
        });
        break;
      case "👍 寶藏推推":
        result.sort((a, b) => (b.vote_skill ?? 0) - (a.vote_skill ?? 0));
        break;
      case "🤍 氛圍絕美":
        result.sort((a, b) => (b.vote_aesthetic ?? 0) - (a.vote_aesthetic ?? 0));
        break;
      case "🧘 服務優質":
        result.sort((a, b) => (b.vote_service ?? 0) - (a.vote_service ?? 0));
        break;
      case "👣 人氣排序":
        result.sort((a, b) => (b.visit_count ?? 0) - (a.visit_count ?? 0));
        break;
      case "💰 價格低→高":
        result.sort((a, b) => (a.single_color_price ?? Infinity) - (b.single_color_price ?? Infinity));
        break;
      case "💎 價格高→低":
        result.sort((a, b) => (b.single_color_price ?? 0) - (a.single_color_price ?? 0));
        break;
      case "🆕 最新進駐":
        result.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }

    return result;
  }, [stores, searchQuery, regularTags, budgetTags, selectedSort]);

  const selectedStore = stores.find((s) => s.id === selectedStoreId);
  const storeReviews = reviews.filter((r) => r.store_id === selectedStoreId);

  const toggleFilter = (tag: string) => {
    setActiveFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  const handleStoreClick = (storeId: string) => {
    setSelectedStoreId(storeId);
    setCurrentView("detail");
  };

  const handleBack = () => {
    setCurrentView("home");
    setSelectedStoreId(null);
  };

  const handleInstagramClick = (igUsername: string) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      // 手機版：嘗試開啟 IG App，2 秒後降級到網頁版
      const deepLink = `instagram://user?username=${igUsername}`;
      const webFallback = `https://instagram.com/${igUsername}`;
      const startTime = Date.now();
      window.location.href = deepLink;
      setTimeout(() => {
        // 如果 App 沒打開（還在原頁面），跳轉網頁版
        if (Date.now() - startTime < 2500) {
          window.open(webFallback, '_blank');
        }
      }, 2000);
    } else {
      // 桌面版：強制開新分頁
      window.open(`https://instagram.com/${igUsername}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleParentSalonClick = (parentIg: string) => {
    // Filter stores by parent_salon_ig
    setSearchQuery(parentIg);
    setCurrentView("home");
  };

  const handleAddStore = (newStore: Store) => {
    setStores((prev) => [...prev, newStore]);
  };

  const handleAddReview = (newReview: Review) => {
    setReviews((prev) => [newReview, ...prev]);
  };

  // Handle duplicate redirect from SubmitView
  const handleDuplicateRedirect = (storeId: string) => {
    setSelectedStoreId(storeId);
    setCurrentView("detail");
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
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          {/* Error Message */}
          <h2 className="font-serif text-lg mb-3 text-foreground">
            載入失敗
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {error}
          </p>
          {/* Retry Button */}
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-lg active:scale-[0.98]"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
              />
            </svg>
            重新載入
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {currentView === "home" && (
          <HomeView
            stores={filteredStores}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilters={activeFilters}
            toggleFilter={toggleFilter}
            clearAllFilters={clearAllFilters}
            onStoreClick={handleStoreClick}
            selectedArea={selectedArea}
            setSelectedArea={setSelectedArea}
            selectedSort={selectedSort}
            setSelectedSort={setSelectedSort}
            onOpenSubmit={() => setCurrentView("submit")}
            onRetry={fetchData}
          />
        )}

        {currentView === "detail" && selectedStore && (
          <DetailView
            store={selectedStore}
            reviews={storeReviews}
            onBack={handleBack}
            onInstagramClick={handleInstagramClick}
            onAddReview={handleAddReview}
            onStoreUpdate={(updatedStore) => {
              console.log('onStoreUpdate called, updatedStore image_urls:', updatedStore.image_urls);
              setStores((prev) => prev.map((s) => (s.id === updatedStore.id ? updatedStore : s)));
            }}
              
          />
        )}
        {currentView === "submit" && (
          <SubmitView
            onBack={handleBack}
            onSubmit={handleAddStore}
            stores={stores}
            onDuplicateRedirect={handleDuplicateRedirect}
          />
        )}
      </div>
    </main>
  );
}

/* ========================================
   HOME VIEW (Container for Home Screen)
======================================== */

interface HomeViewProps {
  stores: Store[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilters: string[];
  toggleFilter: (tag: string) => void;
  clearAllFilters: () => void;
  onStoreClick: (storeId: string) => void;
  selectedArea: string;
  setSelectedArea: (area: string) => void;
  selectedSort: string;
  setSelectedSort: (sort: string) => void;
  onOpenSubmit: () => void;
  onRetry: () => void;
}

function HomeView({
  stores,
  searchQuery,
  setSearchQuery,
  activeFilters,
  toggleFilter,
  clearAllFilters,
  onStoreClick,
  selectedArea,
  selectedSort,
  setSelectedSort,
  onOpenSubmit,
  onRetry,
}: HomeViewProps) {

  const [viewMode, setViewMode] = useState<"featured" | "list" | "grid">(
    "featured"
  );
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen pb-20">
      {/* Mobile Header */}
      <header className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          {/* 左侧占位，与右侧对称 */}
          <div className="w-10 flex justify-start">
            <Menu className="w-5 h-5 text-muted-foreground" />
          </div>
          
          {/* 中间标题绝对居中 */}
          <div className="flex-1 text-center">
            <h1 className="font-serif text-lg tracking-tight">
              YOJN Mégazine — 台中
            </h1>
            <p className="text-[12px] text-muted-foreground">美業職人交流平台</p>
          </div>
          
          {/* 右侧认证状态，与左侧宽度一致 */}
          <div className="w-10 flex justify-end">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-muted-foreground">{user.displayName}</span>
                <button onClick={logout} className="text-[12px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">登出</button>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="text-[12px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">登入/註冊</button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <div className="px-4 py-5">
        {/* Hero Section - Mobile Optimized */}
        <div className="text-center mb-6">
          <h2 className="font-serif text-lg leading-relaxed mb-2">
            在對的地方，遇見對的職人。
          </h2>
          <p className="text-xs text-muted-foreground">
            用硬指標，找到值得你長期信任的美甲師。
          </p>
        </div>

        {/* Search Bar - Mobile */}
        <div className="mb-4">
          <div className="flex items-stretch border border-border rounded-lg overflow-hidden bg-card">
            <div className="flex-1 flex items-center px-2 sm:px-3 gap-1 sm:gap-2 min-w-0">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="搜尋店名、風格或美甲師"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 py-2.5 sm:py-3 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none min-w-0"
              />
            </div>
            <div className="hidden xs:flex items-center px-2 sm:px-3 border-l border-border gap-1 text-xs text-muted-foreground flex-shrink-0">
              <MapPin className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">{selectedArea}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
            <button className="px-3 sm:px-4 bg-foreground text-background flex items-center justify-center flex-shrink-0">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Filters Sticky Row */}
        {activeFilters.length > 0 && (
          <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {activeFilters.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleFilter(tag)}
                className="flex items-center gap-1 px-2.5 py-1 text-[14px] bg-foreground text-background rounded-full whitespace-nowrap flex-shrink-0"
              >
                #{tag}
                <X className="w-3 h-3" />
              </button>
            ))}
            {activeFilters.length >= 2 && (
              <button
                onClick={clearAllFilters}
                className="text-[14px] text-muted-foreground whitespace-nowrap flex-shrink-0 hover:text-foreground transition-colors"
              >
                清除全部
              </button>
            )}
          </div>
        )}

        {/* Tiered Filter Component */}
        <TieredFilterPanel
          activeFilters={activeFilters}
          toggleFilter={toggleFilter}
        />

        {/* Sort Dropdown + Results Count + View Switcher */}
        <div className="flex items-center mb-4 gap-y-1">
          {/* 左：排序下拉選單（不變） */}
          <div className="relative">
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="appearance-none bg-transparent border border-border rounded-lg px-2.5 py-1.5 pr-7 text-xs font-serif text-muted-foreground focus:outline-none focus:border-foreground transition-colors cursor-pointer"
            >
              <option value="🏆 推薦排序">🏆 推薦排序</option>
              <option value="👍 寶藏推推">👍 寶藏推推</option>
              <option value="🤍 氛圍絕美">🤍 氛圍絕美</option>
              <option value="🧘 服務優質">🧘 服務優質</option>
              <option value="👣 人氣排序">👣 人氣排序</option>
              <option value="💰 價格低→高">💰 價格低→高</option>
              <option value="💎 價格高→低">💎 價格高→低</option>
              <option value="🆕 最新進駐">🆕 最新進駐</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>

          {/* 中：計數文字（置中，允許換行但不拆詞） */}
          <div className="flex-1 text-center">
            <p className="text-xs text-muted-foreground" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
              找到{" "}
              <span className="text-foreground font-medium whitespace-nowrap">
                {stores.length}&nbsp;間
              </span>
              <wbr />
              符合條件
            </p>
          </div>

          {/* View Switcher Button Group */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden bg-card text-xs">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1 px-2.5 py-1.5 transition-all ${
                viewMode === "list"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="w-3 h-3" />
              <span className="hidden xs:inline">清單</span>
            </button>
            <button
              onClick={() => setViewMode("featured")}
              className={`flex items-center gap-1 px-2.5 py-1.5 border-x border-border transition-all ${
                viewMode === "featured"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden xs:inline">精選</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1 px-2.5 py-1.5 transition-all ${
                viewMode === "grid"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span className="hidden xs:inline">縮圖</span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        {stores.length === 0 && activeFilters.length > 0 && (
          <div className="text-center py-12 px-4 border border-border rounded-xl bg-card mb-4">
            <p className="text-sm text-muted-foreground mb-3">
              目前該綜合條件下暫無推薦職人，
              <br />
              試試調整篩選標籤。
            </p>
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 text-xs border border-border rounded-full hover:bg-secondary transition-colors"
            >
              重置篩選條件
            </button>
          </div>
        )}

        {/* Store Feed - Dynamic Layout */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            viewMode === "list"
              ? "space-y-0"
              : viewMode === "grid"
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
                : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          }`}
        >
          {stores.map((store) =>
            viewMode === "list" ? (
              <SalonCardList
                key={store.id}
                store={store}
                onClick={() => onStoreClick(store.id)}
                onParentSalonClick={(parentIg) => {
                  setSearchQuery(parentIg);
                }}
              />
            ) : viewMode === "grid" ? (
              <SalonCardGrid
                key={store.id}
                store={store}
                onClick={() => onStoreClick(store.id)}
                onParentSalonClick={(parentIg) => {
                  setSearchQuery(parentIg);
                }}
              />
            ) : (
              <SalonCard
                key={store.id}
                store={store}
                onClick={() => onStoreClick(store.id)}
                onParentSalonClick={(parentIg) => {
                  setSearchQuery(parentIg);
                }}
              />
            )
          )}
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-10 pt-4 border-t border-border">
          <LegalDisclaimer />
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-4 flex flex-col gap-3">
        {/* Submit Store Button */}
        <button
          onClick={onOpenSubmit}
          className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-full text-xs font-medium shadow-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          匿名分享職人
        </button>
      </div>
    </div>
  );
}

function TrustIcon({ type }: { type: string }) {
  const iconClass = "w-4 h-4 text-muted-foreground";
  switch (type) {
    case "check":
      return <Check className={iconClass} />;
    case "ban":
      return <X className={iconClass} />;
    case "dollar":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v8m0-8V6m0 10v2"
          />
        </svg>
      );
    case "calendar":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    default:
      return null;
  }
}
