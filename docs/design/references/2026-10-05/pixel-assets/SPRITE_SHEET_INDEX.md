# LOADOUT pixel sprite assets

The 32×32 sprites extracted from the [2026-10-06 grid guide](../../2026-10-06/pixel-assets/loadout-32px-sprite-grid-guide.png) are active homepage icon assets. The guide has 7 columns and 6 rows; each tile is 32×32 logical pixels enlarged 8×. Extraction sampled the center of each 8×8 block to avoid the grid, then converted the exact paper color (`#EDEFEE`) to transparency. The exported files are individual 32×32 RGBA PNGs in `apps/landing/public/loadout/sprites/`.

The four brand cells are intentionally excluded: row 5, column 2 (machine mark), and row 6, columns 5–7 (wordmark, lockup, favicon). The custom Bolt SVG and scene/cloud artwork also remain separate. The sheet's Bolt tile is kept as `bolt-reference.png` and is not used in place of `apps/landing/public/loadout/bolt.svg`.

| Row | Column | File | Homepage mapping |
|---:|---:|---|---|
| 1 | 1 | `bolt-reference.png` | Reference only; custom Bolt SVG remains active |
| 1 | 2 | `layers.png` | `LoadoutIcon layers` |
| 1 | 3 | `code.png` | `LoadoutIcon code` |
| 1 | 4 | `gift.png` | `LoadoutIcon gift` |
| 1 | 5 | `builder.png` | `LoadoutIcon user` |
| 1 | 6 | `list.png` | `LoadoutIcon list` |
| 1 | 7 | `document.png` | `LoadoutIcon document` |
| 2 | 1 | `wrench.png` | `LoadoutIcon wrench` |
| 2 | 2 | `gear.png` | `LoadoutIcon gear` |
| 2 | 3 | `cpu.png` | `LoadoutIcon chip` |
| 2 | 4 | `board.png` | `LoadoutIcon board` |
| 2 | 5 | `flask.png` | `LoadoutIcon flask` |
| 2 | 6 | `globe.png` | `LoadoutIcon globe` |
| 2 | 7 | `people.png` | `LoadoutIcon people` |
| 3 | 1 | `arrow-right.png` | `LoadoutIcon arrow` |
| 3 | 2 | `xp-star.png` | `LoadoutIcon star` |
| 3 | 3 | `laptop.png` | `LoadoutIcon laptop` |
| 3 | 4 | `cloud.png` | `LoadoutIcon cloud` |
| 3 | 5 | `key.png` | `LoadoutIcon key` |
| 3 | 6 | `equipment-box.png` | `LoadoutIcon box` |
| 3 | 7 | `cap.png` | `LoadoutIcon cap` |
| 4 | 1 | `stickers.png` | `LoadoutIcon stickers` |
| 4 | 2 | `hoodie.png` | `LoadoutIcon hoodie` |
| 4 | 3 | `terminal.png` | `LoadoutIcon terminal` |
| 4 | 4 | `domain.png` | `LoadoutIcon domain` |
| 4 | 5 | `ticket.png` | `LoadoutIcon ticket` |
| 4 | 6 | `storage.png` | `LoadoutIcon storage` |
| 4 | 7 | `check.png` | `LoadoutIcon check` |
| 5 | 1 | `cross.png` | `LoadoutIcon cross` |
| 5 | 2 | — | Brand mark; excluded |
| 5 | 3 | `down.png` | `LoadoutIcon down` |
| 5 | 4 | `faq-chevron.png` | FAQ disclosure control |
| 5 | 5 | `requisition-i.png` | Progression milestones LV.3 and LV.6 |
| 5 | 6 | `requisition-ii.png` | Progression milestones LV.9 and LV.12 |
| 5 | 7 | `requisition-master.png` | Progression milestone LV.15 |
| 6 | 1 | `slashes.png` | Decorative reference; separate scene SVG remains active |
| 6 | 2 | `skyline-cottage.png` | Decorative reference; separate scene SVG remains active |
| 6 | 3 | `skyline-tower.png` | Decorative reference; separate scene SVG remains active |
| 6 | 4 | `skyline-workshop.png` | Decorative reference; separate scene SVG remains active |
| 6 | 5–7 | — | Wordmark, lockup, favicon; excluded |

The page's icon component uses matching sprites for existing glyph calls. The machine mark, wordmark, favicon, moving clouds, `slashes.svg`, `skyline.svg`, and `scroll-down.svg` are not replaced by these sprite exports.
