# LOADOUT — Economy, Progression & Rewards Plan

This document owns all rules that affect XP, Ore, reward pricing, specialization, Requisitions, Custom Orders, seasons, and economic balance.

> **Ore is global. Tracks shape access and price.**

> Naming: the global currency was called Bolts until 2026-10-13. It is called Ore now and its icon is the ore gem. Old briefs, audits and manifests still say Bolts; they are records and are not rewritten.

> **Depth gives leverage. Breadth gives flexibility. Mastery gives access.**

## Agreed 2026-10-15 (read this first: it supersedes any conflicting text below)

These decisions were recorded from the owner on 2026-10-15. This table and the corresponding sections below are the current rules. The calibration proposal keeps candidate values and calculations; it does not override this plan. Plan 22 describes candidate review operations, not an implemented platform. The rule reconciliation removes the older 15% ceiling, tiered Field Requisitions and Ore savings caps.

| Topic | Agreed |
|---|---|
| Who it is for | High-school students aged 13 to 19. Owner update 2026-10-16: changed from 13 to 18. |
| Rate | 10 Ore for an approved hour of solid work. Ore = approved hours x the rating. |
| Rating | Other builders rate a ship from 0 to 20; 10 is solid; a ship the team approves pays at least 5; 20 is possible. A team member checks the ship first. |
| Hours and projects | No limit on hours or projects. Fraud (fake hours, copied work, fake evidence, collusion) is a permanent ban and takes back everything earned. |
| Shipping again | A project can be shipped again; each ship covers only the hours since the previous one (at least 5 new approved hours) and is rated on its own. |
| Levels | Fifteen lifetime levels per track. Level 15 is about 350 hours of solid work in one track (3,500 Track XP); two tracks reach level 15 in both after about 700 hours. |
| Level discount | Rises with level to 20% at level 15; the better related discount applies, never the sum. |
| Requisitions | Five identical tickets per track at levels 3, 6, 9, 12 and 15. Each takes 20% of the base price off one prize of 400 Ore or more, on top of the level discount, one per order. |
| Savings limits | None in Ore. The most anyone saves on one item is 40%. |
| Prices | The sample catalog in the proposal is the working catalog (a domain 24 Ore up to a Framework 16 laptop at 5,000). The enclosed printer and the Framework 16 are priced at a steeper rate and have no level requirement. |
| Carry-over | Ore and Track XP carry across seasons. |
| Public wording | The site shows Ore only, never a money value for one. |

## Rule status and remaining decisions

| Topic | Current rule | Still open | Public owner |
|---|---|---|---|
| Ore and quality | Approved hours times the ship rating; 10 is solid, accepted ships pay at least 5, maximum 20 | Category aggregation, rounding and calibration details | `content/docs/review.md`, `progress.md` |
| Track XP | One award allocated across demonstrated tracks; lifetime levels persist; LV.15 is 3,500 XP / about 350 solid hours | Exact award equation, quality weighting, intermediate thresholds and minimum track shares | `content/docs/progress.md` |
| Research Mode | A modifier within the four tracks; reproducible work can receive extra Track XP | Bonus amount and qualification details; 25% is a candidate, not approved | `content/docs/research.md` |
| Requisitions | Five identical 20% tickets at 3/6/9/12/15; minimum base price 400 Ore; one per order; no Ore cap | Redemption rounding and order-correction implementation | `content/docs/requisitions.md`, `pricing.md` |
| Discounts | Maximum permanent discount 20%; use the best related track, never sum track discounts | Exact intermediate curve and any cross-track markup | `content/docs/pricing.md` |
| Shipping again | New work only, at least five new approved hours; each ship has its own rating | Tracking-window precision and implementation | `content/docs/shipping.md` |
| Reviews and appeals | Team validity check, then peer rating using the four quality dimensions | Reviewer count, review duty, deadlines, conflict/weighting mechanics and appeal limits | `content/docs/review.md` |
| Custom Orders | Relevant level, approved work, sufficient Ore and team fulfillment approval; program cancellation restores the Requisition | Tier levels and limits, quote validity, exact sourcing formula and cancellation/refund terms | `content/docs/custom-orders.md` |

