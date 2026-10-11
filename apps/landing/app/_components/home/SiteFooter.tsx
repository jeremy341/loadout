import Link from "next/link";
import { siteConfig } from "../../site-config";
import { FooterWordmark } from "./FooterWordmark";
import { Logo } from "./Logo";

// Footer laid out like main's SiteFooter: full-width footer, intro, a three-column link
// grid, then a bottom bar. The redesign's hexagon mark, drawing sheet and stamp are kept
// inside the footer, placed in the empty top-right corner so the footer's height is unchanged.
// Sizes and spacing live in home.css.
export function SiteFooter() {
  return (
    <footer className="ft" id="community">
      <div className="ft-inner">
        <div className="ft-intro">
          <a className="ft-brand" href="#top">
            <Logo />
          </a>
          <p>
            Build a useful tool, improve a system, or make a device. Ship the work, document what you learned, and use rewards to support the next build.
          </p>
          <p className="ft-status">
            A technical builder program in development, shaped by Hack Club’s You Ship, We Ship model.
          </p>
        </div>
        <div className="ft-links">
          <div className="ft-column">
            <h3>LOADOUT</h3>
            <a href="#tracks">Tracks</a>
            <a href="#process">How it works</a>
            <a href="#progression">Progress &amp; Prizes</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="ft-column">
            <h3>Community</h3>
            <a href="#eras">Community Eras</a>
            <a href="#behind-loadout">Who’s behind LOADOUT?</a>
            <a href={siteConfig.githubUrl}>LOADOUT on GitHub</a>
            {siteConfig.communityUrl && <a href={siteConfig.communityUrl}>LOADOUT community</a>}
            <a href="https://hackclub.com/slack/">Hack Club Slack</a>
          </div>
          <div className="ft-column">
            <h3>Resources</h3>
            <Link href="/docs">LOADOUT docs</Link>
            <a href="#project-fit">Project fit</a>
            <a href="#research">Research Mode</a>
            <a href="#requisitions">Field Requisitions</a>
            <a href="#custom-orders">Custom Orders</a>
            <a href="https://hackclub.com/conduct/">Code of Conduct</a>
            <a href="https://hackclub.com/philosophy/">Hack Club philosophy</a>
          </div>
        </div>
        <dl className="ft-sheet">
          <div className="ft-sheet-wide">
            <dt>Project</dt>
            <dd>LOADOUT, Revier edition</dd>
          </div>
          <div>
            <dt>Sheet</dt>
            <dd>001 / 001</dd>
          </div>
          <div>
            <dt>Rev</dt>
            <dd>A</dd>
          </div>
          <div>
            <dt>Year</dt>
            <dd>{new Date().getFullYear()}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>In development</dd>
          </div>
        </dl>
        <FooterWordmark />
        <div className="stp s2" aria-hidden="true">
          <b>Geprüft</b>
          <small>★ Revier ★</small>
        </div>
      </div>
      <div className="ft-bottom">
        <span>
          Landing-page base adapted from{" "}
          <a href="https://github.com/hackclub/pixl" target="_blank" rel="noreferrer">Pixl</a> under the MIT License.
        </span>
        <span>
          Have an idea for the program?{" "}
          <a href={siteConfig.githubUrl}>Open an issue on GitHub</a>.
        </span>
      </div>
    </footer>
  );
}
