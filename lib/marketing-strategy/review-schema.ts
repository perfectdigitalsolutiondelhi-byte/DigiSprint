import { z } from "zod";
import { marketingStrategyOutputSchema, strategyLanguageSchema } from "./schemas";
import type { MarketingStrategyInput, MarketingStrategyOutput } from "./types";

const shortText = z.string().trim().min(1).max(240);

const businessSummarySchema = z.object({
  name: shortText,
  industry: shortText,
  description: z.string().trim().max(2_000),
  location: z.string().trim().max(240),
}).strict();
const kpisSchema = z.array(z.object({ channel: shortText, signals: z.array(shortText).min(1).max(8) }).strict()).min(1).max(12);

export const reviewSectionSchemas = {
  businessSummary: businessSummarySchema,
  objective: z.string().trim().min(2).max(500),
  language: strategyLanguageSchema,
  specialFocus: z.string().trim().max(1_000),
  executiveSummary: z.string().trim().min(1).max(2_000),
  swot: marketingStrategyOutputSchema.shape.swot,
  targetAudience: marketingStrategyOutputSchema.shape.targetAudience,
  positioning: marketingStrategyOutputSchema.shape.businessAnalysis,
  marketingChannels: marketingStrategyOutputSchema.shape.platformStrategies,
  weeklyPlan: marketingStrategyOutputSchema.shape.marketingPriorities,
  calendar: marketingStrategyOutputSchema.shape.contentCalendar,
  budget: z.object({
    allocation: marketingStrategyOutputSchema.shape.budgetAllocation,
    advertising: marketingStrategyOutputSchema.shape.advertisingRecommendations,
  }).strict(),
  kpis: kpisSchema,
  checklist: marketingStrategyOutputSchema.shape.actionChecklist,
} as const;

export type ReviewSectionKey = keyof typeof reviewSectionSchemas;
export type StrategyReviewDocument = {
  [Key in ReviewSectionKey]: z.infer<(typeof reviewSectionSchemas)[Key]>;
};

export const reviewSectionKeys = Object.keys(reviewSectionSchemas) as ReviewSectionKey[];
export const reviewSectionKeySchema = z.enum(reviewSectionKeys as [ReviewSectionKey, ...ReviewSectionKey[]]);
export const revisionActionSchema = z.object({
  strategyId: z.uuid(),
  section: reviewSectionKeySchema,
  content: z.string().max(100_000),
}).strict();
export const reviewStatusActionSchema = z.object({
  strategyId: z.uuid(),
  status: z.enum(["accepted", "rejected", "archived"]),
  reason: z.string().trim().max(500).default(""),
}).strict();

export function createOriginalReviewDocument(values: {
  content: MarketingStrategyOutput;
  input: MarketingStrategyInput;
  context: unknown;
}): StrategyReviewDocument {
  const context = values.context && typeof values.context === "object" ? values.context as Record<string, unknown> : {};
  const content = values.content;
  return {
    businessSummary: businessSummarySchema.parse({
      name: typeof context.name === "string" ? context.name : "Business",
      industry: typeof context.industry === "string" ? context.industry : "Small business",
      description: typeof context.description === "string" ? context.description : "",
      location: typeof context.location === "string" ? context.location : "",
    }),
    objective: values.input.primaryObjective,
    language: values.input.preferredLanguage,
    specialFocus: values.input.specialFocus,
    executiveSummary: content.executiveSummary,
    swot: content.swot,
    targetAudience: content.targetAudience,
    positioning: content.businessAnalysis,
    marketingChannels: content.platformStrategies,
    weeklyPlan: content.marketingPriorities,
    calendar: content.contentCalendar,
    budget: { allocation: content.budgetAllocation, advertising: content.advertisingRecommendations },
    kpis: content.platformStrategies.map((item) => ({ channel: item.platform, signals: item.successSignals })),
    checklist: content.actionChecklist,
  };
}

export function parseSectionContent(section: ReviewSectionKey, raw: string) {
  const schema = reviewSectionSchemas[section] as z.ZodType<unknown>;
  const value = ["objective", "language", "specialFocus", "executiveSummary"].includes(section) ? raw : JSON.parse(raw);
  return schema.parse(value);
}