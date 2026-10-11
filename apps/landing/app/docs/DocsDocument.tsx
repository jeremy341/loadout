import Link from "next/link";
import { faqItems } from "../site-content";
import { docsItems } from "./docs-data";
import { DocToc } from "./DocToc";
import { guides, type GuideSection } from "./guide-content";

function GuideSectionBody({ section }: { section: GuideSection }) {
  return <>
    {section.paragraphs?.map((text) => <p key={text}>{text}</p>)}
    {section.rows && <dl className="doc-ledger">{section.rows.map(([label, detail]) => <div className="doc-ledger-row" key={label}><dt>{label}</dt><dd>{detail}</dd></div>)}</dl>}
    {section.bullets && <ul>{section.bullets.map((text) => <li key={text}>{text}</li>)}</ul>}
    {section.steps && <ol>{section.steps.map((text) => <li key={text}>{text}</li>)}</ol>}
    {section.note && <aside className="callout"><strong>{section.note.title}</strong><p>{section.note.text}</p></aside>}
  </>;
}

export function DocsDocument({ slug }: { slug: string }) {
  const page = docsItems.find((item) => item.slug === slug);
  if (!page) return null;
  const index = docsItems.findIndex((item) => item.slug === slug);
  const previous = docsItems[index - 1];
  const next = docsItems[index + 1];
  const guide = guides[slug];
  const toc = slug === "faq" ? [{ id: "questions", label: "Questions" }] : guide?.sections.map((section) => ({ id: section.id, label: section.title })) ?? [];

  return <>
    <main className="docs-main" id="docs-main" tabIndex={0} aria-label="Documentation content"><article className="doc">
      <header className="doc-header"><span className="eyebrow">{page.group}</span><h1>{page.label}</h1><p className="lead">{guide?.lead ?? "Answers to common questions about projects, progress, and prizes."}</p></header>
      {slug === "faq" ? <section className="doc-section" id="questions"><h2>Questions</h2><div className="docs-faq">{faqItems.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></section>
        : guide?.sections.map((section) => <section className="doc-section" id={section.id} key={section.id}><h2>{section.title}</h2><GuideSectionBody section={section} /></section>)}
      <nav className="doc-foot" aria-label="Documentation navigation">
        {previous ? <Link href={"/docs/" + previous.slug}><span className="dir">Previous</span><span className="ttl">{previous.label}</span></Link> : <span />}
        {next ? <Link className="next" href={"/docs/" + next.slug}><span className="dir">Next</span><span className="ttl">{next.label}</span></Link> : <Link className="next" href="/"><span className="dir">Finish</span><span className="ttl">Return to LOADOUT</span></Link>}
      </nav>
      <div className="doc-sign">Built by the LOADOUT team</div>
    </article></main>
    <aside className="docs-toc"><DocToc items={toc} /></aside>
  </>;
}
