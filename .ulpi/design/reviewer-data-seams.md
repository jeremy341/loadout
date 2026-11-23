# Reviewer data seams: moderation and fulfilment

**Status:** Scoped implementation brief, 24 Nov 2026. No visual redesign; owner review is still pending.
**Binds to:** [`DESIGN.md`](DESIGN.md), the [design system](../../docs/design/system/design-system.md), [`reviewer-desk-staging-honesty.md`](reviewer-desk-staging-honesty.md), and [`reviewer-fulfilment.md`](reviewer-fulfilment.md).
**Surface:** `/reviewer/bans`, `/reviewer/reports`, `/reviewer/violations`, and `/reviewer/fulfillment`.
**Audience:** Authorized reviewer staff.
**Skills loaded:** `frontend-design-ui-ux`, `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites`, and `Pixel Art Animator`. This change reuses the current reviewer surface and `DataNote`; it adds no motion, vector, or sprite asset.

## Design read

Keep the reviewer desk as the existing industrial field manual. This is a data-provenance change, not a new visual direction: preserve its tables, hierarchy, tokens, and controls. Make the boundary between database-backed order rows and staging-only buyer-contact or budget fields explicit without implying production deployment.

## Flow and states

1. A reviewer opens one of the four existing pages. Existing route guards and role requirements remain unchanged.
2. Existing tables keep their current structure and controls. Bans, reports, and violations keep reading through the reviewer db adapter, which already uses the platform moderation-data rows and falls back to sample rows only in development. Fulfillment orders read through the live-ops shop-order adapter.
3. The fulfillment page retains one `DataNote` before its queue content. Its sample label scopes the staging-only buyer-contact and budget fields; the copy also distinguishes those fields from the database-backed order list.
4. Existing empty, loading, and failure behavior remains as implemented. This brief adds no new data state and makes no claim that staging records are production data.

## Components and interactions

- Reuse the existing reviewer table components and `DataNote`; add no component, action, filter, route, or interactive element.
- Keep existing moderation, fulfillment, sorting, search, and pagination interactions unchanged.
- The provenance note is static and does not receive focus or announce as a live region.

## Responsive and accessibility constraints

- Do not change page layout or table behavior. The note must wrap naturally at narrow widths without causing horizontal page overflow.
- Preserve semantic paragraphs and the existing bold text label. Provenance must not rely on color alone.
- Preserve keyboard behavior and reduced-motion behavior. No new motion or iconography is introduced.
- Run the existing axe checks against changed reviewer pages at the project's supported desktop and mobile viewports; record results with the PR checks.

## Acceptance

- All four routes remain behind their current authorization guards and render the same page structure.
- Bans, reports, and violations read through the reviewer db adapter (platform rows, sample fallback in development only); fulfillment order rows use the live-ops adapter.
- The fulfillment note clearly distinguishes database-backed order rows from sample buyer-contact and budget fields, without claiming production data.
- Existing reviewer tests, lint, typecheck, production build, browser/axe checks, and `git diff --check` pass.

## Exclusions

No changes to reviewer roles, route access, moderation decisions, order workflows, data policy, external services, deployment configuration, or visual styling beyond the existing provenance note.
