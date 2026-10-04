import { LoadoutIcon } from "./icons/LoadoutIcon";
import { siteConfig } from "../site-config";

export function SiteFooter() {
  return <footer className="site-footer" id="community"><div className="footer-inner">
    <div className="footer-intro"><a className="brand" href="#top"><LoadoutIcon name="brand" /><span>LOADOUT</span></a><p>Build things that make builders more capable. Grow your Digital Loadout. Upgrade your Physical Loadout.</p><span className="footer-status">A technical YSWS concept in development.</span></div>
    <div className="footer-column"><h3>LOADOUT</h3><a href="#about">About</a><a href="#tracks">Tracks</a><a href="#progression">Progression</a><a href="#faq">FAQ</a><a href="#shop">Rewards</a></div>
    <div className="footer-column"><h3>Resources</h3><a href="#project-fit">Project fit</a><a href="#process">How it works</a><a href="#research">Research Mode</a><a href="https://hackclub.com/conduct/">Code of Conduct</a></div>
    <div className="footer-column"><h3>Community</h3><a href={siteConfig.githubUrl}>LOADOUT on GitHub</a>{siteConfig.communityUrl && <a href={siteConfig.communityUrl}>LOADOUT community</a>}<a href="https://hackclub.com/slack/">Hack Club Slack</a></div>
    <div className="footer-column"><h3>Hack Club</h3><a href="https://hackclub.com/">Hack Club</a><a href="https://hackclub.com/philosophy/">Philosophy</a><a href="https://hackclub.com/ysws/">You Ship, We Ship</a></div>
  </div><div className="footer-bottom"><span className="language"><LoadoutIcon name="globe" /> English</span><span>Build your own technical stack.</span><span className="slashes" aria-hidden="true" /></div></footer>;
}
