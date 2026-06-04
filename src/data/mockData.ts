// Mock data structured to match future Supabase tables

export interface PriceMenuItem {
  category: string;
  items: { name: string; price: string }[];
}

export interface Store {
  id: string;
  name: string;
  ig_username: string;
  area: string;
  banner_url: string;
  avg_duration_hours: number;
  retention_rate: number;
  vibe_tag: string;
  specialties: { name: string; percentage: number }[];
  tags: string[]; // All tags for filtering
  calculated_avg_price?: number; // Crowdsourced average price from reviews
  manicurists?: string[]; // Recommended manicurist names
  image_urls?: string[]; // Store submission images
  visit_count?: number; // "Been here" reader counter
  price_menu?: PriceMenuItem[]; // Temporal Wiki-style price menu
  menu_updated_at?: string; // ISO timestamp of last price menu update
  is_official?: boolean; // Official merchant verification badge
  // IG Association fields
  parent_salon_ig?: string; // Parent salon IG username for filtering
  parent_salon_name?: string; // Parent salon display name
  single_color_price?: number; // Single color base price
  // 3D Vibe voting fields
  vote_skill?: number; // 👍 寶藏推推 count
  vote_aesthetic?: number; // 🤍 氛圍絕美 count
  vote_service?: number; // 🧘 完全不尬聊 count
  voted_by_skill?: string[]; // User IDs who voted skill
  voted_by_aesthetic?: string[]; // User IDs who voted aesthetic
  voted_by_service?: string[]; // User IDs who voted service
  // UGC 2.0: Dynamic average fields (updated by triggers)
  avg_actual_duration?: number;
  returning_rate?: number;
  top_tags?: string[]; // Top 3 most voted tags from tag_votes
}

export interface Review {
  id: string;
  store_id: string;
  user_id?: string; // User ID of the review author
  nickname: string;
  comment: string;
  tags: string[];
  has_proof: boolean;
  created_at: string;
  manicurist_name?: string; // Optional manicurist name
  actual_price?: number; // Actual price paid (NT$)
  image_urls?: string[]; // Review photo attachments
  // UGC 2.0: Structured feedback fields
  retention_feedback?: string;
  price_transparency?: string;
  env_tags?: string[];
  report_count?: number;
  parent_id?: string | null;
  proof_requests?: number;
  actual_duration?: number;
  is_returning?: boolean;
}

export interface StoreVisit {
  id: string;
  store_id: string;
  user_id: string;
  created_at: string;
}

// Tiered Filter Taxonomy
export interface FilterCategory {
  id: string;
  label: string;
  labelEn: string;
  subTags: string[];
}

export const filterCategories: FilterCategory[] = [
  {
    id: "district",
    label: "地區",
    labelEn: "District",
    subTags: [
      "中區", "東區", "西區", "南區", "北區",
      "西屯區", "南屯區", "北屯區", "豐原區", "大里區",
      "太平區", "清水區", "沙鹿區", "大甲區", "東勢區",
      "梧棲區", "烏日區", "神岡區", "大肚區", "大雅區",
      "后里區", "霧峰區", "潭子區", "龍井區", "外埔區",
      "和平區", "石岡區", "大安區", "新社區"
    ],
  },
  {
    id: "style",
    label: "風格派系",
    labelEn: "Style",
    subTags: ["日系", "韓系", "歐美", "中式"],
  },
  {
    id: "technique",
    label: "核心工藝",
    labelEn: "Technique",
    subTags: [
      "法式",
      "貓眼",
      "漸變",
      "純色",
      "暈染",
      "手繪",
      "鏡面",
      "磨砂",
      "3D立體/浮雕",
      "燙金/金屬箔",
      "珠光/水彩",
    ],
  },
  {
    id: "shape",
    label: "專屬甲型",
    labelEn: "Shape",
    subTags: [
      "橢圓形",
      "方圓形",
      "方形",
      "杏仁形",
      "梯形",
      "圓形",
      "尖形",
    ],
  },
  {
    id: "experience",
    label: "沙龍體驗",
    labelEn: "Experience",
    subTags: [
      "I人友善",
      "E人天堂",
      "不強迫推銷",
      "建構不加價",
      "不分款",
    ],
  },
  {
    id: "budget",
    label: "預算區間",
    labelEn: "Budget",
    subTags: ["1000元以下", "1000-1500元", "1500-2000元", "2000元以上"],
  },
  {
    id: "material",
    label: "技術/材質/裝飾",
    labelEn: "Material & Decoration",
    subTags: [
      "甲油膠", "水晶甲", "光療延長", "丙烯彩繪", "浸粉/蘸粉",
      "穿戴甲", "拍拍膠", "平面", "立體", "功能性"
    ],
  },
];

