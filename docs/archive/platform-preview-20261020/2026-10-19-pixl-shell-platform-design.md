> **Archived 2026-10-20:** the Pixl-derived participant platform preview was removed from the repository. This record is kept for provenance; current product scope is in [Plan 06](../../../plans/06-public-homepage.md) and [the future-platform proposal](../../../plans/proposals/future-platform-ui.md).

# LOADOUT participant platform: Pixl shell and backend design

> **Status update, 2026-10-20.** Owner direction: the first platform port copies Pixl's participant shell (structure and code, minus the game) into a new `apps/platform`, restyled with the LOADOUT design system. It ships all 23 destinations from `apps/platform/components/shell/nav-data.ts` (Build 6, Community 7, Gear 6, You 4; Pixl's Report tab excluded). The first commit routed each tab to a "not available yet" page. A later owner instruction the same day ("remove all the not available yet and add real functions and placeholders so add all real functionality") replaced that: **the first milestone is working preview features on labelled sample data.** Every internal tab works in the browser, saves its state in `localStorage` (`apps/platform/lib/preview-store.ts`), and sends nothing to LOADOUT; Docs links out to the landing site. For the preview milestone only, that overrides "Do not ship navigation items to dead or placeholder pages" in section 6 and the non-goals on fake participant values in section 1. Safeguards stay: a preview note on every page, a "Preview: sample data" chip in the top rail, sample items labelled Sample, invented rules labelled "Draft preview rule", `noindex` pages, and `NavStatus` of `preview` or `live` (only Docs is `live`). The rule applies again afterwards; the retirement condition is in `docs/source-audit/DECISIONS.md` (2026-10-20, "Preview milestone ships working features on sample data"). The implementation is merged to `development` in PR #134. Phase 0 decisions (identity, database, hosting, operating owners) are still open, and nothing in this change adds sign-in or a backend. Phase 1's shell, Phase 0's source map (`docs/source-audit/pixl-platform-port-map.md`) and the scoped UI brief are the parts this change delivers; the Phase 1 exit gate (real sign-in entry points, platform CI jobs) is not met by it. Rules the plans leave open are listed in `docs/source-audit/platform-preview-open-questions.md`. Brief: [`.ulpi/design/participant-platform-shell.md`](participant-platform-shell.md). Source map: [`pixl-platform-port-map.md`](pixl-platform-port-map.md). Developer notes: [`docs/development/platform-preview.md`](platform-preview.md). The Slack scope post has not been sent; a maintainer must post it.

**Status:** Draft for owner review. This is a design specification, not permission to implement. The separate [implementation plan](2026-10-19-pixl-shell-platform.md) is also a draft; review and explicit authorization are required before code changes.

**Owner request:** Use Pixl's participant platform as the first-pass breadth and structure reference. Adapt the full global shell and backend capabilities to LOADOUT's product rules and visual system. Exclude Pixl's game and game-only features.

**Current baseline:** `apps/landing` is the public homepage and program-draft Docs. No participant accounts, project submissions, review service, Ore ledger, shop, orders, or community backend are live.

## 1. Goals and non-goals

### Goals

- Give LOADOUT participants one coherent logged-in platform for building, shipping, community participation, progression, and gear.
- Use Pixl's participant shell and backend as the primary engineering reference. Reuse MIT-licensed code when it fits, retaining its copyright and license notice.
- Make the complete interface LOADOUT-branded and consistent with the current design system, including mobile layouts and the existing optional accessibility preferences.
- Keep participant records and services grounded in real data and the product rules already owned by the canonical plans.
- Keep the existing public homepage and program Docs distinct from authenticated participant pages.

### Non-goals

- No Pixl game, open world, regions, NPC quest loop, Restoration Energy, game state, game-return link, or Pixl currency.
- No reuse of Pixl data, production credentials, service endpoints, account tokens, or game/backend integrations as LOADOUT configuration.
- No new or changed eligibility, scoring, pricing, payout, mission, referral, or privacy policy beyond the canonical plans.
- No fake participant balances, reviews, inventory, activity, order status, or event details.
- No microservices, separate event-lab system, or chance-based rewards in the first platform architecture. Keep backend domains modular inside one participant-platform runtime and revisit service extraction only if a real independent consumer or operational need appears.

## 2. Product decisions the platform must implement

Plans 01, 02, 11, 15, and 22 remain the policy sources. This spec does not restate their full rules or change them. Relevant contracts include:

