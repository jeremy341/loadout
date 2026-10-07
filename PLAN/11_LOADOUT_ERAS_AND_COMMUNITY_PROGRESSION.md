# LOADOUT Eras and Community Progression

**Status:** Approved product design, recorded 2026-10-05. This plan documents the mechanic; implementation is not part of this change.

**Canonical owner:** This plan owns Era cadence, advancement, Era Points, the Era Bolt bonus, and Era objectives. Plan 01 owns product meaning, Plan 02 owns the economy formula, Plan 03 owns UI states, Plan 05 owns launch operations, and Plan 06 owns the compact public explanation. If copies disagree, this plan governs Era-specific behavior.

## Product decision

LOADOUT uses **Community Eras**: shared periods that progress through stages of technical development as builders ship approved projects.

The identity line is:

> **LOADOUT advances when builders do.**

This is collaborative progression around real technical work. It is not a fictional calendar, lore system, fifth track, or project-eligibility gate.

Illustrative sequence:

```text
STEAM → ELECTRIFICATION → COMPUTING → NETWORKS → ACCELERATION
```

This sequence is an example, not a launch order or promise. Era themes, wording, thresholds, and unlock dates remain configuration approved before launch. Do not claim a historical year or fixed launch schedule.

## Cadence and advancement

- An Era starts on the program's normal weekly reset.
- An Era lasts **at least 14 days**.
- The first eligible advancement check is the **second weekly reset after it begins**.
- Reaching the community threshold before that check sets **ADVANCEMENT READY**. The current Era remains active until the scheduled check.
- Advancement happens only when both conditions hold: the minimum duration has elapsed and the current Era threshold is met.
- If the threshold is still unmet after 14 days, the Era stays active. Once the threshold is met, advance at the next eligible weekly reset.
- Never advance automatically on a timer without the community threshold, and never shorten the minimum duration because participation is high.

Example:

```text
Monday: Era begins
Monday, one week later: first reset; Era continues
Thursday: threshold reached; show ADVANCEMENT READY
Monday, two weeks after start: next Era begins
```

The authoritative reset timezone, reset-hour behavior, downtime/retry policy, and the exact handling of a threshold crossed during a reset are implementation decisions that must be specified before launch. Store one configured schedule and use it consistently for participant displays and server-side advancement.

## Era Points

- Approved projects contribute non-spendable Era Points to shared Era progress.
- Era Points are a distinct progress measure, separate from global spendable Bolts and lifetime per-track XP.
- Era Points cannot be transferred, purchased, or spent.
- A builder can see the contribution recorded for their approved project and the shared progress counter.
- Candidate conceptual relationship:

  ```text
  approved work × quality × Era relevance → Era contribution
  ```

- This is not an approved numeric formula. Exact weighting, point caps, threshold values, aggregation, correction/reversal behavior, and retained per-Era history remain open. Do not publish sample thresholds or formula coefficients as live facts.
- Only approved, non-duplicate project work contributes. Era activity must not bypass the normal project-fit, quality, time-validation, attribution, or anti-abuse rules.

## Era build bonus

- A project may receive the Era bonus only when it meaningfully matches the active Era objectives.
- The builder may request Era-bonus review when submitting a project; this request does not affect normal eligibility or the base review.
- A reviewer makes a separate **binary** decision: qualifies or does not qualify. Do not implement partial percentages in the initial design.
- A qualifying project receives **+10% of its approved base Bolt award**. Example: 720 approved base Bolts → 72 Era bonus → 792 total Bolts.
- There is **no Era bonus to Track XP**. Era relevance is not a fifth quality dimension and must not alter LOADOUT's four quality dimensions: Originality, Technical Depth, Execution, and Documentation.
- Non-qualifying Era relevance never makes an otherwise valid LOADOUT project invalid and never reduces its normal approved award.
- Store the reviewer decision and a short reason in the audit record. The review UI should distinguish the Era decision from the quality score and any other multiplier.
- The final stacking order against existing Bolt multipliers, ceilings, corrections, and duplicate-award protections must be resolved in the economy implementation plan before code ships. The +10% value does not silently change other formulas.

## Era objectives

