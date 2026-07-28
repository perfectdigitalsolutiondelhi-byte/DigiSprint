export function Footer() {
  return (
    <footer id="about" className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
        <div>
          <p className="text-lg font-black text-slate-950">DigiSprint</p>
          <p className="mt-1">Your professional digital presence, simplified.</p>
        </div>
        <p>© {new Date().getFullYear()} DigiSprint. All rights reserved.</p>
      </div>
    </footer>
  );
}
