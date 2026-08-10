import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { AIPlatformError } from "../ai/errors";
import { marketingStrategyInputSchema, marketingStrategyOutputSchema } from "./schemas";
import { createOriginalReviewDocument, reviewSectionKeySchema, reviewSectionSchemas, type ReviewSectionKey, type StrategyReviewDocument } from "./review-schema";
import type { StrategyStatus } from "./types";

export type StrategyRevision = {
  id: string;
  revisionNumber: number;
  editorId: string;
  editedSection: ReviewSectionKey;
  previousRevisionId: string | null;
  createdAt: string;
};
export type StrategyReview = {
  id: string;
  title: string;
  status: StrategyStatus;
  reviewReason: string | null;
  promptVersion: number;
  createdAt: string;
  version: number;
  document: StrategyReviewDocument;
  originalContent: ReturnType<typeof marketingStrategyOutputSchema.parse>;
  revisions: StrategyRevision[];
  revisionCount: number;
  revisionPage: number;
  revisionPageCount: number;
  latestRevisionNumber: number;
  selectedRevision: number | null;
};

const REVISION_PAGE_SIZE = 20;

export async function loadStrategyReview(supabase: SupabaseClient, businessId: string, strategyId: string, selectedRevision?: number, revisionPage = 1): Promise<StrategyReview | null> {
  if (!Number.isInteger(revisionPage) || revisionPage < 1) return null;
  const from = (revisionPage - 1) * REVISION_PAGE_SIZE;
  const to = from + REVISION_PAGE_SIZE - 1;
  const [strategyResult, revisionsResult, latestResult] = await Promise.all([
    supabase.from("generated_content").select("id,status,review_reason,prompt_version,created_at,structured_content,context_snapshot,request_input").eq("id", strategyId).eq("business_id", businessId).eq("content_type", "marketing_strategy").maybeSingle(),
    supabase.from("strategy_revisions").select("id,revision_number,editor_id,edited_section,previous_revision_id,created_at", { count: "exact" }).eq("strategy_id", strategyId).eq("business_id", businessId).order("revision_number", { ascending: false }).range(from, to),
    supabase.from("strategy_revisions").select("revision_number").eq("strategy_id", strategyId).eq("business_id", businessId).order("revision_number", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (strategyResult.error || revisionsResult.error || latestResult.error) throw new AIPlatformError("STORAGE_ERROR", "The strategy review could not be loaded.", strategyResult.error || revisionsResult.error || latestResult.error);
  if (!strategyResult.data) return null;

  const content = marketingStrategyOutputSchema.parse(strategyResult.data.structured_content);
  const input = marketingStrategyInputSchema.parse(strategyResult.data.request_input);
  const revisions: StrategyRevision[] = (revisionsResult.data ?? []).map((row) => ({
    id: String(row.id), revisionNumber: Number(row.revision_number), editorId: String(row.editor_id),
    editedSection: reviewSectionKeySchema.parse(row.edited_section), previousRevisionId: row.previous_revision_id ? String(row.previous_revision_id) : null,
    createdAt: String(row.created_at),
  }));
  const revisionCount = revisionsResult.count ?? 0;
  const revisionPageCount = Math.max(1, Math.ceil(revisionCount / REVISION_PAGE_SIZE));
  if (revisionPage > revisionPageCount) return null;
  const latestNumber = Number(latestResult.data?.revision_number ?? 0);
  const revisionLimit = selectedRevision === undefined ? latestNumber : selectedRevision;
  if (!Number.isInteger(revisionLimit) || revisionLimit < 0 || revisionLimit > latestNumber) return null;

  const document = createOriginalReviewDocument({ content, input, context: strategyResult.data.context_snapshot }) as unknown as Record<ReviewSectionKey, unknown>;
  if (revisionLimit > 0) {
    const { data: snapshot, error: snapshotError } = await supabase.rpc("get_strategy_revision_snapshot", { target_business_id: businessId, target_strategy_id: strategyId, target_revision_number: revisionLimit });
    if (snapshotError) throw new AIPlatformError("STORAGE_ERROR", "The strategy revision could not be loaded.", snapshotError);
    for (const row of snapshot ?? []) {
      const section = reviewSectionKeySchema.parse(row.edited_section);
      document[section] = (reviewSectionSchemas[section] as unknown as { parse(value: unknown): unknown }).parse(row.section_content);
    }
  }

  const { count, error: countError } = await supabase.from("generated_content").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("content_type", "marketing_strategy").lte("created_at", strategyResult.data.created_at);
  if (countError) throw new AIPlatformError("STORAGE_ERROR", "The strategy version could not be loaded.", countError);
  return {
    id: String(strategyResult.data.id), title: content.title, status: strategyResult.data.status as StrategyStatus,
    reviewReason: strategyResult.data.review_reason ? String(strategyResult.data.review_reason) : null,
    promptVersion: Number(strategyResult.data.prompt_version), createdAt: String(strategyResult.data.created_at),
    version: count ?? 1, document: document as StrategyReviewDocument, originalContent: content, revisions,
    revisionCount, revisionPage, revisionPageCount, latestRevisionNumber: latestNumber,
    selectedRevision: selectedRevision === undefined ? null : revisionLimit,
  };
}