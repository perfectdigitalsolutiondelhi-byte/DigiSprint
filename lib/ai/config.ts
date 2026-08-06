import "server-only";
import type { AIModelProfile } from "./types";
import { AIPlatformError } from "./errors";

const profileModels: Record<AIModelProfile, string | undefined> = {
  fast: process.env.AI_MODEL_FAST,
  balanced: process.env.AI_MODEL_BALANCED,
  quality: process.env.AI_MODEL_QUALITY,
};

export function getAIConfig(profile: AIModelProfile = "balanced") {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();
  const apiKey = process.env.AI_API_KEY;
  const model = profileModels[profile];
  if (!apiKey || !model) throw new AIPlatformError("AI_NOT_CONFIGURED", "The AI provider, key and model profile must be configured.");
  return { provider, apiKey, model, timeoutMs: 45_000 };
}
