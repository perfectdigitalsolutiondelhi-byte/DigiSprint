"use server";

import { redirect } from "next/navigation";
import { AIPlatformError, normalizeAIError } from "../../lib/ai/errors";
import { requireStrategyOwnerWorkspace } from "../../lib/marketing-strategy/review-authorization";
import { campaignBuilderSchema } from "../../lib/campaign-studio/schema";

export type CampaignActionState = { error: string | null; success?: boolean };

export async function createCampaignAction(_state: CampaignActionState, formData: FormData): Promise<CampaignActionState> {
  const parsed = campaignBuilderSchema.safeParse({
    name: formData.get("name"), objective: formData.get("objective"), weekId: formData.get("weekId"),
    sourcePostIds: formData.getAll("sourcePostIds"), requestKey: formData.get("requestKey"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Review the campaign details." };
  let campaignId: string;
  try {
    const { supabase, business } = await requireStrategyOwnerWorkspace("/campaign-studio", true);
    const { data, error } = await supabase.rpc("create_campaign_studio_campaign", {
      target_business_id: business.id, target_week_id: parsed.data.weekId, target_name: parsed.data.name,
      target_objective: parsed.data.objective, target_post_day_ids: parsed.data.sourcePostIds, target_request_key: parsed.data.requestKey,
    });
    if (error || !data) throw new AIPlatformError(error?.code === "40001" ? "CONFLICT" : "STORAGE_ERROR", error?.code === "40001" ? "This campaign request conflicts with existing data." : "The campaign could not be created.", error);
    campaignId = String(data);
  } catch (error) { return { error: normalizeAIError(error).message }; }
  redirect(`/campaign-studio/${campaignId}`);
}
