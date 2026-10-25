# Site navigation record

Merged on 25 Oct 2026 from 6 design briefs. Each section keeps its original text. Only the design system and the code are current; a brief records what was decided and built.

## Restore the compact mobile navbar

_Merged from `mobile-nav-single-row.md`._

### Problem and scope

The accessibility patch in home.css forces the logo and menu onto one row and `.nav-actions` onto another below 420px. The owner wants the normal phone navigation back on one row. Retain the current industrial field-manual typography, colors, borders and controls.

### Behavior and implementation direction

- Keep the current logo, hamburger, theme chooser and RSVP together at normal text settings from 320px through 420px, including 360px, 375px and 390px. Preserve the full wordmark if practical.
- Remove the forced full-width action row, its ordering overrides and the forced 180px hero clearance. Keep the existing ResizeObserver-based clearance so content follows actual navbar height.
- Use mobile-only spacing, horizontal padding and, only if needed at the narrowest widths, a compact wordmark size. Keep controls at least 44px tall and the menu at least 44px square. Theme and RSVP heights must match.
- Keep flexible reflow for increased text size or user letter/word spacing. Do not force nowrap globally, clip controls, truncate the RSVP or disable zoom. The normal state is one row; genuinely enlarged content may wrap.
- Do not change desktop presentation, theme ownership, menu logic, hide-on-scroll, focus handling or Docs navigation.

### Acceptance and verification

Measure default navbar controls at 320/360/375/390/420/430px: logo, menu, theme and RSVP must have a common vertical center, remain inside the navbar and not overlap. Keep the existing accessibility text-spacing check, theme/RSVP height check and mobile-menu keyboard behavior passing. Inspect mobile screenshot evidence if available. Changes stay local; no commit, branch switch, Slack message or publication.

### Ownership

A UI engineer implements only home.css and the appropriate existing navigation regression test in accessibility.spec.ts. Primary agent owns this brief and integration checks. Preserve existing unrelated edits to home.css.


## Docs on phones: Guides drawer

_Merged from `docs-phone-guides-drawer.md`._

Status: implemented locally. The icons await licence confirmation before any commit. Scope: the LOADOUT Docs routes (`/docs/...`) at 820px wide and below. Desktop is unchanged.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md). Supersedes the in-page "Guides" row and the Topics sheet from this session (both were built and rejected).

### Design read

A field manual's index card, pulled out of the binder when you need it. The guide list is reference material: it stays out of the way and opens on a single tap.

### Direction

Industrial and signage, inherited from DESIGN.md. Hard 2px rules, block shadows, square corners, pixel display type. The drawer is a plain panel with a rule on its edge, not a floating card, not a glass sheet, not a centred dialog.

Counterfactual test: a sheet that slides over the page with a dim scrim is the common mobile pattern. It is acceptable here only because the drawer is the directory itself, in the desktop sidebar's own markup and styling, and it closes on every route change. It must not become a generic modal (no centred dialog, no rounded corners, no shadowed floating card).

### User flow

1. Phone user lands on a guide. The guide's title is the first thing on screen under a slim bar (brand, theme switch, and one icon button).
2. Taps the book icon (labelled "Guides"). The drawer slides in from the left, 340px or 88% of the width, whichever is smaller. A scrim dims the page.
3. Inside the drawer, in order: a header row ("Guides" and a close X), the back link "← BACK TO LOADOUT", the search field, then the sections with their guides. The section with the current guide starts open.
4. Chooses a guide: the route changes, the drawer closes, focus returns to the book icon, the new guide starts at the top.
5. Or taps the back link: goes to the homepage (`/`).
6. Or closes without choosing: the X, a tap on the scrim, or Escape. Focus returns to the book icon.

Route changes, including Previous and Next, always close the drawer.

### States

| Element | Rest | Hover | Pressed | Focus-visible | Expanded |
| --- | --- | --- | --- | --- | --- |
| Guides button | panel-2 fill, 2px/4px stroke, ink icon | ink fill, bg icon, lifts 2px | border-bottom 2px, moves down 2px | 3px ink outline, 3px offset | accent fill, acf icon |
| Close X | same as Guides rest | same | same | same | n/a |
| Drawer | hidden (`visibility: hidden`, out of tab order) | n/a | n/a | n/a | slides in, visible |
| Scrim | hidden | n/a | n/a | n/a | black at 50%, click closes |
| Back link, search, section links | as desktop | as desktop | as desktop | as desktop | n/a |

