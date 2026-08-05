// One-time seed for the highlight content that used to be hardcoded in
// app/seminar/0915/page.tsx. Run manually once when the Highlight table is
// empty (see README) - not wired into migrate/build so it can't accidentally
// re-run and duplicate rows on a second deploy.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HIGHLIGHTS: Array<{ title: string; body: string }> = [
  {
    title: "資料不出廠的雲地整合平台",
    body: "探討開放中立、不綁單一 ERP 與模型的 Agentic AI 平台，如何在 SaaS、私有雲到地端三種部署下，把 AI 嵌進「產、銷、人、發、財」五大節點，讓企業在資料主權不外流的前提下，完成規模化導入。",
  },
  {
    title: "高科技製造的 AI 資安與可管理工作流",
    body: "高科技製造導入 AI Agent，資安與流程兩道關卡並存：員工私下用 AI、Agent 自主決策，讓資料防線與破口同步改變。本場聚焦如何把每個 Agent 設計成可交付、可衡量、可管理的工作流，行為可視可稽核，收進管得動的治理架構。",
  },
  {
    title: "從單點試用到全員上手的真實路徑",
    body: "深度剖析製造業導入 Agentic AI 的真實路徑：場景怎麼選、導入卡在哪、生產力提升多少、拿回什麼。從一家 40 年製造企業的親身佈局，到多場景的實戰回顧，拆解從單點試用到全員上手的真實代價與回報。",
  },
  {
    title: "降低轉型第一道門檻的政府資源",
    body: "盤點製造業 AI 轉型可申請的政府輔導與補助資源，從評估、申請到執行逐步說明，協助企業把「要不要投入」的門檻先降下來，搭配研究法人的產業輔導能量，讓轉型的第一步走得更穩、更有依據。",
  },
];

async function main() {
  const existing = await prisma.highlight.count();
  if (existing > 0) {
    console.log(`Highlight already has ${existing} row(s) - skipping seed to avoid duplicates.`);
    return;
  }

  for (let i = 0; i < HIGHLIGHTS.length; i++) {
    const highlight = HIGHLIGHTS[i];
    await prisma.highlight.create({
      data: { ...highlight, sortOrder: (i + 1) * 10 },
    });
  }
  console.log(`Seeded ${HIGHLIGHTS.length} highlights.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
