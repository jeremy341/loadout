# Projects empty state

Status: written 23 Nov 2026, not reviewed by the owner. Staging only.

## Decision

When a builder has no projects, the Projects page shows the same dashed **New project** tile at card size as the populated grid. The sentence "No projects yet. Create your first one!" is removed from the page.

The tile keeps the existing Stasis anatomy: a 2px dashed border, one pixel plus and the words "New project". Its min-height matches a populated card (280px at 560px and wider, 200px on narrow screens) so the empty grid does not collapse into a short strip.

## Why

The sentence is redundant next to the tile and reads as an error in the staging screenshots. The tile is the call to action; it should carry the empty state alone.

## Acceptance

- A signed-in builder with zero projects sees the New project tile at full card size and no explanatory sentence.
- With projects present, the tile remains last and matches the card row height.
- The tile is one keyboard-stop link with the accessible name "New project".
