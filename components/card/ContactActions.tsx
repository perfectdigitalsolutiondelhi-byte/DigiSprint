import styles from "@/app/demo-card/demo-card.module.css";

const actions = [
  { label: "WhatsApp", icon: "W", href: "https://wa.me/919876543210" },
  { label: "Call", icon: "↗", href: "tel:+919876543210" },
  { label: "Email", icon: "@", href: "mailto:hello@northstarstudio.example" },
  { label: "Website", icon: "⌁", href: "https://example.com" },
  { label: "Google Maps", icon: "⌖", href: "https://maps.google.com/?q=Indiranagar+Bengaluru" },
];

export function ContactActions() {
  return (
    <section className={styles.contactSection} aria-labelledby="contact-actions-heading">
      <div className={styles.sectionLabel}>
        <span>01</span>
        <h2 id="contact-actions-heading">Connect instantly</h2>
      </div>
      <div className={styles.contactGrid}>
        {actions.map((action) => (
          <a
            className={styles.contactAction}
            href={action.href}
            key={action.label}
            target={action.href.startsWith("http") ? "_blank" : undefined}
            rel={action.href.startsWith("http") ? "noreferrer" : undefined}
            aria-label={`${action.label} Arjun Malhotra`}
          >
            <span aria-hidden="true">{action.icon}</span>
            <strong>{action.label}</strong>
          </a>
        ))}
      </div>
      <div className={styles.phoneBar}>
        <div>
          <span>Mobile</span>
          <a href="tel:+919876543210">+91 98765 43210</a>
        </div>
        <span className={styles.availablePill}>Available Mon–Fri</span>
      </div>
    </section>
  );
}
