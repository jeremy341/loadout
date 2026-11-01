# Attribution and reuse record

## Reference handling

`references/` contains four pinned top-level Git submodules. A limited Pixl landing subset was copied for Stage A local comparison and then redesigned in Stage B. The final homepage retains adapted Next.js, Lenis, navigation, and reveal patterns; copied Pixl media and source-specific pages were removed. No YSWS Template, Stardance, or Stasis files are copied; the platform preview pages read a few of their files for method only (see "Platform preview pages — 2026-10-20" below). The owner states (2026-10-20) that reuse of all four references is permitted; see "Reuse permission statement — 2026-10-20" below. The written grants are not yet in the repository. Use `git submodule update --init` to populate the references in a fresh checkout. Do not recurse into Stardance's nested `secrets` submodule: its GitHub remote returned “Repository not found” on 2026-10-05.

## Pixl

Hack Club Pixl at commit `8141b992e92e05583246fd914c63a101100f6fe4` on `main` is the PRIMARY ENGINEERING BASE. Its upstream root license is MIT, "Copyright (c) 2026 Pixl"; the full original notice remains in `references/pixl/LICENSE` and is reproduced below. MIT does not cover everything in the Pixl repository; see "Pixl licence exceptions — 2026-10-20" below. The top-level LOADOUT `LICENSE` retains both the Jerry and Pixl copyright notices. Exact source/target mappings and final reuse decisions are in `landing-port-and-assets.md`; owned SVGs and licensed fonts are recorded in `landing-port-and-assets.md`. Pixl and Hack Club do not endorse LOADOUT by virtue of this reuse.

## YSWS Template

EDRipper/ysws-template at `1ac191fa5eee1e57983b29ab7101f700c166e207` on `master` is the GENERAL YSWS OPERATIONS / INFRASTRUCTURE REFERENCE. The checkout has no root license or README, no reported repository license, and backend package metadata says `UNLICENSED`. Its Git submodule is a link to the upstream repository; no source files or assets are copied into LOADOUT. As of 2026-10-20 the owner states that reuse is permitted (see "Reuse permission statement — 2026-10-20"; written evidence pending). Log every copied file in `docs/archive/platform-preview-20261020/pixl-platform-port-map.md` and keep any notice the file carries.

## Stardance

Hack Club Stardance at `5b6bfb86462e0edc68592d6985168d09543f00d5` on `main` is the PEER REVIEW / QUALITY SCORING / MULTIPLIER / VIRALITY / COMMUNITY POLL REFERENCE. The newest pin also contains a poll popup, which LOADOUT has not selected. The checkout has no LICENSE file and no reported repository license. Its Git submodule is a link to the upstream repository; no source files or assets are copied into LOADOUT. LOADOUT retains its own four rating areas, Ore currency, and product rules; any adopted mechanics are reimplemented independently unless the owner decides to copy code under the 2026-10-20 permission statement below, in which case the files are logged in `docs/archive/platform-preview-20261020/pixl-platform-port-map.md`.

## Stasis

Hack Club Stasis at `7a230ced9ad793f0ad4cda30a7d71c02a58da6b6` on `main` is a hardware hackathon reference. The pinned checkout has no root LICENSE file, and GitHub reports no repository license for it (checked 2026-10-11, when the pin matched upstream `main`). Reuse permission was reported by the project owner on 2026-10-11: an informal written reply from Hack Club, quoted as "Yea sure youre free to use it no worrys". The sender, date and channel still need to be recorded here. LOADOUT's reuse is limited to the components listed in `DECISIONS.md`. Stasis copy, artwork, photos, logos, event dates, location, scale and operating claims are not copied. Credit Stasis wherever its code is adapted. The owner's 2026-10-20 statement (below) widens the stated permission to all four references; the Stasis rows in `DECISIONS.md` that say "not adopted" stay as they are until the owner decides otherwise.

## Future additions

Before copying code, text, or assets from any reference, preserve required notices, record the exact source SHA and paths (in `docs/archive/platform-preview-20261020/pixl-platform-port-map.md` for the platform port), and update `source-bases.md` and `DECISIONS.md`. For a reference without an identified licence, the basis is the owner-stated permission recorded below, with evidence pending; replace that statement with the written grants when they are attached.

## Phantom Sans WOFF2 provenance — 2026-10-18

