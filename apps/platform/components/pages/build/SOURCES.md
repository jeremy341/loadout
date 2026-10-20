# Sources for the Build tabs

Projects, Journals, Reviews and Missions in `apps/platform/components/pages/build/`. This file feeds the attribution log
(`docs/source-audit/ATTRIBUTION.md`) and lists everything the plans leave open. Rules cited in code comments point at the
plan file that owns them.

## Plans these tabs implement

| Rule | Owner | Where it lives |
|---|---|---|
| Four tracks, Research Mode as a modifier, open source, Hackatime for software and Lapse for Hardware, Hardware bill of materials, public by default, Lapse reviewer-only | `plans/01-product-and-program.md` sections 3, 5, 6 | `logic/ship.ts` (`shipChecklist`), `logic/validate.ts` (`publicProjectFields`, `bomIsComplete`) |
| One journal entry per eight hours of development, per project; each tracked hour covered once | Plan 01 section 6, 6.6 | `logic/cadence.ts`, `logic/validate.ts` (`validateJournal`) |
| Four quality dimensions scored 1 to 9, written reason of at least ten words | Plan 22 section 1, Plan 02 sections 9 and 10 | `logic/scoring.ts` (`validateReviewInput`, `countWords`) |
| 12 countable reviews, first 12 in creation order, category medians, mean of the four medians, no outlier trimming | Plan 22 sections 1 and 3 | `logic/scoring.ts` |
| Midrank percentile, all tied gives the midpoint | Plan 22 section 3 | `logic/scoring.ts` (`midrankPercentile`) |
| Lock needs 12 reviews AND 24 hours since the latest journal; then a 24 hour flag window; pending flag holds payout; upheld flag discards the review, takes a new snapshot and window | Plan 22 section 2 | `logic/ship.ts` (`lockReadiness`, `evaluateShip`, `applyShipAction`) |
| Three rejected flags within ten hours: 5 percent off the next final payout | Plan 22 section 2 | `logic/ship.ts` (`registerRejectedFlag`, `applyPenalty`) |
| Eight valid reviews owed before the builder's own payout | Plan 22 section 1, Plan 01 section 35 | `logic/ship.ts` (`payoutBlockers`) |
| One active assignment at a time, skipped and reported ships excluded | Plan 22 section 4 | `review-queue.tsx` |
| Normal 1x to 20x, 10x mean, Great Signal ceiling 30x, Ore = hours x rate | Plan 22 section 1, Plan 02 sections 10 and 11 | `logic/constants.ts` (`RULES`), `logic/scoring.ts` |
| Repeat ships need five new approved hours | Plan 02 Part III | `logic/ship.ts` (`shipChecklist`, `shippedHours`) |
| Every ship declares AI use | Plan 01 section 14 | `logic/ship.ts` (`AI_USE_OPTIONS`) |
| Missions: curated steps, prerequisites where useful, submissions and review, no map, NPC loop or energy | Plan 11 "Missions", `plans/proposals/future-platform-ui.md` | `logic/missions.ts`, `content.ts` |
| Seasonal quest titles and example Ore values | Plan 02 section 23 | `content.ts` (`QUESTS`) |

Draft values are all in `logic/constants.ts` (`DRAFT`, `DRAFT_COHORT_ROWS`, `DRAFT_NOTE`) and are labelled "Draft preview rule"
or "Draft preview reward" on screen.

## Reference material read and adapted

No source code was copied. The references were read for structure and for the shape of rules; every line here is new
LOADOUT code, in LOADOUT's own interface.

| Reference file | What was taken | Licence |
|---|---|---|
| `references/stardance/app/models/post/ship_event/payouts.rb` | The method only: first N ordered votes, per-category median, mean of the medians, midrank percentile `(below + 0.5 x equal) / n`, tie gives 50, and a payout curve of the form `low + (high - low) x percentile^exponent`. The exponent, range, cohort and the LOADOUT categories are different (see Unsettled below). | Stardance, owner-stated permission (evidence pending, `docs/source-audit/DECISIONS.md`) |
| `references/stardance/app/models/mission.rb`, `mission/step.rb`, `mission/prerequisite.rb`, `mission/submission.rb` | The shape of a mission: difficulty (beginner, intermediate, advanced), estimated minutes, a hardware flag, ordered steps, prerequisite links that lock a mission until they are approved, a submission guide, and the submission states (awaiting review, pending, approved, rejected with a message). Renamed and simplified to draft, submitted, in review, approved, needs changes. Stardance prizes, shop unlocks, payout paths, guide variants and the voting path were not used. | Stardance, owner-stated permission |
| `references/pixl/apps/game/web/projects-ship-checklist.test.ts` | The idea of a live ship checklist whose lines turn on tracker hours. LOADOUT's checklist is different: Hardware is not exempt from tracking (Lapse is required), and it adds open source, journals, bill of materials, summary and AI declaration. | Pixl, MIT, Copyright (c) 2026 Pixl |
| `references/stasis/*` | Not used. | n/a |

Suggested `ATTRIBUTION.md` lines: Stardance payout method and mission model (structure only, no code); Pixl ship checklist
idea (structure only, no code).

