# Participant platform: milestones and gates

**Status:** Planning only. Nothing in this file is built or approved for build. It sits under the approved feature scope in [future-platform-ui.md](future-platform-ui.md), which remains the authority for what is planned. Each milestone below starts only after its gate is met.

**Branch:** `feature/participant-platform-scope`, from `origin/development`. Not pushed.

## What exists today

- The public homepage and program-draft Docs in `apps/landing`. No accounts, no database, no participant data, no admin.
- The earlier Pixl-derived preview was removed. Its dashboard, shop and tab set are history, not a base to restore.

## Gates before any code

| Gate | Blocks | Owner | Status |
|---|---|---|---|
| G1. Hack Club teen verification and account integration confirmed | Every participant surface | Owner, with Hack Club | Open |
| G2. Data store and auth decided (one database, one auth path, least-privilege roles) | M1 onward | Owner and maintainers | Open |
| G3. Peer review model confirmed as removed; team acceptance is the only ship gate | Admin review queue | Owner | Decided 22–25 Oct 2026 (Plan 22 removed) |
| G4. Per-surface UI spec in `.ulpi/design/` | Each UI milestone | Implementer | Required before each surface |
| G5. Per-service data contract and privacy review (minors) | Each service | Owner | Required before each service |

## Milestones

**M0. Contracts, no UI.** Data contracts for accounts, projects, journals, ships, Ore ledger, orders, catalog, drops, workshops and votes. Privacy review of what a minor's record holds. Audit-log shape. No pages ship in M0.

**M1. Shell and builder dashboard, real data only.** One navigation shell in four groups of the loop: Build, Ship, Earn, Community, plus the profile. The dashboard shows only configured data. Before a count, balance or rank exists, the page shows an empty state, not a sample number. Accessibility defaults and display settings from the design system apply. Admin: the audit log exists from this milestone.

**M2. Projects, journals and team acceptance.** Project pages with Hackatime (software) or Lapse (hardware) links. Journal entries at least every 8 hours of development. Hardware bill of materials. Team acceptance queue for admins, with a written accept-or-reject reason. Public project pages and journals. Notification bridge for "your ship was accepted" and similar, built as LOADOUT's own Slack app, not the Netic-owned Orry bot.

**M3. Ore, catalog and orders.** Ore ledger with every approved hour at a fixed 10 Ore. Catalog, Field and General Requisitions, Custom Orders, wishlists. Admin order and fulfilment queue, balance adjustments with a required reason. Shop voting and limited drops are added here, behind feature flags. Drops use fixed stock and fixed Ore prices, never random or raffle selection.

**M4. Workshops, events and social.** Online workshops with RSVP, attendance and certificates. Event RSVPs. Friends, follows, likes, comments, public idea board, Show & Tell. No endless generic feed. Reposts stay out of scope.

**M5. Referrals, Usage Milestones and Missions.** Referral rules as in the approved scope. Missions with curated steps and configured rewards. Community Eras.

## Admin surfaces

Queue-first. Home shows what needs attention: ships to accept, orders to fulfil, verification pending. Records open in a side panel rather than their own page. Every admin write records an audit event with the actor and a reason.

Taken from the earlier audit and kept: user roles and bans, project state with reason, ledger adjustments with reason, fulfilment queue, catalog and coupon config, mission authoring, moderation reports, notify templates, audit log, feature flags.

Dropped: Blazer-style raw SQL access to participant data; impersonation (defer until the audit trail has been proven); Pixl's game currencies, Trials and NPCs; Stardance raffles, daily rolls and super stars; the pixelate command; Stasis event-lab inventory.

Deferred: Mission Control-style job dashboard, until payouts and order jobs exist.

Feature flags: a small database table, read by the app, used to stage shop voting, drops and workshops.

## Bridges

- **Notifications** (ship accepted, order shipped): a small authenticated service that sends Slack DMs with per-user and global rate limits. This is the pixo-dm pattern, built fresh for LOADOUT. Lands in M2.
- **GitHub notifications for the repo:** later, not in a milestone yet.
- **Orry and Goose Lee** stay separate Netic-owned Slack bots. LOADOUT does not send through them.

## Rules that apply to every milestone

- No live balance, count, rank, price, stock, order status or event detail without configured real data.
- Each surface follows [the UI skill guide](../../docs/development/ui-skills.md) and the [design system](../../docs/design/system/design-system.md).
- Keyboard, screen-reader, reduced-motion and responsive behaviour are part of each surface's acceptance.
- Minors' data: store the least needed, show each participant their own data, and keep admin reads audited.

## Open questions for the owner

1. G1: Is teen verification through Hack Club's account integration confirmed, and when?
2. G2: Which database and auth path? (Pixl used Postgres; Orry uses SQLite. Neither is decided for LOADOUT.)
3. Should M1 start before G1 is closed, using a local test account only?
4. Is an Orry-style help bot wanted for LOADOUT support, or is team acceptance enough for now?
