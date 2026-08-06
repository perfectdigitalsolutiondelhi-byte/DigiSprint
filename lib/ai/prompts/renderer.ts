import type { BusinessAIContext } from "../types";
import type { PromptDefinition } from "./types";

export function renderPrompt<TInput, TOutput>(definition: PromptDefinition<TInput, TOutput>, input: unknown, context: BusinessAIContext) {
  const parsedInput = definition.inputSchema.parse(input);
  return { parsedInput, systemPrompt: definition.system, userPrompt: definition.render(parsedInput, context) };
}
