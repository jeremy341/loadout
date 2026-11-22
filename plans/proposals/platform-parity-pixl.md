# Platform parity with Pixl

**Status:** Internal. Owner decisions taken 22 Nov 2026: the eight original open questions answered "same as Pixl", plus reviewer pay settled as 4 Ore on approval or ban and 2 Ore on needs-changes. This plan records what those decisions mean, the gaps found by three read-only mappings of `references/pixl` against `apps/landing`, and the order of work. Nothing here is built. Plans 01, 02, 05 and 11 keep ownership of their own policy; this plan owns only the parity work and points at them.

`references/pixl` is a pinned submodule at upstream `1468ba69`. Reading it is fine; nothing in it is edited.

## 1. How the comparison was made

Three read-only mappings, each comparing one area of Pixl with LOADOUT and writing nothing:

| Area | Pixl source | LOADOUT source |
| --- | --- | --- |
| Review pipeline | `apps/internal-dashboard/lib/robert*.ts`, `reviewAccess.ts`, `app/actions.ts` | `apps/landing/lib/platform/review-rules.ts`, `review-actions.ts`, `lib/platform/fraud/` |
| Permissions | `lib/reviewAccess.ts`, `lib/fulfillmentAccess.ts`, `lib/roles.ts`, env lists | `lib/reviewer/access.ts`, `lib/platform/session.ts`, `lib/platform/review-rules.ts`, role grants in `prisma/schema.prisma` |
| Shipping and fulfilment | `lib/fulfillment*.ts`, `app/fulfillment/` | `apps/landing/lib/platform/orders*.ts`, `fulfilment-data.ts`, `shop-rules.ts`, `apps/landing/reviewer-dash/` |

LOADOUT has two fulfilment implementations. `lib/platform/` is real and database-backed. `apps/landing/reviewer-dash/` is the vendored Pixl desk whose pages still read and write the in-memory sample store. Most of the shipping gap is the distance between those two, not a missing design.

## 2. Decisions (owner, 22 Nov 2026)

The first eight are "same as Pixl". Reviewer pay in row 9 is an owner rate above Pixl's dollar value, recorded deliberately; section 6 explains the difference.

| # | Question | Pixl rule | Effect on LOADOUT |
| --- | --- | --- | --- |
| 1 | Does the fraud score gate the next stage? | Yes. A real score moves the project from `fraud_review` to `second_review`. A score of 4 or less only adds an alert. | Change from advisory to gating. Needs a parking state between first pass and second pass, which LOADOUT does not have today. |
| 2 | Keep the human fraud triage? | No. Pixl dropped it when it adopted Robert. | Drop `recordFraudTriage` and the `canGiveSecondPassVerdict` triage gate. The score and Robert's note are the evidence the second pass reads. |
| 3 | When is a ship sent to the fraud service? | After first-pass approval only. | Narrow submission from `submitted` and first pass to after first-pass approval. `ROBERT_SUBMIT_STATES` already has the switch; the candidate rule needs the parking state from #1. |
| 4 | What happens when the fraud service is unset? | Every project parks. | Park instead of `{ disabled: true }` and carrying on. A missing key must stop approvals, not silently pass them. |
| 5 | Unship from which stages? | Fraud review, second review and approved. | Extend `mayUnship` beyond `approved`. A stage with no credit yet needs no clawback; the ledger plan must say so explicitly. |
| 6 | Do fulfillers get paid? | Yes: 6 pixels per item, 2 per grant, credited at settlement. | Pay in Ore, rounded up to the next whole Ore: 2 per item, 1 per grant (owner, 22 Nov 2026). Detail in section 6. |
| 7 | May an owner fulfil their own order? | Yes, since 14 Nov 2026. | Drop the own-order refusal in `canCommit`. The sample store already says "nobody fulfils their own order, owners included", so the desk copy, the rule and its test all change together. |
| 8 | Per-option stock? | Yes, `shop_option_stock`. | Already in place in LOADOUT (`ShopOptionStock`, `stockNeeds`, `hasStock`). Nothing to port; the desk's sample stock display should read the real table when the pages are wired. |
| 9 | Reviewer pay | Admin-configurable per verdict; currently 4 px approval, 2 px needs-changes, 4 px ban. | 4 Ore approval and ban, 2 Ore needs-changes (owner, 22 Nov 2026). Detail in section 6. |

