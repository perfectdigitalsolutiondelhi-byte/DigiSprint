import styles from "@/app/demo-profile/demo-profile.module.css";

const certifications = [
  { name: "Certified Scrum Product Owner", issuer: "Scrum Alliance", year: "2023" },
  { name: "Design Thinking for Innovation", issuer: "University of Virginia", year: "2021" },
  { name: "Reforge Growth Series", issuer: "Reforge", year: "2019" },
];

export function CertificationSection() {
  return (
    <section className={styles.section} aria-labelledby="certifications-heading">
      <p className={styles.kicker}>Continued learning</p>
      <h2 id="certifications-heading">Certifications</h2>
      <div className={styles.compactGrid}>
        {certifications.map((item) => (
          <article className={styles.compactCard} key={item.name}>
            <span className={styles.cardIcon} aria-hidden="true">✦</span>
            <h3>{item.name}</h3>
            <p>{item.issuer}</p>
            <span>{item.year}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
