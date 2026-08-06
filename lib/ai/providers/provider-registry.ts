import "server-only";
import { getAIConfig } from "../config";
import { AIPlatformError } from "../errors";
import type { AIProvider, AIModelProfile } from "../types";
import { OpenAIProvider } from "./openai-provider";

export function resolveProvider(profile: AIModelProfile = "balanced"): { provider: AIProvider; model: string; timeoutMs: number } {
  const config = getAIConfig(profile);
  if (config.provider !== "openai") throw new AIPlatformError("AI_NOT_CONFIGURED", `Unsupported AI provider: ${config.provider}`);
  return { provider: new OpenAIProvider(config.apiKey), model: config.model, timeoutMs: config.timeoutMs };
}
