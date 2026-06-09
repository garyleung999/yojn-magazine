"use client";

import { useState } from "react";
import type { PriceMenuItem } from "@/data/mockData";
import { Plus, X } from "lucide-react";

/* ========================================
   Default Core Menu Items
======================================== */

export const DEFAULT_PRICE_MENU: PriceMenuItem[] = [
  {
    category: "基礎",
    items: [
      { name: "單色 / 雙色跳色", price: "" },
      { name: "漸層", price: "" },
      { name: "法式", price: "" },
    ],
  },
  {
    category: "貓眼",
    items: [
      { name: "特殊貓眼 (磁石/玻璃珠)", price: "" },
      { name: "鏡面 / 魔鏡粉", price: "" },
    ],
  },
  {
    category: "延甲",
    items: [
      { name: "基礎造型 (2指)", price: "" },
      { name: "設計造型 (4指以上)", price: "" },
      { name: "甲片延甲 (每指)", price: "" },
      { name: "補甲 (每指)", price: "" },
    ],
  },
  {
    category: "卸甲保養",
    items: [
      { name: "卸甲續作", price: "" },
      { name: "卸甲不續作", price: "" },
      { name: "物理卸甲/一層殘", price: "" },
      { name: "精緻保養", price: "" },
    ],
  },
];

/* ========================================
   Price Menu Edit Modal
======================================== */

interface PriceMenuEditModalProps {
  menu: PriceMenuItem[];
  onSave: (menu: PriceMenuItem[]) => void;
  onClose: () => void;
}

export default function PriceMenuEditModal({ menu, onSave, onClose }: PriceMenuEditModalProps) {
  const [localMenu, setLocalMenu] = useState<PriceMenuItem[]>(
    JSON.parse(JSON.stringify(menu))
  );

  const updateItemPrice = (
    catIdx: number,
    itemIdx: number,
    value: string
  ) => {
    setLocalMenu((prev) => {
      const next = [...prev];
      next[catIdx] = { ...next[catIdx] };
      next[catIdx].items = [...next[catIdx].items];
      next[catIdx].items[itemIdx] = {
        ...next[catIdx].items[itemIdx],
        price: value,
      };
      return next;
    });
  };

  const addCustomItem = () => {
    setLocalMenu((prev) => {
      const next = [...prev];
      const customCategory = next.find((c) => c.category === "自訂服務");
      if (customCategory) {
        const catIdx = next.indexOf(customCategory);
        next[catIdx] = {
          ...customCategory,
          items: [...customCategory.items, { name: "", price: "" }],
        };
      } else {
        next.push({
          category: "自訂服務",
          items: [{ name: "", price: "" }],
        });
      }
      return next;
    });
  };

  const updateCustomItemName = (
    catIdx: number,
    itemIdx: number,
    value: string
  ) => {
    setLocalMenu((prev) => {
      const next = [...prev];
      next[catIdx] = { ...next[catIdx] };
      next[catIdx].items = [...next[catIdx].items];
      next[catIdx].items[itemIdx] = {
        ...next[catIdx].items[itemIdx],
        name: value,
      };
      return next;
    });
  };

  const removeCustomItem = (catIdx: number, itemIdx: number) => {
    setLocalMenu((prev) => {
      const next = [...prev];
      next[catIdx] = { ...next[catIdx] };
      next[catIdx].items = next[catIdx].items.filter((_, i) => i !== itemIdx);
      if (next[catIdx].items.length === 0) {
        return next.filter((_, i) => i !== catIdx);
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card border border-border rounded-2xl p-5 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">編輯價目表</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {localMenu.map((category, catIdx) => (
            <div key={catIdx}>
              <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                {category.category}
              </h4>
              <div className="space-y-2">
                {category.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-center gap-2">
                    {category.category === "自訂服務" ? (
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          updateCustomItemName(catIdx, itemIdx, e.target.value)
                        }
                        placeholder="服務名稱"
                        className="flex-1 py-1.5 px-2 text-xs bg-transparent border border-border rounded-lg focus:border-foreground focus:outline-none transition-colors"
                      />
                    ) : (
                      <span className="flex-1 text-xs text-foreground">
                        {item.name}
                      </span>
                    )}
                    <input
                      type="text"
                      value={item.price}
                      onChange={(e) =>
                        updateItemPrice(catIdx, itemIdx, e.target.value)
                      }
                      placeholder="NT$"
                      className="w-24 py-1.5 px-2 text-xs text-right bg-transparent border border-border rounded-lg focus:border-foreground focus:outline-none transition-colors"
                    />
                    {category.category === "自訂服務" && (
                      <button
                        onClick={() => removeCustomItem(catIdx, itemIdx)}
                        className="p-1 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addCustomItem}
          className="w-full mt-4 py-2 border border-dashed border-border rounded-xl text-xs text-muted-foreground hover:border-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          新增自訂服務項目
        </button>

        <button
          onClick={() => onSave(localMenu)}
          className="w-full mt-4 py-2.5 bg-foreground text-background rounded-xl text-xs font-medium hover:opacity-90 transition-opacity"
        >
          儲存變更
        </button>
      </div>
    </div>
  );
}