## 3. Corrections to the first report

Three findings were wrong. They were checked against `prisma/schema.prisma` after the mapping returned.

| First report said | Actually |
| --- | --- |
| "No collaborator or invite table exists, so self-review is never applied." | `ProjectCollaborator` exists with `invited`, `accepted` and `declined`, and `SelfReviewException` exists for the exception path. The real gap is smaller: `review-data.ts` still passes `collaboratorIds: []` and `pendingInviteIds: []` into the review payload, so the rule never sees the rows. Fix the payload, not the schema. |
| "The database has no field for the claiming fulfiller." | `FulfillmentCommitment.fulfillerId` exists, with `committedAt` and `doneAt`. What is missing is that the desk's claim writes to the sample store instead of this table. |
| "No inbound path for Robert's outcome." | `lib/platform/fraud/robert-sync.ts` polls pending rows and records `cleared`, `flagged` or `error` as append-only `FraudCheck` rows. It is polling, not a signed webhook plus reconcile job, and it is deliberate. |

Two findings stand and are the serious ones: fulfilment writes to `lib/sample/ops.ts`, which is empty after a restart, and the review payload ignores collaborators.

## 4. Gaps that stand

### Fulfilment

- The desk's order actions write to the in-memory sample store (`reviewer-dash/app/actions-ops.ts` imports `opsStore` and `patchOrder` from `lib/sample/ops`). A restart loses every claim, pack and ship.
- `ShopOrder` has no tracking number, no carrier, no supplier and no fulfilled-by columns. Nothing records who shipped what or with which tracking code.
- Pack and ship are separate writes with no transaction, so a crash between them leaves an order half moved.
- The buyer cannot see tracking. The order page reads status only.
- Owner cancel writes `cancelled` and states in the note that no Ore were refunded. The ledger is never touched.
- Fulfiller payouts are not settled anywhere. `ReviewPayout` covers reviewers only.
- The funding flow saves nothing.

### Review pipeline

- The score is advisory (`robert-outcome.ts`: "Neither moves the project, sets triage or sends a DM"), which decision 1 reverses.
- Submission is wide, before first pass, which decision 3 narrows.
- The human triage is the only decider, which decision 2 removes.
- Unship is owner-only and `approved`-only (`mayUnship`), which decision 5 widens.
- An unset Robert config answers `disabled` and continues, which decision 4 reverses.

### Permissions

- The self-review payload is empty, so a collaborator can review their own project today.
- Review and team actions write no per-action audit row. Pixl writes one per action.
- Builder privacy redaction is not confirmed in the review payloads.
- The second-pass environment list is not ported. LOADOUT uses role grants instead, so this is a policy question, not a code gap.

## 5. Work order

One step per pull request, in this order. Each step starts from `origin/main` on its own `feature/` or `fix/` branch.

### Step 1: Persist fulfilment

1. Add the missing `ShopOrder` columns: tracking number, carrier, supplier, and the person who shipped it. A migration, with the schema comment naming the owning plan.
2. Move the desk's order actions off `lib/sample/ops.ts` onto `lib/platform/orders-data.ts` and `fulfilment-data.ts`. Keep the sample store only for local test accounts, the same way `sampleShipsOn()` gates sample ships.
3. Make claim, pack and ship compare-and-set on the current status inside one transaction, so two fulfillers cannot both move the same order.
4. Show tracking to the buyer on the order page. This is a UI change, so it needs a scoped design brief before the code.
5. Delete the sample fallback from the orders path once the real path is the only one.

### Step 2: Review pipeline

1. Add the parking state between first pass and second pass.
2. Make a real score advance the project; a score of 4 or less flags it and keeps the alert visible.
3. Remove the human triage and its gate.
4. Narrow submission to after first-pass approval.
5. Park every project when the Robert config is unset.
6. Widen unship to fraud review, second review and approved, with clawback only where credit exists.
7. Create a `ReviewPayout` row at each verdict: 4 Ore on approval or a confirmed ban, 2 Ore on needs-changes. A first-pass approval stays pending until the final verdict settles, with no cut for an overturned first pass.

