# LOADOUT — Launch & Operations Plan

This document owns how LOADOUT is funded, fulfilled, launched, measured, moderated operationally, and eventually expanded into IRL activity.

It does not redefine product/economy rules.


---

# 29. Limited Drops

**Open idea only.** No launch stock, schedule, or prize quantity is confirmed.

Example:

```text
DROP 003

3× Raspberry Pi 5
5× 1TB NVMe
10× $50 GPU compute
1× GPU
```

Drops give builders reasons to save Ore.

---

# 30. Sponsor Drops

**Open idea only.** Sponsor-supplied items or credits are not confirmed rewards.

Examples:

```text
AI PROVIDER DROP
20 × $50 inference credits

HOSTING DROP
25 × server credit packs

FRAMEWORK DROP
1 × laptop

GPU COMPANY DROP
2 × GPUs
```

Sponsors can contribute products/credits instead of cash.

---

# 31. Sponsor Challenges

**Open idea only.** Do not promise a challenge or special reward without a separate sponsor and budget approval.

Sponsor challenges should map directly to LOADOUT's technical tracks.

Examples:

## TOOLCHAIN CHALLENGE
Build a tool another builder can genuinely use.  
Special reward: developer hardware / tooling grant.

## COMPUTE CHALLENGE
Build a GPU, graphics, ML-systems, or performance project.  
Special reward: GPU / compute.

## HARDWARE CHALLENGE
Build embedded, PCB, robotics, or FPGA capability.  
Special reward: lab/dev hardware.

## SYSTEMS CHALLENGE
Build infrastructure, networking, runtime, storage, or server capability.  
Special reward: server credit / mini PC / networking gear.

Sponsor integration should be relevant to building, not just logo placement.

---

# 32. Fulfillment

Digital:
- cloud credits
- AI credits
- hosting
- domains
- software

Physical:
- trusted retailers
- sponsor fulfillment
- HCB-compatible purchasing where applicable

Order status:

```text
ORDER RECEIVED
↓
APPROVED
↓
PURCHASED
↓
SHIPPED
↓
TRACKING
↓
DELIVERED
```

---

# 33. Fraud / Abuse Prevention

## Time Abuse
Watch for:
- idle tracking
- fake sessions
- duplicate assignment
- unexplained marathon sessions
- repeated copy-paste work

## Referral Abuse
Watch for:
- alts
- fake referrals
- friend rings
- non-building invite accounts

## Voting Abuse
Watch for:
- vote trading
- reciprocal rings
- mass downvoting
- coordinated score manipulation

## Signal Abuse
Watch for:
- fake stars
- bots
- paid views
- artificial downloads

## AI Abuse
Watch for:
- fully AI-generated repos
- misleading declarations
- one-prompt apps
- minimal participant understanding

---

---

# 55. Sponsor Model

Sponsors may contribute:

## Cash
For:
- rewards
- custom orders
- shipping
- travel
- operations

## Credits
- AI
- GPU
- hosting
- storage

## Hardware
- GPUs
- dev boards
- mini PCs
- laptops
- 3D printers
- accessories

## Services
- PCB production
- cloud infrastructure
- domains
- licenses

## Event Support
- venue
- food
- travel
- workshops

---

# 56. Sponsor Pitch

> **LOADOUT helps young builders create the technical tools, systems, compute infrastructure, and hardware that make harder projects possible — then gives them access to better equipment to keep going.**

Sponsor value:
- technically serious builders genuinely use products
- hardware reaches people already building in the relevant domain
- visible open technical artifacts
- track-specific challenges
- project showcases
- measurable usage
- real developer / systems / hardware community
- a clear link between sponsor equipment and what builders create next

Avoid selling generic logo placement as the main benefit.

LOADOUT should be especially legible to sponsors in:
- semiconductors
- developer tooling
- cloud infrastructure
- GPU/compute
- embedded systems
- FPGA
- electronics
- networking
- maker/fabrication

