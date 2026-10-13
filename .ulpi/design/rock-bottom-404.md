# Rock bottom: the 404 and cave-in pages

Status: implemented on the site-polish branch, awaiting owner check.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md).

## Design read

A wrong address is the bottom level of the mine: the last depth marker, deeper than anything on the sheet, as big as the window. The whole page is one survey-sheet depth marker (`−1404 M`, deeper than the homepage's deepest marker, `−900 M`; "Sohle" is the German word for a mine's bottom level) lit by a miner's lamp in a very dark mine. It says one honest thing, once, and gives the way back: the only way back is up. The owner asked for it simple, cool, dark and without scrolling: no sprites, no corner brackets, one screen, near-black rock and a glitch.

Direction: industrial and signage, as locked in DESIGN.md. Counterfactual test: swap the depth marker and the German level names for a robot or an astronaut and it becomes any site's 404. The lamp in the near-black rock, the numeral that falls to rock bottom and the glitch when it lands are the identity.

## Scope

- In: `app/not-found.tsx` (unknown URLs and unknown docs slugs, which share it), `app/error.tsx` (a runtime error, "Einsturz" / cave-in), the nav's anchors working off the homepage, a shared page shell (`RockBottom`) and the falling numeral (`DepthNumeral`).
- Out: a `global-error.tsx`, a per-section 404, any redirect or search suggestion logic, any copy about the program, any sprite art, corner brackets on this page.

## States

| State | What shows |
|---|---|
| 404 | Tag "SOHLE · ERROR 404", title "Sorry, you’ve hit rock bottom.", the requested path, the two buttons, and the `−1404 M` numeral behind them. Real 404 status, `noindex`. |
| 404 under `/docs/…` | The same page. A docs 404 does not show the docs shell. |
| Cave-in (error) | Tag "EINSTURZ · CAVE-IN", title "Something caved in.", a "Try again" button that calls `reset`, and the `−500 M` numeral. |
| Falling | On load the numeral counts from `−0 M` to its depth in 1.8 s, speeding up, at 11% ink. `data-falling` is set while it counts. |
| Landed | One 8 px thud (0.24 s, two steps), then the numeral fades to its resting ink over 0.9 s. `data-landed` stays set. |
| Glitch | When the depth lands, each title line tears sideways and splits into the accent and the paper colour for about a third of a second, in steps, with a short repeat half a cycle later. Then it repeats every 8 s. |
| Lamp, no pointer yet | The lamp pool sits in the middle of the page (50% across, 46% down). On touch screens it sways between 34% and 66% across (9 s, alternating). |
| Lamp, fine pointer | The pool follows the pointer (300 px radius). It lights the hatching, the numeral and the ore flecks. |
| Requested path | Server render has no path; the client fills it in after hydration. If it is empty the line reads "Nothing is down here." |
| Light and dark | Both themes through the existing tokens. The dark theme is near black (`#0e1112`) so the lamp is the only light; the light theme keeps the paper and darkens only the rim. The theme toggle in the nav works. |
| Touch | The numeral rests at 6% ink and the flecks stay faintly visible. Nothing depends on hover. |
| Reduced motion | No fall, no thud, no sway, no glitch: the final depth shows at once (`data-landed` is set immediately) and the lamp stays in the middle. |
| No JavaScript | The final depth, heading, copy and both links are server-rendered. |

## Layout and copy

One screen, never scrolling: the page is `100svh`, the hero block is centred in it, and the title shrinks with the window height (`9.4vh` cap). The rock face is a `.pit` marker that fills the page behind the copy; a radial rim darkens the edges.

- Tag: `SOHLE · ERROR 404`.
- Title: `Sorry, you’ve hit rock bottom.` (uppercase, two lines).
- Type: the tag, title and buttons are set in Jersey 10 (`--font-display`), an owner-requested exception to the Pixelify headings and buttons of the design system: Pixelify's C closes into an O at these sizes ("ROOK BOTTOM", "BAOK") and its E, Z and 0 are hard to tell apart in the small tag. The depth numeral stays Pixelify.
- Lead: `Nothing is down here at /the-path. You dug past everything we built. The only way back is up.`
- Buttons: `BACK TO THE SURFACE ↑` (primary, to `/`) and `READ THE GUIDES` (to `/docs`). No corner marks on this page.
- Numeral: `min(22vw, 48vh)` tall, centred behind the copy. Thirteen ore flecks at the edges, none behind the text.
- Slim line, bottom centre: `Glück auf! LOADOUT, Revier edition`.
- Cave-in copy: tag `EINSTURZ · CAVE-IN`, title `Something caved in.`, lead `That one is on us. Try again, or head back up to the surface.`, buttons `TRY AGAIN ↻` and `BACK TO THE SURFACE ↑`, numeral `−500 M`.

