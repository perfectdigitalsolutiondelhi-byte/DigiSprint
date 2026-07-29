import styles from "@/app/demo-profile/demo-profile.module.css";

export function VerifiedBadge() {
  return (
    <span className={styles.verifiedBadge} aria-label="Verified professional profile">
      <span aria-hidden="true">✓</span>
      Verified
    </span>
  );
}
