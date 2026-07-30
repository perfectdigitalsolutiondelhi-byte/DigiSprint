import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Brand } from "../../components/ui/Brand";
import { BusinessSetupForm } from "../../components/setup/BusinessSetupForm";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/config";

export const metadata: Metadata = { title: "Set up your business", description: "Personalise DigiSprint for your business and marketing goals.", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const configured = isSupabaseConfigured();
  if (configured) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login?next=/setup");
    const { data } = await supabase.from("business_members").select("business_id").eq("user_id", user.id).eq("is_active", true).limit(1).maybeSingle();
    if (data) redirect("/dashboard");
  }
  return <main className="setup-page"><header><Brand /><span>Business setup</span></header><div className="setup-layout"><aside><span className="setup-aside-number">01</span><h2>One thoughtful setup. Better ideas every day.</h2><p>DigiSprint uses this information to understand your market—not to publish anything without your approval.</p><div><strong>About 3 minutes</strong><span>Your choices can be changed later</span></div></aside><BusinessSetupForm configured={configured} /></div></main>;
}
