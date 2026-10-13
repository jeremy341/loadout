# Ore: the global currency's name and icon

Status: implemented on the feature/ore-currency branch, awaiting owner check.
Binds to: [DESIGN.md](DESIGN.md), the [design system](../../docs/design/system/design-system.md) and [Plan 02](../../plans/02-economy-and-rewards.md), which owns the currency.

## Decision record

The owner renamed the global spendable currency from Bolts to **Ore** on 2026-10-13 and chose the gem as its icon. Taler (coins) was the other candidate and was dropped. Reasons for Ore: the site is a mine (depth markers, Sohle, the helmet and the lamp), you dig ore and then spend it; English-speaking teens read it at once; it does not clash with the currency names of other Hack Club programs we found (pixels, stardust, gold, doubloons). The program is pre-launch, nothing was published with a price or formula, so the rename costs words only.

## Design read

The currency is the one thing a builder collects, so its name and its mark carry the identity of the program. A bolt belonged to the old "slot and bolt" logo. A gem of ore belongs to the mine.

Direction: industrial and signage, as locked in DESIGN.md. Counterfactual test: a generic game currency (coins, gems, credits) could belong to any shop. Ore, named in German mining terms elsewhere on the page, and drawn as the pack's pixel gem, belongs to this one.

## Wording rules

- The name is **Ore**, always capitalised when it means the currency (the mineral stays lowercase). It is a mass noun, like Gold: "earn 25 Ore", "Ore is global", "enough Ore", "the Ore you earn", "an Ore quote", "the Ore multiplier". There is no plural "Ores".
- Verbs agree with a singular subject: "Ore is spendable currency", "Ore does not split into track wallets".
- Titles and labels keep their shape: "Ore, XP & levels", "Ore to spend", "Ore bonus", "ORE" in upper-case labels.
- The FAQ question "What are Bolts and Track XP?" becomes "What is Ore, and what is Track XP?".
- "Bolt Yellow", the old name of the accent colour in the plans, becomes "Ore Yellow".

## Scope

- In: the homepage copy and the FAQ, the public Docs (`content/docs/`), the tests, the plans (Plan 02 owns the currency; Plans 00, 01, 05, 06, 08, 11, 15, 17 and the proposal follow), `PRODUCT.md`, `DESIGN.md`, the design system and the asset catalog, and the contributor docs that name the currency.
- The icon: `apps/landing/public/loadout/sprites/ore.png` replaces `bolt.png`. It is the gem from the one-bit icon pack (the owner confirmed it can be used), 16 by 16 with each pixel doubled to 32 by 32, in the same two colours as every other sprite (outline `#0E1215`, fill `#FDCF03`), so the existing theme filter recolours it like the rest. The `bolt-nudge` animation is renamed `ore-nudge` and is otherwise unchanged.
- Out: the owner's custom `bolt.svg` artwork (kept byte for byte; it is not shown anywhere), the `ϟ` glyph in the hero facts (a lightning mark, not the currency), the old logo comment in `home.css`, and every record: design briefs written before 2026-10-13, the source audits, the restructure manifest and the superpowers plans. They keep saying Bolts because they describe what was true when they were written. Plan 02 and the briefs index say so.

## States

| State | Behaviour |
|---|---|
| Rewards card "Ore" | The gem sits where the bolt did, titled Ore, labelled CURRENCY. |
| How it works outcome "Ore to spend" | The gem nudges up and tilts 2 degrees on a 2.4 s ease-in-out loop (unchanged behaviour, new name). |
| Dark and light | The two-colour sprite is recoloured by the existing filter in both themes. |
| Reduced motion | The nudge stops, as before. |
| Docs | The page that explained Bolts, XP and levels is titled "Ore, XP & levels". Its address (`/docs/progress`) does not change. |

## Accessibility

- The icon is decorative (`aria-hidden`), as the bolt was. The name Ore is real text beside it.
- No colour, contrast or size change. The gem is 32 pixels square like the other card icons.

## Skills

Loaded this session for UI work: `frontend-design-ui-ux` (this brief), `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites` and `pixel-art-animator`. The sprite is the pack's own gem, checked at its display size next to the gear, chip, wrench and cart sprites; the nudge is the existing CSS animation under a new name, so the animation skills had nothing to change.

## Acceptance

1. No visitor can read "Bolt" or "Bolts" on the homepage (including closed FAQ answers) or in any public docs page, and "Ore" is there.
2. Both places that show the currency icon use `#i-ore`; `#i-bolt` is gone; `/loadout/sprites/ore.png` is a 32 by 32 PNG; `/loadout/sprites/bolt.png` is gone.
3. The docs navigation lists "Ore, XP & levels", and the page's `h1` matches.
4. The nudge animation is `ore-nudge`, and it still stops for reduced motion.
5. The whole browser suite, typecheck, lint and unit tests pass.
