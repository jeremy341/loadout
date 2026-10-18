import type { Metadata } from "next";
import Link from "next/link";
import { AccessibilitySettings, AccessibilityTab } from "../_components/Accessibility";
import { SiteNav } from "../_components/home/SiteNav";
import { NoiseGrain } from "../_components/NoiseGrain";
import { LOADOUT_HELP_URL, siteConfig } from "../site-config";

export const metadata: Metadata = {
  title: "Accessibility | LOADOUT",
  description: "LOADOUT display preferences, accessibility support and review status.",
};

export default function AccessibilityPage() {
  return (
    <div className="home a11y-home" id="top">
      <NoiseGrain />
      <a className="skip-link" href="#main">Skip to content</a>
      <AccessibilityTab />
      <div className="in">
        <SiteNav anchorBase="/" />
        <main className="a11y-page" id="main">
          <div className="a11y-page-intro">
            <Link className="a11y-back" href="/">← Back to LOADOUT</Link>
            <p className="a11y-kicker">LOADOUT / FIELD SETTINGS</p>
            <h1>Accessibility</h1>
            <p>Adjust the display to suit you. You can change these settings from any page using the Accessibility tab.</p>
          </div>
          <AccessibilitySettings />
          <aside className="a11y-help" aria-labelledby="a11y-help-title">
            <h2 id="a11y-help-title">Using these settings</h2>
            <p>Your choices save automatically in this browser. Closing the panel keeps your changes.</p>
            <p>You can still use browser zoom, keyboard navigation and your device&apos;s accessibility tools.</p>
            <a href={LOADOUT_HELP_URL}>Report an accessibility problem</a>
          </aside>
          <noscript><p>Saving these display choices needs JavaScript. You can still use your browser or device settings to change zoom, colors and reduced motion.</p></noscript>
          <section className="a11y-statement" aria-labelledby="a11y-statement-title">
            <h2 id="a11y-statement-title">Accessibility statement</h2>
            <p>We aim to make LOADOUT usable with keyboard navigation, readable contrast, text resizing and reduced motion. This work is ongoing; we do not claim conformance or certification.</p>
            <p>Screen-reader review and testing on physical devices are still outstanding. If you encounter a barrier, contact <a href={LOADOUT_HELP_URL}>#loadout-help</a> or <a href={siteConfig.githubUrl}>open a GitHub issue</a>.</p>
          </section>
        </main>
      </div>
    </div>
  );
}
