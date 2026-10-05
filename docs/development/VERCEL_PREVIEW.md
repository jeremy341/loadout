# Vercel deployment

The owner requested that the first co-developer demo be deployed to **Production**. Future code review deployments can use Preview.

## Connect the repository

1. Vercel project `jerry-team1/landing` has been created for the repository.
2. Set the project Root Directory to `apps/landing`. Keep the Bun workspace lockfile at the repository root available for package-manager detection; do not replace the root install command with a nested npm install.
3. The app root is `apps/landing`; Vercel identifies it as Next.js. Its Git repository connection and `productionBranch` are currently unset, so Git pushes do not auto-deploy yet.
4. No environment variables are needed to render the current homepage. Leave indexing configuration unset for a demo; preview metadata remains noindex.
5. The first public production deploy uses `bunx vercel deploy --cwd apps/landing --prod`. Run it from a clean checkout of the reviewed commit. `.vercelignore` excludes local dependencies, build output, test output and environment files from CLI uploads.
6. For future Git-based deployments, connect `jeremy341/loadout` in Vercel and set `main` as the Production Branch. Then `development` pushes can create Preview deployments and only `main` deploys to Production.

Vercel documents automatic preview deployments for pushes to non-production branches and production deployments for the configured Production Branch. Its monorepo settings support a project Root Directory and detect package managers from the repository-root lockfile. See [Git repository deployments](https://vercel.com/docs/git) and [monorepos](https://vercel.com/docs/monorepos).

## Verify and share

After deploying, verify all of the following in Vercel:

- the deployment target is Production and it contains the expected published commit;
- the build completed successfully and the deployment is Ready;
- the deployed root shows the LOADOUT homepage and its confirmed RSVP link;
- the share URL loads for the co-developer's account or browser;
- metadata remains noindex and the production URL is the generated Vercel domain.

Record the deployment URL and commit in `docs/development/WORKFLOW.md` after verification. Local build output and a successful Git push alone do not prove a Vercel deployment.
