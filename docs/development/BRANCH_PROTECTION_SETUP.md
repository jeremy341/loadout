# Branch protection and repository access

Repository: `jeremy341/loadout`, personal account. The desired repository visibility and owner/collaborator workflow are documented here; verify live settings before treating this page as current.

## Collaborator

`fazin-ahamed` was invited with write permission. The collaborator must accept that invitation before their access is active. Do not guess or invite any other username.

## Desired rules for all permanent lanes

Create active rulesets or branch protection rules targeting exactly `development`, `testing`, and `main`. Require a pull request before merging, require zero human approvals, and do not configure bypass actors. Do not require CODEOWNER, owner, Jeremy, team, or last-push approval. Apply PR requirements to administrators as well. A required PR rule blocks direct updates to the named lane; write collaborators can still push short-lived branches.

Use GitHub Actions as the expected check source. Current check candidates are **Repository integrity**, **Landing quality**, and **Landing browser**. Integrity validates whitespace and source pins; quality runs lint, typecheck, unit tests, and a production build; browser covers navigation, responsive behavior, normal/reduced motion, and accessibility. Select the exact GitHub-reported check names only after successful runs on each lane. The workflow definitions are local; this does not establish that lane protections are active.

For `main`, also disable force pushes and branch deletion. Enable branch-current/up-to-date checks only if they do not create an impractical promotion deadlock. Never configure a human approval count above zero.

## Actual status

No GitHub changes were made during this reorganization. The last successful repository inspection reported only the initializer on remote `main`, with no remote `development` or `testing` branches and no active branch protections/rulesets. The configured network proxy blocked a refresh during this task, so verify the live remote before publishing. The clean logical history from initializer `1a3119aecf18175e8b881613ad6912ca03c93a0d` is locally present on `chore/reference-layout` and has been promoted through `development`, `testing`, and `main`. The previous local lane history is preserved by `backup/local-lanes-before-clean-layout`; nothing has been pushed.

After the first approved publication:

1. Publish the logically grouped commits and create `development` and `testing` at the approved baseline.
2. Run CI for each lane and record the exact check names GitHub reports.
3. Create rules for `development`, `testing`, and `main` using only checks reported for each target.
4. Verify that a write collaborator can open and merge a check-green PR without a required approval and that direct lane updates are rejected.
5. Record the ruleset IDs, checks, empty bypass list, and verification result here.

## Personal-account limitations

GitHub personal repositories use owner/collaborator permission levels. A write collaborator can merge PRs when repository rules permit it; repository-wide settings and collaborator invitations remain owner tasks. GitHub does not offer the organization-style “restrict who can push” branch restriction on a user-owned repository. Requiring PRs on the three exact lane branches is the intended direct-push block and does not prevent collaborator pushes to feature branches.

Public repositories can use branch protections/rulesets on GitHub Free. If a setting is absent or unavailable in this repository, record the exact UI/API limitation and available plan requirement. Do not create a temporary organization or change repository visibility as a workaround.

## Manual follow-up

- Await `fazin-ahamed`'s acceptance of the pending write invitation.
- After publication, enable and verify the rules above. Do not claim they are active before that verification.
