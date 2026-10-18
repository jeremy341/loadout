import type { Metadata } from "next";
import Link from "next/link";
import { AccessibilitySettings } from "../_components/Accessibility";
import { SiteNav } from "../_components/home/SiteNav";
import { SiteFooter } from "../_components/home/SiteFooter";
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
      <div className="in">
        <SiteNav anchorBase="/" />
        <main className="a11y-page" id="main">
          <header className="a11y-page-intro">
            <div>
              <p className="a11y-kicker">LOADOUT / FIELD SETTINGS</p>
              <h1>Accessibility</h1>
            </div>
            <Link className="btn pri a11y-back" href="/">← Back to LOADOUT</Link>
            <p className="a11y-page-description">Choose how LOADOUT looks and moves.</p>
          </header>
          <div className="a11y-sheet"><AccessibilitySettings layout="page" /></div>
          <aside className="a11y-help" aria-label="Accessibility help">
            <p>Browser zoom and your device&apos;s accessibility tools still work.</p>
            <a href={LOADOUT_HELP_URL}>Report an accessibility problem</a>
          </aside>
          <noscript><p>Saving these display choices needs JavaScript. You can still use your browser or device settings to change zoom, colors and reduced motion.</p></noscript>
          <details className="a11y-statement">
            <summary>Accessibility statement<span className="a11y-group-mark" aria-hidden="true" /></summary>
            <p>We aim to make LOADOUT usable with keyboard navigation, readable contrast, text resizing and reduced motion. This work is ongoing; we do not claim conformance or certification.</p>
            <p>Screen-reader review and testing on physical devices are still outstanding. If you encounter a barrier, contact <a href={LOADOUT_HELP_URL}>#loadout-help</a> or <a href={siteConfig.githubUrl}>open a GitHub issue</a>.</p>
          </details>
        </main>
      </div>
      <SiteFooter anchorBase="/" />
    </div>
  );
}
