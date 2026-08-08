import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
export async function requireStrategyWorkspace(returnPath = "/strategy") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  const { data: membership } = await supabase.from("business_members").select("business_id").eq("user_id", user.id).eq("is_active", true).limit(1).maybeSingle();
  if (!membership) redirect("/setup");
  const { data: business } = await supabase.from("businesses").select("id,name,industry,description,city,state,setup_status").eq("id", membership.business_id).single();
  if (!business || business.setup_status !== "complete") redirect("/setup");
  return { supabase, user, business };
}
