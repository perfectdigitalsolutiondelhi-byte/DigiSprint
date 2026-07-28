const navItems = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

export function Header() {
  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <a
          href="#top"
          className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-950"
          aria-label="DigiSprint home"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-sm text-white shadow-lg shadow-indigo-200">
            D
          </span>
          DigiSprint
        </a>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="transition hover:text-indigo-600">
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href="#pricing"
          className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-600 sm:px-5"
        >
          Get started
        </a>
      </div>
    </header>
  );
}
