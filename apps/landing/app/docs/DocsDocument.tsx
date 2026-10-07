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
          <p className="doc-kicker">LOADOUT // BUILDER GUIDE</p>
          <h1>{page.label}</h1>
          <p className="lead">{page.description}</p>
          <span className="docs-status">In development · Draft reference</span>
        </header>
        <DocsInlineToc headings={page.headings} />
        <div className="doc-content">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkDocsHeadings]} skipHtml>{page.body}</ReactMarkdown>
        </div>
        <nav className="doc-foot" aria-label="Documentation navigation">
          {previous ? <Link href={`/docs/${previous.slug}`}><span>PREVIOUS</span><b>{previous.label}</b></Link> : <span />}
          {next ? <Link className="next" href={`/docs/${next.slug}`}><span>NEXT</span><b>{next.label}</b></Link> : <Link className="next" href="/"><span>FINISH</span><b>Return to LOADOUT</b></Link>}
        </nav>
        <div className="doc-sign">LOADOUT // BUILD YOUR OWN TECHNICAL STACK</div>
      </article>
    </main>
    <DocsToc headings={page.headings} />
  </>;
}
