# LOADOUT — Economy, Progression & Rewards Plan

This document owns all rules that affect XP, Ore, reward pricing, specialization, Requisitions, Custom Orders, seasons, and economic balance.

> **Ore is global. Tracks shape access and price.**

> Naming: the global currency was called Bolts until 2026-10-13. It is called Ore now and its icon is the ore gem. Old briefs, audits and manifests still say Bolts; they are records and are not rewritten.

> **Depth gives leverage. Breadth gives flexibility. Mastery gives access.**

## Decisions recorded through 2026-10-19

This table is the current decision summary and supersedes conflicting legacy prose below. Plan 22 owns the peer-review process; this plan owns rates, Ore, prizes, and economic limits. The future platform and review service are not implemented. The calibration worksheet contains candidate calculations but does not override this plan.

| Topic | Agreed direction |
|---|---|
| Who it is for | High-school students aged 13–18. Use Hack Club teen verification; integration and operating details remain to be confirmed. |
| Open source | Every accepted project must be open source. |
| Tracking and journals | Hackatime is required for software; Lapse is required for Hardware. Every builder must write a project journal entry for each eight hours of development. Hardware ships require a bill of materials. Lapse recordings are reviewer-only; project pages and journals are public by default. |
| Review input | Peer reviewers score Originality, Technical Depth, Execution, and Documentation from 1–9, with a written reason of at least ten words for each review. All projects, including Hardware, use peer review. |
| Review gate | Each ship needs 12 countable peer reviews; continue assigning peers until full. Each builder owes eight valid reviews of other ships before their own payout. See Plan 22 for journal-age, flag-window, moderation, and penalty rules. |
| Rate | Normal reviewed ships pay a percentile-based rate from 1×–20×, with 10× as the mean. A Great-tier Signal claim can raise the cap to 30×. Ore = approved hours × the applicable rate, before separate bonuses or deductions. |
| Signal / Virality | Adapt Stardance's two external-traction tiers and platform thresholds. Good grants +50 Ore and achievement/shop rewards. Great raises the hourly cap to 30× and includes Good rewards. Total Signal bonus is capped at 5,000 Ore per project. Exact platform thresholds follow the current Stardance guide. |
| Usage Milestones | Keep separate from Signal and count verified real users of the project. Thresholds and rewards remain open. |
| External contributors | Open source is required. The first meaningful external contribution earns a separate achievement and +50 Ore. |
| Referrals | A referral counts only after the invited builder verifies, tracks and journals real work, and earns a first approved ship. Referral reward amounts and milestone ladder remain open. |
| Seasons and community rewards | Include achievements, seasons, seasonal quests, leaderboards, Community Eras, missions, and community rewards. Exact season cadence, quest values, and reward triggers remain open where not already fixed below. |
| General Requisitions | Include rare, one-use discounts that can be awarded for community actions or achievements. Exact triggers and values remain open. |
| Reward shop | Add a personal wishlist. Do not add a separate shop suggestion or voting system. Ore prices are the same in every region; availability and delivery may vary. |
| IRL and event-only systems | LOADOUT IRL is a planned future program feature. Stasis-style inventory, rentals, NFC checkout, and manufacturing are reserved for the in-person event, not the online platform. |
| Open ideas | Keep Limited Drops and sponsor drops/challenges as unconfirmed ideas. A free tools-and-services directory is planned for later, limited to services confirmed for LOADOUT participants. |

## Rule status and remaining decisions

