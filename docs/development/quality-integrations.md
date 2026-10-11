# Quality integrations and current evidence

**Checked:** 2026-10-10. This is a dated observation, not a promise that external configuration is unchanged. Do not store credential values here.

| Integration | Observed state | Evidence and role |
|---|---|---|
| GitHub Actions | Required CI is enabled on all three lanes. The latest remote heads observed were development `b262876`, testing `cdd23fe`, and main `cd1834a`. | The branch API reports protected branches and the required check names. The development head's Repository integrity run succeeded. PR #32's Repository integrity, Landing quality, and Promotion lane checks succeeded; its browser check was skipped as expected on development. |
| CodeScene | Connected and advisory. | PR #32 has a successful CodeScene Code Health Review for development from CodeScene Access. It is not a required branch check or approval gate. A green result does not confirm the configured quality profile. |
| Codecov | No coverage upload is implemented in CI. | The current development `.github/workflows/ci.yml` runs lint, typecheck, unit tests, build on promotion lanes, and browser checks on testing/main. It contains no coverage-generation or Codecov-upload step. A secret alone would not make coverage operational. |
| Vercel | GitHub reports a successful Vercel deployment status on the current main commit. | Main is `cd1834a`; its Vercel status reports “Deployment has completed.” The stable domain and project configuration were last independently recorded on 2026-10-06 in [Vercel preview](vercel-preview.md). A status check does not replace a live visual smoke test. |
| Rivet | Separate bot repo; latest public main commit checked was `e2d2456` on 2026-10-10. | Its LOADOUT config still contains a stale website URL and copied Markdown sources. See the [Rivet handoff](rivet-handoff.md). No bot changes were made in this cleanup. |

The GitHub connection can read branch heads and required-check names but receives HTTP 403 for detailed branch-protection settings. The full settings recorded in [branch protection setup](branch-protection-setup.md) were last verified on 2026-10-06; reread them with an appropriately authorized GitHub session before changing or relying on every setting. No external setting was changed during this audit.

For new evidence, record the exact commit or PR, result, date, and link. Distinguish configuration, a successful check, and user-visible production behavior.
