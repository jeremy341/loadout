# Homepage layout motion record

Merged on 25 Oct 2026 from 9 design briefs. Each section keeps its original text. Only the design system and the code are current; a brief records what was decided and built.

## Homepage Visual Clarity and Progressive Detail

_Merged from `homepage-visual-clarity.md`._

**Status:** Proposed design for review, 2026-10-06. No implementation is authorized by this plan request.
**Surface:** Public LOADOUT homepage, desktop, tablet, and mobile.
**Audience:** A first-time builder deciding whether LOADOUT fits their work and what happens after they ship.
**Visual authority:** DESIGN.md remains the source for palette, typography, layout tokens, and motion.

### Design read

LOADOUT already has a clear visual identity. Its reading density comes from explanatory paragraphs repeating a build story across About, Tracks, Project Fit, How it works, rewards, Eras, and the FAQ. Keep the details available while giving the page one clear story and concise visual steps.

**Direction:** The existing industrial field manual + pixel utility. Keep the graph-paper canvas, pixel icons, restrained yellow and graphite, and straight technical connectors. Do not add a new style, icon family, or UI library.

### Visitor outcome

On a quick scan, a visitor can explain:

1. LOADOUT is for technical projects across Tools, Systems, Compute, and Hardware.
2. Reviewers consider original technical work, evidence, and four quality dimensions.
3. Approved work can earn personal Track XP and global spendable Ore.
4. Track XP and Ore are separate and support different outcomes.
5. A Community Era is a shared technical theme that approved projects help move forward.

Detailed examples and mechanics remain available when requested. The visual pass reduces repeated explanation. Era timing, objectives, and bonuses remain in the internal policy plans rather than the public homepage.

### Homepage hierarchy

- Hero: value proposition and RSVP.
- How it works: one connected overview, from what LOADOUT is and selecting tracks through review outcomes and the next build.
- Progress & Prizes: lifetime milestones, discounts, Requisitions, the planned prize list, and Custom Orders.
- Community Eras: a brief definition of a planned shared technical theme; no theme list or detailed mechanics.
- LOADOUT IRL: compact weekend idea with future-concept status.
- FAQ, Who’s Behind LOADOUT, footer.

### Integrated How it works flow

Use one ordered, semantic flow:

    What is LOADOUT? → choose project and track(s) → build/document → ship → review → XP + Ore → upgrade → build again

The opening definition is one sentence. Explain Digital Loadout as the accepted-work portfolio and Physical Loadout as equipment for future builds in short labels, not a separate explanatory block.

The project-choice stage branches to four compact track labels with an existing pixel icon and one short purpose. Keep Research Mode as an optional modifier, not a fifth track.

Keep a visible fit rule near project choice/review: product label alone does not determine fit; assess original technical work. Show two short contrasting examples and put the other approved examples and longer reasons in a native See more examples disclosure. Do not imply approval is guaranteed.

The review stage keeps the canonical dimensions by name: Originality, Technical Depth, Execution, Documentation. State that the four dimensions guide the team's written reason, with no score or percentage. The team assigns Track XP according to the technical fields used. The outcomes then distinguish personal, non-spendable Track XP from global, spendable Ore.

Accepted projects add to the Digital Loadout. Ore and related field levels support prizes and the builder’s Physical Loadout. Link to detailed prize mechanics rather than repeating them here.

### Progress & Prizes

Compact Requisition path:

    related level → permanent track discount → eligible matching Requisition adds a one-use discount → remaining Ore price

Keep the five level milestones once. A small disclosure carries one-use, non-transferable, non-expiring, one-per-order, minimum-value, and level-gate rules. The quote preview and Ore balance remain understandable. Plan 02 owns the current figures and terms; this proposal does not authorize unapproved pricing UI.

Compact Custom Order path:

    reviewed ship → relevant Track tier → request equipment → final Ore quote → accept/decline

Keep the relevant-tier requirement, enough Ore to accept, and the closed status visible. Omit the numbered tier ladder from the homepage. Tracked hours alone are not a separate gate; the tier values remain internal. Fit, budget, location, safety/legal delivery, availability, shipping/tax, fulfillment, and quote-specific Requisition rules can be disclosed as secondary review detail.

Keep the eight current planned prize categories as a static icon list or mosaic, with one planned/not-open status. Do not carousel category labels: there are no approved item listings, imagery, prices, or stock to browse.

### Community Eras

