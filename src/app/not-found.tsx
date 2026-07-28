import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-5 text-white">
      <div className="max-w-xl text-center">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-indigo-400">Error 404</p>
        <h1 className="mt-5 text-5xl font-black tracking-tight sm:text-7xl">Page not found.</h1>
        <p className="mt-6 text-lg leading-8 text-slate-400">
          The page you are looking for may have moved or does not exist.
        </p>
        <Link
          href="/"
          className="mt-9 inline-block rounded-full bg-indigo-600 px-7 py-3.5 font-bold text-white transition hover:bg-indigo-500"
        >
          Back to homepage
        </Link>
      </div>
    </main>
  );
}
