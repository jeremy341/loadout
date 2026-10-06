# LOADOUT pixel sprite design atlas

Status: historical design reference. The standalone icon exports from this experiment were removed on 2026-10-06 when the owner restored the earlier inline icon family from commit `5a5b6f0`.

[View the 42-sprite reference sheet](../loadout-32px-sprite-design-sheet.png). Its six rows each hold seven 32×32 logical sprites. Read left to right, row by row. Redraw each needed cell as a separate asset in the selected production format. The contact sheet is a hand-drawing reference, not an atlas imported by the app.

| Row | Column order |
|---|---|
| 1 | User Bolt reference; tracks/layers; code window; gift; builder; list; document |
| 2 | wrench / Tools / Build again; gear / Systems; CPU / Compute; board / Hardware; flask / Research; globe; builders |
| 3 | right arrow; XP star; laptop; Cloud utility icon; key; equipment box; cap |
| 4 | stickers; hoodie; terminal; .dev domain; ticket; storage; check |
| 5 | cross; nut brand mark; down chevrons; FAQ chevron; badge I; badge II; Master badge |
| 6 | slash motif; cottage skyline tile; tower skyline tile; workshop skyline tile; LOADOUT wordmark; horizontal logo lockup; favicon mark |

The sheet documents the exported experiment, not the current UI icon source. The active site icons use the earlier inline `LoadoutIcon` artwork again. The user-supplied Bolt at `apps/landing/public/loadout/bolt.svg` remains active. The LOADOUT brand mark, wordmark, favicon, moving scene clouds, and root scenery files remain separate from this icon restoration. Row 3's small cloud was an equipment icon; the background scene clouds are separate assets.

The experiment exported 38 non-logo standalone sprites. Those generated files are no longer active and have been removed. `scroll-down.svg`, `slashes.svg`, and `skyline.svg` remain as independent site-scene assets; this atlas does not authorize replacing them or the current Bolt asset.
