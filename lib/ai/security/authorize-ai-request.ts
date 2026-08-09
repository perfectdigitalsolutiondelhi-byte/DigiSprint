import "server-only";
import { createClient } from "../../supabase/server";
import { AIPlatformError } from "../errors";

export async function authorizeAIRequest(businessId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new AIPlatformError("STORAGE_ERROR", "The signed-in user could not be verified.", authError);
  if (!user) throw new AIPlatformError("UNAUTHENTICATED", "Sign in is required.");
  const { data: membership, error: membershipError } = await supabase.from("business_members").select("business_id").eq("business_id", businessId).eq("user_id", user.id).eq("is_active", true).maybeSingle();
  if (membershipError) throw new AIPlatformError("STORAGE_ERROR", "Business access could not be verified.", membershipError);
  if (!membership) throw new AIPlatformError("FORBIDDEN", "You do not have access to this business.");
  return { supabase, user };
}
