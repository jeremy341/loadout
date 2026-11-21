# Reviewer site: what is left of Operations (Notify and Flags)

**Status:** round 4, 7 Nov 2026.

| Pixl page | Action |
| --- | --- |
| `operations` | drop. After removing Operation Blackout (pay rates, entries, payouts) nothing LOADOUT-relevant is left. The backlog, orders and tickets figures live on the owner Overview (agent N), which reads `backlog`, `trackHours`, `openOrderCount` and `openTickets` from `lib/reviewer/operations.ts` |
| `stats` | drop. It is Pixl's public live-stats page, not a staff page |
| `notify` | match: audience (everyone or one player), player search, title (100), message (500), preview. The list of past notices is gone (Pixl has none). Disabled |
| Slack lookup (`/lookup`) | drop. Pixl removed it on 12 Oct and the Players search finds a builder by handle |
| Feature flags (`/flags`) | kept. Pixl has no flags page, but ours is real data with audited actions, so it stays |
| `settings`, `budget` | agent N |

`lib/reviewer/operations.ts` keeps only the pure helpers above and the Notify field limits; tests in `operations.test.ts`.
