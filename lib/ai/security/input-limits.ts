import { AIPlatformError } from "../errors";

const MAX_SERIALIZED_INPUT = 12_000;

export function enforceInputLimits(value: unknown) {
  const serialized = JSON.stringify(value);
  if (serialized.length > MAX_SERIALIZED_INPUT) throw new AIPlatformError("INVALID_INPUT", "The AI request is too large.");
  return serialized;
}
