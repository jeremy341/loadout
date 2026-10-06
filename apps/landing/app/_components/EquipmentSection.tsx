import { LoadoutIcon } from "./icons/LoadoutIcon";
import { shopCategories } from "../site-content";

export function EquipmentSection() {
  return (
    <div className="prize-details" id="gear">
      <section className="field-pricing" id="field-pricing" aria-labelledby="field-pricing-title">
        <div className="subsection-heading">
          <span className="section-eyebrow">Pricing</span>
          <h3 id="field-pricing-title">How levels affect prize prices and access</h3>
          <p>Bolts are global currency for prizes. You can buy most prizes with Bolts even when they belong to another track; a level in the prize’s related track can lower its price. Normal savings caps limit discounts on expensive prizes, and some specialist prizes require a related level.</p>
        </div>
      </section>

      <section className="requisition-section" id="requisitions" aria-labelledby="requisitions-title">
        <div className="requisition-copy">
          <span className="section-eyebrow">Field Requisitions</span>
          <h3 id="requisitions-title">Use more of a discount you earned</h3>
          <p>A matching Field Requisition raises the savings cap for one eligible order, letting more of the discount you earned count. You still pay the remaining price in Bolts.</p>
          <p className="savings-example"><strong>Example:</strong> Your Compute level earns a discount on a GPU. A Compute Requisition lets more of that discount apply to the order.</p>
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
          <p>Request specific technical equipment outside the regular shop. The team reviews the request and provides a quote before you decide whether to spend Bolts.</p>
        </div>
        <ol className="order-steps">
          <li>Describe the equipment you need and how it would help your project.</li>
          <li>The team checks project fit, your related track level and Bolt balance, the budget, and your region.</li>
          <li>If approved, you receive a quote naming the item and Bolt price. You decide whether to accept; an eligible quote may allow one matching Field Requisition.</li>
        </ol>
        <p className="order-limit">Requests are not open yet. The team must approve fulfillment before an order goes ahead.</p>
      </section>
    </div>
  );
}
