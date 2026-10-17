import { FaqAnswer } from "./FaqAnswer";

// One question per native details element: it opens and closes with the keyboard and without scripts, so nothing else
// needs a second copy of the answers. The height eases open where the browser supports it (see home.css).
export function FaqAccordion({ items, helpUrl }: { items: readonly { question: string; answer: string }[]; helpUrl: string }) {
  return (
    <div className="fq2-list">
      {items.map((item) => (
        <details className="fq2" key={item.question}>
          <summary className="fq2-q">
            <span>{item.question}</span>
            <span className="fq2-icon" aria-hidden="true" />
          </summary>
          <div className="fq2-a">
            <p><FaqAnswer answer={item.answer} helpUrl={helpUrl} /></p>
          </div>
        </details>
      ))}
    </div>
  );
}
