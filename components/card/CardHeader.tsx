import styles from "@/app/demo-card/demo-card.module.css";
import { VerifiedBadge } from "./VerifiedBadge";

export function CardHeader() {
  return (
    <header className={styles.cardHeader}>
      <div className={styles.coverArt} aria-hidden="true">
        <span className={styles.coverOrbOne} />
        <span className={styles.coverOrbTwo} />
        <span className={styles.coverGrid} />
      </div>
      <div className={styles.identityBlock}>
        <div className={styles.photoWrap}>
          <div
            className={styles.profilePhoto}
            role="img"
            aria-label="Professional portrait placeholder for Arjun Malhotra"
          >
            <span>AM</span>
          </div>
          <span className={styles.onlineDot} title="Available for new projects" />
        </div>
        <div className={styles.identityCopy}>
          <div className={styles.nameRow}>
            <h1>Arjun Malhotra</h1>
            <VerifiedBadge />
          </div>
          <p className={styles.designation}>Founder &amp; Brand Strategist</p>
          <p className={styles.company}>Northstar Creative Studio</p>
          <p className={styles.bio}>
            I help growing businesses turn bold ideas into clear brands,
            high-converting digital experiences, and lasting customer trust.
          </p>
        </div>
      </div>
    </header>
  );
}
