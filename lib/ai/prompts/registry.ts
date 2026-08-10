import { AIPlatformError } from "../errors";
import { diagnosticPrompt } from "./diagnostic.prompt";
import { marketingStrategyPrompt } from "./marketing-strategy.prompt";
import { marketingStrategyFoundationPrompt } from "./marketing-strategy-foundation.prompt";
import { marketingStrategyExecutionPrompt } from "./marketing-strategy-execution.prompt";
import { marketingStrategyCalendarPrompt } from "./marketing-strategy-calendar.prompt";
import { weeklyStrategyFoundationPrompt } from "./weekly-strategy-foundation.prompt";
import { weeklyStrategyWeekPrompt } from "./weekly-strategy-week.prompt";
import type { PromptDefinition } from "./types";

const registry = new Map<string, PromptDefinition<unknown, unknown>>([
  [diagnosticPrompt.key, diagnosticPrompt as PromptDefinition<unknown, unknown>],
  [marketingStrategyPrompt.key, marketingStrategyPrompt as PromptDefinition<unknown, unknown>],
  [marketingStrategyFoundationPrompt.key, marketingStrategyFoundationPrompt as PromptDefinition<unknown, unknown>],
  [marketingStrategyExecutionPrompt.key, marketingStrategyExecutionPrompt as PromptDefinition<unknown, unknown>],
  [marketingStrategyCalendarPrompt.key, marketingStrategyCalendarPrompt as PromptDefinition<unknown, unknown>],
  [weeklyStrategyFoundationPrompt.key, weeklyStrategyFoundationPrompt as PromptDefinition<unknown, unknown>],
  [weeklyStrategyWeekPrompt.key, weeklyStrategyWeekPrompt as PromptDefinition<unknown, unknown>],
]);

export function getPrompt(key: string) {
  const prompt = registry.get(key);
  if (!prompt) throw new AIPlatformError("INVALID_INPUT", `Unknown prompt key: ${key}`);
  return prompt;
}
