# LOADOUT Docs refresh — approved implementation brief

Status: approved by the owner on 2026-10-07. Docs only. The homepage and its assets/Lenis behavior are outside this change.

## Design read
An industrial field manual with an open reading surface, compact directory, and yellow navigation markers. Preserve DESIGN.md tokens and fonts. Pixl's left-aligned article and persistent grouped directory are navigation references; its game rules and theme selector are not adopted. Direction: technical/utilitarian. DFII: impact 4, fit 5, feasibility 4, performance 4, consistency risk 2 = 15 (strong existing-system fit; no new aesthetic).

## Layout and behavior
Desktop >=1280: sidebar 280px, content flexible, TOC 240px. Article width min(1100px,100%), left aligned with 40px desktop padding; paragraphs <=72ch. Existing paper/ink/yellow only. Smaller desktop: hide right rail, show an in-article contents disclosure. Mobile <=820: bounded topic pane up to42dvh, remaining guide pane fills viewport. No body scroll or visible scrollbars. Native internal scrolling and PageUp/PageDown remain; no Lenis on /docs.

H2/H3 anchors use server-generated stable IDs. TOC observes .docs-main scrolling, indicates aria-current=location and active yellow marker, handles last heading at bottom. Anchor clicks update hash and internal scroll; initial hashes and back/forward must work. Keyboard activation and reduced motion scroll immediately. Never steal focus on ordinary scroll. Sidebar groups are remembered in localStorage; active group cannot be hidden. No-JS grouped navigation and article content work.

Search: labeled input, lazy fetch /docs/search-index.json on focus/query, MiniSearch index. Results are real links with title, heading and snippet. Clear results/empty/loading/retry feedback, aria-live count; ArrowDown from input moves into results, Escape clears query. No external service or internal-document indexing.

## Shared implementation contract
Root owns server source, Markdown parsing, content, routes, metadata, and internal docs. UI implementation owns DocsDocument.tsx, docs-shell.tsx, docs.css, DocsToc.tsx, DocsSearch.tsx and e2e/docs.spec.ts only.
docs-data.ts exports DocsItem={slug,label,description,group,order,status:'draft'}, DocsGroup={label,items:DocsItem[]}, DocsHeading={id,text,depth:2|3}, DocsPage=DocsItem & {body:string,headings:DocsHeading[]} and aliases.
DocsShell props {children,groups:DocsGroup[]}. DocsDocument props {page:DocsPage,previous?:DocsItem,next?:DocsItem}. Its server Markdown renderer uses react-markdown + remark-gfm + exported remarkDocsHeadings from docs-markdown.ts; render body with skipHtml. Root getDocs() returns all ordered DocsPage[].
Search endpoint returns {index:MiniSearchSerializedIndex}. search-options.ts exports docsSearchOptions with fields ['title','heading','text'], storeFields ['title','heading','snippet','url'], searchOptions {prefix:true,fuzzy:0.2,combineWith:'AND'}. Results have title/heading/snippet/url.

## Content and states
18 draft reference pages, no tutorials or live-system promises. Current 9 URLs preserved; dedicated tracks/research/tracking/ai-teams/pricing/requisitions/custom-orders replace old aliases. In-development label visible on each page. Empty TOC hidden; invalid route 404. Search fetch error offers retry. localStorage failures degrade to default groups. Existing anchors are retained with explicit Markdown heading IDs where needed.

## Preflight and acceptance
Paper + ruled tables + concise callouts use existing tokens; no cards for every paragraph, added artwork or decorative animation. Contrast uses existing verified ink/canvas 13.45 and muted/canvas5.43. Semantic landmarks, focus indication, 44px targets, native links and disclosures. Hierarchy/consistency/accessibility/state coverage/copy/restraint/motion each targeted 3/4 or better; validate rendered screens before claiming pass. Screenshot1920/1440/390 and zoom200%; tests verify internal scroll, hidden bars, TOC/deep links/back, remembered directory, search and no internal-content exposure.

## Build handoff
Next.js engineering agent implements exactly this spec using the existing bespoke design system. No redesign or homepage changes. Required seven UI skills are consulted; SVG/sprite creation is not relevant here. Root integrates and verifies the whole branch, then existing development/testing/main checks govern publication.
