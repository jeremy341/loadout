# Reviewer site (staff only, sample data)

**Status:** built on `feature/participant-platform-m1`, 6 Nov 2026; moved onto its own host the same day (owner, 12 Nov session: reviewer and admin stuff is separate from the application users see). Round 4 (7 Nov 2026) brought the site to parity with Pixl's latest internal dashboard (`references/pixl/apps/internal-dashboard`, commit 330ac8a2): its nav, command palette, paths, Overview, Settings and Budget. Not reviewed by the owner yet. Everything is sample data and read only: no writes, no migrations.
**Owner of the rules:** `plans/01-product-and-program.md` sections 4.5, 4.7, 5, 6.4, 8 and 35. Pixl's pages are the structural reference; its look is not used.

## Host model (a separate site)

The reviewer site is not part of the participant dashboard and has no tab in its top bar. It answers on its own host, as Pixl's reviewer dashboard does on its own subdomain.

- Any host whose first label is exactly `review` (`review.localhost:3011` in development, a `review.<domain>` address in production) is the reviewer site. `reviewer.example.com`, `localhost:3011` and `www.example.com` are not. The rule is `isReviewHost` in `lib/reviewer/host.ts`, with unit tests.
- `proxy.ts` (the Next 16 name for middleware) rewrites that host into the internal route tree `app/(reviewer)/reviewer/...` and sets `X-Robots-Tag: noindex`. On every other host `/reviewer` and everything under it answers 404, in development too. The reviewer layout checks the host again. The path model did not change in round 4; only the paths did (below).
- Old addresses: `movedTo` in `lib/reviewer/host.ts` maps the pre-Pixl addresses (`/ship/[id]`, `/hardware`, `/second-pass`, `/spot-check`, `/reviewed`, `/stats`, `/log`, `/guidelines`, `/proposed-bans`, `/goals`, `/show-and-tell`) to their new ones and the proxy answers them with a 308 on the review host, keeping the query. `/` used to be the queue and is now the Overview, so it cannot be redirected.
- Links on the review host are root-relative, never `/reviewer/...`. The client nav accepts either form when it marks the current page (`publicPath`).
- Participant side: no staff group in the top bar, ever. A staff person on the participant site sees exactly what a builder sees.
- Session cookie caveat: no sign-in exists yet (local test accounts skip cookies), so sharing a session between the main host and `review.<domain>` is not solved here. When Hack Club Auth is connected, decide the cookie domain before the reviewer site opens.

## Paths (round 4)

Pixl's paths, except where noted. The folders under `app/(reviewer)/reviewer/` were moved with `Move-Item`; route groups in brackets are not part of the address.

| Address | Was | Note |
| --- | --- | --- |
| `/` | the queue | The owner Overview. Other roles go to `landingFor`. |
| `/review`, `/review/hardware`, `/review/reviewed`, `/review/stats`, `/review/spot-check`, `/review/log`, `/review/guidelines`, `/review/proposed-bans`, `/review/audit` | `/`, `/hardware`, `/reviewed`, ... | Pixl's `/review/(tabs)`. `/review/second-pass` is gone (Pixl has no second-pass queue). |
| `/review/[id]` | `/ship/[id]` | Pixl's project desk. |
| `/players`, `/players/[id]`, `/projects`, `/projects/[id]`, `/reviewers`, `/reviewers/[id]` | same | Pixl's names. |
| `/admins` | same | Shown as "Team and roles", as in Pixl. |
| `/tickets`, `/tickets/[id]` | same | `[id]` is ours; Pixl's tickets page is one list. |
| `/fulfilment`, `/fulfilment/label/[id]`, `/fulfillers`, `/fulfillers/[id]` | same | Pixl spells it `/fulfillment`. We keep the British `fulfilment` for the pages and the nav; `/fulfillers` keeps Pixl's spelling of the person. A deliberate difference. |
| `/shop`, `/shop/[id]` | same | Pixl's `/shop-detail` is a per-item price audit by region. Ours is a normal detail page, which is the clearer word. |
| `/events`, `/referrals`, `/forms`, `/ideas`, `/reports`, `/reports/[id]`, `/violations`, `/bans`, `/notify` | same | Pixl's names. `/operations` (Pixl's is the blackout page) and the lookup page were dropped; the Overview and Budget cover their ground. |
| `/community-goals` | `/goals` | Pixl's name. |
| `/show-n-tell` | `/show-and-tell` | Pixl's name. |
| `/expeditions` | same | Pixl's `/sidequests`; "expedition" is the LOADOUT word. |
| `/news`, `/flags`, `/audit` | same | LOADOUT's own pages, not in Pixl (Pixl removed news and its audit log page on 12 Oct). `/audit` is the staff action log; Pixl's `/review/audit` is the reviewers' audit notes, a different page. |
| `/budget` | new | Pixl's `/budget`, adapted. |
| `/settings` | new | Pixl's `/settings`, adapted. Open to every role. |
| `/login`, `/removed` | not built | The site answers 404 to anyone without a role, so it does not advertise itself (Pixl redirects them to its login and "removed" pages). |