---

# 57. LOADOUT IRL

Planned future physical extension, after the online loop and operating gates are ready. It is not an MVP requirement, public event announcement, or operationally confirmed event. The current concept is `LOADOUT IRL // Düsseldorf — Build the next Era.` Use the same online tracks, review, and global Era rules; do not promise travel support, applications, sponsors, or attendance. Plan 15 owns the event concept and readiness gates.

---

---

# 62. Launch Rules

Before Season 00, publish these rules clearly:

1. LOADOUT is **not** a general build-anything YSWS.
2. Projects must fit **Tools, Systems, Compute, or Hardware**.
3. Every project needs a **Capability Statement**.
4. Generic product/UI work is not enough by itself.
5. A larger app may receive credit only for its eligible technical core.
6. Research is a **mode**, not a catch-all track.
7. Every accepted project is open source; required source/design files are public.
8. Hackatime is required for software; Lapse is required for Hardware and its recordings are reviewer-only.
9. Add a journal entry at least every eight hours of development; never count pre-program or double-submitted time.
10. Hardware ships require a bill of materials.
11. Review quality is peer-scored 1–9 in each of LOADOUT's four categories; 12 countable reviews are required for every ship, including Hardware.
12. Normal Ore rates are 1×–20× with a 10× mean; Great Signal can raise the cap to 30×.
13. Ore is one **global** currency; listed Ore prices remain the same across regions.
14. Review payout timing, flags, and repeated-false-flag penalty follow Plan 22; there is no appeal.
15. Track levels cap at **15** and persist across seasons.
16. Permanent track discounts reach 15% at LV.15; combined savings, including a Requisition, are capped at 25% of the base price.
17. Field Requisitions are earned at LV.5, 8, 11, and 15 only.
18. Requisitions are one-use, non-transferable, non-expiring, and limited to one per order.
19. Requisitions never bypass a level wall.
20. Custom Orders require **level + Ore + program fit + fulfillment approval**.
21. Imported/prior YSWS work cannot generate a second payout for the same work.

Era launch rules are planned separately in `11_LOADOUT_ERAS_AND_COMMUNITY_PROGRESSION.md`. Before enabling an Era, operators must approve its theme, objective set, weekly-reset timezone, minimum-duration/threshold configuration, reviewer criteria, and audit/correction path. An unconfigured Era must not show live progress, a countdown, or a payout bonus.

The niche and economy must remain strict enough that a builder can understand both **why a project belongs** and **why a shop price is what it is**.

---

# 63. Launch Sequence

## Step 1 — Maintain the LOADOUT Design System
Use the canonical design system in `docs/design/system/design-system.md`. Do not restore retired palette, layout, or homepage prototypes from old plans.

## Step 2 — Finalize Economy Configuration
Determine:
- sponsor budget
- expected users
- expected approved hours
- average multiplier
- total Ore liability
- LV.1–15 XP thresholds
- per-track reward balance
- cross-track markups
- permanent discount curve
- full track and Requisition discounts, with combined savings capped at 25% of the base price
- four identical 10% Field Requisitions at levels 5/8/11/15, minimum base price 400 Ore
- General Requisition values
- Mastery item list
- Custom Order limits

Do not launch with one generic discount formula applied blindly to every product.

## Step 3 — Build the Participant Platform
Design and implement the approved future-platform features as separate reviewed releases. Reuse reference products as design evidence only; do not copy code or assets without a license. Keep the current public homepage and Docs separate from participant services until each service has an approved data, privacy, accessibility, and release plan.

## Step 4 — Build First Vertical Slice
Priority:
- auth
- projects
- journals
- tracking
- shipping
- fit review
- multi-track XP allocation
- Ore
- track level-up
- one field-aware shop item
- one purchase with permanent pricing plus one matching Requisition
- one Requisition redemption flow

## Step 5 — Internal Test
Invite roughly 10–20 builders.

