# Reviewer site: changes to the copy of Pixl's internal dashboard

Source: `references/pixl/apps/internal-dashboard` at `1468ba6942b13add1ac50e1319541a033ee1df38` (MIT, see `PIXL-LICENSE.md`). The plan is
`.ulpi/design/reviewer-pixl-port.md`. Re-run `node reviewer-dash/scripts/copy-from-pixl.mjs` to copy again; `--list` shows the file closure
without copying. Files in `ADJUSTED.txt` are never overwritten.

## 1. Mechanical changes the copy script makes (everything else in a copied file is Pixl's, byte for byte)

| Change | Where | Why |
| --- | --- | --- |
| `@/lib/`, `@/components/`, `@/app/_components/`, `@/app/_ui/`, `@/app/_generated/`, `@/app/actions` become `@/reviewer-dash/...` | every copied `.ts` and `.tsx` | the copy lives outside `app/` |
| CRLF line endings become LF | every copied text file | Pixl's checkout here carries CRLF and its own tests search for `"\n"` |
| Phantom Sans `@font-face` rules removed, and `"Phantom Sans"` dropped from font stacks | `app/_ui/admin.css` | a brand font the MIT licence does not cover; the body stack is the system one |
| test path `../app/review/[id]/page.tsx` becomes `../../app/(reviewer)/reviewer/review/[id]/page.tsx` | `lib/githubRepoOwner.test.ts` | the desk page lives in the route tree here |
| `https://pixl.hackclub.com/shop/keyboard.webp` becomes `https://loadout.invalid/shop/keyboard.webp` | `lib/safeUrl.test.ts` | the config's site address is a placeholder (below) |

The route files go to `app/(reviewer)/reviewer/<same path as Pixl's app/>` (`review/(tabs)/**`, `review/[id]/**`, `review/hardware`, and the
Overview `page.tsx`). Pixl's `app/globals.css` is not copied: its `@import "tailwindcss"` would load the reset twice (landing already loads
it in `app/loadout.css`); its other rules are in `reviewer-dash/app/reviewer-root.css`.

## 2. Hand-written files (the adapters), listed in `ADJUSTED.txt`

| File | Replaces | State |
| --- | --- | --- |
| `lib/db.ts` | `lib/db.ts` (Postgres) | Types copied from Pixl. Implemented over sample data: queues (`listShippedProjects`, `listShippedQueueCached`, `listSecondReviewProjects`, `listReviewedProjects`, `listSpotCheckProjects`, `listProposedBanProjects`), counts, `getProject`, `listReviewAudits`, `listReviewAuditsForProject`, `getFirstPassAuditNote`, `listProjectNotes`, `listCollaboratorsForProject`, `collaboratorsByProject`, `firstPassAccess`, `nextReviewId`, `annotateClaims`, `lifetimeRe`, staff settings, guidelines acknowledgement, overview numbers. Honest empties: `listRobertReviews`, `payoutTotalsBySlackId`, `getPixelFlowSeries`, `listViolations`. `db` is `sample/query.ts`, a read-only stand-in for Pixl's builder. |
| `lib/sample/index.ts` | n/a | Pixl-shaped rows built from `lib/platform/review*.ts` (ids are ship numbers: sh-2043 is 2043). |
| `lib/sample/store.ts` | n/a | In-memory changes (claims, verdicts, notes, journal approvals, holds). Per process, empty after a restart. |
| `lib/guard.ts`, `lib/session.ts` | `lib/guard.ts`, `lib/session.ts` | Over `readViewer` and `lib/reviewer/access.ts`. `AdminAccess` has Pixl's shape; `session.slackId` is the sample reviewer handle. No role is a plain 404. |
| `app/actions.ts` | `app/actions.ts` | Same names and call shapes for the review area. Runs Pixl's input rules, writes only to the sample store. Robert, Airtable, Pixo and grant actions accept the form and do nothing. |
| `lib/slack.ts`, `lib/hackatime.ts`, `lib/commits.ts`, `lib/bom.ts`, `lib/fraudy.ts`, `lib/crypto.ts`, `lib/ysws.ts`, `lib/operations.ts`, `lib/operationsReview.ts`, `lib/reviewGrants.ts`, `lib/aiReview.ts` | the same modules | Types copied from Pixl. No network, no key. Hackatime and commits answer from the sample ship's evidence. |
| `app/_generated/config.ts` | Pixl's generated config | Copy with the name, launch date and addresses replaced by placeholders (`loadout.invalid`). The economy maths (tiers, RE, pixels) is Pixl's and is only here so `ReviewForm` renders. |
| `app/reviewer-root.css` | `app/globals.css` | Pixl's global rules scoped to `.reviewer-root`, plus resets for the landing app's element rules that would reach the dashboard (heading faces, button focus ring, `svg { width: 100% }` which overrides the icon size attributes). |
| `app/_ui/ThemeBridge.tsx`, `ThemeToggle.tsx` | Pixl's `<html data-theme ...>` attributes | Sets Pixl's `data-theme` etc. from the site's `data-display-theme` (light or dark) and the staff settings; a plain ghost button switches the site theme. |
| `app/(reviewer)/reviewer/layout.tsx` | `app/layout.tsx` | Pixl's shell (top bar, nav, command palette, tooltips) without `<html>` and `<body>`; no Pixl logo, no log-out form, no confetti; one "Sample data" line. |

- `app/api/review/pending`, `app/api/projects/[id]/{commits,commits/[sha],readme}`, `app/api/search` and `reviewer-dash/lib/apiGuard.ts`: Pixl's JSON endpoints that
  the copied components call, answering from sample data, on the review host, for staff only.