## The shell (Pixl's TopNav, CommandPalette and nav model)

`lib/reviewer/nav.ts` is a port of Pixl's `app/_ui/nav.ts`. `buildNav(access)` returns `{ primary, groups }`: a few primary links and five sections for the More menu. Every item carries `requires` (what its own page asks for with `requireAccess`), and `nav.test.ts` reads every page file and checks the two agree, so the nav cannot offer a page to a role the page turns away. `show` is the finer display rule (an owner has Tickets under More, a helper has it in the bar). `activeNavHref` is Pixl's longest-href-wins rule, applied to the public path.

| Pixl | Ours | Action |
| --- | --- | --- |
| Bar: Overview, My stats, Review, Fraud reviews, Projects, Players, Tickets, Fulfillment | Overview, My stats, Review, Projects, Players, Tickets, Fulfilment | Matched. Fraud reviews dropped (Robert and Fraudy scoring). Count badges on Review (queue), Tickets, Fulfilment, and on More (sum of its items). |
| More: Queues | Queues (Tickets, Fulfilment, owner only) | Matched. |
| More: Economy (Pixels, Budget, Shop, Shop detail, Events, Operations, Referrals) | Shop and money (Budget, Shop, Events, Referrals) | Adapted: pixels and regional shop detail dropped. |
| More: World (Trials and NPCs, Story, Community goals, Show & Tell) | Community (Expeditions, Community goals, Show & Tell, News) | Adapted: story dropped, Trials and NPCs are Expeditions, News is ours. |
| More: Moderation (Reports, Violations, Bans, Ideas) | Moderation (same four) | Matched. |
| More: Admin (Reviewers, Team & roles, Notify, Forms) | Admin (Reviewers, Team and roles, Fulfillers, Notify, Forms, Flags, Audit log) | Matched, plus LOADOUT's own admin pages. |
| `<details>` mega menu closed on navigation, outside click and Escape | Same, in `ReviewerNav.tsx`; Escape returns focus to the button. A full-width panel under the header on wide screens, an accordion inside the menu on phones. | Matched. |
| Command palette `<dialog>`, Ctrl+K, pages, players, projects through `/api/search` | `CommandPalette.tsx`: `/` or Ctrl+K opens it, results are links, Up and Down move focus, Enter opens, Escape closes. The index (`lib/reviewer/palette.ts`) is built on the server for the signed-in role: pages from the nav, and sample players (owner), projects and ships (reviewer, a one-queue reviewer sees only their queue), orders (fulfiller), tickets (helper). | Adapted: no database, so no API route; the role filter runs on the server. Two letters must start a word, three may sit inside one. |
| Settings gear and Log out beside the name | The name is a link to Settings. No log out: no sign-in exists yet. | Adapted. |
| Per-role landing (`landingFor`) | `landingFor` in `lib/reviewer/access.ts`: owner `/`, reviewer `/review`, helper `/tickets`, fulfiller `/fulfilment`. | Matched (this is a one-line change to a shared file). |

SectionTabs, `REVIEWER_GROUPS` and the per-group tab rows are gone. The Review area keeps its own tab row (`ReviewTabs`); `REVIEW_TABS` and `visibleReviewTabs` in `nav.ts` list those pages for the palette and the tests.

