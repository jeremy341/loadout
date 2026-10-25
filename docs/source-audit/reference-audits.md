# Reference audits

Merged from three notes on 25 Oct 2026: architecture audit, reference comparison, and source bases. Pins and licences are in `reference-pins.tsv`; decisions are in `DECISIONS.md`.

## Architecture audit

_Merged from `reference-architecture.md` on 25 Oct 2026._

### Reference path convention

Pixl, YSWS Template, and Stardance are pinned as independent Git submodules under `references/` and are covered by the stack audit below. Paths in the audit tables are relative to the named source repository; prefix them with `references/pixl/`, `references/ysws-template/`, or `references/stardance/` to open the exact local file. Stasis is also pinned as a Hack Club hardware-hackathon reference; it has not yet received a stack/architecture audit and its architecture has not been audited.

Update 2026-10-20: the owner states reuse of all four references is permitted (evidence pending; see DECISIONS.md and ATTRIBUTION.md). Cells below that say "no reuse basis was established" describe the repositories' own licences at the audited pins, not LOADOUT's current working basis. The archived Pixl platform source map is `pixl-platform-port-map.md` (removed; see git history).

### Source stacks

| Source | Runtime and frontend | Data and background work | Deployment and coupling |
|---|---|---|---|
| Pixl | Bun 1.3.13 workspaces, Turborepo, Next.js 16.3.5 / React 19 landing and dashboard, TypeScript/Express server, additional app packages. See `references/pixl/package.json`, `references/pixl/apps/landing/package.json`, `references/pixl/apps/dashboard/package.json`, `references/pixl/apps/server/package.json`, and `references/pixl/turbo.json`. | The inspected server/dashboard code connects to Orchard PostgreSQL through postgres.js adapters at `references/pixl/apps/server/src/db/pgCompat.ts` and `references/pixl/apps/dashboard/lib/pgCompat.ts`. `references/pixl/apps/server/src/db/client.ts` retains the name supabase as a compatibility alias; it is not evidence of a live Supabase client. Drizzle SQL migrations also exist under `references/pixl/apps/server/drizzle` and are applied by `references/pixl/apps/server/src/scripts/apply-migrations.ts`. The old Supabase import path is `references/pixl/apps/server/src/scripts/import-from-supabase.ts`. | Orchard/Kubernetes, Pixl hosts and service DNS, Vercel proxies, game assets, and Pixl config are present in the source tree. These endpoints must not run for LOADOUT. |
| YSWS Template | NestJS backend, SvelteKit frontend, TypeScript. See `references/ysws-template/backend/package.json`, `references/ysws-template/frontend/package.json`, and `references/ysws-template/SETUP.md`. | TypeORM/PostgreSQL entities and migrations; integrations include HCA, Hackatime, HCB, Slack, and attendance. | JSON program configuration and dual frontend/backend deployment; no reuse basis was established. |
| Stardance | Rails 8.1.4, Ruby, Yarn 4, esbuild. | PostgreSQL/Active Record migrations, Pundit authorization, PaperTrail history, SolidQueue jobs. Review and Virality Bonus models are recorded in `the reference comparison section` and `decisions.md`. | Rails/Kamal/Coolify deployment and Stardance-specific services. It is a policy/UX reference only; no Rails migration or code reuse. |

### LOADOUT starting shape

The repo has a minimal Bun workspace and a Next.js public homepage under `apps/landing`. The verified Stage A Pixl baseline was redesigned in the same application, preserving useful scrolling, navigation, motion, and container patterns. The site is a static public explanation with optional confirmed links and preview-safe metadata. Participant, admin, economy, review, and shop backends remain outside this slice. Exact source mappings are in `landing-port-and-assets.md`.

### Data, identity, and permission boundaries

Pixl's server retains compatibility code shaped like supabase-js while its current adapter talks directly to Postgres. The source also has a Drizzle migration layer and an old Supabase import script; these are distinct historical paths, not one settled contract. Authentication and application administrator roles are separate from GitHub repository roles. Any future user-facing access must be least-privilege and LOADOUT-specific.

Hackatime is a time-evidence source, not proof that work is eligible or attributable. LOADOUT needs project- and journal-level allocation policy before importing tracker data. The YSWS Template's integrations are patterns to research, not permission to copy its implementation or request broad scopes.

### Review and payout flow (implementation-neutral)

