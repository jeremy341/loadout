# Pixl-based LOADOUT participant platform implementation plan

> **Status update, 2026-10-20.** Owner direction: the first platform port copies Pixl's participant shell (structure and code, minus the game) into a new `apps/platform`, restyled with the LOADOUT design system. It ships all 23 destinations from `apps/platform/components/shell/nav-data.ts` (Build 6, Community 7, Gear 6, You 4; Pixl's Report tab excluded). The first commit routed each tab to a "not available yet" page. A later owner instruction the same day ("remove all the not available yet and add real functions and placeholders so add all real functionality") replaced that: **the first milestone is working preview features on labelled sample data.** Every internal tab works in the browser, saves its state in `localStorage` (`apps/platform/lib/preview-store.ts`), and sends nothing to LOADOUT; Docs links out to the landing site. For the preview milestone only, that overrides the Global constraints bullets "Show only real LOADOUT records and configured services. No seeded fake balances..." and "Do not show navigation links to unimplemented modules", and the Phase 1 bullet "Build navigation from implemented/enabled routes". Safeguards stay: a preview note on every page, a "Preview: sample data" chip in the top rail, sample items labelled Sample, invented rules labelled "Draft preview rule", `noindex` pages, and `NavStatus` of `preview` or `live` (only Docs is `live`). The rule applies again afterwards; the retirement condition is in `docs/source-audit/DECISIONS.md` (2026-10-20, "Preview milestone ships working features on sample data"). Implementation is in progress on `feature/platform-shell`. Phase 0 decisions (identity, database, hosting, operating owners) are still open, and nothing in this change adds sign-in or a backend. Phase 1's shell, Phase 0's source map (`docs/source-audit/pixl-platform-port-map.md`) and the scoped UI brief are the parts this change delivers; the Phase 1 exit gate (real sign-in entry points, platform CI jobs) is not met by it. Rules the plans leave open are listed in `docs/source-audit/platform-preview-open-questions.md`. Brief: [`.ulpi/design/participant-platform-shell.md`](../../../.ulpi/design/participant-platform-shell.md). Source map: [`pixl-platform-port-map.md`](../../../docs/source-audit/pixl-platform-port-map.md). Developer notes: [`docs/development/platform-preview.md`](../../../docs/development/platform-preview.md). The Slack scope post has not been sent; a maintainer must post it.

**Status:** Draft for owner review. Planning only; this file does not authorize code changes, service setup, or deployment.

**Goal:** Build LOADOUT's future participant platform using Pixl's participant shell and backend capability breadth as the first-pass reference. Keep LOADOUT's public landing app separate, adapt the product rules and design system, and leave out Pixl's game and game-only systems.

**Source of truth:** [Platform design spec](../specs/2026-10-19-pixl-shell-platform-design.md), [future platform scope](../../../plans/proposals/future-platform-ui.md), and canonical Plans 01, 02, 11, 15, and 22. The product plans own policy; this document owns proposed engineering sequence only.

**Reference baseline:** Pixl at `8141b992e92e05583246fd914c63a101100f6fe4` in `references/pixl/`, MIT. Its dashboard, web shell, and server are separate apps; the server includes game, Pixl OAuth, Slack, Pixorpheus, Hackatime, database, and operations coupling. Use Pixl code only where it is independently useful and legally covered. Map every adaptation; do not transplant Pixl's schemas, secrets, endpoints, hostnames, credentials, OAuth/session contract, participant data, or game behavior.

## Proposed architecture

The current repo has a Bun workspace containing only `apps/landing`, a static public Next.js application. The recommended target is a separate participant app at `apps/platform`, using Next.js and server-only domain modules as one modular-monolith runtime. Keep `apps/landing` independent. Use one LOADOUT-owned system of record and a single migration path. Do not split services in the first release.

This is a recommendation, not a settled deployment contract. Before implementation, the owner must choose the app/runtime boundary, identity and verification integration, database and migration owner, Lapse storage/access model, job runner, deployment and domain, and operating owners. If these choices differ from the recommendation, update the plan before coding.

## Global constraints

