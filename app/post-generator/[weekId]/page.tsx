import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "../../../components/layout/AppShell";
import { requireStrategyOwnerWorkspace } from "../../../lib/marketing-strategy/review-authorization";
import { loadPostGeneratorWorkspace } from "../../../lib/post-generator/queries";
import styles from "../post-generator.module.css";
import { PostGeneratorWorkspace } from "./PostGeneratorWorkspace";

export const metadata: Metadata = { title: "Weekly AI Posts", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PostGeneratorWeekPage({ params }: { params: Promise<{ weekId: string }> }) {
  const { weekId } = await params;
  const { supabase, user, business } = await requireStrategyOwnerWorkspace(`/post-generator/${weekId}`);
  const workspace = await loadPostGeneratorWorkspace(supabase, business.id, weekId);
  if (!workspace) notFound();
  return <AppShell userName={typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : null} userEmail={user.email} businessName={business.name} businessType={business.industry}>
    <main className={`dashboard-content ${styles.page}`}><header className={styles.hero}><span>Approved Week {workspace.weekNumber}</span><h1>AI Post Generator</h1><p>{workspace.strategy.weeklyGoal}</p></header><PostGeneratorWorkspace weekId={workspace.id} weekNumber={workspace.weekNumber} strategy={workspace.strategy} savedDays={workspace.days}/></main>
  </AppShell>;
}
