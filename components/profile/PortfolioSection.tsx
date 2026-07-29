import styles from "@/app/demo-profile/demo-profile.module.css";

const projects = [
  { type: "Product transformation", title: "Reimagining everyday money management", summary: "Led the strategy and cross-functional operating model for a mobile banking experience serving 4.8 million customers.", result: "+31% monthly engagement" },
  { type: "Market expansion", title: "A platform built for six new markets", summary: "Created a modular launch playbook that balanced local customer needs with a scalable global product foundation.", result: "6 markets in 14 months" },
  { type: "Growth strategy", title: "From first visit to lasting habit", summary: "Redesigned onboarding around customer intent, reducing friction while improving meaningful product adoption.", result: "+42% activation" },
];

export function PortfolioSection() {
  return (
    <section className={styles.section} aria-labelledby="portfolio-heading">
      <p className={styles.kicker}>Selected work</p>
      <h2 id="portfolio-heading">Ideas made real.</h2>
      <div className={styles.portfolioGrid}>
        {projects.map((project, index) => (
          <article className={styles.projectCard} key={project.title}>
            <div className={`${styles.projectVisual} ${styles[`projectVisual${index + 1}`]}`}>
              <div className={styles.projectMiniUi} aria-hidden="true">
                <span /><span /><span />
                <div><i /><i /><i /></div>
              </div>
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
            <div className={styles.projectCopy}>
              <p className={styles.projectType}>{project.type}</p>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <strong>{project.result}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
