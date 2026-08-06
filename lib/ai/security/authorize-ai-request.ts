import "server-only";
import { createClient } from "../../supabase/server";
import { AIPlatformError } from "../errors";

export async function authorizeAIRequest(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AIPlatformError("UNAUTHENTICATED", "Sign in is required.");
  const { data: membership } = await supabase.from("business_members").select("business_id").eq("business_id", businessId).eq("user_id", user.id).eq("is_active", true).maybeSingle();
  if (!membership) throw new AIPlatformError("FORBIDDEN", "You do not have access to this business.");
  return { supabase, user };
}
