# Platform preview: rules the plans leave open

Recorded 2026-10-20. The platform preview (`apps/platform`, merged to `development` in PR #134) ships every tab as a working feature on sample data, by owner instruction (see [DECISIONS.md](DECISIONS.md), "Preview milestone ships working features on sample data"). Where a canonical plan settles a rule, the preview implements it as written. Where the plans are silent, the preview picks a working value, labels it "Draft preview rule" on screen, and keeps it in one constant.

This file merges the "Unsettled by the plans" sections of the five `SOURCES.md` files under `apps/platform/components/pages/` (`build/`, `community-a/`, `community-b/`, `gear/`, `hub/`) into one deduplicated list, grouped by the plan that should decide. A draft value is a placeholder so a flow can run. It is not a proposal and not policy. Each question needs a policy owner before a real service uses it.

Paths below are relative to `apps/platform/components/pages/` unless they start with `apps/` or `plans/`. The port map links here: [pixl-platform-port-map.md](pixl-platform-port-map.md).

## Plan 01: product and program

| Open question | Draft preview rule used | Constant or file |
|---|---|---|
| Which open-source licences count | Ten common OSI software licences and the three CERN OHL v2 licences for hardware design files | `OPEN_LICENSES` in `build/logic/validate.ts` |
| How the journal rule counts hours (section 6.2 assigns tracked sessions) | An entry is due when 8 or more development hours are uncovered; each hour is covered once; a ship needs at least one entry; an entry may cover 0 hours | `RULES.journalEveryHours` in `build/logic/constants.ts`; `build/logic/cadence.ts`, `build/logic/validate.ts` (`validateJournal`) |
| Hackatime and Lapse hours | Simulated: the tester types the reported hours; allocation is capped at what is reported; a repeat ship claims only hours not used by an earlier non-rejected ship | `shippedHours` in `build/logic/ship.ts` |
| Bill of materials fields | Every row needs a part, a whole quantity of 1 or more, a unit cost and a source (link or vendor); one unnamed currency; shown on the public page | `bomRowErrors`, `bomIsComplete` in `build/logic/validate.ts` |
| Private projects | A private project is hidden from other builders, but the ship check still needs a public source link and an open licence | `publicProjectFields` in `build/logic/validate.ts`; `shipChecklist` in `build/logic/ship.ts` |
| AI declaration (section 14 shows checkboxes and an estimated percentage; section 13 lists a 40 percent limit as an unselected candidate) | Checkboxes only, no percentage, no limit | `AI_USE_OPTIONS` in `build/logic/ship.ts` |
| Team check results (fit, clarification, partial scope, not eligible) | Approve with partial hours, changes requested (resubmit), reject (final, no payout). Per-member hours and Track XP allocation are not modelled | `applyShipAction` in `build/logic/ship.ts` |
| Verification flow and what an unverified account may do | Four states (not started, pending, verified, needs attention) with allowed steps between them; the page names no age numbers | `hub/logic/account.ts` (`transition`, `STATUS_TEXT`) |
| Connection scopes for Hack Club, Hackatime, Lapse and Slack | Draft scope lists for each service owner to confirm | `hub/data.ts`; `hub/account-connections.tsx` |
| Public profile fields, handle rules, avatar options, searchability | Handle 3 to 24 characters, display name 2 to 40, bio 280, pronouns 24, up to 3 links, up to 3 pinned projects, a short reserved-handle list; default public | `HUB_RULES` in `hub/logic/rules.ts` |
| Data export, import and account deletion | Export and restore cover only this browser's preview data; import limit 2,000,000 characters and 200 entries; deletion and retention are "to be defined" | `HUB_RULES.importMaxChars`, `importMaxEntries` in `hub/logic/rules.ts`; `hub/logic/transfer.ts` |

## Plan 02: economy and rewards

| Open question | Draft preview rule used | Constant or file |
|---|---|---|
| The score to multiplier curve (shared with Plan 22) | See Plan 22 below | |
| Rounding and precision | Multiplier two decimals; Ore and the 5 percent penalty to the nearest whole Ore | `DRAFT.multiplierDecimals`, `DRAFT.rounding` in `build/logic/constants.ts`; `gear/logic/pricing.ts` |
| Era bonus, Signal bonus and the 5,000 Ore cap: stacking order | Build does not model them (a switch only lifts the ceiling to 30x). Gear computes the 10 percent Era bonus on the standard-rate base Ore only | `build/logic/scoring.ts`; `gear/logic/ore-calc.ts` |
| Track XP and track level | Level is one per approved ship in that track, capped at 15; default sample levels Tools 6, Hardware 3, Systems 1, Compute 1 | `DRAFT_RULES.level` in `community-b/data.ts`; `DRAFT_RULES.defaultLevels` in `gear/data.ts` |
| Discount curve between level 1 and 15 | `round(20% x ((level - 1) / 14) ^ 1.2)`, from `plans/proposals/economy-calibration.md` section 3.1 | `DRAFT_RULES.discountCurveExponent` in `gear/data.ts` |
| General Requisition values and triggers (section 26.11 working defaults) | I, II, Master: 1,000 / 2,000 / 4,000 Ore minimum, 10 / 15 / 15 percent, 300 / 600 / 1,000 Ore largest saving; the award trigger is a Preview tool | `DRAFT_RULES.generalRequisitions` in `gear/data.ts` |
| Cross-track buying markup (a +10 percent surcharge is only a candidate) | No markup; an item outside your tracks simply has no discount | `gear/logic/pricing.ts` |
| A Requisition on a quantity above 1 | Applies to one unit | `gear/logic/pricing.ts`, `gear/logic/orders.ts` |
| Buyer cancellation terms | A cancelled order refunds its Ore once and gives its Requisition back | `gear/logic/orders.ts` |
| Catalog contents, prices beyond the eight working examples, access classes, level requirements | 16 sample items; eight prices from section 67, eight made up and marked "Sample price"; draft level requirements for the FPGA board (5) and GPU grant (9) | `gear/data.ts` (sample catalog, `PLAN_RULES`) |
| Maximum quantity and field limits | 5 per order, hours field 10,000, note length 140 | `DRAFT_RULES.maxQuantity`, `maxHours`, `maxNote` in `gear/data.ts` |
| Custom Orders: level tiers, quote validity, sourcing and landed-cost formula, tax, delivery, refunds | Request fields and a status flow (Requested, In review, Quote ready, Ordered, Declined, Withdrawn); the quote is typed by hand in Preview tools; no level gate | `gear/logic/custom-orders.ts` |
| Referral reward amounts and any milestone ladder | The page says "Reward set by the program" and grants nothing; codes are `LO-` plus six hash characters; 50-invite limit | `gear/logic/referrals.ts` |
| Usage Milestone thresholds, rewards, repeat use, evidence, what counts as an active user | Shown as "To be announced"; the count is a self-entered note | `gear/referrals-page.tsx` |
| Leaderboards: which boards launch, scoring windows, ties, whether a zero ranks, how Track boards score, Review Contribution weighting (section 24) | Highest first, competition ranking (1, 2, 2, 4), a value above zero to be ranked, Track scope uses home track; "Reviews given" (raw count) and "Journal hours" stand in for the weighted boards | `DRAFT_RULES.leaderboard`, `METRICS` in `community-b/data.ts`; `community-b/logic/standings.ts`, `ranking.ts` |
| Leaderboard privacy and opt-out | "Hide me from public leaderboards" is offered as a proposal | `community-b/leaderboards-page.tsx` |
| Achievement catalog, rarity, tracks and rewards (section 21) | 21 achievements in three rarities, four per-track "Start a project" entries, all with no Ore reward | `CATALOG` in `hub/logic/achievements.ts` |
| Contributor achievement: one-time or once per project (see "Plan contradiction" below) | One claim, one credit of +50 Ore, in the ledger once | `HUB_RULES.contributorOre` in `hub/logic/rules.ts`; `hub/logic/claims.ts` (`CREDIT_KEY`) |
| Who verifies a contribution and what evidence is needed | A project, an https link and a self-attestation; a Preview tools button stands in for the reviewer | `hub/logic/claims.ts` (`validateClaim`) |
| Seasonal quest titles and Ore values (section 23 examples need verification) | Build lists the six plan examples with draft Ore; Seasons shows a separate draft quest list and awards no Ore | `QUESTS` in `build/content.ts`; `QUEST_DEFS` in `community-b/data.ts` |
| Season dates and cadence after Season 00 (section 22) | Season 00 is 4 weeks, later Seasons 6 weeks (from the plan); the calendar starts 5 Oct 2026 as a placeholder | `SEASON_CALENDAR_START_ISO`, `SEASONS` in `community-b/data.ts` |

## Plan 11: eras and community progression

| Open question | Draft preview rule used | Constant or file |
|---|---|---|
| Era sequence, who approves it, per-Era threshold | Illustrative sequence; threshold 1000 to 1800 per Era; sample community starting totals | `ERA_CONFIG` in `community-b/data.ts` |
| Reset time zone and hour | Weeks run Monday 00:00 UTC to Sunday 24:00 UTC | `DRAFT_RULES.week` in `community-b/data.ts`; `community-b/logic/dates.ts` |
| Era Points formula and whether per-builder Era history stays visible | 120 Era Points per approved ship; only approved ships add points | `DRAFT_RULES.eraPointsPerShip` in `community-b/data.ts`; `community-b/model.ts` |
| Era start date and the preview "now" | Era starts 12 Oct 2026; the Preview date is 20 Oct 2026 and can be moved in Preview tools | `ERA_CONFIG`, `PREVIEW_ANCHOR_ISO` in `community-b/data.ts` |
| Mission catalogue, order, difficulty and rewards (the plan sets the structure only) | Seven invented missions; "Draft preview reward" of 20 / 35 / 60 Ore by difficulty, credited once with an idempotent key | `MISSIONS` in `build/content.ts`; `DRAFT.missionRewardOre` in `build/logic/constants.ts` |
| Mission reviewer qualification and rejection reasons | A simulated reviewer in Preview tools | `build/mission-detail.tsx`; `build/logic/missions.ts` |

## Plan 15: LOADOUT IRL and events

| Open question | Draft preview rule used | Constant or file |
|---|---|---|
| Online event types, capacity and waitlist, RSVP deadline, how attendance is confirmed | Four sample online events; first come first served; full events keep a waitlist and the first person waiting takes a freed seat; RSVP closes at the start; "Mark attended" is a Preview tool | `DRAFT_RULES.rsvp`, `SAMPLE_EVENTS` in `community-b/data.ts`; `community-b/logic/events.ts` |
| LOADOUT IRL date, venue, funding, travel support, registration | Not modelled. The page says "Planned, details unconfirmed", shows no date and offers no RSVP, only a local "Get notified" toggle | `community-b/events-page.tsx` |

## Plan 22: peer review and multipliers

| Open question | Draft preview rule used | Constant or file |
|---|---|---|
| The percentile to multiplier curve (plans fix the 1x to 20x range, the 10x mean and the 30x Great ceiling, not the curve) | Draft curve `1 + 19 x p^(10/9)`, where p is the midrank percentile from 0 to 1. The exponent `19/9 - 1` is chosen so evenly spread percentiles average exactly 10x. Stardance's published exponent belongs to a dollars per hour range, so it cannot be reused (see the source note below) | `DRAFT.curveExponent` in `build/logic/constants.ts`; `DRAFT_RULES.scoreCurveExponent` in `gear/data.ts` |
| The percentile population (sampling window, small cohorts) | The ship is ranked against an invented cohort of 24 earlier ships plus itself | `DRAFT_COHORT_ROWS` in `build/logic/constants.ts` |
| Curve versioning and historical recalculation | Snapshots record `loadout_preview_draft_v0`; recalculation is not modelled | `DRAFT.curveVersion` in `build/logic/constants.ts` |
| Reviewer debt after a corrected, skipped or invalid review | A submitted review counts once; skipped and reported ships never count; a Preview shortcut can count the rest as done and is labelled | `RULES.reviewsOwed` in `build/logic/constants.ts`; `payoutBlockers` in `build/logic/ship.ts` |
| Penalty counter after it trips (what a fourth rejected flag does) | The counter resets when the penalty is set; the next payout spends the penalty | `RULES.penaltyRejectedFlags`, `penaltyWindowHours`, `penaltyPercent`; `registerRejectedFlag` in `build/logic/ship.ts` |
| Flag details (who, how many, minimum reason, multiple pending flags) | Only a counted review in the locked snapshot can be flagged, once, inside the window, with a non-empty reason; other pending flags stay pending and keep holding payout | `build/logic/ship.ts`; `build/ship-feedback.tsx` |
| "Award locked" has no duration of its own | The stepper shows it complete when the snapshot exists and the flag window as the current step | `build/ship-panel.tsx`; `RULES.flagWindowHours` |
| Assignment details (teammate and prior-reviewer exclusion, claim and submit times, moderator view) | Exclusions are trivially true in the sample queue; claim time, submit time and "repository opened" are recorded; no moderator view | `build/review-queue.tsx` |
| Sample ships to review | Invented, anonymised by code name; repository text is a label, not a link | `build/logic/sample-review.ts` |

The 24 hour gates need real days, so Build keeps a saved preview clock that Preview tools can move. "Back to real time" resets it. See `build/clock.ts`.

## Other: the proposal and areas with no plan owner

Owner: `plans/proposals/future-platform-ui.md`, plus Plan 01 sections 53 and 54 where noted. These need a policy owner named before any real page.

| Open question | Draft preview rule used | Constant or file |
|---|---|---|
| Comment length and posting limits | 500 characters; 20 comments per hour | `DRAFT_RULES.commentMax`, `rate.commentsPerHour` in `community-a/logic/rules.ts` |
| Idea limits and statuses; who may mark Planned or Done | Title 80, description 10 to 600, 5 per day; statuses Open, Planned, Done, Withdrawn; a participant can withdraw or reopen only their own idea and never set Planned or Done | `DRAFT_RULES` in `community-a/logic/rules.ts` |
| Idea board versus "collectibles" | Nothing built | none |
| Show and Tell format and featuring | Title 80, built 20 to 800, https link, track, learned 600, 3 posts per day; "Featured this week" is sample-selected | `DRAFT_RULES` in `community-a/logic/rules.ts` |
| Friend versus follow | Following is one-way and instant; a friendship needs a request and an accept; unfriending does not unfollow | `DRAFT_RULES.friendNeedsAccept` |
| Post notifications default and which events notify | Off for each new follow until turned on; only simulated Show and Tell posts are gated | `DRAFT_RULES.notifyOnFollowDefault` |
| Blocking | Hides the builder everywhere, removes follows, followers, friendship and pending requests both ways, and is not undone by unblocking | `DRAFT_RULES.blockRemovesRelations` |
| Reporting and review (who reviews, response times, penalties) | One report per item, reason from a short list plus 300 characters; reporting hides the item for you by default; stored in the browser | `DRAFT_RULES.reportNoteMax`, `reportHidesByDefault` |
| Activity list and page sizes | 10 latest events from builders you follow; Explore 12, Ideas 8, Show and Tell 9 per page | `DRAFT_RULES.activityLimit`, `projectsPerPage`, `ideasPerPage`, `postsPerPage` |
| Streak definition (unit, qualifying actions, time zone, repair, reward) | Consecutive ISO weeks with at least one ship, review or journal entry; an unfinished empty week keeps the streak but marks it at risk | `DRAFT_RULES.streak` in `community-b/data.ts`; `community-b/logic/streak.ts` |
| Certificates (wording, layout, what earns one, how codes are signed, public verification) | Title "Achievement certificate", "attended" wording, code `LDT-XXXX-XXXX-C` with a check character, unsigned, verified only against certificates stored in the same browser | `DRAFT_RULES.certificate`; `community-b/logic/certificate.ts` |
| Collectible catalog, rarities, unlock conditions | An invented catalog; "Claim (preview)" for conditions the preview cannot check | `gear/logic/collectibles.ts`; `gear/data.ts` |
| Notification rules (which events notify, defaults per kind, quiet hours, channels) | Seven kinds; a kind switched off is hidden from the inbox and unread count but kept; quiet hours are stored and do nothing; Slack is "not connected"; no email | `lib/notifications.ts`; `hub/logic/inbox.ts` |
| Digital Loadout artifacts (named in the proposal) | Not built | none |
| Stock, delivery dates, shipping costs, regional availability and tax | None shown as real; copy says they are confirmed once ordering opens | `gear/data.ts`, `gear/orders-page.tsx` |

## Plan contradiction found while building

Plan 02 section 20 says the first meaningful external contribution earns a "one-time achievement worth +50 Ore" (`plans/02-economy-and-rewards.md`, line 233). Section 21's list says FIRST OUTSIDE CONTRIBUTION "grants +50 Ore once per project" (line 254). One-time and once per project are different rules. The preview follows section 20: one claim, one credit. The Plan 02 owner should pick one wording and update the other section.

## Source note: Stardance curve

The Build agent noted that no curve from percentile to a 1x to 20x multiplier is published for LOADOUT. Stardance's `app/models/post/ship_event/payouts.rb` gives only the shape `low + (high - low) x percentile^exponent`, with its own exponent (1.745427173, recorded in [DECISIONS.md](DECISIONS.md)), a dollars per hour range and a currency. Those do not map onto LOADOUT's 1x to 20x range with a 10x mean, so the preview copies none of Stardance's numbers. The draft curve above is LOADOUT's own, kept in `build/logic/constants.ts` so a real configuration can replace it in one place (Plan 22 section 3 asks for that). The Plan 22 owner should either publish the curve or confirm the shape.

## Code notes found while documenting

These are not plan questions. They need an owner decision or a small fix.

1. `lib/preview-store.ts` says an in-memory cache lets the tab continue when storage is full or blocked, but `write` clears the cache entry after a failed write, so the change does not show. With storage blocked, `read` always returns the sample seed.
2. Build lists the Plan 02 section 23 quests with draft Ore; Seasons shows a different draft quest list with no Ore. Two lists answer the same open question. Pick one source before a service is built.
3. Hub achievements are written to `hub.earned` only while a Hub page that uses `useHub` (Overview, Profile, Achievements) is open.
4. Other tabs use the fixed preview identity `ME` (`lib/sample/builders.ts`). The Profile handle and display name apply to the Profile tab's public view only.
5. Notification preferences hide a kind in the Notifications tab and its unread count only. `pushNotification` still stores every kind, and no other tab reads the preferences.
6. No browser check was run for the Gear and Hub pages when they were written (their `SOURCES.md` files say so). Treat the interactive behaviour as untested in a browser until that is done.