- Start implementation on a short-lived branch from the then-current `origin/development`, following `docs/development/WORKFLOW.md`. Preserve the existing dirty checkout and its pending work.
- Treat `references/pixl/` as read-only. Keep the Pixl MIT notice and record exact source-to-target mappings for copied or adapted code and assets.
- Never include Pixl's open world, map/regions, NPCs, Restoration Energy, game login/return links, Pixl currencies, game state, or game-dependent service calls. LOADOUT Missions use a structured participant interface.
- Keep all UI in the LOADOUT design system and preserve its accessible defaults and optional preferences. Pixl contributes structure and useful interaction patterns, not its brand, colors, typography, icons, copy, or visual assets by default.
- Follow canonical product policy. Do not invent or silently change eligibility, review, multiplier, Signal, Ore, shop, referral, privacy, event, or fulfillment rules.
- Enforce authorization and privacy on the server. Public projects and journals follow their public-by-default rule. Lapse recordings remain reviewer-only, including object-storage access and generated URLs.
- Show only real LOADOUT records and configured services. No seeded fake balances, reviews, rankings, products, orders, users, event details, or activity outside isolated tests.
- Do not expose live identity, evidence, financial-like award records, or operations before the identity, privacy, access, audit, and support owners are ready.
- Do not show navigation links to unimplemented modules. Release each route with a working slice or keep it out of the enabled navigation.
- Preview exit rule, Phases 2 to 7: a module that has a preview feature is finished when its preview store and sample seed are replaced by the real service (identity, database, review, award, shop, community) and its Preview tools are removed. Swap the data source, keep the page contract, and delete the "Draft preview rule" values the plans now settle.

## Phase 0: Resolve the platform contract

**Files:**

- `docs/development/participant-platform-architecture.md` (new architecture decision record)
- `docs/source-audit/pixl-platform-port-map.md` (new source map)
- `docs/superpowers/specs/2026-10-19-pixl-shell-platform-design.md`
- `plans/proposals/future-platform-ui.md`

- [ ] Inspect the pinned Pixl shell, dashboard, and server by capability. Record each candidate as **adapt**, **reimplement**, **reference only**, or **exclude**, with exact source paths and game-coupling notes.
- [ ] Confirm or revise the separate `apps/platform` boundary and modular-monolith recommendation.
- [ ] Confirm the Hack Club identity/verification integration, authoritative participant identifier, account linking, session lifecycle, and required scopes with the service owner.
- [ ] Choose the LOADOUT database, migration tool/owner, backup and restore approach, and transaction/idempotency model.
- [ ] Choose private media storage, reviewer authorization, link expiry, retention/deletion, and access auditing for Lapse evidence.
- [ ] Choose background-job/scheduler support, deployment host and hostname, preview behavior, and secret ownership.
- [ ] Name the operational owners and response path for participant verification, review moderation, fulfillment, account support, and event operations.
- [ ] Select the first releasable feature slice and define which modules are hidden until each slice has a working backend.
- [ ] Update the spec and this plan with the decisions. Stop here if a decision required to protect participant data or award integrity is still missing.

**Exit gate:** Owner-reviewed architecture record; source map; named service and operational owners; and a feasible first release that does not depend on Pixl production services.

## Phase 1: Participant app and LOADOUT shell

**Files (proposed):**

- `package.json`, `bun.lock`
- `apps/platform/package.json`, `apps/platform/next.config.ts`, `apps/platform/tsconfig.json`
- `apps/platform/app/layout.tsx`, `apps/platform/app/globals.css`
- `apps/platform/app/(participant)/layout.tsx`
- `apps/platform/components/shell/**`, `apps/platform/lib/navigation.ts`
- `.ulpi/design/participant-platform-shell.md` (scoped UI brief)
- Platform-specific CI workflow or jobs in `.github/workflows/ci.yml`

