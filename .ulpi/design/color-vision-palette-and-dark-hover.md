# Color-vision palette completion and dark hover contrast

## Design read

Reading this as a focused accessibility repair for LOADOUT's industrial field manual: preserve the graphite-and-signage identity while making each optional color-vision palette apply to every color-bearing homepage control.

## Problem

The optional palette updates CSS color tokens, but the homepage's pixel sprites and custom cursor are raster assets. Dark-mode icon filtering and cursor image selection therefore continue to show the standard blue/yellow colors under Tritanopia and Achromatopsia. A later dark-panel rule also overrides the Era-step hover background while its dark-ink foreground remains, producing dark text on the dark panel.

## Scope and rules

- Keep palette behavior opt-in; Standard retains the current colors and custom cursor.
- Keep Protanopia and Deuteranopia's blue/orange visual language.
- In Tritanopia, tint homepage icon sprites warm orange in both themes rather than using the standard blue/yellow fills. Use the system pointer because the current custom cursor PNGs have fixed blue/yellow fills.
- In Achromatopsia, render homepage icon sprites in grayscale and use the system pointer.
- In dark mode, make the Era-step hover retain readable theme text on the graphite canvas; indicate hover with the active palette accent on its border and inset edge instead of replacing the card with an accent fill. This corrects the cascade bug for Standard and every optional palette; the light theme is unchanged.
- Keep the color-vision palette behavior opt-in. The dark hover correction is the only standard-theme visual correction in this pass and is directly requested by the owner.
- Leave layout, sprite artwork, cursor artwork, animation and touch behavior unchanged.

## Components and states

| Surface | Standard | Protanopia / Deuteranopia | Tritanopia | Achromatopsia |
|---|---|---|---|---|
| Homepage icon sprites | Existing theme filter | Existing blue/orange palette | Warm orange tint in both themes | Grayscale sprite colors |
| Homepage cursor | Existing theme-colored pixel cursor | Existing theme-colored pixel cursor | Native system cursor | Native system cursor |
| Dark Era-step hover | Graphite panel, readable text, blue accent edge | Graphite panel, readable text, blue/orange accent edge | Graphite panel, readable text, warm accent edge | Graphite panel, readable text, grayscale accent edge |
| Light theme and layout | Existing behavior | Existing profile palette | Existing profile palette | Existing profile palette |

The track name and project tag remain the primary labels; sprite color is supplementary. The cursor retains its native arrow/hand interaction roles. No new motion is added.

## Accessibility and responsive behavior

- Keep the feature opt-in and independent from the saved system-cursor preference; the two profiles with unsuitable fixed cursor colors use the native pointer while active.
- Preserve link underlines and existing text labels. No state depends on color alone.
- Scope rules to profile and theme selectors, not viewport size, so desktop and phone use the same palette behavior.
- Keep forced-colors behavior native and leave touch devices unchanged.

## Acceptance criteria

- Standard dark and light themes retain their current palette and cursor. The dark Era-step hover alone changes to the readable graphite treatment.
- Each non-Standard profile continues to use its existing semantic tokens; Tritanopia has warm-orange homepage icon sprites and a native cursor in both themes, and Achromatopsia has grayscale homepage icon sprites and a native cursor.
- Hovering Era steps in any dark profile leaves the step name at normal theme text contrast and shows the active accent at the edge.
- Light mode, links, buttons, selected controls, and keyboard focus are unchanged.
- CSS diff is limited to color-vision behavior; settings copy only clarifies profile-specific pointer behavior.

## Implementation handoff

Use the existing Next.js homepage and `.ulpi/design/DESIGN.md` as the locked source. Implement the palette-specific overrides in `apps/landing/app/color-vision.css`, the dark-only hover correction in `apps/landing/app/home.css`, and clarify the palette descriptions in `apps/landing/app/_components/Accessibility.tsx`. Do not alter the Standard palette or default cursor assets. Do not add dependencies, assets, or motion. Visual direction stays industrial field manual, with the existing typography, spacing, edges and tokens.
