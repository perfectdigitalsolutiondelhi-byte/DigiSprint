import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { marketingStrategyOutputSchema } from "./schemas";
import type { StoredStrategy, StrategyStatus, StrategySummary } from "./types";

type StrategyRow = { id: string; title: string | null; status: string; prompt_version: number; language: string; created_at: string; structured_content?: unknown; context_snapshot?: unknown };

function summaries(rows: StrategyRow[]): StrategySummary[] {
  const versions = new Map(rows.slice().reverse().map((row, index) => [row.id, index + 1]));
  return rows.map((row) => ({ id: row.id, title: row.title, status: row.status as StrategyStatus, promptVersion: row.prompt_version, language: row.language, createdAt: row.created_at, version: versions.get(row.id) ?? 1 }));
}
export async function loadStrategyHistory(supabase: SupabaseClient, businessId: string, limit = 20) {
  const { data, error } = await supabase.from("generated_content").select("id,title,status,prompt_version,language,created_at").eq("business_id", businessId).eq("content_type", "marketing_strategy").order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error("Unable to load strategy history.");
  return summaries((data ?? []) as StrategyRow[]);
}
export async function loadLatestStrategy(supabase: SupabaseClient, businessId: string) {
  const history = await loadStrategyHistory(supabase, businessId, 1);
  return history[0] ?? null;
}
export async function loadStrategyById(supabase: SupabaseClient, businessId: string, strategyId: string): Promise<StoredStrategy | null> {
  const { data, error } = await supabase.from("generated_content").select("id,title,status,prompt_version,language,created_at,structured_content,context_snapshot").eq("id", strategyId).eq("business_id", businessId).eq("content_type", "marketing_strategy").maybeSingle();
  if (error || !data) return null;
  const { count } = await supabase.from("generated_content").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("content_type", "marketing_strategy").lte("created_at", data.created_at);
  return { id: data.id, title: data.title, status: data.status as StrategyStatus, promptVersion: data.prompt_version, language: data.language, createdAt: data.created_at, version: count ?? 1, content: marketingStrategyOutputSchema.parse(data.structured_content), contextSnapshot: data.context_snapshot };
}
