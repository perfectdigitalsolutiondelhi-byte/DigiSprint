"use server";
import { revalidatePath } from "next/cache";
import { AIPlatformError, normalizeAIError } from "../../../lib/ai/errors";
import { requireStrategyOwnerWorkspace } from "../../../lib/marketing-strategy/review-authorization";
import { postDayActionSchema, postGeneratorOutputSchema } from "../../../lib/post-generator/schema";
import { generateApprovedWeekPostDay } from "../../../lib/post-generator/service";

export type PostActionState = { error: string | null; success?: boolean };

export async function generatePostDayAction(_state: PostActionState, formData: FormData): Promise<PostActionState> {
  const parsed = postDayActionSchema.safeParse({ weekId: formData.get("weekId"), dayNumber: formData.get("dayNumber"), expectedVersion: formData.get("expectedVersion") || undefined, requestKey: formData.get("requestKey") });
  if (!parsed.success || !parsed.data.requestKey) return { error: "This generation request is invalid. Refresh and try again." };
  try { const { business } = await requireStrategyOwnerWorkspace(`/post-generator/${parsed.data.weekId}`, true); await generateApprovedWeekPostDay({ businessId: business.id, weekId: parsed.data.weekId, dayNumber: parsed.data.dayNumber, expectedVersion: parsed.data.expectedVersion, idempotencyKey: parsed.data.requestKey }); }
  catch (error) { return { error: normalizeAIError(error).message }; }
  revalidatePath(`/post-generator/${parsed.data.weekId}`);
  return { error: null, success: true };
}

export async function updatePostDayAction(_state: PostActionState, formData: FormData): Promise<PostActionState> {
  const parsed = postDayActionSchema.safeParse({ weekId: formData.get("weekId"), dayNumber: formData.get("dayNumber"), expectedVersion: formData.get("expectedVersion") });
  let content: unknown;
  try { content = postGeneratorOutputSchema.parse(JSON.parse(String(formData.get("content") || ""))); }
  catch { return { error: "Review the post fields and try again." }; }
  if (!parsed.success || parsed.data.expectedVersion === undefined) return { error: "This edit request is invalid. Reload and try again." };
  try {
    const { supabase, business } = await requireStrategyOwnerWorkspace(`/post-generator/${parsed.data.weekId}`, true);
    const { error } = await supabase.rpc("update_ai_post_day", { target_business_id: business.id, target_week_id: parsed.data.weekId, target_day_number: parsed.data.dayNumber, target_expected_version: parsed.data.expectedVersion, target_content: content });
    if (error) throw new AIPlatformError(error.code === "40001" ? "CONFLICT" : "STORAGE_ERROR", error.code === "40001" ? "This day changed in another session. Reload before saving." : "The post changes could not be saved.", error);
  } catch (error) { return { error: normalizeAIError(error).message }; }
  revalidatePath(`/post-generator/${parsed.data.weekId}`);
  return { error: null, success: true };
}
