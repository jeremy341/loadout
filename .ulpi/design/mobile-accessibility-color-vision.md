# Mobile Accessibility shortcut and color-vision palettes

Status: owner approved and implemented in the October 2026 accessibility follow-up. The work began on `fix/mobile-accessibility-color-modes` and was combined with the internal-docs update for the standard development → testing → main release flow. This brief follows `accessibility-field-panel.md` and PR #102; it records the optional controls and their intended behavior, not a separate product-policy source. Keep the existing visual identity and standard appearance.

## Design read

An industrial field manual for technical builders, with a compact fixed control that stays out of the reading column and optional color palettes that keep LOADOUT's graphite/blue and stone/yellow identity.

## Scope and flow

- On phone widths, remove the 56px left gutter reserved for the fixed Accessibility tab. Keep homepage, Docs and `/accessibility` content aligned to their normal page grid.
- Keep the vertical tab on desktop. On phones, keep it visible at the top, retract it while scrolling down, and reveal it at the top, while scrolling up, or whenever keyboard focus enters it. It must remain visible while its dialog is open. Do not let it change page width or create a horizontal scrollbar.
- Keep an Accessibility destination in the homepage mobile menu and Docs Guides drawer, plus existing footer links, so visitors can still reach the settings when the floating handle is retracted.
- Replace the binary Color-safe palette switch with a compact native selector: Standard, Protanopia, Deuteranopia, Tritanopia and Achromatopsia. The selected hint identifies the related anomaly or monochromacy. Standard is the default. A selection persists across routes and reloads.
- Treat each mode as an optional palette preference, not a diagnostic or a whole-page color filter. Do not recolor product photography or alter LOADOUT's default appearance.
- Migrate an old saved `loadout-color-safe=true` preference to the closest blue/orange red-green palette so an existing opt-in is not silently cleared. A new browser with no saved choice uses Standard.

## Visual and interaction rules

- Use LOADOUT's locked field-manual system: existing spacing, squared plates, current type, hard borders and theme-specific colors. No new icons, images, or decorative animation.
- When the phone tab retracts, keep it in keyboard order and reveal it on focus; keep the focus ring visible. Respect safe-area insets. Disable the retract transition under `prefers-reduced-motion`.
- Settings use ruled Appearance, Reading and Effects disclosures, matching the Docs directory's native behavior. Appearance starts expanded. Color vision uses one squared native selector; the short size and grain choices use squared radio indicators. Both themes and forced-colors retain visible state and focus.
- The four palettes adjust semantic accents for their named color-vision needs. Red/green-dependent states must also have labels or icons; categories may use shape, texture or line style. Link distinction must not rely on hue. Achromatopsia uses grayscale luminance levels plus text and shape cues.
- Normal text meets 4.5:1 contrast, large text meets 3:1, and meaningful interface graphics meet 3:1 against adjacent colors. Validate actual rendered pairs in dark and light themes.
- These are optional design presets, not clinical simulations or a promise that one palette fits everyone. Essential information must remain understandable in Standard without any optional preference.

## Acceptance checks

- At 320, 360, 390 and 430 CSS px, homepage, Docs and accessibility page have no reserved left gutter or page-level horizontal overflow. The existing one-row mobile navbar remains unchanged.
- At the top, scroll-down, scroll-up, focused, dialog-open and Guides-drawer states, the phone shortcut is discoverable, does not shift content, and never hides a focused control.
- Every color-vision option works with both themes on the homepage, Docs, accessibility page and dialog. Contrast and non-color cues remain clear on links, buttons, selected controls, status labels, track labels, depth markers and prizes.
- Standard with no saved settings matches the current normal appearance. Existing saved light mode, reduced motion, and legacy color-safe opt-in remain intact; reset returns color vision to Standard.
- Keep the screenshot checks, keyboard and reduced-motion review within the established browser workflow. Do not claim full WCAG conformance from palette checks alone.

## Implementation and verification

The implementation is in `apps/landing`. It uses the existing preference store and dialog and adds no dependencies or UI library. The default appearance remains unchanged; the new preferences are opt-in except for operating-system reduced-motion and increased-contrast settings. Preserve the one-row homepage navigation and unrelated worktree changes.

Design preflight: identity consistency 4/4, hierarchy 3/4, accessibility 4/4, states 3/4, restraint 4/4, motion purpose 3/4. The single signature remains the fixed field tab, now no longer reserving page width. The chosen retract motion communicates that the shortcut is temporarily out of the reader's way; reduced-motion users get an immediate state change.

## Owner-requested visual correction

Keep the modal as the normal entry-point behavior; a normal click opens it without changing the route. Never open it automatically on arrival. The full page is an explicit fallback, with no duplicate floating shortcut. Restyle both surfaces as one ruled field sheet, using compact control rows, pixel section labels, hard-edged switches and the existing RSVP treatment for Close. Avoid a stack of large outlined palette cards and the blank help-column layout. The local preview must be launched with its actual hostname so Next's development-origin checks allow the client bundle to initialize.

## Approved full-page layout

The owner approved a compact page header with the title and Back action aligned, followed by a narrow Appearance / Reading / Effects category rail beside the selected controls. At widths above 820px the rail uses vertical tabs with Arrow Up/Down, Home and End navigation, selected-state borders and matching labelled panels. On smaller screens, retain one column of native disclosures and no rail or reserved gutter. Controls share the existing preference store and presentation with the compact modal; the modal itself retains its current disclosures and fixed Close header. Put a small report/help row below the settings and make the support statement expandable. Keep immediate saving and Reset visible. No additional preferences, decorative assets, dependencies, commits or publication.

Review desktop and narrow phone layouts, keyboard category selection, settings state across a breakpoint change, both themes and the unchanged modal. Selected tabs must be identifiable by text/borders as well as color. With JavaScript unavailable the server-rendered disclosures remain usable to read the options, alongside the existing no-script explanation.

Use the existing shared SiteFooter below the accessibility support content. Its section links lead back to the homepage, retaining the same footer appearance and content as the homepage.

## Approved accessibility follow-up

Add a 200% text-size option (existing 100%, 125% and 150% choices remain), a persisted optional Larger controls toggle that grows compact navigation and control targets to 44px, and automatic use of the operating-system `prefers-contrast: more` setting. Device contrast is never stored as a LOADOUT choice; Reset only resets the user's choices, while device contrast and reduced motion remain active. These features start in their existing default state. The 200% choice extends the current reading-text enlargement, but browser zoom remains available across the whole page.

Use Pixl's Phantom Sans font for the optional font setting, matching the live Pixl font tag. LOADOUT's normal font stack remains unchanged. When Phantom Sans is enabled, replace the page's readable and display font stacks on the homepage, Docs, dialog and full page. Keep the decorative JetBrains Mono ASCII art monospaced. Self-host the Regular, Bold and Italic WOFF2 files from Pixl's font assets; do not request font files from the Pixl site at runtime.

The Larger controls toggle sets compact homepage and Docs navigation, links, buttons and footer links to a 44px minimum target, without changing prose links or the default appearance. Keep its effect limited to this accessibility preference. Verify both themes, each preference, system contrast response, 320px fit, 200% reading text and 400% zoom reflow. Screen-reader checks remain explicitly outstanding; do not imply new settings replace assistive-technology testing.
