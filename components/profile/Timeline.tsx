import styles from "@/app/demo-profile/demo-profile.module.css";

type TimelineItem = {
  period: string;
  role: string;
  organization: string;
  description: string;
};

export function Timeline({
  title,
  eyebrow,
  items,
}: {
  title: string;
  eyebrow: string;
  items: TimelineItem[];
}) {
  const headingId = `${eyebrow.toLowerCase().replaceAll(" ", "-")}-heading`;

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <p className={styles.kicker}>{eyebrow}</p>
      <h2 id={headingId}>{title}</h2>
      <div className={styles.timeline}>
        {items.map((item) => (
          <article className={styles.timelineItem} key={`${item.period}-${item.role}`}>
            <span className={styles.timelineDot} aria-hidden="true" />
            <p className={styles.period}>{item.period}</p>
            <div>
              <h3>{item.role}</h3>
              <p className={styles.organization}>{item.organization}</p>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
