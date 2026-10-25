# Cursor packs (archive)

> **Archived 2026-10-20:** the unused candidate packs were removed from the repository. Only this licence and provenance record and Gabl's editable source (`gabl-cursor.aseprite`) are kept.

Record of candidate art for the custom cursor (Plan 19, removed 25 Oct 2026, workstream A). Nothing here was served by the website; the tiles in use are in `assets/editable/cursors/source/`. Any future use must copy or redraw the file to its final path under `apps/landing/public/loadout/` and record it in `docs/source-audit/ATTRIBUTION.md` and `docs/design/asset-catalog.md`.

All packs arrived from the owner's downloads on 2026-10-14. Licence status means what the files themselves prove: **file** means the archive contains a licence text, **listing** means only the author's itch.io page said so and the archive has no licence file. Treat **listing** as unverified until the owner re-checks the page.

| Folder | Author and source | Licence | Status | Stored | Left out |
|---|---|---|---|---|---|
| `kenney-cursor-pixel-pack/` | Kenney, [OpenGameArt](https://opengameart.org/content/cursor-pixel-pack), v1.0, 2024-07-10 | CC0 1.0, `License.txt` in the folder | **file** | Whole pack: `Preview.png`, 180+ single tiles, tilemaps | Two `.url` shortcut files |
| `gabl-simple-pixel-cursors/` | Gabl, [itch.io](https://gabl18.itch.io/simple-pixel-cursors), 16x16, light and dark | CC0 1.0, `README.txt` in `png/` and `cur-ani/`. The author asks that the art not be used to feed AI models. | **file** | `png/` (PNG, GIF and sprite sheets), `cur-ani/` (`.cur`, `.ani`, install files), `cursor.aseprite` | Nothing |
| `megabyte-games-mouse-cursor-pack/` | Megabyte Games, [itch.io](https://megabyte-games.itch.io/mouse-cursor-pack), release dated 2022-03-27 | CC0 1.0 per the listing | **listing** | `16x16/png` and `16x16/png dark` (107 cursors each) | About 22 MB of `.cur` files (each is about 100 KB); download them again from the itch.io page if needed |
| `kabgames-8x8-cursors/` | KabGames (Aspecs Gaming), likely [itch.io](https://kaboff.itch.io/100-mouse-cursors-pack-8x8); the listing title differs from the file name "150+ Mouse Cursors - Pack (8x8)", so the exact source needs confirming | CC0 per the listing; the same author's 32x32 packs list CC BY 4.0, so confirm this pack too | **listing** | `v1.0` and `v1.1`, ten colours each | Nothing |

## About `gabl-cursor.aseprite`

The owner supplied it without a note. Its layers (`cursor_loading`, `Hourglass`, `dark_base`, `light_base`, light and dark additions) match Gabl's busy and hourglass cursor, so it is probably Gabl's editable source. It is kept here as `gabl-cursor.aseprite`; confirm where it came from before anything is built on it.

## How these packs were used

The homepage cursor uses Kenney's classic arrow (tile 0168) and index-finger hand (tile 0157), recoloured to LOADOUT's ink outline and theme fill. Those two tiles, the licence text and the generator are in `assets/editable/cursors/`. The other packs were candidates and stay here: Gabl's is a complete, good set (but asks that its art not be used to feed AI models), Megabyte's has many fun pointers (swords, a chunky arrow) but its licence is only confirmed by its listing, and KabGames' 8 by 8 set is only silhouettes. See `.ulpi/design/brand-and-type-record.md`.