Intermediate milestone estimates remain in the calibration proposal until approved; the public guides show the chosen Requisition milestones and LV.15 endpoint without presenting that candidate curve as a rule. No answer or elapsed time automatically approves a candidate value. The agreed Requisition schedule remains 3/6/9/12/15; the alternative 5/8/10/12/15 is not adopted.

Unselected referral, Signal, leaderboard, sponsor-drop and General Requisition values later in this document are future proposals, not launch rules or public entitlements. The current base award has a maximum rating of 20; no old Signal example silently raises it.


---

# 9. Multiplier System

LOADOUT Fit is a gate, not a multiplier category.

Once a project passes that gate, rate four dimensions:

## 9.1 Originality
> Is the idea, implementation, or approach meaningfully interesting?

A known idea can still score well through:
- implementation
- unusual constraints
- technical architecture
- combination of systems
- novel hardware/software interaction

## 9.2 Technical Depth
> How much real technical challenge, understanding, and capability-building work is present?

Examples:
- low-level architecture
- algorithms
- protocols
- hardware
- networking
- performance engineering
- ML systems
- optimization
- graphics
- compilers
- runtimes
- distributed systems
- difficult integrations where the builder owns substantial technical work

Ordinary UI/product complexity alone does not score highly here.

## 9.3 Execution
> How successfully did the builder realize the technical capability they attempted?

Consider:
- correctness
- robustness
- usable interfaces
- measured performance
- hardware reliability
- integration quality
- whether the artifact actually works for its intended technical purpose

## 9.4 Documentation
> How well can another builder understand, verify, reproduce, or use the work?

Includes:
- journals
- README
- demo
- architecture explanation
- screenshots
- benchmarks
- failures
- lessons learned
- setup/reproduction instructions

Research Mode projects are expected to be especially strong here.

---

# 10. Multiplier Range

The agreed rating range is 0 to 20, with a payout floor of 5 for a ship that passes the team's approval check. A rejected ship pays nothing.

| Rating | Anchor |
|---:|---|
| 5 | Rough but genuine accepted work |
| 10 | Solid work |
| 15 | Great work |
| 20 | Outstanding work |

Originality, Technical Depth, Execution and Documentation remain the four quality dimensions. The median-per-category aggregation, reviewer pool, review duty and appeal mechanics in [Plan 22](22-peer-review-and-multipliers.md) are candidates until separately confirmed. Do not use the older 2–4 accepted-ship range or an automatic Signal uplift above 20.

---

# 11. Ore + XP Formula

The current base award is:

```text
base Ore = approved hours × ship rating
qualifying Era bonus = base Ore × 10%
```

Twenty approved hours at rating 10 earn 200 base Ore. If the project qualifies for the Era bonus, that adds 20 Ore, for 220 total. The Era decision is separate from quality and adds no Track XP. Plan 11 owns qualification; stacking with any future bonuses and rounding still require a decision.

Ore is global and spendable. A completed purchase reduces the available Ore balance. Spending does not remove XP, accepted projects or levels.

Track XP is one non-spendable award divided across the fields shown by the work. The split cannot duplicate the award. LV.15 is 3,500 XP, about 350 approved hours at the solid-work baseline. The exact XP award equation is still open. Plan 22's `approved hours × (10 + rating) ÷ 2` and its proposed 25% Research bonus are candidates, not agreed formulas. Do not publish an exact award calculated from them as a current rule.

---

# 12. Voting / Multiplier Abuse Protection

Recommended:
- minimum number of ratings
- no self-rating
- team members cannot rate their own ship
- suspicious reciprocal voting detection
- trimmed averages
- extreme outliers have reduced effect
- moderators can flag rating rings
- abuse removes voting privileges

Optional trusted-voter weighting:
- account history
- completed projects
- review quality
- trusted reviewer role

Keep the final scoring understandable.

---

---

# 16. Referral System

Referral bonuses should reward bringing in **real builders**, not accounts.

## Verified Referral

A referral becomes valid when the new builder:
1. joins through the referral link
2. verifies their account
3. tracks meaningful work
4. writes journals
5. ships an approved project

## Suggested Rewards

```text
NEW BUILDER
+25 Ore

REFERRER
+50 Ore
```

## Referral Milestones

Example:

```text
1 verified builder
+50 Ore

2 verified builders
exclusive cosmetic / sticker unlock

3 verified builders
+100 Ore

5 verified builders
special referral unlock

10 verified builders
special badge + bonus

25 verified builders
rare sponsor/community reward
```