The accessibility follow-up includes `Regular.woff2`, `Bold.woff2` and `Italic.woff2`, copied from Pixl's live site at `https://pixl.hackclub.com/fonts/phantom-sans/`; the live Pixl page at `https://pixl.hackclub.com/` exposes a Phantom Sans font control. The files are served locally only when the optional preference is enabled. The pinned Pixl repository's MIT license is recorded above, but this record does not establish that the license covers these live WOFF2 assets. No separate permission for these font files is recorded in this repository. Preserve this distinction when attributing or reusing the font.

## Public Docs navigation audit — 2026-10-07

Pixl at the recorded `8141b992e92e05583246fd914c63a101100f6fe4` MIT pin supplies navigation references in `apps/web-shell/app/docs/docs-shell.tsx`, `apps/web-shell/app/docs/docs.css`, `apps/web-shell/app/docs/[slug]/doc-toc.tsx`, `apps/web-shell/lib/docs.ts`, and `packages/docs-engine/src/markdown.ts`.

**ADAPT:** left alignment, grouped directory and current-heading indication. **REIMPLEMENT:** safe React Markdown, internal-pane anchors/search and LOADOUT topics. **REFERENCE ONLY:** Pixl content/tutorial organization. **IGNORE:** Pixl-specific economy, restoration and theme/config machinery. Code is independently implemented for LOADOUT's contract; existing MIT notices remain. No Template/Stardance code or media is adopted.

## Cursor packs and Pixl prize photos — 2026-10-14

Four cursor packs were kept in `assets/inbox/cursors/` as unapproved candidates until the unused packs were removed on 2026-10-20; the full licence and provenance table is in `assets/archive/cursor-packs/README.md`. Kenney's Cursor Pixel Pack (CC0 1.0, licence file included) and Gabl's Simple Pixel Cursors (CC0 1.0, licence file included, with a request not to use the art to feed AI models) are confirmed by their files. Megabyte Games' Mouse Cursor Pack and KabGames' 8x8 cursors are CC0 only according to their itch.io listings; the archives hold no licence file, so they stay unverified. No file from them is served by the site. Any future use is recorded here with its exact source and path.

Pixl prize photos and other Pixl material: permission recorded 2026-10-14. The Pixl owner told the LOADOUT owner in Slack that LOADOUT has full permission to use anything from Pixl whenever it wants, and that everything in Pixl is under the MIT licence. The LOADOUT owner relayed this message; the Pixl owner's name and the Slack message link are to be added here by the LOADOUT owner. Conditions that follow from MIT: keep Pixl's copyright and licence notice (`references/pixl/LICENSE`, retained in the top-level `LICENSE`) and record the exact source path of every copied file. Each photo added to the site is listed here with its Pixl path.

The homepage cursors (`apps/landing/public/loadout/cursors/`) are tiles 0168 (arrow), 0157 (hand), 0138 (open hand), 0139 (fist), 0175 (flat hand, for petting the mole) and 0178 (thumb and finger hand, for pinching it) of Kenney's Cursor Pixel Pack, plus a small pink heart and a shaking fist drawn in the generator's source folder, and a thumbs up and a stop hand that an image model drew (shrunk onto the 16 by 16 grid and tidied; original to LOADOUT), recoloured to LOADOUT's ink outline and theme fill. The pack is CC0 1.0 (`assets/editable/cursors/source/kenney-LICENSE.txt`; credit to Kenney, www.kenney.nl, is optional and given here). `assets/editable/cursors/make-cursors.js` produces the PNGs from the source tiles.

Pixl prize photos on the homepage belt (2026-10-14), copied from `references/pixl/apps/pixl-dashboard/public/shop/` at the pinned commit `8141b992e92e05583246fd914c63a101100f6fe4`, under the permission and MIT licence described above, to `apps/landing/public/loadout/prizes/` without changes: `framework-16.webp`, `esp32.webp`, `rpi.webp`, `soldering-iron.webp`, `samsung-t7-ssd.webp`, `a1-mini.webp`, `domain-grant.webp` and `centauri-carbon.webp`. They show products by other companies as examples. Pixl's MIT notice stays in `LICENSE`.

The mole mascot (`apps/landing/public/loadout/mole/`, 2026-10-15) is AI-generated art: sprite sheets made with an image model (GPT) from the prompts recorded in `assets/editable/mole/PROMPTS.md`, then cleaned, recoloured to one shared palette and packed into atlases by the scripts in `assets/editable/mole/`. It is original to LOADOUT and copies no existing character. The hearts, sweat drop, stars and similar symbols are generic shapes drawn by the same model. A hand-drawn touch-up in Aseprite is recommended before the mole becomes the program's main mascot.

## Pixl platform shell port — 2026-10-20

