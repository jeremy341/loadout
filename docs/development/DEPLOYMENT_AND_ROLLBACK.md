# Deployment and rollback

[WORKFLOW.md](WORKFLOW.md) owns the branch pipeline. [VERCEL_PREVIEW.md](VERCEL_PREVIEW.md) records the project configuration and historical URLs.

## Release

Use temporary branch → development → testing → main with existing required checks. Do not bypass checks, alter protections or use a direct production deployment to skip the lanes.

Vercel project jerry-team1/loadout-ysws uses apps/landing and main. Wait for Ready/success on the merged main commit, then inspect the stable Production URL. Check Docs topics, deep links, search and homepage navigation; a passing local build is not deployment evidence.

Record the main SHA, Vercel deployment link and smoke-check result before posting the Docs release summary. Preview URLs remain per-deployment; they do not replace loadout-ysws.vercel.app.

## Roll back application content

Prepare a targeted revert on a temporary branch from current development. Inspect the diff to preserve unrelated later work, run the relevant checks, and use the same development/testing/main promotion route.

A content rollback may also need a corrected release-feed post and Netics source refresh. Do not delete the Vercel project, rewrite shared Git history, remove secrets or change domains as a rollback shortcut.

There are no database migrations in this Docs change. Retain URL redirects and old heading aliases when possible so published links continue to work.
