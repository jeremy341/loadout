# LOADOUT — Launch & Operations Plan

This document owns how LOADOUT is funded, fulfilled, launched, measured, moderated operationally, and eventually expanded into IRL activity.

It does not redefine product/economy rules.


---

# 29. Limited Drops

Example:

```text
DROP 003

3× Raspberry Pi 5
5× 1TB NVMe
10× $50 GPU compute
1× GPU
```

Drops give builders reasons to save Bolts.

---

# 30. Sponsor Drops

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

Long-term Germany-based event.

Online participants can:
- apply
- redeem travel support
- bring shipped projects
- build new projects
- meet sponsors
- attend workshops

Possible first region:
**Ruhrgebiet / NRW**

This is a later expansion, not an MVP requirement.

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
7. Hackatime/Lapse time must be tied to journals.
8. Tracked time alone does not earn Bolts.
9. Each tracked minute can only be assigned once.
10. Each shipped minute can only be rewarded once.
11. AI may assist, but the participant must remain the primary builder.
12. Bolts are one **global** currency.
13. Reviewers decide the final multi-track XP split.
14. Track levels cap at **15** and persist across seasons.
15. Most shop items are cross-track purchasable, but the relevant track affects price.
16. Only a small set of Mastery rewards use hard level walls.
17. Permanent field discounts are capped on expensive items.
18. Field Requisitions are earned at LV.3, 6, 9, 12, and 15 only.
19. Requisitions are one-use, non-transferable, non-expiring, and limited to one per order.
20. Requisitions never bypass a level wall.
21. Custom Orders require **level + Bolts + program fit + fulfillment approval**.
22. Imported/prior YSWS work cannot generate a second payout for the same work.

The niche and economy must remain strict enough that a builder can understand both **why a project belongs** and **why a shop price is what it is**.

---

# 63. Launch Sequence

## Step 1 — Lock Brand System
Current direction:
- LOADOUT name
- cream/black/lime palette
- warm grid background
- persistent left sidebar
- pixel builder characters
- block/pixel display typography
- restrained SVG decoration

Remaining:
- choose final logo
- choose exact fonts
- finalize avatar style
- create design tokens/components

## Step 2 — Finalize Economy Configuration
Determine:
- sponsor budget
- expected users
- expected approved hours
- average multiplier
- total Bolt liability
- LV.1–15 XP thresholds
- per-track reward balance
- cross-track markups
- permanent discount curve
- expensive-item savings caps
- Requisition I/II/Master values
- General Requisition values
- Mastery item list
- Custom Order limits

Do not launch with one generic discount formula applied blindly to every product.

## Step 3 — Fork/Prune Pixl
Follow **Part II — Pixl Fork & Migration Plan** in this document.

Get to a clean LOADOUT repository before stacking new economy logic on top of game/lore dependencies.

## Step 4 — Build First Vertical Slice
Priority:
- auth
- projects
- journals
- tracking
- shipping
- fit review
- multi-track XP allocation
- Bolts
- track level-up
- one field-aware shop item
- one capped discount
- one Requisition redemption flow

## Step 5 — Internal Test
Invite roughly 10–20 builders.

Test:
- project eligibility clarity
- journaling friction
- hour assignment
- reviewer track allocations
- multiplier distribution
- level pacing
- cross-track pricing
- discount caps
- Requisition desirability
- whether any track is economically dominant
- Bolt inflation
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
- Bolts issued
- Bolts spent
- outstanding Bolt liability
- reward demand by track
- cross-track purchase rate
- average permanent discount actually realized
- savings prevented by normal caps
- Requisitions earned / held / redeemed
- Requisition redemption value
- Master Requisition hoarding vs use
- General Requisition issuance
- Custom Order demand
- spend by capability category
- fulfillment cost per track
- evidence that one track is becoming an economic meta

## Review
- queue length
- review time
- appeal rate
- reviewer agreement
- fit-gate consistency

## Community
- active builders
- external project users
- external contributors
- cross-project reuse
- Signal events
- technical collaboration

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
XP + Bolts
↓
unlock capability-focused rewards
```

A smaller, technically coherent community is preferable to a much larger general-purpose one.

---

---

# LOADOUT IRL — Germany Concept

This is a **later-stage extension**, not a prerequisite for the YSWS launch.

Potential format:
- 1–2 day builder weekend / hackathon in Germany
- small, technical, hands-on
- centered on Tools / Systems / Compute / Hardware
- workshops around embedded systems, FPGA, GPU/compute, networking, developer tooling, fabrication, measurement, and performance
- sponsor hardware benches / compute credits / equipment demos
- shipping session at the end
- projects can count toward LOADOUT only under the normal eligibility/review rules

Brand direction:
- German engineering / manufacturing / workshop culture
- precision, systems, hardware, industrial design
- **not** weapons/military branding
- not a generic student hackathon aesthetic

Possible names:
- `LOADOUT IRL`
- `LOADOUT Build Weekend`
- `LOADOUT // Germany`
- `LOADOUT Workshop 01`

When to pursue it:
1. after the online progression/economy loop works;
2. after sponsor/fulfillment operations are stable;
3. after there is a real German/European participant base;
4. when a venue and hardware/industry sponsors can make it meaningfully technical.

The IRL event should strengthen LOADOUT's engineering identity, not distract from getting the YSWS itself working.
