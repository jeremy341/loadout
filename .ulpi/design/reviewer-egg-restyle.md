# Reviewer site: egg look, Pixl layout

**Status:** owner direction 16 Nov 2026 (after reviewing the first parity build). Applies to the **reviewer site only** (`app/(reviewer)/reviewer/**` and everything under `.rv`). The participant platform and the public site keep the LOADOUT design system. This note overrides the LOADOUT look for the reviewer site; it does not change any rule, wording policy or the Local/Stub honesty sentences in `reviewer-desk-parity.md`.

## The rule

- **Layout and behaviour come from Pixl** (`references/pixl/apps/internal-dashboard`, MIT, structure only): the top bar and tab row, tables with real pagination, a review page that is two independent scrolling columns with a draggable divider, a form with every box Pixl's review form has.
- **Look comes from the egg repo** (`C:\Users\jerem\Documents\GITHUB\nest deploy`, `web/`, the owner's own repo): a quiet Vercel-style dashboard. Read `docs/design/ui-spec.md` (sections 1, 2, 5, 6.0, 6.4, 6.11 to 6.14), `web/src/app/globals.css` (tokens `:root`/`.dark`, type scale, motion), `web/src/components/ui/{button,input,native-select,badge,card,dialog,skeleton,empty-state,separator,tooltip}.tsx`, `web/src/components/dashboard.css`, and the app shell components.
- Then adjust for LOADOUT: LOADOUT words (tracks, Ore, Hours), the existing sample data, the Local/Stub sentences, one track chip per ship. Remove anything Pixl-only. Add what LOADOUT needs.

## What "egg look" means here

Neutral grayscale (Geist scale), white or near-black surfaces, 1px hairline borders, no shadows except menus and dialogs, radius 6px controls, 8px cards and menus, 12px dialogs, pill badges. Geist Sans for text, Geist Mono for ids, hashes, durations and numbers. Dense but calm: 14px body, 13px labels, 12px captions, 56px top bar, 4px spacing rhythm. One restrained accent for the primary button and links (egg's), semantic green, amber, red only for state, always with a word. Motion: 100 to 220 ms, ease `cubic-bezier(0.23, 1, 0.32, 1)`, nothing that moves under reduced motion. Focus ring visible on everything.

Remove inside the reviewer site: the pixel and dot display fonts, the grid and grain backdrop, hard offset shadows, square corners, yellow accent, dashed outlines used as decoration, ALL-CAPS tracking labels.

## Usability requirements (all reviewer pages)

1. **Every box to write in exists** on the review page (see the form list in the worker briefs): audit notes, technical features, deflation reason, red flags, per-journal hours and reason, note to the builder, the four quality dimensions, internal note. Enabled and Local. None may sit in a disabled fieldset.
2. **Internal scrolling.** The review page is a full-height workspace: left column (evidence) and right column (verdict) scroll independently under a fixed top bar; a draggable, keyboard-operable divider (arrow keys), width kept in `localStorage`, double-click resets. Long tables scroll inside their own region with a sticky header.
3. **Pagination everywhere a list can grow:** queue, reviewed, log, audit, spot check, proposed bans, players, projects, reviewers, orders, tickets, reports. A shared pager: first and last page, a window of 2 around the current page, gap markers, "Showing 21 to 40 of 63", page size choice (20, 50, 100), URL-driven (`?page=&per=`), works without JavaScript.
4. **Filters and search** sit in one toolbar row above each table (egg `activity-filters` pattern), URL-driven.
5. Keyboard only works; every control has a label; status never colour only.
6. Both light and dark themes hold contrast. 390 px works: top bar collapses, tables scroll inside regions, the two columns stack with a tab switch (Evidence | Verdict).

## Ownership

- Look: `app/_components/reviewer/reviewer-theme.css` (new), scoped under the reviewer root, loaded after `review.css` and the area sheets, mapped onto the existing `--pf-*` tokens so every existing `rv-` and `pf-` class inherits it.
- Layout and behaviour: new `app/_components/reviewer/reviewer-layout.css` (`rvl-` classes: grid, overflow, sticky, splitter; no colour, no font) plus the components and pages listed in the worker brief.
- Do not edit `platform.css` rules that the participant platform uses.

## Acceptance

Typecheck, lint, tests green. Screens at 1440 and 390 px in light and dark: queue, a desk page (evidence and verdict columns scrolling independently, divider), the full form, log with pagination, players, macros, stats. No horizontal page scroll. No pixel font, grain, grid or hard shadow left in the reviewer site.

---

## Superseded 16 Nov 2026 (later the same day): Pixl's own design

The owner reviewed the egg-styled build and said it looked generic and was hard to use. Decision: **use Pixl's dashboard design and layout** (`references/pixl/apps/internal-dashboard`, `app/_ui/admin.css` and the review page), reworded for LOADOUT. Pixl is MIT; its Phantom Sans font, logo, art and brand assets are not covered and are not used (system sans stack instead). The egg theme (`reviewer-theme.css`, Geist) is replaced. Key layout facts from Pixl: the page scrolls normally (no fixed-height workspace, no pinned header); the review page is a grid of a wide evidence column and a verdict panel of about 460px that is sticky (`top` about 80px, own scroll, `max-height` about the viewport minus 10rem) with a sticky segmented tab row; a sticky bottom bar holds previous and next; tables are dense and paged; callouts are compact.