Test:
- project eligibility clarity
- journaling friction
- Hackatime/Lapse evidence and eight-hour journal cadence
- public project/journal and reviewer-only Lapse visibility
- hour assignment
- 12-review gate, 1–9 scoring, anonymized comments, and 24-hour flag flow
- multiplier distribution and the Great Signal cap
- level pacing
- cross-track pricing
- discount limits and regional price consistency
- Requisition desirability
- whether any track is economically dominant
- Ore inflation
- AI policy
- reward flow

## Step 6 — Season 00
Public beta.

Suggested:
**4 weeks**

Keep stock controlled and observe the economy closely.

## Step 7 — Rebalance
Adjust:
- multiplier distribution
- XP curve
- reward prices
- cross-track markups
- permanent discount rate/caps
- Requisition values/minimums
- track reward desirability
- bonus amounts
- journals
- review flow
- abuse rules

## Step 8 — Season 01
Full launch only after the field economy is understandable and no single track is the obvious reward-maximizing strategy.

---

# 64. Metrics to Watch

## Builder Health
- returning builders
- completion rate
- builders advancing to harder technical projects
- builders crossing between technical tracks
- average number of meaningful Digital Loadout artifacts

## Program Fit
- % of submitted projects passing the LOADOUT Fit Gate
- reasons for fit rejection
- % of borderline projects requiring scope separation
- distribution across Tools / Systems / Compute / Hardware
- Research Mode usage

## Building
- approved hours
- ships per builder
- journal completion
- versioned follow-up ships
- percentage of projects used by another builder

## Economy
- Ore issued
- Ore spent
- outstanding Ore liability
- reward demand by track
- cross-track purchase rate
- average permanent discount actually realized
- savings prevented by normal caps
- Requisitions earned / held / redeemed
- Requisition redemption value
- Field Requisition saving versus use across the five lifetime milestones
- General Requisition issuance
- Custom Order demand
- spend by capability category
- fulfillment cost per track
- evidence that one track is becoming an economic meta

## Review
- queue length
- review time
- countable vote completion
- reviewer agreement
- fit-gate consistency
- rejected flag rate and moderation outcomes

## Community
- active builders
- external project users
- external contributors
- cross-project reuse
- Signal events
- technical collaboration
- follow/like/post-notification use without an endless-scroll feed

---

---

# 68. Season 00 — BOOT

Goal:
**prove the technical-capability loop, not maximize signups.**

Recommended pilot questions:
- Can builders understand the LOADOUT eligibility boundary?
- Do Tools / Systems / Compute / Hardware cover the intended projects?
- Does Research Mode work without becoming a loophole?
- Do reviewers agree on LOADOUT Fit?
- Does the Digital Loadout feel valuable on profiles?
- Do level-gated rewards motivate harder projects?
- Do builders understand that rewards upgrade the next build, not reimburse the current one?

Pilot flow:

```text
10–30 builders
↓
technical project proposal / self-check
↓
build + journal
↓
ship
↓
fit review + validity review + quality review
↓
Digital Loadout artifact
↓
XP + Ore
↓
unlock capability-focused rewards
```

A smaller, technically coherent community is preferable to a much larger general-purpose one.

---

---

# LOADOUT IRL — Germany roadmap pointer

The later-stage Germany concept is owned by [Plan 15 — LOADOUT IRL // Düsseldorf](15-loadout-irl-ruhr.md). It replaces this section's earlier one-to-two-day format sketch with the user's newer three-calendar-day Friday-to-Sunday recommendation, Düsseldorf and Essen city/venue research order, and same-global-Era connection. It remains a future concept: no venue, date, attendance capacity, funding, partner, or event operation is confirmed.

Do not pursue it until the online project/review/reward loop, fulfillment, regional demand, organizer capacity, safeguarding, venue research, and realistic funding are ready. Plan 15 is the detailed source; this operations plan retains only the roadmap and launch boundary.
