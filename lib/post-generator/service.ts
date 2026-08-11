import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AIPlatformError } from "../ai/errors";
import { runAIRequest } from "../ai/service";
import { requireStrategyOwnerWorkspace } from "../marketing-strategy/review-authorization";
import { marketingStrategyInputSchema } from "../marketing-strategy/schemas";
import { weeklyPlanSchema } from "../marketing-strategy/weekly-schema";
import { postGeneratorInputSchema, postGeneratorOutputSchema, type PostGeneratorInput, type PostGeneratorOutput } from "./schema";

const promptKey = "weekly_post_generator";
const promptVersion = 1;

function createPostInputFingerprint(businessId: string, input: PostGeneratorInput) {
  return createHash("sha256").update(JSON.stringify({ businessId, promptKey, promptVersion, input })).digest("hex");
}

async function loadCompleted(supabase: SupabaseClient, businessId: string, idempotencyKey: string, expectedInput: PostGeneratorInput, expectedFingerprint: string) {
  const { data: job, error } = await supabase.from("ai_jobs").select("id,status,feature_key,prompt_key,prompt_version,input").eq("business_id", businessId).eq("idempotency_key", idempotencyKey).maybeSingle();
  if (error) throw new AIPlatformError("STORAGE_ERROR", "The post generation state could not be loaded.", error);
  if (!job || job.status === "failed") return null;
  if (job.status !== "succeeded") throw new AIPlatformError("DUPLICATE_REQUEST", "This post generation is already running.");
  let storedInput: PostGeneratorInput;
  try { storedInput = postGeneratorInputSchema.parse(job.input); }
  catch { throw new AIPlatformError("CONFLICT", "The completed AI job does not match this approved week."); }
  const storedFingerprint = createPostInputFingerprint(businessId, storedInput);
  if (job.feature_key !== "ai_post_day" || job.prompt_key !== promptKey || job.prompt_version !== promptVersion || storedInput.weekId !== expectedInput.weekId || storedInput.dayNumber !== expectedInput.dayNumber || storedFingerprint !== expectedFingerprint || JSON.stringify(storedInput) !== JSON.stringify(expectedInput)) throw new AIPlatformError("CONFLICT", "The completed AI job does not match this approved week.");
  const { data, error: contentError } = await supabase.from("generated_content").select("id,prompt_key,prompt_version,request_input,request_fingerprint,structured_content").eq("business_id", businessId).eq("ai_job_id", job.id).eq("content_type", "ai_post_day").maybeSingle();
  if (contentError || !data) throw new AIPlatformError("STORAGE_ERROR", "The completed post generation could not be loaded.", contentError);
  let storedContentInput: PostGeneratorInput;
  try { storedContentInput = postGeneratorInputSchema.parse(data.request_input); }
  catch { throw new AIPlatformError("CONFLICT", "The completed content does not match this approved week."); }
  if (data.prompt_key !== promptKey || data.prompt_version !== promptVersion || data.request_fingerprint !== expectedFingerprint || JSON.stringify(storedContentInput) !== JSON.stringify(expectedInput)) throw new AIPlatformError("CONFLICT", "The completed content does not match this approved week.");
  return { contentId: String(data.id), output: postGeneratorOutputSchema.parse(data.structured_content) };
}

export async function generateApprovedWeekPostDay(values: { businessId: string; weekId: string; dayNumber: number; idempotencyKey: string; expectedVersion?: number }) {
  const { supabase, business } = await requireStrategyOwnerWorkspace(`/post-generator/${values.weekId}`, true);
  if (business.id !== values.businessId) throw new AIPlatformError("FORBIDDEN", "Workspace access denied.");
  const { data: week, error } = await supabase.from("weekly_strategy_weeks").select("id,run_id,week_number,status,content").eq("id", values.weekId).eq("business_id", values.businessId).maybeSingle();
  if (error) throw new AIPlatformError("STORAGE_ERROR", "The approved week could not be loaded.", error);
  if (!week || week.status !== "approved") throw new AIPlatformError("CONFLICT", "Only an approved week can generate posts.");
  const { data: run, error: runError } = await supabase.from("weekly_strategy_runs").select("request_input").eq("id", week.run_id).eq("business_id", values.businessId).maybeSingle();
  if (runError || !run) throw new AIPlatformError("STORAGE_ERROR", "The approved week language could not be loaded.", runError);
  const request = marketingStrategyInputSchema.parse(run.request_input);
  const approved = weeklyPlanSchema.parse(week.content);
  const dayIndex = values.dayNumber - 1;
  const input = postGeneratorInputSchema.parse({
    weekId: values.weekId, weekNumber: approved.weekNumber, dayNumber: values.dayNumber, preferredLanguage: request.preferredLanguage,
    weeklyGoal: approved.weeklyGoal, weeklySummary: approved.weekSummary, dayPlan: approved.contentCalendar[dayIndex], dailyIdea: approved.dailySocialPostIdeas[dayIndex].idea,
    campaignContext: { whatsAppObjective: approved.whatsAppCampaign.objective, seoTasks: approved.seoTasks, weeklyCallToAction: approved.callToAction },
  });
  const requestFingerprint = createPostInputFingerprint(values.businessId, input);
  const generated = await loadCompleted(supabase, values.businessId, values.idempotencyKey, input, requestFingerprint) ?? await runAIRequest<PostGeneratorInput, PostGeneratorOutput>({ businessId: values.businessId, featureKey: "ai_post_day", promptKey, input, language: input.preferredLanguage, idempotencyKey: values.idempotencyKey, requestFingerprint });
  if (generated.output.dayNumber !== values.dayNumber) throw new AIPlatformError("INVALID_OUTPUT", "The generated content did not match the requested day.");
  const { error: attachError } = await supabase.rpc("attach_ai_post_day", { target_business_id: values.businessId, target_week_id: values.weekId, target_day_number: values.dayNumber, target_content_id: generated.contentId, target_expected_version: values.expectedVersion ?? null, target_input_fingerprint: requestFingerprint });
  if (attachError) throw new AIPlatformError(attachError.code === "40001" ? "CONFLICT" : "STORAGE_ERROR", attachError.code === "40001" ? "This generated content does not match the current week or version." : "The generated post could not be stored.", attachError);
}