Motion: the drawer slides over 220ms on the iOS-style curve `cubic-bezier(0.32, 0.72, 0, 1)` (emilkowal `ease-ios-drawer`). Closing slides out the same way and hides after the slide. Reduced motion: no slide, instant show and hide. Nothing animates on keyboard-initiated opening beyond the slide itself, which is one short movement.

### Icons

Two one-bit icons from the local pack, drawn 16×16 and displayed at 32×32 (exactly 2×, so the pixels stay square):

- `public/loadout/icons/docs-guides.png`: the open book (Guides button).
- `public/loadout/icons/docs-close.png`: the X (close button).

They are drawn with a CSS mask filled with `currentColor`, so they follow the text colour in both themes. The source is white on transparent and would vanish on the beige light theme without the mask. Icons are decorative (`aria-hidden`); the button's accessible name carries the meaning.

Licence: the pack came from `Downloads/1-bit_Pixel_Icons.zip`, which has no licence file. The files are for review until their provenance is confirmed. Do not commit them to `main` before that.

### Responsive behaviour

- ≤ 820px: slim top bar (brand, theme switch, book button). Drawer as described. Article full width with `padding: 28px 20px 72px`.
- ≤ 370px: the wordmark's "LOADOUT" word is visually hidden (the link keeps its accessible name); the bar still fits 320px.
- > 820px: the sidebar is in the grid as before. The book button, the drawer header and the scrim are hidden.

### Accessibility

- The book button is a `button` named "Guides" with `aria-expanded` and `aria-controls="docs-guides"`.
- The drawer is `visibility: hidden` when closed, so its links are not focusable and not announced. When open, focus moves to the close X.
- Escape closes the drawer and returns focus to the book button. Closing by scrim or X also returns focus.
- The scrim is a `button` with `tabIndex={-1}` and `aria-hidden`; it exists only as a pointer target.
- Touch targets: 44×44px for the book button and the X; links keep their 44px minimum.
- Contrast: ink on panel-2 is well above 4.5:1 in both themes. The accent fill (expanded state) pairs with the acf colour, as elsewhere in the docs.
- Keyboard: Tab order inside the open drawer follows the visual order. Focus is not trapped in v1 (see Known gaps).

### Known gaps

- Resolved: Tab wraps inside the open drawer. While it is open, the page behind it is `inert`.
- Resolved: Escape clears the search query when there is one; a second Escape (or any Escape with an empty query) closes the drawer.

### Acceptance criteria

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

### Build handoff

Built in this session against this brief, by the same agent that wrote it. The `docs-shell.tsx`, `docs.css` and `docs.spec.ts` changes implement it exactly; nothing here authorises a redesign of the desktop sidebar.


## Rock bottom: the 404 and cave-in pages

_Merged from `rock-bottom-404.md`._

Status: implemented on the site-polish branch, awaiting owner check.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md).

### Design read

A wrong address is the bottom level of the mine: the last depth marker, deeper than anything on the sheet, as big as the window. The whole page is one survey-sheet depth marker (`−1404 M`, deeper than the homepage's deepest marker, `−900 M`; "Sohle" is the German word for a mine's bottom level) lit by a miner's lamp in a very dark mine. It says one honest thing, once, and gives the way back: the only way back is up. The owner asked for it simple, cool, dark and without scrolling: no sprites, no corner brackets, one screen, near-black rock and a glitch.

Direction: industrial and signage, as locked in DESIGN.md. Counterfactual test: swap the depth marker and the German level names for a robot or an astronaut and it becomes any site's 404. The lamp in the near-black rock, the numeral that falls to rock bottom and the glitch when it lands are the identity.

### Scope

- In: `app/not-found.tsx` (unknown URLs and unknown docs slugs, which share it), `app/error.tsx` (a runtime error, "Einsturz" / cave-in), the nav's anchors working off the homepage, a shared page shell (`RockBottom`) and the falling numeral (`DepthNumeral`).
- Out: a `global-error.tsx`, a per-section 404, any redirect or search suggestion logic, any copy about the program, any sprite art, corner brackets on this page.

### States

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

### Layout and copy

One screen, never scrolling: the page is `100svh`, the hero block is centred in it, and the title shrinks with the window height (`9.4vh` cap). The rock face is a `.pit` marker that fills the page behind the copy; a radial rim darkens the edges.