**Current first slice only:** Keep the homepage section brief. Label it as a planned community concept and define it in one sentence: approved projects help the community move a shared technical theme forward. Do not show the named Era sequence, objectives, target, minimum duration, reset behavior, Season comparison, or +10% bonus on the website. The complete rules remain in the canonical product plans.

A static Approved projects → Shared progress → Next theme rail may help if it reads as a concept rather than a live timeline. No counters, dates, schedules, or readiness indicators.
### LOADOUT IRL

A compact future-concept plate says an optional Düsseldorf build weekend would use the online tracks, review, and shared Era. A three-part Friday Start → Saturday Build → Sunday Ship line communicates its format. The dates/venue/funding/registration status stays visible. No event promise or RSVP is added.

### FAQ and progressive disclosure

Short FAQ answers point back to primary sections. Preserve unique facts: per-person team contributions, planned Hackatime/Lapse split, AI use, levels not multiplying Ore, Requisition limits, closed Custom Orders, and RSVP not enrolling anyone. Essential facts remain visible or reachable with keyboard and no JavaScript.

### Responsive and accessibility behavior

- Use semantic ordered lists and groups; connectors and decorative sprites are aria-hidden.
- Preserve current anchors: about, tracks, research, project-fit, process, progression, field-pricing, requisitions, shop, custom-orders, eras, loadout-irl, faq, behind-loadout.
- Use the straight existing connector style. Flow columns stack in reading order when width or zoom requires it; no horizontal overflow.
- Native details/summary disclosures provide keyboard focus and expanded state. Do not hide the definition, track labels, fit rule, four score dimensions, XP/Ore distinction, or planned/closed state.
- Honor existing 44px targets, 16px body text, reduced motion, scroll behavior, and Reveal fail-open handling.
- No-JavaScript fallback retains essential copy and reveals full disclosure content.

### Source use

- Pixl Flow.tsx and Story.tsx: ADAPT connected-step and purposeful-fork grammar only.
- Pixl Shop.tsx / Marquee.tsx: REFERENCE ONLY for future actual prize listings; current planned category list remains static.
- YSWS Template +page.svelte: REFERENCE ONLY for groupings and galleries; copy no text/code/media.
- Stardance _what_is_this.html.erb, _project_thumbnails.html.erb, _gain_stardust.html.erb: REFERENCE ONLY; independently draw generic project-to-review connections.
- React Flow / @xyflow/react: IGNORE; a static homepage needs no interactive graph editor.
- Native details controls: ADAPT for optional examples and policy edge rules.

Pins and rights are recorded in docs/source-audit/source-bases.md. Pixl is MIT; the YSWS Template and Stardance have no identified reuse license here. Do not copy their assets, source, or product policies.

### Review criteria

- One integrated build story replaces repeated About/Tracks/Fit/process descriptions.
- Track names, fit rule, four dimensions, XP/Ore distinction, and planned states are clear on a first scan.
- All approved examples and detailed rules remain accessible.
- Requisition, Custom Order, Era, and IRL diagrams do not imply live values or events.
- Section anchors, keyboard access, no-JavaScript behavior, responsive reflow, and reduced motion remain usable.


## LOADOUT hero atmosphere

_Merged from `loadout-hero-atmosphere.md`._

**Status:** Implemented locally and verified during the redesign-foundation pass  
**Surface:** Public homepage hero and shared paper background  
**Audience:** Prospective builders scanning the LOADOUT program overview  
**Reference:** `Loadout – Redesign.html` (warm light-paper direction only)

### Design read

**Coalfield field manual:** warm stone paper and disciplined print grain set the page; ASCII hoist and headframe studies place the hero in a technical workshop without turning the background into an image asset.

### Scope

- Shift the shared palette from cool grey to warm stone, coal ink, subdued Bolt Yellow, and a small rust accent.
- Keep the paper grid and add only a faint, even print-grain layer.
- Frame the existing hero with static, decorative ASCII mine structures.
- Keep the current section order, copy, links, content, and interactions unchanged.
- Do not use the prepared hero-workshop PNGs or introduce new raster scenery. The old cloud SVGs were removed with the abandoned hero workshop on 2026-10-20.
- Remove the separate industrial skyline background so the ASCII treatment carries the workshop reference in the hero.

### Visual tokens

