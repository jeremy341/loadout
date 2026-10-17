# Less vibed, pass two (design brief)

Status: implementation spec for [Plan 23](../../plans/23-less-vibed-pass-two.md), 2026-10-16. Binds to `DESIGN.md` and `docs/design/system/design-system.md`: the locked identity (graphite and blue, pixel face, hard rules, block shadows, German mining labels, Orry) does not change. Copy and numbers come from Plan 23 and Plan 02; nothing here sets a price, threshold or formula.

Skills loaded for this change: `frontend-design-ui-ux` (this spec), `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites`, `pixel-art-animator`. No new sprite or SVG asset is made: the layout work reuses the existing pixel icon sprite, and the pixel and animator skills were consulted only to confirm that nothing here is a sprite task.

## Design read

Reading this as: a teen-facing program page for a proposal that has no proof yet, with the plain confidence of Stardance and the worked-example clarity of Pixl, keeping LOADOUT's graphite pixel-and-mining identity. The bet: fewer words, taught once, shown with one real example, in layouts that differ from section to section.

Dials: design variance 6, motion intensity 3 (existing reveals only), visual density 4.

## 1. Page order and sections

Hero (with a short "what is this" paragraph), Tracks, How it works, Prizes, Levels and Rewards, Project fit, Custom Orders, Community Eras, LOADOUT IRL, FAQ, Hack Club and the team. The depth strips (German labels and metres) are reassigned in this order and count down without gaps: Übertage −000 (Tracks), Hängebank −100 (How it works), Füllort −200 (Prizes), 1. Sohle −300 (Levels and Rewards), Strecke −400 (Project fit), Streb −500 (Custom Orders), 2. Sohle −600 (Eras), Wettersohle −700 (IRL), 3. Sohle −800 (FAQ). The hero keeps its own markers.

## 2. Section specs

| Section | Layout | Content rules |
|---|---|---|
| Hero | Unchanged frame. Below the headline, one plain paragraph. The right marginal note stops repeating the status. | "Not open yet" appears here once, in the facts row. Headline fits at 320 px (see 3). |
| Tracks | Four cards stay (four equal things). Each card gets one example line and one tag chip. | Tools: a command-line tool that removes a repeated step, tag CLI. Systems: a small database or a chat server, tag Database. Compute: a program that runs a model on a GPU, tag GPU. Hardware: a custom board or a robot, tag Board. Research Mode strip stays, shorter. |
| How it works | A vertical timeline: a rail with numbered nodes, text to the right, six steps, then the worked example as its last stop. Replaces the card row with arrow connectors. | Teaches Ore, Track XP, review and shipping again once. The worked example: 20 hours at a rating of 10 pays 200 Ore (a Raspberry Pi 5); rated 15 it pays 300. One line: "Joining late is fine. Ore and Track XP carry across seasons, so you can start whenever you join." |
| Prizes | The belt, unchanged. | Lead names no status; it says these are examples at planned prices. |
| Levels and Rewards | One section: a wide table of the five levels (level, what it gives) and one row of three facts (Ore, level discount, Requisition) as plain definition rows, not cards. | Numbers and links only. No re-explaining. |
| Project fit | A compact list: four scoring criteria as rows with a one-line meaning each; the Stronger and Weaker example cards are removed. | Criteria: Originality, Technical Depth, Execution, Documentation. |
| Custom Orders | Three steps in a line joined by arrows (a row, not three equal boxes). | Keeps the three steps. Drops the "not open yet" line. |
| Eras | Text on the left, the three-part loop (Approved projects, Era Points, next theme) as a vertical strip on the right. | The 10% bonus is stated once. No "planned" labels. |
| IRL | Three days as a horizontal timeline. | One note: "Dates, venue and funding are not confirmed." |
| FAQ | One accordion built from native details elements. Works without scripts, no second copy. | Answers keep the agreed numbers. "Joining late" answer added. |
| Hack Club and the team | Unchanged block plus Jerry's why paragraph. | Signed Jerry. No claim about other programs' rates. |

Corner brackets stay on headings only (existing rule). Cards that remain use the existing card style.

## 3. States and responsive behavior

- Widths checked: 320, 360, 375, 390, 430, 768, 1024, 1440, 1920. No horizontal scroll.
- Hero headline: the narrow-screen font size uses a divisor of 9.7 (was 8.35) so "technical stack." fits its box from 320 px up; a test fails when any headline line is wider than its container.
- Timeline: a single column on every width; the rail sits left of the text. Below 640 px the node is 28 px and the text keeps 16 px minimum.
- Levels table: scrolls inside its own container only if needed below 360 px; otherwise it fits.
- Custom Orders arrows turn down arrows below 700 px.
- FAQ: closed, open, keyboard (Enter and Space on the summary), no-script (native). Open state shows a minus, closed a plus.
- Reduced motion: no height animation on the FAQ; reveals stay as they are. No new continuous animation is added.

## 4. Motion

Reveals use the existing triggered slide-in. The FAQ height transition is 250 ms ease-out (`cubic-bezier(0.23, 1, 0.32, 1)`) only where `interpolate-size` is supported, and instant elsewhere and with reduced motion. Nothing animates on keyboard actions beyond the native toggle. Heading scramble behaviour is unchanged.

## 5. Accessibility

Semantic headings stay in order (one h1, h2 per section). The timeline is an ordered list. The levels table is a real table with a caption and header cells. Tags are text, not colour-only. Focus rings stay visible on summaries and links. Contrast follows the existing tokens. Decorative ASCII and strips stay aria-hidden.

## 6. Acceptance criteria

1. The page has the order and depth labels above; the depth strip test passes with nine strips.
2. "Not open yet" appears once on the homepage outside the FAQ's own question; the FAQ appears once; no `noscript` copy of it.
3. Eras and IRL carry one caveat each; no "planned" or "still being finalized" wording.
4. No line of the hero headline exceeds its container at 320 to 430 px.
5. Each track card shows an example and a tag chip.
6. How it works is a vertical timeline with the worked example and the joining-late line.
7. Levels and Rewards is one section; Project fit has no Stronger or Weaker cards.
8. The FAQ opens with the keyboard and without scripts.
9. The unit tests, typecheck, lint and the full e2e suite pass; the docs guard tests pass.
10. The why paragraph and the Poorup example page appear in Docs (Program group) and the Hack Club block.

## 7. Build handoff

Target: the Next.js engineer for `apps/landing`. Implement exactly this spec with the locked tokens; do not redesign. One commit per step of Plan 23's order of work, tests green before the next.