## Overview, Settings, Budget

| Pixl page | Ours | Action |
| --- | --- | --- |
| `/` Overview: stat grid (players, projects, violations 7d, active bans), growth charts, pixel flow chart, recent activity, latest violations; non-owners are redirected | `/`: a ruled readout strip (players, projects, waiting for review, approved hours, violations 7d, active bans), three plain growth tables with split bars and a range of 14, 30, 60 or 90 days (`?range=`), recent activity (review decisions, moderation, shipped orders), latest violations. `requireAccess("owner")` sends other roles to their landing. | Adapted: charts become tables, pixel flow and the pixel and payout feed entries dropped. |
| `/settings`: appearance (themes, accent), fonts, review defaults and sound/confetti/Pixo DM, account | `/settings`: account (name and role), review defaults (reviewers and owners: show my name, tell me when a ship is sent again; both off), and the site's display preferences (the shared accessibility settings, kept in the browser). | Adapted: accent and font pickers (one accent per theme, fixed type), compact tables, review panel width, sound, confetti and Pixo DMs dropped. The defaults are shown disabled with "Opens with the review service. Nothing here is saved." |
| `/budget`: cash from HCB, wallets, orders left to fulfil, remaining estimate, reserves table, shop spending by month, reviewer earnings | `/budget`: platform budget $300 for the 80-day run ($3.75 a day, owner decision 25 Oct 2026), owed to builders (Ore balances plus orders whose cost is not recorded yet, at 10 Ore = $4.25), "not decided yet" (funding, cash ledger, supplier cost, event budget: all "Not set"), orders by month, Ore earned by track, and how the figures are made. | Adapted: no cash ledger, so no remaining estimate; wallets become Ore balances; reviewer payouts dropped (reviewers are not paid in Ore). The $4.25 rate is stated as internal. |

## Disabled controls

The review-defaults checkboxes and "Save defaults" on Settings. Search, the More menu, the range links and the theme switch are real.

## Checks

`lib/reviewer/nav.test.ts` (role visibility for owner, reviewer, final reviewer, hardware-only reviewer, helper, fulfiller; longest-href; page agreement; the old addresses are gone), `palette.test.ts`, `counts.test.ts`, `overview.test.ts`, `budget.test.ts`, `settings.test.ts`, `host.test.ts`, `proxy.test.ts`. `e2e/reviewer-roles.spec.ts` covers every role's bar, landing and redirects, the More menu, the palette and the phone menu; it has not been run.

---

# The review area (round 4, matched to Pixl 330ac8a2)

Pixl references: `apps/internal-dashboard/app/review/**`, `app/_components/{ReviewTabs,ReviewTable,ReviewDetailTabs,ReviewForm,...}`, `lib/{reviewAssignment,reviewStats,reviewTypeFilter,queueWait,reviewMacros,reviewAccess}.ts`, `lib/db.ts` (stage queries) and `reviewProject` in `app/actions.ts`. Direction: the queue and the verdict history are ruled rows in one bordered block; the desk is two columns, the project and its evidence on the left in tabs, the verdict panel on the right. Look stays LOADOUT's (hard rules, square corners, pixel headings, `--pf-*`, no nested cards). Routes are under `app/(reviewer)/reviewer/review/` and are seen on the review host as `/review/...`.

## Stage model (what changed from round 3)

Pixl: first pass (`shipped`) then `second_review`, which is Spot check (owners and final reviewers decide) or, when the first pass said "ban", Proposed bans (owner). A first-pass approval or ban is only a proposal; a first-pass "request changes" goes straight back to the builder. Pixl's fraud-review stage (Robert) is not ported, so a first-pass approval lands in Spot check directly. The invented "Second pass" status and tab are gone.

`ReviewStatus`: waiting, claimed (first pass, Claimed is a reviewer holding it), spot-check, proposed-ban, approved, needs-changes, banned. `ReviewOutcome`: approved, needs-changes, banned. `LogAction`: claimed, released, approved, first-pass-approved, needs-changes, ban-proposed, banned. Hardware is not a tab: `/review?kind=hardware` (a Software queue / Hardware queue switch, shown only to reviewers who can see both queues); `/review/hardware` redirects there.

