import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AIPlatformError } from "../errors";
import type { BusinessAIContext } from "../types";

export async function startAIJob(supabase: SupabaseClient, values: { businessId: string; featureKey: string; promptKey: string; promptVersion: number; provider: string; model: string; input: unknown; context: BusinessAIContext; idempotencyKey: string }) {
  const { data, error } = await supabase.rpc("start_ai_job", {
    target_business_id: values.businessId, target_feature_key: values.featureKey,
    target_prompt_key: values.promptKey, target_prompt_version: values.promptVersion,
    target_provider: values.provider, target_model: values.model, target_input: values.input,
    target_context: values.context, target_idempotency_key: values.idempotencyKey,
  });
  if (error || !data) {
    if (error?.code === "23505") throw new AIPlatformError("DUPLICATE_REQUEST", "This AI request has already been submitted.", error);
    throw new AIPlatformError("STORAGE_ERROR", "The AI job could not be started.", error);
  }
  return String(data);
}

export async function failAIJob(supabase: SupabaseClient, jobId: string, errorCode: string, durationMs: number) {
  await supabase.rpc("fail_ai_job", { target_job_id: jobId, target_error_code: errorCode, target_duration_ms: durationMs });
}
