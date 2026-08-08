import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(",")}}`;
  return JSON.stringify(value);
}
export function hashBusinessContext(context: unknown) { return createHash("sha256").update(canonicalize(context)).digest("hex"); }
export async function findCachedStrategy(supabase: SupabaseClient, businessId: string, context: unknown, promptVersion: number) {
  const { data } = await supabase.from("generated_content").select("id,context_snapshot,prompt_version").eq("business_id", businessId).eq("content_type", "marketing_strategy").eq("prompt_key", "marketing_strategy_complete").in("status", ["generated", "accepted"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!data || data.prompt_version !== promptVersion) return null;
  return hashBusinessContext(data.context_snapshot) === hashBusinessContext(context) ? String(data.id) : null;
}