export const areaOptions = [
  "中區", "東區", "西區", "南區", "北區",
  "西屯區", "南屯區", "北屯區", "豐原區",
  "大里區", "太平區", "清水區", "沙鹿區",
  "大甲區", "東勢區", "梧棲區", "烏日區",
  "神岡區", "大肚區", "大雅區", "后里區",
  "霧峰區", "潭子區", "龍井區", "外埔區",
  "和平區", "石岡區", "大安區", "新社區",
];

export const reviewTags = {
  positive: [
    "維持度極佳",
    "動作迅速",
    "完全不推銷",
    "建構扎實",
    "暈染專業",
    "溝通仔細",
    "環境舒適",
  ],
  warning: [
    "建構稍薄",
    "稍微溢膠",
    "現場有加價項目",
    "等候時間較長",
    "價位偏高",
  ],
};

// Tags used in the submission form
export const submissionTags = [
  "擅長暈染",
  "過程不尬聊",
  "價格透明",
  "動作迅速",
  "建構扎實",
  "咬甲矯正",
  "手繪設計",
  "韓系清透",
];

// Keywords to determine warning tags in review cards
export const warningKeywords = ["加價", "溢膠", "偏高", "稍微", "稍薄", "但"];

export const mockStores: Store[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "nüance.",
    ig_username: "nuance_nail_tc",
    area: "西屯區",
    banner_url: "/placeholder-salon-1.jpg",
    avg_duration_hours: 1.5,
    retention_rate: 94,
    vibe_tag: "過程安靜不尬聊",
    specialties: [
      { name: "日系暈染", percentage: 80 },
      { name: "建構式專門", percentage: 20 },
    ],
    tags: [
      "日系細膩",
      "水墨暈染",
      "優雅杏仁",
      "I人友善(不尬聊)",
      "絕不強迫推銷",
    ],
    calculated_avg_price: 1350,
    manicurists: ["Amber", "Vivi"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    name: "Le Blanc Nail",
    ig_username: "leblanc_nail",
    area: "西區",
    banner_url: "/placeholder-salon-2.jpg",
    avg_duration_hours: 1.5,
    retention_rate: 92,
    vibe_tag: "過程安靜不尬聊",
    specialties: [
      { name: "簡約質感", percentage: 65 },
      { name: "極致單色", percentage: 35 },
    ],
    tags: ["韓系簡約", "純色", "方圓形", "職場低調", "I人友善(不尬聊)"],
    calculated_avg_price: 1200,
    manicurists: ["Lynn"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    name: "Studio S.",
    ig_username: "studio_s_nail",
    area: "北區",
    banner_url: "/placeholder-salon-3.jpg",
    avg_duration_hours: 2.0,
    retention_rate: 90,
    vibe_tag: "過程安靜不尬聊",
    specialties: [
      { name: "手繪設計", percentage: 70 },
      { name: "客製款", percentage: 30 },
    ],
    tags: ["日系細膩", "精細手繪", "芭蕾梯形", "婚甲訂製", "不分款到好"],
    calculated_avg_price: 1800,
    manicurists: ["Sara", "Mia"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    name: "lián nail",
    ig_username: "lian_nail_tc",
    area: "南屯區",
    banner_url: "/placeholder-salon-4.jpg",
    avg_duration_hours: 1.5,
    retention_rate: 93,
    vibe_tag: "過程安靜不尬聊",
    specialties: [
      { name: "韓系清透", percentage: 55 },
      { name: "咬甲矯正", percentage: 45 },
    ],
    tags: ["韓系簡約", "漸變", "橢圓形", "問題指甲矯正", "絕不強迫推銷"],
    calculated_avg_price: 1100,
    manicurists: ["Chen"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440005",
    name: "noir.",
    ig_username: "noir_nail_art",
    area: "北屯區",
    banner_url: "/placeholder-salon-5.jpg",
    avg_duration_hours: 1.5,
    retention_rate: 91,
    vibe_tag: "過程安靜不尬聊",
    specialties: [
      { name: "個性設計", percentage: 60 },
      { name: "霧面質感", percentage: 40 },
    ],
    tags: ["歐美大膽", "魔鏡金屬", "修長尖形", "E人天堂(好聊)", "加建構不加價"],
    calculated_avg_price: 1600,
    manicurists: ["Nora"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440006",
    name: "i'm. nail",
    ig_username: "im_nail_tc",
    area: "西區",
    banner_url: "/placeholder-salon-6.jpg",
    avg_duration_hours: 1.8,
    retention_rate: 92,
    vibe_tag: "過程安靜不尬聊",
    specialties: [
      { name: "建構式延甲", percentage: 50 },
      { name: "精準修型", percentage: 50 },
    ],
    tags: ["日系細膩", "3D立體", "經典方形", "問題指甲矯正", "加建構不加價"],
    calculated_avg_price: 1400,
    manicurists: ["Ivy"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440007",
    name: "m̀ nail atelier",
    ig_username: "m_nail_atelier",
    area: "太平區",
    banner_url: "/placeholder-salon-7.jpg",
    avg_duration_hours: 1.6,
    retention_rate: 90,
    vibe_tag: "過程安靜不尬聊",
    specialties: [
      { name: "法式優雅", percentage: 65 },
      { name: "細節控", percentage: 35 },
    ],
    tags: ["中式古典", "金箔箔紙", "優雅杏仁", "婚甲訂製", "不分款到好"],
    calculated_avg_price: 2200,
    manicurists: ["Mona"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440008",
    name: "Linē Nail",
    ig_username: "line_nail_tc",
    area: "南屯區",
    banner_url: "/placeholder-salon-8.jpg",
    avg_duration_hours: 1.5,
    retention_rate: 92,
    vibe_tag: "過程安靜不尬聊",
    specialties: [
      { name: "自然系色調", percentage: 70 },
      { name: "裸肌感", percentage: 30 },
    ],
    tags: ["韓系簡約", "純色", "橢圓形", "孕婦兒童友善", "絕不強迫推銷"],
    calculated_avg_price: 1000,
    manicurists: ["Lin"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440009",
    name: "shiro.",
    ig_username: "shiro_nail_tc",
    area: "大里區",
    banner_url: "/placeholder-salon-9.jpg",
    avg_duration_hours: 1.5,
    retention_rate: 91,
    vibe_tag: "過程安靜不尬聊",
    specialties: [
      { name: "日系簡約", percentage: 60 },
      { name: "乾淨透明感", percentage: 40 },
    ],
    tags: ["日系細膩", "漸變", "方圓形", "出國度假長效", "I人友善(不尬聊)"],
    calculated_avg_price: 1300,
    manicurists: ["Yuki"],
  },
];

export const mockReviews: Review[] = [
  {
    id: "rev-001",
    store_id: "550e8400-e29b-41d4-a716-446655440001",
    nickname: "Anonymous Reader",
    comment:
      "做完4週還很完整，邊緣沒有浮起也沒有斷裂。全程幾乎沒什麼聊天，超級放鬆很享受，作品也很細緻，會再回訪。",
    tags: ["維持度極佳", "完全不推銷", "邊緣乾淨俐落"],
    has_proof: true,
    created_at: "2024.05.12",
    manicurist_name: "Amber",
    actual_price: 1500,
  },
  {
    id: "rev-002",
    store_id: "550e8400-e29b-41d4-a716-446655440001",
    nickname: "Anonymous Reader",
    comment:
      "第一次遇到完全不推銷的美甲師，太加分了！速度快但很仔細，指型調得很漂亮，維持度超過一個月沒問題。",
    tags: ["完全不推銷", "動作迅速", "維持度極佳"],
    has_proof: true,
    created_at: "2024.04.28",
    manicurist_name: "Vivi",
    actual_price: 1200,
  },
  {
    id: "rev-003",
    store_id: "550e8400-e29b-41d4-a716-446655440001",
    nickname: "Anonymous Reader",
    comment:
      "環境很舒適，光線很好，美甲師會仔細溝通想要的樣式。稍微溢膠但整體還是很滿意。",
    tags: ["環境舒適", "溝通仔細", "稍微溢膠"],
    has_proof: true,
    created_at: "2024.04.15",
    actual_price: 1350,
  },
  {
    id: "rev-004",
    store_id: "550e8400-e29b-41d4-a716-446655440001",
    nickname: "Anonymous Reader",
    comment:
      "來這邊做了快一年了，每次成品都很滿意。特別推薦他們的極光色系暈染，真的超美！",
    tags: ["暈染專業", "維持度極佳", "建構扎實"],
    has_proof: true,
    created_at: "2024.03.22",
    manicurist_name: "Amber",
    actual_price: 1350,
  },
  {
    id: "rev-005",
    store_id: "550e8400-e29b-41d4-a716-446655440002",
    nickname: "Anonymous Reader",
    comment:
      "專門來做咬甲矯正的，美甲師非常有耐心，也會教你怎麼保養。已經做了三個月，指甲真的長回來了！",
    tags: ["溝通仔細", "建構扎實"],
    has_proof: true,
    created_at: "2024.01.12",
    manicurist_name: "Lynn",
    actual_price: 1200,
  },
  {
    id: "rev-006",
    store_id: "550e8400-e29b-41d4-a716-446655440002",
    nickname: "Anonymous Reader",
    comment:
      "價格偏中高，但技術真的很好。建構做得很紮實，撐了快五週才開始有點翹。",
    tags: ["建構扎實", "維持度極佳", "價位偏高"],
    has_proof: true,
    created_at: "2024.01.08",
    actual_price: 1200,
  },
];
