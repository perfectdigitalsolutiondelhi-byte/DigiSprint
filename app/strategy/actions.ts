"use server";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { normalizeAIError } from "../../lib/ai/errors";
import { marketingStrategyInputSchema, strategyActionSchema } from "../../lib/marketing-strategy/schemas";
import { requireStrategyOwnerWorkspace } from "../../lib/marketing-strategy/review-authorization";
import { loadStrategyById } from "../../lib/marketing-strategy/queries";
import { generateStrategy } from "../../lib/marketing-strategy/service";
import { generateWeeklyFoundation } from "../../lib/marketing-strategy/weekly-service";

export type StrategyActionState = { error: string | null };
export async function generateMarketingStrategy(_state: StrategyActionState, formData: FormData): Promise<StrategyActionState> {
  const parsed = marketingStrategyInputSchema.safeParse({ primaryObjective: formData.get("primaryObjective"), preferredLanguage: formData.get("preferredLanguage"), specialFocus: formData.get("specialFocus") || "" });
  if (!parsed.success) return { error: "Check the strategy objective, language and optional focus." };
  const idempotencyKey = String(formData.get("idempotencyKey") || "");
  if (!/^[A-Za-z0-9:_-]{12,160}$/.test(idempotencyKey)) return { error: "This request expired. Refresh the page and try again." };
  let destination: string;
  try { const { business } = await requireStrategyOwnerWorkspace("/strategy", true); const runId = await generateWeeklyFoundation(business.id, parsed.data, idempotencyKey); destination = `/strategy/weekly/${runId}`; }
  catch (error) { return { error: normalizeAIError(error).message }; }
  redirect(destination);
}
export async function regenerateMarketingStrategy(formData: FormData) {
  const parsed = strategyActionSchema.safeParse({ strategyId: formData.get("strategyId") }); if (!parsed.success) return;
  const { supabase, business } = await requireStrategyOwnerWorkspace(`/strategy/${parsed.data.strategyId}`); const source = await loadStrategyById(supabase, business.id, parsed.data.strategyId); if (!source) return;
  try { const result = await generateStrategy(business.id, { ...source.requestInput, preferredLanguage: source.requestInput.preferredLanguage, regeneratedFromId: source.id }, `strategy:regenerate:${randomUUID()}`); redirect(`/strategy/${result.contentId}`); }
  catch (error) { throw normalizeAIError(error); }
}
