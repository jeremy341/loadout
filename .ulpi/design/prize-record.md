# Prize record

Merged on 25 Oct 2026 from 3 design briefs. Each section keeps its original text. Only the design system and the code are current; a brief records what was decided and built.

## Prize belt: planned prizes move past on a slow belt

_Merged from `prize-belt.md`._

Status: restored on 2026-10-17 after the accessibility pass changed the prize strip to static scrolling. The belt pauses on pointer hover and keyboard focus; there is no global pause button.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md), sections "Motion", "Cards and rivets" and "Depth markers and rulers".

### Design read

Reading this as: a landing section for teenage builders, in the locked industrial and signage language, leaning on the pixel sprites already in the page. The owner compared the site with Pixl and the YSWS template. Both show their prizes in a looping carousel on the homepage, with a picture and a name per item. LOADOUT showed eight icon cards in a static grid, which looks like a table of contents rather than a shop window.

Direction: a mine conveyor. The riveted cards travel left slowly, like ore through a shaft. Pause while a visitor reads with a pointer or keyboard. Under reduced motion, show a still row that can be scrolled by hand.

### Scope

- In: the "Planned prizes" section (`app/_components/home/PlannedPrizes.tsx`) and one stylesheet (`app/prize-belt.css`).
- Out: the prize list itself (still the eight planned categories), prices, and the docs. No price, item name or brand is invented: the docs say the catalog and its prices are unpublished. When real items and Ore prices exist, they replace the category names in the `PRIZES` list and the belt needs no other change.

### How it works

- Two copies of the same list sit side by side in one track. The track moves by exactly half its width, so the loop has no jump. Each copy carries its own trailing gap, so half the track is exactly one copy.
- The second copy is `aria-hidden`; assistive technology reads the eight prizes once, as a list.
- CSS only: one `transform` animation (70 s a lap), no JavaScript and no React state.
- The edges fade out with a mask so cards enter and leave softly.

### Control and states

| State | Behaviour |
|---|---|
| Default | The belt moves left slowly. |
| Pointer over the belt | It pauses while the pointer stays there. |
| Belt has keyboard focus | It pauses so a visitor can read. The labelled region takes focus and has a visible focus ring. There is no pause button. |
| Reduced motion | No animation. The visitor scrolls a single still list by hand. |
| Phone | The same belt with the same card width. |
| Dark and light | The cards use the page's own tokens. |

### Accessibility

- The visible list is a real `<ul>` with eight items; the second visual copy is hidden from assistive technology.
- Hover pauses the belt for pointer users; keyboard focus pauses it for keyboard users. Under reduced motion, the labelled scroll region has a visible focus ring and can be moved by keyboard.
- The section's sentence "These are plans. None are available to order yet." stays above the belt.

### Skills

Loaded earlier in this conversation for UI work: `frontend-design-ui-ux` (this brief), `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites` and `pixel-art-animator`. Motion rules applied: animate only `transform`, pause on hover and on focus, honour the user's motion setting, and give the motion a purpose (the conveyor). There is no new sprite work: the eight sprites already exist.

### Acceptance

1. The section shows eight planned prize cards twice visually and once for assistive technology.
2. The belt moves by exactly one copy per lap and pauses on hover or keyboard focus.
3. Reduced-motion users get no animation or duplicate and can scroll the still row by hand. There is no global pause button.
4. "None are available to order yet" is still on the section.
5. The whole browser suite, typecheck, lint and unit tests pass.


## Prize loop spacing

_Merged from `prize-loop-spacing.md`._

Status: the two-list loop was restored at the owner's request on 2026-10-17. The earlier 230px card width, 16px inter-card gap, and half-track spacing measurements apply again.

### Evidence and design read

The supplied screenshot shows a larger gap between the final Framework card and the next ESP32 card. Current settled browser measurements at 1280px and 638px show 230px cards and 16px gaps, including that seam; the photographed transient is not reproduced in those settled views. The two duplicated flex lists currently rely on automatic intrinsic sizing and shrink behavior.

Keep the industrial design, all eight prizes, order, 230px cards, 16px spacing and 70-second translation. Stabilize each list's sizing with fixed 230px grid columns and a nonshrinking list. Retain exactly one trailing 16px gap per list so translating by half the track width remains exact. This removes intrinsic list sizing as a source of a blank loop interval without introducing a timer or new carousel engine.

### Implementation and acceptance

