import ExcelJS from "exceljs";
import type { Registration } from "@prisma/client";

const COLUMNS: { header: string; key: keyof Registration; width: number }[] = [
  { header: "id", key: "id", width: 36 },
  { header: "eventId", key: "eventId", width: 36 },
  { header: "createdAt", key: "createdAt", width: 20 },
  { header: "name", key: "name", width: 14 },
  { header: "company", key: "company", width: 24 },
  { header: "taxId", key: "taxId", width: 12 },
  { header: "dept", key: "dept", width: 20 },
  { header: "deptOther", key: "deptOther", width: 16 },
  { header: "title", key: "title", width: 20 },
  { header: "titleOther", key: "titleOther", width: 16 },
  { header: "industry", key: "industry", width: 14 },
  { header: "industryOther", key: "industryOther", width: 16 },
  { header: "size", key: "size", width: 12 },
  { header: "email", key: "email", width: 26 },
  { header: "phone", key: "phone", width: 16 },
  { header: "sessions", key: "sessions", width: 30 },
  { header: "stage", key: "stage", width: 30 },
  { header: "stageOther", key: "stageOther", width: 16 },
  { header: "consult", key: "consult", width: 30 },
  { header: "consultOther", key: "consultOther", width: 16 },
  { header: "agreeTerms", key: "agreeTerms", width: 10 },
  { header: "agreeMarketing", key: "agreeMarketing", width: 14 },
  { header: "utmSource", key: "utmSource", width: 12 },
  { header: "utmMedium", key: "utmMedium", width: 12 },
  { header: "utmCampaign", key: "utmCampaign", width: 14 },
  { header: "utmContent", key: "utmContent", width: 12 },
  { header: "emailStatus", key: "emailStatus", width: 12 },
  { header: "metaCapiStatus", key: "metaCapiStatus", width: 14 },
  { header: "reviewed", key: "reviewed", width: 10 },
  { header: "reviewerNote", key: "reviewerNote", width: 20 },
];

/** Shared by scripts/export-registrations.ts, /api/export (token), and /api/admin/export (CTO session) - one definition of "what's in the export", per handoff doc v3 §6.3. */
export function buildRegistrationsWorkbook(registrations: Registration[]): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Agatha 9/15 論壇報名系統";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Registrations");
  sheet.columns = COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  sheet.getRow(1).font = { bold: true };

  for (const r of registrations) {
    sheet.addRow(r as unknown as Record<string, unknown>);
  }

  return workbook;
}

export async function workbookToBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export function exportFileName(): string {
  return `registrations-${new Date().toISOString().slice(0, 10)}.xlsx`;
}
