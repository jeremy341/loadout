# Display preferences within accessibility settings

## Problem and design

The modal applies reading preferences inconsistently. At 200%, option descriptions enlarge but category headings, radio labels, Close and Reset remain fixed. Wider spacing reaches a parent without overriding several descendants' own line-height values. Keep the existing industrial field-settings appearance and default dimensions.

## Behavior and scope

- Apply reading size consistently to modal text and shared settings controls, including headings, category summaries, percentage and grain choices, toggle state labels, the palette select, Close, Reset and footer links. Shared controls on `/accessibility` should behave the same way.
- Respect existing default base sizes and mobile overrides; each selected multiplier scales the relevant base size once.
- Apply wider line, letter and word spacing to the actual text elements and controls, not only their container.
- Keep Phantom Sans, palettes, contrast, motion and cursor behavior as wired. These already reach the modal; do not add preference defaults or simulate color deficiencies.
- Preserve native dialog semantics, Escape/outside dismissal and focus return. Ensure text wraps and controls remain usable at 320px and 390px with 200% reading size plus spacing, while the close control stays reachable.
- Preserve all unrelated local organizer-copy and lore changes.

## Acceptance and handoff

Implement in `apps/landing/app/accessibility.css`. Add one meaningful browser regression to the existing display-preferences suite that uses the actual settings and checks computed scaling of previously missed controls, spacing on actual text, and absence of horizontal overflow. Do not add implementation-mirroring string tests. Verify default appearance and responsive enlarged settings using the local preview. No commit, publication, remote changes or broad test run is authorized by this brief.
