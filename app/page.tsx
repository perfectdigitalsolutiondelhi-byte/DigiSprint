const features = [
  {
    number: "01",
    title: "Plan with clarity",
    description:
      "Turn a big goal into a focused sprint your whole team can understand at a glance.",
  },
  {
    number: "02",
    title: "Protect the focus",
    description:
      "Keep priorities visible, cut through the noise, and know what deserves attention now.",
  },
  {
    number: "03",
    title: "See progress happen",
    description:
      "Simple signals show what is moving, what needs help, and what your team has achieved.",
  },
];

const planFeatures = [
  "Unlimited projects",
  "Up to 5 collaborators",
  "Sprint planning workspace",
  "Progress snapshots",
];

function ArrowIcon() {
  return <span aria-hidden="true">â†—</span>;
}

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#" aria-label="DigiSprint home">
          <span className="brand-mark" aria-hidden="true">
            D
          </span>
          DigiSprint
        </a>
        <nav aria-label="Main navigation">
          <a href="#features">How it works</a>
          <a href="#pricing">Pricing</a>
          <a className="nav-cta" href="#pricing">
            Start free <ArrowIcon />
          </a>
        </nav>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Built for teams that move</p>
          <h1 id="hero-title">
            Big ideas.
            <br />
            <em>Clear next steps.</em>
          </h1>
          <p className="hero-lede">
            DigiSprint gives small teams one calm place to plan the work, find
            their focus, and make meaningful progress.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#pricing">
              Start your first sprint <ArrowIcon />
            </a>
            <a className="text-link" href="#features">
              See how it works <span aria-hidden="true">â†“</span>
            </a>
            <a className="text-link demo-link" href="/demo-profile">
              View Demo Profile <ArrowIcon />
            </a>
            <a className="text-link demo-link" href="/demo-card">
              View Digital Card Demo <ArrowIcon />
            </a>
          </div>
          <p className="hero-note">Free to start. No credit card needed.</p>
        </div>

        <div className="hero-visual" aria-label="DigiSprint project preview">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="preview-card preview-main">
            <div className="preview-top">
              <div>
                <span className="preview-label">Current sprint</span>
                <strong>Launch the new homepage</strong>
              </div>
              <span className="status">On track</span>
            </div>
            <div className="progress-row">
              <span>Progress</span>
              <strong>68%</strong>
            </div>
            <div className="progress-bar">
              <span />
            </div>
            <div className="task-list">
              <div className="task done">
                <span>âœ“</span> Finalize messaging
              </div>
              <div className="task done">
                <span>âœ“</span> Approve visual direction
              </div>
              <div className="task active">
                <span>â€¢</span> Build responsive pages
              </div>
            </div>
          </div>
          <div className="floating-card card-team">
            <span className="float-label">Team focus</span>
            <strong>4 people aligned</strong>
            <div className="avatars" aria-hidden="true">
              <span>AM</span><span>SK</span><span>JL</span><span>+</span>
            </div>
          </div>
          <div className="floating-card card-week">
            <span className="spark" aria-hidden="true">âœ¦</span>
            <div><strong>Great week</strong><span>12 tasks moved</span></div>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="DigiSprint product principles">
        <span>Simple by design</span><i />
        <span>Made for momentum</span><i />
        <span>Human at heart</span>
      </section>

      <section className="features section" id="features" aria-labelledby="features-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A better way to move</p>
            <h2 id="features-title">Less managing.<br />More making.</h2>
          </div>
          <p>
            Your tools should make work feel lighter. DigiSprint keeps the
            essentials close and everything else out of the way.
          </p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <span className="feature-number">{feature.number}</span>
              <div className="feature-symbol" aria-hidden="true">
                {feature.number === "01" ? "â—Ž" : feature.number === "02" ? "â—’" : "â†—"}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pricing section" id="pricing" aria-labelledby="pricing-title">
        <div className="pricing-copy">
          <p className="eyebrow">Start small. Go far.</p>
          <h2 id="pricing-title">Everything you need to find your rhythm.</h2>
          <p>
            One straightforward plan for teams ready to trade scattered work
            for steady progress.
          </p>
          <a className="text-link dark-link" href="mailto:hello@digisprint.app">
            Have a larger team? Let&apos;s talk <ArrowIcon />
          </a>
        </div>
        <article className="price-card">
          <span className="price-kicker">DigiSprint Starter</span>
          <div className="price">
            <strong>$0</strong>
            <span>forever<br />to get started</span>
          </div>
          <p>Bring your next idea. We&apos;ll help you move it forward.</p>
          <ul>
            {planFeatures.map((feature) => (
              <li key={feature}><span aria-hidden="true">âœ“</span>{feature}</li>
            ))}
          </ul>
          <a className="button button-light" href="mailto:hello@digisprint.app?subject=Start%20with%20DigiSprint">
            Get started free <ArrowIcon />
          </a>
        </article>
      </section>

      <footer>
        <div className="footer-top">
          <div>
            <a className="brand footer-brand" href="#">
              <span className="brand-mark" aria-hidden="true">D</span>
              DigiSprint
            </a>
            <p>Make progress feel good.</p>
          </div>
          <div className="footer-links">
            <a href="#features">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="mailto:hello@digisprint.app">Contact</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>Â© 2026 DigiSprint</span>
          <span>Made with focus and a little optimism.</span>
        </div>
      </footer>
    </main>
  );
}