- [ ] Add the approved app to the Bun workspace without changing public landing behavior or its deployment.
- [ ] Create the participant shell with LOADOUT's approved grouped navigation, account area, status summary, page container, and responsive phone navigation/overflow.
- [ ] Use the LOADOUT design tokens and supported theme/accessibility settings. Keep keyboard order, focus visibility, screen-reader names, reflow, touch targets, and reduced motion usable.
- [ ] Build navigation from implemented/enabled routes; do not expose empty Pixl tabs or unbuilt LOADOUT modules.
- [ ] Add environment validation and a local configuration example containing names only, never secrets.
- [ ] Add isolated platform lint, typecheck, unit, build, and browser checks to CI. Keep them separate from existing Landing checks and define required status checks through the documented workflow.
- [ ] Verify the public landing app still builds and works independently; verify the participant app's shell at desktop and phone widths and with keyboard/reduced-motion settings.

**Exit gate:** A deployable shell with real sign-in entry points and working routes only; no placeholder participant values; independent Landing and Platform checks are green.

## Phase 2: Identity, eligibility, profile, and overview

**Files (proposed):**

- `apps/platform/modules/identity/**`
- `apps/platform/modules/profile/**`
- `apps/platform/app/api/auth/**` (or the route structure selected in Phase 0)
- `apps/platform/db/schema/identity.ts`, `apps/platform/db/migrations/**`
- `apps/platform/lib/auth/**`, `apps/platform/lib/env.ts`
- `apps/platform/app/(participant)/overview/**`, `apps/platform/app/(participant)/account/**`

- [ ] Implement the confirmed Hack Club sign-in and required teen verification through a narrow LOADOUT adapter. Do not reuse Pixl's OAuth callback or session token format.
- [ ] Enforce authorization on the server, including participant ownership and staff roles. Add account linking, verification failure, revocation, and support states defined by the approved contract.
- [ ] Implement profile and account settings with minimal stored personal data and documented retention/deletion behavior.
- [ ] Implement an overview backed by real participant records: approved projects, track/Season progress, achievements, Ore, and notifications only when their owning services exist.
- [ ] Keep unreleased values absent rather than substituting example values.

**Exit gate:** Verified test accounts can sign in and access only their own protected data; public pages do not reveal private identity or evidence; operations can revoke access using the approved support process.

## Phase 3: Projects, evidence, journals, and ship submission

**Files (proposed):**

- `apps/platform/modules/projects/**`
- `apps/platform/modules/evidence/**`
- `apps/platform/modules/journals/**`
- `apps/platform/modules/integrations/hackatime/**`
- `apps/platform/modules/integrations/lapse/**`
- `apps/platform/app/(participant)/projects/**`, `apps/platform/app/(participant)/ships/**`
- `apps/platform/app/(public)/projects/[slug]/**`
- `apps/platform/db/schema/projects.ts`, `apps/platform/db/schema/evidence.ts`, `apps/platform/db/migrations/**`

- [ ] Model LOADOUT projects, collaborators, versions, tracks/modes, journals, evidence, and ship submission from LOADOUT policy. Do not import Pixl project rows or schemas.
- [ ] Connect Hackatime for software and Lapse for Hardware through adapters whose access scopes, consent, retries, and error behavior were approved in Phase 0.
- [ ] Implement the eight-hour journal cadence and Hardware bill-of-materials requirement. Tracker hours remain evidence; the team decides eligibility under Plan 01.
- [ ] Enforce open-source and required-evidence checks at submission. Keep project pages and journals public by default, with reviewer-only evidence protected server-side.
- [ ] Serve Lapse recordings only after reviewer authorization; never expose public object URLs or accept client-asserted reviewer identity.
- [ ] Implement project/version history and public project pages using only participant-approved public fields.
- [ ] Add duplicate-time and project-allocation safeguards only to the extent already specified in canonical policy; record unresolved enforcement behavior for owner decision instead of inventing penalties.

**Exit gate:** A verified participant can create a real project, attach compliant evidence, journal, and submit a ship; unauthorized users cannot read reviewer-only evidence; public project data follows the selected disclosure rules.

## Phase 4: Team review, peer assignment, and award ledger

**Files (proposed):**

