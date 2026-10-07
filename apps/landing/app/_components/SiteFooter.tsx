import { LoadoutIcon } from "./icons/LoadoutIcon";
import { siteConfig } from "../site-config";

export function SiteFooter() {
  return <footer className="site-footer" id="community"><div className="footer-inner">
    <div className="footer-intro"><a className="brand" href="#top"><LoadoutIcon name="brand" /><span>LOADOUT</span></a><p>Build a useful tool, improve a system, speed up a program, or make a device. Keep accepted projects in your portfolio and use rewards to support your next build.</p><span className="footer-status">LOADOUT is in development.</span></div>
    <div className="footer-column"><h3>LOADOUT</h3><a href="#about">About</a><a href="#tracks">Tracks</a><a href="#progression">Progress &amp; Prizes</a><a href="#eras">Community Eras</a><a href="#shop">Prizes</a><a href="#faq">FAQ</a></div>
    <div className="footer-column"><h3>Resources</h3><a href="#project-fit">Project fit</a><a href="#process">How it works</a><a href="#research">Research Mode</a><a href="#requisitions">Requisitions</a><a href="#custom-orders">Custom Orders</a><a href="https://hackclub.com/conduct/">Code of Conduct</a></div>
    <div className="footer-column"><h3>Community</h3><a href="#behind-loadout">Who&apos;s behind LOADOUT?</a><a href={siteConfig.githubUrl}>LOADOUT on GitHub</a>{siteConfig.communityUrl && <a href={siteConfig.communityUrl}>LOADOUT community</a>}<a href="https://hackclub.com/slack/">Hack Club Slack</a></div>
    <div className="footer-column"><h3>Hack Club</h3><a href="https://hackclub.com/">Hack Club</a><a href="https://hackclub.com/philosophy/">Philosophy</a><a href="https://hackclub.com/ysws/">You Ship, We Ship</a></div>
  </div><div className="footer-bottom"><span className="language"><LoadoutIcon name="globe" /> English</span><span>Build your own technical stack.</span><span className="footer-attribution">Landing-page base adapted from <a href="https://github.com/hackclub/pixl" target="_blank" rel="noreferrer">Pixl</a> under the MIT License.</span><span className="slashes" aria-hidden="true" /></div></footer>;
}
