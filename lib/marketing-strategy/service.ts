import "server-only";
import { runAIRequest } from "../ai/service";
import type { MarketingStrategyInput, MarketingStrategyOutput } from "./types";
export function generateStrategy(businessId: string, input: MarketingStrategyInput, idempotencyKey: string) {
  return runAIRequest<MarketingStrategyInput, MarketingStrategyOutput>({ businessId, featureKey: "marketing_strategy", promptKey: "marketing_strategy_complete", input, idempotencyKey });
}
