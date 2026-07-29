import styles from "@/app/demo-profile/demo-profile.module.css";
import { SocialLinks } from "./SocialLinks";

export function ContactCard() {
  return (
    <section className={styles.contactCard} aria-labelledby="contact-heading">
      <div className={styles.contactCopy}>
        <p className={styles.kicker}>Start a conversation</p>
        <h2 id="contact-heading">Have a meaningful challenge in mind?</h2>
        <p>
          I take on a small number of advisory and workshop engagements each
          quarter. Share a little about what you are building and where you feel stuck.
        </p>
        <div className={styles.contactDetails}>
          <a href="mailto:ananya@example.com">ananya@example.com</a>
          <a href="tel:+919800012345">+91 98000 12345</a>
          <span>Bengaluru, India · GMT+5:30</span>
        </div>
        <SocialLinks />
      </div>
      <div className={styles.qrBlock}>
        <div className={styles.qrPlaceholder} role="img" aria-label="QR code placeholder">
          <span>QR</span>
        </div>
        <p>Scan to save profile</p>
      </div>
    </section>
  );
}
