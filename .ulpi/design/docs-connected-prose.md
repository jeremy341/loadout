# Public Docs: connected explanations and multiplier labels

**Policy update, 2026-10-19:** This brief records an earlier public-copy pass. The rating and multiplier wording below is historical where it conflicts with current policy: review dimensions are scored 1–9; normal payouts range 1×–20× with 10× mean; Great Signal can raise the hourly cap to 30×. Plan 22 and Plan 02 own these rules. The article byline is now **“Built with Love by the LOADOUT team”**, per the later owner decision. Do not reapply the earlier “Written by Jerry” direction.

## Scope and direction

Follow the existing industrial field-manual identity in DESIGN.md. This is an editorial pass across the 25 public Markdown guides, plus multiplier wording in the homepage flow and FAQ. The approved reference comparison supplies the direction: Pixl's task order and approachable explanations, and Stardance's reasons, examples and common mistakes. Write original LOADOUT copy.

## Reader journey

Start with the reader's goal or immediate question. Carry each explanation through an action, its reason, an example and the next useful step. Use numbered lists for procedures and tables for comparisons or calculations. Keep paragraphs together when one sentence explains the previous one. Vary the structure to suit the subject; avoid a repeated template across every page.

Expand the fictional sensor-board journal into a connected session account with context, competing explanations, a failed attempt, measurements, a bounded conclusion and the next investigation. Mark fictional evidence as invented and use a technically sound example; do not treat the sample as a minimum length rule.

## Facts and compatibility

Plans 01 and 02 own eligibility and the public economy. PR #130 aligns the public age wording with the 13–18 policy; Hack Club teen verification is required, with account integration and operations still to be confirmed. Retain approved amounts, unsettled decisions, sources, route slugs, metadata and existing heading IDs. Keep launch status primarily in Start and Eligibility and event status on IRL. Preserve characters' established events and motives while improving transitions.

Display review-derived payout factors as 5×, 10×, 15× and 20×. Explain once that 10× pays 10 Ore per approved hour. Preserve the rating concept where referring to the review process, but label payout calculations as multipliers. Homepage scope: HowItWorks and its FAQ only.

## UI and states

Owner follow-up: show the byline “Written by Jerry” at the end of every article, before previous/next navigation. Reuse the existing muted `.doc-sign` styling and replace the old “Built by the LOADOUT team” credit. Keep it outside the Markdown source so search and contents headings do not repeat it.

Use existing Markdown components, heading hierarchy, reading widths, themes and responsive layout. Preserve article-pane scrolling, search, hash navigation and current motion. No new controls or visual assets. Screen-reader descriptions of the homepage example must say “multiplier of ten”; visible text uses ×. Check wrapping at 390px and 1920px, including the extended journal and multiplier example.

## Implementation ownership and acceptance

Primary agent owns public Markdown. A UI engineer owns only HowItWorks.tsx and faq-items.ts. Implement this scope against the current tokens and components. Preserve all unrelated working-tree changes.

- All Docs pages read as complete explanations with useful transitions and original examples.
- Existing links, aliases and anchors validate; public search remains public-only.
- Approved policy and calculations agree across pages.
- All payout-factor displays use ×, with understandable accessible names.
- Run Docs source/link tests and relevant repository checks. Inspect narrow/wide rendered pages when the local browser is available.
- Keep changes local; do not send Slack messages, commit or publish.
