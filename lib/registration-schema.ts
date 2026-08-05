import { z } from "zod";

// Values for these 7 fields are admin-editable (openspec: add-form-options-cms)
// and queried fresh per request in app/api/register/route.ts - the schema can
// no longer be a fixed module-scope constant like it was when the option
// lists were compile-time constants in lib/form-options.ts.
export type FormOptionFieldKey = "dept" | "title" | "industry" | "size" | "sessions" | "stage" | "consult";

export type FormOptionsByField = Record<FormOptionFieldKey, string[]>;

/** z.enum requires a non-empty tuple - callers must guarantee every field has at least one option (enforced at the admin delete endpoint, see design.md). */
function nonEmptyTuple(values: string[]): [string, ...string[]] {
  if (values.length === 0) {
    throw new Error("FormOption field has zero options - cannot build validation schema");
  }
  return [values[0], ...values.slice(1)];
}

export function buildRegistrationSchema(options: FormOptionsByField) {
  return z.object({
    idempotencyKey: z.string().min(1),

    name: z.string().min(1, "請填寫姓名"),
    company: z.string().min(1, "請填寫公司名稱"),
    taxId: z.string().min(1, "請填寫公司統編"),

    dept: z.enum(nonEmptyTuple(options.dept)),
    deptOther: z.string().optional().default(""),

    title: z.enum(nonEmptyTuple(options.title)),
    titleOther: z.string().optional().default(""),

    industry: z.enum(nonEmptyTuple(options.industry)),
    industryOther: z.string().optional().default(""),

    size: z.enum(nonEmptyTuple(options.size)),

    email: z.string().email("請填寫正確的 Email 格式"),
    phone: z.string().min(1, "請填寫聯絡電話"),

    sessions: z.array(z.enum(nonEmptyTuple(options.sessions))).min(1, "請至少選擇一項"),

    stage: z.enum(nonEmptyTuple(options.stage)),
    stageOther: z.string().optional().default(""),

    consult: z.array(z.enum(nonEmptyTuple(options.consult))).min(1, "請至少選擇一項"),
    consultOther: z.string().optional().default(""),

    agreeTerms: z.literal(true, { errorMap: () => ({ message: "請同意個資使用條款" }) }),
    agreeMarketing: z.boolean().optional().default(false),

    utm_source: z.string().optional().default(""),
    utm_medium: z.string().optional().default(""),
    utm_campaign: z.string().optional().default(""),
    utm_content: z.string().optional().default(""),
  });
}

export type RegistrationInput = z.infer<ReturnType<typeof buildRegistrationSchema>>;
