import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "../../../components/layout/AppShell";
import { requireStrategyOwnerWorkspace } from "../../../lib/marketing-strategy/review-authorization";
import { loadStrategyReview } from "../../../lib/marketing-strategy/review-queries";
import { StrategyReviewWorkspace } from "./StrategyReviewWorkspace";

export const metadata: Metadata = { title: "Marketing Strategy Review", description: "Review, revise and approve your saved marketing strategy.", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StrategyDetailPage({ params, searchParams }: {
  params: Promise<{ strategyId: string }>;
  searchParams: Promise<{ revision?: string; revisionPage?: string }>;
}) {
  const { strategyId } = await params;
  const query = await searchParams;
  const selectedRevision = query.revision === undefined ? undefined : Number(query.revision);
  const revisionPage = query.revisionPage === undefined ? 1 : Number(query.revisionPage);
  if (selectedRevision !== undefined && (!Number.isInteger(selectedRevision) || selectedRevision < 0)) notFound();
  if (!Number.isInteger(revisionPage) || revisionPage < 1) notFound();

  const { supabase, user, business } = await requireStrategyOwnerWorkspace(`/strategy/${strategyId}`);
  const strategy = await loadStrategyReview(supabase, business.id, strategyId, selectedRevision, revisionPage);
  if (!strategy) notFound();
  const editorName = typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : user.email ?? "Workspace owner";

  return <AppShell userName={editorName} userEmail={user.email} businessName={business.name} businessType={business.industry}>
    <div className="dashboard-content strategy-detail"><StrategyReviewWorkspace strategy={strategy} editorName={editorName}/></div>
  </AppShell>;
}