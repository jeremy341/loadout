# Accessibility record

Merged on 25 Oct 2026 from 9 design briefs. Each section keeps its original text. Only the design system and the code are current; a brief records what was decided and built.

## Accessibility standard for the homepage and Docs

_Merged from `accessibility.md`._

Status: 2026-10-16. Standard: WCAG 2.2 level AA, with the GOV.UK Design System as the reference for patterns (landmarks, headings, tables, links, focus, plain language).

### Automated checks (in the test suite)

`apps/landing/e2e/accessibility.spec.ts` runs axe with the WCAG 2.0, 2.1 and 2.2 AA rule sets on every homepage and Docs page, at 375 px (dark) and 1440 px (light). It fails on any violation. Result on 2026-10-16: zero violations on all 16 pages.

Fixed on 2026-10-16 (found by the first run, 39 violations):
- The theme switch sat outside any landmark. It now sits inside `main` on the homepage and inside the directory `aside` in the Docs.
- The top bar was a labelled `div`, which is not a landmark. It is now a `header`.
- The floating Docs link is now inside a `nav` landmark.
- Three table header cells were empty (Pricing, Requisitions, Build and ship). Each now has a column name.
- On phones the tables scrolled sideways, which a keyboard user could not reach. Cells now wrap instead, as GOV.UK tables do.

### Manual checks still to do

Automated checks find only part of WCAG. These need a person:
- **Screen reader:** read the homepage and one Docs page with VoiceOver or NVDA. Check the order, the headings and the names of the links.
- **Keyboard:** Tab through the homepage and the Docs. Check the focus ring is always visible, the skip link works, and no control traps focus. Mole (Orry) must never take focus.
- **Zoom:** 200% and 400% zoom (or 320 px wide). No horizontal scrolling and no text cut off.
- **Motion:** with reduced motion on, nothing moves that should not, and Orry does not appear by himself.
- **Colour:** light and dark themes, and a colour-blindness simulator on the track and level colours.
- **Plain language:** the Docs read at a reading age a 13-year-old can follow. GOV.UK's content guide is the reference.

### Spacing and dividers in the Docs

Each Docs section now starts with a rule and room above it (84 px above the heading, the rule 36 px below), and paragraphs and tables have more space. Long pages read in blocks, which is easier for everyone, including people who read with zoom or magnification.


## Accessibility remediation

_Merged from `accessibility-remediation.md`._

Status: owner approved the 2026-10-17 accessibility fixes, then requested the theme sizing and depth labels return to their earlier appearance and the Pause Animations button be removed. Keep the operating-system reduced-motion setting. The prize strip is now static and scrollable by hand.

### Design read

Use LOADOUT's current industrial field-manual system: graphite/blue dark theme, paper/yellow light theme, pixel headings, hard rules and existing artwork. This is accessibility remediation, not a redesign or new program policy. The seven required UI skills have been consulted in this conversation. No new vector/sprite art is necessary.

### Layout and semantics owner (UI agent, GPT-6.1 Sol medium)

Own home.css, docs.css, DocsDocument.tsx, DocsTab.tsx, RockBottom.tsx, SiteNav.tsx and Hero.tsx. Coordinate rather than edit files owned below.

