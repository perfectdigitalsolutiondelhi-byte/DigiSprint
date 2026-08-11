import { z } from "zod";

const text = z.string().trim().min(1).max(500);
const paragraph = z.string().trim().min(1).max(1_500);
const list = z.array(text).min(1).max(12);

export const campaignBuilderSchema = z.object({
  name: z.string().trim().min(3).max(120),
  objective: z.string().trim().min(3).max(500),
  weekId: z.string().uuid(),
  sourcePostIds: z.array(z.string().uuid()).min(1).max(7),
  requestKey: z.string().regex(/^[A-Za-z0-9:_-]{12,160}$/),
}).strict();

const approvedPostInput = z.object({
  postDayId: z.string().uuid(), dayNumber: z.number().int().min(1).max(7),
  facebookPost: z.string().max(800), instagramCaption: z.string().max(800), linkedInPost: z.string().max(800),
  whatsAppMessage: z.string().max(800), xPost: z.string().max(280), reelScript: z.string().max(800),
  aiImagePrompt: z.string().max(800), callToAction: z.string().max(500), hashtags: z.array(z.string().max(80)).max(20),
}).strict();

export const campaignAIInputSchema = z.object({
  campaignId: z.string().uuid(), campaignName: text, objective: text, preferredLanguage: z.enum(["en", "hi", "hinglish"]),
  approvedWeek: z.object({ weekId: z.string().uuid(), weekNumber: z.number().int().min(1).max(4), weeklyGoal: text, weeklySummary: paragraph }).strict(),
  approvedPosts: z.array(approvedPostInput).min(1).max(7),
}).strict();

export const campaignAIOutputSchema = z.object({
  campaignSummary: paragraph,
  audience: paragraph,
  coreMessage: paragraph,
  channels: z.array(z.object({ channel: text, role: text, cadence: text }).strict()).min(1).max(8),
  calendar: z.array(z.object({ dayNumber: z.number().int().min(1).max(7), focus: text, channel: text, deliverable: text, callToAction: text }).strict()).length(7),
  assets: z.array(z.object({ dayNumber: z.number().int().min(1).max(7), assetType: z.enum(["copy", "image", "video", "audio", "landing_page", "other"]), title: text, brief: paragraph }).strict()).min(1).max(20),
  suggestions: z.array(z.object({ title: text, recommendation: paragraph, impact: z.enum(["high", "medium", "low"]) }).strict()).min(1).max(10),
  kpis: z.array(z.object({ metric: text, target: text, cadence: text }).strict()).min(1).max(10),
  milestones: z.array(z.object({ name: text, successCriteria: list }).strict()).min(1).max(8),
}).strict().superRefine((value, context) => {
  if (value.calendar.some((day, index) => day.dayNumber !== index + 1)) context.addIssue({ code: "custom", path: ["calendar"], message: "Calendar days must be sequential from 1 to 7." });
});

export const campaignIdSchema = z.object({ campaignId: z.string().uuid(), requestKey: z.string().regex(/^[A-Za-z0-9:_-]{12,160}$/) }).strict();
export const campaignStatusActionSchema = z.object({ campaignId: z.string().uuid(), expectedVersion: z.coerce.number().int().min(0), status: z.enum(["active", "completed", "archived"]) }).strict();
export const campaignAssetActionSchema = z.object({ campaignId: z.string().uuid(), assetId: z.string().uuid(), expectedVersion: z.coerce.number().int().min(0), status: z.enum(["planned", "in_progress", "ready", "published"]) }).strict();

export type CampaignAIInput = z.infer<typeof campaignAIInputSchema>;
export type CampaignAIOutput = z.infer<typeof campaignAIOutputSchema>;
