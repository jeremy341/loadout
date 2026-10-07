# Quality integrations and evidence

Status checked2026-10-07. Configuration evidence and executed checks are different.

| Integration | Observed state | Role |
| --- | --- | --- |
| GitHub Actions | PR24 integrity, quality, browser and promotion checks succeeded. | Existing lane gates; see WORKFLOW.md. |
| CodeScene | PR24 Code Health Review(main) succeeded, project85609. | Advisory maintainability signal. |
| Codecov | GitHub Actions secret named CODECOV_TOKEN exists; current ci.yml has no coverage generation/upload step. | Coverage is not an operational CI signal yet. |
| Vercel | main commit74b43e2 received a successful Production deployment status. | Hosting; verify each release independently. |

No token values were read or printed. A saved Codecov token does not establish uploaded coverage, reports, or a coverage requirement. Adding coverage generation/upload needs a separate implementation scope.

Do not add Copilot review to this pipeline; the owner excluded it. Do not change required check names or protections while documenting integration status.

For new evidence, record the exact PR/commit, result and link. Live settings may change after this dated observation.
