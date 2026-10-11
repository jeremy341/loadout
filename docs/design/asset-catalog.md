# LOADOUT asset catalog

This index records where LOADOUT-owned art lives, whether the website uses it, and where it came from. Keep every final asset in one location. `references/` submodules are not LOADOUT artwork and remain pinned and untouched.

## Website assets

### Fonts

The homepage foundation uses Pixelify Sans for display, Barlow Condensed for body/labels, and JetBrains Mono for technical details and actions. Fonts are self-hosted under `apps/landing/public/fonts/`. The Barlow Condensed 500/600/700 Latin WOFF2 files and JetBrains Mono variable Latin WOFF2 were extracted without modification from the owner's `Loadout – Redesign.html` export on 2026-10-10. The Latin subset covers English and German text.

Official SIL Open Font License notices are included beside the assets: `BarlowCondensed-OFL.txt` and `JetBrainsMono-OFL.txt`. Their upstream sources are [Google Fonts Barlow Condensed](https://github.com/google/fonts/tree/main/ofl/barlowcondensed) and [Google Fonts JetBrains Mono](https://github.com/google/fonts/tree/main/ofl/jetbrainsmono). Existing Pixelify Sans, Jersey 10, and IBM Plex Mono sources/notices remain available; Docs retains its existing type roles in this homepage pass.

### Current icon sprites

The 32×32 transparent PNGs in `apps/landing/public/loadout/sprites/` are the current homepage glyphs. `LoadoutIcon` maps these filenames to UI names.

| Source PNG | Runtime sprite |
| --- | --- |
| `bolt-source.png` | `bolt.png` |
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

The homepage also uses `apps/landing/public/loadout/sprites/bolt.png` for the final pixel Bolt glyph. Original brand artwork and favicon files are retained. Navigation now displays the reference's simple CSS hexagon; the footer brand and favicon keep their existing artwork.

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
