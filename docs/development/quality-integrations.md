# Quality integrations and current evidence

**Workflow evidence reviewed:** 2026-10-19. Integration observations retain their dates below; this is not a promise that external configuration is unchanged. Detailed live branch-protection settings could not be read (HTTP 403); see [branch protection setup](branch-protection-setup.md). Do not store credential values here.

| Integration | Observed state | Evidence and role |
|---|---|---|
| GitHub Actions | Workflow configuration defines CI for all three lanes. Branch heads observed on 2026-10-19: development `34f0668`, testing `2eee7ef`, main `eb94498`. | Branch endpoints reported the expected check names; the detailed branch-protection endpoint returned HTTP 403, so PR requirements and optional rule settings remain unverified. See [the current check contract](required-checks.md) and [dated settings evidence](branch-protection-setup.md). |
| CodeScene | Last observed on 2026-10-10: connected and advisory. | PR #32 had a successful CodeScene Code Health Review for development from CodeScene Access. It was not a required branch check or approval gate. A green result does not confirm the configured quality profile. The new-file gate then asked for a perfect 10.00 and was to be lowered: see [CodeScene](codescene-setup.md). |
| Codecov | No coverage upload is implemented in CI. | `.github/workflows/ci.yml` defines Landing quality and browser checks on lane pull requests and pushes. Landing quality's lint, typecheck, unit, and build steps run for app-affecting diffs on each lane. Browser shards can skip only when the exact source-lane commit has a recorded successful `Landing browser` check. The workflow contains no coverage-generation or Codecov-upload step; a secret alone would not make coverage operational. |
| Vercel | Combined status for main commit `2c642a9` was success, read on 2026-10-18. | [Vercel deployment status](https://vercel.com/jerry-team1/loadout-ysws/84t7V2uBSPTWPhC8zoKDvQwAUBQq). This is status evidence, not a live visual smoke test. The stable domain and project configuration were last independently recorded on 2026-10-06 in [Vercel preview](vercel-preview.md). |
| Rivet | Last checked 2026-10-10: separate bot repo, public main at `e2d2456`. | Its LOADOUT config then contained a stale website URL and copied Markdown sources. See the [Rivet handoff](rivet-handoff.md). No bot changes were made in this cleanup. |

GitHub branch heads and workflow files were observed on 2026-10-19, but detailed branch-protection settings returned HTTP 403. The last full settings readback is dated 2026-10-11 in [branch protection setup](branch-protection-setup.md). Reread them with an appropriately authorized GitHub session before changing or relying on enforcement. No external setting was changed during this audit.

For new evidence, record the exact commit or PR, result, date, and link. Distinguish configuration, a successful check, and user-visible production behavior.
