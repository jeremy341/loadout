# Participant platform: infrastructure options

**Status:** Planning only. Nothing here is approved or built. It answers gate G2 (data store and auth) and the hosting questions behind G1 and G5. The product scope stays in [future-platform-ui.md](future-platform-ui.md) and the sequence stays in [participant-platform-milestones.md](participant-platform-milestones.md).

**Owner decisions, 30 Oct 2026:**
- Sign-in uses **Hackatime OAuth** (M2 integration). Hack Club Auth remains the identity provider for accounts (see below).
- **Email is wanted.** Provider and content still to be decided under G5.
- The participant platform will **not** be hosted on Vercel. It will later be hosted on **Orchard** (Hack Club's Kubernetes platform). Vercel stays only for the current public landing until the owner says otherwise.

**Branch:** `feature/participant-platform-scope`. Not pushed by this file.

## Starting point

- The live app is the public homepage and program-draft Docs in `apps/landing` (Next.js 16, App Router). It has no database, no accounts and no outbound services.
- `main` deploys to Vercel Production (see [deployment-and-rollback.md](../../docs/development/deployment-and-rollback.md)). The docs say there are no database migrations yet.
- No LOADOUT infrastructure decision is recorded in plans or docs. Everything below is a proposal.

## What the four references run on

Each reference is pinned in `references/` (see [reference-pins.tsv](../../docs/source-audit/reference-pins.tsv)). Reading them for infrastructure only; no code is copied here.

| Concern | Pixl (`pixl/`) | Stardance (`stardance/`) | Stasis (`stasis/`) | YSWS Template (`ysws-template/`) |
|---|---|---|---|---|
| Framework | Bun + Turborepo; Express + `ws` game server; Next.js 16 dashboard and landing | Rails 8 | Next.js 16 (App Router) | NestJS backend; SvelteKit frontend |
| Database | Supabase Postgres, **shared by every app** through Drizzle and one service key | Postgres with pgvector (`vector` extension) | Postgres through Prisma 7 with `@prisma/adapter-pg` | Postgres through TypeORM, `migrationsRun: true` at boot |
| Auth | Hack Club Auth + Slack OAuth; own JWT in an httpOnly cookie | Hack Club Auth (OmniAuth OAuth2); Lockbox-encrypted fields | Better Auth with HCA as a generic OAuth provider | HCA via a NestJS guard; own JWT |
| Background work | Not clear from the README | Solid Queue, Solid Cache and Solid Cable in Postgres; Redis only for Cable in production | Not seen in the files read | Not read |
| Files | Not read | Active Storage on Cloudflare R2 (S3 API) | Presigned S3 uploads to Cloudflare R2 | Not read |
| Email / Slack | Slack OAuth; `pixo-dm` Express service on Railway for DMs | Slack in its manifest | Loops for transactional email; `@slack/web-api` for DMs and avatars | Slack OAuth and service |
| Admin tooling | Next.js dashboard behind HCA plus a Slack-ID allowlist | Blazer (raw SQL), Flipper (flags, in Postgres), Mission Control Jobs, PaperTrail audit | Admin pages behind a role table and `AuditLog` | Admin module and fraud review |
| Deploy | Orchard (Kubernetes) per its DEVELOPER.md; some leftover `vercel.json` | Kamal with Docker; `dev.Dockerfile` | Dockerfile publishes to GHCR; container runs `prisma migrate deploy` on start; `promote-to-prod.sh` rebases `prod` onto `main` | Either Vercel (two projects) or Docker images |
| Observability | Not read | AppSignal and Skylight | Sentry | Not read |
| Privacy | Not read | `/api/privacy/*` for the Hack Club privacy hub: ES256 JWT, replay table, anonymised user row, `dry_run` first | Not read | Not read |
| Licence | MIT, except `apps/pixorpheus` (AGPL) | No LICENSE file | No LICENSE file | No licence; backend `UNLICENSED` |

### What each reference teaches for LOADOUT

- **Pixl:** shared-database access is a warning, not a model. Every app holds the same service key, so one leak exposes everything. LOADOUT needs separate database roles per service.
- **Stardance:** the privacy erasure design is the most careful in the set. Keep the user row as an anonymous placeholder because ledger rows must point at it. Keep a replay table for signed privacy requests, and run dry runs first. Postgres-backed jobs avoid a second queue service.
- **Stasis:** closest in stack to LOADOUT's Next.js landing app. Its Prisma, Better Auth with HCA, R2 uploads, Sentry and Docker setup are all reusable patterns. Two warnings: running migrations on container start, and a long list of integration API keys in one env file.
- **YSWS Template:** the Hack Club platform template. Useful as an operations checklist. Its `synchronize` is off and migrations are the only schema path, which is the right rule. Its own docs say HCA needs a Hack Club client, so that dependency is real.

## Recommendation (for owner approval)

Start small: one Postgres database, one web app, Postgres-backed jobs, and Hack Club Auth. Add services only when a milestone needs them.

| Area | Recommended | Why | Alternatives |
|---|---|---|---|
| Web app host | **Orchard** (owner decision). Deploy a pre-built container image from GHCR, as the YSWS Template's SETUP.md describes for Orchard | Owner decision; Pixl also runs on Orchard. Lanes still need a preview path, to be confirmed on Orchard | Vercel (rejected by owner for the platform) |
| Database | **One managed Postgres** with separate `dev`, `testing` and `prod` databases. Host to confirm (see open questions) | Matches all four references and the ledger's need for transactions | Supabase (Pixl's choice, but avoid its shared-key pattern); Vercel Postgres (rejected with Vercel) |
| ORM and migrations | **Prisma** (as in Stasis), migrations run as a separate deploy step | Next.js-native; migrations are reviewed files, not boot side effects | Drizzle (Pixl); TypeORM (template) |
| Auth | **Hack Club Auth via OIDC** for account identity, plus **Hackatime OAuth** for coding-time linking (M2). Server-side sessions in an httpOnly cookie; roles in a database table | Teen verification is HCA's job (gate G1); Hackatime is the owner's chosen OAuth source; the cookie avoids token-in-URL handoffs that Pixl had to fix | Own accounts (rejected: no password storage for minors) |
| Jobs | **Postgres job table** with a small worker process and leases; a Kubernetes CronJob on Orchard if Orchard supports one (to confirm) | No Redis or second service; idempotent ledger writes need the database anyway | Redis or a hosted queue if volume grows (Stardance uses Redis only for live updates) |
| Files | **Cloudflare R2** via the S3 API; private buckets; presigned upload and read; strip metadata on images | Used by Stasis and Stardance; no egress fees | Vercel Blob |
| Feature flags | **A flags table**, read through a short cache | Owner approved this in principle; Stardance's Flipper shows the shape | Hosted flag service (adds a third party for minors' data) |
| Audit log | **Append-only `audit_events` table** written in the same transaction as the change | Required by milestone M1; PaperTrail and Stasis's `AuditLog` both prove the pattern | None |
| Slack notifications | **LOADOUT's own Slack app**, called from the job worker, with per-user and global rate limits | Decided separately from Orry; in-process avoids a second deploy like `pixo-dm` on Railway | A separate `pixo-dm`-style service if the sender must be isolated |
| Email | **Transactional email only** (owner wants email). Account and ship notices; no marketing. Provider chosen under G5; Loops is Stasis's choice | Owner wants it; limiting it to transactional mail keeps the minors' data flow small | Self-hosted SMTP on Orchard; Slack-only |
| Observability | **Sentry** with PII scrubbing; no session replay | Stasis's setup; replay captures minors' input | Logs only |
| Secrets | Host environment variables per lane; a `.env.example` listing names only | Nothing in Git; matches the repo's rule | Vault (not needed at this size) |