Building must remain the main source of Ore.

---

# 17. Signal Bonus

External traction is rewarded through:

# SIGNAL

Signal measures whether a shipped project spreads beyond the immediate YSWS community.

Possible evidence:
- GitHub stars
- package downloads
- Hacker News
- Reddit
- public videos
- app downloads
- blog coverage
- external contributors
- real users

## SIGNAL I — DETECTED

Examples:
- first meaningful external attention
- ~25 GitHub stars
- meaningful public traction
- 50–100 real users depending on product type
- several hundred meaningful views/downloads

Possible reward:
- badge
- `+50 Ore`

## SIGNAL II — STRONG

Examples:
- ~100 stars
- substantial HN/Reddit attention
- 1,000+ users/downloads
- strong public usage

Possible reward:

```text
+250 Ore
MAX MULTIPLIER
Base rating remains at most 20; a separate Signal bonus needs approval.
```

## SIGNAL III — SATURATED

Rare.

Examples:
- thousands of stars
- major public coverage
- tens of thousands of users/downloads
- exceptional adoption

Possible reward:

```text
+1,000 Ore
Base rating remains at most 20; a separate Signal bonus needs approval.
```

Exact thresholds depend on budget and abuse resistance.

---

# 18. Signal Abuse Rules

Not eligible:
- purchased ads used purely to inflate metrics
- purchased views
- purchased stars
- bots
- fake accounts
- engagement rings
- internal Slack reactions
- spam
- artificial download loops

Goal: **real external discovery and usage**.

---

# 19. Usage Milestones

Usage should be distinct from social virality.

Example:

```text
10 real users
badge

100 real users
+100 Ore

1,000 real users
+300 Ore

10,000 real users
+750 Ore
```

Verification may use:
- analytics
- downloads
- package stats
- active users
- server logs
- app store data

Thresholds can differ by product type.

---

# 20. Open-Source Bonus

Encourage real collaboration.

Example:

```text
FIRST EXTERNAL CONTRIBUTOR
+50 Ore

5 EXTERNAL CONTRIBUTORS
special badge

10 EXTERNAL CONTRIBUTORS
larger achievement
```

Meaningful contributions only.

No typo farming or fake contributor rings.

---

# 21. Achievements

Achievements add small bonuses and profile recognition.

Examples:

- **FIRST TOOL** — ship a useful developer/tooling project
- **BARE METAL** — meaningful low-level systems work
- **BENCHMARKED** — publish real performance measurements
- **DOCUMENTED** — exceptional technical documentation
- **LOCAL BRAIN** — meaningful local inference/runtime work
- **IT'S ALIVE** — successful physical project
- **KERNEL PANIC** — ship an OS/runtime/kernel-level project
- **PACKET PUSHER** — networking/protocol project
- **SILICON CURIOUS** — first FPGA/accelerator project
- **OPEN** — meaningful external contributor
- **CLOCKED** — measured performance improvement
- **TOOLMAKER** — another builder genuinely uses your tool
- **PAPER CUT** — strong Research Mode ship

Rewards:
- badges
- profile cosmetics
- modest Ore
- seasonal progression

Achievements should not dominate the economy.

---

---

# 22. Seasons

Lifetime Ore, Digital Loadout artifacts, Track XP, and project history persist.

Competitive season rankings reset.

## Recommended Length

Launch:
- **Season 00: 4 weeks**

After validation:
- **6-week seasons**
- optional 1-week review/fulfillment cooldown

## Season Themes

Season themes should deepen LOADOUT's technical identity rather than make it general-purpose.

### S00 // BOOT
Build the first pieces of your technical stack.

### S01 // TOOLCHAIN
Developer tools, compilers, automation, debugging, workflow infrastructure.

### S02 // ACCELERATE
Compute, GPU, graphics, optimization, ML systems, efficiency.

### S03 // BARE METAL
Embedded, FPGA, electronics, low-level systems.

### S04 // NETWORK
Networking, servers, protocols, distributed systems, deployment.

### S05 // MEASURE
Research Mode, benchmarks, profilers, test infrastructure, reproducible technical experiments.

---

## Community Eras