Only `apps/landing/app/prize-belt.css`: use grid-auto-flow column and grid-auto-columns 230px within `.pb-half`, flex:none for each list, and min-width:0 for its grid-item li wrappers. Keep the existing gap/padding, cards, track animation, mask, hover/focus pause and reduced-motion manual scrolling. No content, image, motion-timing or other section changes.

Verify all 15 gaps across the two lists, their equal widths and half-track loop distance, at desktop and narrow widths. Capture the actual last-to-first seam if possible. No test suite requested. The seven UI skills have already been consulted; this fix creates no assets or new motion.

Engineering handoff: GPT-6 Luna medium. Implement exactly this focused CSS change, preserving all existing work. Parent handles browser measurements and diff review.

### Local verification

Implemented the two CSS declaration changes only. At 638px and 375px, all 15 inter-card gaps across both lists measure 16px, each list is 1968px, and the track is 3936px. The half-track translation therefore equals one complete repeated list including its trailing gap. Existing hover/keyboard pause, 70-second animation and reduced-motion rules were preserved. `git diff --check` passes. The original oversized screenshot gap was not reproduced in the settled pre-change preview; the fix constrains sizing explicitly rather than claiming a reproduced runtime cause. No test suites, commit, push, deployment or messages.


## Prize photos: the proposed prizes show real products

_Merged from `prize-photos.md`._

Status: implemented on the feature/prize-photos branch, awaiting owner check.
Binds to: [DESIGN.md](DESIGN.md), the [design system](../../docs/design/system/design-system.md), and [prize-record.md](prize-record.md) (the belt itself is unchanged). Plan: Plan 19 (removed 25 Oct 2026), workstream B.

### Design read

Reading this as: a landing page for teenage builders, in the locked industrial and signage language. Pixl and Stardance show real product photos of their prizes, and a reviewer said LOADOUT felt thin and AI-made. Eight icon cards with a category name read like a table of contents; a Raspberry Pi, a soldering iron and a 3D printer tell a teenager what Ore could buy. The belt stays (owner decision). Counterfactual test: stock cards with a photo could sit on any site; riveted cards with a white product plate on the mine's grid, under the depth marker, belong to this one.

### Scope

- In: the eight cards of the belt (`PlannedPrizes.tsx`), their styles (`prize-belt.css`), eight photos in `public/loadout/prizes/`, the heading "Proposed prizes" and its lead.
- Out: the belt's motion and controls, prices, stock, any promise that an item will be offered, the Docs, the other sections.

### Content

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

### Photos

- From Pixl's shop (`apps/pixl-dashboard/public/shop/*.webp`), used under the Pixl owner's permission and MIT licence, recorded in `docs/source-audit/ATTRIBUTION.md` with each source path.
- Already small WebP files: 7 to 101 KB each, about 310 KB in all. Served through `next/image` (lazy, sized for the 230 px card).
- White backgrounds, so each sits on a white plate with an ink border. The plate is the same in both themes.
- Decorative: `alt=""`, because the category and the example name are written next to the photo.
- The photos show products made by other companies. They are examples, not endorsements or promises.

### States

| State | Behaviour |
|---|---|
| Default | The belt moves left slowly; photos load as they approach. |
| Hover or keyboard focus | The belt pauses, as before. |
| Reduced motion | A still row to scroll by hand, as before. |
| Photo fails to load | The plate stays white with the name below; nothing else shifts. |
| Dark and light | Same plate; the text uses the page tokens. |
| Phone | The same cards, one and a bit in view. |

### Accessibility

- Names are real text. The photo is decorative, so a screen reader hears "Developer hardware, Framework 16 laptop" once; the moving copy stays hidden from assistive technology.
- Contrast: the label and name sit on the card, not the photo.
- The image plate has a fixed height, so photos cause no layout shift.

### Skills

All seven UI skills were loaded for this change (`frontend-design-ui-ux`, `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites`, `pixel-art-animator`). The photos are raster images, so the SVG and sprite skills added no work. Motion rules applied: nothing new moves; the belt keeps its transform-only animation and its pauses.

### Acceptance

1. The eight cards each show a photo on a white plate, a category and an example name.
2. Every photo stays inside its plate.
3. The photos total under 1.5 MB and are served as WebP.
4. The heading says "Proposed prizes" and the section says none can be ordered yet.
5. The whole browser suite, typecheck, lint and unit tests pass.
