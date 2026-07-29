import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://digisprint.app"),
  title: {
    default: "DigiSprint — Move ideas into motion",
    template: "%s | DigiSprint",
  },
  description:
    "A focused sprint workspace for small teams to plan clearly, move quickly, and ship work that matters.",
  keywords: ["project planning", "team collaboration", "sprint planning", "productivity"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "DigiSprint — Move ideas into motion",
    description: "Plan the work. Find your focus. Make meaningful progress.",
    type: "website",
    url: "/",
    siteName: "DigiSprint",
  },
  twitter: {
    card: "summary_large_image",
    title: "DigiSprint — Move ideas into motion",
    description: "A calmer, clearer way for small teams to ship.",
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
