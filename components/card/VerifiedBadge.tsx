import styles from "@/app/demo-card/demo-card.module.css";

export function VerifiedBadge() {
  return (
    <span className={styles.verifiedBadge} aria-label="Verified business profile">
      <span aria-hidden="true">✓</span>
      Verified
    </span>
  );
}
