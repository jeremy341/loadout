# LOADOUT asset catalog

This index records where LOADOUT-owned art lives, whether the website uses it, and where it came from. Keep every final asset in one location. `references/` submodules are not LOADOUT artwork and remain pinned and untouched.

## Website assets

### Fonts

The homepage uses Jersey 10 for the wordmark, Pixelify Sans for headings and buttons, IBM Plex Mono for body and utility text, and DotGothic16 for rulers. JetBrains Mono (ASCII art) and Poppins (Docs body) load through `next/font/google`. The self-hosted files under `apps/landing/public/fonts/` are Jersey 10, Pixelify Sans and IBM Plex Mono, with their OFL notices. The current font roles are in [the design system](../design/system/design-system.md).

Official SIL Open Font License notices are included beside the self-hosted files: `Jersey10-OFL.txt`, `PixelifySans-OFL.txt` and `IBMPlexMono-OFL.txt`. JetBrains Mono and Poppins are fetched by the framework under their own licences from [Google Fonts](https://github.com/google/fonts).

### Pixel font

`apps/landing/public/fonts/PixelifySans.ttf` is Pixelify Sans with a widened opening in the capital C and the lowercase c. The stock font (`PixelifySans.original.ttf`) and the script that patches it (`patch-pixelify-c.py`) are in `assets/editable/fonts/`; the licence (SIL Open Font License 1.1, no reserved font name) stays in `apps/landing/public/fonts/PixelifySans-OFL.txt`. See `assets/editable/fonts/README.md`.

### Cursor

`apps/landing/public/loadout/cursors/` holds the homepage cursors: `arrow-*` and `hand-*` PNGs, each in `dark` (blue fill) and `light` (yellow fill), at 32 px and as `@2x` versions at 64 px for screens with a pixel ratio of 2. The arrow's hotspot is CSS pixel 3, 1 and the hand's is 15, 3. They are Kenney's Cursor Pixel Pack tiles 0168 and 0157 (CC0) recoloured to LOADOUT's ink outline and theme fill by `assets/editable/cursors/make-cursors.js`, which reproduces the PNGs exactly from the sources in `assets/editable/cursors/source/`. `app/cursor.css` applies them. The other cursor packs in `assets/inbox/cursors/` were candidates only.

### Logo and share image

The miner's helmet mark is drawn in `apps/landing/app/_components/home/Logo.tsx`. `apps/landing/app/icon.svg` and `apple-icon.png` are the favicon and the touch icon. `opengraph-image.jpg` and `twitter-image.jpg` in `apps/landing/app` are the 1200 by 630 share image (under 300 KB), each with its `.alt.txt`. The editable SVG sources, including the custom pixel wordmark, are in `assets/editable/logo/`. The helmet comes from the one-bit icon pack; the owner confirmed it can be used.

### Current icon sprites

The 32×32 transparent PNGs in `apps/landing/public/loadout/sprites/` are the current homepage glyphs. `LoadoutIcon` maps these filenames to UI names.

| Source PNG | Runtime sprite |
| --- | --- |
| `RPG_Gem_Jewelcrafting_Diamond_Points_Currency.png` (one-bit icon pack, 16 by 16, each pixel doubled) | `ore.png` |
| `layers-source.png` | `layers.png` |
| `code-source.png` | `code.png` |
| `gift-source.png` | `gift.png` |
| `builder-source.png` | `builder.png` |
| `list-source.png` | `list.png` |
| `document-source.png` | `document.png` |
| `wrench-source.png` | `wrench.png` |
| `gear-source.png` | `gear.png` |
| `cpu-source.png` | `cpu.png` |
| `board-source.png` | `board.png` |
| `flask-source.png` | `flask.png` |
| `globe-source.png` | `globe.png` |
| `arrow-right-source.png` | `arrow-right.png` |
| `xp-star-source.png` | `xp-star.png` |
| `laptop-source.png` | `laptop.png` |
| `cloud-source.png` | `cloud.png` |
| `equipment-box-source.png` | `equipment-box.png` |
| `worker-team-source.png` | `people.png` |
| `graduation-cap-source.png` | `cap.png` |
| `hoodie-source.png` | `hoodie.png` |
| `terminal-source.png` | `terminal.png` |
| `dev-badge-source.png` | `domain.png` |
| `ticket-source.png` | `ticket.png` |
| `storage-drive-source.png` | `storage.png` |
| `checkmark-source.png` | `check.png` |
| `cross-source.png` | `cross.png` |
| `double-down-chevrons-source.png` | `down.png` |
| `right-chevron-source.png` | `faq-chevron.png` |
| `badge-level-one-source.png` | `requisition-i.png` |
| `badge-level-two-source.png` | `requisition-ii.png` |
| `badge-crown-source.png` | `requisition-master.png` |

Original source artwork remains in `docs/design/references/2026-10-06/final-pixel-icons/source/`; every original was renamed descriptively without changing image pixels or transparency.

### Standalone scenery vectors

| Runtime file | Purpose |
| --- | --- |
| `apps/landing/public/loadout/hero/scenery/industrial-skyline.svg` | Preserved source; the new ASCII hero treatment no longer displays this skyline. |
| `apps/landing/public/loadout/hero/scenery/hazard-stripes.svg` | Kept. The current homepage does not reference it. |
| `apps/landing/public/loadout/hero/scenery/cloud-01.svg` – `cloud-03.svg` | Kept. The current homepage does not render clouds. |
| `apps/landing/public/loadout/hero/scenery/scroll-cue.svg` | Kept. The current homepage does not reference it. |
| `apps/landing/public/loadout/bolt.svg` | Owner-supplied custom Bolt SVG; kept byte-for-byte at its original URL. |

The homepage uses `apps/landing/public/loadout/sprites/ore.png`, the ore gem, as the currency icon. The owner's `bolt.svg` is not shown anywhere and is kept as it was. Original brand artwork and favicon files are retained. Navigation now displays the reference's simple CSS hexagon; the footer brand and favicon keep their existing artwork.

### Workshop scenery PNGs

`apps/landing/public/loadout/hero-workshop/` contains the 31 verified PNGs from the abandoned hero workshop background. They are kept but not rendered. `HeroWorkshopBackground.tsx` and `hero-workshop-background.css` are kept with them, and nothing imports them. The workshop background was abandoned on 11 October 2026.

## Editable and incoming source artwork

- `assets/inbox/icons/` holds the unintegrated Bolt and track references plus Rivet images. These are not included in homepage UI.
- `assets/editable/icons/loadout-icon-palette.ase` is the icon palette source.
- `assets/editable/homepage/rail-components-source.ase` is the editable rail source.
- The numbered cloud PNGs in `apps/landing/public/loadout/hero-workshop/` are kept from the abandoned workshop background and are not rendered.
- `docs/design/references/homepage-workshop/` holds the supplied full-page workshop concept and cloud/decorative source sheets as visual references.
- `assets/archive/homepage-variants/` holds distinct older and alternate structures/workbench images. The three byte-identical old copies removed earlier are not included.

New art starts in `assets/inbox/`. After approval, move it to its final runtime or source location, update this catalog, and remove the inbox copy. Never keep two identical runtime exports in separate folders.

## Asset naming and provenance

Use lowercase kebab-case names that describe subject and role. Keep numbered sequences only where order matters. Record original filenames and content hashes in the restructure manifest so an export can be traced to its source. Source license and third-party reuse rules remain owned by `docs/source-audit/` and `references/README.md`.