The specialist reference suggests separating eligible reviewer assignment; a submitted rubric with a written reason; countable-review qualification; deterministic aggregation; a provisional score/payout preview; a versioned immutable award snapshot; a 24-hour flag window; authorized resolution; and an idempotent ledger issue. Persist reviewer/event identifiers, policy versions, state transitions, and admin actions. LOADOUT has selected flags but no appeal route. Do not silently recompute an already locked award.

LOADOUT uses Originality, Technical Depth, Execution, and Documentation at 1–9 each, with 12 countable peer reviews for every ship, including Hardware. It adopts category medians, the mean of the medians, midrank percentiles, and Stardance's percentile curve, adapted to Ore and LOADOUT's 1×–20× normal rate (30× for Great Signal). LOADOUT keeps its custom eight-review duty, journal-age payout gate, 24-hour flag handling, false-flag penalty, and no-appeal rule. Stardance's category labels, currency, Hardware exception, and implementation are not adopted.

### Storage, jobs, migrations, and server/client boundary

Pixl image uploads are proxied server-side to the Hack Club CDN using `HACKCLUB_CDN_KEY`, with static-image validation and quota handling. See `references/pixl/apps/server/src/routes/uploads.ts`, `references/pixl/apps/server/src/imageValidation.ts`, and `references/pixl/apps/server/src/routes/cdnQuota.ts`. This is a Pixl integration and must not be enabled for LOADOUT until the owner, retention, and authorization model are decided.

The inspected Pixl server package does not declare a separate queue framework; it combines the Express process, app scripts, delayed/in-process work, and platform cron endpoints. The dashboard also has an API cron route at `references/pixl/apps/dashboard/app/api/cron/queue-health/route.ts`. Do not assume these are portable background-job guarantees. YSWS Template uses Nest scheduling modules; Stardance uses SolidQueue.

Pixl migration systems include the Drizzle SQL journal under `references/pixl/apps/server/drizzle`, its custom apply script, and the old Supabase import script. The YSWS Template uses TypeORM migrations under `references/ysws-template/backend/src/migrations`. Stardance uses Active Record migrations under `references/stardance/db/migrate`. LOADOUT should create a single owned migration path when the database slice begins.

### Environment surface and risks

The homepage's optional public configuration is listed in `apps/landing/.env.example`: owned origin, Join/Login/community HTTPS URLs, and indexing permission. No credentials are required for this static page. Pixl's RSVP, proxy/rewrite configuration, and source services are excluded. Future integrations require their own scoped credentials and migration-specific review.

Other source-coupled risks include Pixl OAuth callback URLs, Supabase project IDs, media buckets, Slack channels, email templates, hostname constants, and old shop/project content. They remain deferred pending migration-specific review. A secret scan and reference-presence scan are required before publication.

### Testing and CI

The landing workspace has lint, typecheck, configuration unit tests, production build, and Playwright browser/accessibility checks. CI definitions cover these alongside repository whitespace and source pins, without checking out reference sources. The definitions have not yet run on GitHub. The references' other test suites remain upstream evidence and are not LOADOUT tests.


## Reference comparison

_Merged from `the reference comparison section` on 25 Oct 2026._

This dated audit compares the pinned Pixl, YSWS Template, and Stardance repositories with LOADOUT. It records patterns worth studying, not LOADOUT product policy. Current policy references in this matrix use Ore; older implementation details in dated records retain Bolts as historical terminology. Stasis was added later as an event/program reference and has not yet been compared in this matrix. Exact pins, licensing, and reuse decisions are owned by [source bases](source-bases.md) and [decisions](DECISIONS.md).

Update 2026-10-20: (1) the owner states reuse of all four references is permitted, evidence pending, so "REFERENCE ONLY; no license" cells below read as reuse permitted by that statement (see DECISIONS.md). (2) Where this matrix says ADAPT for Pixl's `auth.ts`, `session.ts`, `hackatime.ts`, `projects.ts`, `collaborators.ts` and `shop.ts` and DECISIONS.md says REFERENCE ONLY or IGNORE, DECISIONS.md section 3 resolves it: adapt is allowed, verbatim copying is not, because of Pixl currency and game coupling. (3) `apps/dashboard` is Pixl's staff tool, not participant UI. The "Participant dashboard" and "Account/settings" rows cite it by mistake; the participant sources are `apps/web-shell/app/(shell)/` and `apps/game/web/`, mapped in `pixl-platform-port-map.md` (removed; see git history).

### Feature coverage

## Feature Audit Matrix

