# LOADOUT design system

**Status:** Current visual authority for the homepage and the Docs. Verified against `apps/landing` on 2026-10-11. Product facts stay in the canonical plans; this file defines presentation only.

**Source of truth.** When this file and the code disagree, fix both in the same change:

- Homepage tokens and layout: `apps/landing/app/home.css`
- Docs tokens and layout: `apps/landing/app/docs.css`
- Fonts: `apps/landing/app/layout.tsx`, `apps/landing/app/docs/layout.tsx` and the files in `apps/landing/public/fonts/`
- Grain: `apps/landing/app/grain.css` and `apps/landing/app/_components/NoiseGrain.tsx`
- Rulers: `apps/landing/app/ruler.css` and `apps/landing/app/_components/SheetRuler.tsx`
- Icons: `apps/landing/app/_components/home/art.ts` and `apps/landing/public/loadout/sprites/`

## Identity

LOADOUT looks like an industrial field manual for builders: an engineering-paper grid, measured rulers, depth markers down a mine section, pixel display type, and one accent per theme. It is plain and factual. It should not look like a game, a generic SaaS page or a glass dashboard.

## Themes

- Two themes from one switch. Dark graphite is the default; light is stone paper.
- On the homepage the switch is the hidden checkbox `#theme`. On the Docs it is the shared `ThemeSwitch`. Both store the choice in `localStorage`.
- Both themes must pass the same checks: contrast, focus and reduced motion.

## Colour

### Homepage

| Token | Dark (default) | Light | Use |
| --- | --- | --- | --- |
| Canvas `--bg` | `#222627` | `#DDD3BF` | Page background |
| Text `--fg` | `#E9EBE7` | `#1A1714` | Text, rules and outlines |
| Muted `--mut` | `#A7AEAB` | `#6B6354` | Secondary text and labels |
| Accent `--ac` | `#5E9EF4` blue | `#C4491F` rust | Logo, links and markers |
| Accent text `--acf` | `#16191A` | `#FBF3E4` | Text on the accent |
| Surfaces `--pl1`, `--pl2` | `#2C3132` | `#D6CCB7`, `#CBBFA8` | Cards, panels and track plates |
| Card outline (dark) | `rgba(233, 235, 231, .22)` | the rule colour | Card and panel edges |
| Secondary `--hl` | `#6FC2BB` teal | not set | Dark only: links, list markers, corner marks and text selection |
| Primary button | blue with `#16191A` text | yellow `#E3C26B` with ink text and a 1px ink border | RSVP and the main actions |

- In light mode the yellow button is the primary action, and rust marks links and small accents. Keep rust to small details.
- In dark mode the icons are turned blue (see Icons). In light mode they show as drawn.
- No blue or purple glow, gradients or glass as decoration.

### Docs

| Token | Dark | Light |
| --- | --- | --- |
| Canvas `--bg` | `#222627` | `#DDD3BF` |
| Text `--fg` | `#E9EBE7` | `#1A1714` |
| Muted `--mut` | `#A7AEAB` | `#6B6354` |
| Body secondary `--dim` | `#B4BBB8` | `#4F4739` |
| Accent `--ac` | `#5E9EF4` blue | `#E3C26B` yellow |
| Accent text `--acf` | `#16191A` | `#1A1714` |
| Secondary `--hl` | `#6FC2BB` teal | `#C4491F` rust |
| Panels `--panel`, `--panel-2` | `#2C3132`, `#373D3E` | `#E8DFCC`, `#D6CCB7` |
| Stroke `--stroke` | `#4A5254` | `#1A1714` |
| Hard shadow `--drop` | `4px 4px 0 #0C0E0E` | `4px 4px 0 #1A1714` |

The homepage and the Docs choose their accents differently in light mode, on purpose: the Docs use yellow for active items, while the homepage uses yellow for buttons and rust for links.

## Typography

| Role | Font | Where |
| --- | --- | --- |
| Wordmark | Jersey 10 (`--font-display`) | The LOADOUT logo text, the nav logo (36px) and the Docs brand |
| Headings | Pixelify Sans 400 to 700 (`--font-pixel`) | Homepage headings and card titles. Docs h1 46px/700, h2 30px/600, h3 14px uppercase/600 |
| Buttons | Pixelify Sans | Homepage buttons (the hero and nav buttons were checked) |
| Body and lead | IBM Plex Mono 400 and 600 (`--font-ui`) | Homepage body text, leads, notes, nav links (11px), hero side labels (14px) and depth markers |
| Rulers | DotGothic16 (`--font-dot`) | Ruler numbers (11px) |
| ASCII art | JetBrains Mono (`--font-mono-art`) | ASCII fields, loaded through `next/font/google` |
| Docs body | Poppins 400, 500 and 600 (`--font-poppins`) | The Docs only, loaded in `docs/layout.tsx` |

Rules:

- Pixel fonts are for signage: headings, buttons and the wordmark. IBM Plex Mono is for reading. Do not set two pixel fonts in one heading.
- Homepage section headings are pixel, uppercase, 44px on desktop. Leads are 16px with a 1.65 line height, centred under the heading and no wider than 720px.
- Essential body copy is 16px. Do not shrink it to fit.
- Fonts are self-hosted, except JetBrains Mono and Poppins, which load through the framework, with `display: swap`.
- The scramble on the hero title measures its letters only after the pixel font has loaded.

## Layout

