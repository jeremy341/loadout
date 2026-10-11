# Attribution and reuse record

## Reference handling

`references/` contains four pinned top-level Git submodules. A limited Pixl landing subset was copied for Stage A local comparison and then redesigned in Stage B. The final homepage retains adapted Next.js, Lenis, navigation, and reveal patterns; copied Pixl media and source-specific pages were removed. No YSWS Template, Stardance, or Stasis files are copied. Use `git submodule update --init` to populate the references in a fresh checkout. Do not recurse into Stardance's nested `secrets` submodule: its GitHub remote returned “Repository not found” on 2026-10-05.

## Pixl

Hack Club Pixl at commit `8141b992e92e05583246fd914c63a101100f6fe4` on `main` is the PRIMARY ENGINEERING BASE. Its upstream root license is MIT; the full original notice remains in `references/pixl/LICENSE`. The top-level LOADOUT `LICENSE` retains both the Jerry and Pixl copyright notices. Exact source/target mappings and final reuse decisions are in `landing-port-and-assets.md`; owned SVGs and licensed fonts are recorded in `landing-port-and-assets.md`. Pixl and Hack Club do not endorse LOADOUT by virtue of this reuse.

## YSWS Template

EDRipper/ysws-template at `1ac191fa5eee1e57983b29ab7101f700c166e207` on `master` is the GENERAL YSWS OPERATIONS / INFRASTRUCTURE REFERENCE. The checkout has no root license or README, no reported repository license, and backend package metadata says `UNLICENSED`. Its Git submodule is a link to the upstream repository; no source files or assets are copied into LOADOUT. Obtain a reuse basis before adapting or redistributing its implementation.

## Stardance

Hack Club Stardance at `3a0fe8148b07c1edfe005e94dfc9d1faa4b64c14` on `main` is the PEER REVIEW / QUALITY SCORING / MULTIPLIER SPECIALIST REFERENCE. The checkout has no LICENSE file and no reported repository license. Its Git submodule is a link to the upstream repository; no source files or assets are copied into LOADOUT. LOADOUT does not adopt Stardance's Rails architecture, four voting criteria, score formula, or payout formula.

## Stasis

Hack Club Stasis at `7a230ced9ad793f0ad4cda30a7d71c02a58da6b6` on `main` is a hardware hackathon reference. The pinned checkout has no root LICENSE file, and GitHub reports no repository license for it (checked 2026-10-11, when the pin matched upstream `main`). Reuse permission was reported by the project owner on 2026-10-11: an informal written reply from Hack Club, quoted as "Yea sure youre free to use it no worrys". The sender, date and channel still need to be recorded here. LOADOUT's reuse is limited to the components listed in `DECISIONS.md`. Stasis copy, artwork, photos, logos, event dates, location, scale and operating claims are not copied. Credit Stasis wherever its code is adapted.

## Future additions

Before copying code, text, or assets from any reference without an identified license, establish a compatible license or explicit permission, preserve required notices, record the exact source SHA and paths, and update `source-bases.md` and `decisions.md`.

## Public Docs navigation audit — 2026-10-07

Pixl at the recorded `8141b992e92e05583246fd914c63a101100f6fe4` MIT pin supplies navigation references in `apps/web-shell/app/docs/docs-shell.tsx`, `apps/web-shell/app/docs/docs.css`, `apps/web-shell/app/docs/[slug]/doc-toc.tsx`, `apps/web-shell/lib/docs.ts`, and `packages/docs-engine/src/markdown.ts`.

**ADAPT:** left alignment, grouped directory and current-heading indication. **REIMPLEMENT:** safe React Markdown, internal-pane anchors/search and LOADOUT topics. **REFERENCE ONLY:** Pixl content/tutorial organization. **IGNORE:** Pixl-specific economy, restoration and theme/config machinery. Code is independently implemented for LOADOUT's contract; existing MIT notices remain. No Template/Stardance code or media is adopted.
