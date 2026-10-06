import { LoadoutIcon } from "./icons/LoadoutIcon";
import { shopCategories } from "../site-content";

export function EquipmentSection() {
  return (
    <div className="prize-details" id="gear">
      <section className="field-pricing" id="field-pricing" aria-labelledby="field-pricing-title">
        <div className="subsection-heading">
          <span className="section-eyebrow">Pricing</span>
          <h3 id="field-pricing-title">How levels affect prize prices and access</h3>
          <p>Bolts are global currency. You can buy most prizes across tracks, and a relevant track level can lower the price. Only a small set of Mastery prizes require a related level. On expensive prizes, a savings cap can limit how much of your normal track discount applies.</p>
        </div>
      </section>

      <section className="requisition-section" id="requisitions" aria-labelledby="requisitions-title">
        <div className="requisition-copy">
          <span className="section-eyebrow">Field Requisitions</span>
          <h3 id="requisitions-title">Save more on one eligible prize</h3>
          <p>Your relevant track level earns an ordinary discount. On some expensive prizes, a cap limits how many Bolts that discount can save. A matching Field Requisition raises the cap on one eligible order so more of the same earned discount can apply. You keep your earned discount rate and pay the remaining price in Bolts.</p>
          <p className="savings-example"><strong>Example:</strong> Your Compute level gives a discount on an eligible GPU prize. Its normal savings cap can prevent you using all of it. A matching Requisition lets you apply a larger share; the quote shows the extra saving before you confirm.</p>
        </div>
        <div className="requisition-rules-block">
          <h4>Use rules</h4>
          <ul className="requisition-rules">
            <li>Requisition II and Master have higher savings limits than Requisition I.</li>
            <li>Each Requisition can be used once, never expires, and cannot be transferred.</li>
            <li>Use at most one on an order. The item must meet its minimum value.</li>
            <li>A Requisition cannot remove a level requirement for specialist prizes or a Custom Order.</li>
          </ul>
          <p className="order-limit">See the progression rail for when Requisitions are earned. Savings caps and minimum item values have not been set for launch.</p>
        </div>
      </section>

      <section className="shop-section gear-shop" id="shop" aria-labelledby="shop-title">
        <div className="subsection-heading">
          <span className="section-eyebrow">Planned catalog</span>
          <h3 id="shop-title">Planned prizes</h3>
          <p>Planned prizes may include developer hardware, boards, compute, tools, storage, fabrication, domains, and custom equipment. None are currently available to order.</p>
        </div>
        <div className="shop-grid">
          {shopCategories.map((category) => (
            <article className="shop-card" key={category.title}>
              <span className="shop-icon" aria-hidden="true"><LoadoutIcon name={category.icon} /></span>
              <h4>{category.title}</h4>
              <span className="shop-status">Planned prize</span>
            </article>
          ))}
        </div>
      </section>

      <section className="custom-orders" id="custom-orders" aria-labelledby="custom-orders-title">
        <div className="subsection-heading">
          <span className="section-eyebrow">Custom Orders</span>
          <h3 id="custom-orders-title">Ask for equipment outside the regular shop</h3>
          <p>Ship projects and have their work reviewed to build Track XP. Once you reach a relevant request tier, you can ask for equipment outside the planned prize catalog.</p>
        </div>
        <ol className="order-steps">
          <li><h4>Ship and reach a track tier</h4><p>Track your work, keep a journal, and ship your project. Only work and hours approved during review earn Track XP toward a request tier.</p></li>
          <li><h4>Request and get a quote</h4><p>Describe the equipment and how it would help. The team checks your track level, whether the item fits LOADOUT, and whether it can be funded and delivered in your country. Then you receive a final Bolt quote.</p></li>
          <li><h4>Accept the approved quote</h4><p>If you have enough Bolts, accept the quote to go ahead or decline it. A matching Requisition can lower an eligible quote; it does not waive the track-level requirement.</p></li>
        </ol>
        <div className="order-tiers">
          <h4>Planned request tiers</h4>
          <dl>
            <div><dt>Field</dt><dd>LV.4</dd></div>
            <div><dt>Power</dt><dd>LV.8</dd></div>
            <div><dt>Root</dt><dd>LV.12</dd></div>
            <div><dt>Bare Metal</dt><dd>LV.15</dd></div>
          </dl>
          <p>Requested items may carry further relevant-track requirements.</p>
        </div>
        <p className="order-limit"><strong>Planned feature.</strong> Custom Order requests are not open yet.</p>
      </section>
    </div>
  );
}
