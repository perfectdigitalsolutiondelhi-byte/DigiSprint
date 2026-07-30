import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "../../components/layout/AppShell";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard Foundation", description: "Preview the DigiSprint AI marketing assistant dashboard foundation." };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let userName: string | null = null;
  let userEmail: string | null = null;
  let businessName: string | null = null;
  let businessType: string | null = null;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login?next=/dashboard");
    userName = typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : null;
    userEmail = user.email ?? null;
    const { data: membership } = await supabase.from("business_members").select("business_id").eq("user_id", user.id).eq("is_active", true).limit(1).maybeSingle();
    if (!membership) redirect("/setup");
    const { data: business } = await supabase.from("businesses").select("name, industry").eq("id", membership.business_id).single();
    businessName = business?.name ?? null;
    businessType = business?.industry ?? null;
  }

  return <AppShell userName={userName} userEmail={userEmail} businessName={businessName} businessType={businessType}><div className="dashboard-content"><section className="dashboard-welcome"><div><span>Thursday, 30 July</span><h1>Good morning, {userName?.split(" ")[0] || "there"}.</h1><p>Your next useful marketing actions are ready.</p></div><button type="button" title="AI generation begins in a later version">Generate a post</button></section><div className="dashboard-grid"><article className="dashboard-primary" id="posts"><div className="dashboard-card-heading"><div><span>Today&apos;s recommended post</span><h2>Monsoon comfort-food campaign</h2></div><b>Ready</b></div><div className="post-preview"><div><small>NAMMA MASALA</small><strong>Rainy evening?<br />Dinner is sorted.</strong><span>Bengaluru favourites &middot; Fresh &amp; hot</span></div><section><span>Instagram &middot; English</span><p>Warm rain, warmer flavours. Make this monsoon evening delicious with our Bengaluru favourites.</p><div><button type="button">Edit post</button><button type="button">Download</button></div></section></div></article><article className="dashboard-side" id="festivals"><span>Coming up</span><h2>Raksha Bandhan</h2><p>Start your campaign in 4 days for better reach.</p><div className="festival-date"><strong>09</strong><span>August<br />Sunday</span></div><button type="button">View opportunity</button></article><article className="dashboard-small" id="tools"><span>Quick AI tools</span><h2>Finish a small task</h2><div><button type="button">WhatsApp promotion <i>&rarr;</i></button><button type="button">Offer idea <i>&rarr;</i></button><button type="button">Review reply <i>&rarr;</i></button></div></article><article className="dashboard-small" id="learn"><span>Today in Seekhein</span><h2>Make offers easier to understand</h2><p>A 5-minute lesson for clearer customer communication.</p><Link href="/#seekhein">Open lesson preview &rarr;</Link></article></div></div></AppShell>;
}
