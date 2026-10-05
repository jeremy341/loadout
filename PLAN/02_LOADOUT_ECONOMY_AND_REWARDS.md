# LOADOUT — Economy, Progression & Rewards Plan

This document owns all rules that affect XP, Bolts, reward pricing, specialization, Requisitions, Custom Orders, seasons, and economic balance.

> **Bolts are global. Tracks shape access and price.**

> **Depth gives leverage. Breadth gives flexibility. Mastery gives access.**


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

Suggested target:

```text
WEAK / INCOMPLETE SHIP      2×–4×
OKAY PROJECT                5×–8×
SOLID PROJECT               9×–12×
GREAT PROJECT              13×–16×
EXCEPTIONAL                17×–20×
```

A normal good project should often land around **~10×**.

Signal can raise the normal ceiling for exceptional external traction.

---

# 11. Bolt + XP Formula

LOADOUT has **one global currency** and **four independent XP progressions**.

Recommended Bolt model:

```text
APPROVED HOURS × QUALITY MULTIPLIER + GLOBAL BONUSES = BOLTS
```

Recommended XP model:

```text
APPROVED HOURS × XP FACTOR × QUALITY FACTOR = TOTAL TRACK XP
```

Then reviewers allocate the Track XP across the fields represented by the ship.

Example:

```text
APPROVED HOURS
31.3

QUALITY MULTIPLIER
14.6×

GLOBAL SIGNAL BONUS
+50 B

TOTAL
507 BOLTS

TOTAL TRACK XP
+820 XP

REVIEWER ALLOCATION
Compute   70%  → +574 XP
Systems   30%  → +246 XP
```

Bolts:
- are global;
- can be spent;
- do not belong to one track;
- are not reduced when a builder buys something.

Track XP:
- cannot be spent;
- remains in its field forever;
- determines level, pricing advantages, unlocks, and Requisition milestones.

This separation means spending currency never makes the Builder Profile weaker and multi-field work does not require separate currencies.

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
+25 Bolts

REFERRER
+50 Bolts
```

## Referral Milestones

Example:

```text
1 verified builder
+50 B

2 verified builders
exclusive cosmetic / sticker unlock

3 verified builders
+100 B

5 verified builders
special referral unlock

10 verified builders
special badge + bonus

25 verified builders
rare sponsor/community reward
```

Building must remain the main source of Bolts.

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
- `+50 B`

## SIGNAL II — STRONG

Examples:
- ~100 stars
- substantial HN/Reddit attention
- 1,000+ users/downloads
- strong public usage

Possible reward:

```text
+250 B
MAX MULTIPLIER
20× → 25×
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
+1,000 B
MAX MULTIPLIER
30×
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
+100 B

1,000 real users
+300 B

10,000 real users
+750 B
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
+50 B

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
- modest Bolts
- seasonal progression

Achievements should not dominate the economy.

---

---

# 22. Seasons

Lifetime Bolts, Digital Loadout artifacts, Track XP, and project history persist.

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

Eras are a shared technical-progression layer, separate from competitive seasons. They use non-spendable Era Points, not a new currency. Approved projects that a reviewer marks as qualifying earn a separate **10% of their approved base Bolt award**. Era qualification adds no Track XP and does not alter the quality multiplier or the four quality dimensions. The reviewer records a reason. No partial Era-bonus percent is used in the approved design.

Era bonus stacking, caps, contribution aggregation/reversal, and point thresholds remain open implementation decisions. Do not silently add the bonus to an existing multiplier or expose an unapproved Era Points formula. The canonical behavior and pre-implementation gates are in `11_LOADOUT_ERAS_AND_COMMUNITY_PROGRESSION.md`.

---

# 23. Seasonal Quests

Optional small challenges.

Examples:

## 2X
Improve a measured workload by 2×.  
`+50 B`

## LOCAL
Run something normally cloud-hosted on hardware you control.  
`+40 B`

## FIRST PCB
Design/order your first PCB.  
`+50 B`

## SHIP TO SOMEONE
Get another person to actually use/install your project.  
`+30 B`

## 100 USERS
Reach 100 genuine users.  
`+100 B`

## SMALLER
Reduce a build/model/storage footprint significantly.  
`+40 B`

Quests add variety, not the majority of payouts.

---

# 24. Leaderboards

Use multiple leaderboards.

## Season
Bolts earned this season.

## Lifetime
All-time Bolts.

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

Avoid large recurring Bolt prizes and avoid **permanent global percentage discounts** for leaderboard position.

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
Field Requisition II
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

> **Bolts are global. Tracks shape access and price.**

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

Every shop item is configured individually.

Recommended fields:

```text
primary_track
related_tracks[]
access_class
base_bolt_price
cross_track_markup_percent
minimum_track_level
normal_discount_cap_bolts
requisition_eligible
stock
region
sponsor
```

