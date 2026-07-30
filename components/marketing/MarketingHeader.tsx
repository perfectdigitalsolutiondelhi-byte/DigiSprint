import { ThemeSettings } from "../theme/ThemeProvider";
import { Brand } from "../ui/Brand";
import { ButtonLink } from "../ui/ButtonLink";

const navigation = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Plans", href: "/plan" },
  { label: "Seekhein", href: "/#seekhein" },
];

export function MarketingHeader() {
  return (
    <header className="marketing-header">
      <Brand />
      <nav aria-label="Main navigation">
        {navigation.map((item) => <a href={item.href} key={item.label}>{item.label}</a>)}
      </nav>
      <div className="marketing-header-actions">
        <ThemeSettings />
        <ButtonLink href="/dashboard">View dashboard</ButtonLink>
      </div>
    </header>
  );
}
