"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { AIPlatformError } from "../../../lib/ai/errors";
import { requireStrategyOwnerWorkspace } from "../../../lib/marketing-strategy/review-authorization";
import { parseSectionContent, revisionActionSchema, reviewStatusActionSchema } from "../../../lib/marketing-strategy/review-schema";

export type ReviewActionState = { success: boolean; error: { code: string; message: string } | null };
const failed = (code: string, message: string): ReviewActionState => ({ success: false, error: { code, message } });

export async function saveStrategySection(_state: ReviewActionState, formData: FormData): Promise<ReviewActionState> {
  const parsed = revisionActionSchema.safeParse({ strategyId: formData.get("strategyId"), section: formData.get("section"), content: formData.get("content"), expectedRevisionNumber: formData.get("expectedRevisionNumber") });
  if (!parsed.success) return failed("INVALID_INPUT", "The edited section is invalid.");
  let content: unknown;
  try { content = parseSectionContent(parsed.data.section, parsed.data.content); }
  catch (error) {
    if (error instanceof SyntaxError || error instanceof ZodError) return failed("INVALID_INPUT", "Check the section format and required values.");
    return failed("INVALID_INPUT", "The edited section is invalid.");
  }
  try {
    const { supabase, business } = await requireStrategyOwnerWorkspace(`/strategy/${parsed.data.strategyId}`, true);
    const { error } = await supabase.rpc("create_strategy_revision", {
      target_business_id: business.id, target_strategy_id: parsed.data.strategyId,
      target_section: parsed.data.section, target_content: content,
      target_expected_revision_number: parsed.data.expectedRevisionNumber,
    });
    if (error?.code === "42501") return failed("FORBIDDEN", "Only the workspace owner can edit this strategy.");
    if (error?.code === "P0002") return failed("NOT_FOUND", "The strategy no longer exists.");
    if (error?.code === "40001") return failed("CONFLICT", "This strategy has a newer revision. Reload the page before saving.");
    if (error?.code === "22023") return failed("INVALID_INPUT", "The section failed database validation or cannot be edited in its current state.");
    if (error) throw new AIPlatformError("STORAGE_ERROR", "The revision could not be saved.", error);
    revalidatePath(`/strategy/${parsed.data.strategyId}`);
    revalidatePath("/strategy");
    return { success: true, error: null };
  } catch (error) {
    if (error instanceof AIPlatformError) return failed(error.code, error.message);
    return failed("STORAGE_ERROR", "The revision could not be saved.");
  }
}

export async function changeStrategyStatus(_state: ReviewActionState, formData: FormData): Promise<ReviewActionState> {
  const parsed = reviewStatusActionSchema.safeParse({ strategyId: formData.get("strategyId"), status: formData.get("status"), reason: formData.get("reason") || "" });
  if (!parsed.success) return failed("INVALID_INPUT", "The strategy status request is invalid.");
  try {
    const { supabase, business } = await requireStrategyOwnerWorkspace(`/strategy/${parsed.data.strategyId}`, true);
    const { error } = await supabase.rpc("set_strategy_review_status", {
      target_business_id: business.id, target_strategy_id: parsed.data.strategyId,
      target_status: parsed.data.status, target_reason: parsed.data.reason || null,
    });
    if (error?.code === "42501") return failed("FORBIDDEN", "Only the workspace owner can review this strategy.");
    if (error?.code === "P0002") return failed("NOT_FOUND", "The strategy no longer exists.");
    if (error?.code === "22023") return failed("INVALID_STATE", "This strategy status transition is not allowed.");
    if (error) throw new AIPlatformError("STORAGE_ERROR", "The strategy status could not be changed.", error);
    revalidatePath(`/strategy/${parsed.data.strategyId}`);
    revalidatePath("/strategy");
    revalidatePath("/dashboard");
    return { success: true, error: null };
  } catch (error) {
    if (error instanceof AIPlatformError) return failed(error.code, error.message);
    return failed("STORAGE_ERROR", "The strategy status could not be changed.");
  }
}