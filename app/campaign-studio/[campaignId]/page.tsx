import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "../../../components/layout/AppShell";
import { loadCampaignWorkspace } from "../../../lib/campaign-studio/queries";
import { requireStrategyOwnerWorkspace } from "../../../lib/marketing-strategy/review-authorization";
import styles from "../campaign-studio.module.css";
import { CampaignWorkspace } from "./CampaignWorkspace";

export const metadata: Metadata = { title: "Campaign Workspace", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function CampaignPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params; const { supabase, user, business } = await requireStrategyOwnerWorkspace(`/campaign-studio/${campaignId}`);
  const campaign = await loadCampaignWorkspace(supabase, business.id, campaignId); if (!campaign) notFound();
  return <AppShell userName={typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : null} userEmail={user.email} businessName={business.name} businessType={business.industry}><main className={`dashboard-content ${styles.page}`}><CampaignWorkspace campaign={campaign}/></main></AppShell>;
}
