import Link from "next/link";
import styles from "@/app/demo-card/demo-card.module.css";
import { BusinessInfo } from "./BusinessInfo";
import { CardHeader } from "./CardHeader";
import { ContactActions } from "./ContactActions";
import { CTASection } from "./CTASection";
import { QRSection } from "./QRSection";
import { ShareButtons } from "./ShareButtons";
import { SocialIcons } from "./SocialIcons";
import { ThemeSettings } from "../theme/ThemeProvider";

export function BusinessCard() {
  return (
    <main className={styles.page}>
      <nav className={styles.topNav} aria-label="Demo card navigation">
        <Link className={styles.brand} href="/">
          <span aria-hidden="true">D</span>
          DigiSprint
        </Link>
        <Link className={styles.backLink} href="/">
          Back to DigiSprint <span aria-hidden="true">↗</span>
        </Link>
        <ThemeSettings />
      </nav>

      <div className={styles.shell}>
        <div className={styles.card}>
          <CardHeader />
          <div className={styles.cardBody}>
            <ShareButtons />
            <ContactActions />
            <BusinessInfo />
            <SocialIcons />
            <QRSection />
          </div>
        </div>
        <CTASection />
        <aside className={styles.demoNote}>
          <span aria-hidden="true">✦</span>
          <p>
            This is a demonstration card. Additional customization and content
            writing are available as optional paid services.
          </p>
        </aside>
      </div>

      <footer className={styles.footer}>
        <p>Digital business card demonstration by <strong>DigiSprint</strong></p>
        <Link href="/">Explore DigiSprint</Link>
      </footer>
    </main>
  );
}