- Tag: `SOHLE · ERROR 404`.
- Title: `Sorry, you’ve hit rock bottom.` (uppercase, two lines).
- Type: the tag, title and buttons are set in Jersey 10 (`--font-display`), an owner-requested exception to the Pixelify headings and buttons of the design system: Pixelify's C closed into an O at these sizes ("ROOK BOTTOM", "BAOK"; fixed since, see [brand-and-type-record.md](brand-and-type-record.md)) and its E, Z and 0 are hard to tell apart in the small tag. The depth numeral stays Pixelify. Reverting these three to Pixelify is possible now that the C is open.
- Lead: `Nothing is down here at /the-path. You dug past everything we built. The only way back is up.`
- Buttons: `BACK TO THE SURFACE ↑` (primary, to `/`) and `READ THE GUIDES` (to `/docs`). No corner marks on this page.
- Numeral: `min(22vw, 48vh)` tall, centred behind the copy. Thirteen ore flecks at the edges, none behind the text.
- Slim line, bottom centre: `Glück auf! LOADOUT, Revier edition`.
- Cave-in copy: tag `EINSTURZ · CAVE-IN`, title `Something caved in.`, lead `That one is on us. Try again, or head back up to the surface.`, buttons `TRY AGAIN ↻` and `BACK TO THE SURFACE ↑`, numeral `−500 M`.

### Components

- `RockBottom` (server-safe shell): nav, theme switch, grain, the rock face and the hero block. Takes `variant` (`"lost"` or `"cave-in"`), the lead and the action buttons.
- `DepthNumeral` (client): renders the final depth, then writes the falling value into its text node from `requestAnimationFrame` (no React re-render). Its first frame runs after `DepthGlow` has read the final depth.
- `RequestedPath` (client): `useSyncExternalStore` on `location.pathname`, escaped text, long paths wrap and are cut at 80 characters.
- `SiteNav` gets an anchor base so its links go to `/#tracks` and the logo to `/` off the homepage.
- `DepthGlow` (existing) drives the lamp: the rock face is a `.pit`, so it gets `--mx` and `--my` like the other markers.
- Custom properties are prefixed `--rb-`: the homepage registers `--d` as an integer and a clash silently breaks values.

### Interaction and motion

