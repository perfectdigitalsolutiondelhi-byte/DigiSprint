import Link from "next/link";
import type { ReactNode } from "react";

export function ButtonLink({ href, children, variant = "primary", className = "" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" | "quiet"; className?: string }) {
  return <Link className={`ds-button ds-button-${variant} ${className}`.trim()} href={href}>{children}</Link>;
}
