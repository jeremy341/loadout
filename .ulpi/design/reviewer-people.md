# Reviewer site: People pages (Players, Reviewers, Projects, Team and roles)

**Status:** round 4, 7 Nov 2026. Brought level with Pixl's internal dashboard (`references/pixl/apps/internal-dashboard`, commit 330ac8a2, 5 Nov 2026). Staff only, read only, sample data. Not reviewed by the owner.

## Parity table

| Pixl page or feature | Before | Action |
| --- | --- | --- |
| `players`: search, 25 a page, columns Player, Projects, Violations, Status, Joined | handle list with track chips | match: columns added (plus approved hours by track, which LOADOUT needs), page size 25, status reads the moderation records |
| `players`: mass action (warn, notify, ban, lift bans, message, title, ban hours, tick boxes) | none | match, disabled |
| `players`: Sync Slack photos | none | drop (Slack) |
| `players/[id]`: banned badge, stats (pixels, hours, projects, violations, reports) | facts and a role select | match: stats are Approved hours, Projects, Violations, Reports, Orders (no pixels). Role select removed: roles live on Team and roles, as in Pixl |
| player Moderate (warn, ban, lift ban, notify), Player info, Danger zone (erase) | warn and ban rail | match, disabled. Real name is not shown (children's legal names stay with the verification service). Reset position: drop (game) |
| player lists: projects, reports, violations, bans, moderation log; last known positions | projects, ships, links | match for all but positions (drop, game). Ships and review history kept (LOADOUT) |
| `projects`: search by name or number, Status, Owner, Links, Hackatime, Created, View archive, Export CSV | filters, no archive | match: number search, archive view (`?view=archived`) that holds archived, rejected and banned projects; owners see them mixed in, reviewers only active ones. Export is disabled. Send missing to Airtable: drop |
| `projects/[id]`: badges, rejected and banned callouts, stats, About, Commits, Journal, Staff notes, Review justifications, Review history, Staff actions (send back, archive, restore, lift ban, reject, ban, correct approved hours) | summary and journal | match. Beacon, Robert fraud review, Airtable record, double-dip banner, Trial badge (becomes an expedition line): drop or adapt. Hours cutoff: drop (a Pixl event date; no LOADOUT plan sets one). Correct approved hours works in Ore |
| `reviewers`: totals, add form, search, 15 a page, Reviewer, Reviews, Approved, Hours credited, Flags, Last review, Team log with undo | simple roster | match. Owners who review are listed with zero numbers. Flags are "under a minute" and "approved with the source never opened" |
| `reviewers/[id]`: 8 stats, review history, profile, message, queue access, permissions, remove | counts and recent decisions | match. AI draft and edit-submission permissions: drop |
| `admins`: owners (env), reviewers, fraud reviewers, helpers, fulfillers, payouts, team log | team table and role guide | match: owners, reviewers, helpers, fulfillers with add and remove, team log. Fraud reviewers and payouts: drop. The role guide, markers and rules stay below (LOADOUT) |

## Disabled and why
Every write (mass action, moderate, info, erase, add, remove, undo, staff actions, notes) sits in a disabled fieldset or a disabled button and says "Opens with the review service. Nothing here is saved." No server actions, no Prisma changes.

## Data
`lib/reviewer/people.ts`: players (standing, violations and bans read from `moderation.ts`), projects (from `REVIEW_SHIPS` plus unfinished and removed ones, with number, links, Hackatime, collaborators, removal), reviewer entries and stats (from the review sample's `Reviewer` and `REVIEW_AUDITS`), the team and its log. Tests in `people.test.ts`.

## Left out
Slack ids and photos, pixels, Beacon, Robert, Airtable, fraud reviewers, reviewer payouts, game positions, AI draft.
