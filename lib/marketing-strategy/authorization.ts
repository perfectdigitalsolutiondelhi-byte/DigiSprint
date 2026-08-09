import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { AIPlatformError } from "../ai/errors";
export async function requireStrategyWorkspace(returnPath = "/strategy") {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new AIPlatformError("STORAGE_ERROR", "The signed-in user could not be verified.", authError);
  if (!user) redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  const { data: membership, error: membershipError } = await supabase.from("business_members").select("business_id").eq("user_id", user.id).eq("is_active", true).limit(1).maybeSingle();
  if (membershipError) throw new AIPlatformError("STORAGE_ERROR", "The strategy workspace could not be loaded.", membershipError);
  if (!membership) redirect("/setup");
  const { data: business, error: businessError } = await supabase.from("businesses").select("id,name,industry,description,city,state,setup_status").eq("id", membership.business_id).single();
  if (businessError) throw new AIPlatformError("STORAGE_ERROR", "The business workspace could not be loaded.", businessError);
  if (!business || business.setup_status !== "complete") redirect("/setup");
  return { supabase, user, business };
}