## Least privilege

- Three database roles: `loadout_app` (DML only, no DDL), `loadout_migrate` (DDL, used only by the deploy step), and `loadout_readonly` (for reports, with column grants that hide personal fields).
- No shared service key across apps. Each future service gets its own role.
- Admin reads of participant data are logged to `audit_events`. There is no raw SQL console for participants' data (Blazer is dropped, per the milestones file).
- Ledger rows are never updated or deleted. Corrections are reversing entries with a required reason.

## Privacy and minors

- Store the least needed. Each table gets a written retention rule before M1 ships. This is a gate (G5), not a later task.
- Deletion and export: adopt Stardance's pattern. A signed request from the Hack Club privacy hub, dry run first, the user row kept as an anonymous placeholder so ledger rows still resolve, and a replay record for each token. Build this in M0 or M2 at the latest, not after launch.
- Personal data stays out of logs, Sentry events, URLs and Slack messages (Slack gets a link, not the content).
- Backups and restores inherit the same retention rules. Ask the host what its backup retention is before storing anything real.

## Environments and migrations

- Lanes already map to hosts on Vercel today. On Orchard they need to be set up again: `development`, `testing`, `main`, plus temporary branches (see [WORKFLOW.md](../../docs/development/WORKFLOW.md)). Each lane needs its own database. Preview deployments must not point at production data.
- Migrations: expand, then migrate data, then contract. Never run destructive migrations in the same release as the code that stops using the column.
- Do not run migrations on app boot (ysws-template's `migrationsRun` and Stasis's container start both do this). Run them as a reviewed deploy step with a logged result.
- Rollback: a targeted revert plus forward-only migrations. Keep rollback notes in [deployment-and-rollback.md](../../docs/development/deployment-and-rollback.md) before each migration lands.

