# Reviewer site: Moderation pages (Reports, Violations, Bans, Audit log)

**Status:** round 4, 7 Nov 2026. Level with Pixl's internal dashboard of 5 Nov 2026. Read only, sample data. Proposed bans and the hardware queue belong to the Review pages (agent R).

## Parity table

| Pixl page | Action |
| --- | --- |
| `reports`: Open, Resolved, Dismissed, All tabs with counts; Reported player with a repeat flag, Status, Reported by (anonymous unless the reporter filed 3 or more, then "Unmasked"), Filed | match. AI verdict column and AI summary: drop |
| `reports/[id]`: reason, AI analysis, chat, People, Actions (resolve, dismiss, warn and ban the reported player, warn and ban the reporter when revealed) | match with the reported item instead of chat (LOADOUT has no live chat). The reporter is told privately that the report was reviewed. AI analysis and chat: drop |
| `violations`: kind tabs, search, 20 a page, Moderate column with warn and ban | match: tabs by rule, search, 20 a page, Warn and Ban per row (disabled) |
| `bans`: Bans, Proposed, Ban log tabs | match: `?tab=proposed` (confirm or reject, disabled, owner only) and `?tab=log` |
| `removed`: the screen for a person removed from the team | drop as a list. Our old `/removed` list of removed items was our own invention. Removed projects now show in the Projects archive, removed posts in Ideas. The "you were removed" screen needs a person who is signed in with no role, which the site answers with a plain 404 on purpose (`requireAccess`); see the open question below |
| `review/(tabs)/audit` (audit notes) | owned by agent R at `/review/audit` |
| audit log (system events) | Pixl removed its audit log page on 12 Oct. Ours is real data (`AuditEvent`), so it stays at `/audit`, unchanged |

## Disabled and why
Resolve, dismiss, warn, ban, lift, confirm and reject: "Opens with the review service. Nothing here is saved." One sentence per page or block, each button points at it.

## Data
`lib/reviewer/moderation.ts`: reports (now with an anonymous flag and a third repeat reporter), violations, proposals, bans (with `banLog`), the record of removals, and `moderationLogFor(handle)` which the player page reads. `moderation.test.ts` covers them.

## Open question for the lead
Pixl's `/removed` is where a person without a role lands. Showing that screen means `requireAccess` redirecting to it instead of `notFound()`, which is outside this area.
