// One-time seed for the registration form's option lists, migrating the
// hardcoded constants in lib/form-options.ts into the database. Run manually
// once when the FormOption table is empty (see README) - not wired into
// migrate/build so it can't accidentally re-run and duplicate rows on a
// second deploy.
import { PrismaClient, FormOptionField } from "@prisma/client";
import {
  CONSULT_OPTIONS,
  DEPT_OPTIONS,
  INDUSTRY_OPTIONS,
  SESSION_OPTIONS,
  SIZE_OPTIONS,
  STAGE_OPTIONS,
  TITLE_OPTIONS,
} from "../lib/form-options";

const prisma = new PrismaClient();

const FIELD_OPTIONS: Array<{ field: FormOptionField; values: readonly string[] }> = [
  { field: FormOptionField.DEPT, values: DEPT_OPTIONS },
  { field: FormOptionField.TITLE, values: TITLE_OPTIONS },
  { field: FormOptionField.INDUSTRY, values: INDUSTRY_OPTIONS },
  { field: FormOptionField.SIZE, values: SIZE_OPTIONS },
  { field: FormOptionField.SESSIONS, values: SESSION_OPTIONS },
  { field: FormOptionField.STAGE, values: STAGE_OPTIONS },
  { field: FormOptionField.CONSULT, values: CONSULT_OPTIONS },
];

async function main() {
  const existing = await prisma.formOption.count();
  if (existing > 0) {
    console.log(`FormOption already has ${existing} row(s) - skipping seed to avoid duplicates.`);
    return;
  }

  let total = 0;
  for (const { field, values } of FIELD_OPTIONS) {
    for (let i = 0; i < values.length; i++) {
      await prisma.formOption.create({
        data: { field, value: values[i], sortOrder: (i + 1) * 10 },
      });
      total++;
    }
  }
  console.log(`Seeded ${total} form options across ${FIELD_OPTIONS.length} fields.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