## Cost and limits (to confirm with the host)

- Connection count and pooling for serverless (Vercel) functions. Use a pooled URL; keep transactions short.
- Storage and egress for R2 uploads (journals, screenshots, hardware photos). Set a per-user quota before launch.
- Job volume: Ore ledger writes and Slack messages per approved ship. Expect bursts at ship acceptance, not steady load.

## Gates this plan answers

| Gate | Answered by | Still needed from the owner |
|---|---|---|
| G1 teen verification | Hack Club Auth as the only sign-in; no own accounts | Confirm HCA provides teen verification and grant a LOADOUT client |
| G2 data store and auth | Postgres + Prisma + HCA OIDC + Hackatime OAuth, roles in DB | Choose the Postgres host on Orchard (open question 1) |
| G5 per-service privacy | Erasure and retention pattern above; email limited to transactional notices | Written retention periods; email provider and content |

## Open decisions for the owner

Answered 30 Oct 2026: Hackatime uses OAuth; email is wanted; the platform is hosted on Orchard later, not Vercel.

1. **Postgres host on Orchard:** does Orchard provide managed Postgres, or does LOADOUT use an external database (Supabase, Neon) reached over the network? The Orchard docs are behind a protected page (`orchard.infra.hackclub.com`), and I could not read them from here, so this needs the owner or Orchard's maintainers.
2. **Orchard deploy path:** confirm the lanes (`development`, `testing`, `main`) can each get their own Orchard deployment and preview, and whether Orchard can run scheduled jobs (or whether the job worker needs its own deployment).
3. **Hack Club Auth:** is a LOADOUT client available, and does HCA's teen verification cover minors who join?
4. **Hackatime (M2):** which scopes and consent text does LOADOUT request? Confirm the OAuth client is available for LOADOUT.
5. **Email provider and content:** Loops (Stasis's choice) or another provider, and which notices are in scope for minors.
6. **Landing page:** does the public landing stay on Vercel while the platform moves to Orchard, or does it move too?
7. **R2:** may LOADOUT use a Hack Club R2 account, or its own?
8. **Slack:** who owns the LOADOUT Slack app, and in which workspace?

## Reuse and licence notes

- Owner-stated reuse permission covers all four references (evidence pending; [DECISIONS.md](../../docs/source-audit/DECISIONS.md)). Stasis and Stardance have no LICENSE file, and the YSWS Template is `UNLICENSED` in its backend. Re-implement the patterns above rather than copy files until the written grants are attached.
- Pixl's `apps/pixorpheus` stays out of scope (AGPL-3.0).

## Next steps (after owner answers)

1. Answer open decisions 1–7.
2. Confirm Orchard's Postgres, CronJob and preview support before writing any deploy config.
3. Record the chosen stack in a canonical plan or the design spec, not here.
4. M0: write the data contracts and the least-privilege role plan, with no pages.
