import type { AIProvider, AIProviderRequest, AIProviderResult } from "../types";

export class FakeAIProvider implements AIProvider {
  readonly name = "fake";
  constructor(private readonly output: unknown) {}
  async generateStructured<T>(request: AIProviderRequest<T>): Promise<AIProviderResult<T>> {
    return { data: request.schema.parse(this.output), provider: this.name, model: request.model, providerRequestId: "fake-request", usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 } };
  }
}
