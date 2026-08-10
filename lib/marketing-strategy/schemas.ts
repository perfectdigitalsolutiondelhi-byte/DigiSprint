import { z } from "zod";

const shortText = z.string().trim().min(1).max(240);
const paragraph = z.string().trim().min(1).max(900);
const itemList = z.array(shortText).min(1).max(8);
export const strategyLanguageSchema = z.enum(["en", "hi", "hinglish"]);
export const marketingStrategyInputSchema = z.object({ primaryObjective: z.string().trim().min(2).max(160), preferredLanguage: strategyLanguageSchema, specialFocus: z.string().trim().max(500).optional().default(""), regeneratedFromId: z.string().uuid().optional() }).strict();
const personaSchema = z.object({ name: shortText, profile: paragraph, needs: z.array(shortText).min(1).max(5), objections: z.array(shortText).min(1).max(5), bestChannels: z.array(shortText).min(1).max(5) }).strict();
const platformSchema = z.object({ platform: shortText, objective: shortText, contentMix: z.array(shortText).min(2).max(6), cadence: shortText, successSignals: z.array(shortText).min(1).max(5) }).strict();
const calendarItemSchema = z.object({ day: z.number().int().min(1).max(30), platform: shortText, format: shortText, topic: shortText, objective: shortText, callToAction: shortText }).strict();
export const marketingStrategyOutputSchema = z.object({
  title: z.string().trim().min(3).max(160), executiveSummary: paragraph,
  businessAnalysis: z.object({ position: paragraph, strengthsToLeverage: itemList, growthBarriers: itemList }).strict(),
  swot: z.object({ strengths: itemList, weaknesses: itemList, opportunities: itemList, threats: itemList }).strict(),
  targetAudience: z.array(z.object({ segment: shortText, description: paragraph, priority: z.enum(["primary", "secondary", "emerging"]) }).strict()).min(1).max(5),
  customerPersonas: z.array(personaSchema).min(1).max(4),
  competitorResearchFramework: z.object({ researchQuestions: itemList, comparisonCriteria: itemList, differentiationOpportunities: itemList }).strict(),
  seoStrategy: z.object({ objectives: itemList, onPageActions: itemList, contentThemes: itemList, technicalChecks: itemList }).strict(),
  keywordStrategy: z.object({ primary: itemList, longTail: itemList, localIntent: itemList, validationNote: paragraph }).strict(),
  localSeo: z.object({ priorities: itemList, googleBusinessProfileActions: itemList, reputationActions: itemList }).strict(),
  platformStrategies: z.array(platformSchema).min(1).max(8), contentCalendar: z.array(calendarItemSchema).length(30),
  advertisingRecommendations: z.array(z.object({ channel: shortText, objective: shortText, audience: shortText, creativeDirection: paragraph, measurement: itemList }).strict()).min(1).max(5),
  budgetAllocation: z.object({ approach: paragraph, lowBudget: itemList, growthBudget: itemList, allocationNote: paragraph }).strict(),
  marketingPriorities: z.array(z.object({ rank: z.number().int().min(1).max(10), priority: shortText, reason: paragraph, timeframe: shortText }).strict()).min(3).max(8),
  actionChecklist: z.array(z.object({ action: shortText, timeframe: shortText, outcome: shortText }).strict()).min(5).max(15),
  confidenceAndAssumptions: z.object({ assumptions: itemList, missingBusinessInformation: z.array(shortText).max(8), recommendedMissingInputs: z.array(shortText).max(8) }).strict(),
  limitations: itemList,
  metadata: z.object({ schemaVersion: z.literal(1), editable: z.literal(true), sectionIdsStable: z.literal(true), feedback: z.object({ starRating: z.number().int().min(1).max(5).nullable(), sentiment: z.enum(["up", "down"]).nullable(), comment: z.string().max(1000).nullable() }).strict() }).strict(),
}).strict().superRefine((value, context) => {
  const days = value.contentCalendar.map((item) => item.day);
  if (new Set(days).size !== 30 || days.some((day, index) => day !== index + 1)) context.addIssue({ code: "custom", path: ["contentCalendar"], message: "Calendar days must be unique and sequential from 1 to 30." });
});
export const strategyActionSchema = z.object({ strategyId: z.string().uuid() }).strict();
const outputShape = marketingStrategyOutputSchema.shape;
export const marketingStrategyFoundationSchema = z.object({
  title: outputShape.title,
  executiveSummary: outputShape.executiveSummary,
  businessAnalysis: outputShape.businessAnalysis,
  swot: outputShape.swot,
  targetAudience: outputShape.targetAudience,
  customerPersonas: outputShape.customerPersonas,
  competitorResearchFramework: outputShape.competitorResearchFramework,
}).strict();
export const marketingStrategyExecutionSchema = z.object({
  seoStrategy: outputShape.seoStrategy,
  keywordStrategy: outputShape.keywordStrategy,
  localSeo: outputShape.localSeo,
  platformStrategies: outputShape.platformStrategies,
  advertisingRecommendations: outputShape.advertisingRecommendations,
  budgetAllocation: outputShape.budgetAllocation,
  marketingPriorities: outputShape.marketingPriorities,
  actionChecklist: outputShape.actionChecklist,
  confidenceAndAssumptions: outputShape.confidenceAndAssumptions,
  limitations: outputShape.limitations,
  metadata: outputShape.metadata,
}).strict();
export const marketingStrategyExecutiveSchema = z.object({
  ...marketingStrategyFoundationSchema.shape,
  ...marketingStrategyExecutionSchema.shape,
}).strict();
export const marketingStrategyExecutionInputSchema = z.object({
  strategyRequest: marketingStrategyInputSchema,
  foundation: marketingStrategyFoundationSchema,
}).strict();
export const marketingStrategyCalendarSchema = z.object({
  contentCalendar: outputShape.contentCalendar,
}).strict();
export const marketingStrategyCalendarInputSchema = z.object({
  strategyRequest: marketingStrategyInputSchema,
  executiveContext: z.object({
    title: marketingStrategyExecutiveSchema.shape.title,
    executiveSummary: marketingStrategyExecutiveSchema.shape.executiveSummary,
    targetAudience: marketingStrategyExecutiveSchema.shape.targetAudience,
    platformStrategies: marketingStrategyExecutiveSchema.shape.platformStrategies,
    marketingPriorities: marketingStrategyExecutiveSchema.shape.marketingPriorities,
  }).strict(),
}).strict();