- Hack Club teen verification is required; the exact authentication and verification integration still needs confirmation.
- Accepted projects are open source. Software requires Hackatime; Hardware requires Lapse. Journals are required at least every eight development hours; Hardware submissions include a bill of materials.
- Project pages and journals are public by default. Lapse recordings are visible only to reviewers; any other reviewer-only evidence follows the existing privacy rule.
- Team fit/validity review precedes 12 countable peer reviews. Reviews use four LOADOUT dimensions scored 1–9; Hardware follows the same peer-review path. Builders owe eight reviews before their own payout.
- Normal multipliers are 1×–20× with a 10× mean; Great Signal may reach 30×. Payout, flag windows, rejected-flag penalties, journal-age gate, and no-appeal policy follow Plan 22.
- Shop prices use Ore and remain the same across regions. Availability and delivery may differ. Wishlists, orders, Custom Orders, and Requisitions follow Plan 02.
- Structured missions, Seasons, Community Eras, achievements, streaks, leaderboards, social features, idea board, Show & Tell, events, referrals, and community rewards follow their canonical plans.
- No open-world game, daily rolls, or raffles.

## 3. Pixl-to-LOADOUT surface map

| Pixl surface or capability | LOADOUT first-pass treatment | Policy/data boundary |
|---|---|---|
| Participant shell, grouped navigation, active route, responsive sidebar/dock, overflow navigation | Adapt the shell structure and interaction patterns; replace routes, icons, copy, and styling with LOADOUT-owned equivalents | App shell is navigation only; no game/world route or launch link |
| Overview dashboard and profile | Build around track levels, seasons, achievements, approved ships, Ore, community progress, and notifications | Read from authenticated participant data; omit values until backed by services |
| Projects and project detail | Model LOADOUT projects, versions, tracks/modes, capability statement, source, demo, evidence, and public project pages | Ship/submission state and eligibility belong to LOADOUT; project privacy defaults come from Plan 01 |
| Hackatime, journals, evidence, and ship activity | Adapt the tracker/evidence integration structure and privacy-aware journal patterns; implement Lapse for Hardware | Tracker time is evidence, not approval; enforce allocation and journal rules from Plan 01 |
| Quests and Trials | Replace with LOADOUT's structured Missions, seasonal quests, Seasons, and Community Eras | No Restoration Energy, regions, NPCs, or open-world progression |
| Explore, leaderboard, ideas, Show & Tell | Adapt the public discovery and community surfaces selected for LOADOUT | Use real public projects and participant choices; follow the planned social/feed boundary |
| Shop and saved items | Adapt catalog browsing, search, filters, categories, product details, and wishlist patterns | Ore price, track discount, Requisitions, and Custom Orders follow Plan 02; no Pixl Pixels/hour formula or regional Ore price |
| Orders and fulfillment | Build a LOADOUT order history and status flow | Availability and delivery may vary by region; never promise stock or delivery without a real fulfillment source |
| Calculator and status rail | Recast as an Ore/rate/discount explainer and status summary | A calculator is an estimate; final multiplier depends on review and Signal policy |
| Referrals, collectibles, achievements, and notifications | Implement the features already selected for LOADOUT | Use existing plans for qualification, reward amounts, public visibility, and notification controls |
| Account, identity, and authorization | Use Pixl's separation of authenticated shell and protected routes as a reference; design LOADOUT integration independently | Do not copy Pixl OAuth/session cookies, token contracts, host routing, or permissions without an independent review |
| Staff dashboard and operations | Keep separate from the participant shell; use only selected queue/audit patterns when the operations plan is approved | Staff roles and overrides need LOADOUT-specific authorization and audit trails |

“Report” and any Pixl tab without a confirmed LOADOUT purpose remain out of the navigation until the owner assigns a clear job to the surface.

## 4. Experience structure

The participant app should use a persistent global shell around participant routes. Public marketing and Docs remain in their current public surface. Public project pages and journals can render without a session when their data is public; private evidence and participant operations remain protected.

Proposed navigation families are **Build**, **Community**, **Gear**, and **You**. Labels, order and groups now follow `apps/platform/components/shell/nav-data.ts` (23 tabs, Report excluded). The route inventory maps to:

- **Build (6):** Overview, Projects, Journals, Reviews, Missions, Docs (an external link to the public Docs).
- **Community (7):** Explore, Ideas, Show & Tell, Leaderboards, Seasons, Events, Friends.
- **Gear (6):** Shop, Wishlist, Orders, Collectibles, Referrals, Ore calculator.
- **You (4):** Profile, Achievements, Notifications, Account.

Desktop can use a grouped rail and status/header area. Phones should use a compact bottom navigation or an equivalent LOADOUT-native pattern with a reachable overflow sheet; the shell must not reserve a permanent side gutter or shift page content horizontally. Use the existing 44px touch-target, reflow, keyboard, screen-reader, focus, reduced-motion, and optional-setting requirements.

The shell's visual tokens come only from `docs/design/system/design-system.md`: dark graphite default, stone-paper alternate, LOADOUT accent roles, pixel signage, readable body type, square borders, and restrained depth. Pixl colors, type choices, logos, icon artwork, copy, and game styling do not transfer by default.