The preview was removed from the repository on 2026-10-20. This section and its file table remain as the attribution record for the code that existed.

The first participant-platform shell (`apps/platform`, merged in PR #134, removed 2026-10-20) adapted Pixl's participant shell. Source: `references/pixl/apps/web-shell/app/(shell)/` and `references/pixl/apps/web-shell/app/globals.css` at commit `8141b992e92e05583246fd914c63a101100f6fe4`. The exact notice, from `references/pixl/LICENSE`, applies to these files and stays with them:

```text
MIT License

Copyright (c) 2026 Pixl

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Adapted files (each needs a one-line header comment pointing here; check this in review):

| LOADOUT file | Pixl source | What was kept | What changed |
|---|---|---|---|
| `apps/platform/components/shell/nav-data.ts` | `app/(shell)/nav-data.ts` | Group and item data shape; the four-slug mobile dock list | New groups and 23 items; status, purpose, policy and source fields; Report removed |
| `apps/platform/components/shell/icons.tsx` | `app/(shell)/nav-data.ts` (`ICONS`, `MORE_ICON`, `PALETTE_ICON`) | Whole-pixel rect geometry on a 16 by 16 grid for shared tabs | Rendered as React SVG, not HTML strings; original LOADOUT icons for the other tabs |
| `apps/platform/components/shell/shell-nav.tsx` | `app/(shell)/shell-nav.tsx` | Sidebar, dock and MORE sheet structure; active-route matching | Game links and currency chips removed; accessibility and focus behaviour added |
| `apps/platform/components/shell/top-rail.tsx`, `theme-toggle.tsx` | `app/(shell)/shell-nav.tsx` (top rail, theme picker) | Top rail position and theme control idea | Currency chips removed; one toggle on `loadout-theme` |
| `apps/platform/components/shell/gate.tsx` | `app/(shell)/gate.tsx` | A centred signed-out card | No splash image, no login link, no URL handoff |
| `apps/platform/app/(participant)/layout.tsx` | `app/(shell)/layout.tsx` | Shell wrapper around the page | No session, wallet or event reads |
| `apps/platform/app/globals.css` | `app/globals.css` (shell rules) | Shell geometry: 260px sidebar, 54px rail, bottom dock and sheet at 900px | LOADOUT tokens, fonts and shadows replace Pixl's; accessibility rules added |

`apps/platform/app/layout.tsx` and `app/page.tsx` are reimplemented from the same Pixl files and carry no Pixl text beyond the redirect idea. The full path-level map, including everything read and not copied, is in pixl-platform-port-map.md (removed; see git history). Check the PR diff for the final file list; the table above must match it.

Not copied: Pixl's session, login, token handoff and server-API files, its Docs engine, its forms, its staff dashboard, `apps/pixorpheus`, and all Pixl art, fonts and brand assets.

## Platform preview pages — 2026-10-20

By owner instruction on 2026-10-20 every internal tab of `apps/platform` was a working preview feature on labelled sample data (see `DECISIONS.md`). The pages were under `apps/platform/components/pages/`. Each folder had a `SOURCES.md` with the same facts as this section. No source text, markup, CSS, copy or art from any reference was pasted; the rules and flows were rewritten in React and TypeScript against LOADOUT's plans and tokens. The adapted-files table in the shell section above is unchanged.

Suggested attribution lines, one per reference. Reuse of Stardance and Stasis rests on the owner-stated permission (2026-10-20, evidence pending). Pixl is MIT and its notice, reproduced in the shell section above, stays with it.

| Reference | What was read | Used for | Basis |
|---|---|---|---|
| Pixl `apps/game/web/shop/index.html` | Search, sort menu, affordable and price filters, category chips, saved toggle, locked-item display, afford indicator | Behaviour of `gear/` Shop and Wishlist | MIT, Copyright (c) 2026 Pixl. Behaviour only |
| Pixl `apps/game/web/collectibles/index.html` | Grid with progress toward an unlock and an owned state | Behaviour of `gear/` Collectibles | MIT. Behaviour only |
| Pixl `apps/game/web/refers/index.html` | Code card with copy buttons, stat tiles, "got a code" form | Behaviour of `gear/` Referrals | MIT. Behaviour only |
| Pixl `apps/game/web/calc/index.html` | Hours input beside a result card | Layout idea of `gear/` Ore calculator | MIT. Behaviour only |
| Pixl `apps/game/web/ideas/index.html` | Newest and top-voted orders, one upvote per person, compose box | Behaviour of `community-a/` Ideas | MIT. Behaviour only |
| Pixl `apps/game/web/explore/projects/index.html` | Project board linking to a detail page | Behaviour of `community-a/` Explore (detail view kept in the URL hash) | MIT. Behaviour only |
| Pixl `apps/game/web/show-n-tell/index.html` | Showcase entries ordered by votes | Behaviour of `community-a/` Show & Tell | MIT. Behaviour only |
| Pixl `apps/game/web/projects-ship-checklist.test.ts` | A live ship checklist that turns on tracker hours | Idea behind `build/logic/ship.ts` | MIT. Idea only |
| Pixl vault "GOALS" page (`apps/game/web/vault/`) | A shared community goal meter | Idea behind the Community Era meter in `community-b/` | MIT. Idea only, nothing copied |
| Stardance `app/models/post/ship_event/payouts.rb` | First N ordered votes, per-category median, mean of medians, midrank percentile, a curve of the form `low + (high - low) x percentile^exponent` | Method in `build/logic/scoring.ts` and `constants.ts`. LOADOUT's exponent, range, cohort and four categories are different | Owner-stated permission, evidence pending. Structure only, no code |
| Stardance `app/models/mission.rb`, `mission/step.rb`, `mission/prerequisite.rb`, `mission/submission.rb` | Mission shape: difficulty, minutes, hardware flag, ordered steps, prerequisite links, submission states | `build/logic/missions.ts` and `content.ts`. Renamed and simplified; no prizes, unlocks or payouts | Owner-stated permission, evidence pending. Structure only, no code |
| Stardance `app/components/discover_rail/streak_widget.rb`, `streak_badge_component.rb` | Consulted for the idea of a streak count | Nothing reused. LOADOUT's streak is weekly with no daily roll or claim | Owner-stated permission. Not used |
| Stasis `lib/certificates.ts`, `app/api/certificate/verify/route.ts`, `app/certificate/page.tsx` | Code typed back by hand and normalised, looked up among issued certificates, answer shows only name and date | `community-b/logic/certificate.ts` and `events-parts.tsx`, rewritten without Airtable or a server | Owner-stated permission (also the 2026-10-11 Stasis reply above), evidence pending. Idea only, no code |

Suggested attribution wording for the project README or credits, once the owner approves it: "The platform preview pages were written for LOADOUT. Their behaviour was informed by reading Hack Club Pixl (MIT, Copyright (c) 2026 Pixl), Hack Club Stardance and Hack Club Stasis, with permission stated by the LOADOUT owner. No source text from those projects is included."

The Hub pages (`hub/`: Overview, Profile, Achievements, Notifications, Account) opened no reference source. They were written from the plans and the port map rows for Pixl `dashboard`, `account` and `routes/notifications.ts`. The pinned submodules were not checked out in the `platform-shell` worktree. Stasis lab, inventory, NFC and printer features are not implemented.

LOADOUT's own assets: 28 sprites (PNG, 32 by 32) were copied from `apps/landing/public/loadout/sprites/` to `apps/platform/public/loadout/sprites/`: board, builder, cap, check, cloud, code, cpu, document, domain, equipment-box, flask, gear, gift, globe, hoodie, laptop, layers, list, ore, people, requisition-i, requisition-ii, requisition-master, storage, terminal, ticket, wrench and xp-star. They are original to LOADOUT, not third-party, and carry no attribution duty. The Pixl art, fonts and brand in the exclusions below are not used.

## Pixl licence exceptions — 2026-10-20

The 2026-10-14 entry above records that the Pixl owner said everything in Pixl is under the MIT licence. The repository itself shows exceptions, which the earlier text and `source-bases.md` did not list:

- `apps/pixorpheus` is licensed GNU AGPL-3.0 (`apps/pixorpheus/LICENSE`). It is excluded from LOADOUT.
- Third-party or purchased art, product photos, brand assets and fonts (including Phantom Sans and the other fonts Pixl serves) are not covered by the MIT text. They stay excluded unless the owner confirms that the permission below covers them. The eight prize photos already on the homepage belt and the Phantom Sans files are recorded under their own dated entries in this file.
- Pixl's brand (name, logo, boot splash, colours and cursor art) is not carried over to LOADOUT's platform shell.

Open question for the owner: does the permission cover these non-MIT assets? Until answered, the exclusion stands.

Path correction: the 2026-10-14 prize photo entry above cites `references/pixl/apps/pixl-dashboard/public/shop/`. That path does not exist at the recorded pin. Pixl's shop product images are under `apps/landing/public/shop/` (for example `framework-16.webp`). The entry is kept as written; use the corrected path when re-checking the source.

## Reuse permission statement — 2026-10-20

Owner statement, recorded as stated and not verified: the repository owner says they have obtained permission from all the reference owners to reuse their material. Scope: all four references (Pixl, Stardance, Stasis and the YSWS Template), code and design, for LOADOUT. Stated on 2026-10-20.

Effect on this record:

- Where earlier entries say a reference has "no reuse basis", "reference-only" or "no identified licence", the working basis is now this owner statement, with evidence pending. Copied files must still be logged in `docs/archive/platform-preview-20261020/pixl-platform-port-map.md` (or the landing record) with their source path and SHA, and any notice they carry must be kept.
- Pixl stays MIT with the exceptions listed above. The statement does not widen them until the owner confirms it covers the non-MIT assets.
- Product decisions in `DECISIONS.md` still stand. Permission to copy does not mean LOADOUT adopts the other project's rules, currency, copy or branding.

**TODO (owner):** attach or link the written grants. Record who granted permission for each of the four references, when, and where the message or file can be found (channel, thread link or document). Do not paraphrase from memory. Until this is done the statement is an unsupported claim and the evidence is pending. The 2026-10-11 Stasis entry (an informal reply from Hack Club) and the 2026-10-14 Pixl entry (a Slack message) are the only grants quoted so far, and both still need the sender, date and link.

## Shop catalog photos — 2026-11-01

The Shop tab (`apps/landing/lib/platform/shop.ts`, `app/(platform)/dashboard/(shell)/shop/`) lists proposed items. Their photos come from two places. Pixl's product photos are covered by the permission quoted in the 2026-10-14 entry above; on 2026-11-01 the LOADOUT owner also said in chat that they hold permission to use the pictures from the reference repositories (Pixl and the others), which answers the open question in "Pixl licence exceptions" for these files. The written grant is still the owner's TODO in "Reuse permission statement".

**From Pixl** (`references/pixl/apps/landing/public/shop/`, pinned commit `8141b992e92e05583246fd914c63a101100f6fe4`, copied unchanged to `apps/landing/public/loadout/prizes/`): `flipper.webp`, `screwdriver.webp`, `furycube.webp`, `pcb.webp`, `arduino.webp`, `logitech-mx-master-3s-nobg.webp`, and the two pixel-art icons `gpu-grant.webp` and `hosting-grant.webp`. They show products by other companies as examples. Pixl's own origin for `pcb.webp` is not recorded and the photo may be a Wikimedia Commons image whose credit we do not have; replace it with a photo whose licence is known before launch. The same applies to the product photos in general: they are other companies' product images, used as examples of what an item looks like.

**From Wikimedia Commons**, each downloaded on 2026-11-01 as a resized copy (no crop or other edit) into `apps/landing/public/loadout/prizes/`, with the photographer credited on the item page (`credit` in `shop.ts`):

| File | Commons page | Author | Licence |
| --- | --- | --- | --- |
| `pico-w.jpg` | File:RPI_PICO_W_1.jpg | SparkFun Electronics | CC BY 2.0 |
| `tang-nano-fpga.jpg` | File:Sipeed_Tang_Nano_9K_FPGA.jpg | Popolon | CC0 1.0 |
| `usb-logic-analyzer.jpg` | File:8_Channel_USB_logic_analyzer_(5172098012).jpg | Dilshan Jayakody | CC BY-SA 2.0 |
| `oscilloscope.jpg` | File:RIGOL_DS1054Z_Digital_Storage_Oscilloscope.jpg | Draconichiaro | CC BY-SA 4.0 |
| `yubikey.png` | File:YubiKey_5_NFC.png | FelixLadd | CC BY-SA 4.0 |
| `mini-pc.jpg` | File:Intel_NUC_Mini_PC.jpg | Project Kei | CC BY-SA 4.0 |

Page URLs are `https://commons.wikimedia.org/wiki/` plus the file name. The share-alike licences apply to those photos only, not to the rest of the site. The tickets and grants (`irl-ticket`, `flight-grant`, `conference-grant`) use LOADOUT's own sprites.

## Shop catalog photos, second round — 2026-11-01

The proposed shop catalog grew to 69 items (`apps/landing/lib/platform/shop.ts`) and the owner asked for real pictures instead of icons. Same basis as the entry above: Pixl photos under the 2026-10-14 permission and the owner's statement of 2026-11-01, Commons photos under their own open licences with a credit on the item page.

**More from Pixl** (`references/pixl/apps/landing/public/shop/`, pinned commit `8141b992e92e05583246fd914c63a101100f6fe4`, copied unchanged to `apps/landing/public/loadout/prizes/`): `aseprite.webp`, `google-play.webp`, `cpu-grant.webp`, `ram-grant.webp` (pixel-art icons), `framework-13.webp` and `ender3-v3.webp`. Pixl's logo-only images (the Anthropic wordmark, the Apple logo and the PICO-8 wordmark), its `hardware-grant.webp` banner (it carries other companies' logos) and its Tamagotchi photo were left out on purpose.

