import styles from "@/app/demo-card/demo-card.module.css";

export function QRSection() {
  return (
    <section className={styles.qrSection} aria-labelledby="qr-heading">
      <div>
        <p className={styles.microLabel}>Quick access</p>
        <h2 id="qr-heading">Scan. Save. Stay connected.</h2>
        <p>
          Open this digital card instantly on another device and keep Arjun&apos;s
          business details close.
        </p>
      </div>
      <div className={styles.qrWrap}>
        <div className={styles.qrCode} role="img" aria-label="QR code placeholder">
          <span>QR</span>
        </div>
        <small>Profile QR</small>
      </div>
    </section>
  );
}
