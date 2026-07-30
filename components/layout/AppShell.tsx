import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "../ui/Brand";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: "¦" },
  { label: "Posts", href: "/dashboard#posts", icon: "?" },
  { label: "Festivals", href: "/dashboard#festivals", icon: "?" },
  { label: "AI Tools", href: "/dashboard#tools", icon: "?" },
  { label: "Seekhein", href: "/dashboard#learn", icon: "?" },
];

export function AppShell({ children, userName, userEmail }: { children: ReactNode; userName?: string | null; userEmail?: string | null }) {
  return (
    <main className="product-shell">
      <aside className="product-sidebar">
        <Brand />
        <nav aria-label="Product navigation">{navItems.map((item, index) => <Link className={index === 0 ? "active" : ""} href={item.href} key={item.label}><span aria-hidden="true">{item.icon}</span>{item.label}</Link>)}</nav>
        <div className="sidebar-business"><span>{userName?.slice(0, 2).toUpperCase() || "DS"}</span><div><strong>{userName || "DigiSprint user"}</strong><small>{userEmail || "Marketing workspace"}</small></div></div>
      </aside>
      <section className="product-workspace">
        <header className="product-topbar"><div><strong>DigiSprint workspace</strong><span>Authentication foundation</span></div><div className="product-topbar-actions"><Link href="/">Back to website</Link><form action="/auth/signout" method="post"><button type="submit">Sign out</button></form></div></header>
        {children}
      </section>
    </main>
  );
}
