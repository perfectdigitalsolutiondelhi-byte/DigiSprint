import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AIPlatformError } from "../ai/errors";
import { marketingStrategyInputSchema } from "./schemas";
import { weeklyFoundationSchema, weeklyPlanSchema } from "./weekly-schema";

export async function loadLatestWeeklyRun(supabase: SupabaseClient, businessId: string) {
  const { data, error } = await supabase.from("weekly_strategy_runs").select("id,status,foundation_status,created_at").eq("business_id", businessId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new AIPlatformError("STORAGE_ERROR", "Weekly strategy progress could not be loaded.", error);
  if (!data) return null;
  const { data: weeks, error: weeksError } = await supabase.from("weekly_strategy_weeks").select("week_number,status").eq("run_id", data.id).order("week_number");
  if (weeksError) throw new AIPlatformError("STORAGE_ERROR", "Weekly strategy progress could not be loaded.", weeksError);
  return { ...data, weeks: weeks ?? [] };
}

export async function loadWeeklyWorkspace(supabase: SupabaseClient, businessId: string, runId: string, stageNumber: number, revisionNumber?: number) {
  const { data: run, error } = await supabase.from("weekly_strategy_runs").select("id,status,request_input,foundation_content,foundation_status,foundation_version,monthly_report,created_at").eq("id", runId).eq("business_id", businessId).maybeSingle();
  if (error) throw new AIPlatformError("STORAGE_ERROR", "The weekly strategy could not be loaded.", error);
  if (!run) return null;
  const { data: weeks, error: weeksError } = await supabase.from("weekly_strategy_weeks").select("week_number,content,status,version,created_at").eq("run_id", runId).eq("business_id", businessId).order("week_number");
  if (weeksError) throw new AIPlatformError("STORAGE_ERROR", "Strategy weeks could not be loaded.", weeksError);
  const { data: revisions, error: revisionError } = await supabase.from("weekly_strategy_revisions").select("revision_number,stage_number,created_at,editor_id").eq("run_id", runId).eq("stage_number", stageNumber).order("revision_number", { ascending: false }).range(0, 19);
  if (revisionError) throw new AIPlatformError("STORAGE_ERROR", "Revision history could not be loaded.", revisionError);
  let selectedContent: unknown = null;
  if (revisionNumber) {
    const { data, error: selectedError } = await supabase.from("weekly_strategy_revisions").select("previous_content").eq("run_id", runId).eq("stage_number", stageNumber).eq("revision_number", revisionNumber).maybeSingle();
    if (selectedError) throw new AIPlatformError("STORAGE_ERROR", "The selected revision could not be loaded.", selectedError);
    selectedContent = data?.previous_content ?? null;
  }
  return { ...run, request_input: marketingStrategyInputSchema.parse(run.request_input), foundation_content: weeklyFoundationSchema.parse(run.foundation_content), weeks: (weeks ?? []).map((week) => ({ ...week, content: weeklyPlanSchema.parse(week.content) })), revisions: revisions ?? [], selectedContent };
}
