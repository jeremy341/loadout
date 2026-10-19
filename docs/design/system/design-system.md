# LOADOUT design system

**Status:** Current visual authority for the homepage and the Docs. Updated against `apps/landing` on 2026-10-18. Product facts stay in the canonical plans; this file defines presentation only.

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
- Shared display preferences live in `app/_components/display-preferences.ts`. The normal appearance remains the default. A persistent Accessibility tab and footer links open a native settings dialog. On the homepage, the tab sits below the navbar on the left. In Docs the default floating tab stays unchanged. Enlarged text or wider spacing docks it in the directory header so it cannot cover reading content. On phones it normally retracts while scrolling down and returns at the top, on scroll-up or keyboard focus; the page does not reserve a left gutter for it. With 150/200% reading size on phones, floating shortcuts move out of reading copy: Accessibility remains reachable from the menu or keyboard focus, and the Docs shortcut sits in normal page flow. The homepage mobile menu and Docs Guides drawer also link to Accessibility. `/accessibility` supplies a full-page fallback and support statement. Color-vision palettes (Standard by default, Protanopia, Deuteranopia, Tritanopia and Achromatopsia), Phantom Sans typography (off by default), reading size up to 200%, wider spacing, larger controls, stronger contrast, system cursor, text-link underlines, Reduce motion, independent decoration choices and native scrolling are optional and persist when storage is available. Grain offers Animated, Still and Off, migrating the former Hide grain choice. Reduced motion and the OS `prefers-contrast: more` setting are honored automatically; Hide background grid, Hide ASCII drawings, Hide mascot and Hide extra markings are separate choices. Grain remains independent; hiding the mascot stops its engine and hiding ASCII stops its pointer effects. Saved Simplify decoration choices migrate to these controls and can be reversed independently. Appearance, Reading and Effects use ruled native disclosures in the modal and on narrow screens. Above 820px the default accessibility page uses a vertical category rail and one labelled settings panel, with arrow-key, Home and End navigation. Enlarged text or wider spacing switches to full-width horizontal categories with Left/Right keys, avoiding broken labels and a narrow settings column. Its compact header aligns the title with Back; a help row and expandable accessibility statement sit below the settings. The color-vision selector and squared switches and radio controls are shared by the dialog and fallback page. Close stays in the fixed dialog header while the controls scroll. At larger text sizes or with wider spacing, settings rows put the title and switch above a full-width description; choices wrap into a grid. On narrow screens with 150/200% text, the visible modal title is shortened to Settings while its accessible name remains Accessibility settings. Homepage grids reduce their column count and Docs moves its contents rail into the article before the reading column becomes cramped. These opt-in layouts live in app/preference-layout.css. Enlarged phone reading layouts keep the one-row navbar, use a full-width left-aligned hero lead with a shorter equivalent introduction, and keep the selected text size and spacing. Short landscape dialogs remove decorative header copy to leave room for usable controls. Reset changes only display preferences. The shortcut follows the skip link in keyboard order, and the dialog closes with Escape, Close or a complete outside click, returning focus to its opener. The theme checkbox remains beside its visible navbar/sidebar label in keyboard order.

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
- The homepage cursor is a pixel arrow with a pointing hand for links, in the same two colours (`app/cursor.css`): blue fill in dark mode, yellow in light mode, fine pointers only. The homepage settings modal and shortcut use the same cursor, including nested labels and controls. Use system cursor restores native pointers; forced colors and coarse pointers stay native. The Docs and the 404 page keep the system cursor. A pixel Maulwurf mascot in a miner's helmet (`app/_components/mole/`, `.ulpi/design/mole.md`) turns up at the bottom of the homepage now and then; it can be petted, picked up and annoyed, and the footer button hides it for good. It is the same in both themes and is decoration only.
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

Track and process-card titles are semantic h3 headings with the existing `.cn` typography. `semantics.css` resets heading margins to match their former div layout; heading semantics must not change the visible design.

| Role | Font | Where |
| --- | --- | --- |
| Wordmark | Jersey 10 (`--font-display`) | The LOADOUT logo text, the nav logo (36px) and the Docs brand |
| Headings | Pixelify Sans 400 to 700 (`--font-pixel`) | Homepage headings and card titles. Docs h1 46px/700, h2 30px/600, h3 14px uppercase/600 |
| Buttons | Pixelify Sans | Homepage buttons (the hero and nav buttons were checked) |
| Body and lead | IBM Plex Mono 400 and 600 (`--font-ui`) | Homepage body text, leads, notes, nav links (11px), hero side labels (14px) and depth markers |
| Rulers | DotGothic16 (`--font-dot`) | Ruler numbers (11px) |
| ASCII art | JetBrains Mono (`--font-mono-art`) | ASCII fields, loaded through `next/font/google` |
| Docs body | Poppins 400, 500 and 600 (`--font-poppins`) | The Docs only, loaded in `docs/layout.tsx` |
| Optional readable mode | Phantom Sans | Loaded locally only when the visitor enables the font preference |

