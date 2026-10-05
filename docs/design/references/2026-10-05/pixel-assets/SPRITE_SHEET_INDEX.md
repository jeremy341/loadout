# LOADOUT pixel sprite design atlas

[View the 42-sprite reference sheet](../loadout-32px-sprite-design-sheet.png). Its six rows each hold seven 32×32 logical sprites. Read left to right, row by row. Redraw each needed cell as a separate asset in the selected production format. The contact sheet is a hand-drawing reference, not an atlas imported by the app.

| Row | Column order |
|---|---|
| 1 | User Bolt reference; tracks/layers; code window; gift; builder; list; document |
| 2 | wrench / Tools / Build again; gear / Systems; CPU / Compute; board / Hardware; flask / Research; globe; builders |
| 3 | right arrow; XP star; laptop; Cloud utility icon; key; equipment box; cap |
| 4 | stickers; hoodie; terminal; .dev domain; ticket; storage; check |
| 5 | cross; nut brand mark; down chevrons; FAQ chevron; badge I; badge II; Master badge |
| 6 | slash motif; cottage skyline tile; tower skyline tile; workshop skyline tile; LOADOUT wordmark; horizontal logo lockup; favicon mark |

Each non-logo sprite has been exported as an individual transparent 32×32 SVG under `apps/landing/public/loadout/icons/`. The sheet is now the active source for the website's icon set, including Bolt and XP. The earlier user-supplied Bolt SVG remains available in Downloads but is no longer the active Bolt drawing. The nut brand mark, wordmark, horizontal lockup, and favicon remain unchanged. The three scene-cloud SVGs also remain unchanged. Row 3's small cloud is the Cloud & Compute equipment icon.

The exported cells are: all seven cells in rows 1–4; row 5 columns 1 and 3–7; and row 6 columns 1–4. This yields 38 non-logo standalone sprites in `apps/landing/public/loadout/icons/`. The site's existing `public/loadout/bolt.svg`, `scroll-down.svg`, `slashes.svg`, and `skyline.svg` URLs also use matching sheet art for compatibility. `skyline.svg` is a muted composition of the cottage, tower, and workshop skyline tiles; `slashes.svg` uses the slash-motif cell.
