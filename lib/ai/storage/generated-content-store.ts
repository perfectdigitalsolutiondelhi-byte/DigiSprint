import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AIPlatformError } from "../errors";
import type { AIProviderResult } from "../types";
import { estimateProviderCost } from "../usage/cost-estimator";

export async function completeAIJob<T>(supabase: SupabaseClient, values: { jobId: string; featureKey: string; promptKey: string; promptVersion: number; language: string; requestInput: unknown; requestFingerprint: string | null; output: T; result: AIProviderResult<T>; durationMs: number }) {
  const costs = estimateProviderCost(values.result.usage.inputTokens, values.result.usage.outputTokens);
  const { data, error } = await supabase.rpc("complete_ai_job", {
    target_job_id: values.jobId, target_content_type: values.featureKey,
    target_prompt_key: values.promptKey, target_prompt_version: values.promptVersion,
    target_language: values.language, target_request_input: values.requestInput,
    target_request_fingerprint: values.requestFingerprint, target_content: values.output,
    target_provider_request_id: values.result.providerRequestId,
    target_input_tokens: values.result.usage.inputTokens, target_output_tokens: values.result.usage.outputTokens,
    target_estimated_input_cost: costs.inputCost, target_estimated_output_cost: costs.outputCost,
    target_duration_ms: values.durationMs,
  });
  if (error || !data) throw new AIPlatformError("STORAGE_ERROR", "Generated content could not be stored.", error);
  return String(data);
}
