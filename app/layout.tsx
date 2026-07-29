import type { Metadata } from "next";
import { ThemeProvider } from "../components/theme/ThemeProvider";
import "./globals.css";


const themeBootScript = `(function(){try{var k="digisprint-theme-v1",s=localStorage.getItem(k),t=s?JSON.parse(s):null,a=t&&t.appearance?t.appearance:(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"),p=t&&t.preset?t.preset:"indigo",c=t&&t.customColor?t.customColor:"#6366F1",m={indigo:"#6366F1",blue:"#2563EB",cyan:"#0891B2",emerald:"#059669",violet:"#7C3AED",rose:"#E11D48",amber:"#D97706",slate:"#475569"},x=p==="custom"?c:(m[p]||m.indigo),n=x.replace("#",""),r=parseInt(n.slice(0,2),16),g=parseInt(n.slice(2,4),16),b=parseInt(n.slice(4,6),16),d=function(v){return Math.round(v*.88)},h=function(v){return Math.max(0,Math.min(255,v)).toString(16).padStart(2,"0")},hover="#"+h(d(r))+h(d(g))+h(d(b)),lum=(.2126*r+.7152*g+.0722*b)/255,root=document.documentElement;root.dataset.appearance=a;root.dataset.accent=p;root.style.colorScheme=a==="light"?"light":"dark";root.style.setProperty("--color-accent",x);root.style.setProperty("--color-accent-hover",hover);root.style.setProperty("--color-accent-soft","rgba("+r+","+g+","+b+","+(a==="light"?".10":".14")+")");root.style.setProperty("--color-accent-border","rgba("+r+","+g+","+b+","+(a==="light"?".32":".42")+")");root.style.setProperty("--color-accent-text",a==="light"?hover:x);root.style.setProperty("--color-accent-focus","rgba("+r+","+g+","+b+",.42)");root.style.setProperty("--color-accent-contrast",lum>.58?"#09090B":"#FFFFFF")}catch(e){document.documentElement.dataset.appearance="dark"}})();`;
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
