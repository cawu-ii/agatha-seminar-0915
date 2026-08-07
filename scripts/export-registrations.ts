// CTO-only export (data-export capability). Run with: npm run export:registrations
// Deliberately not reachable from PR-role /admin sessions - see admin-console spec.
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";
import { buildRegistrationsWorkbook, exportFileName } from "../lib/export-workbook";

async function main() {
  const registrations = await prisma.registration.findMany({
    where: { archived: false },
    orderBy: { createdAt: "asc" },
  });
  const workbook = buildRegistrationsWorkbook(registrations);

  const outDir = path.join(process.cwd(), "exports");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, exportFileName());
  await workbook.xlsx.writeFile(outPath);

  console.log(`Exported ${registrations.length} registrations to ${outPath}`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
