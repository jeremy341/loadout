# Source bases and versions

Recorded 2026-10-04 from the pinned reference checkouts. Each reference is an independent Git submodule under `references/`; the parent repository records only its URL and exact commit pointer. `git clone --recurse-submodules` checks out the source locally. The commit IDs are immutable pins, not claims that upstream is still at its latest commit.

| Source and role | Remote | Branch at audit | Exact SHA | License / permission basis | Reference path |
|---|---|---|---|---|---|
| Pixl — PRIMARY ENGINEERING BASE | https://github.com/hackclub/pixl.git | main | `8141b992e92e05583246fd914c63a101100f6fe4` | MIT; preserve the complete upstream notice available at `references/pixl/LICENSE`. | `references/pixl/` |
| YSWS Template — GENERAL YSWS OPERATIONS / INFRASTRUCTURE REFERENCE | https://github.com/EDRipper/ysws-template.git | master | `1ac191fa5eee1e57983b29ab7101f700c166e207` | No root LICENSE or README in this checkout; repository license metadata is absent; `backend/package.json` says `UNLICENSED`. Do not copy or vendor its code without permission. | `references/ysws-template/` |
| Stardance — PEER REVIEW / QUALITY SCORING / MULTIPLIER SPECIALIST REFERENCE | https://github.com/hackclub/stardance.git | main | `3a0fe8148b07c1edfe005e94dfc9d1faa4b64c14` | No LICENSE file found in the checkout and no reported repository license. Do not copy or vendor its code without permission. | `references/stardance/` |

## Verification

The original checkouts were clean at the recorded SHAs before being placed under `references/`. The LOADOUT tree pins those same commits as Git submodule entries. Verify the working references with:

```bash
git -C references/pixl rev-parse HEAD
git -C references/ysws-template rev-parse HEAD
git -C references/stardance rev-parse HEAD
git -C references/pixl status --short
git -C references/ysws-template status --short
git -C references/stardance status --short
```

To populate the reference folders in a fresh clone, use `git clone --recurse-submodules <repository-url>` or run `git submodule update --init --recursive` after cloning.

## Scope boundaries

Pixl remains the primary engineering reference, but its application tree is not copied into the LOADOUT product root. No runtime, application architecture, or deployment target is currently shipped by LOADOUT. YSWS Template and Stardance are source-reading references only until an authorized reuse basis exists.

The Stardance review audit does not adopt Rails or Stardance's rubric, aggregation, percentile, or payout formula. LOADOUT's canonical quality dimensions remain Originality, Technical Depth, Execution, and Documentation; the resulting LOADOUT quality assessment informs its Bolts multiplier according to `PLAN/02`.