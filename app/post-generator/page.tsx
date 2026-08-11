import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "../../components/layout/AppShell";
import { requireStrategyOwnerWorkspace } from "../../lib/marketing-strategy/review-authorization";
import { loadApprovedWeeks } from "../../lib/post-generator/queries";
import styles from "./post-generator.module.css";

export const metadata: Metadata = { title: "AI Post Generator", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PostGeneratorPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { supabase, user, business } = await requireStrategyOwnerWorkspace("/post-generator");
  const query = await searchParams;
  const weeks = await loadApprovedWeeks(supabase, business.id, Number(query.page) || 1);
  return <AppShell userName={typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : null} userEmail={user.email} businessName={business.name} businessType={business.industry}>
    <main className={`dashboard-content ${styles.page}`}><header className={styles.hero}><span>AI Post Generator</span><h1>Turn an approved week into ready-to-publish content.</h1><p>Select an approved strategy week. Each day generates independently, so completed work is preserved if another day needs to resume.</p></header>
      {weeks.items.length ? <><section className={styles.weekGrid} aria-label="Approved strategy weeks">{weeks.items.map((week) => <Link className={styles.weekCard} href={`/post-generator/${week.id}`} key={week.id}><span>Approved</span><strong>Week {week.weekNumber}</strong><p>{week.weeklyGoal}</p><small>Approved {new Date(week.updatedAt).toLocaleDateString()}</small><b>Open post workspace -&gt;</b></Link>)}</section><nav className={styles.pagination} aria-label="Approved weeks pages">{weeks.page > 1 && <Link href={`?page=${weeks.page - 1}`}>&lt;- Previous</Link>}<span>Page {weeks.page}</span>{weeks.page * weeks.pageSize < weeks.totalCount && <Link href={`?page=${weeks.page + 1}`}>Next -&gt;</Link>}</nav></> : <section className={styles.empty}><span aria-hidden="true">+</span><h2>No approved weeks yet</h2><p>Approve a weekly strategy before generating posts.</p><Link href="/strategy">Open Strategy Workspace</Link></section>}
    </main>
  </AppShell>;
}
