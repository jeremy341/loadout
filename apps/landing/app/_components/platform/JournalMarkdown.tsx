import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { safeLinkUrl } from "@/lib/platform/journal-markdown";

// A journal entry body as safe Markdown (owner, 16 Nov 2026: Markdown like Stasis). Raw HTML is never run: react-markdown without
// rehype-raw turns an HTML tag into plain text, so "<b>x</b>" shows as typed. Only the small subset below renders (paragraphs,
// bold, italics, strikethrough, links, lists, quotes, code, headings, rules and https images); anything else falls back to its text.
// Links open in a new tab and only https, http and mailto addresses become links. Images are https only and load lazily with no
// referrer. Headings are shifted down so an entry never adds a second page-level heading.
const ALLOWED = [
  "p", "br", "strong", "em", "del", "a", "ul", "ol", "li", "blockquote", "code", "pre", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "img",
];

export function JournalMarkdown({ source, className = "pf-md" }: Readonly<{ source: string; className?: string }>) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        allowedElements={ALLOWED}
        unwrapDisallowed
        urlTransform={(url, key) => safeLinkUrl(url, key === "src" ? "image" : "link")}
        components={{
          a: ({ href, children }) =>
            href ? (
              <a href={href} target="_blank" rel="noopener noreferrer nofollow">
                {children}
              </a>
            ) : (
              <>{children}</>
            ),
          img: ({ src, alt }) =>
            typeof src === "string" && src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt ?? ""} loading="lazy" referrerPolicy="no-referrer" />
            ) : null,
          h1: ({ children }) => <h4>{children}</h4>,
          h2: ({ children }) => <h4>{children}</h4>,
          h3: ({ children }) => <h5>{children}</h5>,
          h4: ({ children }) => <h5>{children}</h5>,
          h5: ({ children }) => <h6>{children}</h6>,
          pre: ({ children }) => <pre tabIndex={0}>{children}</pre>,
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
