import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AIPlatformError } from "../errors";
import { businessContextSchema } from "./context-schema";

export async function loadBusinessContext(supabase: SupabaseClient, businessId: string) {
  const [businessResult, brandResult, preferencesResult] = await Promise.all([
    supabase.from("businesses").select("id,name,industry,description,city,state").eq("id", businessId).single(),
    supabase.from("brand_kits").select("tone,language_preferences").eq("business_id", businessId).maybeSingle(),
    supabase.from("content_preferences").select("platforms,content_goals,target_audience,posts_per_week").eq("business_id", businessId).maybeSingle(),
  ]);
  if (businessResult.error) throw new AIPlatformError("STORAGE_ERROR", "The business context could not be loaded.", businessResult.error);
  if (!businessResult.data) throw new AIPlatformError("BUSINESS_NOT_FOUND", "The business context could not be loaded.");
  if (brandResult.error || preferencesResult.error) throw new AIPlatformError("STORAGE_ERROR", "The supporting business context could not be loaded.", brandResult.error || preferencesResult.error);
  const business = businessResult.data;
  return businessContextSchema.parse({
    businessId, name: business.name, industry: business.industry || "Small business",
    description: business.description || "", location: [business.city, business.state].filter(Boolean).join(", "),
    audience: preferencesResult.data?.target_audience || "Local customers", tone: brandResult.data?.tone || "professional",
    languages: brandResult.data?.language_preferences || ["en"], platforms: preferencesResult.data?.platforms || ["instagram"],
    goals: preferencesResult.data?.content_goals || ["visibility"], postsPerWeek: preferencesResult.data?.posts_per_week || 3,
  });
}
