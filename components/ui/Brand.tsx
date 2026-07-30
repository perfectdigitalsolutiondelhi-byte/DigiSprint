import Link from "next/link";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link className="ds-brand" data-inverse={inverse || undefined} href="/" aria-label="DigiSprint home">
      <span aria-hidden="true">D</span>
      <span>DigiSprint</span>
    </Link>
  );
}
