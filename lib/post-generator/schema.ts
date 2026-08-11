import { z } from "zod";

const copy = z.string().trim().min(1).max(4_000);
const shortCopy = z.string().trim().min(1).max(1_000);

export const postGeneratorInputSchema = z.object({
  weekId: z.string().uuid(),
  weekNumber: z.number().int().min(1).max(4),
  dayNumber: z.number().int().min(1).max(7),
  preferredLanguage: z.enum(["en", "hi", "hinglish"]),
  weeklyGoal: shortCopy,
  weeklySummary: copy,
  dayPlan: z.object({ platform: shortCopy, format: shortCopy, topic: shortCopy, objective: shortCopy, callToAction: shortCopy }).strict(),
  dailyIdea: copy,
  campaignContext: z.object({ whatsAppObjective: shortCopy, seoTasks: z.array(shortCopy).min(1).max(10), weeklyCallToAction: shortCopy }).strict(),
}).strict();

export const postGeneratorOutputSchema = z.object({
  dayNumber: z.number().int().min(1).max(7),
  facebookPost: copy,
  instagramCaption: copy,
  linkedInPost: copy,
  whatsAppMessage: copy,
  xPost: z.string().trim().min(1).max(280),
  reelScript: copy,
  voiceOverScript: copy,
  aiImagePrompt: copy,
  callToAction: shortCopy,
  hashtags: z.array(z.string().trim().regex(/^#[\p{L}\p{N}_]+$/u).max(80)).min(3).max(20),
}).strict();

export const postDayActionSchema = z.object({
  weekId: z.string().uuid(),
  dayNumber: z.coerce.number().int().min(1).max(7),
  expectedVersion: z.coerce.number().int().min(0).optional(),
  requestKey: z.string().regex(/^[A-Za-z0-9:_-]{12,160}$/).optional(),
}).strict();

export type PostGeneratorInput = z.infer<typeof postGeneratorInputSchema>;
export type PostGeneratorOutput = z.infer<typeof postGeneratorOutputSchema>;
