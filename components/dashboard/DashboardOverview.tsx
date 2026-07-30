import { StatCard } from "./StatCard";
import { RecentPosts } from "./RecentPosts";
import type { DashboardWorkspace } from "../../lib/dashboard/loadDashboard";

const languageNames: Record<string, string> = { en: "English", hi: "Hindi", hinglish: "Hinglish", regional: "Regional" };
function titleCase(value: string) { return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

export function DashboardOverview({ workspace }: { workspace: DashboardWorkspace }) {
  const { business, brand, preferences } = workspace;
  const firstName = workspace.userName?.split(" ")[0] || "there";
  const date = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const readiness = [business?.description, business?.city, brand?.tone, brand?.primary_color, preferences?.target_audience, preferences?.platforms.length].filter(Boolean).length;
  const readinessPercent = Math.round((readiness / 6) * 100);

  return <div className="dashboard-content live-overview">
    <section className="dashboard-welcome"><div><span>{date}</span><h1>Good morning, {firstName}.</h1><p>{business?.name} is ready for a focused marketing day.</p></div><div className="dashboard-mode"><i /><span>{workspace.configured ? "Workspace connected" : "Preview mode"}</span></div></section>
    <section className="overview-stats" aria-label="Marketing overview"><StatCard label="Posts created" value={workspace.postCount} detail="All content in your workspace" /><StatCard label="Ready to use" value={workspace.readyCount} detail="Approved content available" /><StatCard label="Weekly rhythm" value={`${preferences?.posts_per_week ?? 0} posts`} detail="Your selected publishing goal" /><StatCard accent label="Setup readiness" value={`${readinessPercent}%`} detail="Business context available" /></section>
    <div className="overview-layout">
      <section className="overview-card daily-focus"><div className="overview-card-heading"><div><span>Today&apos;s focus</span><h2>Your workspace is prepared.</h2></div><b>Foundation ready</b></div><div className="focus-visual"><span>{business?.name.slice(0, 2).toUpperCase()}</span><div><small>{business?.industry || "Small business"}</small><strong>{preferences?.content_goals[0] ? titleCase(preferences.content_goals[0]) : "Build visibility"}</strong><p>Future recommendations will combine your business, audience, tone and selected channels.</p></div></div><div className="focus-note"><span aria-hidden="true">i</span><p><strong>Next product milestone</strong> Daily post generation will be added after this live dashboard foundation.</p></div></section>
      <aside className="overview-card strategy-card"><div className="overview-card-heading"><div><span>Your strategy</span><h2>Marketing profile</h2></div></div><dl><div><dt>Audience</dt><dd>{preferences?.target_audience || "Not provided"}</dd></div><div><dt>Brand tone</dt><dd>{brand?.tone ? titleCase(brand.tone) : "Not selected"}</dd></div><div><dt>Languages</dt><dd>{brand?.language_preferences.map((item) => languageNames[item] || titleCase(item)).join(", ") || "Not selected"}</dd></div><div><dt>Channels</dt><dd>{preferences?.platforms.map(titleCase).join(", ") || "Not selected"}</dd></div></dl><a href="/setup" aria-label="Business settings will be editable in a later version">Business profile saved <span aria-hidden="true">&#10003;</span></a></aside>
      <RecentPosts posts={workspace.recentPosts} />
      <section className="overview-card opportunity-card"><div><span>Next opportunity</span><h2>Independence Day</h2><p>Start preparing a relevant 15 August message for your customers.</p></div><div className="opportunity-date"><strong>15</strong><span>AUG<br />INDIA</span></div><small>Festival recommendations arrive with the festival engine.</small></section>
    </div>
  </div>;
}
