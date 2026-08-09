import { z } from "zod";

const requiredText = (label: string, maximum: number) =>
  z.string().trim().min(1, `${label} is required.`).max(maximum, `${label} must be ${maximum} characters or fewer.`);

const optionalText = (maximum: number) => z.string().trim().max(maximum).default("");

const websiteSchema = z.string().trim().max(500).superRefine((value, context) => {
  if (!value) return;
  try {
    const url = new URL(value);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname) {
      context.addIssue({ code: "custom", message: "Enter a valid HTTP or HTTPS website URL." });
    } else if (url.toString().length > 500) {
      context.addIssue({ code: "too_big", maximum: 500, origin: "string", inclusive: true, message: "Website must be 500 characters or fewer." });
    }
  } catch {
    context.addIssue({ code: "custom", message: "Enter a valid HTTP or HTTPS website URL." });
  }
}).transform((value) => value ? new URL(value).toString() : "");

export const businessSettingsSchema = z.object({
  name: requiredText("Business name", 120),
  industry: requiredText("Industry", 120),
  description: optionalText(2_000),
  targetAudience: optionalText(1_000),
  website: websiteSchema,
  phone: z.string().trim().max(40).refine((value) => !value || /^[+()0-9 .-]{7,40}$/.test(value), "Enter a valid phone number."),
  email: z.union([z.literal(""), z.email("Enter a valid email address.").max(320)]),
  address: optionalText(500),
  city: optionalText(120),
  state: optionalText(120),
  country: requiredText("Country", 120),
}).strict();

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;
export type BusinessSettingsError = {
  code: "INVALID_INPUT" | "UNAUTHENTICATED" | "FORBIDDEN" | "BUSINESS_NOT_FOUND" | "STORAGE_ERROR";
  message: string;
  fields?: Partial<Record<keyof BusinessSettingsInput, string[]>>;
};
export type BusinessSettingsState = { success: boolean; error: BusinessSettingsError | null };