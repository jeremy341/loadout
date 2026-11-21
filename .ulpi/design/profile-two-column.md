# Profile, two columns with an activity heatmap

Binds to `.ulpi/design/DESIGN.md` and `.ulpi/design/profile-and-toolbelt.md` (the profile rules there stay true). Skills loaded for this change: frontend-design-ui-ux, frontend-design, design-taste-frontend, emilkowal-animations.

Design read: a product page for builders, quiet LOADOUT plate style, layout after Stasis (left rail, fluid right column). Dials: variance 4, motion 1, density 5. Nothing animates, so reduced motion needs no special case.

## Layout
- Left rail 320 px, sticky from 900 px: ID plate (first letter, track colour strip), handle as h1, bio (160 max), Joined, Top track (own only, levels hidden publicly), Ore balance (own only: confirmed, "N pending" under it), buttons (Edit profile, Edit bio, Settings). Under 900 px the rail stacks on top.
- Right column, in order: Logged hours heatmap, Toolbelt, Pinned, Projects (tabs and track filter in the address), Recent activity, Loadout (own only).
- Public view: no balance, no levels, no private projects, only public project entries in Recent activity.

## Heatmap
- 7 rows (Sunday to Saturday) by 52 weeks, four bands by hours in a day: 0, under 2, under 4, 4 and over. Month labels above, Less and More legend, current and best streak, a `title` tooltip per day.
- Label is "Logged hours" (self-reported journal hours, never approved). Days end 30 minutes after midnight (grace), timezone UTC until a person timezone exists.
- Under 560 px the last 13 weeks show. Each row is one tab stop with a name; squares are images with a label. A text summary is visually hidden.

## States
Empty: "No logged hours yet." Own view adds where to log. Zero streak reads "0 days". Banned person: no data.

## Acceptance
Axe clean at 390 and 1440, no horizontal scroll, both themes, class names used elsewhere kept, pins, hide, show as building, tabs and edit dialog unchanged.
