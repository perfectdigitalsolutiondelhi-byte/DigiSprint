import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://digisprint.vercel.app"),
  title: {
    default: "DigiSprint | Your Professional Digital Profile",
    template: "%s | DigiSprint",
  },
  description:
    "Create a polished digital profile for your business in minutes with DigiSprint.",
  keywords: [
    "digital profile",
    "mini website",
    "business website",
    "DigiSprint",
  ],
  openGraph: {
    title: "DigiSprint | Your Professional Digital Profile",
    description:
      "Build a professional digital presence that is ready to share in minutes.",
    type: "website",
    siteName: "DigiSprint",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