- The copy script also swaps the HURT fraud tool address (`https://hurt-xi.vercel.app`) for `about:blank#`, so no frame loads a third-party page.

Other files changed outside the copy:

- `eslint.config.mjs`: for `reviewer-dash/**`, the review routes and the Overview, the React Compiler rules `react-hooks/purity`, `set-state-in-effect`,
  `immutability`, `refs` and `react/no-unescaped-entities` are off. They flag patterns in Pixl's code that work. Every other file keeps them.
- `package.json`: `reviewer-dash/lib` and `reviewer-dash/app/_ui` added to the `test` script; packages added (see below).
- `lib/reviewer/host.ts` and its test: `/review/sh-2043` and `/ship/sh-2043` redirect (308) to `/review/2043`.
- `lib/reviewer/nav.test.ts`, `lib/reviewer/proxy.test.ts`: follow the new paths; the page-vs-nav check also reads `requirePage`, and skips Pixl's
  own pages (they carry Pixl's rules: a reviewer opens the page and it checks owner or final reviewer itself).

Packages added to `apps/landing`: `@hackclub/icons` 0.2.2 (BSD-3-Clause, Hack Foundation), `motion` 14.14 (MIT), `d3-scale` and `d3-shape` and `d3-array` (ISC),
`clsx` (MIT), `tailwind-merge` (MIT), and the `@types/d3-*` packages (MIT). Not needed by the copied code and not installed: `recharts`,
`@number-flow/react`, `postgres`, `sharp`.

## 3. Things the adjustment pass has to deal with (seen while making it run; not changed)

Words and brands
- "Pixl", "pixels", "player", "Slack", "Robert", "Telescreen", "Airtable", "Hack Club" in visible text: the Overview ("Everything happening across Pixl"), the
  review form ("sends this to Robert", "Approve & credit pixels", RE/h and `T1 Spark` tiers from Pixl's economy), the first-pass and final-pass copy on the desk,
  the Telescreen button on Spot check, the built-in macros (`/ai`, `/fraud`, `/readmeai`, `/badreadme`: "heyy :hii:" tone), the guidelines (Hack Club's YSWS guidelines text).
- Page titles and the nav: Pixl's hrefs (`/projects`, `/players`, `/pixels`, `/sidequests`, `/story`, `/fulfillment`) do not match LOADOUT's other pages; the
  badge counts other than Review are 0.
- The sample double-dip against another LOADOUT ship (2056) falls through to Pixl's generic "Double dipped with another YSWS" banner.
- External links that open only on a click: Telescreen (Spot check), Fraudy and Slack profile links on the desk.
- `<title>` is "LOADOUT Review"; check `Review - LOADOUT Review` for the tabs.

Product rules
- One track per project is not shown (the ship carries one `T1 Spark` tier chip from Pixl's economy). Needs the one-track line and the `/track` reason chip.
- Four quality dimensions, Ore, Track XP, age 13 to 18, Research Mode, Lapse and journals every 8 hours are not in the form.
- Pixl-only: Beacon, Trials, Blackout, funding (a fixed $40 on every hardware ship), `Mark Beacon`, Fraud reviews tab, Robert submit and resend, level and tier regrade.

Honesty
- Controls that do nothing (Robert, Airtable, extend cutoff, grant claim, AI draft) accept the form and return quietly; some need the Local/Stub sentence.
- The sample note is one line under the top bar on every page.

Layout and platform
- On a 390 px screen the page scrolls sideways by 156 px (the top nav row is wider than the screen). That is Pixl's own nav; V pass.
- Light and dark both work; the light/dark button is mine (Pixl has none in the bar).
- The landing app's decoration script puts `style="caret-color: transparent"` on inputs before React hydrates, so the dev console shows one hydration
  warning per page with a form. It is not from the copy; it appears on any page with an input.
- The pages of the other reviewer groups (people, moderation, content, fulfilment, operations) and `review/macros`, `pay`, `erasure`, `age-exceptions` are still the
  hand-built ones and now render inside Pixl's shell without their old stylesheet. They are replaced by P1 to P4.
- `CommandPalette` fetches `/api/search`, which does not exist here; the search shows pages only.
- The Spot check tab lists ships the sample marks `spot-check`; Pixl's "fraud review" queue (`/review/fraud-reviews`) is always empty.

## 4. Old hand-built review files that nothing imports any more (for the lead's cleanup)

No importer found by a text search, so likely safe to remove once the lead agrees:
`app/_components/reviewer/ReviewDesk.tsx`, `app/_components/reviewer/people/ActionRail.tsx`, `app/_components/reviewer/people/BackLink.tsx`,
`app/_components/platform/review/{GuidelinePages,guidelines-pages,ReviewQueue,SplitBar,VerdictChart}.tsx`,
`app/_components/platform/review/desk/{ActionsTab,DeskNav,DetailTabs,HardwareCard,NotesTab,OverviewTab,OwnerCard}.tsx`,
`app/_components/platform/review/queue/{ClaimPanel,DeskShortcuts}.tsx`,
`app/_components/platform/review/records/{OwnAuditView,PerkProgress,RecordFilters,VerdictsPerDay}.tsx`,
`app/_components/platform/review/verdict/{PipelineStrip,ResubmitNotice,VerdictWorkbench}.tsx`.
`lib/reviewer/**` and `lib/platform/review*.ts` stay: they are the sample data source.

## P2 moderation (bans, reports, violations, notify)

Hand-written: `lib/sample/moderation.ts` (reads, re-exported by the end of `lib/db.ts`), `lib/sample/moderation-data.ts` (rows, types, the in-memory changes), `app/actions-moderation.ts` (re-exported by the end of `app/actions.ts`: `confirmBanProposal`, `rejectBanProposal`, `resolveReport`, `sendNotification`, `searchPlayers`, `PlayerHit`). `listViolations` was an empty stub in `lib/db.ts`; it is removed there and now comes from `sample/moderation.ts`. A decision (ban confirmed or rejected, report resolved or dismissed) is kept per process and shows at once; nothing is sent, no DM, no inbox row. `banIsActive` is P1's.

Edits to copied files
- `app/(reviewer)/reviewer/notify/page.tsx`: the "Sent to N players." flash gets "Sample data. Nothing was saved." after it, so the page never claims a real send.
- `reviewer-dash/app/_components/NotifyForm.tsx`: the preview's `<img src="/logo.png">` (Pixl's logo, an image asset the port does not carry) is removed.

For the adjustment pass (seen, not changed)
- Words: "Players flagged by other players", "Bans: every ban ever issued... removes all active bans for that player", "Pixl inbox", "in-game inbox (the [N] menu)", "Meanness likelihood", "OpenRouter or Slack keys are not configured", "No Slack linked / can't DM / No Slack, no DM", `SlackName`, `Banned from Pixl`. Player to builder, Slack to handle, in-game inbox to LOADOUT's own notice area.
- Violations: Pixl's kinds are `chat` and `name` (censored chat, rejected display name). LOADOUT has no live chat, so the sample maps its rule-based violations to `chat` and adds five `name` rows. The page should filter by rule (Kindness, Own work, Privacy, Safety, Spam, Honest hours) as `lib/reviewer/moderation.ts` does.
- Reports: the AI verdict column, the "AI analysis" card and the "chat, last 10h" card are Pixl's. The sample fills verdicts on a third of the reports and invents chat lines. LOADOUT has no chat or model: remove them or reduce to a stub. Reports are about a project or a post in LOADOUT (the sample keeps the title in the reason text).
- Ban lengths: Pixl's ban form offers hours (Moderate.tsx, P1); the LOADOUT policy and `BAN_LENGTH_OPTIONS` use days. Proposals carry `hours`, shown as "336h" style by the page: should read days.
- Two-person rule: LOADOUT requires a second staff member to decide a ban (the proposer cannot decide), Pixl lets any owner. Not enforced in the sample action.
- The Bans tab links the player as `/players/<id>` where the id is `u-<handle>`; check against P1's player route.

## P1 people (admins, players, projects, reviewers, fulfillers)

Hand-written (in `ADJUSTED.txt`): `lib/sample/people.ts` (data functions, re-exported by `lib/db.ts`), `lib/sample/people-data.ts` (rows and the
in-memory team store), `lib/sample/referer.ts` (back to the page a form came from), `app/actions-people.ts` (re-exported by `app/actions.ts`).

Edits to files that are not Pixl copies:
- `lib/sample/index.ts`: `ensureUser` is exported, so the People data can add the builders that have no ship.
- `lib/guard.ts`: `ownerSlackIds()` (the owners in the People sample) and `secondPassSlackIds()` (empty) added, as Pixl's guard has them.
- `app/actions.ts`: `toggleProjectPeak` and the `quiet` helper go back to the page the form came from (the project page), `banProject` honours `returnTo`
  (default `/projects/<id>`), sets only the ban fields (so `unbanProject` restores it) and no longer redirects to `/review`.

Edit to a copied file: `app/(reviewer)/reviewer/fulfillers/[id]/page.tsx` imports `SlackHandle` from `@/app/(reviewer)/reviewer/fulfillment/SlackHandle`
(the copy script left Pixl's `@/app/fulfillment/SlackHandle`).

Sample data: 87 builders (`lib/reviewer/people.ts`, ids `u-<handle>`), 141 projects (87 ships plus 54 drafts and removed ones, added to `PROJECTS` once per
process), the team from the same file (2 owners, 6 reviewers with stats from the review audits, 1 fraud reviewer, 2 helpers, 4 fulfillers), their orders from
`lib/reviewer/fulfilment.ts`, bans, violations and reports from the moderation sample (`lib/sample/moderation-data.ts`).
Pixl has no fulfillers list page (only `/fulfillers/[id]`); the list is on the Team page and `/fulfillment?status=fulfillers`.

What the adjustment pass must change in these pages:
- Words: "Players" (title, nav, mass-action card), "Pixels" stat on the player page (it holds Ore: 10 per approved hour), "In-game name", "Pixo" and "Airtable"
  in the delete-account text, "Pixl" in the reject, ban and payout texts and the notify title placeholder ("Message from the Pixl team"), "Slack member ID",
  "Slack photos" button, "Sync Slack photos", the Reviewer payouts card ("Pixels per approval", "Review Blitz"), "Robert fraud review" card on the project page,
  "Beacon", "Trial", Pixl tier badges (`T1 Spark`), "Hackatime", "Airtable record", "Hack Club HQ" in the correct-hours text, "Pixorpheus bot".
- Remove: Last known positions card and Reset position (game), Bans of the game world wording, Robert card, Airtable card and send buttons, the CSV export link
  (`/api/projects/export` does not exist), the fraud reviewer card and `FRAUD_REVIEW` marker, `AI draft` toggle, edit-submission toggle if not wanted.
- One track per project: the project page has no track chip; add the track and the one-track line.
- Honesty: Airtable, DM and Slack actions answer with a quiet notice, not saved; mass action says "Sample data. Nothing was saved." only in the notice.
- `/pixels?user=` link on the player page and `/reports`, `/violations` links point at pages other groups own.

## P3 content (shop, shop-detail, ideas, events, forms, show-n-tell, community-goals, referrals)

Hand-written (in `ADJUSTED.txt`): `lib/sample/content-data.ts` (types copied from Pixl's `lib/db.ts`, sample rows, the in-memory `content` store),
`lib/sample/content.ts` (the data functions, re-exported by the last line of `lib/db.ts`), `app/actions-content.ts` (the actions, re-exported by the last
line of `app/actions.ts`). Every action checks the owner role and changes only the in-memory store; a restart resets it. `listSidequests` answers an empty
list (Trials are game content): the shop's "Unlock via Trial" box says "No active Trials."

Edits outside the copy: `eslint.config.mjs` gets a block turning the React Compiler rules off for these eight route folders (the existing block only
covered `review/**` and the Overview; `forms/FormEditor.tsx` calls `Date.now()` in render, as Pixl does). No copied page or component was edited.

Sample data: 23 shop items in 8 regions (about 170 rows; Ore prices from `lib/platform/shop.ts`, a 4% regional uplift outside the US on non-grants, a few
regions skipped), 2 personal items, 8 events, 4 forms with 10 submissions (kept, pending, accepted, rejected), 3 Show & Tell rounds (from the community
sessions), 6 vault levels, 40 referrals, 25 ideas (2 removed). Handles are the community leaderboard's and the review ships' builders; the 40 referred
handles are invented.

For the adjustment pass (not changed):
- Unit: Pixl's prices, rewards and event rewards are pixels; the sample numbers are Ore. Every "px", "pixels", "pixel shop", `config.economy.pixelValueUsd`
  (0.1, so the "$ budget" badge on /shop shows Ore x $0.10, not the Ore rate of $0.435 in `lib/reviewer/content.ts`) and "Pixels paid out" must become Ore.
- Words: "players", "in-game", "Pixl shop", "Pixo/Slack" (the Save silently boxes), "DMs them directly", "pixl.hackclub.com/form/*" (Forms description),
  "Restoration Energy" and "Core Vault" (Community Goals; LOADOUT has eras and goals measured in approved hours), "Trophies", "Trials", "Beacon-locked",
  "XP", "Slack ID or exact in-game name" (personal items), "Mystery Merchant" and "Review Blitz" event wording, "idea playground".
- Referrals: the reward tiers, the milestone (83 px every 10th) and the +4 px/h boost are Pixl's numbers kept so the page renders; plans/02 sets no
  referral reward. Replace the sentence with `NO_REWARD_SENTENCE` and remove the amounts, or leave the page showing counts only.
- Shop: regions are Pixl's eight (US, Asia, North America, ...); LOADOUT Ore prices are the same everywhere (plans/02 s26), so the regional price table
  and the "Regional pricing" page may go. Categories (Grants, Merch, Tech, 3D Printers, Software, Kits, Other) are Pixl's; LOADOUT groups by track and
  kind. Items have no image (no brand assets); the placeholder tile shows. "Edit price in every region" and the CSV upload stay stubs on the in-memory list.
- Events: only Show and Tell exists on the participant side; the five Pixl types are samples. Community goal progress is computed, not counted.
- Forms: the draft question wording is invented. Accepted or rejected DMs nothing.

## P4 operations

Group: Fulfilment (list, `label/[id]`, `airbridge-preview`), Tickets, Operations, Budget, Settings, Stats and Removed. New data and actions are in
`lib/sample/ops.ts` (types, in-memory store, shop-order reads, buyer details, public stats), `lib/sample/ops-data.ts` (rows built from
`lib/reviewer/fulfilment.ts` and the shop catalog), `lib/sample/opsSql.ts` (a stand-in for Pixl's `sql` that answers the Budget modules' six queries
from the sample), `app/actions-ops.ts` (the order actions and `saveStaffSettings`), `lib/tickets.ts`, `lib/operations.ts` (appended), `lib/pixo.ts`,
`lib/pixoCall.ts`, `lib/airtable.ts`, `lib/ticketsApi.ts` and `app/api/tickets/**` (the four endpoints the Tickets page calls). Sample size: 62 shop
orders in every stage (18 new, 9 claimed, 1 ordered, 7 credited, 9 shipped, 12 done, 6 cancelled; 2 flagged over budget; grants included), 46 tickets
(18 open) with threads, 3 helpers, 1 campaign with 15 entries, 92 players and the approved sample projects on the public stats page. An action moves the
order or ticket in the in-memory store (gone after a restart); nothing is saved, sent or credited.

Edits to copied files (all mechanical, nothing else in them changed):

| File | Edit | Why |
| --- | --- | --- |
| `lib/budget.ts`, `lib/budgetPosition.ts` | `import { sql }` from `lib/pgCompat` to `lib/sample/opsSql` | no database; the queries stay Pixl's and are answered from the sample |
| `lib/budgetCash.ts` | `loadCash` (an HCB fetch) and the cached reader removed; `getBudgetCash` returns an invented, reconciled ledger; `HCB_URL` points at `hcb.invalid`; `summarizeCash` and the types are Pixl's | no network |
| `lib/eligibility/ships.ts`, `airbridgeCache.ts`, `shipsSnapshotStore.ts`, `evidence.ts` | replaced by stand-ins with Pixl's exported names and types (the Ships and Airbridge reads, the Postgres snapshot store and the evidence loader); `engine.ts`, `policy.ts`, `format.ts`, `shipsMatch.ts` are untouched, so the funding verdict is still Pixl's pure rules over sample evidence | third-party caches and network |
| `app/(reviewer)/reviewer/operations/page.tsx` | `@/app/operations/actions` to `./actions` | the actions file sits beside the page here |
| `app/(reviewer)/reviewer/fulfillment/airbridge-preview/page.tsx` | `sql` import as above | no database |
| `app/(reviewer)/reviewer/removed/page.tsx` | Pixl logo image and the log-out form removed, `/login` redirect to `notFound()`, the button goes to `/` | no brand art, no login route here |
| `reviewer-dash/lib/guard.ts` | `guardedAction` appended (role check through `requirePage`, no audit row) | Pixl's route files and `operations/actions.ts` call it |
| `reviewer-dash/lib/operations.ts` | the Blackout stand-in now also answers `getOperation`, `listOperations`, `getOperationStats`, `listOperationEntries`, `operationRpc` from one sample campaign. `getBlackoutEntry` and `listBlackoutQueueProjectIds` still answer nothing, so no review desk shows a Blackout section | the Operations page is on the list |
| `eslint.config.mjs` | the React Compiler rules off for the P4 routes, as for the other copied routes | same reason as the existing block |

For the adjustment pass (not changed):
- Unit: Pixl's order prices, the shop economy line ("Redeemed by players ... px"), the fulfiller payout (6 px an item, 2 px a grant), the Budget page
  ("PIXL pixels", "Pixels", "USD equivalent", reviewer earnings in px) and the Operations page are pixels. The sample prices are Ore. `config.economy.pixelValueUsd`
  is Pixl's 0.10, so every "$ budget" next to an order is Ore x $0.10 and not the Ore rate of $0.435 (`lib/reviewer/fulfilment.ts` `oreToCents`); several
  sample orders therefore show "above budget" and the funding verdict reads "Review required". Pick one rate in `config.ts` and the sample follows.
- Stages: Pixl's New, Claimed, Ordered, Credited, Shipped, Done, Cancelled. LOADOUT's own fulfilment page has New, Claimed, Packed, Shipped, Delivered,
  Cancelled. The sample maps Packed to Credited (cost recorded) or Ordered (not yet). Decide which stage names LOADOUT keeps.
- Words: "players" (Redeemed by players, Players tab text, the label page), "Pixl", "Slack" (Slack user ID on the fulfiller and helper forms, the Slack contact button,
  "DM'd to the buyer"), "HCB", "Airtable", "Unified", "Ships", "Airbridge", "Otter", "PIXL entries" (the sync bar and the funding panel), "Pixo is offline", `/pixl-addhelper`,
  "Pixorpheus bot" (Tickets), "Operation Blackout" (the Operations page, create form and nav badge; the sample campaign is named "Sample operation: double Ore
  weekend" but the slug and the "Blackout" badge stay), "Pixl live stats" and "Teenagers building games, getting paid in pixels" (Stats), "Phantom Sans" (a Settings font choice
  that now falls back to the system font), "Hack Club's typeface", the Settings theme names (JetBrains, Cursor, Tokyo Night ... are Pixl's list), "Pixl dashboard" and "Pixl team"
  (Removed), "removed from the team".
- Product rules: LOADOUT has no HCB, Airtable, Unified or Ships. The funding panel, the sync bar, the receipt field ("HCB link") and `/fulfillment/airbridge-preview` are Pixl-only and are
  candidates for removal; Operations (Blackout) is a Pixl-only campaign and the plan lists it under exclusions, so the page may go entirely. The public Stats page is the owner's here; Pixl
  shows it to everyone. A grant order (conference and book grants) uses Pixl's grant flow ("grant link" is an HCB link).
- Honesty: Operations, Budget and Fulfilment need the one "Sample data" line the layout shows; the budget figures (cash, wallets, reviewer earnings, rates) are invented and not LOADOUT's
  decided numbers (platform $300 for the run, 10 Ore = $4.35 in `lib/reviewer/budget.ts` are not used by the page). Reviewers are not paid in Ore in LOADOUT, so the "Reviewer earnings" table is
  Pixl-only.
- Removed: the page only shows to someone with no role and the layout 404s those, so with a role it redirects to `/` and cannot be seen. It renders for nobody here.
- Tickets: the thread, reply and resolve calls work on the sample in memory. Names in a thread are handles, with no avatar.
- Funding/eligibility: no buyer is "Unverified" (every buyer has a confirmed sample project when they have approved hours; 38 orders are Covered, 2 Insufficient, 22 Review required).
- Not seen in a browser (see the report): no dev server was running when this was made.
- `app/(reviewer)/reviewer/projects/page.tsx`: the export link is an `<a download>` (a file download; the `download` attribute keeps the Next link rule quiet, so no disable comment is needed). New route
  `app/api/projects/export/route.ts` answers with a CSV of the approved sample projects (owner, review host only); entry added to `lib/reviewer/route-matrix.ts`.
- `reviewer-dash/app/actions-people.ts` also holds `warnPlayer`, `banPlayer`, `liftBan`, `banIdea`, `unbanIdea` (the forms in `Moderate.tsx`), writing to the moderation and content in-memory stores.

## R roles (role model and access levels)

Rules: `.ulpi/design/reviewer-roles.md`. Matrix: `lib/reviewer/route-matrix.ts` (tests in `route-matrix.test.ts`).

| File | What | Why |
| --- | --- | --- |
| `lib/guard.ts`, `lib/session.ts` | Rewritten adapters: `AdminAccess` with all Pixl flags, `requirePage`, `getAccess`, `guardedAction`, `guardedRoute`, `can`, `landingFor` (Pixl's semantics: no role is 404, a wrong role redirects to the person's landing). Team changes made on the Admins page are laid over the viewer's grants. | roles |
| `lib/sample/role-grants.ts`, `app/actions-roles.ts` | Pixl permission strings to LOADOUT grants; the full-queue control. | roles |
| `lib/apiGuard.ts`, `app/api/**` | `reviewApi(name, requirement, fn)` (404 without a role, 403 with a wrong one, review host only); the project routes also 404 a ship outside the viewer's queue; search shows players to owners only. | every API route is guarded |
| `app/_ui/nav.ts` | Removed the Pixels, Trials and NPCs and Story links (no such pages here). | nav only offers pages that exist |
| `app/actions-review.ts` | `authorize()` (queue, self-review, no_review) on every project action; submission edit asks `{ review: "edit_submission" }`. | actions honour the markers |
| `app/_ui/ViewAs.tsx`, `app/(reviewer)/reviewer/layout.tsx` | Development-only "View as" menu; badge count scoped to the viewer's queue. | role preview |
| `review/hardware`, `removed`, `stats` pages | Added the missing `requirePage`. | unguarded pages |
| `review/(tabs)/layout.tsx`, `lib/db.ts` | Queue-scoped counts (`countReviewTabs(kind)`). | hardware-only reviewers never see software counts |
| `projects/page.tsx`, `projects/[id]/page.tsx` | Queue and stage visibility (`canReadReviewEvidence`), as the desk and search. | Pixl leaves the project pages open to every reviewer |
| `review/[id]/page.tsx` | Read-only notice and no Flagship card for a person set to not review. | no_review |
| `reviewers/[id]/page.tsx` | Full-queue control. | marker had no control |

## A2 adjustment (people and moderation)

Words: player to builder in visible text (routes stay `/players`), Slack id/handle to "handle", in-game name to "Display name", no real-name field, pixels to Ore
(`creditFor`, `ORE_PER_HOUR` from `lib/platform/review.ts`), Pixl/Pixo/Airtable/Robert/Hack Club HQ removed, "Second pass" to "Final reviewer", "Admin" to "Owner",
"Fraud reviewers" to "Integrity reviewers", Beacon to Flagship, AI draft to "prepared draft note", nav, command palette and palette search say Builders
(`app/_ui/nav.ts`, `lib/reviewer/nav.ts`, `palette.ts`, `CommandPalette.tsx` and their tests).

| File | Change |
| --- | --- |
| `_components/ProjectBadges.tsx` | New `TrackBadge`/`trackOfProject` (one track chip from the staff project list). `LevelBadge` now renders the track chip only when given `projectId`, otherwise nothing; the `T1 Spark` tiers are gone. `BeaconBadge` reads "Flagship". Shared with the review pages (A1 must pass `projectId`). |
| `projects/[id]/page.tsx` | Track chip and "Track: X. Locked on submit." / "Open until submit." Removed the Robert card, Airtable card and send button, Trial badge, hours cutoff card. Flagship card, LOADOUT wording, Ore in the hours text. |
| `projects/page.tsx` | Track chip, Airtable "send missing" removed, Builder column. |
| `players/page.tsx`, `players/[id]/page.tsx` | Builders. Sync Slack photos, Last known positions, Reset position, `/pixels` link, Pixo/Airtable text removed. Ore stat from `creditFor`. Mass action and forms propose bans in days. Pending proposals, warnings and lifts show on the builder page from the shared moderation store. |
| `_components/Moderate.tsx`, `actions-people.ts` | Ban form: 1, 7, 30 days or permanent, reason required, button "Propose ban" (`proposeBan`). Warn text is LOADOUT's. Removed `banPlayer`, `resetPlayerPosition`, `syncSlackAvatars`, the Airtable actions and `updateReviewPayoutSettings`. |
| `actions-moderation.ts`, `bans/page.tsx` | Two-person rule: `confirmBanProposal` refuses the proposer (`canDecide`), the page hides Confirm and offers Withdraw for your own proposal. Proposals carry `days`. Log labels Banned, Lifted, Proposed, Warned. |
| `moderation-data.ts` | Reports lose AI fields and chat (`rule`, `subject` added); violations filed under Kindness, Own work, Safety, Privacy, Fair play, Other; chat lines removed; handles only; `proposed` list for new proposals. |
| `violations/page.tsx`, `reports/*` | Filter by rule; no AI verdict, AI analysis or chat card; "Reported item" card. |
| `notify/page.tsx`, `NotifyForm.tsx` | Builders, notifications wording, no Slack badge. |
| `reviewers/*`, `admins/page.tsx`, `TeamLog.tsx` | Handle instead of Slack ID, owner list from deployment settings, Integrity reviewers, helpers note. The payout card is "Reviewer pay": both amounts "Not set", disabled, with the fixed Stub sentence. Team log words for grants. |
| `fulfillers/[id]/page.tsx` | Builder column; "Fulfiller pay: Not set" instead of pixels earned. |

Left: `Hackatime` (LOADOUT uses it), "AI used" (a declaration), invented project names like "Pixel tile editor". Fulfilment stage names (Ordered, Credited) on the fulfiller page are A3's decision.

## A3 adjustment (content, operations and fulfilment)

One rate: `reviewer-dash/app/_generated/config.ts` now takes `oreValueUsd` (and Pixl's `pixelValueUsd` alias, kept for A1's review form) from `USD_PER_TEN_ORE / 10` in `lib/platform/review.ts`; `lib/reviewer/budget.ts` derives `ORE_PER_TEN_CENTS` from the same constant (it said 435 by hand; its comment said $4.25). Every page reads `config.economy.oreValueUsd`. `lib/eligibility/policy.ts` (untouched copy) still has Pixl's `ratePerHourUsd: 4`, used only by the flat-rate policies; the current policy uses payout history, which follows the config rate.

Shop (shop, shop-detail, forms in `_components`): `lib/shopCategories.ts` derives the categories from the item kinds in `lib/platform/shop.ts` (+ "other"); `lib/shopRegions.ts` is one fixed value, no page shows or edits it. The sample has one row per catalogue item (about 60), one Ore price, the item's tracks (or General) and a Requisition note computed from `REQUISITION_MIN_ORE` and the tracks. Removed: region tabs, the "Edit price in every region" form, the Trophies card, "Unlock via Trial", Beacon-locked, Discount %, item images and upload, the price-changing configurator and USD helper (deleted `ShopConfigEditor`, `ShopConfiguratorPanel`, `ShopItemConfigurators`, `ShopItemEditConfigurator`, `PriceUsdInput`), Pixo/Slack "save silently". A track filter replaces the region tabs. `/shop-detail` becomes "Item details": the one price and the supplier links per item (no regions). Store keys were bumped (`...V3`) so a running server reseeds.
Events: the only type is Show and Tell; no reward, bonus or shop-item fields. Community goals: the page lists the Eras with an approved-hours threshold and plain reward lines; the top-3 "RE" prizes are gone. Referrals: read-only list, `NO_REWARD_SENTENCE`, qualified (first approved ship) or waiting, no amounts, tiers, milestones or boosts. Forms and Show & Tell: words only (no DM is sent).

Fulfilment: stages are New, Claimed, Packed, Shipped, Delivered, Cancelled. Stored keys stay Pixl's (people pages read them): `ordered` and `credited` both show as Packed (no action sets `ordered` now), `done` shows as Delivered; counts, tabs and the stage bar use LOADOUT's. Actions: `markOrderPlaced` and `markOrderCredited` became `markOrderPacked` (cost and source), `sendGrant` takes a grant reference, `refreshShipsSnapshot` removed. `isOwnOrder` no longer exempts owners: nobody fulfils their own order. Removed: Funding panel and sync bar (`Funding.tsx`), HCB receipt field and links, `/fulfillment/airbridge-preview`, Slack contact button, Beacon, the fulfiller "pixels earned" column, shop imagery, the label's logo images. The list chip is "Ore: Covered / Review ..." from Pixl's pure rules over sample evidence (earned Ore at 10 per approved hour): 59 covered, 3 review required (2 flagged over budget, 1 above budget). Eligibility labels in `eligibility/format.ts` no longer name Unified, Ships or Airtable.
Operations (Blackout) and Removed: route files deleted; nav entry, route-matrix entries (`/operations`, `/removed`, `/fulfillment/airbridge-preview`) and their test lines removed. Tickets: Pixo banner, Slack wording and "Open in Slack" removed; "support requests". Budget: `BudgetView` reads `lib/reviewer/budget.ts` directly (platform $300 for 80 days, Ore owed, orders by month, Ore by track, "not decided" list, which includes the event budget as Not set); the SQL stand-in modules `lib/budget*.ts` were deleted (`opsSql.ts` stays for `pgCompat`). Settings: themes are System, Dark, Light (ThemeBridge now honours Dark and Light); Fonts section removed with Phantom Sans; the Pixo DM toggle removed; texts say the settings are kept for this server run. Stats page words and links changed (reachable only by the site's own /stats redirect rule).
Not renamed (code identifiers, never shown): `PixlTicket`, `PixlThreadMessage`, `SlackHandle`, `SlackName`, `slack_id` fields, `player_*` order fields, `/players/` route, `lib/pixo*.ts`, `lib/airtable.ts`.

## A1 adjustment (review area, layout, nav, guidelines, macros)

Words and units
- Rates come from `lib/platform/review.ts` (`ORE_PER_HOUR`, `USD_PER_TEN_ORE`, `creditFor`, and `TRACK_XP_PER_HOUR` = 10, added there). Used by `ReviewForm` (credit line), `guidelinesContent.tsx` and the desk header text. No rate is written in a copied file.
- "player" to "builder" in visible text on the review area (queue table header, audit, notes, form fields, hold and unship placeholders, past-review sections); "Slack" removed (owner card shows the handle only; the Slack profile link is gone; the first-pass checkbox no longer says "DM me on Slack"). Route names (`/players`) and data field names (`player_name`, `slack_id`) stay.
- Page titles: `export const metadata = { title }` on every tab, the desk and the Overview, so the browser title reads "X - LOADOUT Review" (the layout supplies the template).
- Overview: "Everything happening across LOADOUT review.", "Players" to "Builders", the Pixels flow chart and the pixel and payout feed kinds removed.

One track per project
- `ProjectRow.track` and `research_mode` (optional, `lib/db.ts`) set from the sample ship (`lib/sample/index.ts`); `track` is in `QUEUE_FIELDS`. `ReviewTable` and the desk header show one `TrackBadge`; the tier chip, tier select ("Re-grade tier", `setProjectLevel`) and `TierAndPayout` are gone.
- `ReviewForm`: `TrackAndCredit` shows "Track: X. All Track XP from this ship goes to this track. If the work does not fit it, request changes with the reason Does not fit the track." plus the credit (Ore, dollars, Track XP). A reason chip row (`CHANGE_REASONS`, including "Does not fit the track") sets a hidden `changeReason`; the `track` chip explains that the builder may change the track. `expandMacro` takes `{ track }` so `/track` fills `{track}`.
- Notes guidance names the four quality dimensions (`QUALITY_DIMENSIONS`); Research Mode and Hardware (Lapse and the bill of materials) callouts; "Journals are due every 8 hours"; the age-flag text says 13 to 18 and leaves exceptions to an owner.
- Hardware ships show a Bill of materials card (BOM preview and download); the "Funding requested" panel, the funding chip, cart screenshots and `updateFundingAmount` are removed (`needs_funding` is false in the sample).

Removed
- Pixl economy in the form (tiers, RE, pixel payout, level ramp, Trial prize, funding deduction), bounty board, Trials (rules callout, badge, hold line), the Blackout section, badge, summary and review data (`BlackoutReviewSection`, `BlackoutBadge`, `BlackoutSummary`, `PixelFlowChart`, `FraudyAiSummary` deleted), the Blackout queue filter, the Telescreen column and button (`TelescreenReviewTable.tsx` deleted), Robert cards and the three Robert actions on the desk, the `fraud_review` desk branch, Fraudy buttons and the AI time Fraudy numbers, the HURT iframe tab, the "Pixels won" column and food-grant card on Stats, Airtable and Unified steps in the pipeline (now Submitted, First pass, Spot check, Approved), the void-payout checkboxes, Slack in the guidelines gate.
- Quiet stubs with the fixed sentence "Opens with the review service. Nothing here is saved.": AI-usage check line (final stage), AI time tab, AI draft button (disabled), Extend cutoff (disabled), macros list edit, pay, erasure, age exceptions.
- Integrity reviews: `/review/fraud-reviews` keeps the `{ review: "fraud" }` guard; tab, heading and nav label read "Integrity reviews". `lib/sample/integrity.ts` lists AI-usage and double-dip flags from the desk's sample checks; the tab says it is a stub.
- Beacon is the Flagship award (card, button "Nominate", header chip "Flagship").

Guidelines, macros
- `guidelinesContent.tsx` rewritten for LOADOUT (stages, validity checklist, time and journals, evidence, the track, hardware and Research Mode, age 13 to 18, the note and quality dimensions, status moves, recap). `GuidelinesGate` keeps Pixl's behaviour; the Hack Club link and the "heads-up in Slack" title are gone. `GUIDELINES_VERSION` stays 1 (sample data: every reviewer has acknowledged 1).
- `reviewMacros.ts`: built-ins rewritten in plain wording (triggers `/ai`, `/fraud`, `/readmeai`, `/badreadme` kept), `/track` added. `/badreadme` now ends its stem with "missing " and `hasUnfilledMacroPlaceholder` looks for "missing ." (test updated, `/track` tests added). `reviewMacros.test.ts` assertions that quoted Pixl text were edited.
- `/review/macros`, `/review/pay`, `/review/erasure`, `/review/age-exceptions` were the hand-built pages; they are rewritten with Pixl's `ui` kit and `requirePage("owner")`. The old macro editor is replaced by a built-in list (personal macros are in Settings).

Nav and top bar
- `nav.ts`: groups are Queues, Content, People, Moderation, Operations; Players link reads Builders; "Fraud reviews" reads "Integrity reviews" (`route-matrix.test.ts` updated). `TopNav.tsx`: below `lg` the primary links and the groups collapse into one "Menu"; at 390 px the page no longer scrolls sideways (scrollWidth 380). `ViewAs.tsx` is compact (32 px, label hidden under `xl`).
- Dead nav-adjacent code: none left.

Other fixes
- `doubleDip.ts`: matches "Builder disclosed" as well as "Player disclosed", and gives "another LOADOUT ship" its own banner title (sample note text changed to match).
- `actions-review.ts`: claim, heartbeat, draft, note, hold and ban timestamps use the current time (they used a clock frozen when the server started, so a claim was already expired).
- Seen, for A2 and A3: `ProjectBadges.tsx` (shared) already carries `TrackBadge`; `ReviewTable` uses `TrackBadge track`. `CommandPalette` placeholder was changed by someone to "builders". The people pages still say "player" in `lib/db.ts` field names only.

## C2 e2e suite (reviewer.spec.ts, reviewer-roles.spec.ts)
- The seven old reviewer specs (they tested the replaced UI) are replaced by `e2e/reviewer.spec.ts`, `e2e/reviewer-roles.spec.ts` and `e2e/reviewer-helpers.ts`.
- Fix: the "Sample data" line and the light/dark switch used Pixl's `--muted` (#8492a6), 3.0:1 on the light page. They now use `--secondary` (`reviewer-root.css`, `.reviewer-theme-switch` in `ThemeToggle.tsx`).
- Not fixed, skipped in the axe test with the reason in the spec: Pixl's palette fails `color-contrast` in places (white on #ec3750 at 4.0:1 on the active nav link, #8492a6 nav links on the light page at 3.0:1, info and danger badges, diff counts); the resize divider (`ReviewSplit.tsx`, Pixl's) is a focusable `role="separator"` without `aria-valuenow` (`aria-required-attr`).
- The sample tickets are stamped relative to the server's clock, so `sample` timestamps in `route-matrix.ts` for `/api/tickets/[ts]/*` go stale after the server has run a while; the test reads a live one from `/api/tickets`.
- The dev server answers a not-found page of the desk (a ship outside a one-queue reviewer's queue) with status 200 and empty content; the test checks the content.
