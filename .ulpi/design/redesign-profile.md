# Redesign: the profile, wide header and internal tabs

Binds to `.ulpi/design/DESIGN.md` and `docs/design/system/design-system.md`. Plan: `plans/proposals/participant-redesign-plan.md` section 3.6, decisions 2 and 6 in `participant-redesign-decisions.md`. Replaces the layout in `.ulpi/design/profile-two-column.md` (its heatmap section stays true). Written 16 Nov 2026, before code. Skills loaded: frontend-design-ui-ux, frontend-design, design-taste-frontend.

**Design read.** A product page for builders, quiet LOADOUT plate style (graphite and stone, Pixelify headings, IBM Plex Mono body, square corners, 1px outlines, hard offset shadow). Owner feedback: the profile looks bad, the column is too narrow for what it shows and the page is one long wall. Dials: variance 3, motion 1, density 5. Nothing animates.

## Layout

```
HEADER (full width, up to 1080px)
[plate] HANDLE                 | ORE BALANCE   DEPTH   TOP TRACK   JOINED
        bio                    |
        [ Edit profile ]       |
PINNED  [pin] [pin] [pin]                         (only when something is pinned)
-----------------------------------------------------------------------
[ PROJECTS 18 ] [ JOURNAL 2 ] [ ACTIVITY ] [ TOOLBELT 0 ]
PANEL
```

- Header grid is 5fr and 7fr (identity left, stats right) from 900px, one column under it. Ore balance, Depth and Top track show on the own view only. Joined shows for everyone. Pins sit under the row, three across from 720px.
- Tabs are real tabs: `role=tablist` with a label, `role=tab` buttons with `aria-selected` and `aria-controls`, `role=tabpanel` with `aria-labelledby`. Only the open tab is a tab stop. Left and Right (wrapping), Home and End move and select. The address carries `?tab=journal|activity|toolbelt`; Projects has no query. An unknown value falls back to Projects. Every panel is rendered on the server and the closed ones are `hidden`.
- Counts appear once, on the tab labels (Projects, Journal, Toolbelt). The old facts box (Projects, Toolbelt counts) is gone.
- Two columns (1fr and 2fr from 900px, one column under) in the Journal and Toolbelt panels. Projects is one grid of three across from 900px, two from 560px. Activity is the heatmap at full width, unchanged.

## Panels

| Tab | Content |
|---|---|
| Projects | One grid of every project, pinned first. Cards open the project (own view) or the Explore page (approved projects, visitor view). A visitor card with no page yet is not a link. Own view: a Pin or Unpin button under approved projects. No filter rows, no status tags, no hide or show as building. |
| Journal | Latest 20 entries across the builder's projects, newest first, read only: project link, hours logged, date, title, a 200 character plain text start. Left column explains and says when more exist. |
| Activity | `ActivityHeatmap`, same look and data. Own view adds the Loadout gauge below it. |
| Toolbelt | Wide column: tools equipped. Narrow column: builders who use this builder's tools. Read only. |

## Removed

Settings button and the "Other builders see your approved projects..." hint (that rule is out of date, every project is public), Edit bio link (one Edit profile button opens the existing dialog), Recent activity list (the Journal tab replaces it), free pin slots, the status and track filter rows, Approved hours stat (Depth is one metre per approved hour, so it was a duplicate).

## Visibility

Every project and journal is public (decision 2), so a visitor sees the same tabs. Data modes `all` in `listProfileProjects` and `listActivity` return everything; the page still passes no email, no name and no private field. Levels, Ore and Depth stay off the visitor view (`PUBLIC_LEVELS_ENABLED` false).

## Edit

The existing `ProfileEditDialog` on `PfModal`, opened by Edit profile or Choose a handle. Unchanged.

## States

No bio (own): "No bio yet." No projects: "No projects yet." with a Start a project link (own). No entries: "No journal entries yet." No tools: plain line. No handle (own): the Choose a handle block, then the tabs.

## Acceptance

Axe clean at 390 and 1440, no horizontal scroll, both themes, focus ring visible on tabs, 44px tab height (48px with larger controls), keyboard arrows work, reload keeps the tab, banned person shows nothing.

## Update 17 Nov 2026: look pass (owner: "looks weird", heatmap should read like Stasis or Pixl)

Skills loaded: frontend-design-ui-ux, frontend-design, design-taste-frontend. Comparison: `plans/proposals/profile-heatmap-comparison.md`.

- **Header.** One band. Left: letter plate, handle, bio, Edit profile. Right: stats in one compact row with thin rules between them, no box, no fill. Under 900px the stats wrap under the identity.
- **Depth.** Shown as "74 M", never negative. It is one metre per approved hour (`depthMetres`, floored at zero); pending hours stay hatched beside it. The old formatter printed a minus sign for "below the surface", which read as a bug.
- **Pinned.** Same card as the project grid (cover, title, text, footer line), three across from 720px.
- **Project cards.** The big depth chip is gone from the cover on the profile (`ProjectCover depth={false}`). Hours are the footer line only: "0 H approved", "0 H pending". The project page and Explore keep the chip.
- **Tabs.** Plain text with a 3px underline on the active tab (the `line` look). Still `role=tablist`, arrow keys, Home and End, `?tab=`.
- **Heatmap.** 52 weeks, 12px squares (15px from 900px), 3px gap, month labels above, Mon, Wed and Fri at the left (sticky on a phone), legend "Less to More", tooltip with date and hours on hover and focus. The grid scrolls inside its card on a phone and starts at today. One square is the tab stop; arrows move by day and week. Each square is a button with its date and hours in `aria-label`.
- **Acceptance.** Axe clean at 390 and 1440, no page scroll at 390, both themes.
