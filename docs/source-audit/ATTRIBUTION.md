# Attribution and reuse record

## Reference handling

`references/` contains three pinned Git submodules. The LOADOUT Git history stores the upstream URLs and commit pointers, not copies of the reference repositories' source files. Use `git clone --recurse-submodules` to populate them in a fresh checkout.

## Pixl

Hack Club Pixl at commit `8141b992e92e05583246fd914c63a101100f6fe4` on `main` is the PRIMARY ENGINEERING BASE. Its upstream root license is MIT; the full original notice remains in `references/pixl/LICENSE`. The top-level LOADOUT `LICENSE` remains the MIT notice created for this repository and names Jerry. If Pixl code is later copied into LOADOUT-owned files, retain the required Pixl notice with that redistribution. Pixl and Hack Club do not endorse LOADOUT by virtue of this reference.

## YSWS Template

EDRipper/ysws-template at `1ac191fa5eee1e57983b29ab7101f700c166e207` on `master` is the GENERAL YSWS OPERATIONS / INFRASTRUCTURE REFERENCE. The checkout has no root license or README, no reported repository license, and backend package metadata says `UNLICENSED`. Its Git submodule is a link to the upstream repository; no source files or assets are copied into LOADOUT. Obtain a reuse basis before adapting or redistributing its implementation.

## Stardance

Hack Club Stardance at `3a0fe8148b07c1edfe005e94dfc9d1faa4b64c14` on `main` is the PEER REVIEW / QUALITY SCORING / MULTIPLIER SPECIALIST REFERENCE. The checkout has no LICENSE file and no reported repository license. Its Git submodule is a link to the upstream repository; no source files or assets are copied into LOADOUT. LOADOUT does not adopt Stardance's Rails architecture, four voting criteria, score formula, or payout formula.

## Future additions

Before copying code or assets from either reference without an identified license, establish a compatible license or explicit permission, preserve required notices, record the exact source SHA and paths, and update `SOURCE_BASES.md` and `DECISIONS.md`.