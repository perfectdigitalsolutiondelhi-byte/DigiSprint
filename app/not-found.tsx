import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <div className="not-found-orbit" aria-hidden="true">404</div>
      <p className="eyebrow">A small detour</p>
      <h1>This page missed the sprint.</h1>
      <p>
        The page you&apos;re looking for may have moved, changed, or never made
        it onto the board.
      </p>
      <Link className="button button-primary" href="/">
        Back to home <span aria-hidden="true">↗</span>
      </Link>
    </main>
  );
}