Example:

```text
RASPBERRY PI 5

Primary
Hardware

Related
Systems

Access
Open

Base
700 B

Cross-track markup
+10%
```

If a reward naturally belongs to several areas, use the **best relevant track level** for pricing.

Example:

```text
MINI PC

Relevant tracks:
Systems / Compute

User:
Systems LV.2
Compute LV.9

PRICING TRACK
Compute LV.9
```

Do not force hardware into one arbitrary field when several skills legitimately use it.

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

Each relevant track level provides a **small permanent discount**.

Working default curve:

| Track Level | Permanent field discount |
|---:|---:|
| 0 | 0% + possible cross-track markup |
| 1 | 0% |
| 2 | 2% |
| 3 | 4% |
| 4 | 5% |
| 5 | 6% |
| 6 | 7% |
| 7 | 8% |
| 8 | 9% |
| 9 | 10% |
| 10 | 11% |
| 11 | 12% |
| 12 | 13% |
| 13 | 14% |
| 14 | 15% |
| 15 | 15% |

This curve is **provisional and config-driven**.

The permanent discount should be noticeable without becoming the primary way builders extract value from the program.

## 26.6 Expensive-Item Savings Cap

A percentage discount becomes dangerous on expensive rewards.

Example:

```text
GPU
6,000 B

Compute LV.15
15% raw discount
= 900 B raw saving
```

Do not automatically grant the full `900 B`.

Each item has a **normal permanent-discount savings cap**.

Example:

```text
GPU
Base                           6,000 B
Raw LV.15 saving                 900 B
Normal savings cap               350 B

NORMAL SPECIALIST PRICE        5,650 B
```

The user still benefits from specializing, but high-value items do not destroy the economy.

Default cap bands may guide admins, but **every expensive item should be balanced individually**.

Illustrative defaults:

| Base Bolt price | Suggested normal cap |
|---:|---:|
| under 750 B | full normal discount |
| 750–1,749 B | ~100–150 B |
| 1,750–3,499 B | ~200–250 B |
| 3,500–6,999 B | ~300–400 B |
| 7,000 B+ | ~400–500 B or manual |

Sponsor subsidy, fulfillment cost, scarcity, and stock can justify overrides.

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

Requisitions are rare, one-use progression items that let a builder push beyond the normal expensive-item savings cap.

Each track awards only **five lifetime progression Requisitions**:

```text
LV.3   → Requisition I
LV.6   → Requisition I
LV.9   → Requisition II
LV.12  → Requisition II
LV.15  → Master Requisition
```

Across one track, that is all the level-based Requisitions the builder can ever earn.

Rules:
- one-use;
- non-transferable;
- tied to the track that earned it;
- never expire;
- stack in the builder's inventory until used;
- maximum **one Requisition per order**;
- cannot bypass a Mastery level requirement;
- cannot be converted directly to Bolts;
- refunded/reissued only when an order is cancelled for program/fulfillment reasons, not buyer regret.

Working default values:

### FIELD REQUISITION I
```text
Minimum eligible item value: 750 B
Additional discount allowance: +200 B
```

### FIELD REQUISITION II
```text
Minimum eligible item value: 1,750 B
Additional discount allowance: +500 B
```

### MASTER FIELD REQUISITION
```text
Minimum eligible item value: 3,500 B
Allows the user's full normal track percentage
to push past the ordinary cap,
up to ~1,200 B total track-discount saving.
```

Exact values are budget-configurable.

Example:

```text
GPU GRANT

Base                            6,000 B
Compute LV.10 permanent rate       11%
Raw permanent saving              660 B
Normal cap                        350 B
Normal price                    5,650 B

+ Compute Requisition II
Additional allowance              500 B

Full raw saving needed             660 B
Allowed after requisition          660 B

FINAL PRICE                      5,340 B
```

A Requisition does not create an arbitrary extra sale. It mainly lets the builder **realize more of the track discount they already earned**.

## 26.9 Minimum Item Value & Anti-Waste Protection

Rare progression rewards should not be accidentally wasted on tiny purchases.

A Requisition is disabled when the item is below its minimum eligible value.

The interface may also warn when the Requisition would use only a small fraction of its potential benefit.

Example:

```text
COMPUTE REQUISITION II

Potential additional allowance
500 B

This purchase would gain only
40 B of extra savings.

Recommended:
save it for a larger upgrade.
```

For extremely poor-value usage, the product may block redemption. A working threshold is that the user should gain at least **20–25% of the Requisition's possible extra value**, unless an admin config explicitly permits otherwise.

## 26.10 Redemption Confirmation Modal

**Always show a confirmation modal before consuming a Requisition.**

Example:

