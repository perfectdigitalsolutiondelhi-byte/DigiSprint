import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import { AIPlatformError } from "../ai/errors";
import { runAIRequest } from "../ai/service";
import { requireStrategyOwnerWorkspace } from "./review-authorization";
import { marketingStrategyInputSchema } from "./schemas";
import type { MarketingStrategyInput } from "./types";
import { weeklyFoundationSchema, weeklyPlanSchema, type WeeklyFoundation, type WeeklyPlan, type WeeklyPlanInput } from "./weekly-schema";

function key(prefix: string, value: string) { return `${prefix}:${createHash("sha256").update(value).digest("hex")}`; }
async function completed<T>(supabase: SupabaseClient, businessId: string, idempotencyKey: string, contentType: string, schema: z.ZodType<T>) {
  const { data: job, error } = await supabase.from("ai_jobs").select("id,status").eq("business_id", businessId).eq("idempotency_key", idempotencyKey).maybeSingle();
  if (error) throw new AIPlatformError("STORAGE_ERROR", "The generation state could not be loaded.", error);
  if (!job || job.status === "failed") return null;
  if (job.status !== "succeeded") throw new AIPlatformError("DUPLICATE_REQUEST", "This generation step is already running.");
  const { data, error: contentError } = await supabase.from("generated_content").select("id,structured_content").eq("business_id", businessId).eq("ai_job_id", job.id).eq("content_type", contentType).maybeSingle();
  if (contentError || !data) throw new AIPlatformError("STORAGE_ERROR", "The completed generation step could not be loaded.", contentError);
  return { contentId: String(data.id), output: schema.parse(data.structured_content) };
}

export async function generateWeeklyFoundation(businessId: string, input: MarketingStrategyInput, requestKey: string) {
  const { supabase, business } = await requireStrategyOwnerWorkspace("/strategy", true);
  if (business.id !== businessId) throw new AIPlatformError("FORBIDDEN", "Workspace access denied.");
  const jobKey = key("weekly:foundation", requestKey);
  const result = await completed(supabase, businessId, jobKey, "weekly_strategy_foundation", weeklyFoundationSchema) ?? await runAIRequest<MarketingStrategyInput, WeeklyFoundation>({ businessId, featureKey: "weekly_strategy_foundation", promptKey: "weekly_strategy_foundation", input, language: input.preferredLanguage, idempotencyKey: jobKey });
  const { data, error } = await supabase.rpc("create_weekly_strategy_run", { target_business_id: businessId, target_idempotency_key: requestKey, target_request_input: input, target_foundation_content_id: result.contentId });
  if (error || !data) throw new AIPlatformError("STORAGE_ERROR", "The foundation could not be stored.", error);
  return String(data);
}

export async function generateWeeklyPlan(businessId: string, runId: string, weekNumber: number) {
  const { supabase, business } = await requireStrategyOwnerWorkspace(`/strategy/weekly/${runId}`, true);
  if (business.id !== businessId) throw new AIPlatformError("FORBIDDEN", "Workspace access denied.");
  const { data: run, error } = await supabase.from("weekly_strategy_runs").select("request_input,foundation_content,foundation_status,status").eq("id", runId).eq("business_id", businessId).maybeSingle();
  if (error) throw new AIPlatformError("STORAGE_ERROR", "The weekly strategy could not be loaded.", error);
  if (!run || run.status !== "active" || run.foundation_status !== "approved") throw new AIPlatformError("CONFLICT", "The previous stage must be approved first.");
  const { data: weeks, error: weeksError } = await supabase.from("weekly_strategy_weeks").select("week_number,status,content").eq("run_id", runId).eq("business_id", businessId).lt("week_number", weekNumber).order("week_number");
  if (weeksError) throw new AIPlatformError("STORAGE_ERROR", "Previous weeks could not be loaded.", weeksError);
  if (weekNumber > 1 && !weeks?.some((week) => week.week_number === weekNumber - 1 && week.status === "approved")) throw new AIPlatformError("CONFLICT", "The previous week must be approved first.");
  const foundation = weeklyFoundationSchema.parse(run.foundation_content);
  const input: WeeklyPlanInput = {
    strategyRequest: marketingStrategyInputSchema.parse(run.request_input), weekNumber,
    foundation: { objective: foundation.marketingObjective, positioning: foundation.brandPositioning.statement, audiences: foundation.targetAudience.map((item) => item.segment), channels: foundation.marketingChannels.map((item) => item.channel), kpis: foundation.kpis.map((item) => item.metric) },
    previousWeekSummaries: (weeks ?? []).filter((week) => week.status === "approved").map((week) => { const parsed = weeklyPlanSchema.parse(week.content); return { weekNumber: parsed.weekNumber, weeklyGoal: parsed.weeklyGoal, weekSummary: parsed.weekSummary }; }),
  };
  const jobKey = `weekly:week:${runId}:${weekNumber}`;
  const result = await completed(supabase, businessId, jobKey, "weekly_strategy_week", weeklyPlanSchema) ?? await runAIRequest<WeeklyPlanInput, WeeklyPlan>({ businessId, featureKey: "weekly_strategy_week", promptKey: "weekly_strategy_week", input, language: input.strategyRequest.preferredLanguage, idempotencyKey: jobKey });
  const { error: attachError } = await supabase.rpc("attach_weekly_strategy_week", { target_business_id: businessId, target_run_id: runId, target_week_number: weekNumber, target_content_id: result.contentId });
  if (attachError) throw new AIPlatformError("STORAGE_ERROR", "The generated week could not be stored.", attachError);
}