| Topic | Current rule | Still open | Public owner |
|---|---|---|---|
| Ore and quality | Team checks LOADOUT fit and validity; 12 peer reviews set the four 1–9 category scores. Median per category, mean of medians, percentile curve; normal rate 1×–20×, mean 10×; Great Signal may reach 30×. | Final rounding, curve versioning and implementation details | `content/docs/review.md`, `progress.md` |
| Review operations | Eight reviews owed; peer assignments continue until 12 countable votes; 24-hour journal-age gate, then 24-hour flag window; no appeal. Three rejected flags in ten hours deduct 5% from the next final Ore payout. | Reviewer debt bookkeeping, repeat-penalty behavior, and implementation | `content/docs/review.md` |
| Tracking and evidence | Hackatime for software, Lapse for Hardware, journal every eight development hours, required Hardware BOM, Lapse videos visible only to reviewers | Tracker integration, consent, retention, and exact hardware evidence workflow | `content/docs/tracking.md`, `project-types.md`, `shipping.md` |
| Signal | Stardance Good/Great structure, +50 Ore Good tier, Great-tier 30× cap, 5,000 Ore per-project ceiling; reviewer-verified outside traction | Adaptation of platform-specific thresholds and implementation | `content/docs/review.md`, `projects.md` |
| Usage Milestones | Measure verified actual project users, separate from Signal reach | Thresholds, evidence definitions by project type, and rewards | `content/docs/projects.md` |
| Referrals | Count only after verified builder's first approved ship | Reward values and milestone ladder | `content/docs/referrals.md` (planned) |
| Contributor achievement | First meaningful external contribution earns +50 Ore | How later contributions are recognized | `content/docs/progress.md` |
| General Requisitions | Rare one-use shop discounts for community actions/achievements | Award triggers, values, inventory and limits | `content/docs/requisitions.md` |
| Shop | Wishlist included; prices uniform across regions; no shop-suggestion voting | Wishlist behavior, catalog operations, regional availability and delivery | `content/docs/pricing.md`, `prizes.md` |
| Shop and event ideas | Limited Drops and sponsor drops/challenges remain unconfirmed; free resource directory is planned later | Whether/when to scope these ideas and which services are actually available | Internal only until approved |
| Custom Orders | Relevant level, approved work, sufficient Ore and team fulfillment approval; program cancellation restores the Requisition | Tier levels and limits, quote validity, exact sourcing formula and cancellation/refund terms | `content/docs/custom-orders.md` |

Intermediate level-discount and XP curves, Research Mode bonuses, Custom Order details, and unconfirmed reward thresholds remain open. No answer or elapsed time automatically approves an open value. The agreed Field Requisition schedule remains 3/6/9/12/15; the alternative 5/8/10/12/15 is not adopted.


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

Each peer review scores the four LOADOUT dimensions from 1 to 9. The four category medians are averaged and mapped through Stardance's percentile payout curve. The normal hourly Ore rate ranges from 1× to 20×, with 10× as the mean. A Great-tier Signal claim raises the maximum hourly rate to 30×; it does not add 30× on top of the base payout. LOADOUT has no minimum payout floor beyond the 1× lower end of the curve. A ship rejected by the team receives no payout.

| Category score | Anchor |
|---:|---|
| 1 | Very weak evidence against the category |
| 5 | Meets the middle of the category's published anchors |
| 9 | Exceptional evidence against the category |

Originality, Technical Depth, Execution and Documentation are the four quality dimensions. LOADOUT follows the current Stardance median, percentile, and payout-curve approach, with its own category descriptions and Ore currency. Review operations and the Great-tier exception are in Plan 22 (removed 25 Oct 2026). Do not reintroduce the older 5× minimum, 0–20 category scores, or a claim that Signal cannot exceed 20×.

---

# 11. Ore + XP Formula

The current base award is:

```text
base Ore = approved hours × percentile-mapped hourly multiplier
qualifying Era bonus = base Ore × 10%
```

Twenty approved hours at a 10× hourly multiplier earn 200 base Ore. If the project qualifies for the Era bonus, that adds 20 Ore, for 220 total. A Great-tier Signal claim raises the payout curve's maximum hourly multiplier to 30×. The Signal Good tier grants a separate 50 Ore and achievement/shop rewards. Plan 11 owns Era qualification; Era stacking with Signal and exact rounding remain open.

Ore is global and spendable. A completed purchase reduces the available Ore balance. Spending does not remove XP, accepted projects or levels.

Track XP is one non-spendable award divided across the fields shown by the work. The split cannot duplicate the award. LV.15 is 3,500 XP, about 350 approved hours at the solid-work baseline. The exact XP award equation is still open. Plan 22's `approved hours × (10 + rating) ÷ 2` and its proposed 25% Research bonus are candidates, not agreed formulas. Do not publish an exact award calculated from them as a current rule.

