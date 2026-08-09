import "server-only";
import { ZodError } from "zod";
import { getPrompt } from "./prompts/registry";
import { renderPrompt } from "./prompts/renderer";
import { resolveProvider } from "./providers/provider-registry";
import { authorizeAIRequest } from "./security/authorize-ai-request";
import { enforceInputLimits } from "./security/input-limits";
import { loadBusinessContext } from "./context/business-context";
import { completeAIJob } from "./storage/generated-content-store";
import { failAIJob, startAIJob } from "./storage/ai-job-store";
import { AIPlatformError, normalizeAIError } from "./errors";
import { featureKeySchema, idempotencyKeySchema } from "./schemas";
import { loadAISettings } from "./settings";
import { validateCostConfiguration } from "./usage/cost-estimator";
import type { AIRequest, AIResult } from "./types";
import { createStrategyFingerprint } from "../marketing-strategy/cache";
import type { MarketingStrategyInput } from "../marketing-strategy/types";

export async function runAIRequest<TInput, TOutput>(request: AIRequest<TInput>): Promise<AIResult<TOutput>> {
  let jobId: string | null = null;
  const startedAt = Date.now();
  let supabase: Awaited<ReturnType<typeof authorizeAIRequest>>["supabase"] | null = null;
  try {
    featureKeySchema.parse(request.featureKey);
    idempotencyKeySchema.parse(request.idempotencyKey);
    enforceInputLimits(request.input);
    const authorization = await authorizeAIRequest(request.businessId);
    supabase = authorization.supabase;
    const context = await loadBusinessContext(supabase, request.businessId);
    const settings = await loadAISettings(supabase, request.businessId);
    const promptContext = settings.includeBusinessContext ? context : { ...context, description: "", audience: "", platforms: [], goals: [] };
    const prompt = getPrompt(request.promptKey);
    const rendered = renderPrompt(prompt, request.input, promptContext);
    const requestFingerprint = request.featureKey === "marketing_strategy"
      ? createStrategyFingerprint({ context: promptContext, input: rendered.parsedInput as MarketingStrategyInput, promptKey: prompt.key, promptVersion: prompt.version, modelProfile: settings.modelProfile || prompt.modelProfile })
      : null;
    const { provider, model, timeoutMs } = resolveProvider(settings.modelProfile || prompt.modelProfile);
    validateCostConfiguration();
    jobId = await startAIJob(supabase, {
      businessId: request.businessId, featureKey: request.featureKey, promptKey: prompt.key,
      promptVersion: prompt.version, provider: provider.name, model, input: rendered.parsedInput,
      context: promptContext, idempotencyKey: request.idempotencyKey,
    });
    const providerResult = await provider.generateStructured({
      schema: prompt.outputSchema, schemaName: prompt.schemaName, systemPrompt: rendered.systemPrompt,
      userPrompt: rendered.userPrompt, model, timeoutMs, maxOutputTokens: settings.maxOutputTokens,
    });
    const output = prompt.outputSchema.parse(providerResult.data) as TOutput;
    const contentId = await completeAIJob(supabase, {
      jobId, featureKey: request.featureKey, promptKey: prompt.key, promptVersion: prompt.version,
      language: request.language, requestInput: rendered.parsedInput, requestFingerprint,
      output, result: providerResult, durationMs: Date.now() - startedAt,
    });
    return { jobId, contentId, output, usage: providerResult.usage };
  } catch (error) {
    const normalized = error instanceof ZodError ? new AIPlatformError("INVALID_INPUT", "The AI request or response was invalid.", error) : normalizeAIError(error);
    if (supabase && jobId) await failAIJob(supabase, jobId, normalized.code, Date.now() - startedAt);
    throw normalized;
  }
}
