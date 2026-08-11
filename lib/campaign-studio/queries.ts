import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AIPlatformError } from "../ai/errors";
import { campaignAIOutputSchema } from "./schema";

type ApprovedWeekRow = { id: string; week_number: number; weekly_goal: string; total_count: number };

const pageSize = 10;
const safePage = (value: number) => Number.isInteger(value) && value > 0 ? value : 1;

export async function loadCampaignBuilderData(supabase: SupabaseClient, businessId: string, campaignPageValue = 1, weekPageValue = 1) {
  const campaignPage = safePage(campaignPageValue);
  const weekPage = safePage(weekPageValue);
  const [weeksResult, campaignsResult] = await Promise.all([
    supabase.rpc("list_campaign_studio_approved_weeks", { target_business_id: businessId, target_offset: (weekPage - 1) * pageSize, target_limit: pageSize }),
    supabase.from("campaign_studio_campaigns").select("id,name,objective,status,has_plan,plan_status,last_generated_at", { count: "exact" }).eq("business_id", businessId).order("updated_at", { ascending: false }).range((campaignPage - 1) * pageSize, campaignPage * pageSize - 1),
  ]);
  if (weeksResult.error || campaignsResult.error) throw new AIPlatformError("STORAGE_ERROR", "Campaign Studio data could not be loaded.", weeksResult.error || campaignsResult.error);
  const weekRows = (weeksResult.data ?? []) as ApprovedWeekRow[];
  const weekIds = weekRows.map((week) => String(week.id));
  const postsResult = weekIds.length
    ? await supabase.from("ai_post_days").select("id,week_id,day_number").eq("business_id", businessId).in("week_id", weekIds).order("day_number")
    : { data: [], error: null };
  if (postsResult.error) throw new AIPlatformError("STORAGE_ERROR", "Eligible campaign posts could not be loaded.", postsResult.error);
  const weekTotal = Number(weekRows[0]?.total_count ?? 0);
  const campaignTotal = campaignsResult.count ?? 0;
  return {
    weeks: {
      items: weekRows.map((week) => ({ id: String(week.id), weekNumber: Number(week.week_number), weeklyGoal: String(week.weekly_goal), postIds: (postsResult.data ?? []).filter((post) => post.week_id === week.id).map((post) => ({ id: String(post.id), dayNumber: Number(post.day_number) })) })),
      page: weekPage, pageSize, totalCount: weekTotal, nextCursor: weekPage * pageSize < weekTotal ? String(weekPage + 1) : null,
    },
    campaigns: {
      items: (campaignsResult.data ?? []).map((campaign) => ({ id: String(campaign.id), name: String(campaign.name), objective: String(campaign.objective), status: String(campaign.status), hasPlan: Boolean(campaign.has_plan), planStatus: String(campaign.plan_status), lastGeneratedAt: campaign.last_generated_at ? String(campaign.last_generated_at) : null })),
      page: campaignPage, pageSize, totalCount: campaignTotal, nextCursor: campaignPage * pageSize < campaignTotal ? String(campaignPage + 1) : null,
    },
  };
}

export async function loadCampaignWorkspace(supabase: SupabaseClient, businessId: string, campaignId: string) {
  const { data: campaign, error } = await supabase.from("campaign_studio_campaigns").select("id,name,objective,status,version,current_plan").eq("id", campaignId).eq("business_id", businessId).maybeSingle();
  if (error) throw new AIPlatformError("STORAGE_ERROR", "The campaign could not be loaded.", error);
  if (!campaign) return null;
  const { data: assets, error: assetError } = await supabase.from("campaign_studio_assets").select("id,day_number,asset_type,title,brief,status,version").eq("campaign_id", campaignId).eq("business_id", businessId).order("day_number");
  if (assetError) throw new AIPlatformError("STORAGE_ERROR", "Campaign assets could not be loaded.", assetError);
  return { id: String(campaign.id), name: String(campaign.name), objective: String(campaign.objective), status: String(campaign.status) as "draft" | "active" | "completed" | "archived", version: Number(campaign.version), plan: campaign.current_plan ? campaignAIOutputSchema.parse(campaign.current_plan) : null, assets: (assets ?? []).map((asset) => ({ id: String(asset.id), dayNumber: Number(asset.day_number), assetType: String(asset.asset_type), title: String(asset.title), brief: String(asset.brief), status: String(asset.status) as "planned" | "in_progress" | "ready" | "published", version: Number(asset.version) })) };
}
