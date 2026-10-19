# Source bases and versions

Recorded 2026-10-10 from the pinned reference checkouts and GitHub metadata; Stardance was refreshed to upstream `main` on 2026-10-19 after discovering its Virality Bonus. Each reference is an independent Git submodule under `references/`; the parent repository records only its URL and exact commit pointer. Initialize these top-level references with `git submodule update --init`. Commit IDs are immutable pins, not claims that upstream is still at its latest commit.

| Source and role | Remote | Branch at audit | Exact SHA | License / permission basis | Reference path |
|---|---|---|---|---|---|
| Pixl — PRIMARY ENGINEERING BASE | https://github.com/hackclub/pixl.git | main | `8141b992e92e05583246fd914c63a101100f6fe4` | MIT; preserve the complete upstream notice available at `references/pixl/LICENSE`. | `references/pixl/` |
| YSWS Template — GENERAL YSWS OPERATIONS / INFRASTRUCTURE REFERENCE | https://github.com/EDRipper/ysws-template.git | master | `1ac191fa5eee1e57983b29ab7101f700c166e207` | No root LICENSE or README in this checkout; repository license metadata is absent; `backend/package.json` says `UNLICENSED`. Do not copy or vendor its code without permission. | `references/ysws-template/` |
| Stardance — PEER REVIEW / QUALITY SCORING / MULTIPLIER / VIRALITY REFERENCE | https://github.com/hackclub/stardance.git | main | `d889f39060a443476a88b98a87d5088033626eff` | No LICENSE file found in the checkout and no reported repository license. Do not copy or vendor its code without permission. | `references/stardance/` |
| Stasis — HACK CLUB HARDWARE HACKATHON / EVENT-PROGRAM REFERENCE | https://github.com/hackclub/stasis.git | main | `7a230ced9ad793f0ad4cda30a7d71c02a58da6b6` | No LICENSE file and no GitHub license metadata at this SHA (checked 2026-10-11; the SHA matches upstream main). Reuse permission reported by the project owner on 2026-10-11: an informal written reply from Hack Club (sender, date and channel still to be recorded). Scope: the components listed in DECISIONS.md only. | `references/stasis/` in the workspace-restructure worktree (not a submodule of this checkout) |

## Verification

The original checkouts were clean at the recorded SHAs before being placed under `references/`. The LOADOUT tree pins those same commits as Git submodule entries. Verify the working references with:

```bash
git -C references/pixl rev-parse HEAD
git -C references/ysws-template rev-parse HEAD
git -C references/stardance rev-parse HEAD
git -C references/stasis rev-parse HEAD
git -C references/pixl status --short
git -C references/ysws-template status --short
git -C references/stardance status --short
git -C references/stasis status --short
```

To populate the top-level reference folders in a fresh clone, run `git submodule update --init`. Pixl and YSWS Template do not declare nested submodules in these pins. Stardance declares `references/stardance/secrets` at `f7c450aa3a128015a57681a9262b9db2dcf72385`, URL `../stardance-secrets.git` (GitHub `hackclub/stardance-secrets`). Initializing that nested submodule returned “Repository not found” on 2026-10-05. Its access is unavailable in this environment; do not recurse, vendor, or infer its contents. The pinned parent Stardance checkout is fully initialized and remains available for source reading.

## Scope boundaries

Pixl remains the primary engineering reference. A temporary landing subset was ported for Stage A verification, then replaced with the LOADOUT public homepage in the same Next.js app. Final source reuse is limited to the landing composition and adapted scrolling/navigation/motion patterns recorded in `landing-port-and-assets.md`. The temporary Pixl media and source-only pages were removed. YSWS Template, Stardance, and Stasis remain reference-only until a reuse basis exists; Stasis has not received a comparative architecture audit.

The Stardance audit is reference-only and does not authorize Rails or source-code reuse. Its current public guide documents an external Virality Bonus: Good gives a flat Stardust bonus and rewards, while Great raises the hourly payout ceiling from 20 to 30. The submission path is behind the `virality_bonus` feature flag; inspection found a claim form and stored review fields, but no complete reviewer-resolution/payout path in the audited source. LOADOUT has selected an adapted Good/Great Signal policy in Plans 02 and 22, with its own Ore rewards and 30× Great ceiling. No Stardance implementation or assets are copied.

LOADOUT's canonical quality dimensions remain Originality, Technical Depth, Execution, and Documentation. Decisions on which Stardance review mechanics LOADOUT adopts are recorded separately in the active product-plan review; they do not grant permission to copy Stardance code or assets.

The optional Phantom Sans WOFF2 files are recorded as coming from Pixl's live site, not from the pinned checkout. The MIT entry above describes the pinned repository license and does not establish license coverage for these live font assets. No separate permission for them is recorded here.
