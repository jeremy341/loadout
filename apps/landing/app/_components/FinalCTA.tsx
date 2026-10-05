import { siteConfig } from "../site-config";
import { LoadoutIcon } from "./icons/LoadoutIcon";
import Reveal from "./Reveal";

export function FinalCTA() {
  const hasRsvp = Boolean(siteConfig.joinUrl);

  return (
    <Reveal>
      <section className="site-section closing-cta" aria-labelledby="closing-cta-title">
        <div className="closing-cta-panel">
          <span className="closing-cta-mark" aria-hidden="true"><LoadoutIcon name="brand" /></span>
          <div className="closing-cta-copy">
            <span className="section-eyebrow">Next build</span>
            <h2 id="closing-cta-title">Equip your next build.</h2>
            <p>{hasRsvp ? "RSVP through the draft interest form for LOADOUT." : "Explore the four tracks and find a direction for your next project."}</p>
          </div>
          <a className="button" href={siteConfig.joinUrl ?? "#tracks"}>
            {hasRsvp ? "RSVP now" : "Explore tracks"}<LoadoutIcon name="arrow" />
          </a>
        </div>
      </section>
    </Reveal>
  );
}
