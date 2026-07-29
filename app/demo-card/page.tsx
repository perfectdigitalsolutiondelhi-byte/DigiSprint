import type { Metadata } from "next";
import { BusinessCard } from "../../components/card/BusinessCard";

export const metadata: Metadata = {
  title: "Premium Digital Business Card Demo",
  description:
    "Explore a premium DigiSprint digital business card demonstration with direct contact actions, business information, social links, QR access and profile sharing.",
  alternates: { canonical: "/demo-card" },
  openGraph: {
    title: "Premium Digital Business Card Demo | DigiSprint",
    description:
      "A modern digital business card designed to make professional connections faster, clearer and more memorable.",
    type: "profile",
    url: "/demo-card",
    siteName: "DigiSprint",
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium Digital Business Card Demo | DigiSprint",
    description:
      "See how DigiSprint presents contact details, services and professional identity in one premium digital card.",
  },
};

export default function DemoCardPage() {
  return <BusinessCard />;
}