**More from Wikimedia Commons**, downloaded on 2026-11-01 as resized copies (no crop or other edit), each credited on its item page. Page URLs are `https://commons.wikimedia.org/wiki/` plus the file name.

| File in `prizes/` | Commons file | Author | Licence |
| --- | --- | --- | --- |
| `pi-zero-2-w.jpg` | File:Raspberry_Pi_Zero_2_W.jpg | Laserlicht | CC BY-SA 4.0 |
| `breadboard.jpg` | File:400_points_breadboard.jpg | oomlout | CC BY-SA 2.0 |
| `eink-module.jpg` | File:Monokroomne_e-paberi_moodul_suurusega_122x250_pikslit.jpg | Tauno Erik | CC BY 4.0 |
| `rtl-sdr.jpg` | File:Rtl-sdr.jpg | Joeceads | CC BY-SA 4.0 |
| `servo.jpg` | File:Tower_Pro_SG90_micro_servo_motor.jpg | Suyash Dwivedi | CC BY-SA 4.0 |
| `multimeter.jpg` | File:UT61D_digital_multimeter_front.jpg | Anselm Schüler | CC BY-SA 4.0 |
| `usb-microscope.jpg` | File:Digital_USB_microscope.jpg | Ravi312 | CC BY-SA 4.0 |
| `pinecil.jpg` | File:Pinecil_USB_C_soldering_iron.jpg | 4300streetcar | CC BY 4.0 |
| `usb-c-dock.jpg` | File:USB-C_dock_front.jpg | Basfluax | CC BY-SA 4.0 |
| `jetson-nano.jpg` | File:NVIDIA_Jetson_Nano_Developer_Kit_(47616885631).jpg | SparkFun Electronics | CC BY 2.0 |
| `calipers.jpg` | File:2020_Suwmiarka_cyfrowa.jpg | Jacek Halicki | CC BY-SA 4.0 |
| `hot-air-station.png` | File:Accta_301_Soldering_Station.png | YuriyTer | CC BY-SA 4.0 |
| `fume-extractor.jpg` | File:BOFA_V250.jpeg | Ivan Albion | CC BY-SA 3.0 |
| `filament.jpg` | File:Crossed_filiment.jpg | SuperBlobMonster | CC BY-SA 3.0 |
| `sensor-kit.jpg` | File:SparkFun_HC-SR04_Ultrasonic-Sensor_13959-01a.jpg | SparkFun Electronics | CC BY 2.0 |
| `network-router.jpg` | File:Ubiquiti_edgerouter_x_router.jpg | Kent Madsen | CC BY 4.0 |
| `nas.jpg` | File:Synology_Disk_Station_DS223J_-_NAS-Server.jpg | DYVER | CC BY-SA 4.0 |
| `thermal-camera.jpg` | File:FLIR_One_Pro_Thermal_Camera_(29349789547).jpg | jcutrer.com | CC BY-SA 2.0 |
| `usb-c-cable.jpg` | File:USB-C_cable_2017_A.jpg | Fructibus | CC0 1.0 |
| `lora-node.png` | File:Meshtastic2.png | Valanagut | CC0 1.0 |