Use the shared tokens in `docs/design/system/design-system.md`: canvas `#DDD3BF`, surface `#E9E2D4`, muted surface `#D2C8B7`, ink `#1A1714`, muted text `#5A5145`, graphite `#29241F`, Bolt Yellow `#D7B34D`, and limited rust `#C4491F`. The 24px grid remains primary; the 120px guide and grain stay subordinate to text.

### Component and responsive behavior

- Existing hero title, supporting copy, calls to action, facts, badge, frame, and scroll cue retain their markup and order.
- ASCII studies are fixed-width `<pre>` content with `aria-hidden="true"`, no pointer events, and no animation. Position them outside the central text/action area on wide desktop.
- Hide the ASCII details before they collide with side labels or buttons at tablet/mobile widths. Keep all actual content visible.
- The current hero uses the ASCII treatment; the old PaperScenery cloud motion and scenery SVGs were removed on 2026-10-20.
- Keep page and Docs route scrolling behavior unchanged.

### Accessibility and acceptance

- Text and controls retain readable contrast; decor never carries program information.
- No horizontal overflow at desktop, tablet, or mobile widths.
- Reduced-motion settings keep ASCII art static.
- The page uses no prepared workshop PNGs as a background.
- Existing section content, anchor links, actions, and order remain unchanged.
- Run the app build and inspect desktop plus narrow viewport renders before reporting completion.

### Implementation handoff

Implement the brief in `apps/landing/app/loadout.css`, `apps/landing/app/_components/LoadoutHero.tsx`, and `apps/landing/app/_components/PaperScenery.tsx`. Do not change product copy, pricing, eligibility, RSVP semantics, homepage section order, Docs behavior, or asset source files.


## Section corner brackets

_Merged from `section-corner-brackets.md`._

Status: implemented on this branch.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md), section "Corner brackets".

### Design read

The field manual's registration marks: a heading is framed the way a drawing frames a title block. The marks belong to the existing hero frame and hero buttons, so they read as one family.

### Scope

- In: the section headings (`.home .sect > .h2`), eleven on the homepage.
- Out: cards, nested panels and every button. The anti-slop bans rule out decoration on every surface. There is no dedicated final call-to-action section, so none is framed.

### Rules

- Four marks, 16 by 2 pixels, in `--fg` (ink in light mode), drawn with gradients on `::before`.
- The heading box is `fit-content`, so the marks hug the text. The marks sit outside the box (`inset: -14px -18px`) and do not change the layout.
- Static only. The pointer-following version stays on the hero buttons.

### Acceptance

1. Every section heading shows the four marks in both themes.
2. Cards show no marks.
3. Heading positions and sizes do not change.


## Depth darkness: the homepage gets darker the deeper you scroll

_Merged from `depth-darkness.md`._

Status: implemented on the feature/depth-darkness branch, awaiting owner check.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md), sections "Depth markers and rulers" and "Grain and paper".

### Design read

The homepage is a descent: its markers count from −000 M to −900 M and the 404 page sits at −1404 M in near-black rock. The owner noticed the 404 is darker than the homepage and asked for that darkness on the homepage too, growing as you scroll. Reading down the page should feel like going down the shaft: the hero is the lit surface, the footer is the bottom level.

Direction: industrial and signage, as locked in DESIGN.md. Counterfactual test: a plain dark mode, or a gradient wash, could belong to any site. Tying the darkness to the real scroll depth, ending at the 404's black, belongs to this one.

### Scope

- In: one decorative layer on the homepage (`.depth-dark` in `app/page.tsx`) and its stylesheet (`app/depth-dark.css`).
- Out: the 404 and cave-in pages (they have their own darkness), the Docs, the nav, the cards, the grain and the rulers, and any text colour. No JavaScript is added.

### How it works

