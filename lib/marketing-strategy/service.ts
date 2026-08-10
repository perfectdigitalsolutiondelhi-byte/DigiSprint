import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import { authorizeAIRequest } from "../ai/security/authorize-ai-request";
import { loadBusinessContext } from "../ai/context/business-context";
import { AIPlatformError } from "../ai/errors";
import { getPrompt } from "../ai/prompts/registry";
import { runAIRequest } from "../ai/service";
import { loadAISettings } from "../ai/settings";
import { createStrategyFingerprint } from "./cache";
import {
  marketingStrategyCalendarSchema,
  marketingStrategyExecutionSchema,
  marketingStrategyFoundationSchema,
  marketingStrategyOutputSchema,
} from "./schemas";
import type {
  MarketingStrategyCalendar,
  MarketingStrategyCalendarInput,
  MarketingStrategyExecution,
  MarketingStrategyExecutionInput,
  MarketingStrategyFoundation,
  MarketingStrategyInput,
} from "./types";

type CompletedPart<T> = { contentId: string; output: T };
type StrategyPart = "foundation" | "execution" | "calendar";

function partKey(idempotencyKey: string, part: StrategyPart) {
  const fingerprint = createHash("sha256").update(idempotencyKey).digest("hex");
  return "strategy:" + part + ":" + fingerprint;
}

async function loadCompletedPart<T>(
  supabase: SupabaseClient,
  businessId: string,
  idempotencyKey: string,
  contentType: string,
  schema: z.ZodType<T>,
): Promise<CompletedPart<T> | null> {
  const { data: job, error: jobError } = await supabase
    .from("ai_jobs")
    .select("id,status")
    .eq("business_id", businessId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (jobError) throw new AIPlatformError("STORAGE_ERROR", "The strategy generation state could not be loaded.", jobError);
  if (!job || job.status === "failed") return null;
  if (job.status !== "succeeded") throw new AIPlatformError("DUPLICATE_REQUEST", "This strategy generation step is already running.");

  const { data: content, error: contentError } = await supabase
    .from("generated_content")
    .select("id,structured_content")
    .eq("business_id", businessId)
    .eq("ai_job_id", job.id)
    .eq("content_type", contentType)
    .maybeSingle();
  if (contentError || !content) throw new AIPlatformError("STORAGE_ERROR", "A completed strategy generation step could not be loaded.", contentError);
  return { contentId: String(content.id), output: schema.parse(content.structured_content) };
}

export async function generateStrategy(businessId: string, input: MarketingStrategyInput, idempotencyKey: string) {
  const { supabase } = await authorizeAIRequest(businessId);
  const foundationKey = partKey(idempotencyKey, "foundation");
  const executionKey = partKey(idempotencyKey, "execution");
  const calendarKey = partKey(idempotencyKey, "calendar");

  const savedFoundation = await loadCompletedPart(supabase, businessId, foundationKey, "marketing_strategy_foundation", marketingStrategyFoundationSchema);
  const foundation = savedFoundation ?? await runAIRequest<MarketingStrategyInput, MarketingStrategyFoundation>({
    businessId,
    featureKey: "marketing_strategy_foundation",
    promptKey: "marketing_strategy_foundation",
    input,
    language: input.preferredLanguage,
    idempotencyKey: foundationKey,
  });

  const executionInput: MarketingStrategyExecutionInput = { strategyRequest: input, foundation: foundation.output };
  const savedExecution = await loadCompletedPart(supabase, businessId, executionKey, "marketing_strategy_execution", marketingStrategyExecutionSchema);
  const execution = savedExecution ?? await runAIRequest<MarketingStrategyExecutionInput, MarketingStrategyExecution>({
    businessId,
    featureKey: "marketing_strategy_execution",
    promptKey: "marketing_strategy_execution",
    input: executionInput,
    language: input.preferredLanguage,
    idempotencyKey: executionKey,
  });

  const executive = { ...foundation.output, ...execution.output };
  const calendarInput: MarketingStrategyCalendarInput = {
    strategyRequest: input,
    executiveContext: {
      title: executive.title,
      executiveSummary: executive.executiveSummary,
      targetAudience: executive.targetAudience,
      platformStrategies: executive.platformStrategies,
      marketingPriorities: executive.marketingPriorities,
    },
  };
  const savedCalendar = await loadCompletedPart(supabase, businessId, calendarKey, "marketing_strategy_calendar", marketingStrategyCalendarSchema);
  const calendar = savedCalendar ?? await runAIRequest<MarketingStrategyCalendarInput, MarketingStrategyCalendar>({
    businessId,
    featureKey: "marketing_strategy_calendar",
    promptKey: "marketing_strategy_calendar",
    input: calendarInput,
    language: input.preferredLanguage,
    idempotencyKey: calendarKey,
  });

  const output = marketingStrategyOutputSchema.parse({ ...executive, ...calendar.output });
  const [context, settings] = await Promise.all([
    loadBusinessContext(supabase, businessId),
    loadAISettings(supabase, businessId),
  ]);
  const prompt = getPrompt("marketing_strategy_complete");
  const fingerprintContext = settings.includeBusinessContext ? context : { ...context, description: "", audience: "", platforms: [], goals: [] };
  const requestFingerprint = createStrategyFingerprint({
    context: fingerprintContext,
    input,
    promptKey: prompt.key,
    promptVersion: prompt.version,
    modelProfile: settings.modelProfile || prompt.modelProfile,
  });
  const { data: contentId, error } = await supabase.rpc("finalize_marketing_strategy_parts", {
    target_business_id: businessId,
    target_foundation_content_id: foundation.contentId,
    target_execution_content_id: execution.contentId,
    target_calendar_content_id: calendar.contentId,
    target_idempotency_key: idempotencyKey,
    target_language: input.preferredLanguage,
    target_request_input: input,
    target_request_fingerprint: requestFingerprint,
  });
  if (error || !contentId) throw new AIPlatformError("STORAGE_ERROR", "The completed strategy could not be stored.", error);
  return { contentId: String(contentId), output };
}