Eras are a shared technical-progression layer, separate from competitive seasons. They use non-spendable Era Points, not a new currency. Approved projects that a reviewer marks as qualifying earn a separate **10% of their approved base Ore award**. Era qualification adds no Track XP and does not alter the quality multiplier or the four quality dimensions. The reviewer records a reason. No partial Era-bonus percent is used in the approved design.

Era bonus stacking, caps, contribution aggregation/reversal, and point thresholds remain open implementation decisions. Do not silently add the bonus to an existing multiplier or expose an unapproved Era Points formula. The canonical behavior and pre-implementation gates are in [Plan 11](11-eras-and-community-progression.md).

If a future physical weekend is approved, its projects use this same shared Era and this same reviewer-gated bonus. There is no event-specific Ore or XP rule; see [Plan 15](15-loadout-irl-ruhr.md). This is a cross-reference only and does not settle the open stacking/configuration questions above.

---

# 23. Seasonal Quests

Optional small challenges.

Examples:

## 2X
Improve a measured workload by 2×.  
`+50 Ore`

## LOCAL
Run something normally cloud-hosted on hardware you control.  
`+40 Ore`

## FIRST PCB
Design/order your first PCB.  
`+50 Ore`

## SHIP TO SOMEONE
Get another person to actually use/install your project.  
`+30 Ore`

## 100 USERS
Reach 100 genuine users.  
`+100 Ore`

## SMALLER
Reduce a build/model/storage footprint significantly.  
`+40 Ore`

Quests add variety, not the majority of payouts.

---

# 24. Leaderboards

Use multiple leaderboards.

## Season
Ore earned this season.

## Lifetime
All-time Ore.

## Hours
Approved hours.

## Signal
External project traction.

## Track
Separate boards for:
- Tools
- Systems
- Compute
- Hardware

## Review Contribution
Quality-weighted peer/reviewer contribution, not raw review count.

## New Builders
Only users who joined this season.

This keeps late joiners competitive.

---

# 25. Leaderboard, Reviewer & Community Rewards

Avoid large recurring Ore prizes and avoid **permanent global percentage discounts** for leaderboard position.

Permanent global discounts create a positive-feedback loop:

```text
WIN
→ PERMANENTLY CHEAPER SHOP
→ MORE EQUIPMENT
→ MORE BUILDING POWER
→ EASIER TO WIN AGAIN
```

Use rare **General Requisitions** instead. They are significant, but one-use.

Possible seasonal structure:

```text
SEASON #1
General Master Requisition
one purchase, any eligible field
large capped saving

SEASON #2–3
General Requisition II

TRACK WINNER
Field Requisition
for that track

TOP REVIEWER
General Requisition II

TOP REVIEW SCORE / TOP 5
General Requisition I
```

Reviewer rewards must be based on **review quality**, not raw review count.

Suggested reviewer score inputs:
- valid completed reviews
- useful written feedback
- agreement with later moderation / low overturn rate
- consistency
- no rubber-stamping
- queue help / reliability

Possible non-economic rewards:
- season badge
- profile trophy
- limited merch
- sponsor reward
- featured project/reviewer
- special hardware
- event invitation

General Requisitions should remain rare enough that receiving one feels exceptional.

---

---

# 26. Reward Shop, Field Pricing & Requisitions

The shop exists to **increase building capability**.

It should not drift into a broad lifestyle/reward catalog.

Every reward should pass:

> **Does this plausibly help someone build, test, run, measure, prototype, or learn harder technical things?**

The economy rule is:

> **Ore is global. Tracks shape access and price.**

And the progression rule is:

> **Your level always matters. Requisitions are the rare moments where specialization pays off much more strongly.**

## 26.1 Shop Departments

### Tools
- domains for developer tools
- hosting
- software/tool licenses where appropriate
- keyboards / macro pads
- portable displays
- USB hubs/docks
- debugging accessories

### Compute
- CPU cloud
- GPU cloud
- dedicated VM
- temporary GPU instance
- storage
- bare-metal compute
- GPU grants
- RAM
- NVMe / SSD

### Systems
- VPS
- databases
- object storage
- dedicated servers
- mini PCs
- networking gear
- NAS/storage hardware
- home-server hardware

### Hardware / Silicon
- ESP32
- RP2040
- Arduino
- Raspberry Pi
- FPGA boards
- sensors
- dev boards
- accelerator boards

