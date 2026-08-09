import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AIPlatformError } from "./errors";
import type { AIModelProfile } from "./types";

export async function loadAISettings(supabase: SupabaseClient, businessId: string) {
  const { data, error } = await supabase.from("ai_settings").select("is_enabled,model_profile,max_output_tokens,include_business_context").eq("business_id", businessId).maybeSingle();
  if (error) throw new AIPlatformError("STORAGE_ERROR", "AI settings could not be loaded.", error);
  if (data && !data.is_enabled) throw new AIPlatformError("AI_DISABLED", "AI features are disabled for this business.");
  return {
    modelProfile: (data?.model_profile || "balanced") as AIModelProfile,
    maxOutputTokens: data?.max_output_tokens || 2_000,
    includeBusinessContext: data?.include_business_context ?? true,
  };
}
