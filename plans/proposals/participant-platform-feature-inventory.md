# Participant platform: feature inventory from the references

**Status:** Planning only. This lists which surfaces, tabs, dashboards and admin panels the platform needs, where each comes from in the references, and which milestone it belongs to. Nothing here is built or approved for build. Product scope is in [future-platform-ui.md](future-platform-ui.md); milestones and gates are in [participant-platform-milestones.md](participant-platform-milestones.md); hosting is in [participant-platform-infrastructure.md](participant-platform-infrastructure.md).

**Owner decisions, 30 Oct 2026:** Hackatime OAuth for build linking; transactional email wanted; the platform will be hosted on Orchard.

## How to read this

- **Source** names the reference file or route the idea comes from. Pixl's participant shell is `references/pixl/apps/web-shell/app/(shell)/nav-data.ts`; its admin shell is `references/pixl/apps/dashboard/app/_components/Shell.tsx`; Stardance's routes are in `references/stardance/config/routes.rb`; Stasis's pages are under `references/stasis/app/`.
- **Milestone** is the first milestone in which the surface may ship (M0 to M5, from the milestones file).
- **Keep / Reshape / Cut** says what happens to the reference idea.
- Pixl's web-shell nav lists 13 tabs in three groups (Play 6, Economy 5, You 2) and its admin Shell lists about 20 items in six groups. The "23 tabs" figure in the older proposal does not match the code at these paths. This inventory uses the code.

## 1. Participant surfaces