Source paths below are relative to the source named in each column. Local roots are `references/pixl/`, `references/ysws-template/`, and `references/stardance/`.

Reviewed source revisions are recorded in the source bases section below. Stardance is audited here for peer-review/payout mechanics and its Virality Bonus. This comparison is source evidence, not LOADOUT product policy.

| Capability | Pixl | YSWS Template | Stardance | LOADOUT decision | Notes |
|---|---|---|---|---|---|
| Hack Club login/session | apps/server/src/routes/auth.ts, apps/server/src/auth/session.ts — ADAPT after security review | backend/src/auth/auth.service.ts — REFERENCE ONLY; no license | Not audited beyond staff access policy | Build LOADOUT-owned login/session contract on Pixl plumbing; do not copy template code. |
| Roles/reviewer access | Dashboard review routes/components; apps/server/src/routes/admin.ts — ADAPT | backend/src/auth — REFERENCE ONLY | app/policies/admin/payout_review_policy.rb — REFERENCE ONLY | Use explicit least-privilege roles; no owner-specific merge/review gate. |
| Project records/collaborators | apps/server/src/routes/projects.ts, collaborators.ts — ADAPT | backend/src projects and reviews — REFERENCE ONLY | app/models/post/ship_event.rb, app/models/vote/assignment.rb — REFERENCE ONLY | Capability statement, team attribution, and versioned ships remain new LOADOUT fields. |
| Hackatime | apps/server/src/routes/hackatime.ts, src/hackatime/api.ts — ADAPT | backend/src/hackatime — REFERENCE ONLY | app/services/hackatime_service.rb — REFERENCE ONLY | Keep tracker data as evidence; preserve LOADOUT’s journal assignment and eligible time window. |
| Lapse / visual work evidence | No confirmed first-party Lapse integration in inspected server paths — REFERENCE ONLY | Integration config only — REFERENCE ONLY | app/services/lapse_service.rb — REFERENCE ONLY | Reimplement only with approved scopes, participant consent, and privacy review. |
| Journals/devlogs | apps/server/src/routes/journalsPublic.ts, apps/dashboard/lib/db.ts — ADAPT | backend/src/devlogs — REFERENCE ONLY | app/models/post/devlog.rb and payout hour windows — REFERENCE ONLY | LOADOUT’s minute-level unique assignment is canonical and must be implemented separately. |
| Ship/submission lifecycle | apps/server/src/routes/projects.ts, shipNotify.ts — ADAPT | backend/src/projects and reviews — REFERENCE ONLY | app/models/post/ship_event.rb — REFERENCE ONLY | Fit, evidence, version, and final reviewer allocation remain LOADOUT-specific. |
| Staff review queue | apps/dashboard/app/review/**, app/_components/ReviewForm.tsx, ReviewPipelineSteps.tsx, ReviewTable.tsx, LiveReview.tsx — ADAPT | frontend/src/routes/**/admin — REFERENCE ONLY | app/controllers/admin/payout_reviews_controller.rb and app/views/admin/payout_reviews/** — REFERENCE ONLY | Reuse operational patterns selectively; LOADOUT review stages/rubric are not transplanted. |
| Peer/project ratings | Existing Pixl feedback/upvotes are not LOADOUT quality scores — IGNORE as an earning formula | Bot-review and human review flows — REFERENCE ONLY | app/models/vote.rb, app/models/vote/assignment.rb, app/models/vote/matchmaker.rb — ADAPT | LOADOUT keeps Originality, Technical Depth, Execution, Documentation, each scored 1–9; all ships, including Hardware, use peers. |
| Rating reasons/feedback | Review notes and reviewer comments — ADAPT as UX pattern | Admin review feedback — REFERENCE ONLY | Vote#reason and scorecard/modal — ADAPT | Require one written reason of at least ten words per review. Reviewer names stay hidden from builders; reasons stay visible to the ship owner and moderators. |
| Number of ratings / assignment | Pixl review assignment/claim patterns — ADAPT | Template review-queue assignment — REFERENCE ONLY | Twelve countable votes; Vote::Assignment and Vote::Matchmaker — ADAPT | LOADOUT uses 12 countable reviews, continuous peer assignment until full, eight reviews owed per builder before payout, and includes Hardware in the peer pool. |
| Aggregation / percentiles | No LOADOUT-compatible quality aggregation — IGNORE | No relevant peer-score policy found — REFERENCE ONLY | payouts.rb — category medians, overall mean, midrank percentiles — ADAPT | Apply medians to LOADOUT's four dimensions, average the medians, then map the percentile to Ore. No outlier trimming. |
| Multiplier / payout lock | Existing Pixels/hour economics are not LOADOUT Ore — IGNORE | Currency/shop config is conceptual reference only | payout preview, locked snapshot, percentile curve — ADAPT | Normal LOADOUT rates are 1×–20× with 10× mean. Great-tier Signal raises the hourly ceiling to 30×. Lock after 12 reviews and the 24-hour journal-age condition; then open the 24-hour flag window. |
| Missing reviews / outliers | Review queue aging patterns — ADAPT | Return/review states — REFERENCE ONLY | payouts.rb and vote.rb — ADAPT | Continue assigning peers until 12 countable reviews are present. Do not substitute a team score; median aggregation is not outlier removal. |
| Abuse / moderation | apps/server/src/moderation.ts, src/ysws/doubleDip.ts — ADAPT | Review/report and audit flows — REFERENCE ONLY | app/models/vote.rb, app/models/vote/event.rb, app/jobs/vote/auto_discard_job.rb, app/controllers/admin/vote_flags/** — REFERENCE ONLY | Use audit events and reviewed flags as patterns. Stardance’s Secrets::VoteAutoDiscarder implementation is absent and cannot be evaluated. |
| Admin overrides / re-review / appeals | Reviewer second-pass and audit patterns — ADAPT | Return/review tracking — REFERENCE ONLY | Payout-review and vote-flag UI — ADAPT | Moderators inspect ratings and reasons. A flag may challenge a counted review inside the window; no appeal exists afterward. Three rejected flags within ten hours deduct 5% from the flagger's next final Ore payout. |
| Signal / virality | No equivalent quality-reward rule — IGNORE | No relevant rule identified — REFERENCE ONLY | Virality Bonus guide, ProjectMention claim form, Good/Great thresholds — ADAPT | Good gives +50 Ore and achievement/shop rewards. Great raises the rate cap to 30×, includes Good rewards, and total Signal is capped at 5,000 Ore per project. Use Stardance's listed thresholds and abuse exclusions; no code is copied. |
| Shop/fulfillment/regional pricing | apps/server/src/routes/shop.ts, dashboard shop configurators, fulfillers — ADAPT | backend/src/shop, HCB integration — REFERENCE ONLY | Stardance shop regionalization — REFERENCE ONLY | LOADOUT uses global Ore and identical Ore prices across regions; availability and delivery may vary. Wishlist is included; shop suggestion/voting is excluded. |
| Uploads/CDN/sensitive evidence | apps/server/src/routes/uploads.ts, URL-safety modules — ADAPT | Silo/storage services — REFERENCE ONLY | Rails ActiveStorage and media workflows — REFERENCE ONLY | Recheck access and retention rules before using in a teen program. |
| Slack / notifications | apps/server/src/pixlSlack.ts, routes/notifications.ts, shipNotify.ts — ADAPT | backend/src/slack — REFERENCE ONLY | Vote events and notification jobs — REFERENCE ONLY | Optional Slack support; no DM/social scope in homepage MVP. |
| Community polls and vote prompts | No separate participant poll flow confirmed in inspected paths | Not examined for this capability | `app/models/poll_vote.rb`, `app/controllers/poll_votes_controller.rb`, and `app/views/shared/_jimberjake_poll.html.erb` (#1516) — REFERENCE ONLY | LOADOUT has selected idea-board upvotes; a separate poll popup is not approved. |
| Config / deployment | packages/config, apps/landing/next.config.ts, Vercel/Orchard files — ADAPT only after removing Pixl endpoints | ysws.config.schema.json, Nest/Svelte dual deployment — REFERENCE ONLY | Rails/Coolify/Docker — IGNORE as architecture | Keep one LOADOUT-owned public config; no copied template schema. |
| Tests | Bun tests across server/dashboard/landing — ADAPT | Jest tests in NestJS — REFERENCE ONLY | Rails Minitest/Controller/model tests — REFERENCE ONLY | Test the landing route/component and build in the selected Next/Bun stack. |

### Stardance behavior noted

- app/models/vote.rb validates four integer dimensions on a 1–9 scale, requires a reason of at least ten words, blocks self-voting, and enforces unique voter/ship pairs.
- app/models/post/ship_event/payouts.rb waits for twelve countable votes; uses the first twelve ordered ratings, category medians, an overall average, and midrank percentile; locks vote IDs, score, hours, multiplier, curve version, and blessing before the payout window.
- The payout lock opens a 24-hour review window. A user can accept early or flag an included vote; a pending flag blocks automatic issue, an accepted flag discards the vote and clears the snapshot, and a rejected flag penalizes the flagger and forces payout.
- The final payout is issued transactionally/idempotently to a ledger; the admin queue itself is read-only.
- The 2026-10-20 source refresh also adds a Flipper-gated Jimberjake poll/vote flow and a correction to the fraud subject queue; LOADOUT has not selected the poll popup as a product feature.
- The current main branch also documents a Virality Bonus: external project reach is claimed with a link, reviewed, and grouped into Good and Great tiers. Good awards a flat 50 Stardust plus achievement/shop rewards; Great raises the hourly ceiling from 20 to 30 and includes Good rewards, with a total per-project bonus capped at 5,000 Stardust. Thresholds vary by platform; internal Hack Club traffic, bot reposts, SEO mirrors, and paid engagement are excluded. Claims can upgrade from Good to Great and trigger a payout recalculation. This feature is behind a Flipper flag; the inspected paths contain a claim model/form but not a complete reviewer-resolution and payout implementation.
- Median aggregation limits the influence of one extreme score; no explicit outlier detection or trimming stage was found in the inspected payout code.
- Vote::AutoDiscardJob delegates to Secrets::VoteAutoDiscarder, which is not in this checkout. Its actual scoring/abuse logic is unverified.
- Tests cover threshold gating, medians/percentiles, locked snapshot, idempotency, vote-deficit holds, accepted/rejected flags, auto-discard delegation, and admin/NDA-helper access. No dedicated matchmaker test file or general post-payout appeal flow was found in the inspected paths.


### UI and interaction coverage

## UI audit matrix

Source paths below are relative to the source named in each column. Local roots are `references/pixl/`, `references/ysws-template/`, and `references/stardance/`. This matrix is design evidence, not a directive to restore the removed landing page.

The LOADOUT visual owner is plans/03; the public homepage follows plans/06. Pixl structure is useful evidence, but its identity and lore are not retained.

| Screen | Pixl evidence | YSWS Template evidence | Stardance evidence | LOADOUT decision |
|---|---|---|---|---|
| Public landing | apps/landing/app/[lang]/page.tsx; apps/landing/app/_components/Hero.tsx, Menu.tsx, Description.tsx, FAQ.tsx, Footer.tsx | frontend/src/routes/+page.svelte and +layout.svelte | app/views/home/** and app/views/layouts/** (review-related details only) | REIMPLEMENT as an English LOADOUT page in Next. Preserve semantic sections, SEO capability, and responsive patterns; remove Pixl game/lore, color identity, and proxy routes. |
| Login / auth | apps/server/src/routes/auth.ts; apps/server/src/auth/session.ts; dashboard auth routes | backend/src/auth/auth.service.ts; frontend/src/routes/auth/** | app/controllers/sessions_controller.rb | REFERENCE ONLY in this slice. Future LOADOUT auth requires its own approved flow. |
| Account/settings | apps/server/src/routes/profile.ts; apps/dashboard/app/** profile/account routes | frontend/src/routes/account/** where present | app/views/users/**; app/controllers/users_controller.rb | Defer; no copied settings UI. |
| Participant dashboard | apps/dashboard/app/**; dashboard review/project components | frontend/src/routes/dashboard/** | app/views/my/** and project cards | Defer full dashboard. Preserve small data-led status and empty-state patterns for later. |
| Project creation | apps/dashboard project forms; apps/server/src/routes/projects.ts | frontend/src/routes/projects/** and backend project DTOs | app/views/projects/** | Defer. LOADOUT must add Capability Statement and canonical track/mode selection. |
| Project detail | apps/dashboard project detail components; apps/server/src/routes/projects.ts | frontend/src/routes/projects/** | app/views/projects/_ship_card.html.erb | Defer; LOADOUT owns artifact/version and track-allocation presentation. |
| Journals / devlogs | apps/server/src/routes/journalsPublic.ts and dashboard journal components | frontend/src/routes/devlogs/**; backend/src/devlogs/** | app/models/post/devlog.rb | Defer; retain privacy and evidence-access review. |
| Submission / ship flow | apps/dashboard/app/review/**; apps/server/src/routes/projects.ts | frontend project submission and backend/src/reviews/** where available | app/models/post/ship_event.rb and ship-event tests | Defer. LOADOUT has selected team fit/validity review, 12 peer reviews, four 1–9 dimensions, journal-age and flag windows, and no post-window appeal; see Plan 22. |
| Reviewer / admin dashboard | apps/dashboard/app/review/** and app/_components/ReviewForm.tsx, ReviewTable.tsx, ReviewPipelineSteps.tsx | frontend/src/routes/**/admin and backend review modules | app/controllers/admin/payout_reviews_controller.rb, app/views/admin/payout_reviews/** | Defer. Adapt clear queues and audit trails, not source-specific review policy. |
| Shop | apps/landing/app/_components/Shop.tsx; dashboard shop configurators | frontend/src/routes/shop/** | Stardance shop is outside this narrow audit | Defer. Later explain Ore and field pricing from LOADOUT config. |
| Orders / fulfillment | Pixl dashboard order/shop routes and server shop integrations | backend/src/shop/shop.service.ts and order entities | Not audited as a Stardance specialist capability | Defer. Avoid displaying item availability or fulfillment promises now. |
| FAQ / docs | apps/landing/app/_components/FAQ.tsx; docs routes | frontend/src/routes/FAQ/** | public guide pages, outside the review-specific scope | ADAPT concise FAQ structure. Use LOADOUT wording and avoid unconfirmed rules/dates. |
| Mobile behavior | apps/landing/app/globals.css, apps/dashboard/hooks/use-mobile.ts | Svelte responsive route/component styles | Rails views and shared responsive layout | REIMPLEMENT responsive collapse with normal CSS; test navigation, grids, heading wrapping, and no horizontal overflow. |
| Empty / loading / error states | dashboard queue, reviews, and shop components | Svelte route loading/error boundaries | review and payout queue states | REFERENCE ONLY; show no fake projects or loading placeholders on the static homepage. |

### Homepage redesign handoff

The initial prototype was removed before publication. Stage A then restored a narrow Pixl landing baseline for local comparison. After the user's model change and explicit UI authorization, Stage B replaced it with the supplied LOADOUT paper-grid/pixel-cloud composition. Its four dark track cards are Tools, Systems, Compute, and Hardware; Research Mode is a separate strip. Section containers and motion are adapted from Pixl, while public copy, SVGs, metadata, and page identity are LOADOUT-owned.

The removed prototype used the planned graphite/orange/steel palette, grid-paper background, pixel headings, index labels, flat borders, and native details/summary controls. It was local and unpublished. The new LOADOUT design should follow plans/03 and plans/06; that prototype markup and styling are not in the current Pixl Stage A baseline.


## Source bases and versions

_Merged from `source-bases.md` on 25 Oct 2026._

Recorded 2026-10-10 from the pinned reference checkouts and GitHub metadata; Stardance was refreshed to upstream `main` on 2026-10-20 after reviewing the commits since the earlier pin. Each reference is an independent Git submodule under `references/`; the parent repository records only its URL and exact commit pointer. Initialize these top-level references with `git submodule update --init`. Commit IDs are immutable pins, not claims that upstream is still at its latest commit.

The expected top-level reference URLs and commit pins are maintained in [`reference-pins.tsv`](reference-pins.tsv). The repository-integrity workflow checks that manifest against `.gitmodules` and the committed submodule pointers. Updating a reference pin requires changing both the manifest entry and its Git submodule pointer; reference-only updates still run repository-integrity validation while skipping Landing checks.

| Source and role | Remote | Branch at audit | Exact SHA | License / permission basis | Reference path |
|---|---|---|---|---|---|
| Pixl — PRIMARY ENGINEERING BASE | https://github.com/hackclub/pixl.git | main | `8141b992e92e05583246fd914c63a101100f6fe4` | MIT; preserve the complete upstream notice available at `references/pixl/LICENSE`. Exceptions: `apps/pixorpheus` is AGPL-3.0, and third-party or purchased art, product photos, brand assets and fonts are not covered by MIT (see ATTRIBUTION.md). | `references/pixl/` |
| YSWS Template — GENERAL YSWS OPERATIONS / INFRASTRUCTURE REFERENCE | https://github.com/EDRipper/ysws-template.git | master | `1ac191fa5eee1e57983b29ab7101f700c166e207` | No root LICENSE or README in this checkout; repository license metadata is absent; `backend/package.json` says `UNLICENSED`. Reuse permitted by owner-stated permission, 2026-10-20 (evidence pending; see DECISIONS.md). Log any copied file. | `references/ysws-template/` |
| Stardance — PEER REVIEW / QUALITY SCORING / MULTIPLIER / VIRALITY / COMMUNITY POLL REFERENCE | https://github.com/hackclub/stardance.git | main | `5b6bfb86462e0edc68592d6985168d09543f00d5` | No LICENSE file found in the checkout and no reported repository license. Reuse permitted by owner-stated permission, 2026-10-20 (evidence pending; see DECISIONS.md). Log any copied file. | `references/stardance/` |
| Stasis — HACK CLUB HARDWARE HACKATHON / EVENT-PROGRAM REFERENCE | https://github.com/hackclub/stasis.git | main | `7a230ced9ad793f0ad4cda30a7d71c02a58da6b6` | No LICENSE file and no GitHub license metadata at this SHA (checked 2026-10-11; the SHA matches upstream main). Reuse permission reported by the project owner on 2026-10-11: an informal written reply from Hack Club (sender, date and channel still to be recorded). Scope: the components listed in DECISIONS.md, widened to all of Stasis by the owner-stated permission of 2026-10-20 (evidence pending; Stasis copy, artwork, photos and logos stay "not adopted" in DECISIONS.md until the owner decides otherwise). | `references/stasis/` in the workspace-restructure worktree (not a submodule of this checkout) |

### Verification

The original checkouts were clean at the recorded SHAs before being placed under `references/`. The LOADOUT tree pins those same commits as Git submodule entries. Verify the working references with:

```bash
git -C references/pixl rev-parse HEAD
git -C references/ysws-template rev-parse HEAD
git -C references/stardance rev-parse HEAD
git -C references/stasis rev-parse HEAD
git -C references/pixl status --short
git -C references/ysws-template status --short
git -C references/stardance status --short
git -C references/stasis status --short
```

To populate the top-level reference folders in a fresh clone, run `git submodule update --init`. Pixl and YSWS Template do not declare nested submodules in these pins. Stardance declares `references/stardance/secrets` at `f7c450aa3a128015a57681a9262b9db2dcf72385`, URL `../stardance-secrets.git` (GitHub `hackclub/stardance-secrets`). Initializing that nested submodule returned “Repository not found” on 2026-10-05. Its access is unavailable in this environment; do not recurse, vendor, or infer its contents. The pinned parent Stardance checkout is fully initialized and remains available for source reading.

### Scope boundaries

Pixl remains the primary engineering reference. A temporary landing subset was ported for Stage A verification, then replaced with the LOADOUT public homepage in the same Next.js app. Final source reuse is limited to the landing composition and adapted scrolling/navigation/motion patterns recorded in `landing-port-and-assets.md`. The temporary Pixl media and source-only pages were removed. YSWS Template, Stardance, and Stasis were reference-only until a reuse basis existed. Since 2026-10-20 the basis is the owner's stated permission (evidence pending; DECISIONS.md, ATTRIBUTION.md). Stasis has not received a comparative architecture audit.

The Stardance audit is reference-only and does not authorize Rails or source-code reuse. Its current public guide documents an external Virality Bonus: Good gives a flat Stardust bonus and rewards, while Great raises the hourly payout ceiling from 20 to 30. The submission path is behind the `virality_bonus` feature flag; inspection found a claim form and stored review fields, but no complete reviewer-resolution/payout path in the audited source. LOADOUT has selected an adapted Good/Great Signal policy in Plans 02 and 22, with its own Ore rewards and 30× Great ceiling. No Stardance implementation or assets are copied.

The new pin includes ten upstream commits since the previous revision: a Flipper-gated Jimberjake poll/vote flow (#1516), a fraud subject-queue correction (#1515), and eight dependency updates. LOADOUT has not selected a separate poll system, so this capability remains reference-only. No Stardance source code or assets are copied.

LOADOUT's canonical quality dimensions remain Originality, Technical Depth, Execution, and Documentation. Decisions on which Stardance review mechanics LOADOUT adopts are recorded separately in the active product-plan review; they do not grant permission to copy Stardance code or assets.

The optional Phantom Sans WOFF2 files are recorded as coming from Pixl's live site, not from the pinned checkout. The MIT entry above describes the pinned repository license and does not establish license coverage for these live font assets. No separate permission for them is recorded here.
