# Architecture audit

## Reference path convention

All three sources are pinned as independent Git submodules under `references/`. Paths in the audit tables are relative to the named source repository; prefix them with `references/pixl/`, `references/ysws-template/`, or `references/stardance/` to open the exact local file.

## Source stacks

| Source | Runtime and frontend | Data and background work | Deployment and coupling |
|---|---|---|---|
| Pixl | Bun 1.3.13 workspaces, Turborepo, Next.js 16.3.5 / React 19 landing and dashboard, TypeScript/Express server, additional app packages. See `references/pixl/package.json`, `references/pixl/apps/landing/package.json`, `references/pixl/apps/dashboard/package.json`, `references/pixl/apps/server/package.json`, and `references/pixl/turbo.json`. | The inspected server/dashboard code connects to Orchard PostgreSQL through postgres.js adapters at `references/pixl/apps/server/src/db/pgCompat.ts` and `references/pixl/apps/dashboard/lib/pgCompat.ts`. `references/pixl/apps/server/src/db/client.ts` retains the name supabase as a compatibility alias; it is not evidence of a live Supabase client. Drizzle SQL migrations also exist under `references/pixl/apps/server/drizzle` and are applied by `references/pixl/apps/server/src/scripts/apply-migrations.ts`. The old Supabase import path is `references/pixl/apps/server/src/scripts/import-from-supabase.ts`. | Orchard/Kubernetes, Pixl hosts and service DNS, Vercel proxies, game assets, and Pixl config are present in the source tree. These endpoints must not run for LOADOUT. |
| YSWS Template | NestJS backend, SvelteKit frontend, TypeScript. See `references/ysws-template/backend/package.json`, `references/ysws-template/frontend/package.json`, and `references/ysws-template/SETUP.md`. | TypeORM/PostgreSQL entities and migrations; integrations include HCA, Hackatime, HCB, Slack, and attendance. | JSON program configuration and dual frontend/backend deployment; no reuse basis was established. |
| Stardance | Rails 8.1.3, Ruby, Yarn 4, esbuild. | PostgreSQL/Active Record migrations, Pundit authorization, PaperTrail history, SolidQueue jobs. Review-specific models and tests are recorded in `FEATURE_MATRIX.md` and `DECISIONS.md`. | Rails/Kamal/Coolify deployment and Stardance-specific services. It is a review-mechanics reference only; no Rails migration or code reuse. |

## LOADOUT starting shape

The LOADOUT product root intentionally has no `apps/`, `packages/`, or deployable application code while the website redesign and implementation architecture are being planned. Pixl remains the PRIMARY ENGINEERING BASE for later source-guided implementation, but its app tree is available only through the pinned `references/pixl/` submodule. The earlier landing prototype and restored Pixl landing surface are not part of this branch. Do not recreate either page until the separate redesign is ready.

## Data, identity, and permission boundaries

Pixl's server retains compatibility code shaped like supabase-js while its current adapter talks directly to Postgres. The source also has a Drizzle migration layer and an old Supabase import script; these are distinct historical paths, not one settled contract. Authentication and application administrator roles are separate from GitHub repository roles. Any future user-facing access must be least-privilege and LOADOUT-specific.

Hackatime is a time-evidence source, not proof that work is eligible or attributable. LOADOUT needs project- and journal-level allocation policy before importing tracker data. The YSWS Template's integrations are patterns to research, not permission to copy its implementation or request broad scopes.

## Review and payout flow (implementation-neutral)

The specialist reference suggests separating eligible reviewer assignment; submitted rubric plus written reason; countable-review qualification; deterministic aggregation; a provisional score/payout preview; a versioned immutable award snapshot; an appeal/flag window; authorized resolution; and an idempotent ledger issue. Persist reviewer/event identifiers, policy versions, state transitions, and admin actions. Do not silently recompute an already locked award.

The eventual LOADOUT rubric remains Originality, Technical Depth, Execution, and Documentation. LOADOUT must define its own reviewer count, rubric aggregation, missing-review fallback, outlier/collusion policy, multiplier, lock timing, appeals, and admin powers. Stardance's 12 votes, four other dimensions, median, percentile, exponent, and currency are not adopted as LOADOUT policy.

## Storage, jobs, migrations, and server/client boundary

Pixl image uploads are proxied server-side to the Hack Club CDN using `HACKCLUB_CDN_KEY`, with static-image validation and quota handling. See `references/pixl/apps/server/src/routes/uploads.ts`, `references/pixl/apps/server/src/imageValidation.ts`, and `references/pixl/apps/server/src/routes/cdnQuota.ts`. This is a Pixl integration and must not be enabled for LOADOUT until the owner, retention, and authorization model are decided.

The inspected Pixl server package does not declare a separate queue framework; it combines the Express process, app scripts, delayed/in-process work, and platform cron endpoints. The dashboard also has an API cron route at `references/pixl/apps/dashboard/app/api/cron/queue-health/route.ts`. Do not assume these are portable background-job guarantees. YSWS Template uses Nest scheduling modules; Stardance uses SolidQueue.

Pixl migration systems include the Drizzle SQL journal under `references/pixl/apps/server/drizzle`, its custom apply script, and the old Supabase import script. The YSWS Template uses TypeORM migrations under `references/ysws-template/backend/src/migrations`. Stardance uses Active Record migrations under `references/stardance/db/migrate`. LOADOUT should create a single owned migration path when the database slice begins.

## Environment surface and risks

The reference applications contain example environment files, not LOADOUT credentials. LOADOUT currently has no app-specific environment surface. Before deployment, enumerate the owned environment variables and issue LOADOUT-specific secrets. Pixl's RSVP route and the prior Vercel/Next config proxied to Pixl; neither is part of the LOADOUT product tree. No literal live secret was identified in the inspected landing configuration.

Other source-coupled risks include Pixl OAuth callback URLs, Supabase project IDs, media buckets, Slack channels, email templates, hostname constants, and old shop/project content. They remain deferred pending migration-specific review. A secret scan and reference-presence scan are required before publication.

## Testing and CI

LOADOUT has no application tests or build yet. The current CI baseline checks repository whitespace and verifies the three submodule URLs and pinned commit IDs without checking out their source trees. Pixl's Bun tests, the YSWS Template's Jest/Nest tests, and Stardance's Rails/Minitest suite remain attached to their upstream submodules and are not run as LOADOUT tests.