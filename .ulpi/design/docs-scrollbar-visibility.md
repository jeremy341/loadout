# Hide scrollbar chrome in LOADOUT Docs

## Design read

Keep the existing industrial field-manual layout. Hide only the operating-system scrollbar visuals; the sidebar, guide, and table of contents remain independent scroll regions when their content overflows.

## Scope

- Applies to the Docs sidebar, guide pane, and table of contents only.
- Leaves the viewport-locked Docs shell and internal overflow behavior intact.
- Does not change homepage scrolling, scroll motion, typography, layout, or content.

## Interaction and accessibility

- Wheel, touch, keyboard, and anchor navigation must continue to reach all content.
- Keep the guide pane's focus and Page Up/Down behavior.
- Preserve reduced-motion behavior and the no-document-scroll layout.
- Do not disable overflow or add global page-level scroll locking.

## Acceptance

- At desktop and mobile widths, no scrollbar chrome is visible on the Docs scroll panes.
- The document remains within the viewport while overflowing panes still scroll.
- No horizontal overflow is introduced; pane content and focus remain reachable.
