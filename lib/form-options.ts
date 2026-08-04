// Exact option values from the approved design (agatha-seminar-landing-0803.html #regform).
// Shared by the client form and the server-side validation schema so they can never drift apart.

export const DEPT_OPTIONS = [
  "經營管理層",
  "數位轉型/戰略規劃部",
  "資訊部 / MIS / 系統開發部",
  "生產管理 / 廠務部",
  "研發設計 / 工程部",
  "供應鏈 / 物流採購部",
  "品質保證 / 品管部",
  "業務 / 行銷部",
  "其他",
] as const;

export const TITLE_OPTIONS = [
  "公司負責人/總經理/高階主管",
  "AI/數位轉型負責人",
  "IT部門主管",
  "廠長/生產管理",
  "行銷/業務主管",
  "其他",
] as const;

export const INDUSTRY_OPTIONS = ["電子零組件", "半導體", "機械製造", "汽車製造", "醫療器材", "其他"] as const;

export const SIZE_OPTIONS = ["50人以下", "50-200人", "200-500人", "500人以上"] as const;

export const SESSION_OPTIONS = [
  "Agatha Agentic AI 雲地整合平台介紹",
  "製造業政府補助方案",
  "企業AI資安與治理實務",
  "AI Agent 治理調度與核心技術",
  "代理式AI導入實戰 Panel 對談",
] as const;

export const STAGE_OPTIONS = [
  "正在評估導入 AI，處於 PoC 階段",
  "已有部分 AI 應用，但苦於跨系統整合/治理問題",
  "生產流程自動化瓶頸",
  "尚未規劃，僅先了解產業趨勢",
  "其他",
] as const;

export const CONSULT_OPTIONS = [
  "私有雲/地端 AI 部署",
  "ERP/MES 數據串接",
  "AI Agent應用場景開發",
  "AI 治理內控與稽核防護",
  "其他",
] as const;