## 5. Backend and data boundaries

The backend is organized around LOADOUT domains, not a renamed Pixl schema. The default is one participant-platform deployable with server-only domain modules and one authoritative database. Keep the public landing app separate; do not add an independently deployed API service in the first pass. A narrow internal API boundary can serve future clients without turning every domain into a service.

1. **Identity and profile:** verified Hack Club identity, authorization, participant settings, profiles, and account lifecycle.
2. **Build evidence:** projects, versions, track allocation, journal entries, tracker links/snapshots, evidence visibility, and ship submissions.
3. **Review and award:** team fit/validity, reviewer assignment/debt, countable votes, flags, locked award snapshots, payout calculation, and the Ore ledger.
4. **Catalog and fulfillment:** products, global Ore price, track discounts, Requisitions, wishlist, order state, regional availability/delivery, and Custom Orders.
5. **Community and progression:** follows, likes, posts, comments, notifications, ideas/upvotes, missions, seasons/Eras, achievements, streaks, leaderboards, Show & Tell, events, and referrals.
6. **Operations:** moderator/admin access, review-quality tools, audit events, fulfillment operations, and support handoff.

The design should default to one LOADOUT-owned system of record and clear domain modules. Payout finalization and order/referral rewards need idempotency and auditable state changes. External integrations (Hack Club identity, Hackatime, Lapse, Slack, and fulfillment providers) sit behind narrow adapters with explicit consent, scopes, retries, and failure states. The implementation plan will choose the persistence, migration, deployment, and background-job topology after checking repository dependencies and available operations support.

Pixl source code may be adapted under its MIT license when a path is directly useful, with original notices preserved. Pixl schemas, migrations, example records, API secrets, OAuth callbacks, and service URLs are not transplanted as LOADOUT contracts. Every copied/adapted source path and target must be recorded in the source-attribution audit.

## 6. Recommended delivery sequence

This is a product sequence, not yet a task-level implementation plan:

1. **Foundation:** isolated participant app boundary, navigation map, LOADOUT shell, verified identity/authorization contract, database/migration strategy, shared domain contracts, and accessibility foundations.
2. **Build loop:** profile/dashboard, project/version/journal data, Hackatime/Lapse adapters, ship submission, team review, peer assignment/scoring, flags, payout snapshot, and Ore ledger.
3. **Gear loop:** catalog, discounts, wishlist, orders, fulfillment states, and Custom Orders.
4. **Progress and community:** Missions, Seasons/Eras, achievements, social actions, notifications, idea board, collectibles, leaderboards, Show & Tell, and referrals.
5. **Events and operations:** RSVP/certificates and LOADOUT IRL operational surfaces when their owners, dates, and integrations are ready.

Each phase should deliver one usable vertical slice with real contracts, loading/empty/error states, privacy behavior, accessibility review, and tests. Do not ship navigation items to dead or placeholder pages. Exception for the preview milestone: a preview tab may run on labelled sample data saved in the browser. It leaves the preview state when the real service for its phase replaces the sample data and the preview store.

## 7. Open architecture questions for the implementation plan

- Confirm the recommended boundary: keep `apps/landing` for public marketing/Docs and create a separate `apps/platform` Next app whose server-only modules and API routes form one modular-monolith participant runtime.
- Confirm Hack Club's supported identity/verification integration, privacy requirements, and role authority before designing session storage or account linking.
- Confirm how Lapse evidence can be securely stored and exposed only to reviewers.
- Select a database and migration owner; preserve atomic/idempotent award and order behavior.
- Confirm exact first-release feature subset and operations staffing for review moderation, fulfillment, and events.

## 8. Risks and success criteria

**Risks:** Pixl's pinned shell and current live site may differ; Pixl game assumptions are interwoven with shell routes and backend values; reviewer/payout and fulfillment operations create real-money-like trust and audit needs; tracker evidence and Lapse recordings require careful access control; a wide platform scope can leave a large but empty shell if phases lack vertical slices.

**Success criteria:** the LOADOUT shell works at desktop and phone sizes without shifting or clipping content; no route or backend behavior depends on Pixl game state; every displayed balance/order/review state comes from an owned LOADOUT record; the selected LOADOUT policy is enforced server-side; private Lapse evidence is inaccessible to the public; payout and reward writes are idempotent and auditable; Pixl attribution is preserved; and no feature is represented as live before its service and operating owner exist.

## 9. Review gate

Owner review is required for the proposed app/API boundary, phase order, and first-release feature subset. The separate [implementation plan](2026-10-19-pixl-shell-platform.md) records file-level tasks, dependencies, acceptance checks, migration/release gates, and unresolved service decisions. Neither document authorizes implementation by itself.
