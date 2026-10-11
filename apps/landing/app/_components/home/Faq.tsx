import { FaqAccordion } from "./FaqAccordion";
import { faqItems } from "./faq-items";


// FAQ section ported from the LOADOUT redesign reference.
export function Faq() {
  return (
    <>
      <div className="pit">
        <b>
          −800 M
        </b>
        <span>
          3. Sohle
          <br />
          FAQ &amp; docs
        </span>
      </div>
      <div className="sect" id="faq">
        <h2 className="h2">
          Quick
          answers
        </h2>
        <p className="lead">
          Answers about projects, progress, equipment, and what is available today.
        </p>
        <FaqAccordion items={faqItems} />
      </div>
    </>
  );
}