## Parity table

| Pixl | Ours | Action |
| --- | --- | --- |
| Header "Review", tab row Needs review (count), Reviewed, Stats, Proposed bans (owner, count), Spot check (owner and final reviewers, count), Reviewer log (owner), Audit notes (owner), Guidelines | `ReviewTabs` + layout `PageHead`; same order, wording and gates | match |
| Queue page: Software/Hardware switch, "Needs review"/"Hardware queue" header with count, Project type chips with counts, 15 per page, locked and "is reviewing" rows, "Yours", "On hold", Recently reviewed by you | `ReviewQueue`, `ShipTable`, `?kind=&type=&page=`, `lockFor`, `claimedByOther` | match |
| Wait counted from first ship, update ship from this ship (`queueWait`) | `waitHours` | match |
| Reviewed, Spot check, Proposed bans lists (same table, First pass column) | same `ShipTable` | match |
| Stats: verdicts over time (All time, Today, This week, This month), Reviewers table, avg time owner only, rushed flag | `VerdictChart`, `reviewerRows` | match |
| Stats: your week vs 15, food grants, pixels won | | drop (weekly minimum, reviewer grants and pixel payouts are reward decisions) |
| Reviewer log (owner): verdict, reviewer, project, repo/demo opened and seconds, hours | `/review/log` from `REVIEW_AUDITS`, filter by reviewer kept, pages of 15 | match, adapt (paging) |
| Audit notes (owner) | `/review/audit` | match |
| Guidelines gate (stepped pages, timers, acknowledge) | `GuidelinePages`: stepped pages, no timers, acknowledge disabled with "Acknowledgement opens with the review service." The redirect cannot be built without a stored acknowledgement | adapt |
| Desk: back link, Open in project view, claim callout, header badges, owner card with eligibility and builder details, description and links, update-ship callouts, builder note, AI declaration, undisclosed-AI callout, banner states, prev/next bar with position and shortcuts | `review/[id]/page.tsx` and `desk/*` | match |
| Desk detail tabs: Commits (count), README, Journals (count), Hackatime (count), Past reviews (count); keys 1 to 9 | `DetailTabs` + `PaneTabs`; hardware shows Lapse instead of Hackatime | match, adapt |
| Right panel tabs: Review, Actions, Overview (logged hours, First pass, Pipeline, final checks), Notes | same four | match |
| Verdict form: hours to credit (decrease only), audit note sections, note with macros, reveal name, undo window, Approve / Request changes / Ban | `ReviewForm`, disabled. Four dimensions as a "note speaks to" checklist; track allocation at the verdict; credit shown as hours, Ore and depth | adapt |
| Actions: re-grade tier, hold, extend cutoff, send back to first pass, unship, ban | same, minus tier (allocation replaces it); extend cutoff reads "Count hours from an earlier date" | match, adapt |
| Resizable split, Slack links, Telescreen, Fraud reviews tab, Robert, Fraudy, HURT, AI time, AI draft, Other YSWS, Beacon, Blackout, bounties, funding, heartbeat, celebration | | drop |

## Fixtures (`lib/platform/review.ts` helpers, `review-fixtures.ts` data)

17 ships, 6 reviewers, 18 audits, a derived log. Each ship carries project type, first pass, commits (with coded time and AI flags), README excerpt, past reviews (audits), notes, hold, ban, reservation, update, collaborators, expedition, age flag. The local test accounts stand in for sample people (`deskViewer`): Test owner is reviewer `bellwether` and builder `kestrel42`, and so on, so Yours, locks and "is reviewing" can be seen by switching `loadout_preview_role`.

## Disabled, and why

The verdict form, journal actions, actions tab, notes box, final checks and release hold are laid out and disabled, with "Opens with the review service. Nothing here is saved." Every page carries one quiet sample line.

## Checks

`lib/platform/review.test.ts` (98 tests): stage moves, address parsing, type filter and chips, wait rule, locks, access to review, neighbours, stats windows, fixture consistency. `e2e/review.spec.ts` and the hardware and proposed-bans parts of `e2e/reviewer-moderation.spec.ts` cover the pages; not run.
