"use client";

import { useState } from "react";
import styles from "@/app/demo-profile/demo-profile.module.css";

export function ShareButtons() {
  const [copied, setCopied] = useState(false);

  async function shareProfile() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: "Ananya Mehta — Professional Profile",
        text: "View Ananya Mehta’s professional biography and digital resume.",
        url,
      });
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={styles.shareButtons}>
      <button className={styles.secondaryButton} type="button" onClick={shareProfile}>
        <span aria-hidden="true">↗</span>
        {copied ? "Link copied" : "Share profile"}
      </button>
      <button
        className={styles.primaryButton}
        type="button"
        aria-label="Download resume — demonstration only"
        title="Resume download will be available on a live profile"
      >
        <span aria-hidden="true">↓</span>
        Download resume
      </button>
    </div>
  );
}
