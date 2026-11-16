# Reviewer site: a 1:1 port of Pixl's internal dashboard

**Status:** owner direction 16 Nov 2026. "Copy the Pixl dash 1 to 1, from UI to features, then remove and adjust. Copy the code 1 to 1 so we get good formatting." This replaces the hand-built reviewer UI (the LOADOUT-styled build, then the egg-styled build). The earlier `reviewer-desk-parity.md` and `reviewer-egg-restyle.md` describe features and history; where they conflict with this file, this file wins for look, layout and page structure.

**Source:** `references/pixl/apps/internal-dashboard` at `1468ba69` (read only). Pixl is MIT, copyright (c) 2026 Pixl. MIT does not cover third-party or purchased art, product photos, brand assets or fonts (Phantom Sans), nor `apps/pixorpheus` (AGPL). The owner states permission to reuse all four references (evidence pending, see `docs/source-audit/DECISIONS.md`). Keep Pixl's copyright notice in a `reviewer-dash/PIXL-LICENSE.md` (copy the root MIT text) and note the origin in `docs/source-audit/ATTRIBUTION.md` or its equivalent.

## What "1 to 1" means here

- **Copy files verbatim** (components, `_ui`, CSS, pages, pure lib modules, their tests) and change only what is needed to run inside LOADOUT. Do not rewrite or "improve" a copied file while copying. Formatting, class names, Tailwind utilities, markup and behaviour stay Pixl's.
- **Then adjust in a separate, listed pass** (see "Adjustment pass"). Every adjustment is a small, reviewable edit; keep a running list in `reviewer-dash/ADJUSTMENTS.md` (file, what, why).
- **Mechanical changes allowed during the copy**: import path aliases, the data layer, auth, server actions, fonts, secrets and network calls.

## Where things go (apps/landing)

- `reviewer-dash/` (new, outside `app/`): copies of Pixl's `lib/`, `components/`, `app/_components/`, `app/_ui/` and any other non-route support file. Imports are rewritten mechanically: `@/lib/` to `@/reviewer-dash/lib/`, `@/components/` to `@/reviewer-dash/components/`, `@/app/_components/` to `@/reviewer-dash/app/_components/`, `@/app/_ui/` to `@/reviewer-dash/app/_ui/`. Write the rewrite as a script kept at `reviewer-dash/scripts/copy-from-pixl.mjs` so it can be re-run when Pixl updates (it copies, rewrites, and never overwrites files listed in `reviewer-dash/ADJUSTED.txt`).
- Route files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`, colocated components like `ReviewSplit.tsx`) are copied into `app/(reviewer)/reviewer/<same path as Pixl's app/>`. The review host's proxy already rewrites `review.<host>/x` to `/reviewer/x`, so Pixl's absolute links (`/review/123`) keep working. Route segment config (`dynamic`, `revalidate`) stays inside the copied route file.
- Old hand-built reviewer pages and components (`app/_components/reviewer/**`, `app/_components/platform/review/**`, old route files) are removed ONLY once their Pixl replacement renders. A backup of the uncommitted state exists in the session scratchpad (`snapshot2`), so nothing is lost; still delete nothing that the participant platform imports.
- Pure rules the earlier build wrote (`lib/reviewer/**`, `lib/platform/review*.ts`) stay: they are the sample-data source and keep their tests.

## Data, auth and actions (the part that is not a copy)

Pixl's `lib/db.ts` (Postgres), `lib/guard.ts`, `lib/session.ts`, `lib/pgCompat.ts` and `app/actions.ts` talk to a real database, Slack and other services. LOADOUT has no review service yet. So:

