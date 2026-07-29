import styles from "@/app/demo-card/demo-card.module.css";

export function CTASection() {
  return (
    <section className={styles.ctaSection} aria-labelledby="upgrade-heading">
      <div>
        <p className={styles.microLabel}>Ready for more?</p>
        <h2 id="upgrade-heading">Upgrade to a complete Digital Profile</h2>
        <p>
          Bring your story, work, services, and credentials together in one
          premium professional destination.
        </p>
      </div>
      <a className={styles.ctaButton} href="/demo-profile">
        View complete profile <span aria-hidden="true">↗</span>
      </a>
    </section>
  );
}