---

# 12. Voting / Multiplier Abuse Protection

Agreed protections:
- no self-rating or rating a ship the reviewer owns;
- one countable review per reviewer per ship;
- reviewer assignments exclude projects the peer has already reviewed, skipped, or reported;
- medians reduce the influence of a single extreme rating; scores are not trimmed as outliers;
- review-quality moderation can inspect score reasons and assignment activity;
- fabricated hours/evidence, copied work, collusion, or deliberate rating manipulation can remove review privileges and trigger the program's fraud consequences.

Reviewers cannot buy a better score for their own ship. Team review verifies fit, validity, and evidence; peers determine the quality score.

Keep the final scoring understandable.

---

---

# 16. Referral System

Referrals are a planned feature. Reward bringing in **real builders**, not accounts. Reward values and the milestone ladder remain open.

## Verified Referral

A referral becomes valid when the new builder:
1. joins through the referral link
2. completes Hack Club teen verification
3. tracks meaningful work
4. writes journals
5. ships an approved project

The new builder's first approved ship is the qualification point. Referred-account abuse is covered by the existing anti-fraud policy.

Reward amounts, milestone counts, cosmetics, and any sponsor rewards remain unapproved examples. Building stays the main source of Ore.

---

# 17. Signal Bonus

Signal adapts Stardance's **Good** and **Great** Virality Bonus. It rewards external project attention and is separate from Usage Milestones, which measure verified people actually using a project.

The ship must already pass normal LOADOUT review, be original, and satisfy the open-source requirement. A participant submits a third-party link; a reviewer verifies the claim. Internal Hack Club channels/sites, bot reposts, SEO mirrors, and paid engagement do not count. Multiple claims may upgrade a project from Good to Great; if the ship has already been paid, recalculate and credit only the difference.

| Tier | Qualification | LOADOUT reward |
|---|---|---|
| **Good** | Meet one of Stardance's published platform thresholds | +50 Ore, a Good Signal achievement, and an exclusive shop reward |
| **Great** | Meet one of Stardance's published Great-tier platform thresholds | Raise the hourly payout curve's cap from 20× to 30×, plus all Good rewards and a Great Signal achievement |

The current Stardance thresholds are the reference for both tiers: Reddit 25/500 upvotes; Hacker News 10/100 points (Great requires the front page); GitHub 25/100 stars; YouTube 250/50,000 views; TikTok/Reels/Shorts 5,000/100,000 views; X and Bluesky/Threads 50/1,500 likes; Instagram 200 likes/100,000 views or 10,000 likes; app stores 100/10,000 downloads; package managers 1,000/50,000 downloads; Modrinth/CurseForge 2,500/100,000 downloads; third-party blog/news coverage qualifies at reviewer discretion.

The total Signal bonus is capped at **5,000 Ore per project**. This cap includes the hourly-rate uplift from Great. Signal does not raise the normal 20× cap for non-Great ships. These rules adapt Stardance's published guide; no Stardance source code or media is reused.

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
- SEO mirrors or bot reposts

Goal: **real external discovery and usage**.

---

# 19. Usage Milestones

Usage Milestones reward verified, real people using a shipped project. Keep them separate from Signal's views, stars, downloads, and media coverage. The count should represent people actually using the project, with verification methods appropriate to the project type.

Thresholds, reward values, repeat-use rules, evidence retention, and project-specific definitions of an active user remain open. The previous example counts and Ore values are not approved.

---

# 20. External Contributor Achievement

Open source is required for every accepted project. Reward the first meaningful external contribution with a one-time achievement worth **+50 Ore**.

The contribution must materially improve the project and come from someone outside the project team. No typo farming, trivial changes, or fake contributor rings count. Any additional contributor achievements or rewards remain open.

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
- **FIRST OUTSIDE CONTRIBUTION** — a meaningful contribution from outside the project team; grants **+50 Ore** once per project
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

Use rare **General Requisitions** instead. They are significant, but one-use. General Requisitions are included in LOADOUT's planned community-reward system and may be earned through community actions or achievements; specific triggers and amounts remain open.

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

