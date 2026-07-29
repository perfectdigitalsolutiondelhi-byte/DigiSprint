import styles from "@/app/demo-profile/demo-profile.module.css";

const testimonials = [
  {
    quote: "Ananya has the rare ability to make a room full of competing ideas feel like one clear path forward. Our team left stronger, faster, and much more confident.",
    name: "Rohan Kapoor",
    role: "Founder & CEO, Northstar Labs",
  },
  {
    quote: "She combines commercial judgement with genuine empathy for customers and teams. The product strategy we built together is still guiding our biggest decisions.",
    name: "Meera Iyer",
    role: "VP Growth, Canopy Financial",
  },
];

export function TestimonialsSection() {
  return (
    <section className={styles.section} aria-labelledby="testimonials-heading">
      <p className={styles.kicker}>Kind words</p>
      <h2 id="testimonials-heading">Trusted by people doing ambitious work.</h2>
      <div className={styles.testimonialGrid}>
        {testimonials.map((testimonial) => (
          <figure key={testimonial.name}>
            <blockquote>“{testimonial.quote}”</blockquote>
            <figcaption>
              <span>{testimonial.name.slice(0, 1)}</span>
              <div><strong>{testimonial.name}</strong><small>{testimonial.role}</small></div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
