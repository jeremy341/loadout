import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DocsItem, DocsPage } from "./docs-data";
import { remarkDocsHeadings, remarkDocsTables } from "./docs-markdown";
import { DocsInlineToc, DocsToc } from "./DocsToc";
import { AccessibilityLink } from "../_components/Accessibility";
import { DOCS_BACK } from "@/lib/platform/docs-layout";

// `embedded` is true inside the participant platform, where the platform already supplies the one main landmark, so the scrolling
// article is a labelled region instead of a second main, and the last link goes back to projects.
export function DocsDocument({ page, previous, next, embedded = false }: { page: DocsPage; previous?: DocsItem; next?: DocsItem; embedded?: boolean }) {
  const Frame = embedded ? "div" : "main";
  const out = DOCS_BACK[embedded ? "platform" : "public"];
  return <>
    <Frame className="docs-main" id="docs-main" data-lenis-prevent tabIndex={0} aria-label="Documentation content" role={embedded ? "region" : undefined}>
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
            remarkPlugins={[remarkGfm, remarkDocsHeadings, remarkDocsTables]}
            components={{
              pre: ({ children }) => <pre tabIndex={0} role="region" aria-label="Code example">{children}</pre>,
              thead: ({ children }) => <thead role="rowgroup">{children}</thead>,
              tbody: ({ children }) => <tbody role="rowgroup">{children}</tbody>,
            }}
            skipHtml
          >{page.body}</ReactMarkdown>
        </div>
        <p className="doc-sign">Built with Love by the LOADOUT team <span aria-hidden="true">·</span> <AccessibilityLink className="doc-accessibility-link" /></p>
        <nav className="doc-foot" aria-label="Documentation navigation">
          {previous ? <Link href={`/docs/${previous.slug}`}><span>PREVIOUS</span><b>{previous.label}</b></Link> : <span />}
          {next ? <Link className="next" href={`/docs/${next.slug}`}><span>NEXT</span><b>{next.label}</b></Link> : <Link className="next" href={out.href}><span>FINISH</span><b>{embedded ? "Back to projects" : "Return to LOADOUT"}</b></Link>}
        </nav>
      </article>
    </Frame>
    <DocsToc headings={page.headings} />
  </>;
}
