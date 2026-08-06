import type { z } from "zod";
import type { AIModelProfile, BusinessAIContext } from "../types";

export type PromptDefinition<TInput, TOutput> = {
  key: string;
  version: number;
  schemaName: string;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  modelProfile: AIModelProfile;
  system: string;
  render: (input: TInput, context: BusinessAIContext) => string;
};
