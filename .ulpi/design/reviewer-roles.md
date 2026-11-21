# Reviewer site roles

Ported from Pixl's internal dashboard (`hackclub/pixl`, `apps/internal-dashboard`, pinned at `1468ba69`; Pixl's role history read at 330ac8a2). Sources:
`lib/roles.ts`, `lib/guard.ts`, `lib/reviewAccess.ts`, `lib/fulfillmentAccess.ts`, `app/_ui/nav.ts`, `app/admins`, `app/reviewers/[id]`. Updated 16 Nov 2026
for the owner's instruction: "we also need the different role levels Pixl has (org, reviewer, participant and the others) so that ours only shows what
the different review levels allow", and "map all the different roles of Pixl onto our system".

The rules live in code and are checked by tests:

- `lib/reviewer/access.ts` (pure rules) with `access.test.ts` and `access-levels.test.ts` (every level against every requirement).
- `lib/reviewer/route-matrix.ts` (every page and API route with the access it enforces) and `route-matrix.test.ts` (fails when a route has no guard, is
  missing from the matrix, or the matrix and the file's own `requirePage(...)` disagree; also checks the nav against the matrix).
- `reviewer-dash/lib/guard.ts` and `session.ts` (the adapters the copied Pixl pages call: `requirePage`, `getAccess`, `guardedAction`, `guardedRoute`, `can`, `landingFor`).

## Roles

| Level | How it is held | What it sees |
| --- | --- | --- |
| Owner (organiser) | `LOADOUT_OWNER_EMAILS` in the environment only. No table, grant or screen can make one. | Everything, and manages the team. |
| Reviewer | grant `reviewer` | Review queue (first pass), Reviewed, own stats, Guidelines, Projects (read). |
| Final reviewer | `reviewer` + marker `second_pass` | Reviewer set, plus Spot check (final verdicts), held ships and the integrity tab. May edit a submission. |
| Queue-limited reviewer | `reviewer` + `reviewer_hardware_only` or `reviewer_software_only` | A reviewer, but only that queue: its tab, its ships, its counts. Other ships answer 404, on the page and in every action. |
| Integrity reviewer | grant `fraud_review`, no `reviewer` | Only the integrity tab (Pixl: "Fraud reviews", AI-usage and double-dip flags). No queue, no verdicts. |
| Helper | grant `helper` | Tickets only. |
| Fulfiller | grant `fulfiller` | The order pages only (queue, labels, Airbridge preview). |
| Builder (participant) | no grant | Nothing on the reviewer site: plain 404 everywhere, including the APIs. The participant platform only. |
| Signed in, no role | no grant (a former reviewer, a new account) | Same as a builder: plain 404. |
| Not signed in | none | Plain 404. The site does not advertise itself. |

Helper and fulfiller can be held together (and with a reviewer grant); the landing page is the first of reviewer, helper, fulfiller.

### Markers

Markers only work on a reviewer (alone they grant nothing; `fraud_review` is the exception, it is a role of its own).

| Marker | Effect |
| --- | --- |
| `second_pass` | Makes the reviewer a final reviewer (Spot check, held ships, integrity tab, editing a submission). |
| `reviewer_hardware_only`, `reviewer_software_only` | One queue only. Pages, nav counts, the search and every action (`queueAllows`, `canReviewShip`). |
| `edit_submission` | May edit a submission's title, links and description. Final reviewers and owners always may. |
| `ai_draft` | May generate the prepared draft note. Owners always may. |
| `full_queue` | May open any ship in the first-pass queue, not only the first page (Pixl's `canOpenFullQueue`). Owners always may. |
| `no_review` | Takes reviewing away, even from an owner: no queue count, no claim, no verdict, no Flagship mark. The rest of the owner's rights stay. |

The owner switches these on the Admins page and the Reviewer detail page (Pixl's controls: final reviewer, edit submission, AI draft, queue; plus a full queue control added for LOADOUT). The change is kept in memory for this server run (sample data) and takes effect for that person on their next request.

## Landing rule

(`landingFor`, Pixl's order.) A person with a role who opens a page they may not see is redirected to their own page: owner `/`, reviewer `/review`, helper `/tickets`, fulfiller `/fulfillment`, integrity reviewer `/review/fraud-reviews`. A person with no role (or not signed in) gets the plain 404. API routes do not redirect: no role is 404 JSON, a role that is not enough is 403 JSON (the tickets routes answer 404 for any non-helper). Pixl's spelling `/fulfillment` is the route.

## Who opens what

Y = opens it. R = redirected to their own page. Owner passes every gate. Builder and nobody get 404 on every row.

| Page | Owner | Reviewer | Final rev. | Hardware / software only | Integrity | Helper | Fulfiller |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` Overview | Y | R (to `/review/stats`) | R | R | R | R | R |
| `/settings` | Y | Y | Y | Y | Y | Y | Y |
| `/review` queue | Y | Y | Y | Y, own queue | R | R | R |
| `/review/[id]` desk | Y | Y | Y | Y, own queue ships (404 otherwise) | R | R | R |
| `/review/reviewed`, `/review/stats`, `/review/guidelines` | Y | Y | Y | Y | R | R | R |
| `/review/spot-check` | Y | R | Y | R (unless also final) | R | R | R |
| `/review/fraud-reviews` (integrity) | Y | R | Y | R | Y | R | R |
| `/review/proposed-bans`, `/review/log`, `/review/audit` | Y | R | R | R | R | R | R |
| `/review/macros`, `/review/pay`, `/review/erasure`, `/review/age-exceptions` | Y | R | R | R | R | R | R |
| `/projects`, `/projects/[id]` | Y | Y | Y | Y, own queue | R | R | R |
| `/players`, `/reviewers`, `/admins`, `/fulfillers/[id]`, `/reports`, `/violations`, `/bans`, `/ideas`, `/notify`, `/forms`, `/budget`, `/operations`, `/shop`, `/shop-detail`, `/events`, `/referrals`, `/community-goals`, `/show-n-tell`, `/stats` | Y | R | R | R | R | R | R |
| `/tickets` | Y | R | R | R | R | Y | R |
| `/fulfillment`, `/fulfillment/label/[id]`, `/fulfillment/airbridge-preview` | Y | R | R | R | R | R | Y |

Inside the pages: the verdict form, claim and Flagship mark show only for a ship the viewer may review (their queue, not their own, and they are not `no_review`); owner-only controls show only to owners; final-stage actions only to final reviewers and owners; a fulfiller sees buyer details only for an order they claimed (owners see all); only an owner opens the Fulfillers tab. The exact list, with the API routes, is `lib/reviewer/route-matrix.ts`.

The top bar shows the same: owner: Overview, Review, Projects, Players and a More menu; reviewer and final reviewer: My stats, Review, Projects; integrity reviewer: Fraud reviews; helper: Tickets; fulfiller: Fulfillment. Badge counts are per role and per queue (a hardware-only reviewer is never shown the software count). The command palette and search offer only what the role may open.

## Pixl role to LOADOUT role

| # | Pixl role | How Pixl grants it | LOADOUT equivalent and grant | What it sees | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Owner | `ADMIN_SLACK_IDS` env only | Owner / organiser: `LOADOUT_OWNER_EMAILS` env only (plus the two local test owners in development) | Everything | Implemented |
| 2 | Reviewer | `admins` row holding `review` | Reviewer: grant `reviewer` | First-pass queue, Reviewed, stats, Guidelines, Projects | Implemented |
| 3 | Final reviewer | `review` + `second_pass` (or `SECOND_PASS_SLACK_IDS`) | Final reviewer: `reviewer` + `second_pass` | Spot check, final verdicts, held ships, integrity tab | Implemented (no separate env list: owners and `second_pass` holders) |
| 4 | Queue-limited reviewer | `review_hardware_only`, `review_software_only` | `reviewer_hardware_only`, `reviewer_software_only` | One queue and its ships only | Implemented |
| 5a | Edit-submission marker | `edit_submission` | `edit_submission` | May edit title, links, description | Implemented |
| 5b | AI-draft marker | `ai_draft` | `ai_draft` | May generate the prepared draft note (a stub: no service behind it) | Implemented (the button answers that there is no service) |
| 5c | Full-queue marker | `full_queue` | `full_queue` | May open any ship in the first-pass queue | Implemented |
| 5d | No-review marker | `no_review` | `no_review` | An owner who must not review | Implemented (stricter than Pixl: also blocks verdicts and claims in the actions) |
| 6 | Fraud reviewer | `fraud_review` without `review` | Integrity reviewer: `fraud_review` (requirement `{ review: "fraud" }`; wording becomes "Integrity reviews" in the adjustment pass) | Integrity tab only | Implemented |
| 7 | Helper | `helpers` table | Helper: grant `helper` | Tickets | Implemented |
| 8 | Fulfiller | `fulfillers` table; claim, credit, ship; close, reassign, cancel and the Fulfillers tab owner-only | Fulfiller: grant `fulfiller`; same split (buyer details only for the claimed order, own orders refused) | Order pages | Implemented. Difference: Pixl lets owners fulfil their own orders since 14 Nov; LOADOUT keeps "nobody fulfils their own order, owners included" |
| 9 | Participant (player) | A `users` row with no dashboard access | Builder: no grant. Participant platform only; 404 on the reviewer host | Nothing here | Implemented |
| 10 | Project owner and collaborator | `projects.user_id`, `project_collaborators` (accepted and pending) | Project owner and team member: a reviewer may never review, claim, hold, flag or edit-level a ship they own or collaborate on, owners included | n/a | Implemented in the desk and every project action (`authorize`). Pixl's time-limited self-review exception (`grantSelfReviewException`) is not built |
| 11 | Sponsor (label for `review` + `second_pass`) | A label on the Admins page, not a role | Not a separate role: it is a final reviewer | n/a | Out of scope |
| 12 | Beacon nomination | Any reviewer (`reviewer` gate), not on their own or a collaborator's project | Flagship award mark: any reviewer who may review that ship (`canFlagship`); hidden from everyone else | The Flagship card on the desk | Implemented (the mark only; the award itself is in `plans/proposals/rewards-and-recognition.md`) |

### Removed by Pixl in migration 0215, not ported

- Super admin (a table that granted owner; an attacker inserted themselves into it on 2026-10-11). Owner stays environment-only here.
- Sub-admin permission labels (warn, ban, notify, pixels, shop, fulfillment, events, sidequests, story, goals, news, referrals, ideas, tickets, lookup, show_n_tell, forms, operations): all owner-only now, so there is nothing to grant. Unknown grant values are ignored, including the old `staff` value.
- Moderator and report viewers: a reviewer proposes a ban, only an owner confirms; reports are owner-only.

### Also out of scope

Game-side roles (Trials, NPCs), Slack ids (a handle stands in), the weekly review minimum and the reviewer food grant (reward decisions for the owner), Robert and Fraudy scoring beyond the stubbed integrity tab.

## Rules carried over, applied when the review service exists

- Nobody reviews their own or a collaborator's project. A ban proposal needs a different reviewer than the proposer; only an owner confirms a ban; a non-owner final reviewer who disagrees sends the ship back into the pipeline.
- Buyer details (name, address) only to the fulfiller who claimed that order, or an owner. Nobody fulfils their own order.
- A reviewer acknowledges the current guidelines before the first review (the desk redirects to Guidelines until they do).

## Local preview

Local test accounts (`bun run db:seed:local`) stand in for sign-in until Hack Club Auth is connected. The cookie `loadout_preview_role` (or `LOADOUT_PREVIEW_ROLE`) picks one: `owner`, `owner-no-review`, `reviewer`, `final-reviewer`, `hardware-reviewer`, `software-reviewer`, `senior-reviewer` (edit, draft, full queue), `integrity-reviewer`, `helper`, `fulfiller`, `builder`, `none`. A "View as" menu in the reviewer top bar sets it; it renders only while local test accounts are on, never in production. A builder or no-role view is a 404 and shows no menu: set the cookie to switch back.

## Open for the owner

Keep the Integrity reviewer level (Pixl's fraud reviewer) and rename it; whether owners may fulfil their own orders (Pixl allows it, LOADOUT does not); whether to build the time-limited self-review exception; a separate list for final reviewers in the environment; cookie domain across the main and review hosts; the weekly review minimum and any reviewer reward.
