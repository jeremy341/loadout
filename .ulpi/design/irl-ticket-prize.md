# IRL ticket in the shop

Status: in progress on the main checkout (fix/mole-mood-timing), uncommitted.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md), sections "Icons", "Prizes" and "Typography". Related: [prize-record.md](prize-record.md) and [prize-numbers.md](prize-numbers.md).

## Design read

Reading this as: a landing page for teenage builders, where the shop belt is the place a visitor sees what Ore buys. The Düsseldorf weekend belongs there as one more item with a limited number of places, so a visitor can see that the event costs Ore like everything else. It must not look open for registration: the event is not confirmed.

## Scope

- In: one new card in the shop belt (`PlannedPrizes.tsx`), a small "Limited" tag on that card (`prize-belt.css`), its row in `content/docs/prizes.md`, and the belt's e2e spec.
- Out: the IRL section, its copy and the event status on `content/docs/irl.md`. Those stay as they are.

## The card

| Part | Value |
|---|---|
| Category | Event |
| Tag | Limited (only on this card) |
| Name | Ticket to LOADOUT IRL in Düsseldorf |
| Price | 700 Ore (70 approved hours at 10 Ore per hour) |
| Image | `people.png`, one of the saved 32 by 32 sprites, shown at 128px (4x) with pixelated edges, as the flight grant card does |

Ore is the only price shown. The 700 Ore figure is a working value, and the belt lead already says the prices are the ones we're planning.

## States

| State | Behaviour |
|---|---|
| Default | "Limited" sits beside the category, on the same line as every other card's category. |
| Dark and light | The tag uses the accent fill with the accent-ink text, as the hero tag does. |
| Phone | Same card width; the tag stays on the category line. |
| Reduced motion | No change. |
| Belt paused | No change. |

## Accessibility

- "Limited" is real text, so screen readers read it with the category.
- The sprite is decorative (`alt=""`), since the name sits beside it.
- The tag uses the accent fill with the accent-ink text, the same pairing the hero tag uses, so it passes contrast in both themes.

## Rules and checks

- The event is not confirmed, so the card must not offer registration. The belt already says none of the prizes can be ordered yet.
- The docs row marks the ticket as limited and points to the IRL page for the event status.

## Skills

Applied from the UI guide: the design system's Icons rules (the site's own 32 by 32 sprites, pixelated, never smoothed), and the Prizes section's card rules. Not applicable: motion, SVG, sprite creation and animator, since the card reuses an existing sprite and adds no motion.

## Acceptance

1. The belt shows ten cards, and the ticket card is one of them, with "Limited" beside "Event".
2. The ticket card shows the people sprite at 128px inside its white plate, with "700 Ore" as its only price.
3. No other card shows a tag.
4. `e2e/prize-photos.spec.ts` expects ten cards and the new labels.
5. `content/docs/prizes.md` has a row for the ticket marked limited, with 700 Ore and 70 hours.
6. Typecheck passes and the docs tests pass 7/7.