### Lab / Hacker Tech
- Pinecil
- logic analyzer
- USB debug tools
- multimeter
- RTL-SDR
- Cardputer
- serial adapters
- bench accessories
- test equipment

### Maker
- soldering gear
- PCB grants
- 3D-printing credits
- filament
- 3D printers
- robotics components
- fabrication tools

### Major Upgrades
- GPU
- CPU / motherboard / RAM upgrade grants
- mini PC
- Framework Laptop
- laptop grant
- full workstation upgrade grant

### Experiences
Only when directly relevant to technical building:
- hackathon travel
- technical conference grant
- LOADOUT IRL attendance
- workshop access
- builder weekend

Normally out of scope:
- food grants
- random fashion
- generic entertainment
- unrelated consumer electronics
- rewards with no plausible builder-capability connection

## 26.2 Every Item Has Field Affinity

An item records its base Ore price, related tracks, access requirements, Requisition eligibility, availability and region. The best matching track discount applies; track discounts are never added together.

The agreed sample price for a Raspberry Pi 5 is 200 Ore. Hardware and Systems are relevant fields. Do not retain the older 700-Ore illustration as its current price. A cross-track surcharge is still a candidate, so no automatic +10% markup is implied.

There is no `normal_discount_cap_ore` field in the current product rule: the owner removed savings caps in Ore. Future platform design can choose its schema after the remaining rules are settled.

---

## 26.3 Three Access Classes

### OPEN EQUIPMENT
Most of the shop.

Anyone can buy it.

Relevant track experience improves the price.

Examples:
- ESP32
- storage
- hosting
- ordinary compute credits
- basic dev boards
- common tools

### SPECIALIST EQUIPMENT
Still normally buyable cross-track, but:
- outsiders may pay a larger markup;
- relevant track discounts matter more;
- Requisitions are especially useful.

Examples:
- FPGA starter boards
- mini servers
- larger PCB grants
- serious networking gear
- specialist debugging hardware

### MASTERY EQUIPMENT
A small minority of high-end or highly specialized equipment.

Requires a relevant track level.

Examples:
- high-end GPU grant
- advanced FPGA board
- larger server grant
- expensive oscilloscope/test equipment
- major 3D-printer/fabrication grant
- very large specialist Custom Orders

Target mix, not a hard law:

```text
~70% Open
~20% Specialist
~10% Mastery
```

Hard locks should remain rare.

## 26.4 Cross-Track Purchasing

Builders should be able to experiment outside their main field.

Example:

```text
USER
Compute LV.8
Hardware LV.0

ITEM
ESP32
Hardware // Open

RESULT
Can buy it.
Pays the configured cross-track price.
Does not receive a Hardware specialist discount.
```

This is intentional.

Someone should not need to build a Hardware project before buying their first microcontroller.

But someone who has invested in Hardware should get a better deal.

## 26.5 Permanent Track Discount

Related track levels give an ongoing discount, reaching 20% at LV.15. The precise intermediate curve remains open. The calibration proposal's exponent-1.2 curve is a candidate; its public milestone figures are working estimates.

Use the best related discount for a multi-track item. Never add two track discounts. Discounts change the purchase price, not the Ore earned by a ship.

## 26.6 Expensive-Item Savings Cap

The older Ore cap model is retired. Permanent and Field Requisition discounts each use the base price and apply without a separate Ore savings cap. Their maximum combined reduction is 40%.

For a 1,000-Ore eligible prize at LV.15:

```text
Base price                 1,000 Ore
Permanent discount (20%)     200 Ore
One Requisition (20%)        200 Ore
Final price                 600 Ore
```

The same calculation applies to more expensive eligible items. Control program exposure through approved catalog pricing, inventory and fulfillment decisions, not by silently restoring the removed caps.

---

## 26.7 Why Track Balancing Matters

Do not let one field become the obvious economic meta simply because it contains expensive products.

Bad:

```text
TOOLS
cheap domains

COMPUTE
cheap GPUs + laptops + everything valuable
```

That would cause builders to pick Compute for rewards rather than genuine interest.

Every field should have desirable progression across similar tiers:

