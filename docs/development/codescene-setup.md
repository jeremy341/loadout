# CodeScene

**Verified2026-10-07:** CodeScene is connected. PR24 has a successful “CodeScene Code Health Review (main)” at [project85609](https://codescene.io/projects/85609/delta/results/7851596).

CodeScene is a PR maintainability signal, not a required branch-protection check or human-approval substitute. Fix serious regressions introduced by a change and document justified exceptions; do not perform a whole-repository score refactor in an unrelated task.

The integration was configured by the owner through CodeScene Access. The precise quality profile should be read from the project configuration before changing it; a green run does not prove which profile is selected.

## To do: lower the quality gate (owner decision, 2026-10-14)

**What was observed.** On PR #71 (2026-10-13) the "New code is healthy" gate failed because a new file had Code Health below **10.00**. After two rounds of refactoring the file scored 9.69, with one minor rule left (a function with five arguments where four are allowed), and the gate still failed. The project's profile is named "The Bare Minimum", yet it asks new files for a perfect score. Each round costs a fix, a push and a CI wait for findings that do not change behaviour.

**What the owner wants.** The threshold for new files should be **much lower** for the future.

**Why it is not done yet.** It is a CodeScene project setting, not a file in this repository, so only someone with admin access to the CodeScene project can change it: [project 85609, delta analysis configuration](https://codescene.io/projects/85609/config/delta-analysis). No setting has been changed.

**Suggested change** (the owner decides the number): require new files to reach about 8.0 instead of 10.00 (CodeScene treats scores of about 9 and above as healthy). Keep the "Enforce critical code health rules" gate as it is: it found a real problem in `scripts/ship.ps1` (a Bumpy Road) that was worth fixing.

**Until it is changed.** CodeScene is not a required check (see [the workflow](WORKFLOW.md)), so a failing CodeScene status never blocks a merge. Fix real findings, because they are usually cheap and often right, but do not spend extra rounds chasing a perfect 10.00. Useful rules of thumb that avoid most findings: functions of at most four arguments, small single-purpose functions, and no long if-chains in one function.

See [quality integration status](quality-integrations.md) for Codecov and CI. The former “not connected” setup note is superseded by this observed evidence.
