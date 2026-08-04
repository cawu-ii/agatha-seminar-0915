import { z } from "zod";
import {
  CONSULT_OPTIONS,
  DEPT_OPTIONS,
  INDUSTRY_OPTIONS,
  SESSION_OPTIONS,
  SIZE_OPTIONS,
  STAGE_OPTIONS,
  TITLE_OPTIONS,
} from "@/lib/form-options";

export const registrationSchema = z.object({
  idempotencyKey: z.string().min(1),

  name: z.string().min(1, "請填寫姓名"),
  company: z.string().min(1, "請填寫公司名稱"),
  taxId: z.string().min(1, "請填寫公司統編"),

  dept: z.enum(DEPT_OPTIONS),
  deptOther: z.string().optional().default(""),

  title: z.enum(TITLE_OPTIONS),
  titleOther: z.string().optional().default(""),

  industry: z.enum(INDUSTRY_OPTIONS),
  industryOther: z.string().optional().default(""),

  size: z.enum(SIZE_OPTIONS),

  email: z.string().email("請填寫正確的 Email 格式"),
  phone: z.string().min(1, "請填寫聯絡電話"),

  sessions: z.array(z.enum(SESSION_OPTIONS)).min(1, "請至少選擇一項"),

  stage: z.enum(STAGE_OPTIONS),
  stageOther: z.string().optional().default(""),

  consult: z.array(z.enum(CONSULT_OPTIONS)).min(1, "請至少選擇一項"),
  consultOther: z.string().optional().default(""),

  agreeTerms: z.literal(true, { errorMap: () => ({ message: "請同意個資使用條款" }) }),
  agreeMarketing: z.boolean().optional().default(false),

  utm_source: z.string().optional().default(""),
  utm_medium: z.string().optional().default(""),
  utm_campaign: z.string().optional().default(""),
  utm_content: z.string().optional().default(""),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
