// CTO-only export (data-export capability). Run with: npm run export:registrations
// Deliberately not reachable from /admin - PR's shared password must never unlock this.
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function main() {
  const registrations = await prisma.registration.findMany({ orderBy: { createdAt: "asc" } });

  const columns = [
    "id",
    "eventId",
    "createdAt",
    "name",
    "company",
    "taxId",
    "dept",
    "deptOther",
    "title",
    "titleOther",
    "industry",
    "industryOther",
    "size",
    "email",
    "phone",
    "sessions",
    "stage",
    "stageOther",
    "consult",
    "consultOther",
    "agreeTerms",
    "agreeMarketing",
    "utmSource",
    "utmMedium",
    "utmCampaign",
    "utmContent",
    "emailStatus",
    "metaCapiStatus",
    "reviewed",
    "reviewerNote",
  ] as const;

  const lines = [columns.join(",")];
  for (const r of registrations) {
    const row = columns.map((c) => csvEscape((r as Record<string, unknown>)[c]));
    lines.push(row.join(","));
  }

  const outDir = path.join(process.cwd(), "exports");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `registrations-${new Date().toISOString().slice(0, 10)}.csv`);
  fs.writeFileSync(outPath, "﻿" + lines.join("\n"), "utf8"); // BOM so Excel opens UTF-8 Chinese correctly

  console.log(`Exported ${registrations.length} registrations to ${outPath}`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