| Tier | Tools | Systems | Compute | Hardware |
|---|---|---|---|---|
| Early | tool credits, macro/debug gear | hosting, storage | compute credit | ESP32, sensors |
| Mid | displays, tooling, debug hardware | mini PC/networking | RAM, SSD, GPU compute | Pi, solder gear, logic analyzer |
| High | specialist dev/test gear | server/NAS grant | GPU grant | FPGA, fabrication/3D printer |
| Mastery | specialized Custom Order | serious server setup | high-end accelerator | advanced FPGA/lab gear |

Balance around **desirability and capability**, not identical retail value.

Many rewards should be multi-track:
- SSD → Systems + Compute
- Raspberry Pi → Hardware + Systems
- portable display → Tools + Hardware
- mini PC → Systems + Compute
- FPGA board → Hardware + Compute
- logic analyzer → Hardware + Tools

## 26.8 Field Requisitions

Each track awards five identical Field Requisitions at levels 3, 6, 9, 12 and 15. There are no I, II or Master variants in the current field-ticket model.

- Each ticket gives an extra 20% of the item's base Ore price as savings.
- The base price must be at least 400 Ore and the item's track must match.
- It adds to the permanent track discount; both use the base price, not a compounded remainder.
- One use, non-transferable, no expiry, maximum one Requisition per order.
- No separate Ore savings cap; maximum combined permanent-plus-ticket discount is 40%.
- It cannot bypass an equipment or Custom Order level requirement.
- A Custom Order quote must explicitly permit its use.
- If the program cancels fulfillment, restore the ticket. Broader buyer-cancellation terms remain open.

## 26.9 Minimum Item Value & Anti-Waste Protection

The minimum eligible base price is 400 Ore. The old 750/1,750/3,500 tiers and “percentage of possible allowance” rule do not apply to these identical tickets. A preview must show the actual extra saving and remaining ticket count before the builder confirms.

## 26.10 Redemption Confirmation Modal

Use one clear confirmation showing the base price, permanent saving, ticket saving, final Ore price, matching field and inventory change. State that using the ticket consumes it. Do not create a new quote or consume a ticket merely because a builder previews it.

---

## 26.11 General Requisitions

**Future proposal only.** The values below are not the agreed Field Requisition rules, have no published entitlement, and are not part of the initial program unless separately approved.

General Requisitions can be used on any eligible field.

They are **not permanent global discounts**.

They should be awarded rarely for major community/program contributions such as:
- season champion;
- top track performance;
- exceptional peer-review contribution;
- sponsor challenge;
- organizer-selected exceptional contribution.

Working defaults:

### GENERAL REQUISITION I
```text
Minimum item: 1,000 Ore
10% one-purchase discount
Maximum saving: 300 Ore
```

### GENERAL REQUISITION II
```text
Minimum item: 2,000 Ore
15% one-purchase discount
Maximum saving: 600 Ore
```

### GENERAL MASTER REQUISITION
```text
Minimum item: 4,000 Ore
15% one-purchase discount
Maximum saving: 1,000 Ore
```

A General Requisition can be used instead of a Field Requisition, **not together with one**.

Permanent track pricing still applies first. The General Requisition then adds its allowed one-time benefit subject to the item's final discount guardrails.

## 26.12 Requisition Inventory

Record the track, quantity, milestone provenance and whether a ticket is available, reserved, consumed or restored. Every field ticket has the same 20% benefit. Display matching eligibility and the actual saving rather than a tier or an “additional cap allowance”. Record program cancellations and restorations without deleting the original history.

---

# 27. High-End Aspirational & Mastery Rewards

**Equipment ideas, not an approved gate table.** These older configurations are illustrative. The current sample catalog below and the agreed exception for the enclosed printer and Framework 16 take precedence. Do not publish these example levels as settled requirements.

Show aspirational rewards from day one even when locked.

Example:

```text
FRAMEWORK LAPTOP
Base 8,400 Ore
Relevant: Tools / Systems / Compute
Access: Specialist or program-defined Mastery
Normal discount cap: manual

RTX GPU GRANT
Base 6,500 Ore
Primary: Compute
Access: Mastery
Requires Compute LV.8+
Requisition eligible

BAMBU LAB A1
Base 4,500 Ore
Primary: Hardware
Access: Mastery
Requires Hardware level

MINI SERVER
Base 3,200 Ore
Primary: Systems
Related: Compute
Access: Specialist
```

Long-term visibility matters, but visible does not mean immediately purchasable.

