import styles from "@/app/demo-profile/demo-profile.module.css";

const achievements = [
  { value: "3.2×", label: "Portfolio revenue growth across three years" },
  { value: "42%", label: "Improvement in new-user activation" },
  { value: "18", label: "Product leaders coached and promoted" },
  { value: "6", label: "Markets launched across Asia-Pacific" },
];

export function AchievementSection() {
  return (
    <section className={`${styles.section} ${styles.achievementSection}`} aria-labelledby="achievements-heading">
      <p className={styles.kicker}>Selected impact</p>
      <h2 id="achievements-heading">Outcomes that matter.</h2>
      <div className={styles.metricGrid}>
        {achievements.map((item) => (
          <article key={item.label}>
            <strong>{item.value}</strong>
            <p>{item.label}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
