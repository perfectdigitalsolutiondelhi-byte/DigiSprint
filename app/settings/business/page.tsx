import type { Metadata } from "next";
import { AppShell } from "../../../components/layout/AppShell";
import { requireBusinessSettingsWorkspace } from "../../../lib/business-settings/workspace";
import { BusinessSettingsForm } from "./BusinessSettingsForm";
import styles from "./business-settings.module.css";

export const metadata: Metadata = { title: "Business Settings", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function BusinessSettingsPage() {
  const { user, role, business } = await requireBusinessSettingsWorkspace();
  return (
    <AppShell
      userName={typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : null}
      userEmail={user.email}
      businessName={business.name}
      businessType={business.industry}
    >
      <div className={`dashboard-content ${styles.page}`}>
        <header className={styles.header}>
          <span>Workspace settings</span>
          <h1>Business information</h1>
          <p>Keep the business context used across DigiSprint accurate and current.</p>
        </header>
        <BusinessSettingsForm business={business} canEdit={role === "owner"} />
      </div>
    </AppShell>
  );
}