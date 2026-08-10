import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "../../../../components/layout/AppShell";
import { requireStrategyOwnerWorkspace } from "../../../../lib/marketing-strategy/review-authorization";
import { loadWeeklyWorkspace } from "../../../../lib/marketing-strategy/weekly-queries";
import { WeeklyWorkspace } from "./WeeklyWorkspace";
import styles from "./weekly.module.css";
export const metadata: Metadata = { title: "Weekly Strategy Workspace", robots: { index: false, follow: false } }; export const dynamic = "force-dynamic";
export default async function Page({ params, searchParams }: { params: Promise<{ runId: string }>; searchParams: Promise<{ stage?: string; revision?: string }> }) {
  const { runId } = await params; const query = await searchParams; const stage = Math.min(4, Math.max(0, Number(query.stage) || 0)); const revision = Number(query.revision) || undefined;
  const { supabase, user, business } = await requireStrategyOwnerWorkspace(`/strategy/weekly/${runId}`); const workspace = await loadWeeklyWorkspace(supabase, business.id, runId, stage, revision); if (!workspace) notFound();
  const stages = [{ number: 0, title: "Foundation", status: workspace.foundation_status, version: workspace.foundation_version, content: workspace.foundation_content }, ...[1,2,3,4].map((number) => { const week = workspace.weeks.find((item) => item.week_number === number); return { number, title: `Week ${number}`, status: week?.status ?? "pending" as const, version: week?.version ?? 0, content: week?.content ?? null }; })];
  return <AppShell userName={typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : null} userEmail={user.email} businessName={business.name} businessType={business.industry}><main className="dashboard-content strategy-workspace"><header className={styles.hero}><span>Weekly Marketing Strategy</span><h1>Build and approve your monthly marketing strategy one week at a time.</h1><p>A focused workspace for reviewing your foundation, planning each week and tracking progress.</p></header><WeeklyWorkspace runId={runId} stages={stages} currentStage={stage} revisions={workspace.revisions} selectedRevision={workspace.selectedContent}/></main></AppShell>;
}
