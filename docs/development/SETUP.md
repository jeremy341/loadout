# Local contributor setup

[WORKFLOW.md](WORKFLOW.md) contains the complete non-recursive clone and branch procedure. All four reference repositories and tracked design images come from that checkout; do not manually duplicate them into application code.

## Application

Use Bun 1.3.14 from the repository root:

```powershell
bun install --frozen-lockfile
bun run dev
```

The local site defaults to http://localhost:3000. Docs are at /docs/start. Stop with Ctrl+C. If that port is busy, use `bun run --cwd apps/landing dev --port 3002`.

Lint, typecheck, unit, build and browser commands are listed in WORKFLOW.md. Browser tests normally start their own server on 3001; LOADOUT_TEST_PORT overrides the port and LOADOUT_TEST_BASE_URL overrides its address. CI uses a production build and two workers per shard.

A local unsharded run defaults to two workers and `next dev`. `LOADOUT_E2E_WORKERS` overrides the worker count, but several specs mutate one shared seeded account, so higher counts need those specs isolated first. `LOADOUT_TEST_PROD=true` builds once and serves that build instead (`bun run build && bun run start`): the start is slower, but a long run avoids compiling every route on first use. `LOADOUT_E2E_MATCH` limits the run to named specs, and `LOADOUT_TEST_REUSE_SERVER=true` reuses an already-running server on the same port.

## Environment names

Optional public configuration is documented in `apps/landing/.env.example`; local private files are ignored.

| Name | Purpose |
| --- | --- |
| NEXT_PUBLIC_LOADOUT_SITE_URL | Valid HTTPS origin for metadata/indexing configuration. |
| NEXT_PUBLIC_LOADOUT_JOIN_URL | RSVP destination; defaults to the public interest form. |
| NEXT_PUBLIC_LOADOUT_LOGIN_URL | Optional confirmed login destination; leave unset while unavailable. |
| NEXT_PUBLIC_LOADOUT_COMMUNITY_URL | Optional confirmed community destination. |
| LOADOUT_ALLOW_INDEXING | Indexing only when true with a valid origin; Vercel previews remain excluded. |
| LOADOUT_PLATFORM_PASSWORD | Optional shared admin password required before Hack Club Auth. When set, the sign-in page asks for it and `/api/auth/hackclub/start` checks a 7-day HMAC unlock cookie; unset disables the gate. |

The homepage and public Docs settings are existing, not new Docs credentials. Markdown and search need no secret or external search service.

### Optional platform password gate

`LOADOUT_PLATFORM_PASSWORD` is optional and off when unset or blank. When set, `POST /api/auth/platform-gate` accepts the shared password (same-origin, rate limited per IP) and sets a 7-day unlock cookie. After that the person still signs in with Hack Club Auth as usual. The gate covers only the platform sign-in; the public homepage and Docs stay open with or without it. Keep the value in the ignored local env file or the host's environment settings, never in Git, logs or chat. Working note (20 Nov 2026): the gate is a pre-launch access control, not a confirmed live-service claim.

## Windows notes

A sandbox may report stale gh credentials or block Bun filesystem access. Verify the host-backed environment rather than repeating login; see WORKFLOW.md. Do not print credentials. Install failures are environment evidence, not proof of a code defect.

Generated next-env.d.ts may point to dev/build type output after running Next. Keep unintended generated-only changes out of commits.
