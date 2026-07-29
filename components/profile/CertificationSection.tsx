import styles from "@/app/demo-profile/demo-profile.module.css";

const certifications = [
  { name: "Certified Scrum Product Owner", issuer: "Scrum Alliance", year: "2023", code: "CSPO" },
  { name: "Design Thinking for Innovation", issuer: "University of Virginia", year: "2021", code: "DTI" },
  { name: "Reforge Growth Series", issuer: "Reforge", year: "2019", code: "RGS" },
];

export function CertificationSection() {
  return (
    <section className={styles.section} aria-labelledby="certifications-heading">
      <p className={styles.kicker}>Continued learning</p>
      <h2 id="certifications-heading">Certifications</h2>
      <div className={styles.compactGrid}>
        {certifications.map((item) => (
          <article className={styles.compactCard} key={item.name}>
            <div className={styles.certificateTop}>
              <span className={styles.certificateSeal} aria-hidden="true">{item.code}</span>
              <span className={styles.verifiedCredential}><i aria-hidden="true">✓</i> Verified</span>
            </div>
            <h3>{item.name}</h3>
            <p>{item.issuer}</p>
            <div className={styles.certificateMeta}>
              <span>Issued {item.year}</span>
              <span aria-hidden="true">↗</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
