# Vercel deployment

## Current project configuration — verified 2026-10-06

- Project: jerry-team1/loadout-ysws, under Jerry Team Hobby.
- Git repository: jeremy341/loadout.
- Application root: apps/landing.
- Framework preset: Next.js.
- Production Branch: main.
- Only assigned Production domain: https://loadout-ysws.vercel.app/
- The previous Production alias landing-mu-taupe.vercel.app was removed from this project on 2026-10-06.
- No project environment variables are configured; none are needed for the current homepage.
- The production homepage loaded at the stable URL during verification from the connected browser.

The project already had the correct Git connection, root directory, Production Branch, and stable domain. It was kept in place. Deleting a Vercel project removes its deployments, domains, environment variables, functions, and settings.

## Production and Preview URLs

Use https://loadout-ysws.vercel.app/ as the stable Production address.

Vercel creates a unique generated URL for each Preview deployment. For example, PR #8 received https://loadout-ysws-abqz4yzoh-jerry-team1.vercel.app/. That long preview address is a per-deployment URL; it does not replace the stable Production domain. The current Hobby project dashboard marks custom Preview deployment suffixes as a Pro feature.

Vercel's Git integration deploys pushes to non-production branches as Preview deployments and uses the configured Production Branch for Production. See [Git deployments](https://vercel.com/docs/git), [project management and deletion](https://vercel.com/docs/projects/managing-projects), and [working with domains](https://vercel.com/docs/domains/working-with-domains).

## Verify and share

For a new deployment, verify:

- Vercel reports the intended branch and commit;
- the build completed and the deployment is Ready;
- Production uses the stable loadout-ysws.vercel.app domain;
- a PR Preview has its own generated deployment URL;
- the deployed homepage has the expected RSVP link and metadata.

A local build or successful push alone does not prove deployment.

## First production demo history — 2026-10-05

The initial co-developer demo used project jerry-team1/loadout with root directory apps/landing and public URL loadout-jerry-team1.vercel.app. Vercel later renamed the project to loadout-ysws and the stable Production URL became loadout-ysws.vercel.app. This section is historical context.
