import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "../../components/layout/AppShell";
import { StrategyGenerationForm } from "../../components/strategy/StrategyGenerationForm";
import { StrategyHistory } from "../../components/strategy/StrategyHistory";
import { requireStrategyWorkspace } from "../../lib/marketing-strategy/authorization";
import { loadStrategyHistory } from "../../lib/marketing-strategy/queries";
import { loadLatestWeeklyRun } from "../../lib/marketing-strategy/weekly-queries";
export const metadata: Metadata = { title: "AI Marketing Strategy", description: "Build a progressive weekly marketing strategy.", robots: { index: false, follow: false } }; export const dynamic = "force-dynamic";
export default async function StrategyPage() {
  const { supabase, user, business } = await requireStrategyWorkspace(); const [history, latest] = await Promise.all([loadStrategyHistory(supabase, business.id), loadLatestWeeklyRun(supabase, business.id)]);
  return <AppShell userName={typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : null} userEmail={user.email} businessName={business.name} businessType={business.industry}><div className="dashboard-content strategy-workspace"><section className="strategy-intro"><div><span className="strategy-label">Weekly Strategy Engine</span><h1>Build a focused plan one week at a time.</h1><p>Generate and approve your foundation, then create Weeks 1–4 independently.</p></div><div className="strategy-context"><span>Business context</span><strong>{business.name}</strong><small>{business.industry || "Small business"} · {[business.city, business.state].filter(Boolean).join(", ") || "India"}</small></div></section>{latest?.status === "active" ? <section className="strategy-form"><h2>Continue your weekly strategy</h2><p>Foundation {latest.foundation_status === "approved" ? "?" : "in review"} · {latest.weeks.map((week) => `Week ${week.week_number} ${week.status === "approved" ? "?" : "in review"}`).join(" · ") || "Week 1 pending"}</p><Link className="strategy-primary" href={`/strategy/weekly/${latest.id}`}>Open weekly workspace</Link></section> : <StrategyGenerationForm/>}<StrategyHistory strategies={history}/></div></AppShell>;
}
