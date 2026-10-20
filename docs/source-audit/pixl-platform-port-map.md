# Pixl platform port map

Recorded 2026-10-20 for the first participant-platform shell port (`apps/platform`, merged to `development` in PR #134), and updated the same day when every tab became a working preview feature on sample data. This is the source map required by Phase 0 of the [implementation plan](../superpowers/plans/2026-10-19-pixl-shell-platform.md). It maps Pixl paths to LOADOUT targets and records a decision for each. It is source evidence, not product policy. Policy stays in the numbered plans.

Pixl is read at `8141b992e92e05583246fd914c63a101100f6fe4` (the pin in [source-bases.md](source-bases.md)), local root `references/pixl/`. Paths below are relative to that root unless they start with `apps/platform` or `docs`. Read at the pinned submodule `references/pixl/`; initialise it with `git submodule update --init references/pixl`.

Confirmed owner decisions behind this map are in [DECISIONS.md](DECISIONS.md) (2026-10-20 entries). Rules the plans leave open, and the draft value the preview uses for each, are in [platform-preview-open-questions.md](platform-preview-open-questions.md). The UI scope is in [`.ulpi/design/participant-platform-shell.md`](../../.ulpi/design/participant-platform-shell.md). Licence and notices are in [ATTRIBUTION.md](ATTRIBUTION.md).

## Decision terms

- **Copied verbatim:** file or block taken unchanged. Not used in this change.
- **Copied + adapted:** Pixl's code or structure is the starting point and is changed for LOADOUT. The MIT notice applies and the file is logged in ATTRIBUTION.md.
- **Reimplemented:** LOADOUT writes its own version of the idea; no Pixl text is kept.
- **Reference only:** read for patterns; nothing is copied.
- **Excluded:** not used, with the reason.

"This change" means the row is implemented in the platform change under `apps/platform/**`. Targets are the paths in that change; check the PR diff for the exact file names before relying on a path.

## Licence boundary

Pixl's root licence is MIT, "Copyright (c) 2026 Pixl" (`LICENSE`; `apps/server/LICENSE` carries the same text). Exceptions:

- `apps/pixorpheus` is AGPL-3.0 (`apps/pixorpheus/LICENSE`). Excluded.
- Third-party or purchased art, product photos, brand assets and fonts (Phantom Sans and similar) are not covered by MIT. They stay excluded unless the owner confirms that the permission covers them. See open questions.

The owner states that permission has been obtained from all the reference owners. That statement is recorded in DECISIONS.md and ATTRIBUTION.md. Written evidence is pending.

## Web shell: `apps/web-shell`

| Pixl path | Decision | LOADOUT target | Notes and game coupling |
|---|---|---|---|
| `app/(shell)/nav-data.ts` (groups, `MOBILE_PRIMARY`) | Copied + adapted | `apps/platform/components/shell/nav-data.ts` | Implemented in this change. Pixl groups PLAY, ECONOMY and YOU become Build, Community, Gear and You. 13 Pixl tabs become 23 LOADOUT tabs. Added `status`, `purpose`, `policy`, `from`, `external`. `report` removed. |
| `app/(shell)/nav-data.ts` (`ICONS`, `MORE_ICON`, `PALETTE_ICON`) | Copied + adapted | `apps/platform/components/shell/icons.tsx` | Implemented in this change. Whole-pixel `<rect>` geometry on a 16 by 16 grid for tabs shared with Pixl; new icons drawn for the others. Rendered as React SVG, not strings. `RE_ICON` (Restoration Energy) not used. |
| `app/(shell)/shell-nav.tsx` | Copied + adapted | `apps/platform/components/shell/shell-nav.tsx` | Implemented in this change. Sidebar, dock and MORE sheet structure kept; the top rail and theme control are split out (next two rows). Removed `dangerouslySetInnerHTML`, "BACK TO GAME" and the click-outside listener. Added `aria-current`, a labelled modal sheet with Close, `inert` background, focus management, Escape handling, "Soon" tags and a grouped sheet. |
| `app/(shell)/shell-nav.tsx` (the `.toprail` block: currency chips, theme picker) | Copied + adapted | `apps/platform/components/shell/top-rail.tsx`, `theme-toggle.tsx` | Implemented in this change. Pixels, Restoration Energy and Core Integrity chips removed. The rail shows a preview statement, an Ore chip with no value, an Accessibility settings link and a theme toggle. Pixl's `RE_ICON` and `/img/pixel.png` are not used. |
| `app/(shell)/layout.tsx` | Reimplemented | `apps/platform/app/(participant)/layout.tsx` | Implemented in this change. Pixl reads the session, calls `serverApi` for wallet and active events and passes game URL and balances to the nav. LOADOUT renders static data only. |
| `app/(shell)/gate.tsx` | Copied + adapted | `apps/platform/components/shell/gate.tsx` | Implemented in this change (presentational; unused until sign-in). Pixl version shows the game boot splash and a login link built from the current URL. Both removed. |
| `app/(shell)/dashboard/page.tsx`, `dashboard.css`, `lib.ts`, `lib.test.ts` | Reference only | later: Overview (`/overview`) | Reads Pixl wallet, level, Pixels, Restoration Energy, Hackatime stats and trials. Game-coupled; shapes only. |
| `app/globals.css` (sidebar, `.sb-logo`, `.nav`, `.nav-group`, `.nav-more`, `.nav-sheet`, `.toprail`, `.shell-main`, 900px dock rules) | Copied + adapted | `apps/platform` global stylesheet | Implemented in this change. Geometry kept: 260px sidebar, 54px minimum rail, bottom dock and sheet at 900px (the dock is 68px here; Pixl's is 60px). Pixl palette, fonts and shadows replaced by the LOADOUT Docs tokens. Added focus-visible, `prefers-contrast`, reduced-motion and safe-area rules. |
| `app/globals.css` (`.theme-toggle`, `.theme-picker`, `.theme-menu`, `.theme-opt`) | Reimplemented | `apps/platform` global stylesheet | Implemented in this change as a single toggle on `loadout-theme`. Pixl's menu offers "Pixl Paper" and "Pixl Ink" and stores `pixl_theme_v2`. |
| `app/globals.css` (`.wallet-chip`, `.rest-chip`, `.re-chip`) | Excluded | none | Pixels, Restoration Energy and Core Integrity chips. Game currencies. |
| `app/globals.css` (`cursor: url(/img/cursor/...)`) | Excluded | none | Pixl cursor art, served from the game origin. LOADOUT cursors are separate assets and a separate setting in `apps/landing`. |
| `app/globals.css` (`.gate`, `.gate-splash`, `.btn-enter`) | Excluded | none | Built on the game boot splash image. |
| `app/globals.css` (`.btn`, `.chip`, `.card`, `.panel`, `.field`, `.rbar`, `.dot`, `.toast`, `.spin`, `.page-title`, `.empty-note`) | Reimplemented | `apps/platform/components/ui/ui.tsx`, `ui.css` | The preview pages need buttons, panels, fields, meters and empty states. They are written from LOADOUT tokens; no Pixl CSS is kept. |
| `app/layout.tsx` | Reimplemented | `apps/platform/app/layout.tsx` | Implemented in this change. Pixl loads Poppins, Pixelify Sans and JetBrains Mono from Google through `next/font`. LOADOUT loads its own self-hosted fonts (Jersey 10, Pixelify Sans, IBM Plex Mono, open licence, copied from the landing) through `next/font/local`, adds a skip link, `noindex` robots and a constant theme-init script. |
| `app/page.tsx` | Reimplemented | `apps/platform/app/page.tsx` | Implemented in this change. Redirect to `/overview` (Pixl redirects to `/docs`). |
| `app/_generated/config.ts` | Excluded | none | Generated from `packages/config/pixl.json`: Pixl URLs, launch date, economy numbers (Pixels value, payouts, tiers, level bands). Pixl policy, not LOADOUT policy. |
| `app/docs/**` (`docs-shell.tsx`, `docs.css`, `[slug]/page.tsx`, `code-blocks.tsx`, `doc-toc.tsx`), `lib/docs.ts`, `lib/docs.test.ts` | Reference only | none | LOADOUT has its own Docs renderer in `apps/landing/app/docs/`. Navigation ideas were already audited on 2026-10-07 (ATTRIBUTION.md). The Pixl engine reads `docs/*.md` from the repo root and uses `packages/docs-engine`. Docs in the platform are an external link to the public Docs. |
| `app/form/page.tsx`, `app/form/[formKey]/page.tsx`, `FormClient.tsx` | Excluded | none | Public no-account forms keyed to a Slack ID and a six-digit code sent through Slack; form definitions are fetched from the Pixl server and edited in the staff dashboard. A Pixl staff and Slack workflow. |
| `app/api/login/route.ts` | Excluded | none | Starts login: sets a nonce cookie and redirects to the Pixl server's Hack Club Auth endpoint. LOADOUT designs its own sign-in in Phase 2. |
| `proxy.ts`, `proxy.test.ts` | Excluded | none | Reads `?token=` from the URL, checks the nonce, then stores the token as the `pixl_session` cookie. A credential in the query string reaches history and referrers. Not copied. |
| `lib/session.ts`, `lib/session-cookie.ts`, `lib/session.test.ts` | Excluded | none | Verifies a Pixl-server JWT with a shared `JWT_SECRET` and the `pixl_session` cookie. Tied to the Pixl session contract. |
| `lib/server-api.ts` | Excluded | none | Calls the Pixl server with the token appended as a `token` query parameter. |
| `lib/urls.ts`, `lib/urls.test.ts` | Excluded | none | Game URL (`/play`, `play.` host) and the Pixl login URL. |
| `app/api/proxy/[...path]/route.ts` | Excluded | none | Forwards browser calls to the Pixl server and adds the session token as a query parameter. |
| `next.config.ts` | Reference only | none now | `output: standalone` and `assetPrefix` for a Next Multi Zone behind the landing app's rewrites. Informs the open hosting question; not copied. |
| `Dockerfile`, `public/docs/**`, `public/dashboard/og.png` | Excluded | none | Pixl deployment and Pixl images. |

## Pixl landing app: `apps/landing`

The Pixl landing app is not part of this port. The earlier landing port is recorded in [landing-port-and-assets.md](landing-port-and-assets.md) and ATTRIBUTION.md. No new rows are added here.

## Participant pages: `apps/game/web/*`

These are the static HTML pages that served Pixl's participant tabs before the React web shell. They are the behaviour reference for each LOADOUT tab. Since 2026-10-20 LOADOUT has reimplemented the matching tabs in React as preview features on sample data; the decisions below are the original reading, and the section "Preview targets in `apps/platform`" says which pages were actually opened and what was taken. Page descriptions below come from each page's own metadata.

| Pixl page | Pixl description | LOADOUT tab | Decision | Notes and game coupling |
|---|---|---|---|---|
| `dashboard/` | Level, Pixels, Restoration Energy, what is next | Overview | Reimplemented (preview) | Game currencies and levels. A status summary pattern only; source not opened. |
| `explore/`, `explore/projects/` | Public project browsing | Explore | Reimplemented (preview) | `explore/projects/index.html` read for the board and detail pattern. Public-safe field allowlists are a good pattern for the later service (`apps/server/src/routes/explore.ts`). |
| `explore/leaderboard/` | Who shipped the most: pixels, referrals, upvotes | Leaderboards | Reference only | Ranks Pixl currencies. |
| `explore/players/` | Builders searchable by name | Profile (public view) | Reference only | |
| `ideas/` | Post ideas, browse, upvote | Ideas | Reimplemented (preview) | `ideas/index.html` read. Roles list (art, code, audio, design, writing) is a game-team concept (`routes/ideas.ts`) and was not taken. |
| `projects/`, `hackatime/` | Shipped projects with hours, tier and payout; connect Hackatime | Projects | Reimplemented (preview) | Tier and payout are Pixl economy and were not taken. `projects-ship-checklist.test.ts` was read for the live-checklist idea. Hackatime and Lapse hours are typed numbers in the preview; the real connect flow is a later integration (Phase 3). |
| `journals/` | Project journals | Journals | Reference only | |
| `trials/`, `quests/` | Villager trials and sidequests | Missions | Reference only | NPC and village driven; LOADOUT Missions are structured steps (Plan 11). Shape only. |
| `shop/`, `shop/item/` | Spend Pixels on physical rewards | Shop | Reimplemented (preview) | `shop/index.html` read for search, sort, filters, locked items and affordability. Pixl currency and regional rules (see `routes/shop.ts`) were not taken. |
| `orders/` | Shop order tracking | Orders | Reimplemented (preview) | Built from Plan 02 and the shared Ore ledger. Source not opened. |
| `collectibles/` | Spend Restoration Energy on collectibles for your village | Collectibles | Reimplemented (preview) | `collectibles/index.html` read for the progress-to-unlock grid. Game currency and village not taken. The catalog is invented and still needs a LOADOUT policy owner. |
| `refers/` | Invite friends and earn a payout when they ship | Referrals | Reimplemented (preview) | `refers/index.html` read for the code card and "got a code" form. Pixl qualification and payout not taken. LOADOUT qualification is in Plan 02; the reward amount is left open. |
| `calc/` | Payout calculator: pixels, dollars, RE by tier and hours | Ore calculator | Reimplemented (preview) | `calc/index.html` read for the input-beside-result layout. Pixl tier and RE maths not used. Plans 02 and 22 own the Ore estimate. |
| `vault/` | "The Core Vault": community Restoration Energy goals | none (see note) | Excluded | Not a wishlist. `nav-data.ts` records it as a note on Seasons (community goal), not on Wishlist. Only its idea of a shared goal meter informs the Community Era meter. Game-coupled; no code taken. |
| `show-n-tell/` | Vote for favourites at a live Show & Tell | Show & Tell | Reimplemented (preview) | Page read for the ordered list of entries. Single open round voting not used. |
| `timeline/` | "The Chronicle", a running timeline of what shipped | Seasons (loosely) | Reference only | Authored in the staff dashboard (`routes/story.ts`). Deferred in Pixl's own web-shell too. |
| `account/` | Profile, session, connected accounts | Account | Reimplemented (preview) | Tab set built from the plans; Pixl source not opened. |
| `report/` | Report a player or content to moderation | none | Excluded | Report tab excluded by owner direction; tied to game chat moderation (`routes/reports.ts`, `reports.ts`). |
| `api/*` (`player-og.ts`, `project-og.ts`, `shop-og.ts`, `*-meta.ts`) | Open Graph images and share metadata | none | Reference only | Share image generation uses Pixl fonts and layout. |
| `img/**` | Pixl images, badges, icons and cursor art | none | Excluded | Pixl art and brand. Not covered by the MIT grant without owner confirmation. |
| `pixl.css`, `pixl.js` | Old static shell styles and scripts | none | Reference only | `pixl.js` is the origin of the web-shell nav and icons (`nav-data.ts` says so). The adapted parts are logged under the web-shell rows. |

## Preview targets in `apps/platform` (added 2026-10-20)

By owner instruction on 2026-10-20 every internal tab became a working preview feature on labelled sample data, kept in the browser (see [DECISIONS.md](DECISIONS.md), "Preview milestone ships working features on sample data"). The rows in this file that say "Reference only" for a participant page now read as "Reimplemented as a preview feature" where the table below says so. Each page folder has a `SOURCES.md` listing what was read and the rules the plans leave open. [`platform-preview-open-questions.md`](platform-preview-open-questions.md) consolidates those open rules. No Pixl, Stardance or Stasis source text, markup, CSS, copy or art was pasted.

| Target (all under `apps/platform/`) | Contents | Reads from |
|---|---|---|
| `components/pages/registry.ts` | Slug to page map. `registry.test.ts` fails if a routed slug has no page or a page has no route | none |
| `components/pages/build/` | Projects, Journals, Reviews, Missions. Pure rules in `logic/` with bun tests (scoring, ship, cadence, missions, validate, summary); `store.ts`, `summary.ts` (`useBuildSummary`) | Plans 01, 02, 11, 22; Stardance review and mission models (method only); Pixl ship checklist idea |
| `components/pages/community-a/` | Explore, Ideas, Show & Tell, Friends. `logic/` for query, reactions, moderation, social graph, limits, validation; `summary.ts` | `plans/proposals/future-platform-ui.md`, Plan 01; Pixl `ideas`, `explore/projects`, `show-n-tell` pages (behaviour only) |
| `components/pages/community-b/` | Leaderboards, Seasons, Events. `logic/` for ranking, standings, streak, Era, quests, events, .ics, certificate code, dates; `summary.ts` | Plans 02, 11, 15; Stasis certificate verifier (idea only) |
| `components/pages/gear/` | Shop, Wishlist, Orders, Collectibles, Referrals, Ore calculator. `logic/` for catalog, pricing, orders, ledger, referrals, collectibles, custom orders, Ore maths; `gear-store.ts`, `summary.ts` | Plans 02 and 22; Pixl `shop`, `collectibles`, `refers`, `calc` pages (behaviour only) |
| `components/pages/hub/` | Overview, Profile, Achievements, Notifications, Account. `logic/` for account, achievements, claims, inbox, overview, profile, export and import; `actions.ts` | Plans 01, 02, 11 and the proposal; the port map rows for Pixl `dashboard`, `account`, `routes/notifications.ts` (source not opened) |
| `components/ui/ui.tsx`, `ui.css` | Shared page kit: `PageHeader`, `PreviewNote`, `Panel`, `Stat`, `Tag`, `EmptyState`, `Meter`, `Field`, `Tabs`, `Status` | LOADOUT design system |
| `lib/preview-store.ts`, `lib/ore-ledger.ts`, `lib/notifications.ts` | Browser store (`loadout-platform:v1:` keys), append-only Ore ledger, shared notification inbox | none |
| `lib/sample/builders.ts` | The invented sample builders and the fixed preview identity `ME` | none |
| `public/loadout/sprites/` | 28 LOADOUT sprites copied from `apps/landing/public/loadout/sprites/` (32 files there). Own assets, not third-party | LOADOUT |

Implemented tab status, replacing the "later" notes in the tables below:

| LOADOUT tab | Pixl page it descends from | Now |
|---|---|---|
| Overview | `dashboard/` | Reimplemented in React as a preview feature from the plans. Pixl source not opened. No Pixl currency, level or Restoration Energy |
| Projects | `projects/` | Reimplemented; ship checklist idea read from `projects-ship-checklist.test.ts`. LOADOUT tiers and rules replace Pixl's economy |
| Explore | `explore/`, `explore/projects/` | Reimplemented; `explore/projects/index.html` read for the board and detail pattern |
| Ideas | `ideas/` | Reimplemented; `ideas/index.html` read. Downvotes, roles, hours and image attachments not taken |
| Show & Tell | `show-n-tell/` | Reimplemented; page read. Voting rounds and round timer not used |
| Shop | `shop/`, `shop/item/` | Reimplemented; `shop/index.html` read. Pixels, regions, unlocks and art not taken |
| Wishlist | none (`vault/` is not a wishlist) | New tab, built from Plan 02. `vault/` stays excluded |
| Orders | `orders/` | Reimplemented from Plan 02 with the shared Ore ledger. Pixl page not opened |
| Collectibles | `collectibles/` | Reimplemented; `collectibles/index.html` read. Upvote currency and village not taken |
| Referrals | `refers/` | Reimplemented; `refers/index.html` read. Pixel payouts and tiers not taken |
| Ore calculator | `calc/` | Reimplemented; `calc/index.html` read. LOADOUT maths from Plans 02 and 22 |
| Account | `account/` | Reimplemented from the plans. Pixl source not opened |
| Journals, Reviews, Missions, Leaderboards, Seasons, Events, Friends, Profile, Achievements, Notifications | various or none | Reimplemented from the plans and the proposal. Pixl `journals/`, `explore/leaderboard/`, `timeline/`, `explore/players/`, `trials/` and `quests/` pages were not opened |

## Server capability areas: `apps/server/src`

Read from the directory listing and each file's own header comments; not a full code audit. The preview pages model several of these domains in the browser on sample data; none of the server code is used, and each row stays the reference for the later service. The server is one Express process with game WebSocket, Pixl OAuth, Slack, Hackatime and Postgres coupling. LOADOUT builds server-only domain modules inside `apps/platform` in later phases (draft plan). No server code is copied in this change. Existing licensing decisions in [DECISIONS.md](DECISIONS.md) stay as the starting point; the 2026-10-20 note there explains how they read under the new direction.

| Pixl module | What it does (as seen) | LOADOUT domain and phase | Decision | Coupling note |
|---|---|---|---|---|
| `routes/auth.ts`, `auth/session.ts`, `auth/revocation.ts` | Hack Club Auth login, JWT session, per-user session revocation | Identity (Phase 2) | Reference only | Pixl OAuth callbacks and token contract. Revocation is a useful idea. |
| `hcaEligibility.ts` | Hack Club Auth eligibility helper, with a hard-coded per-account exception allowlist | Identity (Phase 2) | Reference only | Exception allowlist is Pixl-specific. |
| `routes/profile.ts` | Profile, display name checks, read-only wallet | Identity and profile (Phase 2) | Reference only | Wallet is Pixels and RE. |
| `routes/projects.ts`, `routes/collaborators.ts`, `routes/gitRepoUrl.ts`, `routes/projectUrlSafety.ts`, `routes/bomCsv.ts` | Project CRUD and ship, collaborators, repo and link safety, bill of materials CSV parsing | Projects and evidence (Phase 3) | Reference only; patterns adaptable | Tier and payout fields are Pixl economy. Field allowlists and URL safety are reusable ideas. |
| `routes/hackatime.ts`, `hackatime/api.ts` | Hackatime OAuth and project time list | Hackatime integration (Phase 3) | Reference only; patterns adaptable | Scope and consent rules must come from LOADOUT (Plan 01). |
| `routes/journalsPublic.ts` | Public, no-login journal page by share token | Journals (Phase 3) | Reference only; patterns adaptable | Privacy rules per Plan 01. |
| `routes/activity.ts` | A player's own action log | Overview (Phase 2) | Reference only | |
| `ysws/archive.ts`, `ysws/doubleDip.ts`, `ysws/imports.ts`, `ysws/routes.ts` | Reads Hack Club's ships archive, checks overlapping credit, imports prior ships | Projects and anti-abuse (Phase 3) | Reference only; patterns adaptable | Calls Hack Club archive endpoints; Pixl hour rules. |
| `macondo/*` | Imports journals and projects from a separate Hack Club service | Projects (Phase 3) | Excluded | Specific to Pixl's intake. |
| `routes/uploads.ts`, `routes/cdnQuota.ts`, `imageValidation.ts` | Image upload proxy to the Hack Club CDN, quota, decode and re-encode check | Evidence (Phase 3) | Reference only | Needs LOADOUT owner, retention and access decisions (reference-architecture.md). |
| `routes/shop.ts` | Catalog, regional rules, orders | Catalog and orders (Phase 5) | Reference only | Pixl Pixels and regional pricing. LOADOUT uses global Ore. |
| `routes/explore.ts` | Public project browse with a public-safe field list | Community (Phase 6) | Reference only; patterns adaptable | |
| `routes/ideas.ts` | Ideas, votes, title search | Community (Phase 6) | Reference only; patterns adaptable | Moderation filter hook. |
| `routes/upvotes.ts` | Upvote totals; collectibles granted automatically | Community (Phase 6) | Reference only | Collectible policy not settled for LOADOUT. |
| `routes/showNTell.ts` | One open voting round | Community (Phase 6) | Reference only | |
| `routes/friends.ts`, `social.ts` | Friend requests and shared id validation | Community (Phase 6) | Reference only; patterns adaptable | Selected social scope is in the proposal. |
| `routes/notifications.ts` | Notification inbox, automation hook | Notifications (Phase 6) | Reference only | |
| `routes/referral.ts` | Referral code, boost window | Referrals (Phase 6) | Reference only | Pixl reward rules. |
| `routes/sidequests.ts`, `routes/story.ts`, `routes/events.ts`, `routes/news.ts` | Quest log, season timeline, live community goals, program news | Missions, Seasons, Events (Phase 6, 7) | Reference only | NPC unlocks and Core Integrity are game concepts. |
| `routes/vault.ts` | Core Vault goal and top contributor RE bonus | none | Excluded | Restoration Energy game goal. |
| `routes/npcs.ts`, `routes/village.ts`, `ws/*` (`gameServer.ts`, `lobbies.ts`) | NPC data, village lobby invites, game WebSocket server | none | Excluded | The game. |
| `xp.ts` | Tier, RE and level economy | none | Excluded | Pixl economy. LOADOUT Ore and XP follow Plans 02 and 22. |
| `routes/reports.ts`, `reports.ts` | Player reports and AI judgement of recent chat | none | Excluded | Game chat moderation. |
| `moderation.ts` | Blocked-word filter for chat and display names | Moderation (Phase 6) | Reference only | Word list tuned for Pixl chat; LOADOUT sets its own rules. |
| `routes/forms.ts`, `routes/formVerification.ts` | Public Slack-ID forms with code verification | none | Excluded | Pixl staff and Slack workflow. |
| `operations/*`, `routes/operations.ts` | "Operation Blackout" timed event entries | Events (Phase 7) | Reference only | Pixl event. |
| `routes/admin.ts` | Dashboard-to-server admin API behind a shared secret | Staff operations (Phase 7) | Reference only | Staff, not participant. |
| `shipNotify.ts`, `pixlSlack.ts`, `slackAvatar.ts`, `pixoChat.ts`, `littleGuy.ts` | Ship alerts to a team channel, Slack helpers and avatars, Pixo AI chat persona, desktop-pet relay | Slack (optional, later) | Excluded | Pixl channels, personas and relays. |
| `crypto.ts` | AES-256-GCM at-rest encryption for PII | Identity (Phase 2) | Reference only; adaptable idea | LOADOUT decides what PII it holds at all. |
| `rateLimit.ts`, `clientIp.ts` | Fixed-window rate limit per IP; trusted client IP from proxies and Cloudflare ranges | Platform infrastructure | Reference only; patterns adaptable | Network ranges are deployment specific. |
| `db/*`, `drizzle/`, `scripts/apply-migrations.ts`, `scripts/import-from-supabase.ts`, `scripts/seed-blackout-dev.ts` | Postgres adapter, about 220 migration entries, import and seed scripts | Database (Phase 0, 2) | Excluded | LOADOUT starts its own owned migration path (draft plan). |
| `index.ts` (CORS and headers) | Express setup; sets `Access-Control-Allow-Origin: *` and a no-referrer policy because tokens travel in the query string | none | Excluded | Not copied. See the web-shell login rows. |

## Other Pixl apps and packages

| Pixl path | Decision | Notes |
|---|---|---|
| `apps/dashboard` | Reference only | **Staff tool, not participant UI.** Its README calls it Pixl's internal moderation dashboard: reviewing players, projects and violations, warnings, bans, fulfilment and similar. The participant "dashboard" tab is `apps/web-shell/app/(shell)/dashboard` and `apps/game/web/dashboard/`. Several audit rows mis-cite `apps/dashboard` as participant UI; see the correction in DECISIONS.md. Staff patterns (review queue, audit) are Phase 4 and 7 references. |
| `apps/pixorpheus` | Excluded | AGPL-3.0 (`apps/pixorpheus/LICENSE`). Not copied or linked into LOADOUT. |
| `apps/pixo-dm` | Excluded | Small Express service for Pixl's Slack direct messages. |
| `apps/game` (Godot project, scenes, scripts, assets, themes, `serve.ts`) | Excluded | The game. |
| `apps/landing` | See the landing port record | Already handled in `landing-port-and-assets.md`. |
| `packages/config` | Excluded | Pixl configuration (names, URLs, economy). |
| `packages/theme` | Excluded | Pixl palette sync. LOADOUT tokens are in `apps/landing` and the design system. |
| `packages/docs-engine` | Reference only | Markdown renderer for Pixl docs; LOADOUT has its own. |
| `packages/map-sync` | Excluded | Game map data. |
| `docs/*.md` (Pixl docs content) | Reference only | Content and tutorial organisation only (as in the 2026-10-07 record). |
| Pixl art, fonts and brand (logo, boot splash, badge images, cursor art, shop product photos, Phantom Sans and other font files) | Excluded | Not covered by MIT. See Licence boundary. Eight shop photos already on the homepage belt are logged in ATTRIBUTION.md under the 2026-10-14 permission record. |

## Stardance, Stasis and YSWS Template reuse

The owner states permission from all reference owners, so code and design from these references may be drawn on, subject to the owner's product decisions. Evidence is pending, so each item is tagged with the earliest phase of the [implementation plan](../superpowers/plans/2026-10-19-pixl-shell-platform.md) that would use it. No file from these references is copied in this change. The preview pages read some of them for method and shape and reimplement it in LOADOUT code; those are listed in the second table below and in ATTRIBUTION.md. Copied files are logged here and in ATTRIBUTION.md when they land.

| Reference and path | What it offers | Plan phase |
|---|---|---|
| Stardance `app/models/vote.rb`, `app/models/vote/assignment.rb`, `app/models/vote/matchmaker.rb`, `app/views/votes/_scorecard.html.erb` | Review rules, assignment pool, scorecard UX | Phase 4 |
| Stardance `app/models/post/ship_event/payouts.rb`, `app/models/post/ship_event.rb`, `app/models/ledger_entry.rb` | Medians, midrank percentile, payout lock, preview versus locked snapshot, ledger | Phase 4 |
| Stardance `app/controllers/votes/flags_controller.rb`, `app/controllers/admin/vote_flags_controller.rb`, `app/models/vote/event.rb` | Flag window, pending payout hold, audited resolution | Phase 4 |
| Stardance `app/controllers/admin/payout_reviews_controller.rb`, `app/policies/admin/payout_review_policy.rb` | Read-only review and payout interfaces, explicit admin authorisation | Phase 4, 7 |
| Stardance `app/views/guides/topics/virality_bonus.md`, `app/models/project_mention.rb`, `app/controllers/projects/mentions_controller.rb` | Good and Great Signal claims | Phase 4 |
| Stardance `app/services/hackatime_service.rb`, `app/services/lapse_service.rb` | Tracker and Lapse integration patterns | Phase 3 |
| Stardance mission and guide flows named in the proposal ("inspired by Stardance") | Guided missions with steps and prerequisites | Phase 6; source paths not yet audited |
| Stardance `app/models/poll_vote.rb`, `app/controllers/poll_votes_controller.rb` | Community poll | Not selected |
| Stasis lab inventory, NFC checkout, tool rental, printer queues | Event-lab operations | Phase 7, IRL event only; outside the online platform |
| Stasis `lib/scramble.ts`, `app/components/*` effects | Visual effects already adapted on the homepage | Landing; not part of the platform shell |
| YSWS Template `backend/src/auth/auth.service.ts`, `jwt-auth.guard.ts` | HCA login and guard flow | Phase 2 |
| YSWS Template `backend/src/slack/slack.service.ts` | Slack operations | Phase 7 (optional) |
| YSWS Template `backend/src/shop/shop.service.ts` | Shop and orders | Phase 5 |
| YSWS Template `backend/src/fraud-review/fraud-review.service.ts` | Fraud review queue | Phase 4, 7 |
| YSWS Template `ysws.config.schema.json` | Program config shape | Phase 0; reimplement for fields LOADOUT owns |
| YSWS Template `frontend/**` (SvelteKit) | Not usable: LOADOUT stays on Next | Excluded |

Read and reimplemented for the preview pages (structure only, no code copied):

| Reference and path | What was taken | Where it went |
|---|---|---|
| Stardance `app/models/post/ship_event/payouts.rb` | Method: first N ordered votes, per-category median, mean of medians, midrank percentile, tie gives 50, a curve of the form `low + (high - low) x percentile^exponent`. Exponent, range and cohort are LOADOUT's draft (see the open questions record) | `components/pages/build/logic/scoring.ts`, `constants.ts` |
| Stardance `app/models/mission.rb`, `mission/step.rb`, `mission/prerequisite.rb`, `mission/submission.rb` | Shape of a mission: difficulty, estimated minutes, hardware flag, ordered steps, prerequisite links, submission states. Renamed and simplified. Prizes, shop unlocks and payouts not used | `components/pages/build/logic/missions.ts`, `content.ts` |
| Stardance `app/components/discover_rail/streak_widget.rb`, `streak_badge_component.rb` | Consulted only. LOADOUT's streak is weekly with no daily roll, sticker or claim mechanics | none |
| Stasis `lib/certificates.ts`, `app/api/certificate/verify/route.ts`, `app/certificate/page.tsx` | Idea: a printed code typed back by hand, normalised for case and separators, looked up among issued certificates; answer shows only name and issue date. Rewritten without Airtable or a server | `components/pages/community-b/logic/certificate.ts`, `events-parts.tsx` |
| Pixl `apps/game/web/projects-ship-checklist.test.ts` | Idea of a live ship checklist. LOADOUT's checklist is different (Lapse for Hardware, open source, journals, bill of materials, AI declaration) | `components/pages/build/logic/ship.ts` |

Unchanged product decisions: Stardance's currency, category names, Hardware exception, Rails stack and secrets repository are not adopted. Stasis copy, artwork, photos, logos, event facts and operating claims remain "not adopted" in DECISIONS.md until the owner says otherwise.

## Open questions

1. **Non-MIT assets.** Does the owner's permission cover Pixl's non-MIT material (purchased or third-party art, product photos, brand assets, Phantom Sans and other fonts)? Until confirmed, they stay excluded. The existing Phantom Sans files in `apps/landing` remain as recorded in ATTRIBUTION.md.
2. **Written evidence.** Who granted permission for Pixl, Stardance, Stasis and the YSWS Template, when, and where is it recorded? The owner statement is dated 2026-10-20; the grants are not in the repository.
3. **Report tab.** The Report tab is excluded. Does the owner want a LOADOUT job for it (for example participant reports to moderators)? It would need its own brief and policy.
4. **Wishlist mapping.** Pixl's `vault` (GOALS) is the Core Vault, a community Restoration Energy goal, not a saved-items list. `nav-data.ts` now treats Wishlist as a new tab and notes `vault` on Seasons. Confirm? Plan 02 owns its behaviour.
5. **Policy gaps behind tabs.** Streaks, collectibles, comments and notification rules are named in the proposal, but no plan sets their rules. They need policy owners before any live page.
6. **Production hostname.** Which host serves the platform, and does the landing app rewrite to it or link out? This also decides whether `loadout-theme` is shared across the two apps and whether Next Multi Zone settings (`assetPrefix`) are needed.
7. **Preview override.** When does the preview override end (working features on sample data instead of real records)? The owner instruction covers the preview milestone only. The retirement condition is in DECISIONS.md. The rules the plans leave open are listed in [platform-preview-open-questions.md](platform-preview-open-questions.md).
8. **Staff dashboard.** When Phase 7 starts, is the Pixl staff dashboard a pattern source only, or does the owner want a separate staff app?
