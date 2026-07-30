import type { Metadata } from "next";
import { MarketingFooter } from "../../components/marketing/MarketingFooter";
import { MarketingHeader } from "../../components/marketing/MarketingHeader";
import { ButtonLink } from "../../components/ui/ButtonLink";

export const metadata: Metadata = { title: "Plans", description: "Explore the planned DigiSprint AI marketing assistant tiers for Indian small businesses." };

const plans = [
  { name: "Free", audience: "Explore the basics", features: ["Business setup", "Limited AI tools", "Learning Centre access"] },
  { name: "Starter", audience: "Market consistently", features: ["Daily post suggestions", "Festival opportunities", "Brand kit", "More AI tool usage"], featured: true },
  { name: "Growth", audience: "Build a stronger rhythm", features: ["More generations", "Image creatives", "Content history", "Priority features"] },
];

export default function PlanPage() {
  return <main className="ai-marketing-page"><MarketingHeader /><section className="plan-hero"><p className="ai-eyebrow"><span />Simple plans, clear value</p><h1>Choose the support your marketing needs.</h1><p>Version 1.0 establishes the plan architecture. Payments and subscriptions will be introduced in a later release.</p></section><section className="plan-grid">{plans.map((plan) => <article className={plan.featured ? "featured" : ""} key={plan.name}>{plan.featured && <span className="plan-badge">Recommended</span>}<p>{plan.name}</p><h2>Coming soon</h2><span>{plan.audience}</span><ul>{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul><ButtonLink href="/dashboard" variant={plan.featured ? "primary" : "secondary"}>Preview DigiSprint</ButtonLink></article>)}</section><MarketingFooter /></main>;
}
