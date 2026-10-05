# First Vercel demo

Use a **Preview** deployment from `development` so co-developers can review the first demo without moving the production branch.

## Connect the repository

1. Import `jeremy341/loadout` into Vercel through **New Project** and connect its GitHub repository.
2. Set the project Root Directory to `apps/landing`. Keep the Bun workspace lockfile at the repository root available for package-manager detection; do not replace the root install command with a nested npm install.
3. Leave `main` as the Production Branch. Commits on `development` should create Preview deployments.
4. No environment variables are needed to render the current homepage. Leave indexing configuration unset for a demo; preview metadata remains noindex.
5. Keep the preview URL and deployment access suitable for the two maintainers. Vercel may apply project/team access protection, so confirm that the collaborator can open the URL before sharing it more widely.

Vercel documents automatic preview deployments for pushes to non-production branches and production deployments for the configured Production Branch. Its monorepo settings support a project Root Directory and detect package managers from the repository-root lockfile. See [Git repository deployments](https://vercel.com/docs/git) and [monorepos](https://vercel.com/docs/monorepos).

## Verify and share

After pushing `development`, verify all of the following in Vercel:

- a deployment exists for the expected `development` commit;
- the build completed successfully and the deployment is Ready;
- the deployed root shows the LOADOUT homepage and its confirmed RSVP link;
- the share URL loads for the co-developer's account or browser;
- preview metadata remains noindex and no custom production domain was assigned.

Record the deployment URL and commit in `docs/development/WORKFLOW.md` after verification. Local build output and a successful Git push alone do not prove a Vercel deployment.
