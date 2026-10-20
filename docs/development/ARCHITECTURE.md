# Current application architecture

Implemented public application: Next.js App Router in `apps/landing`. It contains the homepage and program-draft Docs, not live participant, economy, reviewer, order or event services.

## Public Docs

```text
content/docs/*.md
  → validated public catalog + shared Markdown heading IDs
  → static /docs/[slug] pages + grouped navigation
  → static /docs/search-index.json
  → browser-local MiniSearch
```

Frontmatter supplies title/description/group/order/status; filenames supply URL slugs. Server-side file reading never enters client components. ReactMarkdown renders safe Markdown with GFM support and no raw HTML/MDX execution. A shared heading transform powers both article IDs and contents navigation.

The search index contains reviewed public headings/text only. Internal docs, plans, design history and source repositories are not scanned or published.

The Docs layout owns bounded sidebar, article and contents panes. Native scrolling stays inside them; scrollbar chrome is hidden. SmoothScroll detects /docs and disables Lenis. Homepage motion/assets and the Docs tab remain separate.

## Participant platform preview

`apps/platform` is a second Next.js app in the same Bun workspace. It renders the participant shell and every tab as a working preview on labelled sample data held in `localStorage`. It has no sign-in, database, API or deployed origin; links to the landing app are configured through `NEXT_PUBLIC_LANDING_URL`. It is not part of Vercel Production yet. See [the platform handoff](platform-handoff.md) and [the preview guide](platform-preview.md).

## Content ownership

[content authoring](content-authoring.md) owns the public publishing gate. [docs/README.md](../README.md) maps internal sources. Product/economy/Era/IRL plans remain policies; public Markdown is the reviewed explanation, not an automatic plan export.

## Hosting and checks

main drives Vercel Production; temporary/development/testing branches produce previews. Existing GitHub Actions lane gates remain unchanged. Unit checks include Docs source/navigation/link/search tests. Browser checks exercise navigation, internal scrolling and accessibility.

References are pinned submodules. Pixl layout/navigation concepts are adapted under its recorded MIT basis; Template/Stardance are reference-only. See [attribution](../source-audit/ATTRIBUTION.md).
