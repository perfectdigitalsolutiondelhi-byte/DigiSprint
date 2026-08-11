import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "../../components/layout/AppShell";
import { loadCampaignBuilderData } from "../../lib/campaign-studio/queries";
import { requireStrategyOwnerWorkspace } from "../../lib/marketing-strategy/review-authorization";
import { CampaignBuilder } from "./CampaignBuilder";
import styles from "./campaign-studio.module.css";

export const metadata: Metadata = { title: "AI Campaign Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CampaignStudioPage({ searchParams }: { searchParams: Promise<{ campaignsPage?: string; weeksPage?: string }> }) {
  const { supabase, user, business } = await requireStrategyOwnerWorkspace("/campaign-studio");
  const query = await searchParams;
  const data = await loadCampaignBuilderData(supabase, business.id, Number(query.campaignsPage), Number(query.weeksPage));
  return <AppShell userName={typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : null} userEmail={user.email} businessName={business.name} businessType={business.industry}>
    <main className={`dashboard-content ${styles.page}`}>
      <header className={styles.hero}><span>Version 1.7</span><h1>AI Campaign Studio</h1><p>Build focused campaigns from approved strategy weeks and approved post content.</p></header>
      <CampaignBuilder weeks={data.weeks.items}/>
      <nav className={styles.pagination} aria-label="Approved week pages">{data.weeks.page > 1 && <Link href={`?weeksPage=${data.weeks.page - 1}&campaignsPage=${data.campaigns.page}`}>Previous weeks</Link>}<span>Approved weeks: page {data.weeks.page} of {Math.max(1, Math.ceil(data.weeks.totalCount / data.weeks.pageSize))}</span>{data.weeks.nextCursor && <Link href={`?weeksPage=${data.weeks.nextCursor}&campaignsPage=${data.campaigns.page}`}>Next weeks</Link>}</nav>
      <section className={styles.section}><div className={styles.sectionHeading}><div><span>Campaign Dashboard</span><h2>Your campaigns</h2></div><small>{data.campaigns.totalCount} campaigns</small></div>
        {data.campaigns.items.length ? <div className={styles.grid}>{data.campaigns.items.map((campaign) => <Link href={`/campaign-studio/${campaign.id}`} className={styles.campaignCard} key={campaign.id}><div><span className={`${styles.badge} ${styles[campaign.status]}`}>{campaign.status}</span><small>{campaign.hasPlan ? campaign.planStatus : "Awaiting AI plan"}</small></div><h3>{campaign.name}</h3><p>{campaign.objective}</p>{campaign.lastGeneratedAt && <small>Generated {new Date(campaign.lastGeneratedAt).toLocaleDateString()}</small>}<b>Open campaign →</b></Link>)}</div> : <div className={styles.empty}><h3>No campaigns yet</h3><p>Choose an approved week and its approved posts to create your first campaign.</p></div>}
        <nav className={styles.pagination} aria-label="Campaign pages">{data.campaigns.page > 1 && <Link href={`?campaignsPage=${data.campaigns.page - 1}&weeksPage=${data.weeks.page}`}>Previous campaigns</Link>}<span>Page {data.campaigns.page} of {Math.max(1, Math.ceil(data.campaigns.totalCount / data.campaigns.pageSize))}</span>{data.campaigns.nextCursor && <Link href={`?campaignsPage=${data.campaigns.nextCursor}&weeksPage=${data.weeks.page}`}>Next campaigns</Link>}</nav>
      </section>
    </main>
  </AppShell>;
}
