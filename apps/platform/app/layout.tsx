import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { THEME_INIT_SCRIPT } from "../lib/theme";
import "./globals.css";

const display = localFont({ src: "../public/fonts/Jersey10-Regular.ttf", variable: "--font-display", display: "swap" });
const pixel = localFont({ src: "../public/fonts/PixelifySans.ttf", variable: "--font-pixel", weight: "400 700", display: "swap" });
const ui = localFont({
  src: [
    { path: "../public/fonts/IBMPlexMono-Regular.ttf", weight: "400" },
    { path: "../public/fonts/IBMPlexMono-SemiBold.ttf", weight: "600" },
  ],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Platform preview | LOADOUT", template: "%s | LOADOUT" },
  description: "A preview of the LOADOUT participant platform. Nothing here is live yet.",
  // The preview must not be indexed.
  robots: { index: false, follow: false },
};

// viewport-fit=cover lets the dock use the device safe-area insets.
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-display-theme="dark" suppressHydrationWarning className={`${display.variable} ${pixel.variable} ${ui.variable}`}>
      <head>
        {/* Fixed string from lib/theme.ts, no user input: applies the saved theme before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
