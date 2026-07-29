import styles from "@/app/demo-profile/demo-profile.module.css";

const achievements = [
  { value: "3.2×", label: "Portfolio revenue growth across three years", detail: "Commercial impact" },
  { value: "42%", label: "Improvement in new-user activation", detail: "Product adoption" },
  { value: "18", label: "Product leaders coached and promoted", detail: "Leadership growth" },
  { value: "6", label: "Markets launched across Asia-Pacific", detail: "Regional scale" },
];

export function AchievementSection() {
  return (
    <section className={`${styles.section} ${styles.achievementSection}`} aria-labelledby="achievements-heading">
      <p className={styles.kicker}>Selected impact</p>
      <h2 id="achievements-heading">Outcomes that matter.</h2>
      <div className={styles.metricGrid}>
        {achievements.map((item, index) => (
          <article key={item.label}>
            <span className={styles.metricBadge} aria-hidden="true">0{index + 1}</span>
            <strong>{item.value}</strong>
            <p>{item.label}</p>
            <span className={styles.metricDetail}>{item.detail}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
