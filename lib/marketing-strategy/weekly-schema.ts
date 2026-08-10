import { z } from "zod";
import { marketingStrategyInputSchema } from "./schemas";

const text = z.string().trim().min(1).max(500);
const paragraph = z.string().trim().min(1).max(1200);
const list = z.array(text).min(1).max(10);
const swot = z.object({ strengths: list, weaknesses: list, opportunities: list, threats: list }).strict();

export const weeklyFoundationSchema = z.object({
  businessSummary: paragraph,
  marketingObjective: text,
  swot,
  targetAudience: z.array(z.object({ segment: text, needs: list, channels: list }).strict()).min(1).max(5),
  competitorSummary: z.object({ landscape: paragraph, differentiators: list, researchPriorities: list }).strict(),
  brandPositioning: z.object({ statement: paragraph, valueProposition: paragraph, proofPoints: list }).strict(),
  marketingChannels: z.array(z.object({ channel: text, role: text, cadence: text }).strict()).min(1).max(8),
  budgetRecommendation: z.object({ approach: paragraph, allocations: z.array(z.object({ category: text, percentage: z.number().min(0).max(100) }).strict()).min(1).max(8) }).strict(),
  kpis: z.array(z.object({ metric: text, target: text, reviewCadence: text }).strict()).min(1).max(10),
}).strict();

const calendarDay = z.object({ day: z.number().int().min(1).max(7), platform: text, format: text, topic: text, objective: text, callToAction: text }).strict();
export const weeklyPlanSchema = z.object({
  weekNumber: z.number().int().min(1).max(4), weeklyGoal: text, weekSummary: paragraph,
  contentCalendar: z.array(calendarDay).length(7),
  dailySocialPostIdeas: z.array(z.object({ day: z.number().int().min(1).max(7), idea: paragraph }).strict()).length(7),
  reelsIdeas: z.array(z.object({ concept: text, hook: text, callToAction: text }).strict()).min(2).max(5),
  whatsAppCampaign: z.object({ objective: text, message: paragraph, callToAction: text }).strict(),
  seoTasks: list, callToAction: text, checklist: list,
}).strict().superRefine((value, context) => {
  for (const key of ["contentCalendar", "dailySocialPostIdeas"] as const) if (value[key].some((item, index) => item.day !== index + 1)) context.addIssue({ code: "custom", path: [key], message: "Days must be sequential from 1 to 7." });
});

export const weeklyPlanInputSchema = z.object({
  strategyRequest: marketingStrategyInputSchema,
  weekNumber: z.number().int().min(1).max(4),
  foundation: z.object({ objective: text, positioning: paragraph, audiences: z.array(text).min(1).max(5), channels: z.array(text).min(1).max(8), kpis: z.array(text).min(1).max(10) }).strict(),
  previousWeekSummaries: z.array(z.object({ weekNumber: z.number().int().min(1).max(4), weeklyGoal: text, weekSummary: paragraph }).strict()).max(3),
}).strict();

export const weeklyStageActionSchema = z.object({ runId: z.string().uuid(), stageNumber: z.coerce.number().int().min(0).max(4) }).strict();
export type WeeklyFoundation = z.infer<typeof weeklyFoundationSchema>;
export type WeeklyPlan = z.infer<typeof weeklyPlanSchema>;
export type WeeklyPlanInput = z.infer<typeof weeklyPlanInputSchema>;
