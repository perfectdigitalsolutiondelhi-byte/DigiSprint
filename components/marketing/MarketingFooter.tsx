import Link from "next/link";
import { Brand } from "../ui/Brand";

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="marketing-footer-main">
        <div><Brand /><p>Your everyday AI marketing assistant for Indian small businesses.</p></div>
        <div><strong>Product</strong><Link href="/#features">Features</Link><Link href="/plan">Plans</Link><Link href="/dashboard">Dashboard preview</Link></div>
        <div><strong>Resources</strong><Link href="/#seekhein">Seekhein</Link><Link href="/#how-it-works">How it works</Link><a href="mailto:hello@digisprint.in">Contact</a></div>
      </div>
      <div className="marketing-footer-bottom"><span>© 2026 DigiSprint</span><span>Built for ambitious Indian businesses.</span></div>
    </footer>
  );
}