Notes: the thermal camera photo is a picture a FLIR camera took, not the camera; the LoRa photo is a labelled board in German; the filament photo is a hand holding a strand. Replace any of these with a better photo when one is available. Items with no photo yet keep a LOADOUT sprite: the tickets, stays, grants and licences, and the macropad kit, DIY handheld kit, Cardputer, debug probe, bench power supply and portable monitor (no open-licence photo was found for them).

## Shop pictures from the references, background removed — 2026-11-01

The owner asked for the shop to use the references' own pictures first, with every background removed, and said they hold permission to use them. The shop now lives on 59 processed pictures in `apps/landing/public/loadout/shop/` (WebP with transparency, trimmed, at most 800 px). The eight prize photos on the homepage belt stay untouched in `apps/landing/public/loadout/prizes/`. This entry replaces the file names in the two shop-photo entries above: every Pixl or Commons picture listed there that the shop still uses was processed and renamed to `shop/<item picture name>.webp` (for example `pico-w.jpg` became `shop/pico-w.webp`). Three of the pictures listed above are no longer used: the Rigol oscilloscope photo (the Stasis drawing replaced it) and the filament and thermal-camera photos (their cut-outs came out unusable, so those two items use LOADOUT sprites). The Commons photos that are still used keep their credit on the item page.