### Step 3: Permissions

1. Fill `collaboratorIds` and `pendingInviteIds` from `ProjectCollaborator`, and enforce self-review against them, with `SelfReviewException` as the documented exception.
2. Write a per-action audit row for review and team actions.
3. Confirm builder privacy redaction in the review payloads.
4. Record the owner-fulfil change (#7) in the rule, the desk copy and the tests.

### Step 4: Money

1. Refund owner cancels through the ledger, with an audit row.
2. Settle fulfiller payouts in the database at ship, keyed to the order and the fulfiller.
3. Wire up funding so it saves.

### Step 5: Docs

Update Plans 01, 02, 05 and 11 with the rules settled here, and the port map (`apps/landing/reviewer-dash/ADJUSTMENTS.md`). Plan 05's order flow still says `RECEIVED → APPROVED → PURCHASED → SHIPPED → TRACKING → DELIVERED`, which does not match the implemented `placed → packed → shipped → delivered → cancelled`. Pick one and make the plan, the code and the desk agree.

## 6. Fulfiller payout and open values

### Fulfiller payout (settled 22 Nov 2026)

Pay Pixl's value in Ore, rounding the converted amount **up** to the next whole Ore. The owner chose the ceiling rule; it is a rounding rule, not a new rate.

```text
payoutOre = ceil(payoutPixels × pixelValueUsd / oreValueUsd)
pixelValueUsd = 0.10   (Pixl)
oreValueUsd   = 0.435  (10 Ore = $4.35)

item  = ceil(6 × 0.10 / 0.435) = ceil(1.38) = 2 Ore
grant = ceil(2 × 0.10 / 0.435) = ceil(0.46) = 1 Ore
```

Cross-check: Pixl's base-to-max payout is $4–6 an hour, which is 40–60 pixels, so 6 pixels is 10–15% of an hour. 10–15% of LOADOUT's 10 Ore an hour is 1–1.5 Ore, the same band as the converted 1.38. Because Ore is whole, the paid value sits above Pixl's: 2 Ore is $0.87 against $0.60, and 1 Ore is $0.435 against $0.20. Recompute with the formula if either currency value changes.

### Reviewer pay (settled 22 Nov 2026)

| Verdict | Payout |
| --- | --- |
| Approval, including first pass | 4 Ore |
| Needs changes | 2 Ore |
| Confirmed ban | 4 Ore |

Pixl's live settings are 4 px on approval and 2 px on needs-changes after the ×0.7 rescale in migration 0194, with a flat 4 px for a ban. At $0.10 a pixel that is $0.40 and $0.20. The owner chose 4/2/4 Ore, the same numbers in Ore: 4 Ore is $1.74 and 2 Ore is $0.87, so this pays 4.35× Pixl in dollar terms. It is a deliberate choice, not the round-up conversion used for fulfiller pay.

A first-pass approval creates a pending `ReviewPayout` row. The final verdict settles it. No cut is applied for a rushed review, an unopened repo, an overturned first pass or a later hours correction. Verdicts outside the three above pay nothing. The `ReviewPayout` table already has `status` pending/paid/cancelled and `paidAt`; the verdict actions do not write it yet.

### Open values

| Value | Provisional | Why it is not settled |
| --- | --- | --- |
| Score threshold | 4 or less flags | Pixl's own fraud band. Carried over unchanged. |
| Unship at fraud review and second review | No clawback | There is no confirmed credit at those stages. Confirm before the code assumes it. |

Nothing here is a public claim. No participant-facing copy changes until a step ships and Plan 05 records the rule.

## 7. What this plan does not do

- It does not approve a live shop, ordering, fulfilment or delivery service.
- It does not settle prices, stock levels or reward values.
- It does not change the four quality dimensions, the four tracks, Research Mode, or the 13–18 age policy.
- It does not port anything else from Pixl that the mappings did not name.
