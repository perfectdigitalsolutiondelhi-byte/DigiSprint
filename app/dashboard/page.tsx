import type { Metadata } from "next";
import { AppShell } from "../../components/layout/AppShell";
import { DashboardOverview } from "../../components/dashboard/DashboardOverview";
import { loadDashboard } from "../../lib/dashboard/loadDashboard";

export const metadata: Metadata = { title: "Marketing Dashboard", description: "Your DigiSprint business marketing overview, content activity and next opportunities.", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const workspace = await loadDashboard();
  return <AppShell userName={workspace.userName} userEmail={workspace.userEmail} businessName={workspace.business?.name} businessType={workspace.business?.industry}><DashboardOverview workspace={workspace} /></AppShell>;
}
