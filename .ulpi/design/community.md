# Community section (participant platform)

**Status:** Built on `feature/participant-platform-m1` as read-only, fixture-driven pages. Not reviewed by the owner yet. Nothing is stored; the data is in `lib/platform/community.ts`.
**Binds to:** [m1-platform-shell.md](m1-platform-shell.md), plan 11 (Community Eras), plan 02 (no shop suggestions or voting, no permanent discounts for rank) and the "Social and community" bullet of `plans/proposals/future-platform-ui.md`.

## Design direction

A notice board in a field station: ruled sheets of short rows with pixel headings, one framed sheet per list, and one stage strip for the Era. It is not a feed. Pixl supplies what each page contains (Show & Tell rounds, the idea board, news, stats and community goals); its look is not used.

## Rules that shaped it

- Every page carries one quiet "proposed / invented samples" line (`SampleNote`). Handles are invented, hours and votes are fixture numbers.
- No dates, venues, prices or logistics. Upcoming sessions say "Next session: date to be announced." Past sessions are numbered recaps with no date.
- Plan 11 says no threshold, percentage or countdown for the Era until it is configured, so the Era strip shows the example sequence, the rules (14 day minimum, advance at an eligible weekly reset, +10% qualifying project bonus, marked planned) and no progress.
- No nested bordered cards: each list is one framed sheet with rules between rows, or a `pf-box` with unframed rows inside.
- Statuses and ranks are words first (a status word plus a small shape, "tied" spelled out, the percentage written next to every bar), never colour alone.
- Filters, sorts and the leaderboard view live in the address. The only client component is the tab row, which needs the pathname for `aria-current`.

## Pages

| Route | Contents | Disabled and why |
|---|---|---|
| `/dashboard/community` | Page head, tab row, Era strip, then Show & Tell (next session + 2 recaps) beside a 3 row weekly leaderboard, then top 3 ideas beside latest 3 news. Each preview links to its page. | Nothing writes. |
| `/dashboard/community/show-and-tell` (+ `/[id]`) | Upcoming sessions (no dates) and past recaps; a session lists its showcases (project, handle, track). | "Offer a showcase" is disabled: "Showcase sign-up opens with the community release. Nothing here is saved." |
| `/dashboard/community/ideas` (+ `/[id]`) | Idea board with vote counts, statuses Open, Planned, Built, Declined, `?status=` and `?sort=top\|newest`. The page says ideas cannot be shop requests. | Upvote buttons are disabled: "Voting opens with the community release. Nothing here is saved." |
| `/dashboard/community/news` | Five short program notes, newest first, no dates, event details or prices. | None. |
| `/dashboard/community/leaderboard` | Approved hours, `?range=weekly\|all-time` and `?track=`, ranks with ties (1, 2, 2, 4), depth at 1 m per approved hour. No Ore for anyone. | None. |
| `/dashboard/community/goals` | Three community goals as plain HTML+CSS bars with the figures written out, each marked Provisional with a proposed shared reward. | None. |

## Decisions

- Goals use approved hours, tracks covered and builders, not Era Points, because plan 11 leaves the points formula and thresholds open. Every target and reward is provisional. The one reward plan 11 supports is "the next Era begins"; the General Requisition reward is plan 02's "may be earned through community actions" and says its triggers are not decided.
- Idea 4 "Peer scores" is a declined sample that records the 22 Oct 2026 decision that review has no peer rating or scores. A unit test keeps shop words out of the idea fixtures.
- Goal percentages round down, so a bar never reads 100% before the target is met.
- The hub shows no goals preview; the Era strip links to Goals.
- Not built, per the plans: reposts, an endless feed, shop suggestions or voting, likes, follows and comments (they need real data and moderation).

## Formatting pass (12 Nov 2026)

- Every Community list page opens with the visible h1 and one lead sentence (`CommunityHead` = `PageHead` + the tab row), so the heading comes first in reading order and the tabs sit under it. Idea and session detail pages have no tab row, like the other detail pages.
- Events is the seventh tab (`/dashboard/community/events`). On a phone the seven tabs wrap in two rows with 44 px targets.
- Hub previews share one shape (a head and three rows): Show & Tell, Leaderboard (an ordered list: rank, handle, hours), Top ideas (votes, title) and Latest news. Cards in a row share a height and the extra goes to the rows, so no frame has a blank band. A Referrals box at the foot links to `/dashboard/referrals`, which has no tab.
- Leaderboard: the "deeper" word is hidden visually on phones (the column header says Depth gained; screen readers still hear it) so the depth column no longer wraps.
- "See all" links are real 44 px targets.
