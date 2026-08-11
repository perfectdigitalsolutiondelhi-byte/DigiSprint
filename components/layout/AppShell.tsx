import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "../ui/Brand";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: "\u2302" },
  { label: "Strategy", href: "/strategy", icon: "\u2726" },
  { label: "Posts", href: "/post-generator", icon: "\u25A3" },
  { label: "Festivals", href: "/dashboard#festivals", icon: "\u25EB" },
  { label: "AI Tools", href: "/dashboard#tools", icon: "\u2318" },
  { label: "Seekhein", href: "/dashboard#learn", icon: "\u25C9" },
];

export function AppShell({ children, userName, userEmail, businessName, businessType }: { children: ReactNode; userName?: string | null; userEmail?: string | null; businessName?: string | null; businessType?: string | null }) {
  return (
    <main className="product-shell">
      <aside className="product-sidebar">
        <Brand />
        <nav aria-label="Product navigation">{navItems.map((item, index) => <Link className={index === 0 ? "active" : ""} href={item.href} key={item.label}><span aria-hidden="true">{item.icon}</span>{item.label}</Link>)}</nav>
        <div className="sidebar-business"><span>{userName?.slice(0, 2).toUpperCase() || "DS"}</span><div><strong>{businessName || userName || "DigiSprint user"}</strong><small>{businessType || userEmail || "Marketing workspace"}</small></div></div>
      </aside>
      <section className="product-workspace">
        <header className="product-topbar"><div><strong>{businessName || "DigiSprint workspace"}</strong><span>Business setup complete</span></div><div className="product-topbar-actions"><Link href="/">Back to website</Link><form action="/auth/signout" method="post"><button type="submit">Sign out</button></form></div></header>
        {children}
      </section>
    </main>
  );
}
