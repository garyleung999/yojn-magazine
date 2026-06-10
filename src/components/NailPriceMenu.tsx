"use client";

import { useState, useMemo } from "react";
import type { PriceMenuItem } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";
import { Pencil, Clock } from "lucide-react";
import PriceMenuEditModal, { DEFAULT_PRICE_MENU } from "@/components/PriceMenuEditModal";

/* ========================================
   Format date helper
======================================== */

function formatMenuDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "尚未記錄";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

/* ========================================
   Nail Price Menu Component — Compact Dual-Column
======================================== */

interface NailPriceMenuProps {
  menu?: PriceMenuItem[];
  menuUpdatedAt?: string;
  storeId: string;
  singleColorPrice?: number;
  onMenuUpdate?: (menu: PriceMenuItem[]) => void;
}

export default function NailPriceMenu({
  menu,
  menuUpdatedAt,
  storeId,
  singleColorPrice,
  onMenuUpdate,
}: NailPriceMenuProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [localMenu, setLocalMenu] = useState<PriceMenuItem[]>(
    menu && menu.length > 0 ? menu : DEFAULT_PRICE_MENU
  );
  const { isAuthenticated } = useAuth();

  // When menu is empty/undefined, use the full default menu and fill in single_color_price if available
  const effectiveMenu = useMemo(() => {
    if (menu && menu.length > 0) return menu;
    // Deep clone localMenu (which is DEFAULT_PRICE_MENU) to avoid mutation
    const defaultMenu = JSON.parse(JSON.stringify(localMenu)) as PriceMenuItem[];
    if (singleColorPrice != null) {
      const foundationCat = defaultMenu.find(c => c.category === '基礎');
      if (foundationCat) {
        const singleItem = foundationCat.items.find(i => i.name.includes('單色'));
        if (singleItem) {
          singleItem.price = String(singleColorPrice);
        }
      }
    }
    return defaultMenu;
  }, [menu, singleColorPrice, localMenu]);

  const displayMenu = effectiveMenu;

  const handleSave = (newMenu: PriceMenuItem[]) => {
    setLocalMenu(newMenu);
    setShowEditModal(false);
    if (onMenuUpdate) {
      onMenuUpdate(newMenu);
    }
  };

  // Core items: 基礎, 貓眼
  const coreCategories = displayMenu.filter(
    (c) => c.category === "基礎" || c.category === "貓眼"
  );
  // Care items: 卸甲保養
  const careCategories = displayMenu.filter(
    (c) => c.category === "卸甲保養"
  );
  // Extended items: 延甲, 自訂服務, etc.
  const extendedCategories = displayMenu.filter(
    (c) =>
      c.category !== "基礎" &&
      c.category !== "貓眼" &&
      c.category !== "卸甲保養"
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">價目表</h3>
          <span className="text-xs text-muted-foreground">Nail Price Menu</span>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <Pencil className="w-3 h-3" />
            編輯
          </button>
        )}
      </div>

      {/* Timestamp */}
      <div className="flex items-center gap-1 mb-3 text-xs text-muted-foreground/60">
        <Clock className="w-3 h-3" />
        <span>🕒 價格最後更新: {formatMenuDate(menuUpdatedAt)} (由讀者 Wiki 補充)</span>
      </div>

      {/* Vertical Three-Block Layout */}
      <div className="flex flex-col gap-2">
        {/* 核心價目 */}
        <div className="border border-border rounded-lg p-3">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2 font-medium">核心價目</p>
          <div className="space-y-1">
            {coreCategories.map((cat) =>
              cat.items.map((item, idx) => (
                <div key={`core-${idx}`} className="flex items-center justify-between py-1">
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                  <span className="font-serif text-sm font-semibold text-muted-foreground ml-2 whitespace-nowrap">
                    {item.price || "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 卸甲 */}
        <div className="border border-border rounded-lg p-3">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2 font-medium">卸甲</p>
          <div className="space-y-1">
            {careCategories.map((cat) =>
              cat.items.map((item, idx) => (
                <div key={`care-${idx}`} className="flex items-center justify-between py-1">
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                  <span className="font-serif text-sm font-semibold text-muted-foreground ml-2 whitespace-nowrap">
                    {item.price || "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 保養延甲 + 其他 */}
        {extendedCategories.length > 0 && (
          <div className="border border-border rounded-lg p-3">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2 font-medium">保養延甲</p>
            <div className="space-y-1">
              {extendedCategories.map((cat) => (
                <div key={cat.category}>
                  <p className="text-xs text-muted-foreground/70 uppercase tracking-wider mb-1">{cat.category}</p>
                  {cat.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1">
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                      <span className="font-serif text-sm font-semibold text-muted-foreground ml-2 whitespace-nowrap">
                        {item.price || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <PriceMenuEditModal
          menu={displayMenu}
          onSave={handleSave}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
