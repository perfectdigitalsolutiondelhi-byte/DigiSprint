import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

const features = [
  {
    number: "01",
    title: "Quick to create",
    description:
      "Turn your essential business details into a clean digital profile in just a few simple steps.",
  },
  {
    number: "02",
    title: "Made for every screen",
    description:
      "Present your brand beautifully on mobile phones, tablets, laptops, and desktops.",
  },
  {
    number: "03",
    title: "Easy to share",
    description:
      "Keep your business information together in one professional, shareable destination.",
  },
];

const pricing = [
  { name: "Starter", description: "For individuals getting online." },
  { name: "Professional", description: "For growing professionals and businesses." },
  { name: "Business", description: "For teams that need a stronger presence." },
];

export default function Home() {
  return (
    <main id="top" className="min-h-screen overflow-hidden bg-slate-50">
      <Header />

      <section className="relative isolate">
        <div className="absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(circle_at_70%_20%,#ddd6fe_0,transparent_38%),radial-gradient(circle_at_10%_70%,#dbeafe_0,transparent_30%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.1fr_.9fr] lg:px-10 lg:py-32">
          <div>
            <span className="inline-flex rounded-full border border-indigo-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700 shadow-sm">
              Your digital presence, simplified
            </span>
            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[1.02] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl">
              Look professional.
              <span className="block text-indigo-600">Get discovered.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
              Create a polished digital profile for your business in minutes
              and make every introduction count.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#pricing"
                className="rounded-full bg-indigo-600 px-7 py-3.5 text-center font-bold text-white shadow-xl shadow-indigo-200 transition hover:bg-indigo-700"
              >
                Start your profile
              </a>
              <a
                href="#features"
                className="rounded-full border border-slate-300 bg-white px-7 py-3.5 text-center font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
              >
                Explore features
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-4 -z-10 rotate-3 rounded-[2.5rem] bg-indigo-200/70 blur-sm" />
            <div className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-2xl shadow-indigo-200/60 sm:p-7">
              <div className="rounded-[1.5rem] bg-slate-950 p-7 text-white sm:p-9">
                <div className="flex items-center gap-4">
                  <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-600 text-2xl font-black">
                    DS
                  </div>
                  <div>
                    <p className="text-xl font-extrabold">Your Business</p>
                    <p className="mt-1 text-sm text-slate-400">Professional digital profile</p>
                  </div>
                </div>
                <div className="mt-10 grid grid-cols-2 gap-3">
                  {["About", "Services", "Gallery", "Contact"].map((item) => (
                    <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-semibold">
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-8 h-2 w-4/5 rounded-full bg-slate-700" />
                <div className="mt-3 h-2 w-3/5 rounded-full bg-slate-800" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">Why DigiSprint</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Everything you need to make a strong first impression.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-7 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-200/60">
                <span className="text-sm font-black text-indigo-600">{feature.number}</span>
                <h3 className="mt-8 text-xl font-extrabold text-slate-950">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">Pricing preview</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">A plan for every ambition.</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
              Simple plans are being prepared. Full pricing details will be announced soon.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {pricing.map((plan, index) => (
              <article key={plan.name} className={`rounded-3xl border p-7 ${index === 1 ? "border-indigo-300 bg-indigo-600 text-white shadow-xl shadow-indigo-200" : "border-slate-200 bg-white text-slate-950"}`}>
                <p className={`text-sm font-bold uppercase tracking-widest ${index === 1 ? "text-indigo-100" : "text-indigo-600"}`}>
                  {plan.name}
                </p>
                <p className="mt-7 text-3xl font-black">Coming soon</p>
                <p className={`mt-3 min-h-12 leading-6 ${index === 1 ? "text-indigo-100" : "text-slate-600"}`}>
                  {plan.description}
                </p>
                <span className={`mt-8 block rounded-full border px-5 py-3 text-center text-sm font-bold ${index === 1 ? "border-white/30 bg-white/10" : "border-slate-200 bg-slate-50"}`}>
                  Pricing preview
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