| Surface | What it holds | Source | Milestone | Decision |
|---|---|---|---|---|
| Sign-in and account | HCA sign-in, Hackatime OAuth link, sign-out, session list | Stardance `auth/:provider/callback`, `auth/hackatime/callback`; Stasis `/dashboard/settings` | M1 (after G1, G2) | Keep, Reshape (Hackatime is OAuth, not an API key) |
| Overview (builder dashboard) | Level, active projects, next journal due, next step, notifications. Real data only; empty states until data exists | Pixl `OVERVIEW` (web-shell); Stasis `/dashboard` | M1 | Keep, Reshape |
| Projects list | Own projects by state (draft, in review, accepted, returned) | Pixl `PROJECTS`; Stasis `/dashboard/projects` | M1 | Keep |
| Project page (owner) | Build time from Hackatime or Lapse, journal timeline, BOM for Hardware, ship button | Stasis `/dashboard/projects/[id]`; Stardance `projects` routes | M2 | Keep, Reshape (8-hour journal rule, Lapse for hardware) |
| Journal entry editor | Text, attachments, linked build time | Stardance `devlogs`; Stasis session editor | M2 | Keep, Reshape (every 8 hours of development) |
| Ship flow | Pick the project, confirm source link and licence, submit for team acceptance, see status | Stasis `/dashboard/projects/[id]/session/new`; Stasis `ProjectSubmission` | M2 | Keep, Reshape (no peer review) |
| Public project page | Project, public journals, source link, ship status | Stardance `projects/:id`; Pixl public project pages | M2 | Keep (public by default, as scope states) |
| Discover | Browse public projects; no endless generic feed | Stasis `/dashboard/discover`; Stardance `search/projects` | M4 | Reshape (filters only) |
| Profile | Public profile, approved projects, achievements, followers | Stardance `@:username` tabs, followers and following; Stasis `/dashboard/profile/[id]` | M2 (profile), M4 (follows) | Keep |
| Notifications | In-app list; Slack DM and email for accepted or returned ships and order updates | Stardance `notifications`; Pixl `notify`; Stasis `slack-user-dm`, Loops | M2 | Keep (LOADOUT's own Slack app; email transactional only) |
| Ore and ledger | Ore balance, every credit and debit with its reason | Stardance `ledger_entries` (admin); Stasis `CurrencyTransaction`; Pixl `pixels` | M3 | Keep |
| Shop and catalog | Catalog, Field and General Requisitions, Custom Orders, wishlist | Pixl `shop`; Stardance `shop/items`; Stasis `/dashboard/shop` | M3 | Keep, Reshape (Ore prices, uniform across regions) |
| Orders | Order list, status, tracking | Pixl `ORDERS`; Stasis `/admin/shop-orders` (admin side; no participant order page under `/dashboard`) | M3 | Keep |
| Shop voting | Vote on proposed items | Stardance `shop` rate and votes (concept only) | M3, behind a flag | Add (owner decision) |
| Limited drops | Fixed stock at a fixed Ore price, never random | Stasis shop stock | M3, behind a flag | Add (owner decision), fixed stock only |
| Workshops | Online workshop listing, RSVP, attendance, certificate | Stardance `workshops`, `certificate`; Stasis `/certificate` | M4 | Keep, Reshape (online only; certificates per scope) |
| Events | Event list and RSVP. LOADOUT IRL details stay unconfirmed | Stardance `rsvps`, `events`; Stasis `/schedule` | M4 | Keep, Reshape (no logistics shown without real data) |
| Social | Follow, like, comment, idea board, Show & Tell | Stardance `feed_events`, `poll_votes`; Pixl `ideas`, `show-n-tell` | M4 | Keep (no repost, no endless feed) |
| Missions | Curated steps, prerequisites, submission, configured rewards | Stardance `missions`, `mission_submissions` | M5 | Keep, Reshape (no chance rewards) |
| Referrals | Referral link, status of each referred builder | Pixl `REFERS`; Stardance `referrals` | M5 | Keep, Reshape (qualifies only after a first approved ship) |
| Usage Milestones | Verified users of a project | Concept from scope | M5 | Keep, thresholds open |
| Eras and seasons | Current Era, progress | Scope; Plan 11 | M5 | Keep |
| Resources | Guides and free tools list | Stardance `resources` (guides); this repo's Docs | M2 (guides), later (free directory) | Keep, Reshape (the public Docs already exist in `apps/landing`) |
| Settings and privacy | Display preferences, accessibility defaults, data export, deletion request | Stasis `/dashboard/settings`; Stardance `privacy` | M1 (settings), M2 (export and deletion) | Keep (Stardance erasure pattern) |

## 2. Admin surfaces

Queue-first, as the milestones file says. Home shows what needs attention; records open in a side panel. Every write writes an audit event.

| Surface | What it holds | Source | Milestone | Decision |
|---|---|---|---|---|
| Admin home (queue) | Ships to accept, orders to fulfil, verification pending | Pixl `Overview`, `Needs review`; Stardance `admin/queue` | M2 | Keep |
| Team acceptance | Ship, fit check, written reason | Pixl `review`; Stardance `projects` approval routes | M2 | Keep, Reshape (no peer score, no peer flags) |
| Projects | Search, state with reason, restore, force state | Stardance `admin/projects`; Stasis `/admin/projects` | M2 | Keep |
| Users | Search, roles, bans with reason, identity links | Stardance `admin/users`; Pixl `Players`, `Bans`; Stasis `/admin/users` | M1 | Keep, Drop impersonation (defer) |
| Audit log | Every admin write: actor, reason, before and after | Stasis `/admin/audit`; Stardance `audit_logs` | M1 | Keep (first, before any admin write) |
| Feature flags | Flags for shop voting, drops, workshops | Stardance `feature_flags` (Flipper) | M1 (table), used from M3 | Keep, as a DB table (owner decision) |
| Notify and templates | Send DM or email to a group; email templates | Pixl `Notify`; Stardance `messages`, `email_templates` | M2 | Keep, with rate limits |
| Moderation | Reports, tickets, violations | Pixl `Moderation` group | M4 | Keep, reduced |
| Ledger adjustments | Adjust Ore with a required reason, reversal entries | Stardance `balance_adjustments`, `ledger_entries`; Stasis `/admin/currency` | M3 | Keep |
| Catalog and coupons | Items, prices in Ore, stock, requisition rules | Stardance `admin/shop/items`; Stasis `/admin/shop` | M3 | Keep, Reshape |
| Order fulfilment | Queue, hold, fulfil, tracking, rejection with reason | Stardance `admin/orders`; Stasis `/admin/shop-orders` | M3 | Keep |
| Drops and shop voting admin | Create a drop, set stock, read vote totals | Scope (added); Stasis shop stock | M3, behind a flag | Add |
| Workshops and events admin | Create workshop, attendance, certificates | Stardance `admin/workshops`; Stasis `/admin/events` | M4 | Keep |
| Missions admin | Authoring of steps, rewards, submissions review | Stardance `admin/missions` | M5 | Keep |
| Referrals review | Verify referral qualification | Stardance `admin/referrals` | M5 | Keep |
| Reviewers and admins | Staff list, role grants | Pixl `Reviewers`, `Admins`; Stardance `user-perms` | M1 (roles) | Keep |
| Slack lookup | Find a person by Slack ID for support | Pixl `Slack Lookup` | M2 | Keep, read-only, audited |

## 3. Cut from the references

| Reference surface | Why cut |
|---|---|
| Pixl `Trials & NPCs`, `Story`, `Players` map, `Online` | The open-world game is excluded |
| Pixl `Pixels`, `Community Goals` as currency | Pixl currencies are excluded; Ore only |
| Stardance raffles, daily rolls, Buku, super stars, streak credits | Chance-based rewards are excluded |
| Stardance `vote_flags`, `payout_reviews`, `vote_balance`, `fraud` dashboards | Peer review removed 22 Oct 2026 |
| Stardance Blazer raw-SQL access | Dropped; no raw SQL against participant data |
| Stardance impersonation | Deferred until the audit trail is proven |
| Stardance Mission Control jobs | Deferred until payouts and order jobs exist |
| Stasis inventory, tool rentals, NFC, printers, manufacturing | IRL event operations only, not online |
| Stasis tamagotchi, sidekick, sponsors, travel, flash, opensauce | Not in the scope |
| Stardance Gorse recommendations, Ferret search | Not needed at this size; use simple filters |
| Pixl `Forms` | Replaced by the forms the milestones need; reconsider later |

## 4. Open items for the owner

1. **Parents:** Stasis has a `/parents` page. Is any parent-visibility surface wanted for minors? The Orry plan holds this for a policy decision.
2. **Community chat or Slack-only:** is there any on-platform messaging, or only Slack DMs and the board?
3. **Usage Milestone and referral thresholds:** the scope marks these open. They can stay out of M5 until chosen.
4. **Shop voting rules:** who can vote, how often, and whether votes can move an item into the catalog.
5. **Workshop certificates:** who issues them and how they are verified.

## 5. Build order implied by this inventory

- **M0 (contracts, no UI):** data contracts for accounts, projects, journals, ships, ledger, orders, catalog, drops, workshops, votes; audit event shape; feature flag table.
- **M1:** sign-in, settings, overview with empty states, projects list, users, roles, audit log, flags. Shell navigation with four groups (Build, Ship, Earn, Community) plus profile.
- **M2:** project page, journals, ship flow, team acceptance, admin queue, notifications, public project and profile, guides.
- **M3:** Ore ledger, catalog, orders, fulfilment queue, adjustments, shop voting and drops behind flags.
- **M4:** workshops, events, discover, follows, likes, comments, idea board, Show & Tell, moderation.
- **M5:** referrals, Usage Milestones, missions and their admin, Eras and seasons.

## 6. Gates before any of this is built

- **G1** (teen verification through HCA) blocks sign-in and every participant surface. The milestones file asks whether M1 can start with a local test account only.
- **G2** (data store and auth) blocks M1 onward. See the infrastructure proposal.
- **G4** requires a `.ulpi/design` spec for each surface before its UI is written. No surface in section 1 or 2 has one yet.
- **G5** requires a privacy review of each service before it ships. Export and deletion (M1 settings, M2) come first.
