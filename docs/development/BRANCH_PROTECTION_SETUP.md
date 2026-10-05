# Branch protection and repository access

Repository: `jeremy341/loadout`, personal account. The desired repository visibility and owner/collaborator workflow are documented here; verify live settings before treating this page as current.

## Collaborator

`fazin-ahamed` has verified `write` permission on `jeremy341/loadout` as of 2026-10-05. Both maintainers can create branches and merge check-green PRs. Do not invite an additional guessed username.

## Desired rules

The routine PR destination is `main`. The active protections on each permanent lane (`development`, `testing`, `main`) require a PR and stable CI checks. They require zero human approvals and have no bypass actors. CODEOWNER, owner, Jeremy, team, and latest-pusher approval are not required. Rules apply to administrators and block direct pushes while leaving temporary branches writable by both maintainers.

`development` and `testing` are retained staging/history branches, not the normal targets for feature work. Keep them protected from direct pushes while they remain active, but do not add them as promotion gates to every task.

Use GitHub Actions as the expected check source. The active required checks are **Repository integrity**, **Landing quality**, and **Landing browser**. Integrity validates whitespace and source pins; quality runs lint, typecheck, unit tests, and a production build; browser covers navigation, responsive behavior, normal/reduced motion, and accessibility. They run on PRs into all three permanent branches.

All three permanent branches require checks from an up-to-date PR branch. Force pushes and branch deletion are disabled. Human approval counts remain zero.

## Actual status

PR #1 merged the complete development baseline into `main` at `f55b883b09d2f2e583ffc76fa452128afd5da1e2`; the default clone includes plans, images, and source submodules. Protections were applied and read back from GitHub's API on 2026-10-05: PR required, three checks, zero reviews, admins enforced, no bypass/push restrictions, no force pushes or branch deletions. PR #2 passed and finalized clone instructions. The earlier backup tag remains preserved.

Verification record:

1. `main` contains the complete baseline and current onboarding docs (PRs #1 and #2).
2. The exact required GitHub check names are recorded above and passed on those PRs.
3. All three branches currently have zero approval requirements, admin enforcement, and no bypass list.
4. Collaborator `fazin-ahamed` has verified write access; direct-push rejection follows from PR protection.

## Personal-account limitations

GitHub personal repositories use owner/collaborator permission levels. A write collaborator can merge PRs when repository rules permit it; repository-wide settings and collaborator invitations remain owner tasks. GitHub does not offer the organization-style “restrict who can push” branch restriction on a user-owned repository. Requiring PRs on the three exact lane branches is the intended direct-push block and does not prevent collaborator pushes to feature branches.

Public repositories can use branch protections/rulesets on GitHub Free. If a setting is absent or unavailable in this repository, record the exact UI/API limitation and available plan requirement. Do not create a temporary organization or change repository visibility as a workaround.

## Manual follow-up

- None for branch access or protection as of 2026-10-05.