```text
USE COMPUTE REQUISITION II?

RTX GPU GRANT

Base price                     6,000 B
Without Requisition            5,650 B
With Requisition               5,340 B

EXTRA SAVING
310 B

You own:
Compute Requisition II ×2

After purchase:
Compute Requisition II ×1

This Requisition is one-use and does not expire.

[ KEEP REQUISITION ]   [ USE & BUY ]
```

For a Master Requisition, add:

```text
RARE PROGRESSION REWARD

You can earn only one Master Compute
Requisition from reaching Compute LV.15.

This purchase permanently consumes it.
```

Do not use a second confirmation after this modal. One clear confirmation is enough.

The modal should show:
- base price;
- normal price;
- Requisition price;
- additional savings;
- potential maximum value where useful;
- number owned before/after;
- whether another progression Requisition can still be earned and at what level.

## 26.11 General Requisitions

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
Minimum item: 1,000 B
10% one-purchase discount
Maximum saving: 300 B
```

### GENERAL REQUISITION II
```text
Minimum item: 2,000 B
15% one-purchase discount
Maximum saving: 600 B
```

### GENERAL MASTER REQUISITION
```text
Minimum item: 4,000 B
15% one-purchase discount
Maximum saving: 1,000 B
```

A General Requisition can be used instead of a Field Requisition, **not together with one**.

Permanent track pricing still applies first. The General Requisition then adds its allowed one-time benefit subject to the item's final discount guardrails.

## 26.12 Requisition Inventory

Under **Loadout → Requisitions**:

```text
FIELD        TYPE        OWNED

Compute      I             1
Compute      II            2
Compute      Master        0
Systems      I             2
Hardware     I             1
General      II            1
```

Detail view:

```text
COMPUTE REQUISITION II

Extra discount allowance:
+500 B

Minimum item:
1,750 B

Eligible:
Compute-tagged rewards

Expires:
Never

Stackable on one order:
No

Earned from:
Compute LV.9
```

This makes Requisitions feel like scarce progression inventory rather than coupon codes typed into checkout.

---

# 27. High-End Aspirational & Mastery Rewards

Show aspirational rewards from day one even when locked.

Example:

```text
FRAMEWORK LAPTOP
Base 8,400 B
Relevant: Tools / Systems / Compute
Access: Specialist or program-defined Mastery
Normal discount cap: manual

RTX GPU GRANT
Base 6,500 B
Primary: Compute
Access: Mastery
Requires Compute LV.8+
Requisition eligible

BAMBU LAB A1
Base 4,500 B
Primary: Hardware
Access: Mastery
Requires Hardware level

MINI SERVER
Base 3,200 B
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
- savings cap;
- Requisition eligibility;
- stock/region;
- levels remaining until unlock.

High-end items must be **individually balanced** so one track does not become the obvious economic choice.

---

# 28. Custom Orders

Custom Orders are a flagship LOADOUT feature.

After enough real building, participants can request technical equipment that is **not in the normal shop**.

Custom Orders require:
1. enough global **Bolts**;
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

Base Bolt estimate
4,200 B
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

Because Custom Order real-world prices can vary, the discount should be calculated from the **final approved Bolt quote**, not the participant's original estimate.

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

ESTIMATED BOLT QUOTE
8,420 B

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
BOLTS RESERVED / REQUISITION RESERVED
↓
PURCHASED
↓
SHIPPED
↓
DELIVERED
```

If the program rejects or cannot fulfill an approved purchase after reservation, release the Bolt hold and restore the Requisition.

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

The item does **not** need to fund the exact project that earned the Bolts.

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

---

# 65. Economic Guardrails

Model worst-case liability before launch.

Basic Bolt issuance example:

```text
200 builders
× 30 approved hours
× 10× average multiplier
= 60,000 Bolts
```

You need to know what **60,000 Bolts** can become in real fulfillment cost.

But v4 also requires modeling **discount liability**.

For every expensive item estimate:

```text
base fulfillment cost
- sponsor subsidy
× expected quantity
+ shipping/tax
+ normal track discount exposure
+ possible Requisition exposure
= worst-case program liability
```

Stress-test:
- many high-level builders buying the same expensive item;
- everyone saving Master Requisitions for GPUs/laptops;
- leaderboard + reviewer General Requisitions landing in one season;
- sponsor inventory disappearing;
- one track becoming more economically attractive than the others;
- cross-track markups being too punitive;
- Requisition values being so weak nobody uses them.

Keep configuration server/admin controlled so prices, caps, and Requisition values can be rebalanced without code changes.

---

# 66. Bolt Pricing Philosophy

Do not permanently promise a fixed public conversion such as:

> `1 Bolt = $X`

Bolts are program currency.

Pricing can reflect:
- fulfillment cost;
- sponsor subsidy;
- inventory;
- shipping/tax;
- region;
- season budget;
- field balance;
- scarcity;
- desired progression pace.

Each reward has a **base Bolt price**. The user's checkout quote is then derived from:
1. relevant track affinity;
2. cross-track markup when applicable;
3. permanent track discount;
4. normal expensive-item savings cap;
5. optional single Requisition;
6. stock/region/program overrides.

Conceptually:

```text
BASE BOLT PRICE
        ↓
