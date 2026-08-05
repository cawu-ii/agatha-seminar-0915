// One-time seed for the speaker content that used to be hardcoded in
// app/seminar/0915/page.tsx. Run manually once when the Speaker table is
// empty (see README) - not wired into migrate/build so it can't accidentally
// re-run and duplicate rows on a second deploy.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SPEAKERS: Array<{
  name: string;
  title: string;
  bio: string;
  photoUrl: string | null;
  confirmed: boolean;
}> = [
  {
    name: "石浩吉",
    title: "今晧實業暨湧現智庫董事長",
    bio: "帶領今晧從 40 年連接線製造，跨足 AI 軟硬體生態系佈局。以經營者視角，分享傳統製造企業啟動 AI 轉型的戰略思路與親身實戰。",
    photoUrl: "/images/asset-cd6e2c579d.jpg",
    confirmed: true,
  },
  {
    name: "林書琦",
    title: "湧現智庫商務開發副總",
    bio: "第一線協助製造業導入 Agatha 的商務負責人。將拆解雲地整合平台如何串接 ERP、驅動「產、銷、人、發、財」五大流程。",
    photoUrl: "/images/asset-ed714b886a.jpg",
    confirmed: true,
  },
  {
    name: "傅子維",
    title: "湧現智庫技術長",
    bio: "主導 Agatha 平台架構，專注非硬編碼的 Agent 架構與資料治理。將示範如何設計可被交付、可衡量、可管理的 AI Agent 工作流。",
    photoUrl: "/images/asset-d7d77edfc5.jpg",
    confirmed: true,
  },
  {
    name: "陳伊誠",
    title: "金屬工業研究發展中心 產業創新服務組組長",
    bio: "熟悉製造業創新輔導資源，將盤點企業 AI 轉型可申請的政府補助與輔導方案，協助企業降低轉型的第一道門檻。",
    photoUrl: null,
    confirmed: true,
  },
  {
    name: "廖志偉 博士（Dr. Frank Liao）",
    title: "AIFT 商務合作總監",
    bio: "Frank 在企業數位轉型與技術創新領域有超過十年的實戰經驗，長期協助金融、保險與製造等高度監管產業導入創新技術。曾任職於國泰金控、國泰人壽與台灣王道銀行，專注於創新專案推進、系統落地規劃與風險控管等。目前在 AIFT 推動生成式 AI 與 AI Agent 的資安解決方案 Vulcan，協助金融、製造及其他各產業，在導入 AI 的同時兼顧安全與合規。",
    photoUrl: "/images/asset-e0a7f92abb.jpg",
    confirmed: true,
  },
  {
    name: "劉涵竹",
    title: "主持人",
    bio: "資深財經主播、主持人，歷任非凡新聞、三立 iNEWS、中天、東森財經新聞台，以財經專業串接全場議程與 Panel 對談。",
    photoUrl: "/images/asset-8caa1bf6e1.jpg",
    confirmed: true,
  },
  {
    name: "優達科技",
    title: "講者待確認",
    bio: "以製造業第一線導入者身分現身說法，分享 Agentic AI 從單點試用到全員上手的真實經驗。",
    photoUrl: null,
    confirmed: false,
  },
  {
    name: "資策會",
    title: "講者待確認",
    bio: "從產業推動視角，補充製造業 AI 導入的整體觀察與資源觀點。",
    photoUrl: null,
    confirmed: false,
  },
];

async function main() {
  const existing = await prisma.speaker.count();
  if (existing > 0) {
    console.log(`Speaker already has ${existing} row(s) - skipping seed to avoid duplicates.`);
    return;
  }

  for (let i = 0; i < SPEAKERS.length; i++) {
    const speaker = SPEAKERS[i];
    await prisma.speaker.create({
      data: { ...speaker, sortOrder: (i + 1) * 10 },
    });
  }
  console.log(`Seeded ${SPEAKERS.length} speakers.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