- The fall is the one entrance. It ends in one thud on the numeral only; the text and buttons never move.
- The glitch is two transforms and a `text-shadow` on the real title lines, in the site's accent and paper colours (no neon, no duplicated text for screen readers). It starts only when the depth has landed.
- The lamp follows the pointer without easing (the site's glow does the same). The touch sway is the only idle motion besides the glitch.
- Easing: the fall accelerates (`progress ** 2.4`), the fade-out is ease-out, the sway ease-in-out. The button press feedback is the site's.

### Responsive

- Verified without scrolling at 1440 by 900, 1366 by 768, 1280 by 720, 390 by 844 and 360 by 640.
- Phone: lamp radius 190 px, title scaled to two lines, buttons side by side.

### Accessibility

- One `h1`, a skip link, a `main` landmark, the nav landmark. The rock face (numeral and flecks), the tag plate's hatching and the lamp are `aria-hidden` decoration and carry no information the title does not.
- The title, lead and buttons use the normal text colours (full contrast; higher on the near-black dark theme). The lit numeral is kept to 36% (42% light) so the title stays the first read. The glitch is a short burst (about 0.3 s) and never runs under reduced motion.
- Focus rings are the site's. `Try again` is a real `button`.
- The status is a real 404 and the page is `noindex`.

### Skills

Loaded for this change: `frontend-design-ui-ux` (this spec), `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites` and `pixel-art-animator`. An earlier version used a helmet and pickaxe from the icon pack and then a bottom band; the owner asked for the sprites and the brackets out and the lamp in the middle, so no sprite work remains. The animator's frame and Aseprite tools were not available.

### Acceptance

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


## Restore main's Era and footer revision panel

_Merged from `restore-main-era-footer.md`._

Status: owner-approved bounded restoration, 2026-10-16. Source: freshly fetched `origin/main`, commit `16ed4c3`. User explicitly limits this change to Era and footer; no other audit findings or prize strip changes.

### Design read and scope

Preserve LOADOUT's industrial field-manual identity, themes, type, motion and responsive behavior. Restore the existing main implementation, not a redesign. The current Era component already matches main; missing CSS declarations broke its centered two-column facts panel. Restore the exact main declarations that support that panel and its existing Era connector entrance. Scope the two-column rule to Eras so unrelated rows are unaffected.

Restore the complete `ft-sheet` metadata block from main (Project, Sheet, Rev, Year, Status) so the original two-column cell/border pattern works again. Existing footer CSS matches main. Keep current footer text, navigation, direct community/help links, team link and Orry controls outside this block.

### Behavior and accessibility

No new controls, states or assets. Keep main's existing mobile stacking, reduced-motion rules, semantic description list and decorative Era art. Match main's component and relevant CSS declarations; do not copy all of home.css or SiteFooter.tsx over the newer page. Preserve all other work. All seven UI skills have been consulted this session; no new vector, sprite or motion design is needed.

### Acceptance and handoff

The Era facts are centered at main's width with two equal joined columns on desktop and main's existing narrow-screen behavior. Footer metadata has main's exact markup with intact borders. Compare restored snippets against the fetched main commit, run focused lint/type checks, and inspect local desktop/mobile views. No test suites, commits, pushes, deployment or Slack messages.

Engineering owner: GPT-6 Luna at medium reasoning. Implement exactly this spec in apps/landing/app/home.css and apps/landing/app/_components/home/SiteFooter.tsx. Main's Eras.tsx is already identical, so do not manufacture an edit. Parent handles verification.

### Local verification

Restored locally. Era component matches fetched main after line-ending normalization; the footer metadata block matches main exactly. Era facts measure 900px total with two equal 450px columns at a 1280px viewport, and one 312px column at 375px. The footer panel is in normal flow on mobile. The current shorter footer introduction requires a 160px desktop minimum height so the restored metadata clears the links divider; measured clearance is 42px. Focused footer ESLint, typecheck and `git diff --check` pass. Preview uses the existing consolidated server at http://localhost:3000/. Captures are outside Git under `reports/restore-main-era-footer-2026-10-16/`. No tests, commits, pushes, deployment or messages.


## FAQ question readability

_Merged from `faq-question-readability.md`._

**Status:** Implemented.

### Design read

Keep the industrial field-manual identity and pixel display lettering. Give FAQ question labels slightly more tracking so the uppercase pixel font is easier to scan.

### Scope

- Surface: homepage FAQ accordion.
- Change: increase question letter spacing from `0.04em` to `0.09em` at every viewport width.
- States: collapsed and expanded questions use the same spacing; answer copy and accordion motion are unchanged.
- Responsive: retain the existing full-width, 56px minimum-height rows on desktop and mobile.
- Accessibility: preserve the existing button semantics, focus treatment, and reduced-motion behavior.

### Acceptance

Question labels are a little easier to read while the FAQ rows, content, and interactions remain visually consistent with the current design.


## Community channel links

_Merged from `community-channel-links.md`._

Status: owner-approved local implementation, 2026-10-16. The owner explicitly forbids sending messages; no Slack kickoff or post is authorized.

### Design read

Keep the existing industrial field-manual UI. This is a bounded navigation fix: turn the existing community/help references into usable links, without new artwork, motion, layout or product claims. The seven required UI skills were consulted in this session; vector, sprite and animation creation do not apply.

### Verified destinations

Read-only local-browser verification in Hack Club Slack:

- #loadout: https://app.slack.com/client/E09V59WQY1E/C0C5XUDMRH9
- #loadout-help: https://app.slack.com/client/E09V59WQY1E/C0C6XBLM0M7

Use normal HTTPS channel links. They open Slack's normal sign-in/channel flow and do not post or automatically join a channel. Do not expose message contents or private account information in the public site.

### Scope and interactions

- Give site configuration a verified default community URL, preserving its existing HTTPS validation and explicit override/disable semantics.
- Replace the footer's generic Slack destination with Join #loadout. Offer #loadout-help with the existing footer link styling.
- Make the homepage FAQ's existing #loadout-help mention a semantic anchor. Preserve its words, accordion state, animation, closed-panel inert behavior and no-script answer.
- In public Markdown, link every existing #loadout-help mention to the verified help URL. Do not alter other channel references or internal workflow documents.
- Keep same-tab navigation, existing link/focus styles, normal keyboard activation and mobile wrapping. No confirmation/loading/error UI is needed for a normal external link. Browser Back returns to LOADOUT.

### Acceptance and handoff

The footer, expanded FAQ and public Docs expose real anchors with recognizable labels. No message, reaction, invitation, membership action, commit, push or deployment. Use focused lint/type and public-content link checks; no test suites were requested.

Implementation owner: GPT-6 Luna, medium, Next.js engineering agent. Implement exactly this scope using the existing design system; do not redesign its components. Parent owns public Markdown; engineering owns site configuration and homepage components. Preserve unrelated work.

### Local verification

Implemented locally. Typecheck and focused ESLint pass. All 18 public Docs pages parse and internal links validate; `git diff --check` passes. Browser readback confirms both footer destinations, the expanded FAQ help anchor, and Help & feedback's linked mentions. The footer screenshot is saved outside the repository under `reports/community-links-2026-10-16/`. No test suites, Slack messages, commit, push or deployment.