- `apps/platform/modules/reviews/**`
- `apps/platform/modules/awards/**`
- `apps/platform/modules/ore-ledger/**`
- `apps/platform/app/(participant)/reviews/**`, `apps/platform/app/(participant)/ships/[id]/reviews/**`
- `apps/platform/app/(staff)/review-operations/**`
- `apps/platform/db/schema/reviews.ts`, `apps/platform/db/schema/awards.ts`, `apps/platform/db/schema/ledger.ts`, `apps/platform/db/migrations/**`

- [ ] Implement the team fit/validity gate, then assign peers until there are 12 countable votes for every Hardware and software ship. Enforce reviewer exclusions and one-active-assignment rules from Plan 22.
- [ ] Require four 1–9 ratings and a written reason of at least ten words. Show builders anonymous scores/reasons on their own ship; allow authorized moderators to inspect reviewer identity and review quality.
- [ ] Lock the first 12 countable reviews in creation order; calculate category medians, mean-of-medians, percentile, and the versioned multiplier from Plan 22/Plan 02.
- [ ] Require the eight-review duty before a builder's payout. Keep exact debt/restoration behavior open until policy owners decide it.
- [ ] Block award locking until both 12 countable reviews exist and at least 24 hours have passed since the latest attached journal. Start the 24-hour flag window only after the locked snapshot; hold payout on pending flags; replace upheld reviews and create a new snapshot/window.
- [ ] Apply the three-rejected-flags-within-ten-hours penalty as five percent of the builder's next final Ore payout, after bonuses and adjustments, as specified in Plan 22. Do not add an appeal route.
- [ ] Issue Ore and Track XP using an immutable award snapshot and an idempotent ledger transaction. Record policy version, inputs, actor, transition, and correction history.
- [ ] Implement Good/Great Signal evidence and the Great 30× ceiling only from Plan 02. Do not stack a separate 30× bonus on top of the hourly rate.
- [ ] Add moderator review-quality tooling and audit events; restrict it by LOADOUT roles and log moderator actions.

**Exit gate:** A controlled end-to-end ship reaches review and payout exactly once; concurrent retries cannot double-award; every gate, flag, replacement, and moderator action is auditable; participants cannot see reviewer identities or private evidence.

## Phase 5: Shop, wishlist, orders, and fulfillment

**Files (proposed):**

- `apps/platform/modules/catalog/**`
- `apps/platform/modules/orders/**`
- `apps/platform/modules/fulfillment/**`
- `apps/platform/app/(participant)/shop/**`, `apps/platform/app/(participant)/wishlist/**`, `apps/platform/app/(participant)/orders/**`
- `apps/platform/app/(staff)/fulfillment/**`
- `apps/platform/db/schema/catalog.ts`, `apps/platform/db/schema/orders.ts`, `apps/platform/db/migrations/**`

- [ ] Implement catalog search, filters, categories, product detail, and wishlist patterns using LOADOUT styles and real configured catalog data.
- [ ] Use global Ore prices. Apply only approved track discounts, Requisitions, and Custom Order rules from Plan 02.
- [ ] Represent regional availability and delivery honestly; connect orders to an actual fulfillment source before displaying a promise or accepting a redeemable order.
- [ ] Reserve/deduct Ore and create orders atomically with idempotency and an auditable status history. Define cancellation, stock correction, and support paths before enabling orders.
- [ ] Exclude Pixl Pixels/hour formulas, Pixl inventory, regional Ore prices, and shop suggestion voting.

**Exit gate:** Participants can save items and, only where fulfillment is operational, submit an eligible order with a correct balance and traceable status. No order can be redeemed twice.

## Phase 6: Community, missions, and progression

**Files (proposed):**

- `apps/platform/modules/community/**`
- `apps/platform/modules/missions/**`
- `apps/platform/modules/progression/**`
- `apps/platform/modules/notifications/**`
- `apps/platform/app/(participant)/explore/**`, `ideas/**`, `show-and-tell/**`, `leaderboards/**`, `missions/**`, `seasons/**`, `eras/**`, `referrals/**`, `collectibles/**`
- Corresponding schema and migrations under `apps/platform/db/`