RELEVANT TRACK?
        ├─ no → CROSS-TRACK MARKUP
        └─ yes
        ↓
PERMANENT TRACK %
        ↓
NORMAL SAVINGS CAP
        ↓
OPTIONAL REQUISITION
        ↓
FINAL QUOTE
```

Pricing must be explainable in the UI. Do not make users reverse-engineer why something costs more for them.

Custom Orders should use an approved final Bolt quote before any Requisition is reserved or consumed.

---

# 67. Example Launch Shop

A launch shop should be small, credible, capability-focused, and balanced across fields.

## Open / Early
- domain / developer hosting
- VPS credit
- GPU compute credit
- object storage / database credit
- ESP32 / RP2040
- USB serial/debug adapter
- sensors
- small dev board
- basic soldering accessories

## Mid
- Raspberry Pi
- 1TB NVMe
- logic analyzer
- Pinecil
- portable display
- networking gear
- PCB/fabrication grant
- FPGA starter board
- mini PC / server credit

## High / Specialist
- larger compute package
- higher-end mini PC
- serious networking/server gear
- better FPGA board
- larger PCB/fabrication grant
- 3D-printer grant

## Mastery / Aspirational
Visible but mostly level-gated:
- GPU grant
- high-end accelerator
- advanced FPGA board
- 3D printer
- specialist lab gear
- Framework/laptop grant
- workstation/server upgrade

## Custom
Locked behind the relevant Custom Order tier + enough Bolts + program fit.

For each launch item configure:
- primary/related track;
- access class;
- cross-track markup;
- base Bolt price;
- normal savings cap;
- Requisition eligibility;
- stock/region.

Do not pad the launch shop with unrelated lifestyle rewards just to make it look large.

---

---

# PART III — CANONICAL V4 ECONOMY INVARIANTS & OPEN CONFIG KNOBS

This section exists so implementation does not accidentally revive an older draft rule.

## Fixed Product Rules

These are product decisions unless intentionally changed later:

1. Four tracks: **Tools, Systems, Compute, Hardware**.
2. Research is a mode.
3. Track max level: **15**.
4. Bolts are global.
5. Reviewers control final multi-track XP allocation.
6. Most rewards are cross-track purchasable.
7. Cross-track purchases can cost more.
8. Permanent field discounts remain modest.
9. Expensive items cap ordinary permanent-discount savings.
10. Hard level gates are mainly for Mastery equipment.
11. Field Requisitions occur at **3 / 6 / 9 / 12 / 15**.
12. Milestones award **I / I / II / II / Master**.
13. Progression Requisitions do not expire.
14. Maximum one Requisition per order.
15. Requisitions cannot bypass level gates.
16. Requisitions have minimum item prices.
17. Redemption always receives a confirmation modal.
18. General Requisitions are rare one-use rewards, not permanent global discounts.
19. Track shop value must be balanced to prevent one obvious reward-maximizing field.
20. Every final price quote must be explainable and auditable.

## Working Values To Pilot-Test

These are defaults, **not sacred constants**:

```text
Permanent discount:
0% → ~15% over LV.1–15

Field Req I:
min ~750 B
+~200 B discount allowance

Field Req II:
min ~1,750 B
+~500 B discount allowance

Field Master:
min ~3,500 B
full earned field discount past normal cap
up to ~1,200 B total field-discount saving

General Req I:
min ~1,000 B
10% one purchase
max ~300 B

General Req II:
min ~2,000 B
15% one purchase
max ~600 B

General Master:
min ~4,000 B
15% one purchase
max ~1,000 B
```

Tune against:
- sponsor budget;
- actual fulfillment prices;
- observed Bolt issuance;
- redemption rates;
- track popularity;
- stock;
- season length;
- cross-track behavior.

## Questions To Resolve Before Public Season 00

- Exact XP thresholds for LV.1–15.
- Exact Bolt multiplier calibration.
- Default cross-track markup by Open/Specialist class.
- Exact normal savings-cap bands.
- Which launch rewards are Mastery.
- Whether every track receives exactly the same Requisition numerical values.
- Whether sponsor-funded Requisitions can have custom rules.
- Reviewer-score formula for General Requisition rewards.
- Season leaderboard General Requisition quantities.
- Regional pricing/tax treatment for Custom Orders.

These should live in admin/config rather than being hard-coded throughout the codebase.
