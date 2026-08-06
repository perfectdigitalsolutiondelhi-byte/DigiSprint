import { diagnosticInputSchema, diagnosticOutputSchema } from "../schemas";
import type { PromptDefinition } from "./types";

type Input = { message: string };
type Output = { acknowledgement: string; ready: boolean };

export const diagnosticPrompt: PromptDefinition<Input, Output> = {
  key: "platform_diagnostic",
  version: 1,
  schemaName: "platform_diagnostic",
  inputSchema: diagnosticInputSchema,
  outputSchema: diagnosticOutputSchema,
  modelProfile: "fast",
  system: "You are a DigiSprint platform diagnostic. Return only the requested structured acknowledgement. Do not create marketing content or strategy.",
  render: (input, context) => [
    "<business_context>",
    JSON.stringify({ name: context.name, industry: context.industry, location: context.location }),
    "</business_context>",
    "<diagnostic_message>",
    input.message,
    "</diagnostic_message>",
  ].join("\n"),
};
