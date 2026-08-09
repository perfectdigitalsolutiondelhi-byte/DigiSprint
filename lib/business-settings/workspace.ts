import "server-only";

import { redirect } from "next/navigation";
import { AIPlatformError } from "../ai/errors";
import { createClient } from "../supabase/server";

export type BusinessSettingsRecord = {
  id: string;
  name: string;
  industry: string | null;
  description: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  setup_status: string;
  targetAudience: string | null;
};

export async function requireBusinessSettingsWorkspace({ structuredErrors = false }: { structuredErrors?: boolean } = {}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new AIPlatformError("STORAGE_ERROR", "The signed-in user could not be verified.", authError);
  if (!user) {
    if (structuredErrors) throw new AIPlatformError("UNAUTHENTICATED", "Sign in is required.");
    redirect("/login?next=/settings/business");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("business_members")
    .select("business_id,role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (membershipError) throw new AIPlatformError("STORAGE_ERROR", "The active workspace could not be loaded.", membershipError);
  if (!membership) {
    if (structuredErrors) throw new AIPlatformError("BUSINESS_NOT_FOUND", "An active business workspace is required.");
    redirect("/setup");
  }

  const [businessResult, preferencesResult] = await Promise.all([
    supabase.from("businesses").select("id,name,industry,description,website,phone,email,address,city,state,country,setup_status").eq("id", membership.business_id).single(),
    supabase.from("content_preferences").select("target_audience").eq("business_id", membership.business_id).maybeSingle(),
  ]);
  if (businessResult.error || preferencesResult.error) {
    throw new AIPlatformError("STORAGE_ERROR", "Business settings could not be loaded.", businessResult.error || preferencesResult.error);
  }
  if (!businessResult.data) throw new AIPlatformError("BUSINESS_NOT_FOUND", "The business workspace could not be found.");
  if (businessResult.data.setup_status !== "complete") {
    if (structuredErrors) throw new AIPlatformError("BUSINESS_NOT_FOUND", "Complete business setup before editing settings.");
    redirect("/setup");
  }

  return {
    supabase,
    user,
    role: membership.role,
    business: {
      ...businessResult.data,
      targetAudience: preferencesResult.data?.target_audience ?? null,
    } as BusinessSettingsRecord,
  };
}