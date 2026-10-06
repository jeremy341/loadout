import { LoadoutIcon } from "./icons/LoadoutIcon";

export function DigitalPhysicalLoadout() {
  return (
    <div className="loadout-definitions" aria-label="Digital and Physical Loadout">
      <article>
        <span className="loadout-definition-icon" aria-hidden="true"><LoadoutIcon name="code" /></span>
        <h3>Digital Loadout</h3>
        <p>Your accepted projects and the portfolio you build from them.</p>
      </article>
      <article>
        <span className="loadout-definition-icon" aria-hidden="true"><LoadoutIcon name="box" /></span>
        <h3>Physical Loadout</h3>
        <p>The equipment and tools you use to build your next project.</p>
      </article>
    </div>
  );
}
