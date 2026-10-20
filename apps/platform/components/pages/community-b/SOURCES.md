# Sources: Leaderboards, Seasons, Events

Pages in this folder: `leaderboards-page.tsx`, `seasons-page.tsx`, `events-page.tsx`. All three run on sample data and keep your changes in this browser's localStorage under keys that start with `commb.` (see `state.ts`). Nothing is sent anywhere.

## Reference files copied or adapted

| Reference file | What was taken | Where it went | Licence |
|---|---|---|---|
| `references/stasis/lib/certificates.ts` (`normalizeCode`, `findCertificate`) | The idea that a code is printed in capitals and typed back by hand, so verification ignores casing and stray separators, then looks the code up among issued certificates. Rewritten (no Airtable, no server cache); the preview looks codes up in certificates stored in the browser. | `logic/certificate.ts` (`normalizeCode`, `verifyCode`) | Stasis, owner-stated permission (evidence pending, see `docs/source-audit/DECISIONS.md`) |
| `references/stasis/app/api/certificate/verify/route.ts` | The verifier's answer shape: valid or not, plus only the name and issue date, never contact details. | `events-parts.tsx` (`VerifyPanel`, `verifyMessage`) | Stasis, owner-stated permission |
| `references/stasis/app/certificate/page.tsx` | The flow: one code input, a Verify button, an "issued to" result with the code and date. No markup or styling copied. | `events-parts.tsx` (`VerifyPanel`) | Stasis, owner-stated permission |

Consulted but not copied:

- Stardance `app/components/discover_rail/streak_widget.rb` and `streak_badge_component.rb`: a streak widget with day counts. LOADOUT's streak is weekly and has no daily-roll, sticker or claim mechanics, so no code was reused.
- Pixl `apps/web-shell` navigation (already adapted by the shell) and the Pixl vault "GOALS" idea, which informs the shared Era progress meter. No Pixl code was copied into this folder. Pixl is MIT; the notice is kept in `docs/source-audit/ATTRIBUTION.md`.

No Stasis lab, inventory, tool rental, NFC or printer features are implemented (Plan 15 reserves them for possible IRL operations).

## Plan content used as written

- Plan 02 section 22: Season 00 is 4 weeks, later Seasons 6 weeks after validation; themes S00 BOOT, S01 TOOLCHAIN, S02 ACCELERATE, S03 BARE METAL, S04 NETWORK, S05 MEASURE with their one-line descriptions; competitive Season rankings reset while lifetime Ore, Track XP and project history persist.
- Plan 02 section 23: the six example quests are listed (not playable) because they need verification.
- Plan 02 section 24: the leaderboard families (Season Ore, Lifetime Ore, Hours, Track boards, Review Contribution, Signal, New Builders).
- Plan 11: Era cadence (at least 14 days, first check at the second weekly reset, ADVANCEMENT READY, advance only when both the minimum and the threshold hold), Era Points are non-spendable and come only from approved project work, the planned +10% qualifying-project bonus is described but not applied, the Season / Era / weekly reset table, and the Era objective examples. The Era sequence is shown as an illustrative example, as the plan says.
- Plan 15 and `plans/proposals/future-platform-ui.md`: LOADOUT IRL is a planned future event with unconfirmed date, venue, funding, travel support and registration. The page shows "Planned, details unconfirmed", no date, no RSVP, and a local "Get notified" toggle.
- `plans/proposals/future-platform-ui.md`: no daily rolls, raffles or chance-based rewards; no open-world game; Stasis event-lab systems excluded.

## Draft preview rules (all in `data.ts`, `DRAFT_RULES`, plus the constants named below)

Each is labelled "Draft" in the UI.

