"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/* ========================================
   Legal Disclaimer Clauses
======================================== */

const DISCLAIMER_CLAUSES = [
  {
    title: "📋 資料來源說明",
    content:
      "本平台所有店家資訊（包括但不限於價格、服務項目、營業時間等）均由社群讀者自主提交貢獻，屬「Wiki 式共創內容」。平台已盡合理努力審核資訊正確性，但建議消費前務必直接與店家確認最新報價與服務細節，以免實際情況有所出入。",
  },
  {
    title: "💬 社群言論立場",
    content:
      "讀者評價與留言內容僅代表該用戶個人觀點，不代表本平台立場。平台不為任何用戶生成內容（UGC）的真實性、完整性或時效性負擔法律責任。如發現不當言論，歡迎透過客服管道檢舉。",
  },
  {
    title: "📸 著作權與圖片聲明",
    content:
      "平台上的作品圖片均由讀者或店家授權上傳，未經授權嚴禁轉載、重製或商業使用。若您認為任何圖片或內容侵犯了您的著作權，請聯繫我們提供侵權內容的具體位置與權利證明，我們將在收到通知後儘速處理下架。",
  },
  {
    title: "💰 價格時效性提示",
    content:
      "本平台所載價格為社群回報之參考資訊，實際消費金額可能因指甲狀況、造型複雜度、美甲師資歷等因素而有所調整。建議預約時主動向店家確認最終報價，以免產生預期落差。",
  },
];

/* ========================================
   Legal Disclaimer Component
======================================== */

export default function LegalDisclaimer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 px-3 border border-border/50 rounded-lg hover:bg-secondary/30 transition-colors"
      >
        <span className="text-[10px] text-muted-foreground/60">
          讀者閱讀須知與免責聲明
        </span>
        {isOpen ? (
          <ChevronUp className="w-3 h-3 text-muted-foreground/40" />
        ) : (
          <ChevronDown className="w-3 h-3 text-muted-foreground/40" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2 px-3 py-3 border border-border/30 rounded-lg bg-secondary/20">
          <div className="space-y-3">
            {DISCLAIMER_CLAUSES.map((clause, idx) => (
              <div key={idx}>
                <h4 className="text-[10px] text-muted-foreground/70 font-medium mb-1">
                  {clause.title}
                </h4>
                <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                  {clause.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