### Shop Wishlist

Builders can save items to a personal wishlist to track what they are working toward. A wishlist does not reserve stock, lock the price, or guarantee availability. LOADOUT will not have a separate shop-suggestion or shop-item voting system.

Shop prices are the same Ore amount in every region. Regional availability, delivery, tax, and shipping terms may vary and must be shown before an order is confirmed.

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

**Planned feature; details remain open.** The examples below do not establish an amount, threshold, or entitlement. General Requisitions are rare one-use discounts for eligible shop items and may reward community actions or achievements.

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

**Open idea only.** Do not promise limited stock, launch dates, or drop contents until a separate catalog and fulfillment decision is approved.

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

**Open idea only.** Sponsor-provided products or service credits are not part of the confirmed reward catalog.

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

**Open idea only.** The track-specific challenge examples below are possibilities, not a confirmed sponsorship promise or participant entitlement.

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

These eight sample prices are working examples for planning copy, not final price promises, current stock or fulfillment commitments. Hours assume the solid-work baseline of 10 Ore per approved hour and no purchase discount.

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

Use the decision table at the top of this document and current sections 10, 11, 17, and 26 as the rule owners:

- Four tracks, Research Mode as a modifier, fifteen lifetime levels.
- Spendable global Ore; a single XP award split across demonstrated fields.
- Approved hours × the peer-percentile-mapped hourly rate; normal range 1×–20× with a 10× mean. Great Signal may raise the cap to 30×; no lower 5× floor.
- Signal Good grants +50 Ore and achievement/shop rewards; Signal Great raises the hourly cap to 30× and includes Good rewards, up to 5,000 Ore total per project.
- Every accepted project is open source. First meaningful external contribution grants the project achievement and +50 Ore.
- Hardware ships require a bill of materials. Hackatime is required for software, Lapse for Hardware, and journals are required at least every eight development hours.
- Every ship needs twelve countable peer reviews, eight valid reviews owed by the builder, 1–9 scores per category, and the Plan 22 payout/flag timing.
- Public project pages and journals by default; Lapse recordings are reviewer-only.
- LV.15 at 3,500 XP / about 350 solid-work hours in one track.
- Permanent track discount reaches 20%; use the best related track.
- Five identical 20% Field Requisitions at 3/6/9/12/15; 400-Ore minimum base price.
- One ticket per order, no expiry or transfers, no bypass of equipment levels.
- No Ore savings caps; at most 40% total reduction.
- Program cancellation restores a Field Requisition.
- No total limit on legitimate hours or projects; repeat ships need five new approved hours and new work.
- Lifetime progress persists across Seasons and Eras.
- Shop prices in Ore are the same in every region; item availability and delivery can vary by region.
- General Requisitions are planned as rare one-use community/achievement rewards; exact triggers and amounts remain open.

No older example, fallback default or unpublished candidate silently changes these rules.

---

## Working Values To Pilot-Test

The following remain open: intermediate discount and XP curves, the XP quality equation, any Research XP bonus, minimum track-allocation share, cross-track markup, Usage Milestone thresholds/rewards, referral reward values, General Requisition triggers/values, Custom Order tier values, and buyer-refund terms. Limited Drops and sponsor drops/challenges remain open ideas, not approved program features. See the calibration worksheet (removed; see git history) and Plan 22 (removed 25 Oct 2026). Do not treat an open item as an entitlement.

---

## Questions To Resolve Before Public Season 00

1. Exact XP award formula, intermediate thresholds, quality weighting and track allocation precision.
2. Research bonus amount and qualification criteria.
3. Full level-discount curve, rounding and cross-track pricing.
4. Usage Milestone qualification/evidence and referral reward configuration.
5. General Requisition triggers and award values; determine if and when open drop/sponsor ideas receive a separate approval.
6. Custom Order tiers, limits, landed-cost formula, quote validity and cancellation/refund terms.
7. Confirmed inventory, regional delivery/tax terms and operational launch readiness.

Store eventual configuration in one authority rather than scattering independent constants through implementation or Docs. This document does not implement accounts, review, orders or fulfillment.