For every high-end item show:
- base price;
- user's current relevant track;
- level requirement if any;
- cross-track status;
- normal specialist price;
- final price after applicable discounts;
- Requisition eligibility;
- stock/region;
- levels remaining until unlock.

High-end items must be **individually balanced** so one track does not become the obvious economic choice.

---

# 28. Custom Orders

**Status:** The request/review/quote mechanism is agreed. Numerical tiers, limits, quote duration and buyer-cancellation terms below are candidates. Program-caused cancellation restores a Field Requisition. Only confirmed rules belong in public Docs.

Custom Orders are a flagship LOADOUT feature.

After enough real building, participants can request technical equipment that is **not in the normal shop**.

Custom Orders require:
1. enough global **Ore**;
2. the relevant **Track Level** or Custom Order tier;
3. program fit;
4. fulfillment approval.

> **A Requisition never bypasses a Custom Order level gate.**

## 28.1 Track-Based Custom Order Tiers

Because track levels cap at 15, use the same progression scale:

### FIELD — LV.4
Small custom requests / unusual dev tools.

### POWER — LV.8
Mid-value specialized equipment.

### ROOT — LV.12
Higher-value hardware, compute, server, or test equipment.

### BARE METAL — LV.15
Highest-value/specialized requests for proven mastery.

Items that span tracks may accept the best relevant track or explicitly require two fields.

Example:

```text
CUSTOM FPGA ACCELERATOR BOARD

Eligible tracks
Hardware / Compute

Required
Hardware LV.8 OR Compute LV.10

Base Ore estimate
4,200 Ore
```

## 28.2 Cross-Track Custom Orders

Do not use Custom Orders to bypass the field economy.

If someone requests an item outside their developed fields:
- ordinary items may be approved with an appropriate cross-track markup;
- specialist items may require a higher price or minimum relevant level;
- mastery equipment keeps its level wall.

Example:

```text
User
Systems LV.9
Hardware LV.1

Request
Advanced FPGA board

Result
If configured as Mastery Hardware gear,
the request remains locked.
```

## 28.3 Requisitions on Custom Orders

Custom Orders may accept Requisitions only when the approved quote marks them eligible.

The same rules apply:
- one Requisition maximum;
- correct field or General Requisition;
- minimum purchase value;
- level gate already satisfied;
- confirmation modal;
- savings remain bounded.

Because Custom Order real-world prices can vary, the discount should be calculated from the **final approved Ore quote**, not the participant's original estimate.

## 28.4 Request Form

```text
ITEM
Framework Laptop 13

URL
https://...

ESTIMATED REAL PRICE
€1,049

WHAT CAPABILITY DOES THIS UPGRADE?
Local builds, FPGA tooling, GPU development,
travel development machine

TRACK AFFINITY
Systems / Compute / Tools

COUNTRY
Germany

YOUR RELEVANT PROGRESSION
Systems LV.10
Compute LV.8

ESTIMATED ORE QUOTE
8,420 Ore

REQUISITION
[ none selected ]

[ REQUEST REVIEW ]
```

## 28.5 Order State

```text
LOCKED / NOT ELIGIBLE
↓
ELIGIBLE TO REQUEST
↓
REQUESTED
↓
QUOTE / FULFILLABILITY REVIEW
↓
APPROVED
↓
OPTIONAL REQUISITION SELECTION
↓
FINAL CONFIRMATION
↓
ORE RESERVED / REQUISITION RESERVED
↓
PURCHASED
↓
SHIPPED
↓
DELIVERED
```

If the program rejects or cannot fulfill an approved purchase after reservation, release the Ore hold and restore the Requisition.

## 28.6 Rules

Allowed if:
- legal;
- safe;
- program compliant;
- meaningfully related to technical building capability;
- realistically fulfillable;
- within sponsor/program budget;
- available in the builder's country;
- shipping/tax is reasonable.

The item does **not** need to fund the exact project that earned the Ore.

That is intentional. The reward is for becoming a stronger builder.

---

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

Drops give builders reasons to save Ore.

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

---

# 65. Economic Guardrails

Model program cost using the actual approved catalog, delivery cost, expected quantities, sponsor support and the maximum 40% purchase reduction. No Ore savings cap or total-hour limit is authorized by this section.

