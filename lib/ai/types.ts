import type { z } from "zod";

export type AIModelProfile = "fast" | "balanced" | "quality";

export type AIUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type AIProviderRequest<T> = {
  schema: z.ZodType<T>;
  schemaName: string;
  systemPrompt: string;
  userPrompt: string;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
};

export type AIProviderResult<T> = {
  data: T;
  provider: string;
  model: string;
  providerRequestId: string | null;
  usage: AIUsage;
};

export type AIProvider = {
  readonly name: string;
  generateStructured<T>(request: AIProviderRequest<T>): Promise<AIProviderResult<T>>;
};

export type BusinessAIContext = {
  businessId: string;
  name: string;
  industry: string;
  description: string;
  location: string;
  audience: string;
  tone: string;
  languages: string[];
  platforms: string[];
  goals: string[];
  postsPerWeek: number;
};

export type AIRequest<TInput> = {
  businessId: string;
  featureKey: string;
  promptKey: string;
  input: TInput;
  language: string;
  idempotencyKey: string;
  requestFingerprint?: string;
};

export type AIResult<TOutput> = {
  jobId: string;
  contentId: string;
  output: TOutput;
  usage: AIUsage;
};
