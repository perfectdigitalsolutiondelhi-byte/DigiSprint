import type { Metadata } from "next";
import { AchievementSection } from "@/components/profile/AchievementSection";
import { BiographySection } from "@/components/profile/BiographySection";
import { CertificationSection } from "@/components/profile/CertificationSection";
import { ContactCard } from "@/components/profile/ContactCard";
import { PortfolioSection } from "@/components/profile/PortfolioSection";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ServicesSection } from "@/components/profile/ServicesSection";
import { SkillsList } from "@/components/profile/SkillsList";
import { TestimonialsSection } from "@/components/profile/TestimonialsSection";
import { Timeline } from "@/components/profile/Timeline";
import styles from "./demo-profile.module.css";

export const metadata: Metadata = {
  title: "Ananya Mehta — Product Strategy Leader",
  description:
    "Explore the professional biography, experience, selected work, services and achievements of product strategy leader Ananya Mehta.",
  alternates: { canonical: "/demo-profile" },
  openGraph: {
    title: "Ananya Mehta — Product Strategy Leader",
    description:
      "Product strategist, growth advisor and team builder helping ambitious organizations turn complexity into meaningful progress.",
    type: "profile",
    url: "/demo-profile",
    siteName: "DigiSprint",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ananya Mehta — Product Strategy Leader",
    description:
      "A premium professional biography and digital resume demonstration by DigiSprint.",
  },
  robots: { index: true, follow: true },
};

const experience = [
  {
    period: "2021 — Present",
    role: "Vice President, Product",
    organization: "Canopy Financial · Bengaluru",
    description:
      "Lead product strategy, design, and research for a consumer finance portfolio across six markets. Built a 45-person product organization and introduced a customer-led planning system that improved delivery confidence and commercial outcomes.",
  },
  {
    period: "2017 — 2021",
    role: "Director of Product & Growth",
    organization: "Orbit Commerce · Singapore",
    description:
      "Owned acquisition, activation, and retention for a B2B commerce platform. Launched two new product lines and helped grow annual recurring revenue from $8M to $31M.",
  },
  {
    period: "2012 — 2017",
    role: "Senior Product Manager",
    organization: "BrightPay · Mumbai",
    description:
      "Took three zero-to-one products from research to market, including a mobile payments experience adopted by more than 600,000 small-business owners.",
  },
];

const education = [
  {
    period: "2010 — 2012",
    role: "MBA, Strategy & Marketing",
    organization: "Indian School of Business · Hyderabad",
    description:
      "Dean’s List. Product Club lead and recipient of the Emerging Markets Strategy Prize.",
  },
  {
    period: "2006 — 2010",
    role: "B.E., Information Technology",
    organization: "Pune Institute of Computer Technology",
    description:
      "Graduated with distinction and led the student technology entrepreneurship cell.",
  },
];

const skills = [
  "Product strategy",
  "Growth systems",
  "Customer research",
  "Portfolio leadership",
  "Go-to-market planning",
  "Executive facilitation",
  "Team design & coaching",
  "Business model innovation",
];

export default function DemoProfilePage() {
  return (
    <main className={styles.profilePage}>
      <ProfileHeader />
      <div className={styles.profileContent}>
        <BiographySection />
        <Timeline title="A career built around useful change." eyebrow="Experience" items={experience} />
        <AchievementSection />
        <Timeline title="Foundations & formal education." eyebrow="Education" items={education} />
        <SkillsList skills={skills} />
        <CertificationSection />
        <PortfolioSection />
        <ServicesSection />
        <TestimonialsSection />
        <ContactCard />
        <aside className={styles.serviceNote}>
          <span aria-hidden="true">✦</span>
          <p>
            Professional biography, profile writing and content creation are
            available as an optional paid service.
          </p>
        </aside>
      </div>
      <footer className={styles.profileFooter}>
        <p>Profile demonstration by <strong>DigiSprint</strong></p>
        <a href="#top">Back to top ↑</a>
      </footer>
    </main>
  );
}
