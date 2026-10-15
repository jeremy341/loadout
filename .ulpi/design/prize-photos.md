# Prize photos: the proposed prizes show real products

Status: implemented on the feature/prize-photos branch, awaiting owner check.
Binds to: [DESIGN.md](DESIGN.md), the [design system](../../docs/design/system/design-system.md), and [prize-belt.md](prize-belt.md) (the belt itself is unchanged). Plan: [Plan 19](../../plans/19-credibility-prizes-economy-cursor.md), workstream B.

## Design read

Reading this as: a landing page for teenage builders, in the locked industrial and signage language. Pixl and Stardance show real product photos of their prizes, and a reviewer said LOADOUT felt thin and AI-made. Eight icon cards with a category name read like a table of contents; a Raspberry Pi, a soldering iron and a 3D printer tell a teenager what Ore could buy. The belt stays (owner decision). Counterfactual test: stock cards with a photo could sit on any site; riveted cards with a white product plate on the mine's grid, under the depth marker, belong to this one.

## Scope

- In: the eight cards of the belt (`PlannedPrizes.tsx`), their styles (`prize-belt.css`), eight photos in `public/loadout/prizes/`, the heading "Proposed prizes" and its lead.
- Out: the belt's motion and controls, prices, stock, any promise that an item will be offered, the Docs, the other sections.

## Content

The eight planned categories stay. Each gets one example product, so the list reads as examples and not as a catalog.

| Category | Example | Photo |
|---|---|---|
| Developer hardware | Framework 16 laptop | `framework-16` |
| Embedded boards | ESP32 starter kit | `esp32` |
| Compute | Raspberry Pi 5 | `rpi` |
| Tools | Soldering iron kit | `soldering-iron` |
| Storage | Samsung T7 SSD | `samsung-t7-ssd` |
| Fabrication | Bambu Lab A1 Mini 3D printer | `a1-mini` |
| Domains | A domain for your project | `domain-grant` (Pixl's pixel globe) |
| Custom equipment | Enclosed 3D printer | `centauri-carbon` |

The collection is labelled "Proposed prizes" once (the heading). The depth marker above it says only "Prizes". The lead reads "These are examples of what Ore could buy. None are available to order yet." The owner approves this list; changing it means editing `PRIZES` and swapping a photo.

## Photos

- From Pixl's shop (`apps/pixl-dashboard/public/shop/*.webp`), used under the Pixl owner's permission and MIT licence, recorded in `docs/source-audit/ATTRIBUTION.md` with each source path.
- Already small WebP files: 7 to 101 KB each, about 310 KB in all. Served through `next/image` (lazy, sized for the 230 px card).
- White backgrounds, so each sits on a white plate with an ink border. The plate is the same in both themes.
- Decorative: `alt=""`, because the category and the example name are written next to the photo.
- The photos show products made by other companies. They are examples, not endorsements or promises.

## States

| State | Behaviour |
|---|---|
| Default | The belt moves left slowly; photos load as they approach. |
| Hover or keyboard focus | The belt pauses, as before. |
| Reduced motion | A still row to scroll by hand, as before. |
| Photo fails to load | The plate stays white with the name below; nothing else shifts. |
| Dark and light | Same plate; the text uses the page tokens. |
| Phone | The same cards, one and a bit in view. |

## Accessibility

- Names are real text. The photo is decorative, so a screen reader hears "Developer hardware, Framework 16 laptop" once; the moving copy stays hidden from assistive technology.
- Contrast: the label and name sit on the card, not the photo.
- The image plate has a fixed height, so photos cause no layout shift.

## Skills

All seven UI skills were loaded for this change (`frontend-design-ui-ux`, `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites`, `pixel-art-animator`). The photos are raster images, so the SVG and sprite skills added no work. Motion rules applied: nothing new moves; the belt keeps its transform-only animation and its pauses.

## Acceptance

1. The eight cards each show a photo on a white plate, a category and an example name.
2. Every photo stays inside its plate.
3. The photos total under 1.5 MB and are served as WebP.
4. The heading says "Proposed prizes" and the section says none can be ordered yet.
5. The whole browser suite, typecheck, lint and unit tests pass.
