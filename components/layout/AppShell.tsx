import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "../ui/Brand";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: "⌂" },
  { label: "Posts", href: "/dashboard#posts", icon: "✦" },
  { label: "Festivals", href: "/dashboard#festivals", icon: "◫" },
  { label: "AI Tools", href: "/dashboard#tools", icon: "⌘" },
  { label: "Seekhein", href: "/dashboard#learn", icon: "◉" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="product-shell">
      <aside className="product-sidebar">
        <Brand />
        <nav aria-label="Product navigation">{navItems.map((item, index) => <Link className={index === 0 ? "active" : ""} href={item.href} key={item.label}><span aria-hidden="true">{item.icon}</span>{item.label}</Link>)}</nav>
        <div className="sidebar-business"><span>NM</span><div><strong>Namma Masala</strong><small>Restaurant · Bengaluru</small></div></div>
      </aside>
      <section className="product-workspace">
        <header className="product-topbar"><div><strong>Namma Masala</strong><span>Foundation preview</span></div><Link href="/">Back to website</Link></header>
        {children}
      </section>
    </main>
  );
}
