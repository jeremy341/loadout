import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DocsItem, DocsPage } from "./docs-data";
import { remarkDocsHeadings } from "./docs-markdown";
import { DocsInlineToc, DocsToc } from "./DocsToc";

export function DocsDocument({ page, previous, next }: { page: DocsPage; previous?: DocsItem; next?: DocsItem }) {
  return <>
    <main className="docs-main" id="docs-main" data-lenis-prevent tabIndex={0} aria-label="Documentation content">
      <article className="doc">
        <header className="doc-header">
          <span className="eyebrow">{page.group}</span>
          <h1>{page.label}</h1>
          <p className="lead">{page.description}</p>
          {page.slug === "start" || page.slug === "eligibility" ? (
            <span className="docs-status">In development</span>
          ) : (
            <Link className="docs-status" href="/docs/eligibility#where-things-stand">Program status →</Link>
          )}
        </header>
        <DocsInlineToc headings={page.headings} />
        <div className="doc-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkDocsHeadings]}
            components={{ pre: ({ children }) => <pre tabIndex={0} role="region" aria-label="Code example">{children}</pre> }}
            skipHtml
          >{page.body}</ReactMarkdown>
        </div>
        <nav className="doc-foot" aria-label="Documentation navigation">
          {previous ? <Link href={`/docs/${previous.slug}`}><span>PREVIOUS</span><b>{previous.label}</b></Link> : <span />}
          {next ? <Link className="next" href={`/docs/${next.slug}`}><span>NEXT</span><b>{next.label}</b></Link> : <Link className="next" href="/"><span>FINISH</span><b>Return to LOADOUT</b></Link>}
        </nav>
        <div className="doc-sign">Built by the LOADOUT team</div>
      </article>
    </main>
    <DocsToc headings={page.headings} />
  </>;
}
