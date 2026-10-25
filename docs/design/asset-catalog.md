# LOADOUT asset catalog

This index records where LOADOUT-owned art lives, whether the website uses it, and where it came from. Keep every final asset in one location. `references/` submodules are not LOADOUT artwork and remain pinned and untouched.

## Website assets

### Fonts

The homepage uses Jersey 10 for the wordmark, Pixelify Sans for headings and buttons, IBM Plex Mono for body and utility text, and DotGothic16 for rulers. JetBrains Mono (ASCII art) and Poppins (Docs body) load through `next/font/google`. The self-hosted files under `apps/landing/public/fonts/` are Jersey 10, Pixelify Sans and IBM Plex Mono, with their OFL notices. The current font roles are in [the design system](../design/system/design-system.md).


Official SIL Open Font License notices are included beside the self-hosted files: `Jersey10-OFL.txt`, `PixelifySans-OFL.txt` and `IBMPlexMono-OFL.txt`. JetBrains Mono and Poppins are fetched by the framework under their own licences from [Google Fonts](https://github.com/google/fonts).

The optional Phantom Sans setting uses the Regular, Bold and Italic WOFF2 files in `apps/landing/public/fonts/phantom-sans/`. They were copied from Pixl's live site at `https://pixl.hackclub.com/fonts/phantom-sans/` and are loaded locally only when a visitor enables the setting. This provenance does not establish a license for the WOFF2 files: the MIT license recorded for the pinned Pixl repository does not, by itself, document coverage of these live font assets, and this repository records no separate font permission. Do not present the pinned repository license as covering these files.

### Pixel font

`apps/landing/public/fonts/PixelifySans.ttf` is Pixelify Sans with a widened opening in the capital C and the lowercase c. The stock font (`PixelifySans.original.ttf`) and the script that patches it (`patch-pixelify-c.py`) are in `assets/editable/fonts/`; the licence (SIL Open Font License 1.1, no reserved font name) stays in `apps/landing/public/fonts/PixelifySans-OFL.txt`. See `assets/editable/fonts/README.md`.

### Cursor

`apps/landing/public/loadout/cursors/` holds the homepage cursors: `arrow-*`, `hand-*`, `grab-*`, `grabbing-*`, `pet-*`, `petHeart-*`, `pinch-*`, `shake-*`, `thumbs-*` and `stop-*` PNGs, each in `dark` (blue fill) and `light` (yellow fill), at 32 px and as `@2x` versions at 64 px for screens with a pixel ratio of 2. Hotspots in CSS pixels: arrow 3, 1; hand 15, 3; open hand 17, 17; fist 17, 19; petting hand 17, 17; petting hand with a heart 17, 25 (40 px); pinch 17, 17; shaking fist 17, 13; thumbs up 19, 15; stop hand 15, 15. They are Kenney's Cursor Pixel Pack tiles 0168 (arrow), 0157 (hand), 0138 (open hand), 0139 (fist), 0175 (flat petting hand, also used for the heart version, which adds a small pink heart drawn in the generator) and 0178 (pinch), CC0, plus three of our own for the mole (a shaking fist drawn by hand on the 16 by 16 grid, and a thumbs up and a stop hand from an image-model sheet shrunk onto the grid and tidied), recoloured to LOADOUT's ink outline and theme fill by `assets/editable/cursors/make-cursors.js`, which reproduces the PNGs exactly from the sources in `assets/editable/cursors/source/`. `app/cursor.css` applies them; the open hand and fist show on the mole (see [`.ulpi/design/mole-record.md`](../../.ulpi/design/mole-record.md)). The four candidate packs were removed on 2026-10-20; their licence record and Gabl's editable source are in `assets/archive/cursor-packs/`.

### The mole

`apps/landing/public/loadout/mole/` holds the homepage mascot as two sprite atlases: `mole.png` (640 by 1280, about 155 KB: 184 frames of 64 px in a grid of 10 by 20, twelve sheets in the order moving, expressions, dig and peek, picked up, petted, reactions, walk and run cycles, idle and jump, a second walk of 8 frames, looking around with moods, falling, landing, jumping for joy and being pinched, and being dazed and getting back up) and `fx.png` (256 by 96: 19 effects of 32 px, such as hearts, sweat, the anger mark, Zs, stars, dust and dirt). The art was generated with an image model (GPT) from the prompts in `assets/editable/mole/PROMPTS.md` and then cleaned: the magenta background keyed out, each sprite found as its own shape, shrunk to size with a box filter, anchored to the ground line and locked to one 22-colour palette. `assets/editable/mole/slice-sheets.cjs` makes the frames from the sheets and `build-atlas.cjs` packs them into the atlases; the raw sheets are not in the repository. `app/_components/mole/frames.ts` names every animation.

### Prize photos

`apps/landing/public/loadout/prizes/` holds eight product photos for the proposed-prizes belt: `framework-16`, `esp32`, `rpi`, `soldering-iron`, `samsung-t7-ssd`, `a1-mini`, `domain-grant` and `centauri-carbon`, all `.webp`, about 310 KB together. They come from Pixl's shop and are used under the Pixl owner's permission and MIT licence; each source path is in `docs/source-audit/ATTRIBUTION.md`. They show products made by other companies as examples, not as promises. `PlannedPrizes.tsx` lists them.

### Logo and share image

The miner's helmet mark is drawn in `apps/landing/app/_components/home/Logo.tsx`. `apps/landing/app/icon.svg` and `apple-icon.png` are the favicon and touch icon. `opengraph-image.jpg` and `twitter-image.jpg` in `apps/landing/app` are identical 1200 by 630 share images (under 300 KB), each with its `.alt.txt`. They preserve main's original background and details; its blue label is centered above the wordmark, the helmet is removed, and the enlarged bottom logo variant—with dirt-colored details—sits above centered Jersey 10 tagline and track names. The depth-strip readout is softened. `assets/editable/logo/build-share-preview.ps1` reproduces the exports from `share-preview-main-base.jpg`. The owner's 2304 by 768 presentation of both variants is `assets/editable/logo/wordmark-composite-2304.png`; the 192 by 64 PNGs remain the pixel masters. Exact source revisions and unused logo alternatives are recorded in that folder's README.

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

### Bolt source

| Runtime file | Purpose |
| --- | --- |
| `apps/landing/public/loadout/bolt.svg` | Owner-supplied custom Bolt SVG; kept byte-for-byte at its original URL. |

The homepage uses `apps/landing/public/loadout/sprites/ore.png`, the ore gem, as the currency icon. The owner's `bolt.svg` is not shown anywhere and is kept as it was. Original brand artwork and favicon files are retained. Navigation now displays the reference's simple CSS hexagon; the footer brand and favicon keep their existing artwork.

The abandoned hero workshop background (31 PNGs, six scenery SVGs, `HeroWorkshopBackground.tsx` and `hero-workshop-background.css`) was removed on 2026-10-20. `bolt.svg` remains unchanged.

## Editable and incoming source artwork

- `assets/archive/icons/` holds the retained 32 px Bolt and track-layer references. The Rivet avatar and mascot concepts moved to the Orry project on 2026-10-20; they are not homepage assets.
- `assets/editable/icons/loadout-icon-palette.ase` is the icon palette source.
- `assets/editable/homepage/rail-components-source.ase` is the editable rail source.
- `assets/archive/homepage-variants/` holds distinct older and alternate structures/workbench images. The three byte-identical old copies removed earlier are not included.

New art starts in `assets/inbox/`. After approval, move it to its final runtime or source location, update this catalog, and remove the inbox copy. Never keep two identical runtime exports in separate folders.

## Asset naming and provenance

Use lowercase kebab-case names that describe subject and role. Keep numbered sequences only where order matters. Record original filenames and content hashes in the restructure manifest so an export can be traced to its source. Source license and third-party reuse rules remain owned by `docs/source-audit/` and `references/README.md`.
