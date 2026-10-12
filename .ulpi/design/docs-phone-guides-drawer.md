# Docs on phones: Guides drawer

Status: implemented locally. The icons await licence confirmation before any commit. Scope: the LOADOUT Docs routes (`/docs/...`) at 820px wide and below. Desktop is unchanged.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md). Supersedes the in-page "Guides" row and the Topics sheet from this session (both were built and rejected).

## Design read

A field manual's index card, pulled out of the binder when you need it. The guide list is reference material: it stays out of the way and opens on a single tap.

## Direction

Industrial and signage, inherited from DESIGN.md. Hard 2px rules, block shadows, square corners, pixel display type. The drawer is a plain panel with a rule on its edge, not a floating card, not a glass sheet, not a centred dialog.

Counterfactual test: a sheet that slides over the page with a dim scrim is the common mobile pattern. It is acceptable here only because the drawer is the directory itself, in the desktop sidebar's own markup and styling, and it closes on every route change. It must not become a generic modal (no centred dialog, no rounded corners, no shadowed floating card).

## User flow

1. Phone user lands on a guide. The guide's title is the first thing on screen under a slim bar (brand, theme switch, and one icon button).
2. Taps the book icon (labelled "Guides"). The drawer slides in from the left, 340px or 88% of the width, whichever is smaller. A scrim dims the page.
3. Inside the drawer, in order: a header row ("Guides" and a close X), the back link "← BACK TO LOADOUT", the search field, then the sections with their guides. The section with the current guide starts open.
4. Chooses a guide: the route changes, the drawer closes, focus returns to the book icon, the new guide starts at the top.
5. Or taps the back link: goes to the homepage (`/`).
6. Or closes without choosing: the X, a tap on the scrim, or Escape. Focus returns to the book icon.

Route changes, including Previous and Next, always close the drawer.

## States

| Element | Rest | Hover | Pressed | Focus-visible | Expanded |
| --- | --- | --- | --- | --- | --- |
| Guides button | panel-2 fill, 2px/4px stroke, ink icon | ink fill, bg icon, lifts 2px | border-bottom 2px, moves down 2px | 3px ink outline, 3px offset | accent fill, acf icon |
| Close X | same as Guides rest | same | same | same | n/a |
| Drawer | hidden (`visibility: hidden`, out of tab order) | n/a | n/a | n/a | slides in, visible |
| Scrim | hidden | n/a | n/a | n/a | black at 50%, click closes |
| Back link, search, section links | as desktop | as desktop | as desktop | as desktop | n/a |

Motion: the drawer slides over 220ms on the iOS-style curve `cubic-bezier(0.32, 0.72, 0, 1)` (emilkowal `ease-ios-drawer`). Closing slides out the same way and hides after the slide. Reduced motion: no slide, instant show and hide. Nothing animates on keyboard-initiated opening beyond the slide itself, which is one short movement.

## Icons

Two one-bit icons from the local pack, drawn 16×16 and displayed at 32×32 (exactly 2×, so the pixels stay square):

- `public/loadout/icons/docs-guides.png`: the open book (Guides button).
- `public/loadout/icons/docs-close.png`: the X (close button).

They are drawn with a CSS mask filled with `currentColor`, so they follow the text colour in both themes. The source is white on transparent and would vanish on the beige light theme without the mask. Icons are decorative (`aria-hidden`); the button's accessible name carries the meaning.

Licence: the pack came from `Downloads/1-bit_Pixel_Icons.zip`, which has no licence file. The files are for review until their provenance is confirmed. Do not commit them to `main` before that.

## Responsive behaviour

- ≤ 820px: slim top bar (brand, theme switch, book button). Drawer as described. Article full width with `padding: 28px 20px 72px`.
- ≤ 370px: the wordmark's "LOADOUT" word is visually hidden (the link keeps its accessible name); the bar still fits 320px.
- > 820px: the sidebar is in the grid as before. The book button, the drawer header and the scrim are hidden.

## Accessibility

- The book button is a `button` named "Guides" with `aria-expanded` and `aria-controls="docs-guides"`.
- The drawer is `visibility: hidden` when closed, so its links are not focusable and not announced. When open, focus moves to the close X.
- Escape closes the drawer and returns focus to the book button. Closing by scrim or X also returns focus.
- The scrim is a `button` with `tabIndex={-1}` and `aria-hidden`; it exists only as a pointer target.
- Touch targets: 44×44px for the book button and the X; links keep their 44px minimum.
- Contrast: ink on panel-2 is well above 4.5:1 in both themes. The accent fill (expanded state) pairs with the acf colour, as elsewhere in the docs.
- Keyboard: Tab order inside the open drawer follows the visual order. Focus is not trapped in v1 (see Known gaps).

## Known gaps

- Resolved: Tab wraps inside the open drawer. While it is open, the page behind it is `inert`.
- Resolved: Escape clears the search query when there is one; a second Escape (or any Escape with an empty query) closes the drawer.

## Acceptance criteria

1. At 390px, the guide title is in view on load and the book button reads "Guides" with `aria-expanded="false"`.
2. Opening the drawer does not move the article (the title's position is unchanged) and moves focus to the X.
3. The back link "← BACK TO LOADOUT" goes to the homepage.
4. Choosing a guide closes the drawer and loads that guide.
5. The X, a scrim click and Escape each close it and return focus to the book button.
6. At 320px the bar fits: the book button and the theme switch stay inside the screen.
7. The drawer passes the axe scan (no serious or critical violations) while open.
8. At 1440px the sidebar is unchanged and the book button is not rendered visibly.
9. Tab and Shift+Tab stay inside the open drawer.
10. Escape with a search query clears it and keeps the drawer open; Escape again closes the drawer.

## Build handoff

Built in this session against this brief, by the same agent that wrote it. The `docs-shell.tsx`, `docs.css` and `docs.spec.ts` changes implement it exactly; nothing here authorises a redesign of the desktop sidebar.
