import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { AIProvider, AIProviderRequest, AIProviderResult } from "../types";
import { AIPlatformError } from "../errors";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  private readonly client: OpenAI;

  constructor(apiKey: string) { this.client = new OpenAI({ apiKey }); }

  async generateStructured<T>(request: AIProviderRequest<T>): Promise<AIProviderResult<T>> {
    const response = await this.client.responses.parse({
      model: request.model,
      input: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt },
      ],
      text: { format: zodTextFormat(request.schema, request.schemaName) },
      max_output_tokens: request.maxOutputTokens,
    }, { timeout: request.timeoutMs });
    if (!response.output_parsed) throw new AIPlatformError("INVALID_OUTPUT", "The provider returned no valid structured output.");
    return {
      data: response.output_parsed,
      provider: this.name,
      model: request.model,
      providerRequestId: response.id || null,
      usage: {
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
    };
  }
}
