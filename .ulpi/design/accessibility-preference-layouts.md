# Layouts for optional display preferences

## Design read

Keep LOADOUT's industrial field-manual appearance. Optional preferences should produce deliberate reading layouts with clear grouping, wrapped controls and useful whitespace. The default appearance stays the baseline; do not shrink selected text sizes or disable requested spacing to make a screenshot fit.

## Scope and flows

Visitors change reading size, font, spacing, contrast, palettes and pointer behavior in the shared modal or full page. Choices apply immediately, persist across routes/reloads, and reset to normal defaults. At narrow widths or with larger reading settings, layouts should stack cleanly rather than squeeze labels, scatter controls or clip content.

### Decoration choices

Replace the single Simplify decoration choice with separate controls for hiding the background grid, ASCII drawings, mascots and extra decorative markings (stamps/rulers/lighting). Grain remains its independent Animated/Still/Off selector. Each choice affects only its named layer. Preserve useful content, prize images, diagrams and navigation. Stop hidden mascot and art effects rather than only making their DOM invisible. Migrate saved legacy Simplify decoration choices without losing the user's quiet-page preference, and let each new choice be independently reversed. Use one shared preference owner, including blocked-storage fallback, cross-tab updates and reset.

### Adaptive presentation

Tune the homepage, Docs, settings page and modal for the real preference combinations. Prioritize More text spacing alone, 125/150/200% reading text, Phantom Sans, and their combinations at 320/390/900/1440px. Keep selected typography and readable line length. Reflow button groups, navigation, labels, quote columns and Docs contents rails when their space becomes insufficient. Ensure the modal's Close remains reachable and its reading area usable on short phones. Avoid global overflow hiding or making text smaller to conceal layout defects.

### Cursor

When LOADOUT's cursor is enabled, the modal, accessibility shortcut and full settings page should share the theme's pixel arrow/hand with the homepage. Nested control text and decorative hover surfaces must not revert to system cursors. Keep native text-entry affordances and Orry's special interaction cursors. When Use system cursor is on, use native cursors everywhere. Forced colors and coarse pointers keep the existing native behavior.

## Acceptance and implementation ownership

- Preference implementation: display-preferences.ts, its unit tests, Accessibility.tsx, decorative component consumers, plus new decoration-preferences.css imported by layout.tsx. Other agents must not edit these files.
- Adaptive layout implementation: new preference-layout.css imported by the integration owner after accessibility.css/color-vision.css, plus only clearly required accessibility.css changes. No preference state or cursor changes in this workstream.
- Integration owner: cursor.css, layout imports, existing browser regressions, manual browser scenarios and design-system documentation.
- Preserve all existing local organizer-copy/lore changes. No commit or publication.
- Verify independent decoration choices, legacy migration/reset, state persistence, actual computed cursors, full-page and modal reflow, keyboard access and visual hierarchy. Report browser emulation separately from physical-device/screen-reader testing.

## Full combination review and resulting corrections

Review includes 17 representative preference profiles, narrow phones (320/390/430px), desktops (1280/1440/1920px), and 844x390 landscape. All 25 public Docs pages are surveyed with enlarged pixel text and spacing on phone and desktop. Homepage menus, all three settings categories, full settings page and the missing-route page are included. This is a representative combination matrix, not an exhaustive Cartesian product of every option.

The review found obscured Docs text, hero-decoration collisions, broken choice labels, long-word overflow, and a landscape dialog with only 20px of body space. Corrections dock the Docs shortcut inside its header, keep the phone navbar on one row, use a shorter equivalent full-width hero lead at 150/200% phone reading size, move floating shortcuts out of enlarged phone prose, and make short dialog headers compact. Default fonts, selected enlargement and requested letter/line spacing are preserved. Browser regressions cover these failures, plus search, FAQ, prize navigation and focus behavior.

Enlarged desktop hero copy uses a reading measure up to 1140px instead of the normal 540px, reducing height without reducing typography. Only enlargement or extra spacing activates that measure.

## Default appearance boundary

The normal hero, coordinate positions, floating Docs shortcut and compact Docs toolbar stay unchanged. Docking and widened layouts activate only for reading size above 100% or More text spacing; contrast, palettes and decoration choices do not turn them on. Reset restores the default vertical settings directory. New compact Close/Reset labels and full-width horizontal categories apply only in the enlarged settings layouts. Browser regressions explicitly check defaults at 320/390/1440px and verify that contrast alone does not trigger reading layouts.
