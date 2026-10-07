# Local contributor setup

[WORKFLOW.md](WORKFLOW.md) contains the complete non-recursive clone and branch procedure. All three reference parents and tracked design images come from that checkout; do not manually duplicate them into application code.

## Application

Use Bun1.3.14 from the repository root:

```powershell
bun install --frozen-lockfile
bun run dev
```

The local site defaults to http://localhost:3000. Docs are at /docs/start. Stop with Ctrl+C. If that port is busy, use `bun run --cwd apps/landing dev --port 3002`.

Lint, typecheck, unit, build and browser commands are listed in WORKFLOW.md. Browser tests normally start their own server on3001; LOADOUT_TEST_PORT overrides the port and LOADOUT_TEST_BASE_URL overrides its address. CI uses a production build.

## Environment names

Optional public configuration is documented in `apps/landing/.env.example`; local private files are ignored.

| Name | Purpose |
| --- | --- |
| NEXT_PUBLIC_LOADOUT_SITE_URL | Valid HTTPS origin for metadata/indexing configuration. |
| NEXT_PUBLIC_LOADOUT_JOIN_URL | RSVP destination; defaults to the public interest form. |
| NEXT_PUBLIC_LOADOUT_LOGIN_URL | Optional confirmed login destination; leave unset while unavailable. |
| NEXT_PUBLIC_LOADOUT_COMMUNITY_URL | Optional confirmed community destination. |
| NEXT_PUBLIC_LOADOUT_IRL_CONCEPT | Show the labeled future concept on the homepage. |
| LOADOUT_ALLOW_INDEXING | Indexing only when true with a valid origin; Vercel previews remain excluded. |

These are existing homepage settings, not new Docs credentials. Markdown and search need no secret or external search service.

## Windows notes

A sandbox may report stale gh credentials or block Bun filesystem access. Verify the host-backed environment rather than repeating login; see WORKFLOW.md. Do not print credentials. Install failures are environment evidence, not proof of a code defect.

Generated next-env.d.ts may point to dev/build type output after running Next. Keep unintended generated-only changes out of commits.