| Rule | Where | Why it exists |
|---|---|---|
| Weeks run Monday 00:00 UTC to Sunday 24:00 UTC | `DRAFT_RULES.week`, `logic/dates.ts` | Plan 11 leaves the reset time zone open |
| Season and Era dates (Season calendar starts 5 Oct 2026, Era starts 12 Oct 2026) and the Preview "now" of 20 Oct 2026 | `SEASON_CALENDAR_START_ISO`, `ERA_CONFIG`, `PREVIEW_ANCHOR_ISO` | The plans give no dates; the rules need some calendar to be testable |
| Streak: consecutive ISO weeks with at least one logged ship, review or journal entry; a not-yet-ended empty week keeps the streak but marks it at risk | `DRAFT_RULES.streak`, `logic/streak.ts` | Streaks are a planned feature with no definition |
| Leaderboard scoring: highest first, competition ranking, a value above zero to be ranked, track scope on Ore/Reviews/Hours means home track | `DRAFT_RULES.leaderboard`, `logic/standings.ts`, `logic/ranking.ts` | Plan 02 lists boards but not scoring windows or tie rules |
| Boards "Reviews given" (raw count) and "Journal hours" | `METRICS` | Plan 02's Review Contribution board is quality-weighted and its Hours board counts approved hours; these are stand-ins and are tagged Draft |
| Track level = one level per approved ship in that track, capped at 15 | `DRAFT_RULES.level`, `levelFromShips` | The XP formula is open in Plan 02 |
| Era threshold per Era (1000 to 1800), sample community starting totals, 120 Era Points per approved ship | `ERA_CONFIG`, `DRAFT_RULES.eraPointsPerShip` | Plan 11 says thresholds and the points formula are open and must not be published as live facts |
| Only approved ships add Era Points; reviews and journals count for quests and streak only | `seasons-parts.tsx`, `model.ts` | Plan 11: only approved, non-duplicate project work contributes |
| Draft quest list (BOOT SEQUENCE, KEEP A LOG, PAY IT BACK, WEEKLY RHYTHM, DOUBLE SHIP); no Ore is awarded for quests | `QUEST_DEFS` | Plan 02 quest values and list are open, and the plan examples need verification |
| Capacity and waitlist: first come first served, full events keep a waitlist, the first person waiting takes a freed seat, RSVP closes at the start | `DRAFT_RULES.rsvp`, `logic/events.ts` | The plans define no event capacity rules |
| Four sample online events (Build night, Review sprint, Demo hour, Bench hour), seat counts and dates | `SAMPLE_EVENTS` | Invented to exercise the flows; not scheduled events |
| Certificate: title "Achievement certificate", "attended" wording, code format `LDT-XXXX-XXXX-C` with a check character, "Mark attended" as a Preview tool | `DRAFT_RULES.certificate`, `logic/certificate.ts` | The plans name achievement certificates but give no wording, layout or code format |
| Sample builders beyond `SAMPLE_BUILDERS` (14 more, two private) and all their standings | `data.ts` (`EXTRA_BUILDERS`, `sampleBoardBuilders`) | So the board spans several pages and shows the privacy rule |

## Unsettled by the plans

These are not decided anywhere in `plans/` and must be settled before a real service is built. The preview uses the Draft rule above in each case.

1. Leaderboards: which boards launch, the scoring window for each, tie-breaks, whether a zero ranks, how Track boards are scored (home track versus per-track XP), and the quality weighting for Review Contribution.
2. Streaks: the definition (unit, qualifying actions, time zone), whether a missed period can be repaired, and any reward.
3. Seasons: start dates, exact cadence after Season 00, how quests are chosen per Season, quest rewards, and how Season ranks and archives are shown afterwards.
4. Community Eras: the sequence and who approves it, reset time zone and hour, the Era Points formula, per-Era thresholds, whether per-builder Era history stays visible, and bonus stacking with other multipliers (Plan 11 pre-implementation list).
5. Events: online event types, capacity and waitlist rules, RSVP deadlines, how attendance is confirmed, and anything about LOADOUT IRL beyond the concept (date, venue, funding, travel support, registration).
6. Certificates: the wording, layout, what earns one, how codes are issued and signed, and how verification is exposed publicly. The preview code is unsigned and verifies only against certificates stored in the same browser.
7. Privacy: the exact fields a builder can make public and whether an opt-out from leaderboards is offered. The preview offers "Hide me from public leaderboards" as a proposal.
