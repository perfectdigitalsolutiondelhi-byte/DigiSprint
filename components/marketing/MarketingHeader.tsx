import { ThemeSettings } from "../theme/ThemeProvider";
import { Brand } from "../ui/Brand";
import { ButtonLink } from "../ui/ButtonLink";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";

const navigation = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Plans", href: "/plan" },
  { label: "Seekhein", href: "/#seekhein" },
];

export async function MarketingHeader() {
  let isSignedIn = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    isSignedIn = Boolean(data.user);
  }
  return (
    <header className="marketing-header">
      <Brand />
      <nav aria-label="Main navigation">{navigation.map((item) => <a href={item.href} key={item.label}>{item.label}</a>)}</nav>
      <div className="marketing-header-actions">
        <ThemeSettings />
        {!isSignedIn && <a className="header-login" href="/login">Sign in</a>}
        <ButtonLink href={isSignedIn ? "/dashboard" : "/signup"}>{isSignedIn ? "Open dashboard" : "Get started"}</ButtonLink>
      </div>
    </header>
  );
}