## Components

- `RockBottom` (server-safe shell): nav, theme switch, grain, the rock face and the hero block. Takes `variant` (`"lost"` or `"cave-in"`), the lead and the action buttons.
- `DepthNumeral` (client): renders the final depth, then writes the falling value into its text node from `requestAnimationFrame` (no React re-render). Its first frame runs after `DepthGlow` has read the final depth.
- `RequestedPath` (client): `useSyncExternalStore` on `location.pathname`, escaped text, long paths wrap and are cut at 80 characters.
- `SiteNav` gets an anchor base so its links go to `/#tracks` and the logo to `/` off the homepage.
- `DepthGlow` (existing) drives the lamp: the rock face is a `.pit`, so it gets `--mx` and `--my` like the other markers.
- Custom properties are prefixed `--rb-`: the homepage registers `--d` as an integer and a clash silently breaks values.

## Interaction and motion

- The fall is the one entrance. It ends in one thud on the numeral only; the text and buttons never move.
- The glitch is two transforms and a `text-shadow` on the real title lines, in the site's accent and paper colours (no neon, no duplicated text for screen readers). It starts only when the depth has landed.
- The lamp follows the pointer without easing (the site's glow does the same). The touch sway is the only idle motion besides the glitch.
- Easing: the fall accelerates (`progress ** 2.4`), the fade-out is ease-out, the sway ease-in-out. The button press feedback is the site's.

## Responsive

- Verified without scrolling at 1440 by 900, 1366 by 768, 1280 by 720, 390 by 844 and 360 by 640.
- Phone: lamp radius 190 px, title scaled to two lines, buttons side by side.

## Accessibility

- One `h1`, a skip link, a `main` landmark, the nav landmark. The rock face (numeral and flecks), the tag plate's hatching and the lamp are `aria-hidden` decoration and carry no information the title does not.
- The title, lead and buttons use the normal text colours (full contrast; higher on the near-black dark theme). The lit numeral is kept to 36% (42% light) so the title stays the first read. The glitch is a short burst (about 0.3 s) and never runs under reduced motion.
- Focus rings are the site's. `Try again` is a real `button`.
- The status is a real 404 and the page is `noindex`.

## Skills

Loaded for this change: `frontend-design-ui-ux` (this spec), `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites` and `pixel-art-animator`. An earlier version used a helmet and pickaxe from the icon pack and then a bottom band; the owner asked for the sprites and the brackets out and the lamp in the middle, so no sprite work remains. The animator's frame and Aseprite tools were not available.

## Acceptance

1. An unknown URL and an unknown docs slug return status 404 and show the title, the requested path, and links to `/` and `/docs`.
2. Both themes render the `−1404 M` numeral and thirteen ore flecks, and there are no corner brackets (`.frame-corner`, `.mc-c`). The dark theme's background is `rgb(14, 17, 18)`.
3. The page does not scroll at 1440×900, 1366×768, 1280×720, 390×844 and 360×640, and both buttons are fully in view.
4. The lamp starts in the middle (`at 50% 46%`) and follows the pointer (`--mx` follows `clientX`).
5. The nav links off the homepage go to `/#…` and the logo goes to `/`.
6. Without reduced motion the numeral counts up from `−0 M` to `−1404 M` and lands; with reduced motion it shows `−1404 M` at once and nothing animates.
7. The cave-in view shows its message and a `Try again` button that calls `reset`.
8. No axe violations on the 404 in either theme.
9. The tag, title and buttons use the display face (`--font-display`, Jersey 10), so every C is open.
10. The lead says "The only way back is up." The title lines animate (`rb-glitch-a`, `rb-glitch-b`) only after the depth has landed and never under reduced motion.
