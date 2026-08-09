"use server";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { loadBusinessContext } from "../../lib/ai/context/business-context";
import { AIPlatformError, normalizeAIError } from "../../lib/ai/errors";
import { getPrompt } from "../../lib/ai/prompts/registry";
import { loadAISettings } from "../../lib/ai/settings";
import { marketingStrategyInputSchema, strategyActionSchema } from "../../lib/marketing-strategy/schemas";
import { requireStrategyWorkspace } from "../../lib/marketing-strategy/authorization";
import { createStrategyFingerprint, findCachedStrategy } from "../../lib/marketing-strategy/cache";
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
    const [context, settings] = await Promise.all([loadBusinessContext(supabase, business.id), loadAISettings(supabase, business.id)]);
    const prompt = getPrompt("marketing_strategy_complete");
    const fingerprintContext = settings.includeBusinessContext ? context : { ...context, description: "", audience: "", platforms: [], goals: [] };
    const fingerprint = createStrategyFingerprint({ context: fingerprintContext, input: parsed.data, promptKey: prompt.key, promptVersion: prompt.version, modelProfile: settings.modelProfile || prompt.modelProfile });
    const cachedId = await findCachedStrategy(supabase, business.id, fingerprint);
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
  const { error } = await supabase.rpc("accept_marketing_strategy", { target_business_id: business.id, target_strategy_id: parsed.data.strategyId });
  if (error?.code === "P0002") throw new AIPlatformError("CONFLICT", "This strategy is no longer available to accept.", error);
  if (error) throw new AIPlatformError("STORAGE_ERROR", "Unable to accept this strategy.", error);
  redirect(`/strategy/${parsed.data.strategyId}?accepted=1`);
}
export async function regenerateMarketingStrategy(formData: FormData) {
  const parsed = strategyActionSchema.safeParse({ strategyId: formData.get("strategyId") });
  if (!parsed.success) return;
  const { supabase, business } = await requireStrategyWorkspace(`/strategy/${parsed.data.strategyId}`);
  const source = await loadStrategyById(supabase, business.id, parsed.data.strategyId);
  if (!source) return;
  let destination: string;
  try {
    const result = await generateStrategy(business.id, { ...source.requestInput, preferredLanguage: source.requestInput.preferredLanguage, regeneratedFromId: source.id }, `strategy:regenerate:${randomUUID()}`);
    destination = `/strategy/${result.contentId}`;
  } catch (error) {
    throw normalizeAIError(error);
  }
  redirect(destination);
}
