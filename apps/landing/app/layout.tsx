import type { Metadata } from "next";
import localFont from "next/font/local";
import { DotGothic16, JetBrains_Mono } from "next/font/google";
import "./loadout.css";
import "./home.css";
import "./docs.css";
import { SmoothScroll } from "./_components/SmoothScroll";
import { siteConfig } from "./site-config";

const display = localFont({ src: "../public/fonts/Jersey10-Regular.ttf", variable: "--font-display", display: "swap" });
const pixel = localFont({ src: "../public/fonts/PixelifySans.ttf", variable: "--font-pixel", weight: "400 700", display: "swap" });
const mono = localFont({ src: [
  { path: "../public/fonts/IBMPlexMono-Regular.ttf", weight: "400" },
  { path: "../public/fonts/IBMPlexMono-SemiBold.ttf", weight: "600" },
], variable: "--font-ui", display: "swap" });
const dot = DotGothic16({ subsets: ["latin"], weight: "400", variable: "--font-dot", display: "swap" });
const artMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-art", display: "swap" });

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  metadataBase: siteConfig.origin ? new URL(siteConfig.origin) : undefined,
  alternates: siteConfig.origin ? { canonical: "/" } : undefined,
  robots: { index: siteConfig.allowIndexing, follow: siteConfig.allowIndexing },
  openGraph: { title: siteConfig.title, description: siteConfig.description, type: "website", locale: "en_US", siteName: "LOADOUT" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${display.variable} ${pixel.variable} ${mono.variable} ${dot.variable} ${artMono.variable}`}>
    <body><SmoothScroll>{children}</SmoothScroll></body>
  </html>;
}
