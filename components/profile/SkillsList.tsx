import styles from "@/app/demo-profile/demo-profile.module.css";

export function SkillsList({ skills }: { skills: string[] }) {
  return (
    <section className={styles.section} aria-labelledby="skills-heading">
      <p className={styles.kicker}>Capabilities</p>
      <h2 id="skills-heading">Skills &amp; expertise</h2>
      <ul className={styles.skillList}>
        {skills.map((skill, index) => (
          <li key={skill}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            {skill}
          </li>
        ))}
      </ul>
    </section>
  );
}