**New sources**, all copied unchanged first and then processed:

- **Stardance** (`references/stardance` at pinned commit `5b6bfb86462e0edc68592d6985168d09543f00d5`, `app/assets/images/`): `onboarding/prizes/raspberry-pi-5.png`, `onboarding/prizes/framework-laptop.png`, `onboarding/prizes/bambu-a1-mini.png`, `onboarding/prizes/ipad.png`, `onboarding/prizes/meta-quest-3.png`, `landing/prizes/camera.png`, `landing/prizes/mouse.png`, `landing/prizes/switch.png`, `landing/prizes/airpods.png`, `landing/prizes/kindle.avif`, `landing/prizes/amd-rx9060.png`, `landing/prizes/blahaj.png`, `macbook-air.png`, `shop/hardware_build_fund.png` and `landing/weekend/cat-printer.png`. They show products by other companies as examples.
- **Stasis** (`references/stasis/public/`): `bench-power-supply-orange.png` and `oscilloscope-orange.png`, line drawings in Stasis's orange.
- **YSWS template** (`references/ysws-template/frontend/static/images/shop/`): `flight-stipend.webp`.
- **Pixl** (`references/pixl/apps/landing/public/shop/`): `esp32`, `arduino`, `flipper`, `screwdriver`, `furycube`, `domain-grant`, `hosting-grant`, `gpu-grant`, `cpu-grant`, `ram-grant`, `samsung-t7-ssd`, `soldering-iron`, `pcb`, `ender3-v3`, `centauri-carbon`, `framework-13`, `aseprite` and `google-play` (all `.webp`).