For example, 200 builders × 30 approved hours × rating 10 issues 60,000 base Ore. Qualifying Era bonuses add separately. This is a scenario, not a participation claim or funded commitment.

Check concentration on expensive items, all five tickets in each track, cross-track access, supplier changes, stock and delivery costs. Keep any budgeting conversion internal; no fixed cash value for Ore is promised publicly. Do not count a discount both as a reduced price and as an additional cash purchase cost.

---

# 66. Ore Pricing Philosophy

Each item has a base Ore price. Calculate:

```text
permanent saving = base price × best related track discount
ticket saving = base price × 20%, when one matching ticket is eligible
final Ore price = base price − permanent saving − ticket saving
```

The maximum permanent rate is 20%; the maximum combined reduction is 40%. A ticket needs a base price of at least 400 Ore. The exact intermediate discount curve, any cross-track markup and rounding convention remain open. No hidden cap or surcharge should be inferred from older examples.

A Custom Order uses its final approved base quote. Show eligibility, each saving and the final balance before acceptance. The team's sourcing and tax/delivery treatment are still being settled. Do not publish a fixed `1 Ore = $X` conversion.

---

# 67. Example Launch Shop

These eight sample prices are approved for public planning copy. They describe the intended catalog, not current stock or fulfillment. Hours assume the solid-work baseline of 10 Ore per approved hour and no purchase discount.

| Item | Base Ore | Solid-work hours |
|---|---:|---:|
| ESP32 starter kit | 50 | 5 |
| Soldering iron kit | 60 | 6 |
| Raspberry Pi 5 | 200 | 20 |
| Samsung T7 SSD | 160 | 16 |
| Domain | 24 | 2.4 |
| A1 Mini printer | 500 | 50 |
| Enclosed printer | 1,000 | 100 |
| Framework 16 | 5,000 | 500 |

The enclosed printer and Framework 16 have no level requirement in this working catalog. Other specialist equipment gates and additional item prices remain undecided. The calibration worksheet keeps additional candidate items for internal comparison.

---

# PART III — CANONICAL V4 ECONOMY INVARIANTS & OPEN CONFIG KNOBS

This section exists so implementation does not accidentally revive an older draft rule.

## Fixed Product Rules

Use the agreed table at the top of this document and the current sections 10, 11 and 26 as the rule owners:

- Four tracks, Research Mode as a modifier, fifteen lifetime levels.
- Spendable global Ore; a single XP award split across demonstrated fields.
- Approved hours × rating; accepted-ship floor 5, solid baseline 10, maximum 20.
- LV.15 at 3,500 XP / about 350 solid-work hours in one track.
- Permanent track discount reaches 20%; use the best related track.
- Five identical 20% Field Requisitions at 3/6/9/12/15; 400-Ore minimum base price.
- One ticket per order, no expiry or transfers, no bypass of equipment levels.
- No Ore savings caps; at most 40% total reduction.
- Program cancellation restores a Field Requisition.
- No total limit on legitimate hours or projects; repeat ships need five new approved hours and new work.
- Lifetime progress persists across Seasons and Eras.

No older example, fallback default or unpublished candidate silently changes these rules.

---

## Working Values To Pilot-Test

The following are candidates, not automatic defaults: the intermediate discount and XP curves, the XP quality equation, the 25% Research XP bonus, a minimum track-allocation share, any cross-track markup, reviewer counts/duty/deadlines, appeals, Custom Order tier values and buyer-refund terms. Compare them in [the calibration worksheet](proposals/economy-calibration.md) and [Plan 22](22-peer-review-and-multipliers.md). Approval must be explicit and recorded here before they become public rules.

---

## Questions To Resolve Before Public Season 00

1. Exact XP award formula, intermediate thresholds, quality weighting and track allocation precision.
2. Research bonus amount and qualification criteria.
3. Full level-discount curve, rounding and cross-track pricing.
4. Reviewer count, review duty, aggregation, deadlines and conflict handling.
5. Appeal limits, timing, score-change policy and error/fraud review.
6. Custom Order tiers, limits, landed-cost formula, quote validity and cancellation/refund terms.
7. Confirmed inventory, regional delivery/tax terms and operational launch readiness.

Store eventual configuration in one authority rather than scattering independent constants through implementation or Docs. This document does not implement accounts, review, orders or fulfillment.
