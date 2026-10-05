# Branch protection and repository access

Repository: `jeremy341/loadout`, personal account. The desired repository visibility and owner/collaborator workflow are documented here; verify live settings before treating this page as current.

## Collaborator

`fazin-ahamed` was invited with write permission. The collaborator must accept that invitation before their access is active. Do not guess or invite any other username.

## Desired rules

The routine PR destination is `main`. Protect `main` with a required PR and its required CI checks. Require zero human approvals and configure no bypass actors. Do not require CODEOWNER, owner, Jeremy, team, or latest-pusher approval. Apply the PR rule to administrators. Direct pushes to permanent branches should be blocked once rules are configured; temporary work branches remain writable by both trusted maintainers.

`development` and `testing` are retained staging/history branches, not the normal targets for feature work. Keep them protected from direct pushes while they remain active, but do not add them as promotion gates to every task.

Use GitHub Actions as the expected check source. Current check candidates are **Repository integrity**, **Landing quality**, and **Landing browser**. Integrity validates whitespace and source pins; quality runs lint, typecheck, unit tests, and a production build; browser covers navigation, responsive behavior, normal/reduced motion, and accessibility. Select the exact GitHub-reported check names only after successful runs on each lane. The workflow definitions are local; this does not establish that lane protections are active.

For `main`, also disable force pushes and branch deletion. Enable branch-current/up-to-date checks only if they do not create an impractical promotion deadlock. Never configure a human approval count above zero.

## Actual status

The live refs show a current baseline on `development` and an older `main`. A temporary baseline-sync PR branch is being prepared from the full development history into `main`; this is needed so a default-branch clone contains plans, images, and source submodules. Branch protections and rulesets remain unverified. Do not claim they are active before checking GitHub settings. The earlier backup tag remains preserved.

After the baseline-sync PR:

1. Ensure `main` contains the full initial baseline and plan changes.
2. Record the exact GitHub check names from the passing main PR.
3. Protect `main` with PR plus checks and zero required approvals; retain PR protection on staging lanes still in use.
4. Verify that a write collaborator can merge a check-green main PR without a required approval and that direct pushes to permanent branches are rejected.
5. Record the ruleset IDs, checks, empty bypass list, and verification result here.

## Personal-account limitations

GitHub personal repositories use owner/collaborator permission levels. A write collaborator can merge PRs when repository rules permit it; repository-wide settings and collaborator invitations remain owner tasks. GitHub does not offer the organization-style “restrict who can push” branch restriction on a user-owned repository. Requiring PRs on the three exact lane branches is the intended direct-push block and does not prevent collaborator pushes to feature branches.

Public repositories can use branch protections/rulesets on GitHub Free. If a setting is absent or unavailable in this repository, record the exact UI/API limitation and available plan requirement. Do not create a temporary organization or change repository visibility as a workaround.

## Manual follow-up

- Await `fazin-ahamed`'s acceptance of the pending write invitation.
- After publication, enable and verify the rules above. Do not claim they are active before that verification.