**Processing:** the 27 pictures that still had a background (the Commons photos, Pixl's PCB, Framework 13 and the template's flight stipend) were cut out locally with the IMG.LY `@imgly/background-removal-node` 1.4.5 model, run on this machine from a scratch folder outside the repository (nothing was uploaded and none of its code was added to the repo; the library is AGPL-3.0, and the pictures it produced are data, not part of it). Every picture was then trimmed of empty margin, fitted inside 800 px and saved as WebP with `sharp`. Pixl's logo-only images and the Tamagotchi photo were not used.

**Added to the catalog from Stardance's prize list:** a MacBook Air, an AMD Radeon RX 9060 XT graphics card (it replaces the $200 GPU upgrade grant and keeps the Compute LV.8 gate), an iPad, a Meta Quest 3, a Nintendo Switch, AirPods Pro, a Kindle, a compact 4K camera, a mini thermal sticker printer and a Blåhaj plush. All are General items at the full price. Plan 02 keeps entertainment, merch and unrelated consumer electronics out of the shop, so the owner's request overrides it for these items; they sit in one block at the end of `shop.ts` and are easy to remove.

## Shop pictures, more from Stardance and the references — 2026-11-01

The owner found some pictures weak and asked for as many as possible from Stardance, including its icons for grants, then the other references. The shop now uses 70 processed pictures (`apps/landing/public/loadout/shop/`), counted by source: Stardance 25, Pixl 20, Wikimedia Commons 21, Stasis 2 and the YSWS template 2. The Commons credits are on the item pages. This entry replaces the picture counts in the entry above.

**Added from Stardance** (`references/stardance/app/assets/images/` at commit `5b6bfb86462e0edc68592d6985168d09543f00d5`): `landing/weekend/keebcard.png` (the macropad), and its pastel icons `icons/book.png`, `icons/calendar.png`, `icons/box.png`, `icons/rocket.png`, `icons/stardust.png`, `icons/paper.png` and `icons/cart.png`, used for the IRL ticket, the nights' stays, the grants, licences and credits. Two of its one-colour UI glyphs, `icons/terminal.svg` and `icons/code.svg`, were drawn in LOADOUT blue (`#4F8BE8`) so they read on both themes.

**Added from the other references:** from the YSWS template, `frontend/static/images/shop/framework.webp` (the Framework 12 convertible); from Pixl, `mac-mini-m6-nobg.webp`, `odyssey-g5.webp` and `retro-handheld.webp`.

