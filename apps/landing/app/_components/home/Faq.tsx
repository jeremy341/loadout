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
        <noscript>
          <style>{".home .fq2-list{display:none}"}</style>
          <div className="faq-noscript">
            <p>FAQ answers are also available here when scripts are disabled.</p>
            <dl>{faqItems.map((item) => <div key={item.question}><dt>{item.question}</dt><dd>{item.answer}</dd></div>)}</dl>
          </div>
        </noscript>
      </div>
    </>
  );
}
