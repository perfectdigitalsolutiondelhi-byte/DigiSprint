import type { z } from "zod";
import type { marketingStrategyInputSchema, marketingStrategyOutputSchema } from "./schemas";
export type MarketingStrategyInput = z.infer<typeof marketingStrategyInputSchema>;
export type MarketingStrategyOutput = z.infer<typeof marketingStrategyOutputSchema>;
export type StrategyStatus = "generated" | "edited" | "accepted" | "rejected" | "archived";
export type StrategySummary = { id: string; title: string | null; status: StrategyStatus; promptVersion: number; language: string; createdAt: string; version: number };
export type StoredStrategy = StrategySummary & { content: MarketingStrategyOutput; contextSnapshot: unknown; requestInput: MarketingStrategyInput };
