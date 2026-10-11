# Reference comparison

This dated audit compares the pinned Pixl, YSWS Template, and Stardance repositories with LOADOUT. It records patterns worth studying, not LOADOUT product policy. Stasis was added later as an event/program reference and has not yet been compared in this matrix. Exact pins, licensing, and reuse decisions are owned by [source bases](source-bases.md) and [decisions](decisions.md).

## Feature coverage

# Feature Audit Matrix

Source paths below are relative to the source named in each column. Local roots are `references/pixl/`, `references/ysws-template/`, and `references/stardance/`.

Reviewed source revisions are recorded in [source-bases.md](source-bases.md). Stardance was audited narrowly for peer-review/payout mechanics and the cross-cutting controls those mechanics use; unrelated Stardance product areas are out of scope.

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
| Peer/project ratings | Existing Pixl feedback/upvotes are not LOADOUT quality scores — IGNORE as an earning formula | Bot-review and human review flows — REFERENCE ONLY | app/models/vote.rb, app/models/vote/assignment.rb, app/models/vote/matchmaker.rb — REFERENCE ONLY | LOADOUT continues reviewer-scored Originality, Technical Depth, Execution, Documentation. |
| Rating reasons/feedback | Review notes and reviewer comments — ADAPT as UX pattern | Admin review feedback — REFERENCE ONLY | Vote#reason, app/views/votes/_scorecard.html.erb, app/views/projects/_payout_review_modal.html.erb — REFERENCE ONLY | Clear, actionable reviewer notes are recommended. Stardance’s ten-word minimum is not adopted. |
| Number of ratings / assignment | Pixl review assignment/claim patterns — ADAPT | Template review-queue assignment — REFERENCE ONLY | VOTES_REQUIRED_FOR_PAYOUT = 12; app/models/vote/assignment.rb and app/models/vote/matchmaker.rb — REFERENCE ONLY | No 12-vote requirement is adopted. |
| Aggregation / percentiles | No LOADOUT-compatible quality aggregation — IGNORE | No relevant peer-score policy found — REFERENCE ONLY | app/models/post/ship_event/payouts.rb — medians and midrank percentiles — REFERENCE ONLY | Median is robust to isolated scores but does not replace LOADOUT’s four reviewer dimensions. |
| Multiplier / payout lock | Existing Pixels/hour economics are not LOADOUT Bolts — IGNORE | Currency/shop config is conceptual reference only | payouts.rb, ship_event.rb, _payout_review_modal.html.erb — snapshot/preview states ADAPT; Stardust formula IGNORE | Keep distinct preview and immutable final award; compute LOADOUT Bolt multiplier from its own rubric/config. |
| Missing reviews / outliers | Review queue aging patterns — ADAPT | Return/review states — REFERENCE ONLY | payouts.rb and vote.rb; median aggregation, no explicit outlier-trimming stage found — REFERENCE ONLY | LOADOUT must define its own incomplete-review, reassignment, and outlier policy. |
| Abuse / moderation | apps/server/src/moderation.ts, src/ysws/doubleDip.ts — ADAPT | Review/report and audit flows — REFERENCE ONLY | app/models/vote.rb, app/models/vote/event.rb, app/jobs/vote/auto_discard_job.rb, app/controllers/admin/vote_flags/** — REFERENCE ONLY | Use audit events and reviewed flags as patterns. Stardance’s Secrets::VoteAutoDiscarder implementation is absent and cannot be evaluated. |
| Admin overrides / re-review / appeals | Reviewer second-pass and audit patterns — ADAPT | Return/review tracking — REFERENCE ONLY | Payout-review UI is read-only; participant flags can reopen the vote snapshot. No general post-payout appeal path was found — REFERENCE ONLY | Define LOADOUT appeals and override rights before launch. |
| Shop/fulfillment/regional pricing | apps/server/src/routes/shop.ts, dashboard shop configurators, fulfillers — ADAPT | backend/src/shop, HCB integration — REFERENCE ONLY | IGNORE — outside the Stardance specialist audit scope | Global Bolts and capped field pricing are new LOADOUT logic. |
| Uploads/CDN/sensitive evidence | apps/server/src/routes/uploads.ts, URL-safety modules — ADAPT | Silo/storage services — REFERENCE ONLY | Rails ActiveStorage and media workflows — REFERENCE ONLY | Recheck access and retention rules before using in a teen program. |
| Slack / notifications | apps/server/src/pixlSlack.ts, routes/notifications.ts, shipNotify.ts — ADAPT | backend/src/slack — REFERENCE ONLY | Vote events and notification jobs — REFERENCE ONLY | Optional Slack support; no DM/social scope in homepage MVP. |
| Config / deployment | packages/config, apps/landing/next.config.ts, Vercel/Orchard files — ADAPT only after removing Pixl endpoints | ysws.config.schema.json, Nest/Svelte dual deployment — REFERENCE ONLY | Rails/Coolify/Docker — IGNORE as architecture | Keep one LOADOUT-owned public config; no copied template schema. |
| Tests | Bun tests across server/dashboard/landing — ADAPT | Jest tests in NestJS — REFERENCE ONLY | Rails Minitest/Controller/model tests — REFERENCE ONLY | Test the landing route/component and build in the selected Next/Bun stack. |

## Stardance behavior noted

- app/models/vote.rb validates four integer dimensions on a 1–9 scale, requires a reason of at least ten words, blocks self-voting, and enforces unique voter/ship pairs.
- app/models/post/ship_event/payouts.rb waits for twelve countable votes; uses the first twelve ordered ratings, category medians, an overall average, and midrank percentile; locks vote IDs, score, hours, multiplier, curve version, and blessing before the payout window.
- The payout lock opens a 24-hour review window. A user can accept early or flag an included vote; a pending flag blocks automatic issue, an accepted flag discards the vote and clears the snapshot, and a rejected flag penalizes the flagger and forces payout.
- The final payout is issued transactionally/idempotently to a ledger; the admin queue itself is read-only.
- Median aggregation limits the influence of one extreme score; no explicit outlier detection or trimming stage was found in the inspected payout code.
- Vote::AutoDiscardJob delegates to Secrets::VoteAutoDiscarder, which is not in this checkout. Its actual scoring/abuse logic is unverified.
- Tests cover threshold gating, medians/percentiles, locked snapshot, idempotency, vote-deficit holds, accepted/rejected flags, auto-discard delegation, and admin/NDA-helper access. No dedicated matchmaker test file or general post-payout appeal flow was found in the inspected paths.


## UI and interaction coverage

# UI audit matrix

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
| Submission / ship flow | apps/dashboard/app/review/**; apps/server/src/routes/projects.ts | frontend project submission and backend/src/reviews/** where available | app/models/post/ship_event.rb and ship-event tests | Defer; fit, reviewer allocation, rubric, and appeal behavior remain LOADOUT policy. |
| Reviewer / admin dashboard | apps/dashboard/app/review/** and app/_components/ReviewForm.tsx, ReviewTable.tsx, ReviewPipelineSteps.tsx | frontend/src/routes/**/admin and backend review modules | app/controllers/admin/payout_reviews_controller.rb, app/views/admin/payout_reviews/** | Defer. Adapt clear queues and audit trails, not source-specific review policy. |
| Shop | apps/landing/app/_components/Shop.tsx; dashboard shop configurators | frontend/src/routes/shop/** | Stardance shop is outside this narrow audit | Defer. Later explain Bolts and field pricing from LOADOUT config. |
| Orders / fulfillment | Pixl dashboard order/shop routes and server shop integrations | backend/src/shop/shop.service.ts and order entities | Not audited as a Stardance specialist capability | Defer. Avoid displaying item availability or fulfillment promises now. |
| FAQ / docs | apps/landing/app/_components/FAQ.tsx; docs routes | frontend/src/routes/FAQ/** | public guide pages, outside the review-specific scope | ADAPT concise FAQ structure. Use LOADOUT wording and avoid unconfirmed rules/dates. |
| Mobile behavior | apps/landing/app/globals.css, apps/dashboard/hooks/use-mobile.ts | Svelte responsive route/component styles | Rails views and shared responsive layout | REIMPLEMENT responsive collapse with normal CSS; test navigation, grids, heading wrapping, and no horizontal overflow. |
| Empty / loading / error states | dashboard queue, reviews, and shop components | Svelte route loading/error boundaries | review and payout queue states | REFERENCE ONLY; show no fake projects or loading placeholders on the static homepage. |

## Homepage redesign handoff

The initial prototype was removed before publication. Stage A then restored a narrow Pixl landing baseline for local comparison. After the user's model change and explicit UI authorization, Stage B replaced it with the supplied LOADOUT paper-grid/pixel-cloud composition. Its four dark track cards are Tools, Systems, Compute, and Hardware; Research Mode is a separate strip. Section containers and motion are adapted from Pixl, while public copy, SVGs, metadata, and page identity are LOADOUT-owned.

The removed prototype used the planned graphite/orange/steel palette, grid-paper background, pixel headings, index labels, flat borders, and native details/summary controls. It was local and unpublished. The new LOADOUT design should follow plans/03 and plans/06; that prototype markup and styling are not in the current Pixl Stage A baseline.