## Unsettled by the plans

Each item below is something the plans do not settle. The preview picks a working behaviour, says so on screen, and keeps the
number or rule in one place.

### Percentile, multiplier and Ore

1. **The percentile to multiplier curve.** Plans fix the range (1x to 20x), the 10x mean and the 30x Great ceiling, not the curve.
   Draft: `1 + 19 x (percentile / 100) ^ (19/9 - 1)`, chosen so evenly spread percentiles average exactly 10x. `DRAFT.curveExponent`.
2. **The percentile population.** Plan 22 leaves the sampling window and small-cohort behaviour open. Draft: the ship is ranked
   against an invented cohort of 24 earlier ships plus itself. `DRAFT_COHORT_ROWS`.
3. **Rounding and precision.** The multiplier keeps two decimals, Ore is rounded to the nearest whole Ore, and the 5 percent
   penalty is rounded to the nearest whole Ore. Plan 02 section 11 and Plan 22 section 3 leave this open. `DRAFT.multiplierDecimals`.
4. **Era bonus, Signal bonus and the 5,000 Ore cap** are not modelled. A "Great Signal approved" switch in the preview tools
   only lifts the curve's ceiling to 30x, before the award locks. Plan 02 leaves the stacking order open.
5. **Track XP** is not modelled (the XP award equation, track allocation and Research bonus are open in Plan 02).
6. **Curve versioning.** Snapshots record `curveVersion: loadout_preview_draft_v0`; historical recalculation is not modelled.

### Review and payout operations

7. **Reviewer debt.** Plan 22 leaves open how debt accrues or is restored after a corrected, skipped or invalid review. Draft: a
   submitted review counts once; skipped and reported ships never count; a preview shortcut can count the rest as done and is
   always labelled as a shortcut.
8. **Penalty counter after it trips.** The plans do not say what a fourth rejected flag does. Draft: the counter resets when the
   penalty is set and the penalty is spent by the next payout.
9. **Flag details.** Draft: only a counted review in the locked snapshot can be flagged, once, inside the window, with a
   non-empty reason (no minimum length is set by the plans). If a flag is upheld while other flags are pending, those flags
   stay pending and keep holding payout.
10. **Award locked and flag window.** The plans open the window at the moment of the lock, so "award locked" has no duration of
    its own. The stepper shows it complete as soon as the snapshot exists and the flag window as the current step.
11. **Team check results.** Plan 01 lists fit, clarification, partial scope and not eligible. The preview models approve (with
    partial hours), changes requested (resubmit) and reject (final, no payout). Per-member hours and Track XP allocation are not modelled.
12. **Assignment details.** Matchmaker exclusions for teammates and prior reviewers are trivially true in the sample queue.
    The preview records claim time, submit time and whether the repository was opened (Plan 22 section 4), but no moderator view exists yet.

### Projects, evidence and journals

13. **Which licences count as open source.** Plan 01 requires an open-source licence and lists none. Draft: ten common OSI
    software licences and the three CERN OHL v2 licences for hardware design files. `OPEN_LICENSES` in `logic/validate.ts`.
14. **Journal rule reading.** An entry is due when eight or more development hours are not covered by any entry. Each hour can be
    covered once. A ship needs at least one entry, because the 24 hour gate counts from the latest entry. The tracked-session
    assignment model in Plan 01 section 6.2 is simplified to numbers of hours. An entry may cover 0 hours.
15. **Hours.** Hackatime and Lapse are simulated: the reported hours are a number the tester types, and allocation is capped at
    what is reported. A repeat ship claims only hours not used by an earlier non-rejected ship.
16. **Bill of materials.** Plan 01 asks for quantities and sources. Draft: every row needs a part, a whole quantity of 1 or
    more, a unit cost and a source (a link or a vendor name). One currency is assumed; none is named. The bill is shown on the public page.
17. **Project visibility.** Plans say public by default. A private project is hidden from other builders, but the ship check
    still needs a public source link and open licence because accepted projects must publish source.
18. **AI declaration.** Plan 01 section 14 shows checkboxes and an estimated percentage; section 13 marks the 40 percent limit as
    an unselected candidate. The preview asks for the checkboxes only.

### Missions

19. **Mission catalogue, order, difficulty and rewards.** Plan 11 sets the structure and says rewards must come from configured
    server state. The seven missions are invented sample content. Mission rewards are "Draft preview reward" values by
    difficulty (`DRAFT.missionRewardOre`), credited to the preview Ore ledger once on approval with an idempotent key.
20. **Seasonal quests.** Titles and Ore amounts are the examples in Plan 02 section 23. Season dates, lengths and rewards
    are not set, so none are shown.
21. **Reviewer.** Mission review is simulated with the preview tools. Reviewer qualification and rejection reasons are not settled.

### Preview only

22. **The preview clock.** The 24 hour gates need real days, so the preview tools can move a saved clock forward. Everything
    on these tabs reads "now" from that clock. "Back to real time" resets it.
23. **Sample ships to review** are invented and anonymised by code name; their repository text is a label, not a link.