1. **`reviewer-dash/lib/db.ts` is an adapter** exporting the same names and return types the copied pages and components import (copy the type definitions from Pixl's `lib/db.ts`, drop the SQL). It reads Pixl-shaped rows (snake_case, numeric ids, status strings, `repo_url`, `kind`, `first_pass_by`, `reviewing_by`, ...) built from LOADOUT's sample data in `reviewer-dash/lib/sample/` (mapping from `lib/platform/review.ts`, `review-fixtures.ts`, `review-fixtures-bulk.ts`, `lib/reviewer/*`). Sample data must keep the special ships (double dip, held, claimed, assigned, hardware, one-track fit-reason) and the bulk data that makes paging visible. Functions Pixl pages call but LOADOUT does not support return empty, honest results.
2. **`reviewer-dash/lib/guard.ts` and `session.ts` are adapters** over LOADOUT's `readViewer` and `requireAccess` (`lib/platform/session.ts`, `lib/reviewer/access.ts`): same `AdminAccess` shape Pixl's pages expect (`isOwner`, `canSecondPass`, `reviewQueues`, `session.slackId` becomes the viewer handle, ...). The 404-for-unknown rule stays.
3. **`reviewer-dash/app/actions.ts` is an adapter**: same exported action names and signatures the copied components call. Each runs Pixl's pure validation where it exists (macros, form rules, pagination), then does NOT write anywhere. It returns the same result shape (or redirects to the same place) and the UI shows one quiet line: "Sample data. Nothing was saved." Where Pixl's UI depends on the state changing (for example a verdict moving a ship out of the queue), keep an in-memory, per-process sample store (`reviewer-dash/lib/sample/store.ts`) that actions may mutate, reset on server restart; say so on the page. Never imply that anything is real.
4. **No network calls**: Slack, Airtable, Hackatime, GitHub, Fraudy, OpenRouter, email, Pixo and webhooks are all removed or replaced with fixtures. Keys and secrets are never read.
5. Pixl code that imports `postgres`, `sharp`, Supabase or server SDKs is replaced, not installed.

## Styling and fonts

- Pixl's look lives in `app/_ui/admin.css` (the `hc-*` classes) plus Tailwind utilities. Copy it to `reviewer-dash/app/_ui/admin.css`, load it only from the reviewer layout. Tailwind v4 is already in the landing app; give the reviewer its own entry stylesheet that does NOT load Preflight (`@import "tailwindcss/theme" layer(theme); @import "tailwindcss/utilities" layer(utilities);` with `@source` limited to `reviewer-dash/` and `app/(reviewer)/`) so the public site and the participant platform are not reset or restyled. Pixl's global rules for `html` and `body` are applied inside the reviewer root instead.
- **Fonts:** remove the Phantom Sans `@font-face` rules; the body stack becomes `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. JetBrains Mono (open licence) may stay via `next/font/google`.
- Keep Pixl's dark and light themes and its theme switch behaviour (map it to LOADOUT's `data-display-theme` so the choice follows the site's setting).
- **Dependencies** Pixl uses (`@hackclub/icons`, `@number-flow/react`, `motion`, `recharts`, `d3-array`, `d3-scale`, `d3-shape`, `clsx`, `tailwind-merge`) are added to `apps/landing` only if the copied code needs them. Check each package's licence after install (`@hackclub/icons` in particular) and report it. If a package cannot be used, replace with a small local component and list it in `ADJUSTMENTS.md`.
- Pixl's pixel-glyph and game-flavoured icons (`glyphs.ts`) are kept if they are plain icons; remove game art and any image asset (see exclusions).

## Exclusions (never copied)

Phantom Sans and other fonts; images, logos and art under `public/`; `apps/pixorpheus`; the game, pixels economy and cosmetics UI (`pixels`, `sidequests`, `story`, NPC and chat features); Airtable, Pixo, Robert, blackout and RE/Trial earning logic; anything that needs a secret.

## Adjustment pass (after the 1:1 copy renders)

Record each in `reviewer-dash/ADJUSTMENTS.md`.

1. **Words:** pixels to Ore; player to builder where Pixl says "player" in visible copy (keep route names); Slack to handle; Pixl and Hack Club product names to LOADOUT; "Pixl" removed from titles and metadata; `<title>` "Review - LOADOUT Review".
2. **One track per project:** the ship shows one track chip; the form shows the one-track line and the "Does not fit the track" reason with the `/track` macro (see `lib/platform/review.ts`: `CHANGE_REASONS`, `fillMacro`); no percent allocation anywhere.
3. **LOADOUT rules:** the four quality dimensions (Originality, Technical Depth, Execution, Documentation); Ore (10 per approved hour) and Track XP wording; age policy 13 to 18; Research Mode; hardware review uses Lapse; journals every 8 hours.
4. **Honesty:** the Local/Stub sentences from `reviewer-desk-parity.md` where a control is a stub; one "Sample data" notice per page (small, not loud).
5. **Remove:** game, pixels economy, cosmetics, blackout, Airtable, Pixo, Robert-specific panels (keep a generic AI-usage panel as a stub), Slack-specific controls.
6. **Add** what LOADOUT needs that Pixl lacks (only after the copy is stable): queue health line, assignment and claim tags already in Pixl stay, perks page, erasure, age exceptions (Pixl has these in some form: prefer Pixl's version).
7. **Nav:** the same tabs as Pixl's TopNav (`app/_ui/nav.ts`), with counts from the sample data.

## Phases

- **S0 (one worker):** scaffolding: copy script, `reviewer-dash/` tree, alias rewrite, reviewer stylesheet (Tailwind without Preflight), layout and TopNav shell, adapters (db, guard, session, actions) skeleton, sample-data mapping core, the review area (tabs queue, reviewed, spot-check, proposed bans, log, audit, stats, guidelines, review/[id], hardware). Result must render and be screenshotted.
- **P1 to P4 (parallel workers, after S0):** the remaining page groups: People (players, projects, reviewers, admins, fulfillers), Moderation (bans, reports, violations, notify), Content (shop, shop-detail, ideas, events, forms, show-n-tell, community-goals, referrals), Operations and Fulfilment (operations, budget, fulfillment, tickets, settings, stats, removed, login).
- **A (adjustment pass)**, then **V (visual review by the lead, light and dark, 1440 and 390)**.

## Acceptance

`bun run typecheck`, `bun run lint`, `bun run test` green. Copied pages and components differ from Pixl's only by listed mechanical changes (a `diff` report is produced by the copy script). The reviewer site renders with Pixl's look on every route; the public site and participant platform are visually unchanged. No network calls, no secrets, no brand fonts or art. Every control is real in the page or honestly a stub.
