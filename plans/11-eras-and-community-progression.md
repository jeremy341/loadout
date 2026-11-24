# LOADOUT Eras and Community Progression

**Status:** Approved product direction, recorded 2026-10-05. The planned Era-project bonus is +10% of base Ore; stacking, operations and implementation remain open and are not part of this change.

**Canonical owner:** This plan owns Era cadence, advancement, Era Points, the Era Ore bonus, Era objectives, and the selected mission structure. Plan 01 owns product meaning, Plan 02 owns the economy formula, Plan 05 owns launch operations, Plan 06 owns the compact public explanation, and the future platform proposal records selected surfaces. If copies disagree, this plan governs Era-specific behavior.

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

Owner decisions, 22 Nov 2026.

- Each Era has **one fixed Era Point threshold**, set by the owner before the Era starts.
- An Era stays open for **at least 14 days**. Never shorten the minimum because participation is high.
- When the threshold is met **and** 14 days have passed, the Era becomes **READY TO ADVANCE**. It stays the current Era until the **owner confirms the advance**, which can happen at any time. Nothing advances on a timer, and nothing advances without the owner's confirmation.
- A finished Era keeps the total it had when it closed. Later corrections, such as a ban, change only the current Era.
- The weekly reset no longer decides advancement. It still refreshes weekly missions.

Store each Era's start, threshold, ready time, and the owner's confirmation (actor and time) so the advance can be audited. The owner's confirmation is an admin action and follows the existing audit model.

## Era Points

Owner decisions, 22 Nov 2026.

- **1 approved hour of an Era project = 1 Era Point.** Points are added to the shared community total.
- Points are added **only at final approval**, after the first pass, the fraud review, and the second pass have all cleared. An approved project cannot be unshipped, so there is no reversal for a normal approval.
- Points belong to the Era that is current when the project is approved. Each Era starts at zero; **nothing carries over**.
- If a builder is banned, their Era Points are removed from the **current** Era. A finished Era keeps its closing total.
- Era Points are a distinct progress measure, separate from global spendable Ore and lifetime per-track XP. They cannot be transferred, purchased, or spent.
- A builder can see their own contribution and the shared total. The community total is the point of the page: nobody is ranked by Era Points, and there are no scores.
- Threshold values for each Era are not set yet. Do not publish sample thresholds as live facts.
- Only approved, non-duplicate project work contributes. Era activity must not bypass the normal project-fit, quality, time-validation, attribution, or anti-abuse rules.

## Era build bonus

Owner decisions, 22 Nov 2026.

- A builder marks a project as an **Era project** with a checkbox when they submit it. Any project can be marked. No objective is required. The mark does not affect normal eligibility or the base review.
- Only projects marked as Era projects add Era Points and earn the Era bonus.
- The bonus is **+10% of the project's approved base Ore award**, paid **once per project** at final approval. A resubmission after "needs changes" does not pay it again. Example: 720 approved base Ore → 72 Era bonus → 792 total Ore.
- There is **no Era bonus to Track XP**, and the Era mark is not a fifth quality dimension. LOADOUT's four quality dimensions (Originality, Technical Depth, Execution, Documentation) are unchanged.
- There is no separate reviewer decision on whether a project qualifies. Record who marked the project and when, and keep the bonus in the ledger audit trail.
- The final stacking order against existing Ore ceilings, corrections, and duplicate-award protections must be resolved in the economy implementation plan before code ships. The +10% value does not silently change other formulas.

## Era objectives

- Each Era can offer approximately **4–8 optional objectives** as a planning target, not a hard limit.
- Objectives describe technical challenges that can be answered in Tools, Systems, Compute, or Hardware. They do not require every participant to produce a historically accurate artifact.
- Owner decision, 22 Nov 2026: the objectives are examples only and no project needs one to be marked as an Era project. Whether they stay in the product is deferred.
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
| **Era** | Shared technological progression | Becomes ready when the threshold is met and 14 days have passed; the owner confirms the advance |
| **Weekly reset** | Schedule boundary | Refreshes weekly missions |

Lifetime Ore, the Digital Loadout, lifetime Track XP, and project history do not reset when an Era changes. Era Points are not a second currency. The exact archived-history presentation is still open.

## Product surfaces

### Public homepage

Show one compact community-progression section. Keep the homepage's primary story in this order: projects → skills → progression → rewards. Avoid turning the program homepage into a history game or lore dump.

Use illustrative sequence copy until live Era configuration exists. Do not show a percentage, point threshold, countdown, next Era date, or active-era bonus that is not backed by real configured data.

### Physical event continuity

A parked LOADOUT IRL event, if it is ever revisited, would use the same online Community Era and global Era Points. Its approved project contributions enter the ordinary shared total; no local event meter, immediate Sunday transition, event-only XP/Ore, or attendance-gated progression is created. The detailed event concept is in [Plan 15](15-loadout-irl-ruhr.md). Do not announce it or expose sample event counts until its operational/public-readiness gates are met.

### Builder dashboard

The dashboard may show the current Era, verified community progress, the +10% Era-project bonus, the days open against the 14-day minimum, and **READY TO ADVANCE** when the threshold is met and 14 days have passed, with a note that the owner confirms the advance. Do not substitute timers or mock values for server state.

### Missions

LOADOUT will include guided missions inspired by Stardance's step-based flow: curated steps, prerequisites where useful, submissions/review, and configured achievements or rewards. Keep them in LOADOUT's own industrial builder interface; do not add an open-world map, NPC quest loop, or Restoration Energy mechanic.

Treat missions, Era Objectives, and seasonal quests as distinct layers. Missions provide a guided path through a defined project or skill sequence. Era Objectives are optional technical themes for the active Community Era. Seasonal quests are short optional challenges during the longer competitive season. Their rewards and live progress must come from configured server state, not mock counters.

## Integrity and audit requirements

- Era Points, thresholds, reviewer eligibility decisions, resets, and transitions are calculated and enforced server-side.
- Record the input and resulting community total for each approved project contribution so moderation can explain changes.
- Make reviewer Era decisions independently reviewable, with a reason and actor.
- Keep duplicate projects, duplicate time, team attribution, fraud detection, reviewer-quality controls, and admin corrections under the existing review/economy audit model.
- Define behavior for disqualification, overturned reviews, contribution reversals, missing reset jobs, idempotent retries, admin corrections, and re-review before implementation.
- Never let an admin adjustment erase the audit history. A correction should identify its actor, reason, prior value, and new value.

## Pre-implementation decisions

Settled by the owner on 22 Nov 2026 (see the sections above): the points source and timing, per-Era totals with no carry-over, the fixed threshold per Era, the 14-day minimum, owner-confirmed advancement, the Era checkbox, the once-per-project +10% bonus, and ban handling. Before building the mechanic, resolve and record:

1. Era sequence and who approves later Era themes.
2. The threshold value for each Era.
3. Where the owner confirms an advance, what the confirmation records, and how a missed or repeated confirmation is handled.
4. Whether historical per-builder Era contributions remain visible after an Era ends.
5. The exact base Ore amount and bonus stacking/cap rules, with worked examples.
6. Whether the example objectives stay in the product (deferred).
7. Which values may be public before launch and how unavailable/unconfigured Era state is displayed.
8. Persistence, idempotency, and tests for early, late, duplicate, and banned-builder contributions, including the effect of a ban on the current Era total.

These choices must not be inferred from sample UI. Implementation starts only after the policies are approved.