- [ ] Implement selected follows, friends, likes, comments, and post notifications without an endless-scroll feed or repost feature in the initial scope.
- [ ] Implement the public idea board/upvotes and Show & Tell with moderation, visibility, and abuse-handling rules.
- [ ] Implement structured Missions, prerequisites, Seasons, Community Eras, achievements, streaks, leaderboards, collectibles, and community rewards from their canonical policy owners.
- [ ] Implement referrals only with the agreed qualification path; keep reward amounts and Usage Milestone thresholds open until Plan 02 closes them.
- [ ] Add the one-time +50 Ore achievement for the first meaningful external contribution as defined by Plan 02.
- [ ] Avoid open-world maps, NPC quests, Restoration Energy, daily rolls, raffles, and any game loop.

**Exit gate:** Each enabled community/progression surface has defined moderation, privacy, reward, and notification behavior and reads real records; incomplete modules remain out of navigation.

## Phase 7: Events, staff operations, and release readiness

**Files (proposed):**

- `apps/platform/modules/events/**`
- `apps/platform/modules/operations/**`
- `apps/platform/app/(participant)/events/**`
- `apps/platform/app/(staff)/**`
- `.github/workflows/ci.yml`, deployment configuration selected in Phase 0, `docs/development/architecture.md`, `docs/development/WORKFLOW.md`, `docs/source-audit/ATTRIBUTION.md`, `docs/source-audit/pixl-platform-port-map.md`

- [ ] Implement event RSVPs and certificates only after event details, capacity, cancellation, and operational owners are configured. Keep LOADOUT IRL as a future event until dates and venue are confirmed.
- [ ] Add staff tools for verification support, review queues, moderation, account support, order fulfillment, and audit search with least-privilege roles.
- [ ] Keep Stasis lab inventory, NFC checkout, tool rental, printer queues, and manufacturing operations outside the online platform; revisit only for a staffed IRL event plan.
- [ ] Add migration backup/restore rehearsal, security/privacy review, retention/deletion checks, error monitoring, abuse/rate-limit review, and incident/support runbooks.
- [ ] Configure preview and production deployments without importing Pixl service URLs or secrets. Confirm the participant hostname and linking from the landing app before publication.
- [ ] Extend CI for platform tests and migrations, run the agreed release checks, and add only verified required status checks. Never use a CI skip as evidence for a changed platform surface.
- [ ] Update architecture, source attribution, setup, public Docs, and plan indexes only when the corresponding capability is actually ready and the public copy is approved.

**Exit gate:** Named owners can operate identity, moderation/review, fulfillment, and support; backup/restore and incident paths are proven; the production release reflects only enabled features and verified services.

## Verification strategy for implementation

For each phase, add focused unit tests for domain rules, integration tests against an isolated owned database, authorization/privacy tests, migration checks, and browser coverage for the user-visible route. Use synthetic records only in isolated test environments. Before production, run role-based access checks, multi-user isolation, duplicate/retry tests for awards/referrals/orders, Lapse access tests, mobile/keyboard/reduced-motion checks, migration restore rehearsal, and a manual operational walkthrough with the named owners.

The current Landing test suite does not validate participant behavior. Add Platform checks to CI as part of Phase 1 and verify the workflow on a PR before relying on it. Test commands and coverage are to be selected with the approved stack; this planning pass runs no implementation tests.

## Approval gates and unresolved decisions

1. **Plan gate:** Owner reviews this sequence, the source map, and the proposed `apps/platform`/modular-monolith direction.
2. **Architecture gate:** Before code, record identity, database/migrations, Lapse storage, jobs, deployment, privacy/retention, and operating owners in the Phase 0 decision record.
3. **Pilot gate:** Before accepting participants or real evidence, verify identity, access controls, support and moderation capacity, and real data lifecycle.
4. **Award gate:** Before any Ore award, verify review assignment, payout snapshots, flag handling, idempotent ledger writes, and auditability end to end.
5. **Shop gate:** Before any redemption, confirm live stock, fulfillment, Ore reservation/refund, and support processes.
6. **Release gate:** Ship through the repository's feature PR → development → testing → main workflow; production deployment is a separate owner-approved release action.

No code, service, database, Slack, DNS, or deployment changes are included in this draft. Implementation begins only after the plan and architecture gate are approved.
