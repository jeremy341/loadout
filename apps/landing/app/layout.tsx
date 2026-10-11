import type { Metadata } from "next";
import localFont from "next/font/local";
import "./loadout.css";
import "./homepage-refinement.css";
import "./docs.css";
import "./behind-loadout.css";
import "./redesign-foundation.css";
import "./redesign-themes.css";
import { SmoothScroll } from "./_components/SmoothScroll";
import { siteConfig } from "./site-config";

const display = localFont({ src: "../public/fonts/Jersey10-Regular.ttf", variable: "--font-display", display: "swap" });
const pixel = localFont({ src: "../public/fonts/PixelifySans.ttf", variable: "--font-pixel", weight: "400 700", display: "swap" });
const mono = localFont({ src: [
  { path: "../public/fonts/IBMPlexMono-Regular.ttf", weight: "400" },
  { path: "../public/fonts/IBMPlexMono-SemiBold.ttf", weight: "600" },
], variable: "--font-ui", display: "swap" });
const condensed = localFont({ src: [
  { path: "../public/fonts/BarlowCondensed-Medium.woff2", weight: "500" },
  { path: "../public/fonts/BarlowCondensed-SemiBold.woff2", weight: "600" },
  { path: "../public/fonts/BarlowCondensed-Bold.woff2", weight: "700" },
], variable: "--font-condensed", display: "swap" });
const technical = localFont({ src: "../public/fonts/JetBrainsMono-Latin.woff2", variable: "--font-technical", weight: "100 800", display: "swap" });

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  metadataBase: siteConfig.origin ? new URL(siteConfig.origin) : undefined,
  alternates: siteConfig.origin ? { canonical: "/" } : undefined,
  robots: { index: siteConfig.allowIndexing, follow: siteConfig.allowIndexing },
  openGraph: { title: siteConfig.title, description: siteConfig.description, type: "website", locale: "en_US", siteName: "LOADOUT" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${display.variable} ${pixel.variable} ${mono.variable} ${condensed.variable} ${technical.variable}`}>
    <body><SmoothScroll>{children}</SmoothScroll></body>
  </html>;
}