- Keep every navigation control reachable at 320px and with increased text size/spacing. Let groups wrap/reflow; do not hide functions, clip overflow or globally shrink the type. Reserve a nonshrinking 44px menu target. Preserve current ordinary-width composition as closely as possible.
- Allow hero title lines and Docs brand/header to wrap when enlarged; prevent clipping in the article, sidebar and short/landscape layouts. Hide/reposition only decorative stamps when their fixed placement collides with reading text.
- Darken small light-mode accent text to >=4.5:1 on its actual panels (currently failing #C4491F links/Era numerals). Keep decorative accent/button colors unless their contrast needs correction.
- Preserve the original faint depth labels at rest and retain the pointer glow as enhancement. Keep footer watermark and ornamental ASCII decorative.
- Give the floating link a name containing the visible words LOADOUT DOCS.
- Render Markdown pre blocks as explicitly focusable, labelled code examples with a visible focus ring; preserve safe ReactMarkdown/GFM/no raw HTML.
- Keep 404/error ThemeSwitch and footer text inside landmarks. Do not add a visitor-facing pause button.
- Supply forced-colors-safe menu/theme/Docs control graphics or visible fallback text. Do not blanket-disable forced colors on the app.
- Mark genuine foreign-language phrases in owned components where appropriate. Preserve English page language and all policy/copy.

### Motion and mascot owner (UI agent, GPT-6.1 Sol medium)

Own the shared system reduced-motion preference and motion.css; layout.tsx; NoiseGrain.tsx; PlannedPrizes.tsx and prize-belt.css; DocsShell (docs-shell.tsx); mascot files/engine/mole.css; ScrambleHeadings/HoverScramble as needed. SiteFooter.tsx is yours: preserve the already-restored metadata and direct channel links.

- Honor `prefers-reduced-motion` in shared effects and the mascot, including live preference changes. No saved visitor pause state or pause button is used.
- Keep the prize belt moving slowly in the default state. It pauses on pointer hover and keyboard focus; reduced-motion users get one static, manually scrollable list. Do not add a global pause button or an assistive-technology duplicate.
- Show reveal content when motion is reduced; do not freeze it invisible. Clean up timers/listeners on navigation.
- Keep Orry as optional decorative pointer play. The owner asked to remove the entire Orry control section from the footer; do not replace it elsewhere. Automatic appearances must still honor reduced motion. No essential document function may require interacting with Orry.
- Keep existing controls compatible with forced colors and enlarged text.

### Parent verification / tests

Parent owns e2e test updates, this brief/index and the report. Expand the actual accessibility suite from a hardcoded list to all public Markdown routes plus homepage/docs/404. Set real theme storage and assert the rendered theme, rather than only emulating system color scheme. Add focused regression checks for 320px navigation, standardized text spacing, enlarged text, system reduced motion, label/name and code focus. Run typecheck/lint/unit/relevant e2e, then the external full-page/state/layout audit runners. Save screenshots outside the repo. Report remaining assistive-technology and real-device limits accurately; no unsupported AA certification claim.

### Acceptance

All concrete audit F1–F7 cases resolved without lost content, functionality or extra public rules. The earlier restored panels and uniform prize seam remain. Keyboard FAQ, skip links, Docs drawer/search/contents navigation and route/back behavior remain usable. Meaningful motion respects the operating-system reduced-motion preference. Keep changes reviewable, and document any unavoidable verification limits rather than weakening checks.

### Verification record

- Full local Playwright suite before the owner-requested footer trim: **299 passed**. It included homepage, Docs, 404s, Orry, motion and axe checks.
- After the footer trim, the six focused footer/reduced-motion/404 checks passed. The first hosted run then exposed timing flakes in two pointer-physics assertions and a 404 test that assumed hydration completed before the 1.8-second depth animation.
- The shake test now centers Orry and waits concurrently for the actual shake state; it passed three consecutive local runs. The drop/bounce test now checks the engine's test-only bounce counter instead of sampling every frame; it passed three consecutive local runs. The reduced-motion test waits for the depth landing before checking animation; it passed locally.
- Axe scan matrix: **119 accessibility tests passed**, covering 28 routes in light/dark at 375/1440px plus focused keyboard, text-spacing, 200%-text, motion-persistence, semantics and forced-colors checks.
- Layout runner: 78 route/state probes. No page-level horizontal scrolling at 320px. Git command samples keep their own keyboard-scrollable code containers. The Tracks comparison table was changed to fixed layout with wrapping; the enlarged-text regression passes.
- `tsc --noEmit` and ESLint passed before the final regression-test edits; the 53-test unit suite passed. Rerun typecheck, lint and the full browser suite on the final head before merging.
- The local production build was blocked by Turbopack worker startup and Google Fonts DNS. GitHub's Landing quality build passed on the earlier PR head; check the latest run.
- This does not certify WCAG 2.2 AA. Real browser zoom, NVDA/VoiceOver, speech control, physical-device checks and a full flash-luminance assessment still need human review.


## Accessibility field panel and visible shortcut

_Merged from `accessibility-field-panel.md`._

Approved 18 October 2026; implemented as the first accessibility panel pass. The follow-up in [mobile accessibility and color vision](accessibility-record.md) updates the control set, phone behavior and full-page layout. These notes preserve the original panel scope.

Use LOADOUT's engineering-paper grid, Pixelify signage, IBM Plex Mono text, squared plates and asymmetric hard borders. Present preferences as three numbered rows in one field panel, with native checkboxes and explicit on/off text. Keep the existing shared store, dialog focus behavior, fallback link, device reduced-motion handling and all default homepage effects.

Add a persistent Accessibility tab styled after LOADOUT DOCS. The owner refined its orientation: a vertical label running down the left edge, flush against that edge, with a minimum 44px target width. Match the Docs tab's 150ms ease-out border lift on hover, oriented outward: increase the left border by 2px, and return it on press. Respect reduced-motion settings. On homepage/error/accessibility routes place it below the fixed navigation at the left edge, tracking actual navigation size. On Docs place it at the lower left so it cannot cover sidebar branding or the mobile Guides controls. Retain footer links. The dedicated page uses a wider field-manual composition, a short introductory column, preference panel and ruled statement section. On phones stack these in reading order; bound the dialog and wrap long/enlarged text. No icons, new assets or decorative animation.

Preserve keyboard focus, Escape and return to opener; real /accessibility fallback when JavaScript is absent; 44px targets; both themes; color-safe/forced-color settings. No unrelated layout/content changes. Review changed surfaces visually at desktop/mobile. Run source checks; test coverage and remaining assistive-technology limitations are described in the current implementation record.
### Follow-up: controls and simpler page

Owner requested styled on/off controls, the RSVP treatment for Close, a cleaner full page and an option to remove grain entirely. Use native checkbox semantics with a squared, two-position visual switch and ON/OFF text. Match the homepage button's 2px border, small radius, pixel capitals and hard shadow for Close, preserving a 44px target.

Keep the full page in one 760px reading column: heading and short introduction, Appearance settings, Effects settings, then the statement. The dialog reuses the same grouped settings. Add independent persisted Hide grain and Underline links preferences. Hide grain unmounts the decorative canvas and stops its timer; Reduce motion can still leave a static grain frame when Hide grain is off. Underlines apply to text links, without changing button/tab appearance. All new choices default off and use the existing shared preference store. Keep the vertical shortcut and hover lift unchanged.
### Approved expanded accessibility controls

Owner approved the read-only review's full plan: plain typography; reading size 100/125/150%; wider text spacing; stronger contrast; system cursor; simplified decorative background/art/mascot; independent native scrolling; reset; and Animated/Still/Off grain. New preferences default to the existing design. Keep saved theme, color-safe and reduce-motion keys; migrate Hide grain into the grain selector without losing an existing off choice.

Keep the native dialog and focus ownership. Place the shortcut early in keyboard order after the route's skip link, align title and Close in one row with the kicker above it, make the header sticky while the body scrolls, and dismiss only when both pointer-down and pointer-up occur on the outside backdrop. Escape/Close retain focus return. Reuse settings on the full page with a two-thirds settings column and a short help column, stacking on mobile. Browser zoom, forced colours, reflow and keyboard behavior stay available without enabling any optional preference. Report unperformed physical-device, real screen-reader and flash assessment separately.

### First development PR: default behavior and Docs polish

Optional display preferences remain off by default. Required keyboard access, screen-reader semantics, visible focus, device motion/forced-colour support, browser zoom/reflow, skip links and the system cursor when selected work without activating optional presentation modes. Do not add a master switch that gates fundamental accessibility.

Keep the fixed Accessibility tab after the route skip link, with its narrow-screen gutter. Limit bottom clearance for the Docs tab to the desktop sidebar; mobile Docs uses an auto-height top row and must not inherit desktop tab padding. Results in Docs search render the matching page title only; keep headings and text indexed for retrieval, and keep the polite result count. Article credits read “Built with Love by the LOADOUT team.”

### Development PR additions

Keep optional display presets off by default, leaving the regular LOADOUT appearance intact until a visitor chooses one. The Accessibility shortcut opens the settings; it does not enable them. Basic semantics, keyboard support, skip navigation and respecting device preferences stay available as the normal site experience.

Docs search displays the matching page title alone; the heading and excerpt remain indexed to find pages. Keep the live result count, ArrowDown selection, Return navigation and Escape-to-clear behavior. The Docs credit reads “Built with Love by the LOADOUT team.” The fixed vertical shortcut keeps its text gutter on mobile, but its sidebar clearance must apply only to the desktop sidebar; the mobile sidebar is an auto-height row.


## Layouts for optional display preferences

_Merged from `accessibility-preference-layouts.md`._

### Design read

Keep LOADOUT's industrial field-manual appearance. Optional preferences should produce deliberate reading layouts with clear grouping, wrapped controls and useful whitespace. The default appearance stays the baseline; do not shrink selected text sizes or disable requested spacing to make a screenshot fit.

### Scope and flows

Visitors change reading size, font, spacing, contrast, palettes and pointer behavior in the shared modal or full page. Choices apply immediately, persist across routes/reloads, and reset to normal defaults. At narrow widths or with larger reading settings, layouts should stack cleanly rather than squeeze labels, scatter controls or clip content.

#### Decoration choices

Replace the single Simplify decoration choice with separate controls for hiding the background grid, ASCII drawings, mascots and extra decorative markings (stamps/rulers/lighting). Grain remains its independent Animated/Still/Off selector. Each choice affects only its named layer. Preserve useful content, prize images, diagrams and navigation. Stop hidden mascot and art effects rather than only making their DOM invisible. Migrate saved legacy Simplify decoration choices without losing the user's quiet-page preference, and let each new choice be independently reversed. Use one shared preference owner, including blocked-storage fallback, cross-tab updates and reset.

#### Adaptive presentation

Tune the homepage, Docs, settings page and modal for the real preference combinations. Prioritize More text spacing alone, 125/150/200% reading text, Phantom Sans, and their combinations at 320/390/900/1440px. Keep selected typography and readable line length. Reflow button groups, navigation, labels, quote columns and Docs contents rails when their space becomes insufficient. Ensure the modal's Close remains reachable and its reading area usable on short phones. Avoid global overflow hiding or making text smaller to conceal layout defects.

#### Cursor

When LOADOUT's cursor is enabled, the modal, accessibility shortcut and full settings page should share the theme's pixel arrow/hand with the homepage. Nested control text and decorative hover surfaces must not revert to system cursors. Keep native text-entry affordances and Orry's special interaction cursors. When Use system cursor is on, use native cursors everywhere. Forced colors and coarse pointers keep the existing native behavior.

### Acceptance and implementation ownership

- Preference implementation: display-preferences.ts, its unit tests, Accessibility.tsx, decorative component consumers, plus new decoration-preferences.css imported by layout.tsx. Other agents must not edit these files.
- Adaptive layout implementation: new preference-layout.css imported by the integration owner after accessibility.css/color-vision.css, plus only clearly required accessibility.css changes. No preference state or cursor changes in this workstream.
- Integration owner: cursor.css, layout imports, existing browser regressions, manual browser scenarios and design-system documentation.
- Preserve all existing local organizer-copy/lore changes. No commit or publication.
- Verify independent decoration choices, legacy migration/reset, state persistence, actual computed cursors, full-page and modal reflow, keyboard access and visual hierarchy. Report browser emulation separately from physical-device/screen-reader testing.

### Full combination review and resulting corrections

Review includes 17 representative preference profiles, narrow phones (320/390/430px), desktops (1280/1440/1920px), and 844x390 landscape. All 25 public Docs pages are surveyed with enlarged pixel text and spacing on phone and desktop. Homepage menus, all three settings categories, full settings page and the missing-route page are included. This is a representative combination matrix, not an exhaustive Cartesian product of every option.

The review found obscured Docs text, hero-decoration collisions, broken choice labels, long-word overflow, and a landscape dialog with only 20px of body space. Corrections dock the Docs shortcut inside its header, keep the phone navbar on one row, use a shorter equivalent full-width hero lead at 150/200% phone reading size, move floating shortcuts out of enlarged phone prose, and make short dialog headers compact. Default fonts, selected enlargement and requested letter/line spacing are preserved. Browser regressions cover these failures, plus search, FAQ, prize navigation and focus behavior.

Enlarged desktop hero copy uses a reading measure up to 1140px instead of the normal 540px, reducing height without reducing typography. Only enlargement or extra spacing activates that measure.

### Default appearance boundary

The normal hero, coordinate positions, floating Docs shortcut and compact Docs toolbar stay unchanged. Docking and widened layouts activate only for reading size above 100% or More text spacing; contrast, palettes and decoration choices do not turn them on. Reset restores the default vertical settings directory. New compact Close/Reset labels and full-width horizontal categories apply only in the enlarged settings layouts. Browser regressions explicitly check defaults at 320/390/1440px and verify that contrast alone does not trigger reading layouts.


## Accessibility preferences with the existing appearance preserved

_Merged from `accessibility-preferences-preserve-ui.md`._

Owner approval: 18 October 2026. Implement the reviewed accessibility improvements with subagents. The normal UI and all default effects stay visually unchanged. The only new entry point on existing pages is a small footer **Accessibility** link; settings and support information appear when opened.

### Surface and interaction

Use a native modal dialog for settings, styled with LOADOUT's existing hard borders, graphite/stone palette, Pixelify headings and readable IBM Plex Mono body. A real `/accessibility` link is the fallback when JavaScript is unavailable. Its page provides the same settings and a concise accessibility statement. Add the entry point to the homepage footer, Docs article footer and error footer. No new navbar button or mobile row.

The dialog has a clear title, labelled native checkboxes for light mode, Color-safe palette and Reduce motion, a visible Close button, Escape support, native modal focus containment and focus return to the opener. Link to the full accessibility page for support and known testing limits. Use the existing help/GitHub destinations, without sending messages.

### Shared preferences contract

`app/_components/display-preferences.ts` exports `useDisplayPreferences()` returning `theme` (`dark` or `light`), `colorSafe`, `reduceMotion`, and setters `setTheme`, `setColorSafe`, `setReduceMotion`. It also exports `DisplayPreferencesEffects`, a null-rendering bridge that applies `data-color-safe` to the root element. Keep the existing `loadout-theme` storage key; separate stable keys own the two new booleans. State works without storage, hydrates safely, and synchronizes storage events across tabs. Do not write browser storage during server render.

ThemeSwitch keeps its current input/id/accessible name and uses the shared store. Move the actual checkbox into the navbar beside its visible label; Docs keeps it beside its label too. Mount exactly one `#theme` per route. Preserve existing CSS `:has(#theme:checked)` behavior and theme chooser appearance.

`useMotionPreference` combines the device preference with explicit `reduceMotion`; explicit off never overrides a device request to reduce motion. Keep its current public return shape. A saved Reduce motion preference is a persistent stop mechanism while users continue using the page. Do not add the previously removed global Pause animations button or a new visible control alongside the prize strip.

### Palette and effects

Default preference values preserve all current styling and animations. Color-safe mode overrides accent tokens only. Dark: blue #56B4E9, orange #E69F00, dark ink on blue. Light: blue #005A8D, ochre #7A4600, light text on blue. Check actual panels/buttons rather than trusting token ratios. Preserve native forced-colors behavior, labels, underlines and non-color cues. No simulation filters, new art, fonts, or changed decorative depth treatment.

### Semantics without layout changes

Give track and process-card titles real h3 semantics, resetting browser heading defaults to reproduce their existing typography/margins exactly. Expose the process as meaningful groups/sequence using existing DOM where practical; do not insert layout-changing wrappers. Preserve the current readable content, motion, decorative exclusions and heading labels. Do not expose decorative ASCII or duplicate prize lists to screen readers.

### Ownership

- Preferences agent: shared preference store, ThemeSwitch, motion-preference and focused unit tests.
- Settings agent: Accessibility.tsx (provider, link, dialog, settings), accessibility.css, `/accessibility/page.tsx`, and footer insertion in SiteFooter, DocsDocument and RockBottom.
- Semantics agent: Tracks, HowItWorks, semantics.css and narrow semantic fixes within those owned files.
- Primary: root layout imports/wrapping, ThemeSwitch placement in SiteNav/page/docs-shell, test command, integration/browser tests, design records and review.

### Verification

Preserve pre-existing dirty work and remain in this local checkout. No commit, publication or Slack messages. Compare default layout/screenshots before and after at mobile and desktop widths, retaining the one-row navbar. Test dialog keyboard flow/focus return, all settings, blocked storage, reload/routes/tabs, device reduced motion, forced colors, 200% text/reflow, both themes with color-safe enabled, and existing AA automation. Run meaningful unit checks, lint, typecheck and production compilation. Record actual NVDA/VoiceOver/physical-device limitations without claiming AA certification.


## Display preferences within accessibility settings

_Merged from `accessibility-settings-self-application.md`._

### Problem and design

The modal applies reading preferences inconsistently. At 200%, option descriptions enlarge but category headings, radio labels, Close and Reset remain fixed. Wider spacing reaches a parent without overriding several descendants' own line-height values. Keep the existing industrial field-settings appearance and default dimensions.

### Behavior and scope

- Apply reading size consistently to modal text and shared settings controls, including headings, category summaries, percentage and grain choices, toggle state labels, the palette select, Close, Reset and footer links. Shared controls on `/accessibility` should behave the same way.
- Respect existing default base sizes and mobile overrides; each selected multiplier scales the relevant base size once.
- Apply wider line, letter and word spacing to the actual text elements and controls, not only their container.
- Keep Phantom Sans, palettes, contrast, motion and cursor behavior as wired. These already reach the modal; do not add preference defaults or simulate color deficiencies.
- Preserve native dialog semantics, Escape/outside dismissal and focus return. Ensure text wraps and controls remain usable at 320px and 390px with 200% reading size plus spacing, while the close control stays reachable.
- Preserve all unrelated local organizer-copy and lore changes.

### Acceptance and handoff

Implement in `apps/landing/app/accessibility.css`. Add one meaningful browser regression to the existing display-preferences suite that uses the actual settings and checks computed scaling of previously missed controls, spacing on actual text, and absence of horizontal overflow. Do not add implementation-mirroring string tests. Verify default appearance and responsive enlarged settings using the local preview. No commit, publication, remote changes or broad test run is authorized by this brief.


## Mobile Accessibility shortcut and color-vision palettes

_Merged from `mobile-accessibility-color-vision.md`._

Status: owner approved and implemented in the October 2026 accessibility follow-up. The work began on `fix/mobile-accessibility-color-modes` and was combined with the internal-docs update for the standard development → testing → main release flow. This brief follows `accessibility-record.md` and PR #102; it records the optional controls and their intended behavior, not a separate product-policy source. Keep the existing visual identity and standard appearance.

### Design read

An industrial field manual for technical builders, with a compact fixed control that stays out of the reading column and optional color palettes that keep LOADOUT's graphite/blue and stone/yellow identity.

### Scope and flow

- On phone widths, remove the 56px left gutter reserved for the fixed Accessibility tab. Keep homepage, Docs and `/accessibility` content aligned to their normal page grid.
- Keep the vertical tab on desktop. On phones, keep it visible at the top, retract it while scrolling down, and reveal it at the top, while scrolling up, or whenever keyboard focus enters it. It must remain visible while its dialog is open. Do not let it change page width or create a horizontal scrollbar.
- Keep an Accessibility destination in the homepage mobile menu and Docs Guides drawer, plus existing footer links, so visitors can still reach the settings when the floating handle is retracted.
- Replace the binary Color-safe palette switch with a compact native selector: Standard, Protanopia, Deuteranopia, Tritanopia and Achromatopsia. The selected hint identifies the related anomaly or monochromacy. Standard is the default. A selection persists across routes and reloads.
- Treat each mode as an optional palette preference, not a diagnostic or a whole-page color filter. Do not recolor product photography or alter LOADOUT's default appearance.
- Migrate an old saved `loadout-color-safe=true` preference to the closest blue/orange red-green palette so an existing opt-in is not silently cleared. A new browser with no saved choice uses Standard.

### Visual and interaction rules

- Use LOADOUT's locked field-manual system: existing spacing, squared plates, current type, hard borders and theme-specific colors. No new icons, images, or decorative animation.
- When the phone tab retracts, keep it in keyboard order and reveal it on focus; keep the focus ring visible. Respect safe-area insets. Disable the retract transition under `prefers-reduced-motion`.
- Settings use ruled Appearance, Reading and Effects disclosures, matching the Docs directory's native behavior. Appearance starts expanded. Color vision uses one squared native selector; the short size and grain choices use squared radio indicators. Both themes and forced-colors retain visible state and focus.
- The four palettes adjust semantic accents for their named color-vision needs. Red/green-dependent states must also have labels or icons; categories may use shape, texture or line style. Link distinction must not rely on hue. Achromatopsia uses grayscale luminance levels plus text and shape cues.
- Normal text meets 4.5:1 contrast, large text meets 3:1, and meaningful interface graphics meet 3:1 against adjacent colors. Validate actual rendered pairs in dark and light themes.
- These are optional design presets, not clinical simulations or a promise that one palette fits everyone. Essential information must remain understandable in Standard without any optional preference.

### Acceptance checks

- At 320, 360, 390 and 430 CSS px, homepage, Docs and accessibility page have no reserved left gutter or page-level horizontal overflow. The existing one-row mobile navbar remains unchanged.
- At the top, scroll-down, scroll-up, focused, dialog-open and Guides-drawer states, the phone shortcut is discoverable, does not shift content, and never hides a focused control.
- Every color-vision option works with both themes on the homepage, Docs, accessibility page and dialog. Contrast and non-color cues remain clear on links, buttons, selected controls, status labels, track labels, depth markers and prizes.
- Standard with no saved settings matches the current normal appearance. Existing saved light mode, reduced motion, and legacy color-safe opt-in remain intact; reset returns color vision to Standard.
- Keep the screenshot checks, keyboard and reduced-motion review within the established browser workflow. Do not claim full WCAG conformance from palette checks alone.

### Implementation and verification

The implementation is in `apps/landing`. It uses the existing preference store and dialog and adds no dependencies or UI library. The default appearance remains unchanged; the new preferences are opt-in except for operating-system reduced-motion and increased-contrast settings. Preserve the one-row homepage navigation and unrelated worktree changes.

Design preflight: identity consistency 4/4, hierarchy 3/4, accessibility 4/4, states 3/4, restraint 4/4, motion purpose 3/4. The single signature remains the fixed field tab, now no longer reserving page width. The chosen retract motion communicates that the shortcut is temporarily out of the reader's way; reduced-motion users get an immediate state change.

### Owner-requested visual correction

Keep the modal as the normal entry-point behavior; a normal click opens it without changing the route. Never open it automatically on arrival. The full page is an explicit fallback, with no duplicate floating shortcut. Restyle both surfaces as one ruled field sheet, using compact control rows, pixel section labels, hard-edged switches and the existing RSVP treatment for Close. Avoid a stack of large outlined palette cards and the blank help-column layout. The local preview must be launched with its actual hostname so Next's development-origin checks allow the client bundle to initialize.

### Approved full-page layout

The owner approved a compact page header with the title and Back action aligned, followed by a narrow Appearance / Reading / Effects category rail beside the selected controls. At widths above 820px the rail uses vertical tabs with Arrow Up/Down, Home and End navigation, selected-state borders and matching labelled panels. On smaller screens, retain one column of native disclosures and no rail or reserved gutter. Controls share the existing preference store and presentation with the compact modal; the modal itself retains its current disclosures and fixed Close header. Put a small report/help row below the settings and make the support statement expandable. Keep immediate saving and Reset visible. No additional preferences, decorative assets, dependencies, commits or publication.

Review desktop and narrow phone layouts, keyboard category selection, settings state across a breakpoint change, both themes and the unchanged modal. Selected tabs must be identifiable by text/borders as well as color. With JavaScript unavailable the server-rendered disclosures remain usable to read the options, alongside the existing no-script explanation.

Use the existing shared SiteFooter below the accessibility support content. Its section links lead back to the homepage, retaining the same footer appearance and content as the homepage.

### Approved accessibility follow-up

Add a 200% text-size option (existing 100%, 125% and 150% choices remain), a persisted optional Larger controls toggle that grows compact navigation and control targets to 44px, and automatic use of the operating-system `prefers-contrast: more` setting. Device contrast is never stored as a LOADOUT choice; Reset only resets the user's choices, while device contrast and reduced motion remain active. These features start in their existing default state. The 200% choice extends the current reading-text enlargement, but browser zoom remains available across the whole page.

Use Pixl's Phantom Sans font for the optional font setting, matching the live Pixl font tag. LOADOUT's normal font stack remains unchanged. When Phantom Sans is enabled, replace the page's readable and display font stacks on the homepage, Docs, dialog and full page. Keep the decorative JetBrains Mono ASCII art monospaced. Self-host the Regular, Bold and Italic WOFF2 files from Pixl's font assets; do not request font files from the Pixl site at runtime.

The Larger controls toggle sets compact homepage and Docs navigation, links, buttons and footer links to a 44px minimum target, without changing prose links or the default appearance. Keep its effect limited to this accessibility preference. Verify both themes, each preference, system contrast response, 320px fit, 200% reading text and 400% zoom reflow. Screen-reader checks remain explicitly outstanding; do not imply new settings replace assistive-technology testing.


## Color-vision palette completion and dark hover contrast

_Merged from `color-vision-palette-and-dark-hover.md`._

### Design read

Reading this as a focused accessibility repair for LOADOUT's industrial field manual: preserve the graphite-and-signage identity while making each optional color-vision palette apply to every color-bearing homepage control.

### Problem

The optional palette updates CSS color tokens, but the homepage's pixel sprites and custom cursor are raster assets. Dark-mode icon filtering and cursor image selection therefore continue to show the standard blue/yellow colors under Tritanopia and Achromatopsia. A later dark-panel rule also overrides the Era-step hover background while its dark-ink foreground remains, producing dark text on the dark panel.

### Scope and rules

- Keep palette behavior opt-in; Standard retains the current colors and custom cursor.
- Keep Protanopia and Deuteranopia's blue/orange visual language.
- In Tritanopia, tint homepage icon sprites warm orange in both themes rather than using the standard blue/yellow fills. Use the system pointer because the current custom cursor PNGs have fixed blue/yellow fills.
- In Achromatopsia, render homepage icon sprites in grayscale and use the system pointer.
- In dark mode, make the Era-step hover retain readable theme text on the graphite canvas; indicate hover with the active palette accent on its border and inset edge instead of replacing the card with an accent fill. This corrects the cascade bug for Standard and every optional palette; the light theme is unchanged.
- Keep the color-vision palette behavior opt-in. The dark hover correction is the only standard-theme visual correction in this pass and is directly requested by the owner.
- Leave layout, sprite artwork, cursor artwork, animation and touch behavior unchanged.

### Components and states

| Surface | Standard | Protanopia / Deuteranopia | Tritanopia | Achromatopsia |
|---|---|---|---|---|
| Homepage icon sprites | Existing theme filter | Existing blue/orange palette | Warm orange tint in both themes | Grayscale sprite colors |
| Homepage cursor | Existing theme-colored pixel cursor | Existing theme-colored pixel cursor | Native system cursor | Native system cursor |
| Dark Era-step hover | Graphite panel, readable text, blue accent edge | Graphite panel, readable text, blue/orange accent edge | Graphite panel, readable text, warm accent edge | Graphite panel, readable text, grayscale accent edge |
| Light theme and layout | Existing behavior | Existing profile palette | Existing profile palette | Existing profile palette |

The track name and project tag remain the primary labels; sprite color is supplementary. The cursor retains its native arrow/hand interaction roles. No new motion is added.

### Accessibility and responsive behavior

- Keep the feature opt-in and independent from the saved system-cursor preference; the two profiles with unsuitable fixed cursor colors use the native pointer while active.
- Preserve link underlines and existing text labels. No state depends on color alone.
- Scope rules to profile and theme selectors, not viewport size, so desktop and phone use the same palette behavior.
- Keep forced-colors behavior native and leave touch devices unchanged.

### Acceptance criteria

- Standard dark and light themes retain their current palette and cursor. The dark Era-step hover alone changes to the readable graphite treatment.
- Each non-Standard profile continues to use its existing semantic tokens; Tritanopia has warm-orange homepage icon sprites and a native cursor in both themes, and Achromatopsia has grayscale homepage icon sprites and a native cursor.
- Hovering Era steps in any dark profile leaves the step name at normal theme text contrast and shows the active accent at the edge.
- Light mode, links, buttons, selected controls, and keyboard focus are unchanged.
- CSS diff is limited to color-vision behavior; settings copy only clarifies profile-specific pointer behavior.

### Implementation handoff

Use the existing Next.js homepage and `.ulpi/design/DESIGN.md` as the locked source. Implement the palette-specific overrides in `apps/landing/app/color-vision.css`, the dark-only hover correction in `apps/landing/app/home.css`, and clarify the palette descriptions in `apps/landing/app/_components/Accessibility.tsx`. Do not alter the Standard palette or default cursor assets. Do not add dependencies, assets, or motion. Visual direction stays industrial field manual, with the existing typography, spacing, edges and tokens.


## Color-safe palette and Docs follow-up

_Merged from `color-safe-docs-followup.md`._

Status: owner-requested follow-up after the 2026-10-17 production release. Implement on a short-lived branch and use the normal PR lanes.

Implementation scope update, 2026-10-18: the owner requested unchanged normal UI and effects, allowing a new footer Accessibility entry point. [The approved implementation brief](accessibility-record.md) owns settings placement, shared preferences, semantic fixes and verification. The earlier proposal to add a button beside the theme switch is superseded by the footer entry point.

### Design read

Reading this as two practical improvements for teen builders: a persistent color-safe option in LOADOUT's existing industrial field-manual UI, plus clearer public Docs about the program and its fictional characters.

### Direction

Keep the established field-manual design system. The palette control is a compact labeled button beside the current theme switch; it changes accent tokens only and preserves the visitor's light/dark choice. Do not add filters, gradients, new art, or motion. The Docs continue using flat Markdown content and the current sidebar.

#### Color-safe palette

- Add one persistent **Color-safe palette** toggle on the homepage, Docs, and the 404/cave-in shell.
- The button uses a native `<button>`, a stable accessible name, `aria-pressed`, visible on/off wording, keyboard focus, and the site's hard-edge button treatment.
- Keep light/dark theme preference separate. Persist the color-safe preference in local storage and synchronize it across routes/tabs.
- Dark safe accents: blue `#56B4E9` and orange `#E69F00`; light safe accents: blue `#005A8D` and dark ochre `#7A4600`. Pair accent backgrounds with readable text; keep shape, underline, labels, and existing icon outlines so color is never the only cue.
- Contrast targets against the current page backgrounds: dark blue on `#222627` 6.62:1, dark orange on `#222627` 6.78:1, dark ink on dark blue 7.66:1, light blue on `#DDD3BF` 4.97:1, light ink on light blue 6.69:1, and light ochre on `#DDD3BF` 5.23:1.
- Forced-colors mode continues to use system colors. The control must not interfere with reduced motion, zoom, or keyboard navigation.

### Public Docs changes

- `team.md` is for real organizers and their roles only. Remove the Orry and Goose Lee character profiles from it; retain the existing organizer anchors. A short link may point readers to the separate character page.
- Add `characters.md` under COMMUNITY. Mark the profiles as fiction and write from the friend-facing source files. Use internal backstories only to verify details; do not publish open questions, unconfirmed accident mechanics, or private notes.
- Keep identity respectful and explicit: Goose Lee's mistaken belief that his background gives him Bruce Lee's martial-arts talent is his own misconception, not a claim about Asian people.
- Make the `start.md` overview explain the proposed program and its distinct loop plainly, while keeping its development/not-open status accurate.
- Explain the Ore rating as the multiplier on approved hours in `progress.md`: e.g. 10 approved hours at rating 10 earn 100 base Ore. Keep the separate +10% Era example labeled planned and do not invent a stacking rule or an XP formula.

### Component and content states

| Surface | State | Expected result |
|---|---|---|
| Homepage / Docs | Default palette | Existing colors and content are unchanged. |
| Homepage / Docs | Color-safe on | Safe accent tokens apply while light/dark mode remains unchanged. |
| Any route | Reload or route change | Saved color-safe state is restored. |
| Any route | Storage unavailable | Toggle works for the current page; the default palette remains usable. |
| Any route | Forced colors | System colors stay legible and the button remains operable. |
| Docs | Character page | Fiction label appears; only friend-facing story is public. |
| Docs | Program explanation | Multiplier example uses the approved hours × rating rule and separates Ore from Track XP. |

### Acceptance

- The color-safe button is available on homepage, Docs, and error pages; its name, pressed state, focus, persistence, route synchronization, and mobile reflow are tested.
- Axe checks pass on homepage and Docs in both themes with the palette enabled. The project remains usable with forced colors and reduced motion.
- Team and character pages are clearly distinct. Existing organizer anchors remain valid; a route/link check covers the new character page.
- Public claims match Plans 01 and 02. The example does not publish unsettled multiplier aggregation, XP weighting, or Era stacking.
- Lint, typecheck, unit tests, production build, relevant browser tests, and `git diff --check` pass.
