# Accessibility field panel and visible shortcut

Approved 18 October 2026. Supersedes the footer-only entry-point limitation in accessibility-preferences-preserve-ui.md. Implement directly, without subagents, commits or publication.

Use LOADOUT's engineering-paper grid, Pixelify signage, IBM Plex Mono text, squared plates and asymmetric hard borders. Present preferences as three numbered rows in one field panel, with native checkboxes and explicit on/off text. Keep the existing shared store, dialog focus behavior, fallback link, device reduced-motion handling and all default homepage effects.

Add a persistent Accessibility tab styled after LOADOUT DOCS. The owner refined its orientation: a vertical label running down the left edge, flush against that edge, with a minimum 44px target width. Match the Docs tab's 150ms ease-out border lift on hover, oriented outward: increase the left border by 2px, and return it on press. Respect reduced-motion settings. On homepage/error/accessibility routes place it below the fixed navigation at the left edge, tracking actual navigation size. On Docs place it at the lower left so it cannot cover sidebar branding or the mobile Guides controls. Retain footer links. The dedicated page uses a wider field-manual composition, a short introductory column, preference panel and ruled statement section. On phones stack these in reading order; bound the dialog and wrap long/enlarged text. No icons, new assets or decorative animation.

Preserve keyboard focus, Escape and return to opener; real /accessibility fallback when JavaScript is absent; 44px targets; both themes; color-safe/forced-color settings. No unrelated layout/content changes. Review changed surfaces visually at desktop/mobile. Run source checks; tests only when requested.
## Follow-up: controls and simpler page

Owner requested styled on/off controls, the RSVP treatment for Close, a cleaner full page and an option to remove grain entirely. Use native checkbox semantics with a squared, two-position visual switch and ON/OFF text. Match the homepage button's 2px border, small radius, pixel capitals and hard shadow for Close, preserving a 44px target.

Keep the full page in one 760px reading column: heading and short introduction, Appearance settings, Effects settings, then the statement. The dialog reuses the same grouped settings. Add independent persisted Hide grain and Underline links preferences. Hide grain unmounts the decorative canvas and stops its timer; Reduce motion can still leave a static grain frame when Hide grain is off. Underlines apply to text links, without changing button/tab appearance. All new choices default off and use the existing shared preference store. Keep the vertical shortcut and hover lift unchanged. No subagents, messages, commits or publication.
## Approved expanded accessibility controls

Owner approved the read-only review's full plan: plain typography; reading size 100/125/150%; wider text spacing; stronger contrast; system cursor; simplified decorative background/art/mascot; independent native scrolling; reset; and Animated/Still/Off grain. New preferences default to the existing design. Keep saved theme, color-safe and reduce-motion keys; migrate Hide grain into the grain selector without losing an existing off choice.

Keep the native dialog and focus ownership. Place the shortcut early in keyboard order after the route's skip link, align title and Close in one row with the kicker above it, make the header sticky while the body scrolls, and dismiss only when both pointer-down and pointer-up occur on the outside backdrop. Escape/Close retain focus return. Reuse settings on the full page with a two-thirds settings column and a short help column, stacking on mobile. Browser zoom, forced colours, reflow and keyboard behavior stay available without enabling any optional preference. No publication, Slack messages or commits. Implement directly without subagents. Report unperformed physical-device, real screen-reader and flash assessment separately.

## First development PR: default behavior and Docs polish

Optional display preferences remain off by default. Required keyboard access, screen-reader semantics, visible focus, device motion/forced-colour support, browser zoom/reflow, skip links and the system cursor when selected work without activating optional presentation modes. Do not add a master switch that gates fundamental accessibility.

Keep the fixed Accessibility tab after the route skip link, with its narrow-screen gutter. Limit bottom clearance for the Docs tab to the desktop sidebar; mobile Docs uses an auto-height top row and must not inherit desktop tab padding. Results in Docs search render the matching page title only; keep headings and text indexed for retrieval, and keep the polite result count. Article credits read “Built with Love by the LOADOUT team.”

## Development PR additions

Keep optional display presets off by default, leaving the regular LOADOUT appearance intact until a visitor chooses one. The Accessibility shortcut opens the settings; it does not enable them. Basic semantics, keyboard support, skip navigation and respecting device preferences stay available as the normal site experience.

Docs search displays the matching page title alone; the heading and excerpt remain indexed to find pages. Keep the live result count, ArrowDown selection, Return navigation and Escape-to-clear behavior. The Docs credit reads “Built with Love by the LOADOUT team.” The fixed vertical shortcut keeps its text gutter on mobile, but its sidebar clearance must apply only to the desktop sidebar; the mobile sidebar is an auto-height row.
