"use client";

import { useState } from "react";
import { filterCategories } from "@/data/mockData";

/* ========================================
   TIERED FILTER PANEL
======================================== */

interface TieredFilterPanelProps {
  activeFilters: string[];
  toggleFilter: (tag: string) => void;
}

export default function TieredFilterPanel({
  activeFilters,
  toggleFilter,
}: TieredFilterPanelProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  const activeFilterCategory = filterCategories.find(
    (c) => c.id === activeCategory
  );

  return (
    <div className="mb-5">
      {/* Category Anchor Row */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {filterCategories.map((category) => {
          const isActive = activeCategory === category.id;
          const hasSelectedTags = category.subTags.some((tag) =>
            activeFilters.includes(tag)
          );

          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap rounded-lg transition-all flex-shrink-0 ${
                isActive
                  ? "bg-foreground text-background"
                  : hasSelectedTags
                    ? "bg-secondary text-foreground border border-border"
                    : "bg-card text-muted-foreground border border-border hover:text-foreground"
              }`}
            >
              <CategoryIcon categoryId={category.id} isActive={isActive} />
              <span>{category.label}</span>
              {hasSelectedTags && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Sub-Tag Panel */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          activeCategory
            ? "max-h-48 opacity-100 mt-3"
            : "max-h-0 opacity-0"
        }`}
      >
        {activeFilterCategory && (
          <div className="p-3 bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground">
                {activeFilterCategory.labelEn}
              </span>
              <button
                onClick={() => setActiveCategory(null)}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                收起
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeFilterCategory.subTags.map((tag) => {
                const isSelected = activeFilters.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleFilter(tag)}
                    className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                      isSelected
                        ? "bg-[#2B2B2B] text-white border border-[#2B2B2B]"
                        : "bg-transparent text-foreground border border-[#EAEAEA] hover:border-muted-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryIcon({
  categoryId,
  isActive,
}: {
  categoryId: string;
  isActive: boolean;
}) {
  const className = `w-3.5 h-3.5 ${isActive ? "opacity-100" : "opacity-60"}`;

  switch (categoryId) {
    case "style":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
      );
    case "technique":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 3l1.5 4.5H18l-3.75 2.75L15.75 15 12 12.25 8.25 15l1.5-4.75L6 7.5h4.5L12 3z" />
        </svg>
      );
    case "shape":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 2C7 2 4 6 4 10c0 6 8 12 8 12s8-6 8-12c0-4-3-8-8-8z" />
        </svg>
      );
    case "scenario":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      );
    case "experience":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 21c-4.97 0-9-2.69-9-6v-3c0-3.31 4.03-6 9-6s9 2.69 9 6v3c0 3.31-4.03 6-9 6z" />
          <path d="M12 12v3" />
          <circle cx="12" cy="9" r="1" fill="currentColor" />
        </svg>
      );
    case "budget":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
          <path d="M12 6v12" />
          <path d="M9 9h4a2 2 0 0 1 0 4H9" />
        </svg>
      );
    case "material":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
          <path d="M6 2l2 4M12 2l2 4M18 2l2 4" />
          <circle cx="8" cy="10" r="1" fill="currentColor" />
          <circle cx="16" cy="10" r="1" fill="currentColor" />
          <circle cx="8" cy="16" r="1" fill="currentColor" />
          <circle cx="16" cy="16" r="1" fill="currentColor" />
        </svg>
      );
    case "district":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      );
    default:
      return null;
  }
}
