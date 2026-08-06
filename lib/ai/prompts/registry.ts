import { AIPlatformError } from "../errors";
import { diagnosticPrompt } from "./diagnostic.prompt";
import type { PromptDefinition } from "./types";

const registry = new Map<string, PromptDefinition<unknown, unknown>>([
  [diagnosticPrompt.key, diagnosticPrompt as PromptDefinition<unknown, unknown>],
]);

export function getPrompt(key: string) {
  const prompt = registry.get(key);
  if (!prompt) throw new AIPlatformError("INVALID_INPUT", `Unknown prompt key: ${key}`);
  return prompt;
}
