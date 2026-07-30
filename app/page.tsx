import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { MarketingHeader } from "../components/marketing/MarketingHeader";
import { ButtonLink } from "../components/ui/ButtonLink";

const capabilities = [
  { icon: "✦", label: "Daily posts", title: "A fresh marketing post, ready every day.", description: "DigiSprint learns your business, audience and tone to suggest useful content without repeating the same ideas." },
  { icon: "◫", label: "Festival campaigns", title: "Never miss the moments your customers celebrate.", description: "Plan relevant Indian festival content early, with regional context and your brand built in." },
  { icon: "⌘", label: "AI tools", title: "Small marketing tasks, finished in minutes.", description: "Create WhatsApp promotions, product descriptions, review replies, offers and captions from one workspace." },
];

const steps = [
  { number: "01", title: "Tell us about your business", description: "Add your category, customers, city, brand style and marketing goals once." },
  { number: "02", title: "Get relevant ideas", description: "Receive daily posts, festival opportunities and practical actions made for your business." },
  { number: "03", title: "Edit and use anywhere", description: "Refine the message, approve the creative and download it for the channels you already use." },
];

export default function Home() {
  return (
    <main className="ai-marketing-page">
      <MarketingHeader />
      <section className="ai-hero">
        <div className="ai-hero-copy">
          <p className="ai-eyebrow"><span />AI marketing, made for Bharat</p>
          <h1>Your business deserves <em>better marketing.</em> Every day.</h1>
          <p className="ai-lede">DigiSprint turns your business details into daily social posts, festival campaigns and practical marketing ideas—without needing an agency or a complicated tool.</p>
          <div className="ai-actions"><ButtonLink href="/dashboard">Explore the dashboard <span aria-hidden="true">→</span></ButtonLink><ButtonLink href="#how-it-works" variant="secondary">See how it works</ButtonLink></div>
          <ul className="ai-proof"><li><span>✓</span> Built for small businesses</li><li><span>✓</span> English, Hindi &amp; Hinglish ready</li><li><span>✓</span> No marketing experience needed</li></ul>
        </div>
        <div className="ai-command-preview" aria-label="DigiSprint daily marketing dashboard preview">
          <div className="preview-top"><div><span>Good morning, Neha</span><strong>Today’s marketing is ready.</strong></div><i>Thursday · 30 July</i></div>
          <article className="today-creative"><div className="creative-art"><span>NAMMA<br />MASALA</span><strong>Monsoon<br />comfort,<br />served hot.</strong><small>Order on WhatsApp</small></div><div className="creative-copy"><span className="status-ready">● Ready to review</span><h2>Today’s Instagram post</h2><p>Warm rain, warmer flavours. Make this monsoon evening delicious with our Bengaluru favourites.</p><div><button type="button">Edit post</button><button type="button">Download</button></div></div></article>
          <div className="preview-bottom"><div><span>Next opportunity</span><strong>Raksha Bandhan campaign</strong><small>Recommended in 4 days</small></div><div><span>This month</span><strong>12 posts created</strong><small>4.8 hours saved</small></div></div>
        </div>
      </section>

      <section className="trust-ribbon" aria-label="DigiSprint product benefits"><span>One business setup</span><i /><span>Daily useful ideas</span><i /><span>Editable content</span><i /><span>India-first calendar</span></section>

      <section className="ai-section" id="features">
        <div className="ai-section-heading"><div><p className="ai-eyebrow"><span />One assistant, every marketing day</p><h2>From “What should I post?” to ready-to-use content.</h2></div><p>DigiSprint gives busy owners a focused system for staying visible, timely and consistent—without turning marketing into another full-time job.</p></div>
        <div className="capability-grid">{capabilities.map((item) => <article key={item.label}><div className="capability-icon" aria-hidden="true">{item.icon}</div><span>{item.label}</span><h3>{item.title}</h3><p>{item.description}</p><a href="/dashboard">Preview capability <span aria-hidden="true">↗</span></a></article>)}</div>
      </section>

      <section className="ai-section how-section" id="how-it-works">
        <div className="ai-section-heading compact"><div><p className="ai-eyebrow"><span />Simple from the first day</p><h2>Your marketing rhythm in three clear steps.</h2></div></div>
        <div className="how-grid">{steps.map((step) => <article key={step.number}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></article>)}</div>
      </section>

      <section className="ai-section learn-section" id="seekhein">
        <div className="learn-copy"><p className="ai-eyebrow"><span />Seekhein with DigiSprint</p><h2>Practical marketing knowledge, not marketing jargon.</h2><p>Short lessons will help business owners understand offers, captions, customer trust and local discovery—then apply each idea directly inside DigiSprint.</p><ButtonLink href="/dashboard" variant="secondary">Preview the learning centre</ButtonLink></div>
        <div className="lesson-stack" aria-label="Learning centre preview"><article><span>5 min · Beginner</span><h3>How to write an offer customers understand</h3><p>Make the value clear before discussing the discount.</p></article><article><span>7 min · WhatsApp</span><h3>Turn customer updates into useful promotions</h3><p>Stay helpful and visible without sending spam.</p></article><article><span>6 min · Local growth</span><h3>Build trust before asking for the sale</h3><p>Use proof, clarity and consistency in every post.</p></article></div>
      </section>

      <section className="ai-final-cta"><div><p className="ai-eyebrow"><span />A clearer marketing day starts here</p><h2>Let DigiSprint handle the blank page.</h2><p>Explore the Version 1.0 product foundation and see how your daily marketing workspace will come together.</p></div><ButtonLink href="/dashboard">View dashboard foundation <span aria-hidden="true">→</span></ButtonLink></section>
      <MarketingFooter />
    </main>
  );
}