Rules:

- Pixel fonts are for signage: headings, buttons and the wordmark. IBM Plex Mono is for reading. Do not set two pixel fonts in one heading.
- The optional Phantom Sans setting applies the readable and display font stacks to all site text and controls. The default font setting remains unchanged and ASCII illustration stays monospaced.
- Homepage section headings are pixel, uppercase, 44px on desktop. Leads are 16px with a 1.65 line height, centred under the heading and no wider than 720px.
- Essential body copy is 16px. Do not shrink it to fit.
- Fonts are self-hosted, except JetBrains Mono and Poppins, which load through the framework, with `display: swap`.
- The scramble on the hero title measures its letters only after the pixel font has loaded.
- `PixelifySans.ttf` is a patched copy of the stock font: the capital C and the lowercase c have a wider opening, because in the stock font a C differs from an O only by a one-pixel notch that shrinks to a hairline in the bold weights ("ROCK" read "ROOK"). Nothing else in the font changed, and the advance widths are identical, so no text reflows. The stock font and the script that makes the patched one are in `assets/editable/fonts/` (brief: `.ulpi/design/pixel-font-open-c.md`). Regenerate with `python assets/editable/fonts/patch-pixelify-c.py` and check with `--check`.

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
- At normal text settings, the phone navbar keeps the full logo, menu, theme chooser and RSVP on one row across 320–430px phone widths. It uses an 8px outer inset and compact horizontal spacing; the wordmark scales from 26px at 320px to 31px at 390px. Controls remain at least 44px tall. Increased text size or spacing can reflow the bar, and the hero reserves space based on its measured height.
- Focus is a visible `:focus-visible` outline in the accent colour, offset 2 to 3px. Never remove it.

## Depth markers and rulers

- A depth marker divides two sections: two dashed rules over a hatched band, with the depth numeral on the left (for example "−300 M") and a label on the right in Jersey 10, the wordmark face (for example "1. SOHLE / LEVELS & REWARDS", up to 44px on desktop, down to 28px on tablets and 20px on phones). Both the numeral and label use text-clipped backgrounds, leaving the hatching visible behind them without a solid plate.
- The hatching, the numeral and the label are faint at rest: the hatching at 6% of the rule colour, the numeral and label at 3% of the text colour. Within 150px of the pointer they light to the glow colour: blue in dark mode at 60%, amber-red `#D9661F` in light mode at 85%, for the deepest marker. Deeper markers light more strongly: `DepthGlow` sets `--depth-light` on each marker from its numeral, from 40% of that strength at the shallowest to 100% at the deepest. The glow runs only on devices with a fine pointer (`hover: hover` and `pointer: fine`); touch screens see the faint marker only. The rules are `DepthGlow` and the `.home .pit` rules in `home.css`.
- The top ruler is in pixels: a tick every 32px and a number every 160px.
- The left ruler is in metres: a tick every 10 m, a number every 50 m, and a heavier mark at each depth strip. Markers are pinned to those strips.
- Homepage depth navigation uses the same metre stops as the ruler. On wide, tall screens it sits in the left gutter; on narrower or short screens it becomes a compact bottom-left section picker beside the Docs tab. The current stop has a visible accent marker and `aria-current="location"`. Links retain native section hashes; the compact list has bounded internal scrolling, keyboard focus and Escape behavior. Absent sections are omitted without renumbering later depths. These controls describe page position, not live program progress (brief: `.ulpi/design/homepage-copy-depth-navigation.md`).
- The homepage gets darker the deeper you scroll (`app/depth-dark.css`, brief `.ulpi/design/depth-darkness.md`). One fixed, `aria-hidden` layer behind the content follows the scroll position through a CSS scroll-driven animation: nothing at the top, the full shade at the footer. In the dark theme the shade ends near the 404's black (`#0e1112`) with a darker rim; in the light theme the paper stays and only the rim deepens. It darkens the backdrop, never the text or the cards. A browser without scroll-driven animations shows the page as before. The 404, the cave-in page and the Docs do not use it.

## Grain and paper

- The film grain is one full-screen canvas (`NoiseGrain`) at opacity 0.33 (`grain.css`). It is redrawn every 100ms from a 512px noise tile and never takes pointer input.
- Under reduced motion the grain draws one still frame.
- The grain is the only texture. Do not add paper images or gradients.

## Corner brackets

- Section headings (`.home .sect > .h2`) carry four registration marks: 16 pixels long, 2 pixels thick, in the ink colour (`--fg`), just outside the heading's text. The heading box is `fit-content`, so the marks hug the text and the layout does not move.
- The hero frame uses the same ink corners. The hero buttons use the magnetic version (`MagneticCorners`): accent-coloured, they open and lean toward a fine pointer within 40 pixels. Touch and reduced motion get the static marks.
- Do not add marks to cards, nested panels or every button. The marks are a heading device: one per section.

## Logo

