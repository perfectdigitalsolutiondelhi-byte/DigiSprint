"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/config";

export type SetupState = { error: string };
export const initialState: SetupState = { error: "" };

function values(formData: FormData, name: string) {
  return formData.getAll(name).map(String).filter(Boolean);
}

export async function completeBusinessSetup(_state: SetupState, formData: FormData): Promise<SetupState> {
  if (!isSupabaseConfigured()) return { error: "Connect Supabase before saving your business setup." };

  const name = String(formData.get("name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const tone = String(formData.get("tone") ?? "").trim();
  const targetAudience = String(formData.get("targetAudience") ?? "").trim();
  const postsPerWeek = Number(formData.get("postsPerWeek") ?? 3);
  const primaryColor = String(formData.get("primaryColor") ?? "#6366F1");
  const languages = values(formData, "languages");
  const platforms = values(formData, "platforms");
  const goals = values(formData, "goals");

  if (!name || !industry || !description || !city || !state || !tone || !targetAudience) return { error: "Please complete every required field before continuing." };
  if (!Number.isInteger(postsPerWeek) || postsPerWeek < 1 || postsPerWeek > 14) return { error: "Choose between 1 and 14 posts per week." };
  if (!languages.length || !platforms.length || !goals.length) return { error: "Choose at least one language, platform and marketing goal." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/setup");

  const { error } = await supabase.rpc("complete_business_setup", {
    business_name: name, business_industry: industry, business_description: description,
    business_city: city, business_state: state, business_whatsapp: whatsapp || null,
    brand_tone: tone, brand_primary_color: primaryColor, preferred_languages: languages,
    marketing_platforms: platforms, marketing_goals: goals,
    audience_description: targetAudience, weekly_post_count: postsPerWeek,
  });
  if (error) return { error: error.message };
  redirect("/dashboard");
}
