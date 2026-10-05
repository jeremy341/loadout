import { LoadoutIcon } from "./icons/LoadoutIcon";

export function DigitalPhysicalLoadout() {
  return (
    <section className="site-section loadout-relationship" aria-labelledby="loadout-relationship-title">
      <div className="section-heading">
        <span className="section-eyebrow">Your loadout</span>
        <h2 id="loadout-relationship-title">Build it. Equip it.</h2>
        <p>What you ship grows your technical stack. Rewards help equip what you build next.</p>
      </div>
      <div className="loadout-halves">
        <article className="loadout-half loadout-digital">
          <span className="loadout-half-icon" aria-hidden="true"><LoadoutIcon name="code" /></span>
          <div>
            <span className="section-eyebrow">Digital Loadout</span>
            <h3>Keep the artifacts you ship</h3>
            <p>Accepted project artifacts become part of the technical work you can build on and show.</p>
          </div>
        </article>
        <article className="loadout-half loadout-physical">
          <span className="loadout-half-icon" aria-hidden="true"><LoadoutIcon name="box" /></span>
          <div>
            <span className="section-eyebrow">Physical Loadout</span>
            <h3>Equip your next build</h3>
            <p>Rewards are equipment and tools that can support the next, harder project.</p>
          </div>
        </article>
      </div>
      <dl className="loadout-currency">
        <div><dt>Track XP</dt><dd>Non-spendable progress recorded separately in each track.</dd></div>
        <div><dt>Bolts</dt><dd>Global spendable currency, separate from Track XP.</dd></div>
      </dl>
    </section>
  );
}
