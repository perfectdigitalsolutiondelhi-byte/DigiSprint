import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AIPlatformError } from "../ai/errors";
import type { AIModelProfile } from "../ai/types";
import type { MarketingStrategyInput } from "./types";
function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(",")}}`;
  return JSON.stringify(value);
}
export function createStrategyFingerprint(values: { context: unknown; input: MarketingStrategyInput; promptKey: string; promptVersion: number; modelProfile: AIModelProfile }) {
  return createHash("sha256").update(canonicalize(values)).digest("hex");
}
export async function findCachedStrategy(supabase: SupabaseClient, businessId: string, fingerprint: string) {
  const { data, error } = await supabase.from("generated_content").select("id").eq("business_id", businessId).eq("content_type", "marketing_strategy").eq("request_fingerprint", fingerprint).in("status", ["generated", "accepted"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new AIPlatformError("STORAGE_ERROR", "The strategy cache could not be checked.", error);
  return data ? String(data.id) : null;
}
