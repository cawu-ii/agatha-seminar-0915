// One-time seed for the "活動資訊" fact cards that used to be hardcoded in
// app/seminar/0915/page.tsx. Run manually once when the EventInfo table is
// empty (see README) - not wired into migrate/build so it can't accidentally
// re-run and duplicate rows on a second deploy. No seed needed for Banner -
// there is no existing hardcoded banner image to migrate forward.
import { PrismaClient, EventInfoField } from "@prisma/client";

const prisma = new PrismaClient();

const FACTS: Array<{ field: EventInfoField; line1: string; line2: string | null; subText: string | null }> = [
  { field: EventInfoField.DATE, line1: "2026.09.15", line2: null, subText: "星期二" },
  { field: EventInfoField.TIME, line1: "13:30–16:30", line2: null, subText: "共 3 小時" },
  { field: EventInfoField.VENUE, line1: "華南銀行", line2: "國際會議中心", subText: "台北" },
  { field: EventInfoField.ACCESS, line1: "免費參加", line2: null, subText: "採資格審核 · 名額有限" },
];

async function main() {
  const existing = await prisma.eventInfo.count();
  if (existing > 0) {
    console.log(`EventInfo already has ${existing} row(s) - skipping seed to avoid duplicates.`);
    return;
  }

  for (const fact of FACTS) {
    await prisma.eventInfo.create({ data: fact });
  }
  console.log(`Seeded ${FACTS.length} event-info facts.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
