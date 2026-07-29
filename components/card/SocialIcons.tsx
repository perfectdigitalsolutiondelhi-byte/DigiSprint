import styles from "@/app/demo-card/demo-card.module.css";

const networks = [
  { label: "Facebook", short: "f", href: "https://facebook.com/" },
  { label: "Instagram", short: "◎", href: "https://instagram.com/" },
  { label: "LinkedIn", short: "in", href: "https://linkedin.com/" },
  { label: "X", short: "X", href: "https://x.com/" },
  { label: "YouTube", short: "▶", href: "https://youtube.com/" },
];

export function SocialIcons() {
  return (
    <section className={styles.socialSection} aria-labelledby="social-heading">
      <div className={styles.sectionLabel}>
        <span>03</span>
        <h2 id="social-heading">Follow the work</h2>
      </div>
      <nav className={styles.socialGrid} aria-label="Social media profiles">
        {networks.map((network) => (
          <a
            href={network.href}
            key={network.label}
            target="_blank"
            rel="noreferrer"
            aria-label={network.label}
          >
            <span aria-hidden="true">{network.short}</span>
            <small>{network.label}</small>
          </a>
        ))}
      </nav>
    </section>
  );
}
