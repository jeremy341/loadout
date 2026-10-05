import { LoadoutIcon } from "./icons/LoadoutIcon";
import { siteConfig } from "../site-config";
import { heroCopy } from "../site-content";
import { ScrollCue } from "./ScrollCue";

export function LoadoutHero() {
  return <section className="hero" aria-labelledby="hero-title">
    <span className="slashes hero-slashes" aria-hidden="true" />
    <span className="slashes hero-slashes hero-slashes-bottom" aria-hidden="true" />
    <div className="hero-fragments" aria-hidden="true"><span /><span /><span /><span /></div>
    <div className="hero-inner">
      <div className="hero-badge"><span className="slashes" aria-hidden="true" /><span>TECHNICAL BUILDERS</span><span className="slashes" aria-hidden="true" /></div>
      <div className="hero-frame">
        <span className="frame-corner top-left" aria-hidden="true" /><span className="frame-corner top-right" aria-hidden="true" /><span className="frame-corner bottom-left" aria-hidden="true" /><span className="frame-corner bottom-right" aria-hidden="true" />
        <div className="hero-side hero-side-left" aria-hidden="true">IDEAS<br />BUILDERS<br />TOOLS<br />COMMUNITY<br />REWARDS<span>—</span></div>
        <h1 id="hero-title" aria-label={heroCopy.tagline}>{heroCopy.headlineLines.map((line) => <span key={line}>{line}</span>)}</h1>
        <p>{heroCopy.support}</p>
        <div className="hero-side hero-side-right" aria-hidden="true">BUILD<br />LEARN<br />SHIP<br />UPGRADE<span>—</span></div>
      </div>
      <div className="hero-actions"><a className="button button-hero" href={siteConfig.joinUrl ?? "#tracks"}>{siteConfig.joinUrl ? "RSVP now" : "Explore tracks"}<LoadoutIcon name="arrow" /></a><a className="button button-hero button-outline" href={siteConfig.joinUrl ? "#tracks" : "#project-fit"}>{siteConfig.joinUrl ? "Explore tracks" : "What counts?"}</a></div>
      <ul className="hero-facts"><li><LoadoutIcon name="code" />Technical projects</li><li><LoadoutIcon name="layers" />Four tracks</li><li><LoadoutIcon name="bolt" />Build your loadout</li></ul>
    </div>
    <ScrollCue />
  </section>;
}
