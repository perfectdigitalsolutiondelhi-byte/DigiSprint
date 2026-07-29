import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://digisprint.app"),
  title: {
    default: "DigiSprint — Premium Professional Digital Profiles",
    template: "%s | DigiSprint",
  },
  description:
    "Launch a premium professional digital profile in minutes with DigiSprint templates designed for your profession and personal brand.",
  keywords: ["digital profile", "professional profile", "digital resume", "business card", "profile templates"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "DigiSprint — Premium Professional Digital Profiles",
    description: "Choose a premium digital profile template designed for your profession and personal brand.",
    type: "website",
    url: "/",
    siteName: "DigiSprint",
  },
  twitter: {
    card: "summary_large_image",
    title: "DigiSprint — Premium Professional Digital Profiles",
    description: "Launch a professionally designed digital profile in minutes with DigiSprint.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
