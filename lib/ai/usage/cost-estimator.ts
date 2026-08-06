import "server-only";
import { AIPlatformError } from "../errors";

function readRate(name: "AI_INPUT_COST_PER_1M_TOKENS" | "AI_OUTPUT_COST_PER_1M_TOKENS") {
  const raw = process.env[name];
  if (!raw?.trim()) throw new AIPlatformError("AI_NOT_CONFIGURED", `${name} must be configured.`);
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new AIPlatformError("AI_NOT_CONFIGURED", `${name} must be configured as a non-negative number.`);
  return value;
}

export function validateCostConfiguration() {
  readRate("AI_INPUT_COST_PER_1M_TOKENS");
  readRate("AI_OUTPUT_COST_PER_1M_TOKENS");
}

export function estimateProviderCost(inputTokens: number, outputTokens: number) {
  const inputCost = (inputTokens / 1_000_000) * readRate("AI_INPUT_COST_PER_1M_TOKENS");
  const outputCost = (outputTokens / 1_000_000) * readRate("AI_OUTPUT_COST_PER_1M_TOKENS");
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}
