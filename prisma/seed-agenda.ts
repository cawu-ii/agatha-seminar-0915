// One-time seed for the agenda content that used to be hardcoded in
// app/seminar/0915/page.tsx. Run manually once when the AgendaItem table is
// empty (see README) - not wired into migrate/build so it can't accidentally
// re-run and duplicate rows on a second deploy.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AGENDA: Array<{
  timeLabel: string;
  title: string;
  speaker: string | null;
  isBreak: boolean;
}> = [
  {
    timeLabel: "13:30–13:35",
    title: "開場：從製造 40 年到 AI 元年——傳統製造企業的 AI 戰略佈局",
    speaker: "今晧實業暨湧現智庫董事長｜石浩吉",
    isBreak: false,
  },
  {
    timeLabel: "13:35–14:00",
    title: "Agatha 企業級 Agentic AI 平台：雲地整合、串接 ERP、驅動五大流程",
    speaker: "湧現智庫商務開發副總｜林書琦",
    isBreak: false,
  },
  {
    timeLabel: "14:00–14:20",
    title: "製造業 AI 轉型的政府資源與補助解析",
    speaker: "金屬工業研究發展中心 產業創新服務組組長｜陳伊誠",
    isBreak: false,
  },
  {
    timeLabel: "14:20–14:40",
    title: "AI 駕馭工程的時代：管理 AI Agent 的資安關鍵",
    speaker: "AIFT 商務合作總監 廖志偉 博士（Dr. Frank Liao）",
    isBreak: false,
  },
  {
    timeLabel: "14:40–14:55",
    title: "中場休息・攤位交流",
    speaker: null,
    isBreak: true,
  },
  {
    timeLabel: "14:55–15:20",
    title: "企業 Agent 落地實戰：如何設計可被交付、可衡量、可管理的工作流",
    speaker: "湧現智庫技術長｜傅子維",
    isBreak: false,
  },
  {
    timeLabel: "15:20–15:45",
    title: "【Panel】從單點試用到全員上手：製造業 Agentic AI 落地的真實代價與回報",
    speaker: "石浩吉 × 林書琦 × 優達科技〔待確認〕｜主持人 劉涵竹",
    isBreak: false,
  },
  {
    timeLabel: "15:45–16:30",
    title: "交流時間・填問卷兌換好禮",
    speaker: null,
    isBreak: true,
  },
];

async function main() {
  const existing = await prisma.agendaItem.count();
  if (existing > 0) {
    console.log(`AgendaItem already has ${existing} row(s) - skipping seed to avoid duplicates.`);
    return;
  }

  for (let i = 0; i < AGENDA.length; i++) {
    const item = AGENDA[i];
    await prisma.agendaItem.create({
      data: { ...item, sortOrder: (i + 1) * 10 },
    });
  }
  console.log(`Seeded ${AGENDA.length} agenda items.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
