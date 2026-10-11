# Redesign foundation

**Status:** Implemented and verified locally, 2026-10-10. No commit or publication requested.

## Scope and reference

Apply the visual foundation of the supplied `Loadout – Redesign.html` and `Light mode.png` to the existing homepage. This pass changes colors, fonts, grid/grain, borders, and surface treatment. Keep current section structure, program copy, actions, icons, and responsive content access. Prepared workshop PNGs stay out of the background.

The reference is a warm coalfield worksheet: stone paper, thin coal rules, condensed utility type, pixel headings, ochre actions, and rust detail. Its schedule, level labels, dates, and program claims are presentation examples, not LOADOUT policy.

## Locked foundation

- Canvas `#DDD3BF`; coal ink `#1A1714`; actions `#E3C26B`; rust decoration `#C4491F`. Use darker rust `#84301B` for small text requiring contrast.
- Keep secondary text at `#5A5145` for readable contrast. Light metal plates use `#D6CCB7` and `#CBBFA8`; use the existing warm surface for ordinary reading cards.
- Pixelify Sans 700: homepage headlines, section titles, brand, and card titles. Barlow Condensed 500/600/700: body, nav, labels, supporting copy. JetBrains Mono 400–800: action labels, ASCII art, code, and technical values. Self-host the font assets and retain their OFL notices.
- Use a 40px grid and a faint 200px guide. Grain remains static, subtle, and non-interactive. A gentle bottom paper shade can echo the reference without affecting contrast.
- Reduce thick card/control borders to 1px and remove existing block shadows from the changed homepage surfaces. Preserve visible focus and existing hover/press feedback.
- Restyle the four track cards as light metal plates; their structure, labels, and examples remain unchanged. Do not add new decorative rivets or page sections in this first pass.

## Responsive and accessibility

Keep the desktop hero title on its existing two explicit lines, with Pixelify sizes that fit its current container. On smaller screens, allow the current responsive layout and hide background ASCII before it collides with content. Body copy remains at least 16px, with major descriptive copy near 18px. Keep 44px control targets and visible keyboard focus. Static textures do not require motion; existing reduced-motion behavior remains intact.

## Build scope

The engineering owner implements the visual rules in a new `apps/landing/app/redesign-foundation.css`, scoped to `.site-shell`. Root integration loads the self-hosted fonts and imports that sheet last. Do not change Docs layout, the homepage component tree, public facts, or source artwork.

## Later passes

EN/DE content and a working language control, depth ruler, section transitions, stamps, and additional reference interactions follow as separate behavior changes.

## Header refinement

The owner requested the navigator match the supplied HTML in styling and spacing, including its boxed moon/sun control. Use the reference's simple coal hexagon, 24px Pixelify wordmark, five condensed navigation labels, 30px gaps, 12px/20px bar padding, 38px RSVP shape, and the two 14px theme drawings. Keep the bar visible during scrolling. About points to the hero introduction, Tracks to the existing tracks, Progression to personal progression, FAQ to answers, and Community to the existing organizer/community context.

The native theme button changes the homepage shell between the reference's light paper and dark coal palettes, announces its pressed state, and remembers the choice in browser storage when available. Default to light. Its visual box matches the reference while an expanded hit area provides 44px interaction height. Theme colors apply to the homepage only. Keep keyboard focus, mobile navigation, and real RSVP destination; retain original icon assets on disk. The language indicator remains informational until EN/DE switching is implemented.

## Acceptance

- Homepage uses the three font roles and light-reference colors.
- Desktop hero title stays on two rows; mobile remains readable without horizontal overflow.
- Track panels are light, utility controls use thin rules, and body text stays legible.
- Current routes, section order, actions, and product facts remain intact.
- Build, type check, and desktop/mobile browser inspection complete before reporting the result.

## Verification record

Lint, TypeScript, and the production build passed. The final built homepage was captured at 1920×1080, 1440×900, and 390×844 with reduced motion; none had document-level horizontal overflow. Desktop hero spans stayed on two explicit lines, and browser-computed fonts confirmed Pixelify Sans and Barlow Condensed. Captures live in the ignored `.impeccable/review/foundation/` folder. The Impeccable detector's only advisory was the paper grid, which is explicitly required by the supplied design.

The refined header was checked at 1920px, 1440px, 901px, and 390px. All had zero header sprites and no navigation overflow. The mobile menu opened, closed with Escape, and restored focus to its toggle. Lint and the production build passed again after the header change.

The complete navigator/theme pass was checked at 1440px, 1024px, 901px, 390px, and 320px. Desktop computed values matched the reference: 64px bar height, 12px/20px padding, and 30px gaps. All five destinations resolved, the bar stayed visible during scrolling, and no header/document overflow appeared. Clicking or pressing Space changed the theme; reloading retained it. Final gold labels used coal text in dark mode. Lint and production build passed; captures are in `.impeccable/review/navigator/`.
