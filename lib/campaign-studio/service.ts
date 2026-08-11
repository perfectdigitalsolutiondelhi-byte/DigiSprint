import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AIPlatformError } from "../ai/errors";
import { runAIRequest } from "../ai/service";
import { requireStrategyOwnerWorkspace } from "../marketing-strategy/review-authorization";
import { marketingStrategyInputSchema } from "../marketing-strategy/schemas";
import { weeklyPlanSchema } from "../marketing-strategy/weekly-schema";
import { postGeneratorOutputSchema } from "../post-generator/schema";
import { campaignAIInputSchema, campaignAIOutputSchema, type CampaignAIInput, type CampaignAIOutput } from "./schema";

const promptKey = "campaign_studio_plan"; const promptVersion = 1;
const bounded = (value: string, maximum = 800) => value.slice(0, maximum);
function fingerprint(businessId: string, input: CampaignAIInput) { return createHash("sha256").update(JSON.stringify({ businessId, promptKey, promptVersion, input })).digest("hex"); }

async function loadCompleted(supabase: SupabaseClient, businessId: string, idempotencyKey: string, input: CampaignAIInput, expectedFingerprint: string) {
  const { data: job, error } = await supabase.from("ai_jobs").select("id,status,feature_key,prompt_key,prompt_version,input").eq("business_id", businessId).eq("idempotency_key", idempotencyKey).maybeSingle();
  if (error) throw new AIPlatformError("STORAGE_ERROR", "The campaign AI state could not be loaded.", error);
  if (!job || job.status === "failed") return null;
  if (job.status !== "succeeded") throw new AIPlatformError("DUPLICATE_REQUEST", "Campaign AI is already running.");
  let stored: CampaignAIInput; try { stored = campaignAIInputSchema.parse(job.input); } catch { throw new AIPlatformError("CONFLICT", "The completed AI job belongs to another campaign."); }
  if (job.feature_key !== promptKey || job.prompt_key !== promptKey || job.prompt_version !== promptVersion || fingerprint(businessId, stored) !== expectedFingerprint || JSON.stringify(stored) !== JSON.stringify(input)) throw new AIPlatformError("CONFLICT", "The completed AI job belongs to another campaign.");
  const { data, error: contentError } = await supabase.from("generated_content").select("id,prompt_key,prompt_version,request_input,request_fingerprint,structured_content").eq("business_id", businessId).eq("ai_job_id", job.id).eq("content_type", promptKey).maybeSingle();
  if (contentError || !data) throw new AIPlatformError("STORAGE_ERROR", "The completed campaign plan could not be loaded.", contentError);
  if (data.prompt_key !== promptKey || data.prompt_version !== promptVersion || data.request_fingerprint !== expectedFingerprint || JSON.stringify(campaignAIInputSchema.parse(data.request_input)) !== JSON.stringify(input)) throw new AIPlatformError("CONFLICT", "The completed content belongs to another campaign.");
  return { contentId: String(data.id), output: campaignAIOutputSchema.parse(data.structured_content) };
}

export async function generateCampaignPlan(businessId: string, campaignId: string, idempotencyKey: string) {
  const { supabase, business } = await requireStrategyOwnerWorkspace(`/campaign-studio/${campaignId}`, true);
  if (business.id !== businessId) throw new AIPlatformError("FORBIDDEN", "Workspace access denied.");
  const { data: campaign, error } = await supabase.from("campaign_studio_campaigns").select("id,week_id,name,objective,status,ai_content_id").eq("id", campaignId).eq("business_id", businessId).maybeSingle();
  if (error || !campaign) throw new AIPlatformError("STORAGE_ERROR", "The campaign could not be loaded.", error);
  if (campaign.status === "archived" || campaign.ai_content_id) throw new AIPlatformError("CONFLICT", "This campaign cannot generate another plan.");
  const { data: week, error: weekError } = await supabase.from("weekly_strategy_weeks").select("id,run_id,week_number,status,content").eq("id", campaign.week_id).eq("business_id", businessId).maybeSingle();
  if (weekError || !week || week.status !== "approved") throw new AIPlatformError("CONFLICT", "The approved strategy week is unavailable.");
  const [{ data: run, error: runError }, { data: sources, error: sourceError }] = await Promise.all([
    supabase.from("weekly_strategy_runs").select("request_input").eq("id", week.run_id).eq("business_id", businessId).maybeSingle(),
    supabase.from("campaign_studio_source_posts").select("post_day_id").eq("campaign_id", campaignId).eq("business_id", businessId),
  ]);
  if (runError || !run || sourceError || !sources?.length) throw new AIPlatformError("STORAGE_ERROR", "Approved campaign sources could not be loaded.", runError || sourceError);
  const sourceIds = sources.map((source) => source.post_day_id);
  const { data: posts, error: postsError } = await supabase.from("ai_post_days").select("id,day_number,current_content").eq("business_id", businessId).eq("week_id", week.id).in("id", sourceIds).order("day_number");
  if (postsError || !posts || posts.length !== sourceIds.length) throw new AIPlatformError("CONFLICT", "Approved campaign posts are incomplete.");
  const weekly = weeklyPlanSchema.parse(week.content); const request = marketingStrategyInputSchema.parse(run.request_input);
  const input = campaignAIInputSchema.parse({ campaignId, campaignName: campaign.name, objective: campaign.objective, preferredLanguage: request.preferredLanguage, approvedWeek: { weekId: week.id, weekNumber: week.week_number, weeklyGoal: weekly.weeklyGoal, weeklySummary: weekly.weekSummary }, approvedPosts: posts.map((post) => { const value = postGeneratorOutputSchema.parse(post.current_content); return { postDayId: post.id, dayNumber: post.day_number, facebookPost: bounded(value.facebookPost), instagramCaption: bounded(value.instagramCaption), linkedInPost: bounded(value.linkedInPost), whatsAppMessage: bounded(value.whatsAppMessage), xPost: value.xPost, reelScript: bounded(value.reelScript), aiImagePrompt: bounded(value.aiImagePrompt), callToAction: bounded(value.callToAction, 500), hashtags: value.hashtags }; }) });
  const inputFingerprint = fingerprint(businessId, input);
  const generated = await loadCompleted(supabase, businessId, idempotencyKey, input, inputFingerprint) ?? await runAIRequest<CampaignAIInput, CampaignAIOutput>({ businessId, featureKey: promptKey, promptKey, input, language: input.preferredLanguage, idempotencyKey, requestFingerprint: inputFingerprint });
  const { error: attachError } = await supabase.rpc("attach_campaign_studio_plan", { target_business_id: businessId, target_campaign_id: campaignId, target_content_id: generated.contentId, target_input_fingerprint: inputFingerprint });
  if (attachError) throw new AIPlatformError(attachError.code === "40001" ? "CONFLICT" : "STORAGE_ERROR", attachError.code === "40001" ? "This Campaign AI output does not match the campaign." : "The campaign plan could not be stored.", attachError);
}
