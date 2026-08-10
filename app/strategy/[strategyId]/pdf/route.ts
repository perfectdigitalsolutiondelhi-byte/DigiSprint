import { notFound } from "next/navigation";
import { requireStrategyOwnerWorkspace } from "../../../../lib/marketing-strategy/review-authorization";
import { buildStrategyPdf } from "../../../../lib/marketing-strategy/review-pdf";
import { loadStrategyReview } from "../../../../lib/marketing-strategy/review-queries";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ strategyId: string }> }) {
  const { strategyId } = await params;
  const revisionValue = new URL(request.url).searchParams.get("revision");
  const selectedRevision = revisionValue === null ? undefined : Number(revisionValue);
  if (selectedRevision !== undefined && (!Number.isInteger(selectedRevision) || selectedRevision < 0)) notFound();
  const { supabase, business } = await requireStrategyOwnerWorkspace(`/strategy/${strategyId}`);
  const strategy = await loadStrategyReview(supabase, business.id, strategyId, selectedRevision);
  if (!strategy) notFound();
  const bytes = await buildStrategyPdf(strategy);
  const filename = `strategy-v${strategy.version}-revision-${strategy.selectedRevision ?? strategy.latestRevisionNumber}.pdf`;
  return new Response(new Blob([bytes as Uint8Array<ArrayBuffer>]), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" } });
}