- A fixed layer sits above the page background and its grid and below the content (z-index 1; content is 2, nav 50, grain 40). It therefore darkens the backdrop only, never text or cards, so the cards stand out more as it deepens.
- Its opacity follows the scroll position through a CSS scroll-driven animation (`animation-timeline: scroll(root)`): 0 at the top, 1 at the bottom, linear in between. There is no scroll listener, no React state and no re-render; only the opacity of one compositor layer changes.
- Dark theme: a radial gradient from a soft black in the middle (`rgba(6, 8, 9, .6)`, which turns the page grey `#222627` into about `#111415`, close to the 404's `#0e1112`) to a darker rim (`rgba(0, 0, 0, .86)`).
- Light theme: the paper keeps its colour (the muted text is already close to the contrast limit on it). Only the rim deepens (`rgba(26, 23, 20, .32)`), as on the 404.

### States

| State | Behaviour |
|---|---|
| Top of the page | Opacity 0: the page looks exactly as before. |
| Middle | About half the shade. |
| Bottom (footer, −1000 M) | Full shade: near-black in the dark theme, a darker rim in the light theme. |
| Scrolling back up | The shade lifts again with the scroll. |
| Dark and light | Each theme has its own shade (above). Switching the theme while scrolled changes the shade at once. |
| Phone | The same layer and gradient; the viewport is smaller. |
| Reduced motion | Kept. It is a colour change tied to the scroll, with nothing moving on the page. |
| A browser without scroll-driven animations | The layer is not shown and the page looks as it did before this change. |
| No JavaScript | Works: it is CSS only. |

### Accessibility

- The layer is `aria-hidden`, ignores the pointer (`pointer-events: none`) and holds no text.
- Contrast only improves in the dark theme: the page text `#E9EBE7` and the muted text `#A7AEAB` sit on a darker backdrop. The light theme's paper is untouched, so its contrast does not change.
- The faint-until-lit depth numerals stay discoverable with the lamp; they are decoration.

### Performance

One fixed element, opacity only (compositor). No layout, no paint of the page on scroll, no JavaScript on the main thread.

### Skills

Loaded earlier in this conversation for UI work: `frontend-design-ui-ux` (this brief), `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites` and `pixel-art-animator`. The motion rules that applied: animate only opacity, no scroll listeners, honour the user's motion setting (here the effect is colour only), and give the effect a purpose (the descent). There is no sprite or vector work in this change.

### Acceptance

1. At the top of the page the layer's opacity is 0; at half the page it is about 0.5; at the bottom it is 1; scrolling back up returns it to 0.
2. The layer is fixed, `aria-hidden`, `pointer-events: none`, and sits above the page and below the content.
3. The dark theme's shade is near black (`rgba(6, 8, 9, …)`) and the light theme's is the soft ink rim (`rgba(26, 23, 20, …)`).
4. The 404 and the Docs have no such layer.
5. The whole browser suite, typecheck, lint and unit tests pass.


## Transparent depth labels

_Merged from `depth-label-transparency.md`._

Status: implemented locally and visually checked on the homepage, 2026-10-17.

### Scope

The homepage's right-hand depth labels should sit directly over the hatched band, like the meter numerals on the left. Remove the page-colored plate behind `.home .pit > span`.

### Design

Use the existing two text-clipped background layers: faint ink at rest and the pointer-positioned glow. Remove the third, box-clipped page-color layer. Keep the label's font, padding, dimensions, alignment and text unchanged.

The same transparent treatment applies in dark and light themes and at existing responsive breakpoints. Touch and reduced-motion behavior stay as implemented. Preserve the system-color fallback used for both labels and numerals in forced-colors mode.

### Acceptance

- Hatching continues behind the right-hand label without a rectangular interruption.
- Both label layers are clipped to text, matching the numeral treatment.
- The existing faint-at-rest and pointer glow remain intact.
- No layout, copy, interaction or asset changes are introduced.

Current styling owner: `apps/landing/app/home.css`; presentation rules: `docs/design/system/design-system.md`.

### Owner follow-up: larger labels

Requested 2026-10-17: enlarge the right-hand text while keeping its transparent treatment. Increase the responsive font size from `clamp(20px, 2.2vw, 32px)` to `clamp(28px, 3vw, 44px)`, and from 16px to 20px on phones. Preserve the meter numeral size, faint/glow colors, alignment and existing wrapping. Check the first marker and a longer label in the local preview.


## ASCII floating motion preview

_Merged from `ascii-float-preview.md`._

Status: local experiment requested by the owner; no publication requested.

### Design read

Keep LOADOUT's industrial field-manual identity and make the existing margin ASCII float more visibly. Use the current art, typography, colours, placement and cursor spotlight.

### Motion

- Move the shared ASCII container from `translate3d(-4px, 12px, 0)` to `translate3d(5px, -24px, 0)`: 36px of vertical travel, with the existing horizontal range.
- Use ease-in-out and infinite alternate playback, with a distinct period and negative phase offset for every drawing. Negative offsets start the drawings at different points immediately; varied periods prevent repeated synchronized movement.

| Drawing | Seconds per direction | Phase offset |
|---|---|---|
| Hero left | 8 | -1.3s |
| Hero right | 9.7 | -5.2s |
| Tracks | 8.9 | -3.7s |
| Process | 10.3 | -7.1s |
| Progression | 9.4 | -11.4s |
| Field pricing | 8.4 | -2.6s |
| Eras | 10.7 | -9.8s |
| Behind LOADOUT | 9.1 | -15.7s |
- Both the base and spotlight layers move together. Keep the existing pointer-mask behavior.
- Reverse the initial direction for the hero-right and Tracks drawings using alternate-reverse. Together with the existing phase offsets, four drawings start downward and four upward; every drawing still reverses smoothly at each end.
- Retain current visibility breakpoints and static artwork under reduced motion. Decorative art remains hidden from assistive technology and ignores pointer hits.

### Scope and acceptance

Only adjust the existing ar-drift keyframes and scoped timings in home.css. Configure period and phase through CSS variables on the drawing selectors. No new assets, component logic, layout or copy.

The local homepage must render without horizontal overflow at desktop and narrow widths. Browser inspection must confirm the wider motion range and animation:none under reduced motion. No new tests are needed for this reversible CSS experiment.

### Implementation handoff

A GPT-6 Luna engineering agent at medium reasoning implements this scoped CSS change against the existing design system. The parent agent checks the rendered local preview.

Required UI skills consulted: frontend-design-ui-ux, frontend-design, design-taste-frontend, emilkowal-animations, svg-design, pixel-art-sprites and Pixel Art Animator. No SVG or sprite assets are edited.


## Stasis-inspired homepage motion (scramble headings, magnetic corners, hover facts, footer wordmark)

_Merged from `stasis-homepage-motion.md`._

Status: implemented 2026-10-11. Scope: `apps/landing` homepage only; docs route untouched.

### UI-skill record

The seven skills in `docs/development/ui-skills.md` were not available in the session that built this (the skill catalog returned none of them). The owner told the session to proceed anyway. They were not used, and this change should be re-reviewed against them once they are installed. Source basis: `docs/source-audit/DECISIONS.md` (Stasis rows).

### Changes

1. ASCII drawings removed from the hero and all six sections (components and art data kept, unused).
2. `ScrambleHeadings`: each `.h2` scrambles once, the first time 40% of it is in view (about 0.7 s).
3. `MagneticCorners`: four brackets around each hero button; open and lean toward a mouse within 50 px.
4. `HoverScramble`: the three hero facts scramble per letter under the pointer.
5. `FooterWordmark`: the LOADOUT wordmark across the foot of the footer, lit around the pointer.

### States and interactions

- Headings: idle (real text) → in view (letters random, locking left to right with jitter) → settled (original text nodes restored). Runs once per heading per page load.
- Corners: idle (static, 55% opacity) → near (data-active: full opacity, 8 px offset, lean 8% of pointer offset) → released at 60 px. Hover/press of the button itself is unchanged.
- Facts: hovering a letter scrambles it and its two neighbours for about 0.2 s; a letter cannot restart until it settles.
- Wordmark: static faint base; a brighter copy shows through a 280 px radial mask at the pointer.

### Responsive

- Hero buttons keep their sizes; the wrapper takes over the flex sizing at 800 px and 370 px. Brackets sit 5 px outside the buttons (12 px gap on phones leaves room).
- Wordmark scales with `clamp(64px, 19vw, 300px)` and matches the footer's side padding at each breakpoint.
- Touch: no pointer effects (corners and wordmark stay static).

### Accessibility

- Reduced motion: headings, facts and corners do not animate; grain behavior is unchanged.
- Headings keep their real text in the DOM; while scrambling, the heading's `aria-label` is the real text. Hero facts keep a visually hidden copy; the lettered copy is `aria-hidden`.
- Corners and wordmark are `aria-hidden` and never take pointer events. Links and buttons keep their names, focus order and focus rings.

### Acceptance criteria

- No ASCII drawing on the page; no horizontal scroll at 320, 390, 768, 1440 px.
- Headings end with their original text and no leftover `aria-label` or letter spans.
- Corners wake up near a mouse and stay still under reduced motion.
- Facts return to their text after hover.
- `bun run lint`, `typecheck`, `build` and the Playwright suite (27 tests) pass.


## Docs tag, motion, theme, depth markers, hero size (batch 3)

_Merged from `pixl-tab-motion-theme-batch.md`._

Status: implemented 2026-10-11. Scope: `apps/landing` homepage and the docs route styling. Plan: the approved batch plan in the working session; the numbers below are what shipped.

### UI-skill record

The seven skills in `docs/development/ui-skills.md` were not available in the session that built this. The owner told the session to proceed. They were not used; re-review against them once installed.

### Changes

1. LOADOUT DOCS tag copies Pixl's bottom tab (`references/pixl/apps/landing/app/_components/LanguageSwitcher.tsx`): fixed to the bottom edge, Pixelify Sans 16/18/20px, borders 2/4/4/2px growing to 6px on hover. The docs route buttons use the same look. The footer bottom bar gets right padding so the tag does not cover its text.
2. Motion matched to main (cd1834a): `Reveal` ported to `app/_components/home/Reveal.tsx` and wrapped around each section, card stagger, hero entrance keyframes, scroll cue, level markers, button and card hover and press. The scroll-scrubbed `rv` fade was removed.
3. Dark theme lightened: background #2F2B26 (was #211E1A), plates #3A352F/#34302A, muted text #B3A995, strata gradient .18 (was .4). Docs tokens match.
4. Depth markers ("-000 M") are 160px strips with an 88px number (110px and 52px on phones).
5. Hero sized to the redesign reference at 1440: 122px title (`clamp(48px, 8.5vw, 124px)`), 260x52 buttons, full-bleed hero, corner labels moved below the nav.
6. Magnetic corners: activate 40px, release 48px, lean 4% capped at 4px.
7. Footer wordmark glow in light mode is yellow (#E3C26B).

### Acceptance

- No horizontal scroll at 320, 390, 768, 1440px; headings and buttons keep their names and focus order.
- Reduced motion turns off the hero entrance, reveals, stagger and the corner lean.
- `bun run lint`, `typecheck`, `build` and the Playwright suite (36 tests) pass.

### Later changes (same day)

- Dark theme changed to the redesign reference's own values: page #141210, plates #2B2723/#25211D, strata .4. All grain effects were removed (homepage and docs). A ruler of tick lines runs along the top edge above the nav, as wide as the nav bar.
- New logo (`app/_components/home/Logo.tsx`): a pixel slot-and-bolt mark with a heavy 6x9 pixel wordmark, themed through `--fg`, `--logo-bg`, `--logo-fg`. Used in the nav, footer, docs sidebar and `app/icon.svg`. Designed by hand; the SVG and pixel-art skills were not available.
- Nav RSVP button is 30px tall like the colour chooser (both 44px on phones).
- Hero stamp, corner labels and side words moved down and inward; community panel and footer sheet backgrounds made see-through.

### Dark palette fix

Measured causes of the odd dark look: three different box fills (#2B2723, #141210, see-through), a black gradient (.4) that darkened the page toward the bottom, cream outlines on every box, and no accent. Now: page #1C1916, one box fill #27231F, outlines rgba(239,230,212,.28) on content boxes (controls keep strong outlines), no bottom darkening, amber #E3A83F for small highlights only (links, markers, FAQ plus, step numbers, level-rail line, corner brackets). Contrast: body text 12.6:1, muted text 5.9:1, amber 7.4:1 on the box fill. Light mode unchanged. Docs tokens match.

### Logo restyled like main's buttons

The logo is now a sand badge with a 2px border, 2px radius and a hard 2px block shadow (main's `.button` look; border and shadow are cream in dark mode and ink in light mode) holding a pixel bolt, next to the name in Jersey 10 (36px, 31px on phones and in the footer). It replaces the earlier pixel-letter wordmark. Used in the nav, footer, docs sidebar and `app/icon.svg`.

### Buttons

Buttons (nav RSVP, hero RSVP and Explore tracks, hero badge) follow main: Pixelify Sans bold capitals, 2px border, 2px radius, hard block shadow that grows on hover and drops on press (border and shadow are cream in dark mode, ink in light mode).

### Numbered rulers and filler clean-up (11 October 2026)

Skills loaded for this batch: frontend-design, design-taste-frontend, web-design-guidelines, accessibility, copywriting. The other names in `docs/development/ui-skills.md` (frontend-design-ui-ux, emilkowal-animations, svg-design, pixel-art-sprites, Pixel Art Animator) are not installed on this machine and were not used.

Design read: event landing page for teenage technical builders, in a Ruhr mine and drawing-sheet language; the redesign is preserved, so the dials stay where the page already is.

- `SheetRuler` (app/_components/SheetRuler.tsx, app/ruler.css) draws a numbered top edge (00 to 12) and a depth scale down the left edge, on the homepage and inside the docs main pane. On the homepage the scale is pinned to the depth markers, so the tick labelled -300 sits beside the "-300 M" strip. Both rulers are decorative (aria-hidden); phones keep the ticks and drop the side numbers.
- Removed repeated filler: the "FIG. 0X" rows that restated each marker and heading, the identical status line on the four track cards, "Technical signal" above the fit rows, "Outcome" and "Planned prize" labels, long dashes, and the stale date in the footer sheet (now the current year, status "In development").
- Running text is IBM Plex Mono on the homepage and docs; DotGothic16 is kept for short labels. Track and planned-prize cards size to their content.
- The scroll cue reads "Begin the descent"; selection and scrollbar colours follow the theme.

### Grain, rulers and docs redesign (11 October 2026)

- Grain: `NoiseGrain` is the Stasis-style film grain, a full-screen canvas of random grey noise at 33% opacity redrawn every 100ms (it was 20%, the Stasis value, which is invisible on the graphite and beige backgrounds), on the homepage and the docs. Reduced motion gets one still frame. This replaces the pixel-tile grain tried the round before.
- Rulers: the homepage has a pixel ruler along the top (tick every 32px, number every 160px) and one down the left edge (heavy mark every 800px). The right-hand ruler and the docs rulers were removed.
- Docs: restyled after the Pixl docs. Boxed sidebar with a 4px right rule and collapsible groups (label, count, chevron), Pixl's block back button, ink hover and sand active links, Pixelify Sans headings at 46px and 30px, Poppins text (loaded on the docs only), 2px rules with 4px block shadows on fact rows, callouts, quick answers and previous/next cards, and an "On this page" list that marks the section being read. The drafting grid behind the docs was dropped.

### Old icons, depth ruler, no scroll darkening (11 October 2026)

- Icons: the cards use the first site's pixel sprites (`public/loadout/sprites`) again, as `<symbol>`s in `ICON_SPRITE`. The theme tints them with a filter: as drawn in light mode; in dark mode the yellow is pulled toward the sand of the RSVP button and each icon gets a faint sand edge, because the old black outlines vanish into the dark cards.
- The page no longer darkens as you scroll: the `.strata` overlay is removed in both themes.
- The left ruler is the depth of the page in metres, pinned to the depth strips. The ticks are every 10 m and the numbers every 50 m, and the heavy mark beside each "-N M" strip reads the same number ("-500" beside the "-500 M" strip). Above the first strip it counts up (+). The top ruler stays in pixels. The right-hand ruler stays removed.

### Main's levels rail, old logo and missing animations (11 October 2026)

- Track XP and levels: the rail follows main's: five stops with a 64px requisition marker (no hexagon badge), an ink arrow between stops, the level in Pixelify 26px and the award in 16px, and plain text for "Choose where to grow.". The scroll-driven amber line is gone.
- Logo: the first site's hexagon mark (yellow hexagon, dark inner hexagon, yellow cross, 32px) with the Jersey 10 name, in the nav, footer and docs. The favicon is main's again.
- Animations ported from main: the Bolt icon nudge in the process outcomes, the era connector entrance and the IRL status entrance. The level markers already entered in sequence; their delays now start at the second marker. All of it is off under reduced motion. Main's drifting clouds were tried and removed at the owner's request; its skyline and registration marks are not brought back.

### Dark theme: graphite, blue and teal (11 October 2026)

The warm charcoal dark theme felt flat next to the light one: one low-saturation brown family, a washed-out sand accent and boxes that barely left the page. The dark theme is now the first site's graphite and Bolt Yellow with a cool secondary:

| Token | Value |
|---|---|
| Page | #222627 |
| Boxes and docs panels | #2C3132 |
| Text / muted text | #E9EBE7 / #A7AEAB |
| Primary accent (buttons, logo, docs tab, markers, icons) | blue #5E9EF4 with #16191A text |
| Secondary accent (links, brackets, ruler marks, active contents item, selection) | teal #6FC2BB |
| Box outline | rgba(233, 235, 231, .22) |

The old pixel icons are no longer desaturated or edged in dark mode. Light mode is unchanged.

The yellow of the first draft of this palette (#E0BD55) was then changed to blue (#5E9EF4) at the owner's request, everywhere in dark mode: buttons, logo, docs tab, docs links, markers, stamp and footer wordmark. The old icons are turned from yellow to blue with a hue rotation in dark mode and stay yellow in light mode.


## Docs Tag + Community Era Refresh

_Merged from `docs-tab-and-era-refresh.md`._

---
feature: docs-tab-and-era-refresh
register: brand
aesthetic_direction: industrial / signage
design_system: bespoke
---


### Design read

Turn the fixed docs tag into a small piece of equipment being armed, and make Community Eras read as a technical operating sequence rather than a pair of marketing cards.

### Locked identity

Bind this work to `.ulpi/design/DESIGN.md`. Use only the existing LOADOUT canvas, surface, ink, graphite, rule, muted text, and Bolt Yellow tokens. Keep IBM Plex Mono for utility/body copy and Jersey 10 or Pixelify Sans for short display labels. No gradients, glow, glass, rounded SaaS cards, or new colors.

### Docs tag

#### Purpose

The fixed `LOADOUT DOCS` link is a visible entry point to the field manual. It should feel like a physical yellow pull-tab attached to the page, not a floating app button.

#### Visual and motion treatment

- Preserve its fixed bottom-right placement, keyboard focus, accessible name, and direct `/docs` navigation.
- Add a small two-phase idle signal: a 2px upward nudge followed by a return, then remain still. Run once on initial appearance and replay on hover/focus, never continuously.
- On hover/focus, use only a slight `translateY(-2px)`, yellow highlight, and a 1px ink offset shadow. Do not scale, rotate, or add a large shadow.
- Respect `prefers-reduced-motion`; remove the nudge and transform while retaining color/border feedback.
- Keep the tab readable and at least 44px tall. On narrow screens, keep it within the viewport and avoid covering important content.
- `:focus-visible` must remain a strong ink/yellow focus treatment.

### Community Era composition

#### Structure

Keep the existing heading and canonical description. Replace the current concept rail + two fact boxes with:

1. **Technical timeline**: three equal stages in one ruled plate:
   - `01 / PROPOSE` — the community aligns on optional technical objectives.
   - `02 / BUILD` — qualifying projects contribute shared Era progress while normal Bolts and Track XP remain separate.
   - `03 / ADVANCE` — the Era resolves into the next community state; lifetime progress is not reset.
2. **Evidence plate** beneath it with three compact cells:
   - `ERA POINTS` — shared progression signal, not spendable Bolts.
   - `TRACK XP` — persistent personal track progress, not an Era reward.
   - `+10% PLANNED` — qualifying projects may receive 10% of approved base Bolts; final launch configuration is still being finalized.
3. A single muted note clarifying that Eras, seasons, and weekly resets are different concepts and that unconfigured dates/thresholds should not be shown.

#### Interaction and motion

- Timeline cells may reveal a yellow top rule on hover/focus only; no lift or large shadow.
- The bonus cell gets the yellow surface treatment and an ink border so it reads as evidence, not a progress meter.
- Do not invent progress bars, dates, thresholds, live status, prize inventory, or launch claims.

#### Responsive behavior

- At desktop, three columns with ruled separators.
- At mobile, one column with horizontal separators and 16px minimum body copy.
- The plate must fit within 320px width without horizontal overflow.

#### Accessibility

- Keep the timeline as an ordered list.
- Keep evidence as a labelled group.
- Preserve visible keyboard focus and sufficient contrast.
- Motion must be disabled under reduced-motion preferences.

### States and edge cases

- Initial page load: one restrained docs-tab signal only.
- Hover/focus: local color/border feedback; no layout shift.
- Reduced motion: no animation.
- Narrow viewport: tab and Era plates remain fully visible and wrap without overflow.
- Keyboard navigation: docs tab and all links remain reachable in normal DOM order.

### Build handoff

Target: Next.js App Router engineering agent.

Implement exactly this specification using the existing bespoke CSS and semantic React structure. Do not redesign the rest of the homepage, alter docs routes, or change canonical Era facts. Run typecheck, lint, focused homepage tests, and a 320px/390px overflow check.

### Acceptance criteria

- The docs tag has a restrained one-shot signal and subtle hover/focus feedback.
- The docs tag still links directly to `/docs` and remains keyboard accessible.
- Community Eras use a three-stage technical timeline and a three-cell evidence plate.
- `+10% PLANNED` remains clearly marked as planned, with no invented live values.
- No horizontal overflow at 320px or 390px.
- `prefers-reduced-motion` disables the new motion.
- Typecheck, lint, and focused tests pass.
