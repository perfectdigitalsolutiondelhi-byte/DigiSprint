"use server";

import { revalidatePath } from "next/cache";
import { AIPlatformError, normalizeAIError } from "../../../lib/ai/errors";
import { campaignAssetActionSchema, campaignIdSchema, campaignStatusActionSchema } from "../../../lib/campaign-studio/schema";
import { generateCampaignPlan } from "../../../lib/campaign-studio/service";
import { requireStrategyOwnerWorkspace } from "../../../lib/marketing-strategy/review-authorization";

export type WorkspaceActionState = { error: string | null; success?: boolean; resultId?: string };

export async function generateCampaignPlanAction(_state: WorkspaceActionState, formData: FormData): Promise<WorkspaceActionState> {
  const parsed = campaignIdSchema.safeParse({ campaignId: formData.get("campaignId"), requestKey: formData.get("requestKey") });
  if (!parsed.success) return { error: "This Campaign AI request is invalid." };
  try { const { business } = await requireStrategyOwnerWorkspace(`/campaign-studio/${parsed.data.campaignId}`, true); await generateCampaignPlan(business.id, parsed.data.campaignId, parsed.data.requestKey); }
  catch (error) { return { error: normalizeAIError(error).message }; }
  revalidatePath(`/campaign-studio/${parsed.data.campaignId}`); return { error: null, success: true, resultId: crypto.randomUUID() };
}

export async function updateCampaignStatusAction(_state: WorkspaceActionState, formData: FormData): Promise<WorkspaceActionState> {
  const parsed = campaignStatusActionSchema.safeParse({ campaignId: formData.get("campaignId"), status: formData.get("status"), expectedVersion: formData.get("expectedVersion") });
  if (!parsed.success) return { error: "This campaign status request is invalid." };
  try { const { supabase, business } = await requireStrategyOwnerWorkspace(`/campaign-studio/${parsed.data.campaignId}`, true); const { error } = await supabase.rpc("update_campaign_studio_status", { target_business_id: business.id, target_campaign_id: parsed.data.campaignId, target_status: parsed.data.status, target_expected_version: parsed.data.expectedVersion }); if (error) throw new AIPlatformError(error.code === "40001" ? "CONFLICT" : "STORAGE_ERROR", error.code === "40001" ? "This campaign changed in another session. Reload and try again." : "The campaign status could not be updated.", error); }
  catch (error) { return { error: normalizeAIError(error).message }; }
  revalidatePath(`/campaign-studio/${parsed.data.campaignId}`); return { error: null, success: true, resultId: crypto.randomUUID() };
}

export async function updateCampaignAssetAction(_state: WorkspaceActionState, formData: FormData): Promise<WorkspaceActionState> {
  const parsed = campaignAssetActionSchema.safeParse({ campaignId: formData.get("campaignId"), assetId: formData.get("assetId"), status: formData.get("status"), expectedVersion: formData.get("expectedVersion") });
  if (!parsed.success) return { error: "This asset update is invalid." };
  try { const { supabase, business } = await requireStrategyOwnerWorkspace(`/campaign-studio/${parsed.data.campaignId}`, true); const { error } = await supabase.rpc("update_campaign_studio_asset", { target_business_id: business.id, target_campaign_id: parsed.data.campaignId, target_asset_id: parsed.data.assetId, target_status: parsed.data.status, target_expected_version: parsed.data.expectedVersion }); if (error) throw new AIPlatformError(error.code === "40001" ? "CONFLICT" : "STORAGE_ERROR", error.code === "40001" ? "This asset changed in another session. Reload and try again." : "The asset could not be updated.", error); }
  catch (error) { return { error: normalizeAIError(error).message }; }
  revalidatePath(`/campaign-studio/${parsed.data.campaignId}`); return { error: null, success: true, resultId: crypto.randomUUID() };
}
