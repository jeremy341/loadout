import { RSVP_ENABLED, RSVP_URL } from "./rsvp-url";
import { ART } from "./art";
import { AsciiField } from "./AsciiField";
import { HoverScramble } from "./HoverScramble";
import Link from "next/link";
import { MagneticCorners } from "./MagneticCorners";

// Hero laid out like main's LoadoutHero: badge row, framed headline and copy,
// action row, facts and a cue that starts the descent past the depth markers. The redesign's stamp and depth labels are kept
// (its ASCII drawings are switched off for now). Sizes and spacing live in home.css, not inline.
export function Hero() {
  return (
    <div className="hero">
      <div className="stp s1" aria-hidden="true" lang="de">
        Glück auf
        <small>Zeche · Ruhr</small>
      </div>

      <span className="x x-top" aria-hidden="true">+</span>
      <span className="x x-mid" aria-hidden="true">+</span>
      <span className="x x-low" aria-hidden="true">+</span>

      <AsciiField html={ART["hero-left"]} side="left" top="60%" />
      <AsciiField html={ART["hero-right"]} side="right" top="54%" />

      <div className="m meta meta-left" aria-hidden="true">
        51.4912° N
        <br />
        7.0452° E
        <br />
        Zeche Revier
      </div>
      <div className="m meta meta-right" aria-hidden="true">
        4 tracks
        <br />
        Tools to Hardware
      </div>

      <div className="hero-badge">
        <span className="sl" />
        <span className="tag"><span lang="de">GLÜCK AUF</span> · FOR TEENS 13 TO 19</span>
        <span className="sl sl-flip" />
      </div>

      <div className="hero-frame">
        <span className="frame-corner top-left" aria-hidden="true" />
        <span className="frame-corner top-right" aria-hidden="true" />
        <span className="frame-corner bottom-left" aria-hidden="true" />
        <span className="frame-corner bottom-right" aria-hidden="true" />
        <div className="m hero-side hero-side-left" aria-hidden="true">
          Build
          <br />
          Learn
          <br />
          Ship
          <br />
          Together
        </div>
        <div className="m hero-side hero-side-right" aria-hidden="true">
          Kohle
          <br />
          Stahl
          <br />
          Dampf
          <br />
          Revier
          <br />
          Lohn
        </div>
        <h1 className="h1">
          <span>Build your own</span>
          <span>technical stack.</span>
        </h1>
        <p>
          Build something technical, ship it, and earn Ore for it. Spend the Ore on gear for your next build.
        </p>
      </div>

      <div className="hero-actions">
        <MagneticCorners>
          <a className="btn pri hero-btn" href={RSVP_URL}>
            {RSVP_ENABLED ? "RSVP NOW →" : "EXPLORE TRACKS →"}
          </a>
        </MagneticCorners>
        <MagneticCorners>
          <a className="btn hero-btn" href="#tracks">
            EXPLORE TRACKS
          </a>
        </MagneticCorners>
      </div>

      <p className="hero-credit">
        Organized by <Link href="/docs/team#jerry">Jerry</Link>, <Link href="/docs/team#fazin">Fazin</Link> &amp; <Link href="/docs/team#netic">Netic</Link>. Community by <Link href="/docs/team#kernel">Kernel</Link>
      </p>

      <div className="m hero-facts">
        <span><HoverScramble text="◈ 10 Ore for a solid hour" /></span>
        <span className="hero-sep">|</span>
        <span><HoverScramble text="ϟ Not open yet" /></span>
      </div>

      <div className="m hero-cue">
        Begin the descent
        <span className="hero-cue-arrow" aria-hidden="true">⌄</span>
      </div>
    </div>
  );
}
