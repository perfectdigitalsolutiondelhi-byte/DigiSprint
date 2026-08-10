import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { AIProvider, AIProviderRequest, AIProviderResult } from "../types";
import { AIPlatformError } from "../errors";

function diagnosticError(error: unknown): unknown {
  if (!(error instanceof Error)) return error;
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause: diagnosticError(error.cause),
  };
}

let transportAttempt = 0;

const diagnosticFetch: typeof fetch = async (input, init) => {
  const attempt = ++transportAttempt;
  let requestBody: { model?: unknown; max_output_tokens?: unknown } = {};
  if (typeof init?.body === "string") {
    try { requestBody = JSON.parse(init.body) as typeof requestBody; }
    catch { requestBody = {}; }
  }
  console.error("[openai.responses.transport.request]", { attempt, model: requestBody.model, max_output_tokens: requestBody.max_output_tokens });
  try {
    const response = await globalThis.fetch(input, init);
    const body = await response.clone().json().catch(() => null) as Record<string, unknown> | null;
    console.error("[openai.responses.transport.response]", {
      attempt,
      model: requestBody.model,
      max_output_tokens: requestBody.max_output_tokens,
      http_status: response.status,
      status: body?.status,
      incomplete_details: body?.incomplete_details,
      error: body?.error,
      output_parsed: null,
      usage: body?.usage,
      id: body?.id,
    });
    return response;
  } catch (error) {
    console.error("[openai.responses.transport.exception]", { attempt, model: requestBody.model, max_output_tokens: requestBody.max_output_tokens, exception: diagnosticError(error) });
    throw error;
  }
};

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  private readonly client: OpenAI;

  constructor(apiKey: string) { this.client = new OpenAI({ apiKey, fetch: diagnosticFetch }); }

  async generateStructured<T>(request: AIProviderRequest<T>): Promise<AIProviderResult<T>> {
    try {
      const response = await this.client.responses.parse({
        model: request.model,
        input: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: request.userPrompt },
        ],
        text: { format: zodTextFormat(request.schema, request.schemaName) },
        max_output_tokens: request.maxOutputTokens,
      }, { timeout: request.timeoutMs });
      console.error("[openai.responses.parsed]", {
        model: request.model,
        max_output_tokens: request.maxOutputTokens,
        status: response.status,
        incomplete_details: response.incomplete_details,
        error: response.error,
        output_parsed: response.output_parsed,
        usage: response.usage,
        id: response.id,
      });
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
    } catch (error) {
      console.error("[openai.responses.exception]", { model: request.model, max_output_tokens: request.maxOutputTokens, exception: diagnosticError(error) });
      throw error;
    }
  }
}