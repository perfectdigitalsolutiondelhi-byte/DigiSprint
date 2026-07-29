import { TemplateGrid } from "../components/templates/TemplateGrid";

const steps = [
  { number: "01", icon: "layers", title: "Choose a Template", description: "Select a design suited to your profession or business." },
  { number: "02", icon: "edit", title: "Add Your Details", description: "Add your bio, services, experience, links and contact details." },
  { number: "03", icon: "share", title: "Publish and Share", description: "Launch your profile and share it by link, QR code or social media." },
];

const starterFeatures = ["Basic professional profile", "Mobile-responsive design", "Contact and social links", "DigiSprint branding"];
const professionalFeatures = ["Premium templates", "Portfolio and services", "Resume download", "QR and sharing tools", "Optional content-writing service"];

function ArrowIcon() { return <span aria-hidden="true">↗</span>; }
function CheckIcon() { return <span aria-hidden="true">✓</span>; }

export default function Home() {
  return (
    <main className="v6-page">
      <header className="v6-header">
        <a className="brand" href="#" aria-label="DigiSprint home"><span className="brand-mark" aria-hidden="true">D</span>DigiSprint</a>
        <nav aria-label="Main navigation">
          <a href="#templates">Templates</a><a href="#how-it-works">How it works</a><a href="#pricing">Pricing</a>
          <a className="nav-cta" href="#templates">Explore templates <ArrowIcon /></a>
        </nav>
      </header>

      <section className="v6-hero" aria-labelledby="hero-title">
        <div className="v6-hero-copy">
          <p className="eyebrow">Your professional identity, online</p>
          <h1 id="hero-title">Create Your Professional <em>Digital Profile</em> in Minutes</h1>
          <p className="v6-hero-lede">Choose a premium template, add your details and launch a professional online presence that helps clients discover, trust and contact you.</p>
          <div className="v6-hero-actions">
            <a className="button button-primary" href="#templates">Explore Templates <ArrowIcon /></a>
            <a className="button button-secondary" href="/demo-profile">View Live Demo</a>
          </div>
          <ul className="v6-hero-proof" aria-label="Product highlights">
            <li><CheckIcon /> Mobile-ready</li><li><CheckIcon /> Easy to share</li><li><CheckIcon /> No technical skills required</li>
          </ul>
        </div>

        <div className="profile-showcase" aria-label="Responsive DigiSprint professional profile preview">
          <div className="showcase-glow showcase-glow-blue" /><div className="showcase-glow showcase-glow-violet" />
          <div className="profile-desktop">
            <div className="device-bar"><span /><span /><span /><i>digisprint.in/arjun</i></div>
            <div className="desktop-profile-content">
              <aside className="profile-rail">
                <div className="profile-photo">AM</div><span className="verified-pill"><CheckIcon /> Verified</span>
                <h2>Arjun Malhotra</h2><p>Brand Strategist &amp; Consultant</p>
                <div className="profile-contact-row"><span>Call</span><span>WhatsApp</span><span>Email</span></div>
              </aside>
              <div className="profile-main-panel">
                <div className="profile-panel-heading"><div><small>Professional profile</small><strong>Building brands people remember.</strong></div><span>Available</span></div>
                <div className="profile-service-grid">
                  <article><i className="service-icon strategy" /><strong>Brand Strategy</strong><span>Positioning &amp; identity</span></article>
                  <article><i className="service-icon launch" /><strong>Go-to-market</strong><span>Launch plans &amp; growth</span></article>
                </div>
                <div className="profile-work-row"><span><strong>48+</strong> engagements</span><span><strong>12</strong> industries</span><span><strong>9 yrs</strong> experience</span></div>
              </div>
            </div>
          </div>
          <div className="profile-mobile" aria-hidden="true">
            <div className="mobile-notch" /><div className="mobile-cover" /><div className="mobile-photo">AM</div>
            <strong>Arjun Malhotra <CheckIcon /></strong><span>Brand Strategist</span><p>Helping ambitious businesses become memorable brands.</p>
            <div className="mobile-actions"><i /><i /><i /></div>
            <div className="mobile-service"><span /><div><b>Brand Strategy</b><i /></div></div><div className="mobile-service"><span /><div><b>Launch Advisory</b><i /></div></div>
          </div>
          <div className="profile-share-card" aria-hidden="true">
            <div className="mini-qr">{Array.from({ length: 25 }, (_, index) => <i key={index} />)}</div>
            <div><strong>Ready to share</strong><span>Link · QR · Social</span></div>
          </div>
        </div>
      </section>

      <TemplateGrid />

      <section className="v6-section v6-how" id="how-it-works" aria-labelledby="how-title">
        <div className="v6-section-heading"><p className="eyebrow">From idea to online</p><h2 id="how-title">Your professional presence,<br />ready in three steps.</h2><p>No complicated setup. Choose, personalise and share.</p></div>
        <div className="v6-step-grid">
          {steps.map((step) => <article className="v6-step-card" key={step.number}><div className={`v6-step-icon v6-step-icon-${step.icon}`} aria-hidden="true"><i /><i /><i /></div><span>{step.number}</span><h3>{step.title}</h3><p>{step.description}</p></article>)}
        </div>
      </section>

      <section className="v6-section v6-benefits" aria-labelledby="benefits-title">
        <div className="v6-section-heading v6-heading-left"><p className="eyebrow">Designed to make an impression</p><h2 id="benefits-title">One link. Your complete professional story.</h2></div>
        <div className="v6-benefit-grid">
          <article className="v6-benefit-card v6-benefit-featured">
            <div className="benefit-copy"><span className="benefit-label">Built for trust</span><h3>Look credible before the first conversation.</h3><p>Present your experience, services and proof of work in one polished destination.</p></div>
            <div className="trust-preview" aria-hidden="true"><div className="trust-avatar">AM</div><div><strong>Arjun Malhotra <CheckIcon /></strong><span>Identity verified</span></div><i>4.9 client rating</i></div>
          </article>
          <article className="v6-benefit-card"><div className="benefit-orbit" aria-hidden="true"><i /><i /><i /></div><div className="benefit-copy"><span className="benefit-label">Made for every screen</span><h3>Beautiful on mobile, tablet and desktop.</h3></div></article>
          <article className="v6-benefit-card"><div className="share-visual" aria-hidden="true"><span>your.link/arjun</span><i>↗</i></div><div className="benefit-copy"><span className="benefit-label">Effortless sharing</span><h3>Turn every introduction into an opportunity.</h3></div></article>
        </div>
      </section>

      <section className="v6-section v6-demos" aria-labelledby="demos-title">
        <div className="v6-section-heading"><p className="eyebrow">See DigiSprint in action</p><h2 id="demos-title">Two ways to present your best work.</h2></div>
        <div className="v6-demo-grid">
          <article className="v6-demo-card"><div className="demo-profile-art" aria-hidden="true"><div className="demo-side"><i /><span /><span /><span /></div><div className="demo-main"><i /><strong /><span /><div><b /><b /></div></div></div><div className="demo-copy"><span>Full professional profile</span><h3>Build a digital resume that feels unmistakably yours.</h3><p>Biography, experience, portfolio, services and testimonials in one premium profile.</p><a className="button button-secondary" href="/demo-profile">View Demo Profile <ArrowIcon /></a></div></article>
          <article className="v6-demo-card v6-demo-card-violet"><div className="demo-card-art" aria-hidden="true"><div className="demo-phone-card"><i /><strong /><span /><div><b /><b /><b /></div></div><span className="demo-contact-chip">Save contact <CheckIcon /></span></div><div className="demo-copy"><span>Digital business card</span><h3>Make every connection easier to remember.</h3><p>Contact actions, social links, business details and QR sharing built for mobile.</p><a className="button button-secondary" href="/demo-card">View Digital Card <ArrowIcon /></a></div></article>
        </div>
      </section>

      <section className="v6-section v6-pricing" id="pricing" aria-labelledby="pricing-title">
        <div className="v6-pricing-intro"><p className="eyebrow">Simple options</p><h2 id="pricing-title">Start with the profile you need today.</h2><p>Choose a focused foundation or unlock a richer professional presence. Plans shown are previews only.</p></div>
        <div className="v6-price-grid">
          <article className="v6-price-card"><div className="price-card-top"><span>Starter</span><i>Essential</i></div><h3>A polished home for your professional identity.</h3><ul>{starterFeatures.map((feature) => <li key={feature}><CheckIcon />{feature}</li>)}</ul><button className="button button-secondary" type="button" title="Plan availability is coming soon">Coming soon</button></article>
          <article className="v6-price-card v6-price-featured"><span className="popular-badge">Most complete</span><div className="price-card-top"><span>Professional</span><i>Premium</i></div><h3>Everything you need to turn attention into enquiries.</h3><ul>{professionalFeatures.map((feature) => <li key={feature}><CheckIcon />{feature}</li>)}</ul><button className="button button-primary" type="button" title="Plan availability is coming soon">Coming soon <ArrowIcon /></button></article>
        </div>
      </section>

      <section className="v6-final-cta" aria-labelledby="final-cta-title"><div><p className="eyebrow">Your next introduction starts here</p><h2 id="final-cta-title">Ready to create a profile worth sharing?</h2><p>Explore a template made for your profession and see how confidently you can show up online.</p></div><a className="button button-primary" href="#templates">Explore Templates <ArrowIcon /></a></section>

      <footer className="v6-footer">
        <div className="v6-footer-main">
          <div className="v6-footer-brand"><a className="brand" href="#" aria-label="DigiSprint home"><span className="brand-mark" aria-hidden="true">D</span>DigiSprint</a><p>Premium digital profiles for modern professionals and businesses.</p></div>
          <div><strong>Product</strong><a href="#templates">Templates</a><a href="/demo-profile">Demo Profile</a><a href="/demo-card">Digital Card</a></div>
          <div><strong>Resources</strong><a href="#how-it-works">How It Works</a><a href="#pricing">Pricing</a><a href="#" aria-label="Contact DigiSprint">Contact</a></div>
          <div><strong>Legal</strong><a href="#" aria-label="Privacy policy placeholder">Privacy</a><a href="#" aria-label="Terms placeholder">Terms</a></div>
        </div>
        <div className="v6-footer-bottom"><span>© 2026 DigiSprint</span><span>Professional identity, beautifully presented.</span></div>
      </footer>
    </main>
  );
}
