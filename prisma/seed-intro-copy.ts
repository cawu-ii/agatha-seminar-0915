// One-time seed for the intro lead paragraph + "Who should attend" callout
// body that used to be hardcoded in app/seminar/0915/page.tsx (openspec:
// add-intro-copy-cms). Run manually once when the IntroCopy table is empty
// (see README) - not wired into migrate/build so it can't accidentally
// re-run and duplicate rows on a second deploy.
import { PrismaClient, IntroCopyField } from "@prisma/client";

const prisma = new PrismaClient();

const BLOCKS: Array<{ field: IntroCopyField; body: string }> = [
  {
    field: IntroCopyField.LEAD,
    body: "當 Agentic AI 進入應用爆發期，真正的關鍵不在「用了多少 AI」，而在能不能把 AI 嵌進企業既有的產、銷、人、發、財流程，讓它可用、可控、可治理。Agatha 以雲地整合與治理為底層，協助製造業把單點試用，變成全員可用、可被交付與衡量的日常戰力——讓 AI 真正驅動生產力與 ROI，落在營運成果上。",
  },
  {
    field: IntroCopyField.ATTENDEE,
    body: "專為**製造業經營者、IT 與營運決策者**量身打造。9/15，一次看懂「可使用、可管控、可治理」的代理式 AI，如何成為驅動企業生產力的智慧戰略中心。",
  },
];

async function main() {
  const existing = await prisma.introCopy.count();
  if (existing > 0) {
    console.log(`IntroCopy already has ${existing} row(s) - skipping seed to avoid duplicates.`);
    return;
  }

  for (const block of BLOCKS) {
    await prisma.introCopy.create({ data: block });
  }
  console.log(`Seeded ${BLOCKS.length} intro-copy blocks.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
