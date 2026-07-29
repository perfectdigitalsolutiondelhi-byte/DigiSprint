import styles from "@/app/demo-profile/demo-profile.module.css";

const services = [
  ["Product strategy intensive", "A focused engagement to clarify the opportunity, define the choices, and create an actionable product direction."],
  ["Leadership advisory", "Ongoing one-to-one partnership for product leaders navigating growth, change, and high-stakes decisions."],
  ["Team alignment workshop", "A practical working session that turns competing perspectives into shared priorities and clear ownership."],
];

export function ServicesSection() {
  return (
    <section className={`${styles.section} ${styles.servicesSection}`} aria-labelledby="services-heading">
      <div>
        <p className={styles.kicker}>Ways to work together</p>
        <h2 id="services-heading">From uncertainty to a confident next move.</h2>
      </div>
      <div className={styles.serviceList}>
        {services.map(([name, description], index) => (
          <article key={name}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3>{name}</h3>
              <p>{description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
