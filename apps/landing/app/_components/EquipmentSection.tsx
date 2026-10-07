import { LoadoutIcon } from "./icons/LoadoutIcon";
import { shopCategories } from "../site-content";

export function EquipmentSection() {
  return (
    <div className="prize-details" id="gear">
      <section className="reward-rules" id="field-pricing" aria-labelledby="field-pricing-title">
        <div className="subsection-heading">
          <span className="section-eyebrow">Rewards system</span>
          <h3 id="field-pricing-title">How rewards work</h3>
          <p>Use Bolts to get equipment. Build track levels to unlock better prices, then use a Field Requisition to stretch an eligible discount further.</p>
        </div>
        <div className="reward-rule-grid">
          <article className="reward-rule">
            <LoadoutIcon name="bolt" className="reward-rule-icon" />
            <span className="reward-rule-kicker">CURRENCY</span>
            <h4>Bolts</h4>
            <p>Spend global currency on most prizes across tracks.</p>
          </article>
          <article className="reward-rule">
            <LoadoutIcon name="star" className="reward-rule-icon" />
            <span className="reward-rule-kicker">PROGRESSION</span>
            <h4>Track levels</h4>
            <p>A related level can lower a prize price or unlock some Mastery items.</p>
          </article>
          <article className="reward-rule" id="requisitions">
            <LoadoutIcon name="requisition-i" className="reward-rule-icon" />
            <span className="reward-rule-kicker">ONE-USE BOOST</span>
            <h4>Field Requisition</h4>
            <p>Use one on an eligible prize to apply an extra track discount.</p>
          </article>
        </div>
        <p className="reward-rule-note">Requisitions do not add Bolts, remove level requirements, or apply to Custom Orders.</p>
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
          <p>Reach the relevant track tier, describe what you need, and receive a custom Bolt quote for equipment outside the planned prize catalog.</p>
        </div>
        <ol className="order-steps">
          <li><h4>Reach a track tier</h4><p>Ship reviewed work and earn enough Track XP in the relevant field.</p></li>
          <li><h4>Submit a request</h4><p>Explain what you need, how it supports your work, and which track it belongs to.</p></li>
          <li><h4>Review the quote</h4><p>The team checks fit, funding, and delivery, then gives you a final Bolt quote to accept or decline.</p></li>
        </ol>
        <div className="custom-order-rules" aria-label="Custom Order rules">
          <span>REQUIRES TRACK LEVEL</span>
          <span>CUSTOM QUOTE</span>
          <span>ACCEPT OR DECLINE</span>
        </div>
        <p className="custom-order-note"><strong>Custom Order requests are not open yet.</strong> A matching Field Requisition may apply an extra discount to an eligible quote. It does not replace the required track level.</p>
      </section>
    </div>
  );
}
