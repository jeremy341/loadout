// Safe Markdown subset for rendering player journals in the dashboard. Mirrors
// the game's web renderer (web/pixl.js): restricts URLs to http(s), supports
// headings, bold/italic/strike, inline + fenced code, links, images, lists,
// blockquotes and rules. Returns an HTML string for dangerouslySetInnerHTML,
// never trust the input, so everything is escaped.
//
// Inline text is tokenised on the RAW text: code spans, images and links are pulled out and replaced by placeholders first (their
// URLs are checked on the raw string and every part is escaped when its tag is built), then emphasis runs on what is left, then the
// placeholders go back. So `*` or `_` inside a URL or a code span is never read as emphasis, and the page's markup is never built
// from text that was escaped halfway.
//
// Pictures: a participant's own upload (/api/journal-media/<id>) or an https image on the shop/CDN allowlist. Any other image
// (a tracker pixel, an arbitrary host) is shown as a plain link, or as its alt text when the address is not a web link at all. Every
// picture and link carries no-referrer, and links open with noopener.
import { isAllowedImageSrc, isSafeUrl } from "./safeUrl";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

// A web link a reader may click: absolute http(s) only (a markdown link is never an app path or a scheme).
function isWebLink(u: string): boolean {
  return /^https?:\/\//i.test(u) && isSafeUrl(u);
}

function anchor(url: string, innerHtml: string): string {
  return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">${innerHtml}</a>`;
}

const SLOT = "\u0000";

function emphasis(escaped: string): string {
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, "$1<em>$2</em>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>");
}

function inline(rawInput: string): string {
  const raw = rawInput.replace(/\u0000/g, "");
  const slots: string[] = [];
  const stash = (html: string): string => {
    slots.push(html);
    return `${SLOT}${slots.length - 1}${SLOT}`;
  };

  const tokenised = raw
    .replace(/`([^`]+)`/g, (_m, code: string) => stash(`<code>${esc(code)}</code>`))
    .replace(/!\[([^\[\]]*)\]\(([^)\s]+)\)/g, (_m, alt: string, url: string) => {
      if (isAllowedImageSrc(url)) {
        return stash(`<img class="md-img" src="${esc(url)}" alt="${esc(alt)}" loading="lazy" referrerpolicy="no-referrer" />`);
      }
      if (isWebLink(url)) return stash(anchor(url, esc(alt || url)));
      return stash(esc(alt));
    })
    .replace(/\[([^\[\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, url: string) =>
      isWebLink(url) ? stash(anchor(url, emphasis(esc(text)))) : stash(emphasis(esc(text))),
    );

  let html = emphasis(esc(tokenised));
  // A placeholder can sit inside another one (a picture inside a link), so restore until none is left.
  for (let guard = 0; guard < 8 && html.includes(SLOT); guard++) {
    html = html.replace(/\u0000(\d+)\u0000/g, (_m, n: string) => slots[Number(n)] ?? "");
  }
  return html.replace(/\u0000/g, "");
}

export function renderMarkdown(src: string | null | undefined): string {
  const lines = String(src ?? "").split(/\r?\n/);
  let html = "";
  let list: "ul" | "ol" | null = null;
  const closeList = () => {
    if (list) { html += `</${list}>`; list = null; }
  };
  for (let i = 0; i < lines.length; ) {
    const line = lines[i];
    if (/^```/.test(line)) {
      closeList();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      html += `<pre class="md-pre"><code>${esc(buf.join("\n"))}</code></pre>`;
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { closeList(); html += `<h${h[1].length} class="md-h">${inline(h[2])}</h${h[1].length}>`; i++; continue; }
    if (/^\s*([-*_])\1\1+\s*$/.test(line)) { closeList(); html += `<hr class="md-hr" />`; i++; continue; }
    if (/^>\s?/.test(line)) {
      closeList();
      const q: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ""));
      html += `<blockquote class="md-quote">${inline(q.join(" "))}</blockquote>`;
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      if (list !== "ul") { closeList(); html += `<ul class="md-list">`; list = "ul"; }
      html += `<li>${inline(line.replace(/^\s*[-*+]\s+/, ""))}</li>`; i++; continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (list !== "ol") { closeList(); html += `<ol class="md-list">`; list = "ol"; }
      html += `<li>${inline(line.replace(/^\s*\d+\.\s+/, ""))}</li>`; i++; continue;
    }
    if (/^\s*$/.test(line)) { closeList(); i++; continue; }
    closeList();
    const para = [line];
    i++;
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^(#{1,6}\s|```|>\s?|\s*[-*+]\s+|\s*\d+\.\s+)/.test(lines[i]) &&
      !/^\s*([-*_])\1\1+\s*$/.test(lines[i])
    ) para.push(lines[i++]);
    html += `<p class="md-p">${para.map(inline).join("<br/>")}</p>`;
  }
  closeList();
  return html;
}
