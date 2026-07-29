import Image from "next/image";
import Link from "next/link";
import styles from "@/app/demo-profile/demo-profile.module.css";
import { ShareButtons } from "./ShareButtons";
import { VerifiedBadge } from "./VerifiedBadge";

export function ProfileHeader() {
  return (
    <>
      <nav className={styles.profileNav} aria-label="Profile navigation">
        <Link className={styles.profileBrand} href="/">
          <span aria-hidden="true">D</span>
          DigiSprint
        </Link>
        <Link className={styles.backLink} href="/">
          Back to DigiSprint <span aria-hidden="true">↗</span>
        </Link>
      </nav>

      <header className={styles.profileHeader}>
        <div className={styles.cover} aria-hidden="true">
          <span className={styles.coverWord}>BUILD</span>
          <span className={styles.coverLine} />
          <span className={styles.coverDot} />
        </div>
        <div className={styles.profileIntro}>
          <div className={styles.photoWrap}>
            <div className={styles.profilePhoto}>
              <Image
                className={styles.profilePhotoImage}
                src="/profiles/ananya-mehta.jpg"
                alt="Professional portrait of Ananya Mehta"
                fill
                priority
                sizes="(max-width: 680px) 118px, 180px"
              />
            </div>
            <span className={styles.availableDot} title="Available for select advisory projects" />
          </div>
          <div className={styles.identity}>
            <div className={styles.nameRow}>
              <h1>Ananya Mehta</h1>
              <VerifiedBadge />
            </div>
            <p className={styles.title}>Product Strategy Leader &amp; Growth Advisor</p>
            <p className={styles.intro}>
              I help ambitious teams turn complex customer problems into
              focused products, durable growth, and work people are proud to ship.
            </p>
            <div className={styles.locationRow}>
              <span>📍 Bengaluru, India</span>
              <span>Available worldwide</span>
            </div>
          </div>
          <ShareButtons />
        </div>
      </header>
    </>
  );
}