**Dropped:** Pixl's `framework-13.webp` (a dark laptop on a hand, a poor cut-out), and the Commons photos of the collage mini PC and the labelled LoRa board. The multimeter and the RTL-SDR cut-outs were cleaned of stray lines and specks.

**Changed in the catalog to match the pictures:** the Framework 13 became a Framework 12 (1,290 Ore), the mini PC a Mac mini (1,410 Ore), the portable monitor a 27-inch QHD monitor (470 Ore) and the DIY handheld kit a retro handheld console (150 Ore, General). Five hardware items still use a LOADOUT sprite because no reference or open picture was usable: the Cardputer, the debug probe, the LoRa node, the filament and the phone thermal camera.

## Shop pictures, owner's corrections — 2026-11-01

The owner reviewed the shop again: official marks for the software items, LOADOUT's own icons for the event and learning items and for the hardware items LOADOUT already has icons for, no Stasis drawings, a real filament photo, and three items removed. The shop now has 75 items and 62 pictures in `apps/landing/public/loadout/shop/`: Stardance 14, Pixl 22, Wikimedia Commons 24 and the YSWS template 2. This entry replaces the counts above.

**Stasis:** its two orange drawings (`bench-power-supply-orange.png`, `oscilloscope-orange.png`) are no longer used. The oscilloscope has the Commons Rigol photo again and the bench power supply has LOADOUT's `psu` icon. Stasis's older pictures (`public/old-cdn`) are KiCad and CAD tutorial screenshots, with no product photos to use.

**Stardance:** no longer used are the calendar, rocket, paper, book, cart and stardust icons, the two blue glyphs, and the Switch, camera and cat printer pictures. Still used: the product shots (Raspberry Pi 5, Framework laptop, Bambu A1 Mini, mouse, MacBook Air, iPad, Quest 3, AirPods, Kindle, Blåhaj, RX 9060), `shop/hardware_build_fund.png`, `landing/weekend/keebcard.png` (the macropad) and `icons/box.png` (the nights' stays).

**Pixl, new:** `api.webp`, `apple-dev.webp` and `mac-mini.webp` (the front view, cut out; the earlier `-nobg` file had stray edges). `api.webp` is the Anthropic wordmark Pixl uses for AI credits and `apple-dev.webp` is the Apple logo; both are one black colour, so the page flips them to white in the dark theme. They are other companies' marks shown to say what the item is.

**Wikimedia Commons, new:** `File:ABS_filament_spool.jpg` (Tatár Lehel, CC BY-SA 3.0, credited on the item page), `File:Visual_Studio_Code_1.35_icon.svg` (Microsoft, public domain) for the code editor item, and `File:PICO-8_logo.png` (Lexaloffle, public domain) for the PICO-8 item. The Rigol photo (`File:RIGOL_DS1054Z_Digital_Storage_Oscilloscope.jpg`, Draconichiaro, CC BY-SA 4.0) is back with its credit. The two public-domain marks carry no credit line; the PICO-8 mark is one pale colour on black, keyed out by brightness, and the page flips it to black in the light theme.

**LOADOUT's own icons** (`apps/landing/public/loadout/sprites/`) now stand for: the IRL ticket (`ticket`), the conference grant (`people`), the book grant (`cap`), the $10 hosting grant (`cloud`), the cloud database credits (`storage`), the laptop grant (`laptop`), the e-ink module (`eink`), the Cardputer (`cardputer`), the LoRa node (`lora`), the phone thermal camera (`thermal`), the debug probe (`probe`) and the bench power supply (`psu`).

**Removed from the catalog:** the Nintendo Switch, the compact 4K camera and the mini thermal sticker printer.

## Shop pictures, last corrections — 2026-11-01

The two nights' stays and the $10 parts grant were removed (72 items on 60 pictures). The $10 PCB fabrication grant now uses Stardance's `shop/hardware_build_fund.png` (the picture the parts grant had). The USB-C dock uses `File:ALMIGHTY_DOCK_C1.jpg` from Wikimedia Commons (しろうるり, public domain) instead of the StarTech dock photo, which showed a flat slab without ports, and its credit line was updated. Shop pictures are now saved as `<name>.<content hash>.webp`, so a replaced picture can never be shown from the browser's or the image optimiser's cache under an old name. That is why the oscilloscope still showed the old Stasis drawing: the new Rigol photo (`File:RIGOL_DS1054Z_Digital_Storage_Oscilloscope.jpg`, Draconichiaro, CC BY-SA 4.0) had kept the same file name. The unused Pixl `pcb.webp` and the StarTech dock photo are no longer in the shop.
