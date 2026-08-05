import { FormOptionField } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { FormOptionsByField } from "@/lib/registration-schema";

/** Validates the `[field]` URL param against the known enum - shared by the three admin CRUD route groups. */
export function parseFormOptionField(raw: string): FormOptionField | null {
  return (Object.values(FormOptionField) as string[]).includes(raw) ? (raw as FormOptionField) : null;
}

const FIELD_KEY_MAP = {
  DEPT: "dept",
  TITLE: "title",
  INDUSTRY: "industry",
  SIZE: "size",
  SESSIONS: "sessions",
  STAGE: "stage",
  CONSULT: "consult",
} as const;

/** Queries current admin-configured option values, grouped by field, for both form rendering and registration validation (openspec: add-form-options-cms). */
export async function loadFormOptions(): Promise<FormOptionsByField> {
  const rows = await prisma.formOption.findMany({ orderBy: [{ field: "asc" }, { sortOrder: "asc" }] });

  const grouped: FormOptionsByField = {
    dept: [],
    title: [],
    industry: [],
    size: [],
    sessions: [],
    stage: [],
    consult: [],
  };

  for (const row of rows) {
    grouped[FIELD_KEY_MAP[row.field]].push(row.value);
  }

  return grouped;
}
