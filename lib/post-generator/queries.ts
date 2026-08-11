import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AIPlatformError } from "../ai/errors";
import { weeklyPlanSchema } from "../marketing-strategy/weekly-schema";
import { postGeneratorOutputSchema } from "./schema";

type ApprovedWeekRow = { id: string; week_number: number; weekly_goal: string; updated_at: string; total_count: number | string };
const pageSize = 8;
export async function loadApprovedWeeks(supabase: SupabaseClient, businessId: string, page: number) {
  const safePage = Math.max(1, Math.floor(page));
  const { data, error } = await supabase.rpc("list_approved_post_generator_weeks", { target_business_id: businessId, target_offset: (safePage - 1) * pageSize, target_limit: pageSize });
  if (error) throw new AIPlatformError("STORAGE_ERROR", "Approved strategy weeks could not be loaded.", error);
  const rows = (data ?? []) as ApprovedWeekRow[];
  return { items: rows.map((week) => ({ id: String(week.id), weekNumber: Number(week.week_number), weeklyGoal: String(week.weekly_goal), updatedAt: String(week.updated_at) })), page: safePage, pageSize, totalCount: Number(rows[0]?.total_count ?? 0) };
}

export async function loadPostGeneratorWorkspace(supabase: SupabaseClient, businessId: string, weekId: string) {
  const { data: week, error } = await supabase.from("weekly_strategy_weeks").select("id,week_number,status,content").eq("id", weekId).eq("business_id", businessId).maybeSingle();
  if (error) throw new AIPlatformError("STORAGE_ERROR", "The approved strategy week could not be loaded.", error);
  if (!week || week.status !== "approved") return null;
  const { data: days, error: daysError } = await supabase.from("ai_post_days").select("day_number,current_content,version").eq("week_id", weekId).eq("business_id", businessId).order("day_number");
  if (daysError) throw new AIPlatformError("STORAGE_ERROR", "Generated posts could not be loaded.", daysError);
  return { id: String(week.id), weekNumber: Number(week.week_number), strategy: weeklyPlanSchema.parse(week.content), days: (days ?? []).map((day) => ({ dayNumber: Number(day.day_number), content: postGeneratorOutputSchema.parse(day.current_content), version: Number(day.version) })) };
}
