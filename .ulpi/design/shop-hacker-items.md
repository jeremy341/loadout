# Shop catalog refresh: hacker items, Apple pricing and photos

**Status: approved by the requester on 25 Nov 2026. Rules and prices: [shop-hacker-items.md](../../plans/proposals/shop-hacker-items.md).** The UI skill guide asks for this brief before code. It was planned then, but the file was not saved and was written after the change.

## Design read

Reading this as: an update to the data behind an existing shop grid and homepage prize belt, for builders aged 13 to 18, in LOADOUT's locked design system. Dials stay as they are: no layout, token, type or motion change.

## Scope

- Catalog entries, prices and blurbs in `lib/platform/shop.ts`. No new component.
- Item photos: open-licence Wikimedia Commons photos with a credit, background removed, saved as `<name>.<first 8 of SHA-1>.webp`. Where no accurate open photo was found, an existing LOADOUT sprite is used. A different product's photo is never used.
- The generic monitor, API credits and PCB grant stop using a maker's advert, a company logo and an unrelated collage.
- The homepage belt reads names and prices from the catalog. Its photos and layout do not change.
- "New" is a flag on an item, no longer the last eight entries. "Recently added" shows every flagged item in the existing rail.
- 26 Nov 2026, before the code change: AirPods Pro and the Blåhaj plush stay, on the requester's instruction, with their earlier entries, photos and prices. They are not marked new. No layout change.

## States and accessibility

Empty, loading and error states, keyboard order, focus and reduced motion are unchanged. Card images stay decorative with the item name as text, as before. Credits show on the item page.

## Acceptance and result

1. Every item has a photo or sprite file that exists, and every Commons photo has a credit: unit tests pass.
2. The homepage and public Docs prices match the catalog: unit tests pass.
3. No sideways scroll on the shop from 320 to 1440 px: browser test passes.
4. axe reports no violations: the shop hub and item page (390 and 1440 px, dark and light) and the accessibility suite pass.

## Skills

Loaded: `frontend-design`. Also applied: the antislop filter. The other six skills named in `ui-skills.md` were not available in this environment and were not used. No motion, SVG or sprite asset was created.