- Each Era can offer approximately **4–8 optional objectives** as a planning target, not a hard limit.
- Objectives describe technical challenges that can be answered in Tools, Systems, Compute, or Hardware. They do not require every participant to produce a historically accurate artifact.
- A project can qualify across tracks when its actual technical work fits the objective.
- Objective examples for an Electrification-themed Era:
  - **Measure:** collect or visualize physical data.
  - **Control:** build electronic control.
  - **Automate:** automate a physical or computational process.
  - **Optimize:** improve system efficiency or performance.
- Keep objectives optional. Normal project eligibility remains based on LOADOUT's four tracks and existing fit rules.
- Curate objective text and reviewer examples before displaying it publicly. Do not imply that illustrative examples are exhaustive or guarantee approval.

## Seasons, Eras, and weekly resets

These are different systems:

| System | Meaning | Reset behavior |
|---|---|---|
| **Season** | Competitive leaderboard/program period | Season-specific ranks reset; the existing season plan governs |
| **Era** | Shared technological progression | Advances only when both the threshold and minimum-duration rules are satisfied at an eligible weekly reset |
| **Weekly reset** | Schedule boundary | Refreshes weekly missions and checks whether a ready Era may advance |

Lifetime Bolts, the Digital Loadout, lifetime Track XP, and project history do not reset when an Era changes. Era Points are not a second currency. The exact archived-history presentation is still open.

## Product surfaces

### Public homepage

Show one compact community-progression section. Keep the homepage's primary story in this order: projects → skills → progression → rewards. Avoid turning the program homepage into a history game or lore dump.

Use illustrative sequence copy until live Era configuration exists. Do not show a percentage, point threshold, countdown, next Era date, or active-era bonus that is not backed by real configured data.

### Physical event continuity

A future LOADOUT IRL event uses the same online Community Era and global Era Points. Its approved project contributions enter the ordinary shared total; no local event meter, immediate Sunday transition, event-only XP/Bolts, or attendance-gated progression is created. The detailed event concept is in `15_LOADOUT_IRL_RUHR.md`. Do not announce it or expose sample event counts until its operational/public-readiness gates are met.

### Builder dashboard

The dashboard may show the current Era, verified community progress, the +10% qualifying-project bonus, the next eligible reset, and **ADVANCEMENT READY** when the configured threshold is reached before that reset. Do not substitute timers or mock values for server state.

### Missions

Treat Era Objectives as a separate optional layer beside weekly missions and seasonal quests. Explain what differs: weekly missions are short repeatable tasks, Era Objectives are optional technical themes for the active Era, and seasonal quests belong to the longer competitive season.

## Integrity and audit requirements

- Era Points, thresholds, reviewer eligibility decisions, resets, and transitions are calculated and enforced server-side.
- Record the input and resulting community total for each approved project contribution so moderation can explain changes.
- Make reviewer Era decisions independently reviewable, with a reason and actor.
- Keep duplicate projects, duplicate time, team attribution, fraud detection, reviewer-quality controls, and admin corrections under the existing review/economy audit model.
- Define behavior for disqualification, overturned reviews, contribution reversals, missing reset jobs, idempotent retries, admin corrections, and re-review before implementation.
- Never let an admin adjustment erase the audit history. A correction should identify its actor, reason, prior value, and new value.

## Pre-implementation decisions

Before building the mechanic, resolve and record:

1. Era sequence and who approves later Era themes.
2. The reset timezone, weekly reset time, durable schedule source, and missed-job recovery behavior.
3. The points formula, point precision/caps, threshold for each Era, and aggregation/reversal rules.
4. Whether historical per-builder Era contributions remain visible after an Era ends.
5. The exact base Bolt amount and bonus stacking/cap rules, with worked examples.
6. Reviewer qualification criteria, required reason, and moderator override/re-review behavior.
7. The initial optional objective count and cross-track objective examples.
8. Which values may be public before launch and how unavailable/unconfigured Era state is displayed.
9. Persistence, idempotency, race handling at a weekly reset, and tests for early, late, missing, duplicate, and reversed contributions.

These choices must not be inferred from sample UI. Implementation starts only after the policies and operational schedule are approved.
