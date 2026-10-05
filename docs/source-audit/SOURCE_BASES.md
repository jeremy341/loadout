# Source bases and versions

Recorded 2026-10-04 from the pinned reference checkouts. Each reference is an independent Git submodule under `references/`; the parent repository records only its URL and exact commit pointer. Initialize these top-level references with `git submodule update --init`. The commit IDs are immutable pins, not claims that upstream is still at its latest commit.

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

To populate the top-level reference folders in a fresh clone, run `git submodule update --init`. Pixl and YSWS Template do not declare nested submodules in these pins. Stardance declares `references/stardance/secrets` at `f7c450aa3a128015a57681a9262b9db2dcf72385`, URL `../stardance-secrets.git` (GitHub `hackclub/stardance-secrets`). Initializing that nested submodule returned “Repository not found” on 2026-10-05. Its access is unavailable in this environment; do not recurse, vendor, or infer its contents. The pinned parent Stardance checkout is fully initialized and remains available for source reading.

## Scope boundaries

Pixl remains the primary engineering reference. A temporary landing subset was ported for Stage A verification, then replaced with the LOADOUT public homepage in the same Next.js app. Final source reuse is limited to the landing composition and adapted scrolling/navigation/motion patterns recorded in `PUBLIC_SITE_PORT.md`. The temporary Pixl media and source-only pages were removed. YSWS Template and Stardance remain source-reading references until a reuse basis exists.

The Stardance review audit does not adopt Rails or Stardance's rubric, aggregation, percentile, or payout formula. LOADOUT's canonical quality dimensions remain Originality, Technical Depth, Execution, and Documentation; the resulting LOADOUT quality assessment informs its Bolts multiplier according to `PLAN/02`.
