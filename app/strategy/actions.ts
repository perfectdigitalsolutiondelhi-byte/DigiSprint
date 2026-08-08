"use server";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { loadBusinessContext } from "../../lib/ai/context/business-context";
import { normalizeAIError } from "../../lib/ai/errors";
import { marketingStrategyInputSchema, strategyActionSchema } from "../../lib/marketing-strategy/schemas";
import { requireStrategyWorkspace } from "../../lib/marketing-strategy/authorization";
import { findCachedStrategy } from "../../lib/marketing-strategy/cache";
import { loadStrategyById } from "../../lib/marketing-strategy/queries";
import { generateStrategy } from "../../lib/marketing-strategy/service";

export type StrategyActionState = { error: string | null };
export async function generateMarketingStrategy(_state: StrategyActionState, formData: FormData): Promise<StrategyActionState> {
  const { supabase, business } = await requireStrategyWorkspace();
  const parsed = marketingStrategyInputSchema.safeParse({ primaryObjective: formData.get("primaryObjective"), preferredLanguage: formData.get("preferredLanguage"), specialFocus: formData.get("specialFocus") || "" });
  if (!parsed.success) return { error: "Check the strategy objective, language and optional focus." };
  const idempotencyKey = String(formData.get("idempotencyKey") || "");
  if (!/^[A-Za-z0-9:_-]{12,160}$/.test(idempotencyKey)) return { error: "This request expired. Refresh the page and try again." };
  let destination: string;
  try {
    const context = await loadBusinessContext(supabase, business.id);
    const cachedId = await findCachedStrategy(supabase, business.id, context, 1);
    if (cachedId) destination = `/strategy/${cachedId}?cached=1`;
    else {
      const result = await generateStrategy(business.id, parsed.data, idempotencyKey);
      destination = `/strategy/${result.contentId}`;
    }
  } catch (error) {
    return { error: normalizeAIError(error).message };
  }
  redirect(destination);
}
export async function acceptMarketingStrategy(formData: FormData) {
  const parsed = strategyActionSchema.safeParse({ strategyId: formData.get("strategyId") });
  if (!parsed.success) return;
  const { supabase, business } = await requireStrategyWorkspace(`/strategy/${parsed.data.strategyId}`);
  const strategy = await loadStrategyById(supabase, business.id, parsed.data.strategyId);
  if (!strategy) return;
  const timestamp = new Date().toISOString();
  const { error: archiveError } = await supabase.from("generated_content").update({ status: "archived", updated_at: timestamp }).eq("business_id", business.id).eq("content_type", "marketing_strategy").eq("status", "accepted").neq("id", strategy.id);
  if (archiveError) throw new Error("Unable to archive the previous strategy.");
  const { error } = await supabase.from("generated_content").update({ status: "accepted", updated_at: timestamp }).eq("id", strategy.id).eq("business_id", business.id);
  if (error) throw new Error("Unable to accept this strategy.");
  redirect(`/strategy/${strategy.id}?accepted=1`);
}
export async function regenerateMarketingStrategy(formData: FormData) {
  const parsed = strategyActionSchema.safeParse({ strategyId: formData.get("strategyId") });
  if (!parsed.success) return;
  const { supabase, business } = await requireStrategyWorkspace(`/strategy/${parsed.data.strategyId}`);
  const source = await loadStrategyById(supabase, business.id, parsed.data.strategyId);
  if (!source) return;
  let destination: string;
  try {
    const result = await generateStrategy(business.id, { primaryObjective: "Refresh the complete marketing strategy", preferredLanguage: source.language === "hi" || source.language === "hinglish" ? source.language : "en", specialFocus: "", regeneratedFromId: source.id }, `strategy:regenerate:${randomUUID()}`);
    destination = `/strategy/${result.contentId}`;
  } catch (error) {
    throw normalizeAIError(error);
  }
  redirect(destination);
}
