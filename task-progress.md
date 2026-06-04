# Task Progress: Global Font & Breathing Space Optimization ✅

## Completed

### 1. NailPriceMenu.tsx — Price Menu Font Upgrade ✅
- Category titles: `text-[10px]` → `text-sm` (14px)
- Item names: `text-xs` → `text-base` (16px) + `font-medium`
- Prices: `text-xs` → `text-lg` (18px) + `font-semibold`
- Row padding: added `py-2` to each price row
- Edit button: `text-[10px]` → `text-xs` with larger padding `px-3 py-1.5`
- Timestamp: `text-[10px]` → `text-xs`
- Edit modal labels: `text-[10px]` → `text-xs`
- Section titles: `text-[10px]` → `text-sm` (14px)

### 2. StoreCard.tsx — Global Font Size Replacements ✅
- All `text-[10px]` → `text-xs` (12px) — 40+ occurrences
- All `text-[9px]` → `text-xs` (12px) — 9 occurrences
- All `text-[8px]` → `text-xs` (12px) — 6 occurrences
- All `text-[7px]` → `text-xs` (12px) — 2 occurrences
- All `text-[11px]` → `text-sm` (14px) — 1 occurrence

### 3. VoteChipPill Enhancement ✅
- Font: `text-[10px]` → `text-sm` (14px)
- Padding: `px-2.5 py-1` → `px-3 py-1.5`
- Count font: `text-[10px]` → `text-xs` (12px)

### 4. Right Side Tag Voting Area (Lightweight Hide) ✅
- Added `showAllTags` state in DetailView
- Computes `hotTags` (tags with count > 0 or isVoted, sorted by count desc, max 6)
- Shows only hotTags by default with "＋ 更多技術" button
- When hotTags is empty, shows "尚無讀者認證技術" message
- Expands to full TAG_GROUPS when "更多技術" clicked
- Tag buttons: `text-[10px]` → `text-sm` (14px), padding `px-2 py-0.5` → `px-3 py-1.5`
- Tag count: `text-[9px]` → `text-xs`
- Tag checkmark: `text-[7px]` → `text-xs`
- Category labels: `text-[10px]` → `text-xs`
- Group titles: `text-[11px]` → `text-sm`

### 5. Other DetailView Adjustments ✅
- All sub-components (ReviewCard, EditReviewForm, ReviewFormInline, TagVotingPopover, AddTagInput, CustomTagsSection, SalonCard, SalonCardList, SalonCardGrid) font sizes updated

### 6. Verification ✅
- `npm run build` — zero TypeScript errors
- All font sizes ≥ 12px confirmed via regex search
