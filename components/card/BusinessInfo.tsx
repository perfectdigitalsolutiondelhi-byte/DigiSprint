import styles from "@/app/demo-card/demo-card.module.css";

const services = [
  "Brand strategy",
  "Visual identity",
  "Website design",
  "Campaign direction",
];

export function BusinessInfo() {
  return (
    <section className={styles.businessSection} aria-labelledby="business-heading">
      <div className={styles.sectionLabel}>
        <span>02</span>
        <h2 id="business-heading">Business information</h2>
      </div>
      <div className={styles.infoGrid}>
        <article className={`${styles.infoCard} ${styles.aboutCard}`}>
          <p className={styles.microLabel}>About the business</p>
          <h3>Strategy with imagination. Design with purpose.</h3>
          <p>
            Northstar Creative Studio partners with founders and growth teams
            to build distinctive brands that are useful, memorable, and ready
            for what comes next.
          </p>
        </article>
        <article className={styles.infoCard}>
          <p className={styles.microLabel}>Services</p>
          <ul className={styles.serviceList}>
            {services.map((service) => (
              <li key={service}><span aria-hidden="true">✦</span>{service}</li>
            ))}
          </ul>
        </article>
        <article className={styles.infoCard}>
          <p className={styles.microLabel}>Working hours</p>
          <dl className={styles.detailList}>
            <div><dt>Monday–Friday</dt><dd>9:30 AM–6:30 PM</dd></div>
            <div><dt>Saturday</dt><dd>By appointment</dd></div>
            <div><dt>Sunday</dt><dd>Closed</dd></div>
          </dl>
        </article>
        <article className={styles.infoCard}>
          <p className={styles.microLabel}>Studio address</p>
          <address>
            24, 12th Main Road<br />
            Indiranagar, Bengaluru<br />
            Karnataka 560038
          </address>
          <a
            className={styles.inlineLink}
            href="https://maps.google.com/?q=Indiranagar+Bengaluru"
            target="_blank"
            rel="noreferrer"
          >
            View on Google Maps <span aria-hidden="true">↗</span>
          </a>
        </article>
      </div>
    </section>
  );
}
