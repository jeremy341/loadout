# Accessibility preferences with the existing appearance preserved

Owner approval: 18 October 2026. Implement the reviewed accessibility improvements with subagents. The normal UI and all default effects stay visually unchanged. The only new entry point on existing pages is a small footer **Accessibility** link; settings and support information appear when opened.

## Surface and interaction

Use a native modal dialog for settings, styled with LOADOUT's existing hard borders, graphite/stone palette, Pixelify headings and readable IBM Plex Mono body. A real `/accessibility` link is the fallback when JavaScript is unavailable. Its page provides the same settings and a concise accessibility statement. Add the entry point to the homepage footer, Docs article footer and error footer. No new navbar button or mobile row.

The dialog has a clear title, labelled native checkboxes for light mode, Color-safe palette and Reduce motion, a visible Close button, Escape support, native modal focus containment and focus return to the opener. Link to the full accessibility page for support and known testing limits. Use the existing help/GitHub destinations, without sending messages.

## Shared preferences contract

`app/_components/display-preferences.ts` exports `useDisplayPreferences()` returning `theme` (`dark` or `light`), `colorSafe`, `reduceMotion`, and setters `setTheme`, `setColorSafe`, `setReduceMotion`. It also exports `DisplayPreferencesEffects`, a null-rendering bridge that applies `data-color-safe` to the root element. Keep the existing `loadout-theme` storage key; separate stable keys own the two new booleans. State works without storage, hydrates safely, and synchronizes storage events across tabs. Do not write browser storage during server render.

ThemeSwitch keeps its current input/id/accessible name and uses the shared store. Move the actual checkbox into the navbar beside its visible label; Docs keeps it beside its label too. Mount exactly one `#theme` per route. Preserve existing CSS `:has(#theme:checked)` behavior and theme chooser appearance.

`useMotionPreference` combines the device preference with explicit `reduceMotion`; explicit off never overrides a device request to reduce motion. Keep its current public return shape. A saved Reduce motion preference is a persistent stop mechanism while users continue using the page. Do not add the previously removed global Pause animations button or a new visible control alongside the prize strip.

## Palette and effects

Default preference values preserve all current styling and animations. Color-safe mode overrides accent tokens only. Dark: blue #56B4E9, orange #E69F00, dark ink on blue. Light: blue #005A8D, ochre #7A4600, light text on blue. Check actual panels/buttons rather than trusting token ratios. Preserve native forced-colors behavior, labels, underlines and non-color cues. No simulation filters, new art, fonts, or changed decorative depth treatment.

## Semantics without layout changes

Give track and process-card titles real h3 semantics, resetting browser heading defaults to reproduce their existing typography/margins exactly. Expose the process as meaningful groups/sequence using existing DOM where practical; do not insert layout-changing wrappers. Preserve the current readable content, motion, decorative exclusions and heading labels. Do not expose decorative ASCII or duplicate prize lists to screen readers.

## Ownership

- Preferences agent: shared preference store, ThemeSwitch, motion-preference and focused unit tests.
- Settings agent: Accessibility.tsx (provider, link, dialog, settings), accessibility.css, `/accessibility/page.tsx`, and footer insertion in SiteFooter, DocsDocument and RockBottom.
- Semantics agent: Tracks, HowItWorks, semantics.css and narrow semantic fixes within those owned files.
- Primary: root layout imports/wrapping, ThemeSwitch placement in SiteNav/page/docs-shell, test command, integration/browser tests, design records and review.

## Verification

Preserve pre-existing dirty work and remain in this local checkout. No commit, publication or Slack messages. Compare default layout/screenshots before and after at mobile and desktop widths, retaining the one-row navbar. Test dialog keyboard flow/focus return, all settings, blocked storage, reload/routes/tabs, device reduced motion, forced colors, 200% text/reflow, both themes with color-safe enabled, and existing AA automation. Run meaningful unit checks, lint, typecheck and production compilation. Record actual NVDA/VoiceOver/physical-device limitations without claiming AA certification.
