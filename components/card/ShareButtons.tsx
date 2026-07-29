"use client";

import { useState } from "react";
import styles from "@/app/demo-card/demo-card.module.css";

export function ShareButtons() {
  const [copied, setCopied] = useState(false);

  async function shareCard() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Arjun Malhotra — Digital Business Card",
          text: "View Arjun Malhotra’s digital business card.",
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={styles.shareButtons}>
      <button type="button" className={styles.saveButton} title="Contact download will be available on a live card">
        <span aria-hidden="true">＋</span>
        Save Contact
      </button>
      <button type="button" className={styles.shareButton} onClick={shareCard}>
        <span aria-hidden="true">↗</span>
        {copied ? "Link copied" : "Share Profile"}
      </button>
    </div>
  );
}
