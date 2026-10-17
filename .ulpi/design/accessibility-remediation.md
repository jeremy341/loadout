# Accessibility remediation

Status: owner approved all fixes in the 2026-10-17 audit. Keep all work local; no Slack messages, commits or deployment. Preserve existing dirty Era/footer/prize-loop changes.

## Design read

Use LOADOUT's current industrial field-manual system: graphite/blue dark theme, paper/yellow light theme, pixel headings, hard rules and existing artwork. This is accessibility remediation, not a redesign or new program policy. The seven required UI skills have been consulted in this conversation. No new vector/sprite art is necessary.

## Layout and semantics owner (UI agent, GPT-6.1 Sol medium)

Own home.css, docs.css, DocsDocument.tsx, DocsTab.tsx, RockBottom.tsx, SiteNav.tsx and Hero.tsx. Coordinate rather than edit files owned below.

- Keep every navigation control reachable at 320px and with increased text size/spacing. Let groups wrap/reflow; do not hide functions, clip overflow or globally shrink the type. Reserve a nonshrinking 44px menu target. Preserve current ordinary-width composition as closely as possible.
- Allow hero title lines and Docs brand/header to wrap when enlarged; prevent clipping in the article, sidebar and short/landscape layouts. Hide/reposition only decorative stamps when their fixed placement collides with reading text.
- Darken small light-mode accent text to >=4.5:1 on its actual panels (currently failing #C4491F links/Era numerals). Keep decorative accent/button colors unless their contrast needs correction.
- Make depth labels readable by default (retain pointer glow as enhancement). Keep footer watermark and ornamental ASCII decorative.
- Give the floating link a name containing the visible words LOADOUT DOCS.
- Render Markdown pre blocks as explicitly focusable, labelled code examples with a visible focus ring; preserve safe ReactMarkdown/GFM/no raw HTML.
- Keep 404/error ThemeSwitch and footer text inside landmarks. Add a MotionToggle in the RockBottom footer, using the component supplied by the motion owner.
- Supply forced-colors-safe menu/theme/Docs control graphics or visible fallback text. Do not blanket-disable forced colors on the app.
- Mark genuine foreign-language phrases in owned components where appropriate. Preserve English page language and all policy/copy.

## Motion and mascot owner (UI agent, GPT-6.1 Sol medium)

Own new shared motion-preference module, MotionToggle.tsx and motion.css; layout.tsx; NoiseGrain.tsx; PlannedPrizes.tsx and prize-belt.css; DocsShell (docs-shell.tsx); mascot files/engine/mole.css; ScrambleHeadings/HoverScramble as needed. SiteFooter.tsx is yours: preserve the already-restored metadata and direct channel links.

- Provide one shared persistent Pause animations / Resume animations control, available beside the prize belt and in the shared homepage/Docs/error surfaces. Use a small existing-style button, visible state, aria-pressed, same-tab behavior, keyboard activation and readable focus. No floating overlay or new navigation section.
- Keep a saved user motion preference in a small shared client store; honor prefers-reduced-motion, storage denial and route changes. Reduced-motion users must not get automatic animation. Do not present a Resume control that falsely promises to override an active system preference.
- Pause the belt after focus leaves, and pause/hide other automatic decoration including animated grain, ASCII/icon motion and automatic mascot motion. Show all reveal content when paused; do not freeze it invisible. Stop timers/listeners while paused and clean up on navigation. Preserve the 70s belt, 230px card columns, 16px spacing and reduced-motion static accessible list.
- Temporarily hiding the mascot for a paused page must not overwrite the visitor's saved hide/show choice. Keep resume reliable and controls honest about the paused state.
- Add compact optional keyboard/single-click mascot controls (native disclosure is appropriate): call, pet, move left/right. Reuse the engine's event seam, clamp placement within the viewport, provide useful status feedback and avoid trapping focus. Preserve existing pointer gestures and moods. Do not add a second animation engine. Review path-dependent gestures as decorative play; no essential document function may require them.
- Keep new controls compatible with forced colors and enlarged text.

## Parent verification / tests

Parent owns e2e test updates, this brief/index and the report. Expand the actual accessibility suite from a hardcoded list to all public Markdown routes plus homepage/docs/404. Set real theme storage and assert the rendered theme, rather than only emulating system color scheme. Add focused regression checks for 320px navigation, standardized text spacing, enlarged text, persistent pause, label/name and code focus. Run typecheck/lint/unit/relevant e2e, then the external full-page/state/layout audit runners. Save screenshots outside the repo. Report remaining assistive-technology and real-device limits accurately; no unsupported AA certification claim.

## Acceptance

All concrete audit F1–F7 cases resolved without lost content, functionality or extra public rules. The earlier restored panels and uniform prize seam remain. Keyboard FAQ, skip links, Docs drawer/search/contents navigation and route/back behavior remain usable. Meaningful motion respects both explicit pause and reduced motion. Keep changes reviewable, and document any unavoidable verification limits rather than weakening checks.

## Verification record

- Full Playwright suite against the local preview: **299 passed**. This includes homepage, all public Docs routes, 404s, Orry interactions, reduced-motion and explicit-pause controls, forced colors, and the route/theme axe scans.
- Axe scan matrix: **119 accessibility tests passed**, covering 28 routes in light/dark at 375/1440px plus focused keyboard, text-spacing, 200%-text, motion-persistence, semantics and forced-colors checks.
- Layout runner: 78 route/state probes. No page-level horizontal scrolling at 320px. Git command samples keep their own keyboard-scrollable code containers. The Tracks comparison table was changed to fixed layout with wrapping; the added enlarged-text regression test passes.
- `tsc --noEmit` and ESLint passed. Unit suite: 53 passed; Bun printed one non-failing `EPERM` while scanning the user profile.
- The production build remains unverified in this environment: Turbopack could not start its CSS worker, and the Webpack retry could not fetch Google Fonts because DNS/network access was unavailable.
- This does not certify WCAG 2.2 AA. Real browser zoom, NVDA/VoiceOver, speech control, physical-device checks and a full flash-luminance assessment still need human review.
