import styles from "@/app/demo-profile/demo-profile.module.css";

export function BiographySection() {
  return (
    <section className={styles.section} aria-labelledby="biography-heading">
      <p className={styles.kicker}>About</p>
      <h2 id="biography-heading">Making the complicated feel clear.</h2>
      <div className={styles.biographyCopy}>
        <p>
          For more than fourteen years, I have worked at the intersection of
          product strategy, customer insight, and responsible growth. My career
          has taken me from an early-stage fintech team of twelve to leading
          multi-market product portfolios used by millions of people across Asia.
        </p>
        <p>
          I am at my best when the path is not obvious: aligning leaders around
          a sharp product thesis, building teams that make strong decisions, and
          translating research into experiences customers choose to return to.
          I believe momentum comes from clarity, and that the best strategy is
          one a team can actually use on Monday morning.
        </p>
      </div>
    </section>
  );
}
