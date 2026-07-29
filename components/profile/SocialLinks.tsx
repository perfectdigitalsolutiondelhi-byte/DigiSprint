import styles from "@/app/demo-profile/demo-profile.module.css";

const links = [
  { label: "LinkedIn", href: "https://www.linkedin.com/" },
  { label: "X / Twitter", href: "https://x.com/" },
  { label: "Medium", href: "https://medium.com/" },
];

export function SocialLinks() {
  return (
    <nav className={styles.socialLinks} aria-label="Social media profiles">
      {links.map((link) => (
        <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
          {link.label} <span aria-hidden="true">↗</span>
        </a>
      ))}
    </nav>
  );
}
