# Accessibility standard for the homepage and Docs

Status: 2026-10-16. Standard: WCAG 2.2 level AA, with the GOV.UK Design System as the reference for patterns (landmarks, headings, tables, links, focus, plain language).

## Automated checks (in the test suite)

`apps/landing/e2e/accessibility.spec.ts` runs axe with the WCAG 2.0, 2.1 and 2.2 AA rule sets on every homepage and Docs page, at 375 px (dark) and 1440 px (light). It fails on any violation. Result on 2026-10-16: zero violations on all 16 pages.

Fixed on 2026-10-16 (found by the first run, 39 violations):
- The theme switch sat outside any landmark. It now sits inside `main` on the homepage and inside the directory `aside` in the Docs.
- The top bar was a labelled `div`, which is not a landmark. It is now a `header`.
- The floating Docs link is now inside a `nav` landmark.
- Three table header cells were empty (Pricing, Requisitions, Build and ship). Each now has a column name.
- On phones the tables scrolled sideways, which a keyboard user could not reach. Cells now wrap instead, as GOV.UK tables do.

## Manual checks still to do

Automated checks find only part of WCAG. These need a person:
- **Screen reader:** read the homepage and one Docs page with VoiceOver or NVDA. Check the order, the headings and the names of the links.
- **Keyboard:** Tab through the homepage and the Docs. Check the focus ring is always visible, the skip link works, and no control traps focus. Mole (Orry) must never take focus.
- **Zoom:** 200% and 400% zoom (or 320 px wide). No horizontal scrolling and no text cut off.
- **Motion:** with reduced motion on, nothing moves that should not, and Orry does not appear by himself.
- **Colour:** light and dark themes, and a colour-blindness simulator on the track and level colours.
- **Plain language:** the Docs read at a reading age a 13-year-old can follow. GOV.UK's content guide is the reference.

## Spacing and dividers in the Docs

Each Docs section now starts with a rule and room above it (84 px above the heading, the rule 36 px below), and paragraphs and tables have more space. Long pages read in blocks, which is easier for everyone, including people who read with zoom or magnification.
