"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { normalizeAIError, AIPlatformError } from "../../../../lib/ai/errors";
import { requireStrategyOwnerWorkspace } from "../../../../lib/marketing-strategy/review-authorization";
import { generateWeeklyPlan } from "../../../../lib/marketing-strategy/weekly-service";
import { weeklyFoundationSchema, weeklyPlanSchema, weeklyStageActionSchema } from "../../../../lib/marketing-strategy/weekly-schema";

export type WeeklyActionState = { error: string | null };
export async function generateWeekAction(_state: WeeklyActionState, formData: FormData): Promise<WeeklyActionState> {
  const parsed = weeklyStageActionSchema.safeParse({ runId: formData.get("runId"), stageNumber: formData.get("stageNumber") });
  if (!parsed.success || parsed.data.stageNumber === 0) return { error: "Invalid weekly generation request." };
  try { const { business } = await requireStrategyOwnerWorkspace(`/strategy/weekly/${parsed.data.runId}`, true); await generateWeeklyPlan(business.id, parsed.data.runId, parsed.data.stageNumber); }
  catch (error) { return { error: normalizeAIError(error).message }; }
  revalidatePath(`/strategy/weekly/${parsed.data.runId}`); redirect(`/strategy/weekly/${parsed.data.runId}?stage=${parsed.data.stageNumber}`);
}
export async function saveStageAction(_state: WeeklyActionState, formData: FormData): Promise<WeeklyActionState> {
  const parsed = weeklyStageActionSchema.safeParse({ runId: formData.get("runId"), stageNumber: formData.get("stageNumber") });
  const version = Number(formData.get("version"));
  if (!parsed.success || !Number.isInteger(version) || version < 0) return { error: "Invalid revision request." };
  let content: unknown;
  try { content = JSON.parse(String(formData.get("content") || "")); content = (parsed.data.stageNumber === 0 ? weeklyFoundationSchema : weeklyPlanSchema).parse(content); }
  catch { return { error: "The section content is not valid. Check every required field." }; }
  try {
    const { supabase, business } = await requireStrategyOwnerWorkspace(`/strategy/weekly/${parsed.data.runId}`, true);
    const { error } = await supabase.rpc("save_weekly_strategy_revision", { target_business_id: business.id, target_run_id: parsed.data.runId, target_stage_number: parsed.data.stageNumber, target_expected_version: version, target_content: content });
    if (error) throw new AIPlatformError(error.code === "40001" ? "CONFLICT" : "STORAGE_ERROR", error.code === "40001" ? "This stage changed in another session. Reload before saving." : "The revision could not be saved.", error);
  } catch (error) { return { error: normalizeAIError(error).message }; }
  revalidatePath(`/strategy/weekly/${parsed.data.runId}`); redirect(`/strategy/weekly/${parsed.data.runId}?stage=${parsed.data.stageNumber}`);
}
export async function approveStageAction(_state: WeeklyActionState, formData: FormData): Promise<WeeklyActionState> {
  const parsed = weeklyStageActionSchema.safeParse({ runId: formData.get("runId"), stageNumber: formData.get("stageNumber") });
  if (!parsed.success) return { error: "Invalid approval request." };
  try { const { supabase, business } = await requireStrategyOwnerWorkspace(`/strategy/weekly/${parsed.data.runId}`, true); const { error } = await supabase.rpc("approve_weekly_strategy_stage", { target_business_id: business.id, target_run_id: parsed.data.runId, target_stage_number: parsed.data.stageNumber }); if (error) throw new AIPlatformError("CONFLICT", "This stage cannot be approved in its current state.", error); }
  catch (error) { return { error: normalizeAIError(error).message }; }
  revalidatePath(`/strategy/weekly/${parsed.data.runId}`); redirect(`/strategy/weekly/${parsed.data.runId}`);
}
