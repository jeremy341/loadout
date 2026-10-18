# Restore the compact mobile navbar

## Problem and scope

The accessibility patch in home.css forces the logo and menu onto one row and `.nav-actions` onto another below 420px. The owner wants the normal phone navigation back on one row. Retain the current industrial field-manual typography, colors, borders and controls.

## Behavior and implementation direction

- Keep the current logo, hamburger, theme chooser and RSVP together at normal text settings from 320px through 420px, including 360px, 375px and 390px. Preserve the full wordmark if practical.
- Remove the forced full-width action row, its ordering overrides and the forced 180px hero clearance. Keep the existing ResizeObserver-based clearance so content follows actual navbar height.
- Use mobile-only spacing, horizontal padding and, only if needed at the narrowest widths, a compact wordmark size. Keep controls at least 44px tall and the menu at least 44px square. Theme and RSVP heights must match.
- Keep flexible reflow for increased text size or user letter/word spacing. Do not force nowrap globally, clip controls, truncate the RSVP or disable zoom. The normal state is one row; genuinely enlarged content may wrap.
- Do not change desktop presentation, theme ownership, menu logic, hide-on-scroll, focus handling or Docs navigation.

## Acceptance and verification

Measure default navbar controls at 320/360/375/390/420/430px: logo, menu, theme and RSVP must have a common vertical center, remain inside the navbar and not overlap. Keep the existing accessibility text-spacing check, theme/RSVP height check and mobile-menu keyboard behavior passing. Inspect mobile screenshot evidence if available. Changes stay local; no commit, branch switch, Slack message or publication.

## Ownership

A UI engineer implements only home.css and the appropriate existing navigation regression test in accessibility.spec.ts. Primary agent owns this brief and integration checks. Preserve existing unrelated edits to home.css.