- Homepage content sits in a centre column 1080px wide. Section padding is set per breakpoint in `home.css`; change it there.
- Spacing uses multiples of 4px.
- The Docs use a boxed 300px sidebar, a reading column and a contents rail, with hard-edged panels.
- Breakpoints in use are 360, 370, 560, 639, 640, 700, 800, 820, 900, 1024, 1080, 1100, 1359, 1360 and 1420px. Use the nearest existing breakpoint before adding one. The browser suite checks 320, 390, 471, 700, 900 and 1440px, and checks for horizontal scroll.

## Surfaces, borders and controls

- Corners are square. A few small details use a 2px or 3px radius, and the theme knob is round.
- Cards and panels have a 1px outline. Docs controls use a 2px border with a 4px right and bottom edge, which lifts on hover.
- Cards lift on hover. On narrower layouts the hover adds a 4px offset shadow. Do not use blurred elevation.
- Primary homepage buttons are at least 52px tall, with 36px side padding, uppercase text and 0.1em letter spacing.
- Touch targets are at least 44px for primary controls.
- Focus is a visible `:focus-visible` outline in the accent colour, offset 2 to 3px. Never remove it.

## Depth markers and rulers

- A depth marker divides two sections: two dashed rules over a hatched band, with the depth numeral on the left (for example "−300 M") and a label on the right in Jersey 10, the wordmark face, set on a plate in the page colour so the hatching never runs through it (for example "1. SOHLE / LEVELS & REWARDS", 32px on desktop, down to 20px on tablets and 16px on phones).
- The hatching, the numeral and the label are faint at rest: the hatching at 6% of the rule colour, the numeral and label at 3% of the text colour. Within 150px of the pointer they light to the glow colour: blue in dark mode at 60%, yellow `#E3C26B` in light mode at 85%, for the deepest marker. Deeper markers light more strongly: `DepthGlow` sets `--depth-light` on each marker from its numeral, from 40% of that strength at the shallowest to 100% at the deepest. The glow runs only on devices with a fine pointer (`hover: hover` and `pointer: fine`); touch screens see the faint marker only. The rules are `DepthGlow` and the `.home .pit` rules in `home.css`.
- The top ruler is in pixels: a tick every 32px and a number every 160px.
- The left ruler is in metres: a tick every 10 m, a number every 50 m, and a heavier mark at each depth strip. Markers are pinned to those strips.

## Grain and paper

- The film grain is one full-screen canvas (`NoiseGrain`) at opacity 0.33 (`grain.css`). It is redrawn every 100ms from a 512px noise tile and never takes pointer input.
- Under reduced motion the grain draws one still frame.
- The grain is the only texture. Do not add paper images or gradients.

## Icons

- Icons are 32 by 32 transparent pixel PNGs in `apps/landing/public/loadout/sprites/`, with ink outlines and a yellow fill. They render with `image-rendering: pixelated`. Never smooth or filter the files.
- The homepage uses them as SVG symbols defined in `art.ts` (`ICON_SPRITE`). To add an icon, add its name to `SPRITE_NAMES` and add its PNG.
- In dark mode the icons are turned blue by a CSS hue rotation (`hue-rotate(170deg) saturate(.95)`). In light mode they show as drawn.
- The Bolt currency icon (`bolt.png`) nudges on its card. The owner's original `bolt.svg` stays unchanged.
- The hero scenery vectors under `hero/scenery/` and the 31 `hero-workshop` PNGs are kept but not rendered. Do not wire them in without a new owner decision.

## ASCII art

- Decorative ASCII fields (`AsciiField`) use JetBrains Mono. Each has a faint base layer and a brighter copy that is revealed around the pointer.
- The art drifts slowly, over about 11 to 13 seconds per cycle, and stops under reduced motion.
- Fields are `aria-hidden`, do not take pointer input in sections, and are hidden on small screens.

## Motion

- Easing is `cubic-bezier(.22, 1, .36, 1)` (`--ease`). Nothing bounces.
- Hero entrance: the title drops and scales from 85% to 100% over 800ms, and the badge and copy follow. The title scrambles while it settles, and each letter takes its real place.
- Sections and cards reveal as they enter the view.
- The hero facts scramble on hover.
- The navigation hides on scroll down and returns on scroll up. Smooth scrolling stays under the user's control.
- Under `prefers-reduced-motion: reduce`, entrances, reveals, scrambles, the ASCII drift, nudges and smooth scrolling all stop. Content stays fully usable.

## Accessibility

- The browser suites run axe checks on the homepage and the Docs (`e2e/homepage.spec.ts` and `e2e/docs.spec.ts`). A new colour must pass them in both themes.
- The real text is always in the page. Scrambled letters are decorative, and the heading keeps its real text as its accessible name while it runs.
- Rulers, grain, ASCII art and decorative icons are `aria-hidden`.
- Every control is reachable by keyboard and shows a visible focus state.

## Voice

Plain, technical and direct, written for builders. Short sentences. No decorative dashes. Do not invent dates, prices, eligibility or participant numbers. Keep a control's label the same across the nav, the button and the page it opens. Program facts come from the plans.

## Retired (do not bring back)

- The beige-only page, with `#DDD3BF` as the only theme.
- Barlow Condensed body text. The font files are not shipped.
- The 2026-10-04 muted-grey palette (`#E8E9E6` canvas).
- The warm-charcoal dark theme (`#141210`).
- The yellow dark accent (`#E3C26B` or `#E0BD55` in dark mode). Dark accent is blue.
- The pixel-tile grain and the desaturated icons in dark mode.

## Where things are

- Product facts: `plans/`.
- Design briefs: `.ulpi/design/`. Only the entrypoint `DESIGN.md` and the design index's "current" rows are current. The rest are records.
- Asset mapping and sources: [`docs/design/asset-catalog.md`](../asset-catalog.md).
