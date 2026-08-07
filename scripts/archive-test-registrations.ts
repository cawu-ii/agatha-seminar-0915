// CTO-only production cleanup helper (openspec: add-cto-archive-registrations).
// Never deletes - only flips the same `archived` boolean the /admin archive
// button uses, so anything archived here can be reversed later from /admin.
//
// Usage (run on the EC2 instance, from the project directory):
//   npx tsx scripts/archive-test-registrations.ts
//     -> dry run: lists every currently non-archived registration, does nothing
//   npx tsx scripts/archive-test-registrations.ts --all --confirm
//     -> archives every currently non-archived registration
//   npx tsx scripts/archive-test-registrations.ts --ids <id1>,<id2> --confirm
//     -> archives only the listed registration ids
import { prisma } from "../lib/prisma";

async function main() {
  const args = process.argv.slice(2);
  const confirm = args.includes("--confirm");
  const all = args.includes("--all");
  const idsArg = args.find((a) => a.startsWith("--ids="))?.slice("--ids=".length);
  const ids = idsArg ? idsArg.split(",").map((s) => s.trim()).filter(Boolean) : null;

  if (!all && !ids) {
    const rows = await prisma.registration.findMany({
      where: { archived: false },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, company: true, email: true, createdAt: true },
    });
    console.log(`目前有 ${rows.length} 筆未封存的報名資料：\n`);
    for (const r of rows) {
      console.log(`${r.id}  ${r.createdAt.toISOString()}  ${r.name} / ${r.company} / ${r.email}`);
    }
    console.log(
      "\n（僅列出，未做任何變更）要封存，加上 --all 或 --ids=<id1>,<id2> 並加上 --confirm 才會實際執行。"
    );
    await prisma.$disconnect();
    return;
  }

  const where = ids ? { id: { in: ids } } : { archived: false };
  const targets = await prisma.registration.findMany({
    where,
    select: { id: true, name: true, company: true, email: true },
  });

  console.log(`即將封存 ${targets.length} 筆報名資料：`);
  for (const r of targets) {
    console.log(`${r.id}  ${r.name} / ${r.company} / ${r.email}`);
  }

  if (!confirm) {
    console.log("\n（未加 --confirm，僅預覽，未做任何變更）");
    await prisma.$disconnect();
    return;
  }

  const result = await prisma.registration.updateMany({
    where: { id: { in: targets.map((t) => t.id) } },
    data: { archived: true },
  });
  console.log(`\n已封存 ${result.count} 筆（資料仍在資料庫中，可在 /admin 用「顯示已封存」+「取消封存」還原）。`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
