import { LoadoutIcon } from "./icons/LoadoutIcon";
import { siteConfig } from "../site-config";
import Link from "next/link";

export function SiteFooter() {
  return <footer className="site-footer" id="community"><div className="footer-inner">
    <div className="footer-intro"><a className="brand" href="#top"><LoadoutIcon name="brand" /><span>LOADOUT</span></a><p>Build a useful tool, improve a system, or make a device. Ship the work, document what you learned, and use rewards to support the next build.</p><p className="footer-status">A technical builder program in development, shaped by Hack Club&apos;s You Ship, We Ship model.</p></div>
    <div className="footer-links-grid">
      <div className="footer-column"><h3>LOADOUT</h3><a href="#tracks">Tracks</a><a href="#process">How it works</a><a href="#progression">Progress & Prizes</a><a href="#faq">FAQ</a></div>
      <div className="footer-column"><h3>Community</h3><a href="#eras">Community Eras</a><a href="#behind-loadout">Who&apos;s behind LOADOUT?</a><a href={siteConfig.githubUrl}>LOADOUT on GitHub</a>{siteConfig.communityUrl && <a href={siteConfig.communityUrl}>LOADOUT community</a>}<a href="https://hackclub.com/slack/">Hack Club Slack</a></div>
      <div className="footer-column"><h3>Resources</h3><Link href="/docs">LOADOUT docs</Link><a href="#project-fit">Project fit</a><a href="#research">Research Mode</a><a href="#requisitions">Field Requisitions</a><a href="#custom-orders">Custom Orders</a><a href="https://hackclub.com/conduct/">Code of Conduct</a><a href="https://hackclub.com/philosophy/">Hack Club philosophy</a></div>
    </div>
  </div><div className="footer-bottom"><span>Landing-page base adapted from <a className="pixl-attribution" href="https://github.com/hackclub/pixl" target="_blank" rel="noreferrer">Pixl</a> under the MIT License.</span><span>Have an idea for the program? <a href={siteConfig.githubUrl}>Open an issue on GitHub</a>.</span></div></footer>;
}
