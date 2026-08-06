export type AIErrorCode =
  | "AI_NOT_CONFIGURED"
  | "AI_DISABLED"
  | "UNAUTHENTICATED"
  | "BUSINESS_NOT_FOUND"
  | "FORBIDDEN"
  | "INVALID_INPUT"
  | "RATE_LIMITED"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_REFUSAL"
  | "PROVIDER_ERROR"
  | "INVALID_OUTPUT"
  | "STORAGE_ERROR"
  | "DUPLICATE_REQUEST";

export class AIPlatformError extends Error {
  constructor(public readonly code: AIErrorCode, message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "AIPlatformError";
  }
}

export function normalizeAIError(error: unknown): AIPlatformError {
  if (error instanceof AIPlatformError) return error;
  if (error instanceof Error && (error.name === "AbortError" || error.name.toLowerCase().includes("timeout"))) return new AIPlatformError("PROVIDER_TIMEOUT", "The AI provider timed out.", error);
  return new AIPlatformError("PROVIDER_ERROR", "The AI request could not be completed.", error);
}