- The mark is a miner's helmet from the one-bit icon pack (the owner confirmed it can be used) on an octagon plate, 24 by 24 pixels (`Logo.tsx`). It is drawn as four SVG paths and shown at 24 pixels, so each mark pixel is one site pixel. Beside it the name is real text in Jersey 10.
- The plate is the theme's accent (`--logo-bg`), the outline is ink (`--logo-fg`) and the helmet is the paper colour (`--logo-fill`: `--fg` in dark mode, `#FBF3E4` in light mode).
- On hover, with a fine pointer and no reduced-motion request, the helmet's lamp blinks once. Nothing else moves.
- The favicon (`icon.svg`) and the Apple touch icon (`apple-icon.png`) use the miner's helmet mark. The 1200 by 630 share images (`opengraph-image.jpg`, also served as `twitter-image.jpg`) preserve main's original background, blue label, grain/grid, corner marks, rulers and depth strip. The helmet is removed from the card; the owner's silver wordmark with dirt-colored details is enlarged and centered, with Jersey 10 tagline and track names below. The depth-strip readout is softened to keep the wordmark first in the hierarchy. Keep each file under 300 KB. Source assets and the repeatable export script are in `assets/editable/logo/`; the scoped brief is `.ulpi/design/share-preview.md`.

## Error pages

- An unknown address and an unknown docs page share one 404 (`app/not-found.tsx`); a failed render shows the cave-in page (`app/error.tsx`). Both are one screen with nothing to scroll: the hero's tag, title, copy and buttons (no corner brackets) over a page-sized depth marker. The depth numeral sits behind the copy (`−1404 M`, deeper than the deepest homepage marker; the cave-in page is at `−500 M`), ore flecks sit at the edges, and the rim is dark. The dark theme is near black (`#0e1112`) on these pages, so the lamp is the only light.
- The 404 says the requested path, offers "Back to the surface" and "Read the guides", sends a real 404 status and `noindex`. The cave-in page has a "Try again" button.
- Exception to the type roles: on these pages the tag, title and buttons are set in Jersey 10 (the wordmark face), not Pixelify Sans. It was chosen when Pixelify's C closed into an O ("ROOK BOTTOM"; the C is open now), and Jersey also keeps the E, Z and 0 distinct in the small tag, where Pixelify's read as a backwards 3, a 2 and an O. Everything else on these pages follows the usual roles.
- The miner's lamp is the depth glow at a larger radius (300 px, 190 px on phones). It starts in the middle of the page, follows a fine pointer, and sways gently on touch screens. When the page opens the numeral falls from `−0 M` to its depth (1.8 s, speeding up), lands with one thud and fades back to 3% ink, and the title glitches for about a third of a second (a tear and a split into the accent and paper colours) then again every 8 seconds. Reduced motion shows the final depth at once, keeps the lamp still and never glitches.

## Icons

- Icons are 32 by 32 transparent pixel PNGs in `apps/landing/public/loadout/sprites/`, with ink outlines and a yellow fill. They render with `image-rendering: pixelated`. Never smooth or filter the files.
- The homepage uses them as SVG symbols defined in `art.ts` (`ICON_SPRITE`). To add an icon, add its name to `SPRITE_NAMES` and add its PNG.
- In dark mode the icons are turned blue by a CSS hue rotation (`hue-rotate(170deg) saturate(.95)`). In light mode they show as drawn.
- The Ore currency icon (`ore.png`, the gem) nudges on its card. The owner's original `bolt.svg` is not shown anywhere and stays unchanged.
- The hero scenery vectors under `hero/scenery/` and the 31 `hero-workshop` PNGs are kept but not rendered. Do not wire them in without a new owner decision.

## ASCII art

- Decorative ASCII fields (`AsciiField`) use JetBrains Mono. Each has a faint base layer and a brighter copy that is revealed around the pointer.
- The art floats through 36px of vertical travel. Each drawing has its own 8 to 10.7 second period per direction and a negative phase offset; initial directions are mixed so the drawings do not move in sync. Both layers move together, and the animation stops under reduced motion (brief: `.ulpi/design/ascii-float-preview.md`).
- Fields are `aria-hidden`, do not take pointer input in sections, and are hidden on small screens.

## Motion

- Easing is `cubic-bezier(.22, 1, .36, 1)` (`--ease`). Nothing bounces.
- Hero entrance: the title drops and scales from 85% to 100% over 800ms, and the badge and copy follow. The title scrambles while it settles, and each letter takes its real place.
- Sections and cards reveal as they enter the view.
- The hero facts scramble on hover.
- The navigation hides on scroll down and returns on scroll up. Smooth scrolling stays under the user's control.
- Under `prefers-reduced-motion: reduce`, entrances, reveals, scrambles, the ASCII drift, nudges and smooth scrolling all stop. Content stays fully usable.
- The explicit Reduce motion setting also stops those effects and the prize belt while the user continues using the page. Device reduced motion is always respected. With both preferences off, the existing effects continue unchanged.

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
