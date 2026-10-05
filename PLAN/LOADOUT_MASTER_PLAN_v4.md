# LOADOUT — Master YSWS + Pixl Fork Plan (v4)

**Consolidated master plan.** This document merges the useful, non-conflicting parts of the original OVERCLOCK plan, LOADOUT v2, LOADOUT v3, and the Pixl KEEP/MODIFY/DELETE migration plan. Where older drafts conflict, the newest LOADOUT decisions in this document are canonical.

> **Build your own technical stack.**

## Current canonical decisions

- LOADOUT is a **technical-capability YSWS**, not a general build-anything YSWS.
- Four lifetime tracks: **Tools, Systems, Compute, Hardware**.
- **Research Mode** is a modifier, not a fifth track.
- Each track has **15 lifetime levels**.
- **Bolts are global**. There are no separate track currencies.
- Multi-track ships can award XP across multiple tracks; reviewers decide the final percentage allocation.
- Most shop items remain buyable from outside their field, but cross-track buyers usually pay a higher price.
- Track levels give a **small permanent field discount**, specialist access, and Custom Order progression.
- Permanent discounts are **capped on expensive items** so a high-value category such as GPUs cannot dominate the economy.
- Rare **Requisitions** let specialists push past the normal savings cap on a single purchase.
- Field Requisitions are earned only five times per track: **LV.3, LV.6, LV.9, LV.12, LV.15**.
- Requisitions are one-use, non-transferable, do not expire, cannot stack on the same order, and have minimum eligible item prices.
- Rare **General Requisitions** can reward season performance, high-quality peer reviewing, or exceptional community contribution without creating permanent global discounts.
- Hard track locks are reserved for a small set of genuinely high-end/mastery equipment.
- **Depth gives leverage. Breadth gives flexibility. Mastery gives access.**



LOADOUT is a Hack Club-style YSWS for builders who create **tools, systems, compute, and hardware that expand what they or other builders are capable of building next**.

It is intentionally **not a general “build anything” YSWS**.

Participants ship technical infrastructure and capability-building projects, prove the work through Hackatime/Lapse + journals, grow a persistent **Builder Profile**, earn **Bolts**, and use those Bolts to upgrade their real-world setup.

The central idea:

> **Your projects become your digital loadout. Your rewards upgrade your physical loadout. Together, they make you a more capable builder.**

LOADOUT has four persistent technical tracks:

- **Tools**
- **Systems**
- **Compute**
- **Hardware**

**Research is not a general fifth track.** It is a project mode that can apply across the four tracks when a project is primarily experimental, benchmark-driven, investigative, or focused on answering a technical question.

Higher levels unlock field-specific advantages, specialist equipment, better Custom Order access, and a modest permanent discount in that field. **Bolts remain one global spendable currency.** Most equipment can still be purchased cross-track at a less favorable price.

> **Levels shape access and price. Bolts buy it.**

The shop philosophy is:

> **Build anywhere. Specialize for better prices. Master a field for its best gear.**

Long-term builders can unlock **Custom Orders**. If they have the required Builder/Track Level and enough Bolts, they can request technical equipment that is not listed in the normal shop, subject to safety, fulfillment, stock, country, sponsor-budget, and program-fit rules.

**Main catchphrase:**

> **Build projects. Level up your profile. Upgrade your loadout. Build harder stuff.**

# PART I — PROGRAM, ECONOMY & PRODUCT PLAN

## 1. Core Identity

### Name
**LOADOUT**

### Primary line
**Build your own technical stack.**

### Core thesis
**Build things that make builders more capable.**

### Main catchphrase
**Build projects. Level up your profile. Upgrade your loadout. Build harder stuff.**

### Economy line
**Levels unlock it. Bolts buy it.**

### The two halves of a LOADOUT

```text
DIGITAL LOADOUT                     PHYSICAL LOADOUT

Things you built                    Things you earned
────────────────                    ────────────────
Compiler                            FPGA board
CLI / dev tool                      Logic analyzer
GPU runtime                         Better SSD
Deployment system                   Raspberry Pi
Benchmark suite                     GPU
Debugging tool                      3D printer
Home-server stack                   Laptop
```

The two sides feed each other:

> **Build capability → earn capability → build harder capability.**

### What LOADOUT should feel like
A mix of:
- a technical YSWS
- a persistent builder progression system
- a portfolio of technical capability
- a developer-tool / systems / compute / hardware community
- a hardware and compute upgrade program
- a clean pixel-inspired technical interface

It should **not** feel like:
- a general “build anything” YSWS
- a generic hours-to-money platform
- a grant form
- a consumer-app showcase
- a fantasy/open-world game
- terminal/hacker parody
- fake cyberpunk
- generic AI SaaS
- a clone of Pixl, Stardance, Macondo, Horizon, or another broad project economy

The psychological loop:

> “I built something that expands my technical stack. That project permanently becomes part of my LOADOUT, grows my skills, and helps me unlock better equipment for the next harder thing.”

### The LOADOUT test

Before a project is eligible, ask:

> **Does the core project meaningfully expand technical capability for the builder or for other builders?**

Usually eligible:
- developer tools
- CLIs
- SDKs
- debugging/profiling tools
- compilers/runtimes
- servers/databases
- networking infrastructure
- deployment systems
- GPU/graphics/ML infrastructure
- performance tooling
- embedded systems
- PCBs
- robotics controllers
- FPGA work
- technical benchmark/experimental tooling

Usually not eligible by itself:
- portfolio websites
- basic CRUD apps
- generic social apps
- ordinary landing pages
- normal games
- simple chatbot wrappers
- consumer apps whose main challenge is ordinary product/UI work

A normal app can still qualify **when the technical infrastructure underneath it is the real project**.

Examples:

```text
NORMAL GAME
→ usually not LOADOUT

CUSTOM RENDERER / ENGINE / NETWORKING STACK FOR THE GAME
→ LOADOUT

AI CHAT APP USING AN API
→ usually not LOADOUT

CUSTOM INFERENCE RUNTIME / QUANTIZATION SYSTEM / GPU BACKEND
→ LOADOUT

TODO APP
→ usually not LOADOUT

LOCAL-FIRST SYNC ENGINE / DATABASE / CRDT TOOLING BUILT FOR IT
→ LOADOUT
```

---

## 2. Core Program Loop

```text
IDENTIFY A CAPABILITY GAP
        ↓
CHOOSE A TECHNICAL TRACK
Tools / Systems / Compute / Hardware
        ↓
BUILD SOMETHING THAT EXPANDS CAPABILITY
        ↓
TRACK WORK
Hackatime / Lapse
        ↓
WRITE JOURNALS
assign tracked time to real progress
        ↓
SHIP
        ↓
LOADOUT FIT GATE
does this actually belong in the program?
        ↓
VALIDITY REVIEW
hours + journals + AI + project validity
        ↓
QUALITY RATING
originality + technical depth + execution + documentation
        ↓
APPROVED HOURS × QUALITY
        ↓
EARN BOLTS + TRACK XP
        ↓
ADD SHIP TO DIGITAL LOADOUT
        ↓
┌────────────────┬──────────────────┬──────────────────┐
│                │                  │                  │
LEVEL UP      REWARD SHOP       CUSTOM ORDERS      SEASON / COMMUNITY
│                │                  │                  │
└──────────────→ UPGRADE PHYSICAL LOADOUT ←────────────┘
                         ↓
                  BUILD HARDER STUFF
```

Three persistent things grow at the same time:

1. **Digital Loadout** — the technical artifacts the builder has shipped.
2. **Track XP / Levels** — persistent proof of technical depth across the four tracks.
3. **Bolts** — spendable currency from approved work.

A user should immediately understand:

> **Build your stack. Bolts are global; tracks shape access and price.**

---

## 3. Projects

LOADOUT projects are not interchangeable “anything you built” submissions.

Each project must have a clear **Capability Statement**:

> **What new technical capability does this project create, expose, improve, automate, accelerate, or make easier?**

Each project stores:
- Project name
- Short description
- Capability Statement
- Primary technical track
- Optional secondary technical track
- Optional **Research Mode**
- Repository/project URL
- Demo URL
- Team members
- Start date
- Hackatime/Lapse connection
- Journals
- Ship history
- Review history
- Earned Bolts
- Track XP earned
- Signal/usage metrics
- AI declaration
- Digital Loadout artifact type

Projects may ship multiple major versions if the work is genuinely new.

Example:

```text
v0.1 — first functional prototype
v0.2 — major architecture / capability expansion
v1.0 — stable public release
```

The same work can never be rewarded twice.

## 3.1 Project Eligibility Gate

A project must satisfy **all** of these:

1. **Technical capability**  
   The core work is technical and expands what someone can build, run, understand, automate, measure, control, or optimize.

2. **Builder ownership**  
   The participant personally did substantial technical work.

3. **Depth**  
   The project is more than ordinary glue/UI around existing services.

4. **Evidence**  
   The work can be demonstrated through code, hardware, measurements, journals, demos, or equivalent evidence.

5. **LOADOUT fit**  
   The project belongs meaningfully in Tools, Systems, Compute, or Hardware.

## 3.2 Borderline Projects

Projects that mix consumer/product work with LOADOUT work are judged on the technical core.

Example:

```text
PROJECT
Multiplayer game

NOT ENOUGH BY ITSELF
UI + gameplay + normal backend

LOADOUT-ELIGIBLE CORE
Custom rollback netcode
Custom renderer
Own ECS/runtime
Network protocol tooling
Performance profiler
```

Only the eligible technical work should receive LOADOUT credit when a larger project contains both eligible and non-eligible parts.

---

# 4. Tracks, XP & Builder Profile

Every approved ship grows the participant's persistent **Builder Profile** and adds an artifact to their **Digital Loadout**.

A profile has four lifetime technical tracks:

```text
Tools      LV.7 / 15
Systems    LV.4 / 15
Compute    LV.9 / 15
Hardware   LV.3 / 15
```

**Track levels cap at 15.** They persist across seasons. Seasonal leaderboards may reset, but track progression never does.

Projects may span several tracks. The builder proposes a primary track and any secondary tracks, but the **reviewer makes the final XP allocation based on the work actually shipped**.

## 4.1 TOOLS
> Build tools that help people design, debug, automate, understand, test, or ship technical work.

Examples:
- CLIs
- SDKs
- editor extensions
- build tools
- package/dependency tooling
- profilers
- debuggers
- code-generation tools
- automation
- developer APIs
- testing infrastructure
- observability tools
- deployment tooling
- hardware-development utilities
- technical workflow tools

Natural shop affinity:
- domains / hosting for developer services
- keyboards / macro pads
- portable displays
- debug hardware
- test equipment
- software/tooling licenses where appropriate
- small dev boards

## 4.2 SYSTEMS
> Build the low-level software and infrastructure other things depend on.

Examples:
- operating systems
- compilers
- runtimes
- databases
- networking
- servers
- storage systems
- distributed systems
- self-hosting
- container/runtime infrastructure
- local-first/sync engines
- filesystems
- protocol implementations
- deployment infrastructure

Natural shop affinity:
- VPS / server credits
- mini PCs
- networking hardware
- storage
- RAM
- home-server hardware
- domains
- dedicated compute

## 4.3 COMPUTE
> Make computation faster, smarter, more capable, or more efficient.

Examples:
- GPU compute
- graphics
- Vulkan / WebGPU
- ML systems
- inference runtimes
- training infrastructure
- kernels
- optimization
- quantization
- simulation
- rendering
- parallel computing
- performance engineering
- accelerator software

Natural shop affinity:
- GPU compute
- GPUs
- RAM
- high-performance storage
- accelerator boards
- compute grants

## 4.4 HARDWARE
> Build technical capability in the physical world.

Examples:
- ESP32 / RP2040
- Raspberry Pi
- PCBs
- robotics
- FPGA
- embedded systems
- sensors
- custom keyboards / macro pads
- scientific devices
- electronics
- fabrication tools
- test instruments
- hardware accelerators

Natural shop affinity:
- dev boards
- soldering gear
- Raspberry Pis
- PCB grants
- FPGA boards
- sensors
- 3D printers
- electronics tools
- logic analyzers
- oscilloscopes where budget permits

## 4.5 Research Mode

**Research is a project mode, not a broad catch-all track.**

A Tools, Systems, Compute, or Hardware project can be marked **Research Mode** when its main purpose is to answer a technical question through an experiment, reproduction, benchmark, reverse-engineering effort, or investigation.

Examples:
- reproducing a systems paper
- benchmarking GPU backends
- testing quantization methods
- reverse engineering a protocol
- comparing scheduling strategies
- measuring hardware behavior
- evaluating FPGA architectures

Typical structure:

```text
QUESTION
   ↓
METHOD / IMPLEMENTATION
   ↓
MEASUREMENTS
   ↓
RESULTS
   ↓
WHAT CHANGED IN OUR UNDERSTANDING?
   ↓
PUBLIC TECHNICAL WRITE-UP
```

Research Mode does not lower the shipping requirement. The builder must still produce meaningful technical artifacts, reproducible experiments, code, hardware, datasets, or tooling.

## 4.6 Digital Loadout

Every accepted ship becomes a permanent **Digital Loadout artifact**.

Example:

```text
JEREMY341 // DIGITAL LOADOUT

TOOLS
✓ Vulkan benchmark harness
✓ GPU trace viewer

SYSTEMS
✓ PrivateUse1 backend scaffold
✓ Local deployment stack

COMPUTE
✓ TorchVK Vulkan runtime
✓ INT8 benchmark pipeline

HARDWARE
✓ FPGA inference testbench
```

The Digital Loadout makes the profile more than four XP bars. It shows what the builder has actually created.

## 4.7 Multi-Track XP Allocation

A project can meaningfully span multiple fields.

Example:

```text
PROJECT
Custom FPGA inference accelerator

FINAL REVIEW ALLOCATION

Hardware    50%
Compute     35%
Systems     15%
Tools        0%
            ───
            100%
```

If the ship earns `1,000 Track XP` before allocation:

```text
Hardware   +500 XP
Compute    +350 XP
Systems    +150 XP
```

The **Bolt reward does not split into track wallets**:

```text
Project reward
+620 BOLTS
```

Rules:
- the builder proposes the track mix at submission;
- reviewers can change it;
- percentages must total **100%**;
- use 5% increments in the normal UI;
- usually no more than **three tracks** should receive XP from one ship;
- allocation reflects meaningful technical contribution, not marketing labels;
- reviewers may assign 100% to one track when appropriate;
- Research Mode changes review expectations but does not receive its own XP;
- for team projects, each member can receive a different track allocation based on that member's approved contribution.

This prevents a project from being forced into one arbitrary category while still preventing builders from self-awarding XP everywhere.

## 4.8 Track Level Rules

Recommended:
- XP is awarded only from approved LOADOUT-eligible work.
- Larger or stronger ships award more Track XP.
- Track XP is lifetime and cannot be spent.
- Levels persist across seasons.
- Each track caps at **LV.15**.
- XP thresholds are config-driven and should be tuned after the pilot rather than hard-coded into product logic.
- Research Mode may award a small rigor/documentation bonus, not a separate Research XP track.
- Track levels affect:
  - permanent field discount,
  - cross-track pricing advantage,
  - specialist item unlocks,
  - rare Requisition milestones,
  - Custom Order eligibility,
  - profile/mastery recognition.

## 4.9 Depth vs Breadth

LOADOUT should support two valid strategies.

**Specialist**

```text
Tools       LV.2
Systems     LV.3
Compute     LV.14
Hardware    LV.1
```

Gets excellent Compute pricing, advanced Compute Custom Orders, rare Compute Requisitions, and mastery equipment, but weaker pricing elsewhere.

**Generalist**

```text
Tools       LV.7
Systems     LV.7
Compute     LV.7
Hardware    LV.7
```

Gets broad shop flexibility and respectable pricing across many categories, but has not reached the deepest mastery unlocks.

The design principle:

> **Breadth gives flexibility. Depth gives leverage. Mastery gives access.**

## 4.10 Builder Level

An overall **Builder Level** may remain as a profile summary or social/progression stat, but **track levels are the main shop/equipment gate**.

Do not let a high overall Builder Level substitute for missing domain experience on truly specialist/mastery equipment.

This is the central differentiator:

> **A ship permanently becomes part of the builder's technical stack, and the rewards improve the physical stack they use to build the next one.**

---

# 5. Work Tracking

LOADOUT uses:

- **Hackatime** for software/coding work
- **Lapse** for hardware, CAD, electronics, fabrication, and valid non-code work

Tracked time by itself is **not enough**.

Participants assign tracked work to journals.

---

# 6. Journaling System

Journals are a first-class feature, not an optional blog.

They connect:

> tracked time → actual work → evidence → project history → reviewer verification

A participant should not merely have:

> “42 hours tracked”

They should have a clear history explaining what those 42 hours produced.

## 6.1 Journal Entry Structure

Each journal contains:
- Date
- Project
- Assigned tracked sessions
- Hours/minutes assigned
- What was worked on
- What changed
- Problems encountered
- What was learned
- Next step
- Optional screenshots
- Optional commits / PRs
- Optional demo/video
- Optional hardware photo
- Optional benchmark
- Optional links

Example:

```text
JOURNAL #018

Project:
TorchVK

Time assigned:
2h 14m

Today:
Implemented Vulkan buffer allocation and added
the first CPU → GPU tensor copy path.

Problems:
Memory alignment was wrong for one test case.

Fix:
Changed allocation alignment to match the Vulkan
device requirements.

Result:
Tensor allocation works for my basic add test.

Next:
Implement GPU → CPU copy.
```

## 6.2 Assigning Hours

The journal UI shows available unassigned tracked time.

```text
UNASSIGNED TIME

Oct 01
14:10–15:42     1h 32m
16:01–17:20     1h 19m

TOTAL AVAILABLE
2h 51m
```

The builder creates a journal and assigns:

```text
Journal #18
Assigned: 2h 14m
Remaining: 37m
```

This prevents vague hour claims and double assignment.

## 6.3 Journal Quality

Invalid:

> “Worked on project.”

> “Fixed bugs.”

> “Did frontend.”

Better:

> “Rebuilt the settings form and added validation for provider endpoints. I originally stored the API key in localStorage but changed it to server-side encrypted storage after reviewing the threat model.”

Journals should be concise, but specific enough to verify real progress.

## 6.4 Reviewer Actions on Journaled Time

Reviewers can:
- approve all assigned time
- partially approve time
- ask for clarification
- reject clearly unverifiable time

Example:

```text
TRACKED
12h 40m

JOURNALED
12h 40m

APPROVED
11h 55m
```

## 6.5 Journal Attachments

Recommended:
- screenshots
- commit links
- PRs
- videos
- CAD screenshots
- PCB design images
- benchmark graphs
- photos
- terminal output
- hardware test videos

## 6.6 Journal-to-Hour Integrity

Each tracked minute may be assigned only once.

```text
TrackedSession
09:00–11:00
120 minutes

Journal A
80 minutes

Journal B
40 minutes

Remaining
0
```

Never:

```text
Journal A
120 min

Journal B
120 min
```

for the same source session.

## 6.7 Public Journals

Recommended default:
- journal title/date/progress public
- sensitive details can be private to reviewers
- API keys/secrets must never be pasted
- project owners may hide specific evidence attachments from public view while keeping them reviewable

A public build log makes project discovery much better.

---

# 7. Shipping

A ship is the official submission of a project version.

The ship page includes:
- Project
- Capability Statement
- Version
- Primary / secondary technical track
- Research Mode status
- Short description
- What changed
- Demo URL
- Repository
- Screenshots
- Demo video
- Journals included
- Total assigned hours
- AI declaration
- Known limitations
- What the builder learned
- Optional Signal links
- Optional usage metrics

---

# 8. Review System

Each ship passes through three stages.

## Stage 0 — LOADOUT Fit Gate

Before hour review or scoring, reviewers verify:

- the project's technical core fits **Tools, Systems, Compute, or Hardware**
- the Capability Statement is credible
- the work meaningfully expands technical capability
- the submission is not primarily a generic consumer/product project
- the claimed LOADOUT-eligible work can be separated from unrelated product/UI work where necessary

Possible results:
- Fits LOADOUT
- Clarification requested
- Partially eligible scope
- Not eligible for LOADOUT

A project can be good and still not be a LOADOUT project.

That is intentional.

## Stage 1 — Validity Review

Reviewers verify:
- the project exists
- it works enough to count as shipped
- claimed hours are believable
- journals match the work
- no duplicated hours
- AI policy is satisfied
- project is not copied
- project is not low-effort spam
- links work
- required evidence exists

Possible results:
- Approved
- Changes requested
- Partially approved hours
- Rejected

## Stage 2 — Quality Rating

Once valid, the approved technical scope receives ratings.

These ratings produce the multiplier.

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

# 13. AI Policy

AI is allowed.

AI cannot be the main builder.

Recommended maximum:

# **40% AI-generated implementation**

The exact number can be tuned before launch.

## Allowed AI Use

Examples:
- debugging
- explaining errors
- docs help
- autocomplete
- brainstorming
- architecture discussion
- Research Mode
- asking about APIs
- small boilerplate
- code review
- test suggestions

## Counts Toward AI-Generated Implementation

Substantial AI-created:
- functions
- components
- files
- core logic
- algorithms
- implementation passes

## AI Inside the Product

Different issue.

If a participant personally builds an AI router that calls an LLM API, that is fine.

The AI model used by the product is not automatically “AI-generated project code.”

---

# 14. AI Declaration

Every ship:

```text
HOW DID YOU USE AI?

[ ] No AI
[ ] Research / explanation
[ ] Debugging
[ ] Autocomplete
[ ] Code generation
[ ] Asset generation
[ ] Other

Estimated AI-generated implementation:
[ 22 ] %

Describe what AI generated:
____________________________
```

Reviewers may inspect:
- commits
- journals
- code history
- project structure
- participant explanations

Do not rely solely on AI detectors.

---

# 15. Projects Over the AI Limit

Do not instantly ban the participant.

Return the ship:

```text
CHANGES REQUESTED

AI-generated implementation appears
to exceed the LOADOUT limit.
```

The builder may:
- rewrite sections
- replace generated logic
- show stronger authorship
- resubmit

Intentional deception is handled separately.

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

# 34. Team Projects

Teams are allowed.

Each member:
- tracks their own time
- writes attributable journals
- receives credit only for their own approved work

Example:

```text
TOTAL PROJECT
80 approved hours

Jeremy
31h

Alex
28h

Maya
21h
```

The ship multiplier applies to each member’s approved hours.

---

# 35. Reviewer System

Reviewer screen:

```text
PROJECT
TorchVK

CAPABILITY
PyTorch training over Vulkan on consumer GPUs

LOADOUT FIT
APPROVED

TRACKED
42h 12m

ASSIGNED TO JOURNALS
40h 08m

REQUESTED
40h 08m

APPROVED
38h 50m

AI DECLARED
18%

QUALITY
Originality       8.6
Technical Depth   9.0
Execution         8.1
Documentation     7.8

TRACK XP ALLOCATION
Compute           70%
Systems           30%
Hardware           0%
Tools              0%
                  100%

BOLTS
+589 B

TRACK XP
+820 total
→ +574 Compute
→ +246 Systems
```

Reviewer actions:
- approve / reject LOADOUT fit;
- narrow eligible scope;
- approve all/partial time;
- adjust final track allocation;
- score quality dimensions;
- request changes;
- reject;
- flag AI;
- flag fraud;
- leave note.

Track allocation rules:
- builder proposal is visible but not binding;
- reviewer percentages total 100%;
- normal UI uses 5% steps;
- usually allocate to no more than three fields;
- only approved technical contribution counts;
- do not award token XP to unrelated fields merely because a technology appears in the stack.

For team projects, reviewers may set per-member allocation when contributions differ.

Reviewer quality metrics:
- reviews completed;
- useful feedback;
- average review time;
- appeals overturned;
- reviewer/moderator agreement;
- queue age;
- moderation flags.

If reviewer activity earns General Requisitions, use a **quality-weighted reviewer score**, not raw review count.

---

# 36. Reviewer Compensation

Possible models:
- per valid completed review
- small reviewer stipend
- sponsor-supported
- volunteer during early beta

Quality matters more than raw throughput.

---

# 37. Appeals

Participants can appeal:
- rejected hours
- AI decision
- project rejection
- fulfillment rejection

Appeals go to a different reviewer/moderator.

Limit repeated appeals.

---

# 38. UI Philosophy

The new LOADOUT UI direction is:

# **Warm Grid + Pixel Editorial + Builder Dashboard**

The site should feel like a polished Hack Club tool that happens to have a pixel identity — not a videogame UI pasted onto a SaaS dashboard.

## 38.1 Desktop-first Canvas

Primary design target:

```text
1920 × 1080 desktop
```

Design should scale responsively afterward, but 1920px is the canonical visual reference.

Recommended shell:
- persistent **left sidebar**
- thin top utility bar where useful
- wide content canvas
- warm beige / paper background
- subtle 1px grid texture
- mostly square cards
- sharp black borders
- occasional black feature panels
- one restrained high-energy accent color

## 38.2 Sidebar

The sidebar is a core part of the identity.

Suggested grouping:

```text
LOADOUT

BUILD
Dashboard
Projects
Journals
Tracks
Missions

ECONOMY
Shop
Orders
Custom Orders
Referrals

COMMUNITY
Community
Leaderboard
Seasons

YOU
Loadout
Profile
Settings
```

At the bottom:
- pixel character / avatar
- Builder Level
- Bolt balance where useful

## 38.3 Pixel Characters

Pixel builder characters stay.

Users should eventually be able to create/customize their own **SVG/pixel-style builder character** for:
- profile avatar
- project attribution
- leaderboard
- review cards
- community feed
- seasonal badges/scenes

Characters are the main expressive visual element.

Do **not** fill the interface with dozens of unrelated SVG decorations.

Rule:

> **Characters can be expressive. Interface chrome should stay restrained.**

## 38.4 Decorative Graphics

Use less decorative SVG noise than the earlier concepts.

Good:
- 1 main pixel character illustration per major page
- occasional 4–12px pixel clusters
- one halftone/pixel landscape or project image
- small custom icons where navigation needs them
- subtle bottom-edge dithering on selected marketing pages

Avoid:
- floating SVG symbols everywhere
- decorative icon clouds
- repeated mountains on every card
- giant game-art backgrounds behind functional UI
- visual elements that compete with actual data

## 38.5 Cards

Recommended:
- 1px or 2px charcoal border
- 0–2px radius by default
- warm-white or cream fill
- black panels for high-emphasis sections
- no glassmorphism
- little/no drop shadow
- dense but breathable spacing

## 38.6 Interaction

Use animation only for feedback:
- XP bar fill
- `+Bolts`
- level-up
- new unlock
- successful ship
- order confirmation
- subtle hover shift

Avoid constant ambient motion.

Pixel design is a **system**, not wallpaper.

---

# 39. Recommended Visual Direction

Best hybrid:

# **Technical Field Manual + Pixel Editorial + Parts Catalog**

Visual principles:
- warm paper / beige canvas
- fine graph-paper grid
- strong black typography
- narrow mono labels
- fixed left sidebar
- high-density but organized technical dashboards
- rectangular outlined controls
- black feature panels
- pixel builder avatars
- occasional halftone/pixel technical imagery
- restrained bright accent

LOADOUT should have its own identity:

- **Digital Loadout artifacts are visible, not hidden behind generic XP.**
- **Track levels are Tools / Systems / Compute / Hardware.**
- **Physical rewards visibly connect to technical capability.**
- **Custom Orders feel like earned access to specialized equipment.**
- **The UI shows real projects, real benchmarks, and real hardware.**
- **Pixel avatars are customizable user identity, not NPCs.**
- **No open-world game is required.**
- **No huge decorative SVG system is required.**

Recommended mix:

```text
STRUCTURE
practical technical sidebar + dense utilities

BRANDING
graph-paper field-manual texture + pixel/editorial typography

PROGRESSION
track bars + Digital Loadout artifacts + levels + unlock states

REWARDS
parts-catalog / technical inventory presentation

COMMUNITY
artifact cards + builder avatars + compact technical data
```

---

# 40. Color System

Primary palette:

```text
PAPER
#F4EEDC
warm beige/off-white background

PAPER LIGHT
#FBF8EC
cards / content surfaces

GRID
#DDD6C2
very subtle graph-paper lines

INK
#101112
near-black / charcoal

INK SOFT
#26282A
secondary black panels

MUTED
#77776F
secondary copy / metadata

LOADOUT LIME
#B8FF3D
primary interactive accent
```

The lime should be used selectively for:
- current nav item
- primary CTA
- XP/progress
- unlocked status
- selected filter
- important positive state

Secondary semantic accents may exist for tracks/status:
- Tools: warm yellow / lime-adjacent
- Systems: steel / indigo
- Compute: cool blue
- Hardware: orange
- Research Mode: violet status marker only

They should not overpower the main cream/black/lime identity.

Do not turn the whole site neon green.

---

# 41. Typography

## Display / Hero
Pixel/block-inspired display face.

Use for:
- LOADOUT
- page hero titles
- levels
- Bolt balances
- reward prices
- large stats
- season names

Keep it bold and sparse.

## UI / Metadata
A compact monospace face such as **JetBrains Mono** or a similarly readable technical mono.

Use for:
- sidebar labels
- small metadata
- timestamps
- XP values
- tags
- tables
- project technical details

## Body
Readable neutral sans-serif or highly readable mono depending on density.

Use for:
- descriptions
- journal content
- rules
- forms
- help text

Never use a pixel font for long paragraphs.

Hierarchy should come from:
- size
- weight
- whitespace
- rules/borders

not from excessive decorative effects.

---

# 42. Main Navigation

Primary desktop navigation is a persistent left sidebar.

```text
LOADOUT

BUILD
▣ Dashboard
▣ Projects
▣ Journals
▣ Tracks
▣ Missions

ECONOMY
▣ Shop
▣ Orders
▣ Custom Orders
▣ Referrals

COMMUNITY
▣ Community
▣ Leaderboard
▣ Season

YOU
▣ Loadout
▣ Profile
▣ Settings

────────────────

[ PIXEL AVATAR ]
@username
Builder LV.14
850 Bolts
```

Top utility bar can contain:
- global search
- notifications
- compact Bolt balance
- avatar/user menu

Do not duplicate every sidebar item in the top navigation.

---

# 43. Dashboard

```text
LOADOUT // OPERATOR

JEREMY341

BOLTS
4,821 B

APPROVED TIME
82H 41M

SHIPS
7

SEASON RANK
#42

SIGNAL
2.4×

DIGITAL LOADOUT
6 ARTIFACTS

NEXT TRACK MILESTONE
Compute LV.9
→ Requisition II

NEXT MASTERY UNLOCK
Compute LV.10 → advanced Compute gear

REQUISITIONS
Compute I ×1

────────────────────

ACTIVE PROJECT

TorchVK

COMPUTE
+ SYSTEMS

TRACKED
31h 12m

JOURNALED
28h 53m

UNASSIGNED
2h 19m

[ WRITE JOURNAL ]
```

---

# 44. Journals UI

```text
JOURNALS

UNASSIGNED TIME
2h 51m

TODAY

14:10–15:42
TorchVK
1h 32m

16:01–17:20
Unassigned
1h 19m

[ + NEW JOURNAL ]
```

Editor:

```text
NEW JOURNAL

PROJECT
TorchVK

TIME
[ select tracked sessions ]

ASSIGNED
2h 14m

WHAT DID YOU DO?
____________________________

WHAT CHANGED?
____________________________

WHAT WENT WRONG?
____________________________

WHAT DID YOU LEARN?
____________________________

ATTACH
Screenshot
Commit
Video
Benchmark
Hardware Photo

[ SAVE JOURNAL ]
```

---

# 45. Ship Result UI

```text
SHIP ANALYSIS COMPLETE

PROJECT
TorchVK

APPROVED
31H 18M

ORIGINALITY
8.6

TECHNICAL DEPTH
9.0

EXECUTION
8.1

DOCUMENTATION
7.8

QUALITY MULTIPLIER
17.23×

SIGNAL BONUS
+50 B

TOTAL
+589 BOLTS

TOTAL TRACK XP
+820 XP

FINAL TRACK ALLOCATION
Compute      70%   +574 XP
Systems      30%   +246 XP

COMPUTE
LV.8 → LV.9

MILESTONE REWARD
COMPUTE REQUISITION II

[ CLAIM ]
```

If a ship crosses several milestones at once, show each level/unlock/Requisition grant separately.

This should be one of the most satisfying screens in the product.

---

# 46. Shop UI

The shop should feel like a technical parts inventory, not Shopify.

```text
SHOP // COMPUTE

BOLTS
4,821 B

YOUR TRACKS
Tools       LV.4
Systems     LV.6
Compute     LV.10
Hardware    LV.2

REQUISITIONS
Compute I ×1
Compute II ×1
General I ×1

FILTERS
ALL
TOOLS
SYSTEMS
COMPUTE
HARDWARE
OPEN
SPECIALIST
MASTERY
CUSTOM
```

Open reward:

```text
1TB NVMe

RELEVANT
Systems / Compute

BASE
900 B

YOUR PRICING TRACK
Compute LV.10

TRACK RATE
-11%

NORMAL CAP
100 B

YOUR PRICE
800 B

[ BUY ]
```

Cross-track reward:

```text
RASPBERRY PI 5

PRIMARY
Hardware

RELATED
Systems

YOUR BEST RELEVANT TRACK
Systems LV.6

BASE
700 B

YOUR PRICE
651 B

[ BUY ]
```

Locked mastery reward:

```text
RTX GPU GRANT

PRIMARY
Compute

ACCESS
MASTERY

BASE
6,000 B

REQUIRES
Compute LV.8

YOU
Compute LV.10

RAW TRACK DISCOUNT
11% = 660 B

NORMAL SAVINGS CAP
350 B

NORMAL PRICE
5,650 B

COMPUTE REQUISITION II AVAILABLE
With requisition:
5,340 B

[ BUY NORMALLY ]
[ USE REQUISITION ]
```

When `USE REQUISITION` is selected, show the mandatory redemption confirmation modal before checkout.

For locked users:

```text
ADVANCED FPGA BOARD

Hardware LV.8 REQUIRED

YOU
Hardware LV.3

5 LEVELS UNTIL MASTERY ACCESS

VISIBLE, BUT LOCKED
```

Do not hide aspirational rewards completely.

---

# 47. Leaderboard UI

```text
SEASON 02 // COMPUTE

#   USER          BOLTS   SHIPS
1   pixelwitch    2,944     8
2   jeremy341     2,729     6
3   arnav         2,221     9
4   maya          1,998     4
```

Optional rank movement:

```text
▲3
▼1
```

---

# 48. Builder Profiles

The Builder Profile is one of LOADOUT's most important screens.

It should answer two questions immediately:

1. **What technical capability has this person built?**
2. **What can they build with next?**

Show:
- custom pixel/SVG builder character
- username
- overall Builder Level
- Bolt balance
- approved hours
- ships
- achievements
- four track levels
- Digital Loadout artifacts
- Physical Loadout / redeemed technical equipment
- current season
- Signal
- projects
- journal activity
- referral count
- next meaningful unlock
- Requisition inventory / next Requisition milestone

Example:

```text
JEREMY341
BUILDER LV.14

Tools        LV.5  █████░░░░░
Systems      LV.4  ████░░░░░░
Compute      LV.7  ███████░░░
Hardware     LV.3  ███░░░░░░░

850 BOLTS

REQUISITIONS
Compute I ×1
General II ×1

NEXT REQUISITION
Compute LV.9 → Requisition II

DIGITAL LOADOUT
✓ TorchVK Vulkan runtime
✓ INT8 benchmark pipeline
✓ FPGA inference testbench
✓ provider routing CLI

PHYSICAL LOADOUT
✓ Logic analyzer
✓ Raspberry Pi 5
✓ 1TB NVMe

NEXT MASTERY UNLOCK
Compute LV.10 → Advanced Compute Tier
```

The profile should read like a **technical capability map and portfolio**, not a generic social-media page and not just a currency dashboard.

---

# 49. Builder Character & Cosmetics

Users can customize a small pixel/SVG builder character.

Character system can include:
- hair
- skin tone
- shirt/jacket
- pants
- backpack
- hat
- glasses
- handheld tool
- small accessory
- background/profile frame

Target:
- 32×32 / 48×48 / 64×64 visual grid feel
- exported/rendered as SVG or crisp pixel-style assets
- readable at tiny leaderboard sizes
- recognizable on profile/project cards

Progression cosmetics:
- profile frames
- season badges
- track badges
- limited accessories
- shop cosmetics
- sponsor/event items

This gives low-cost progression without pretending cosmetics are the main reward.

Important:
- avatars are user identity
- do not build an NPC/game-world dependency around them
- page layouts should work even when the character art is absent

---

# 50. Animation

Good:
- `+428 B` pop-up
- ship processing
- small pixel burst
- progress fill
- order confirmation
- level unlock

Avoid:
- constant glitches
- scanlines everywhere
- moving backgrounds
- heavy CRT simulation

---

# 51. Sound

Optional:
- boot beep
- Bolt reward sound
- ship complete
- purchase click

Always provide:

```text
SOUND
[ OFF ]
```

---

# 52. Logo Direction

Desired:
- geometric
- pixel-aware
- works at 16–32px
- sticker-friendly
- monochrome-friendly
- compatible with the cream/black/lime UI
- not esports
- not cyberpunk
- not a lightning-bolt cliché just because the currency is called Bolts

Current promising concepts:
1. **Loadout Box / Crate** — a compact equipment-box mark
2. **Builder Flag / Peak** — progression without becoming fantasy
3. **Stack / Upgrade Layers** — levels accumulating over time
4. **Offset Pixel Wordmark** — distinctive LOADOUT lettering
5. **Bracket / Slot Mark** — modular loadout slots / equipment system
6. **Builder Avatar Mark** — small head/character paired with wordmark

Logo and currency icon should be separate:
- LOADOUT mark = brand
- Bolt icon = economy

The wordmark should remain strong even without the icon.

---

# 53. Community

Useful:
- project discovery
- journals
- comments
- peer ratings
- track feeds
- season feed
- achievements
- leaderboards
- ship announcements

Avoid:
- follower obsession
- engagement farming
- generic social feed

---

# 54. Project Discovery

Discovery should reinforce the technical niche.

Filters:
- Tools
- Systems
- Compute
- Hardware
- Research Mode
- season
- newest
- highest technical depth
- most Signal
- most used by other builders
- beginner-friendly
- benchmarks
- open source
- trending

Optional artifact types:
- CLI
- library / SDK
- compiler / runtime
- server / service
- benchmark
- hardware
- FPGA
- embedded
- debugging tool
- infrastructure
- research artifact

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

# 58. MVP Website

## Required MVP

### Identity / Auth
- Hack Club OAuth
- user profile
- custom pixel/SVG builder avatar (simple first version)
- four lifetime track levels, max LV.15

### Projects
- project creation
- mandatory Capability Statement
- proposed multi-track classification
- optional Research Mode
- LOADOUT-fit self-check
- repo/demo/media links
- project pages
- versioned ships
- Digital Loadout artifact classification

### Work Evidence
- Hackatime integration
- Lapse integration
- journal creation
- tracked-session assignment
- evidence attachments
- no double-assignment

### Submission / Review
- ship submission
- LOADOUT Fit Gate
- AI declaration
- reviewer dashboard
- validity review
- partial-hour approval
- quality ratings
- reviewer-controlled track XP allocation
- multiplier calculation

### Progression / Economy
- four track XP ledgers
- LV.1–15 level engine
- Digital Loadout artifacts
- global Bolt transaction ledger
- Bolt balance
- field-aware shop pricing
- cross-track markup
- permanent track discount
- per-item normal savings cap
- Open / Specialist / Mastery access
- Field Requisition grants at LV.3/6/9/12/15
- Requisition inventory
- minimum item-value validation
- one-Requisition-per-order rule
- Requisition redemption confirmation modal
- shop
- reward orders

### Community
- technical project discovery
- builder profiles
- compact activity/community views
- basic season leaderboard if operationally useful

## Phase 2
- Custom Orders
- General Requisitions
- reviewer-score rewards
- richer leaderboard/season rewards
- Physical Loadout display
- Signal verification
- sponsor drops
- achievements
- missions / quests
- richer avatar cosmetics
- usage milestones
- track leaderboards
- public journal feed
- referrals / referral milestones
- advanced anti-abuse

## Phase 3
- IRL events
- sponsor challenges
- richer fulfillment automation
- advanced analytics
- community compute grants
- more complex character customization

## Implementation Strategy

Use the open-source Pixl codebase as **infrastructure**, not as a product model.

Reuse where valuable:
- Hack Club auth
- Hackatime integration
- Lapse-related evidence concepts
- project CRUD
- submission/review plumbing
- shop/order infrastructure
- moderation/admin patterns
- database/server patterns

Rebuild around LOADOUT:
- technical project eligibility;
- four-track progression;
- multi-track review allocation;
- Digital Loadout;
- global Bolts;
- field-aware pricing;
- savings caps;
- Requisition inventory/redemption;
- Mastery access;
- Custom Orders;
- participant-facing UI.

Do **not** preserve Pixl's general-purpose/open-world product model.

LOADOUT should be a purpose-built technical-capability YSWS that happens to reuse proven infrastructure.

---

# 59. Core Data Model

Potential entities:

```text
User
BuilderProfile
Track
BuilderTrackProgress
TrackLevelConfig
TrackXPTransaction
ShipTrackAllocation

DigitalLoadoutArtifact
PhysicalLoadoutItem

Project
ProjectCapabilityStatement
ProjectCollaborator
TrackedSession
Journal
JournalTimeAssignment
Ship
ShipClaimedMinute

Review
LoadoutFitReview
PeerRating
Multiplier
ReviewAudit
Appeal

BoltTransaction

Reward
RewardTrackAffinity
RewardRequirement
RewardPricePolicy
RewardOrder

RequisitionDefinition
RequisitionGrant
RequisitionReservation
RequisitionRedemption

CustomOrder
CustomOrderQuote

Referral
SignalEvent
Achievement
Mission
Quest
Season
LeaderboardSnapshot
SponsorDrop

Notification
Report
Upload
AvatarConfig
```

Important project fields:

```text
capability_statement
research_mode
artifact_type
loadout_fit_status
eligible_scope_notes
proposed_track_allocation
final_track_allocation
```

Track allocation should be stored per ship/review rather than pretending one immutable project tag can describe every future version.

Important reward fields:

```text
base_bolt_price
primary_track
related_tracks[]
access_class              # OPEN / SPECIALIST / MASTERY
cross_track_markup_percent
minimum_track_level
normal_discount_cap_bolts
requisition_eligible
allowed_requisition_tiers[]
minimum_builder_level?    # optional, secondary to track gate
stock
region
sponsor_id
```

Important Requisition fields:

```text
scope                     # FIELD / GENERAL
track?                    # null for General
tier                      # I / II / MASTER
minimum_item_bolts
extra_discount_allowance
percent_discount?
maximum_discount_bolts
expires_at                # null for normal LOADOUT Requisitions
source                    # track milestone / season / reviewer / sponsor
status                    # AVAILABLE / RESERVED / REDEEMED / RESTORED
```

Use append-only transaction histories for:
- Bolts;
- Track XP;
- Requisition grants/redemptions where practical.

Do not derive permanent economic state only from mutable counters.

---

# 60. Bolt Ledger

Never store only:

```text
user.bolts = 4812
```

Use a transaction ledger:

```text
+457
Ship: TorchVK v0.2

+50
Signal I

+50
Verified referral

-1200
Raspberry Pi 5
```

Displayed balance is calculated from transactions.

Benefits:
- auditability
- corrections
- abuse investigation
- refunds
- clear user history
- sponsor-budget reporting

Track XP should use a similar immutable transaction approach:

```text
+820 Compute XP
Ship: TorchVK v0.2
```

---

# 61. Ship-to-Hour Integrity

When a ship claims journaled hours, those minutes are bound to that ship/version.

Future ships may only claim new work.

```text
v0.1
20h claimed

v0.2
+17h new work

PROJECT TOTAL
37h
```

No double-paying old work.

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

# 69. Why Journals Matter

Journals:
- make hours verifiable
- discourage idle tracking
- make reviews easier
- teach reflection
- create project history
- reduce AI slop
- give context to failures
- help peer voters understand the work
- create public builder stories
- make tracked hours assignable instead of vague

Therefore journals are a **core economic primitive** of LOADOUT, not just content.

---

# 70. Final Product Positioning

LOADOUT is not:

> “build anything and earn a shop currency.”

It is not:

> “a grant for the project you just built.”

It is not:

> “Pixl/Stardance with different levels.”

It is:

> **a technical builder progression program where people build the tools, systems, compute, and hardware that expand what builders can do, then use one global economy to upgrade the equipment they build with next.**

The defining loop:

```text
TECHNICAL CAPABILITY GAP
→ BUILD A TOOL / SYSTEM / COMPUTE / HARDWARE ARTIFACT
→ PROVE THE WORK
→ SHIP
→ REVIEWER ALLOCATES TRACK XP
→ ADD IT TO YOUR DIGITAL LOADOUT
→ LEVEL THE RELEVANT TRACKS
→ EARN GLOBAL BOLTS
→ GET BETTER FIELD PRICING / UNLOCKS
→ SAVE OR USE RARE REQUISITIONS
→ UPGRADE YOUR PHYSICAL LOADOUT
→ ATTEMPT A HARDER TECHNICAL PROJECT
```

Each system encourages something useful:

```text
LOADOUT FIT
→ stay technically focused

HOURS
→ do substantial work

JOURNALS
→ prove and explain progress

QUALITY
→ build better

DIGITAL LOADOUT
→ make shipped capability visible

MULTI-TRACK XP
→ recognize real cross-domain work

TRACK LEVELS
→ develop specialization

PERMANENT FIELD DISCOUNT
→ make every level matter

SAVINGS CAPS
→ stop expensive categories dominating the economy

REQUISITIONS
→ make milestone specialization materially valuable

GENERAL REQUISITIONS
→ reward exceptional community contribution without permanent privilege

BOLTS
→ one understandable spendable currency

SHOP
→ upgrade real building capability

CUSTOM ORDERS
→ choose specialized equipment that actually fits your path
```

Core identity:

> **Build your own technical stack.**

Economy lines:

> **Bolts are global. Tracks shape access and price.**

> **Breadth gives flexibility. Depth gives leverage. Mastery gives access.**

Main catchphrase:

> **Build projects. Level up your profile. Upgrade your loadout. Build harder stuff.**

---

# 71. Final One-Paragraph Pitch

> **LOADOUT is a technical YSWS where you build your own stack. Ship developer tools, systems, compute infrastructure, or hardware that expands what you or other builders can do. Every accepted ship becomes part of your permanent Digital Loadout, reviewers allocate its XP across the technical fields it actually uses, and you earn one global currency: Bolts. Your track levels shape shop access and pricing: most cross-track equipment stays buyable, specialists get better prices, and only the most important mastery gear is level-gated. Expensive-item discounts are capped, while five rare Requisitions across each LV.1–15 track let long-term specialists unlock much larger one-time savings. Keep building and you can access Custom Orders for specialized tech outside the normal shop. Your projects upgrade your digital loadout; your rewards upgrade your physical one.**

---

# 72. Short Announcement Draft

> **INTRODUCING LOADOUT**
>
> **Build your own technical stack.**
>
> **YOU SHIP:** developer tools, systems, compute, or hardware that make you or other builders more capable.
>
> Every accepted ship joins your **Digital Loadout**, earns **global Bolts**, and levels the technical tracks it actually used.
>
> Your track levels give better pricing and specialist unlocks. Most cross-track gear is still buyable, while mastery gear rewards real specialization.
>
> Rare **Requisitions** at major level milestones let you push past normal discount caps on the upgrades you really want.
>
> **Build projects. Level up your profile. Upgrade your loadout. Build harder stuff.**

---

# PART II — PIXL FORK, MIGRATION & IMPLEMENTATION PLAN

This engineering plan is part of the same LOADOUT master document. It is updated for the v4 product/economy model rather than the older five-track/simple-unlock model.

**Date:** 2026-10-02  
**Source base:** `hackclub/pixl` (`main`)  
**Target product:** LOADOUT  
**Current working currency name:** **Bolts** (working name, easy to rename before launch)

> **Core LOADOUT rule:** Build technical capability; shipped artifacts become the Digital Loadout.  
> **Economy rule:** Bolts are global; tracks shape access and price.  
> **Progression rule:** Four tracks, LV.1–15, reviewer-controlled multi-track XP allocation.  
> **Pricing rule:** modest permanent field discount + expensive-item savings cap + rare Requisitions.  
> **Catchphrase:** Build projects. Level up your profile. Upgrade your loadout. Build harder stuff.

---

## 0. Decision

Use Pixl as an **engineering base**, not as the product/UI to reskin.

The right migration is:

```text
FORK PIXL
   ↓
KEEP proven YSWS plumbing
   ↓
REMOVE the open-world/game product
   ↓
SEPARATE participant web from admin/reviewer tooling
   ↓
ADD LOADOUT progression
Builder Profile → Multi-Track XP → LV.1–15 → Global Bolts → Field Pricing → Requisitions → Mastery / Custom Orders
   ↓
REBUILD the visual layer around LOADOUT
```

Do **not** do this:

```text
Pixl source
+ replace "Pixl" with "LOADOUT"
+ change colors
= done
```

That would leave LOADOUT coupled to Pixl's open-world model, NPCs, lobbies, lore, game-specific database tables, and game-specific routing.

---

# 1. Target Repository Shape

Recommended end-state:

```text
loadout/
├── apps/
│   ├── web/                  # NEW: participant-facing LOADOUT app
│   ├── landing/              # KEEP + REBUILD: public marketing/RSVP site
│   ├── admin/                # RENAME/MODIFY from Pixl dashboard
│   ├── server/               # KEEP + HEAVILY MODIFY
│   ├── docs/                 # RENAME/MODIFY from web-shell (optional in MVP)
│   └── slack-bot/            # OPTIONAL: extracted useful Pixorpheus pieces
│
├── packages/
│   ├── config/               # KEEP concept, LOADOUT-specific config
│   ├── theme/                # KEEP concept, LOADOUT design tokens
│   └── docs-engine/          # OPTIONAL / MODIFY
│
├── docs/                     # Rewrite around LOADOUT rules
├── LICENSE                   # KEEP MIT notice
├── package.json              # MODIFY
├── turbo.json                # KEEP/MODIFY
└── README.md                 # REWRITE
```

Archive/remove after useful code is extracted:

```text
apps/game/
apps/pixo-dm/
packages/map-sync/
```

Pixorpheus should not survive as-is. Extract only the useful Slack/support pieces if needed.

---

# 2. Root-Level Map

| Path | Decision | LOADOUT action |
|---|---|---|
| `LICENSE` | **KEEP** | Keep MIT copyright/license notice exactly as required. Add LOADOUT copyright separately if desired. |
| `package.json` | **MODIFY** | Rename package namespace, remove game/map/NPC scripts, add `web`, `admin`, `docs` scripts. |
| `bun.lock` | **KEEP/REGENERATE** | Keep initially, regenerate after workspace deletion/renames. |
| `turbo.json` | **KEEP/MODIFY** | Keep monorepo build orchestration; update app names/tasks. |
| `.github/` | **MODIFY** | Keep useful CI/security workflows; rename Pixl-specific deployment/release references. |
| `.gitignore` / `.dockerignore` | **KEEP** | Adjust only if app names/paths change. |
| `README.md` | **REWRITE** | LOADOUT concept, local setup, architecture, attribution to Pixl base. |
| `CONTRIBUTING.md` | **MODIFY** | LOADOUT contribution workflow. |
| `DEVELOPER.md` | **MODIFY** | Rewrite architecture once prune is complete. |
| `CLAUDE.md` / agent docs | **MODIFY** | Replace stale Pixl product assumptions with LOADOUT architecture/rules. |
| security audit reports | **KEEP AS REFERENCE** | Useful security history; move to `docs/security/reference/` if cluttered. |
| `docs/` | **MODIFY** | Rewrite policy/product docs; remove Pixl lore. |

### Root `package.json` target

Remove scripts tied only to the game:

```text
map:sync
npcs:bake
```

Keep/adapt:

```text
dev
build
config:sync
theme:sync
docs:build
previews:build
```

Add:

```text
web
admin
server
landing
docs
typecheck
test
```

---

# 3. `apps/game` — DELETE / ARCHIVE

## Decision: **DELETE FROM ACTIVE WORKSPACES**

Pixl's Godot/open-world app is not part of LOADOUT's product.

It contains:
- Godot project/scenes
- game assets
- NPC data
- open-world UI
- world/player systems
- game web pages
- game-linked config/theme output

### Do not port
- movement
- map/world
- NPCs
- player houses/villages
- cinematics
- lore
- game lobbies
- proximity interactions
- Godot theme syncing

### Extract before deletion
Only inspect/copy isolated logic if useful:
- any project submission UX concepts
- any public project card patterns
- any Hackatime/Lapse display behavior that is not already in the web/admin apps
- any genuinely reusable pixel avatar art pipeline

### Migration action

```text
1. Remove `apps/game` from active deployment.
2. Remove imports/routes that only support it.
3. Keep a temporary `archive/pixl-game-reference/` branch/tag if desired.
4. Do not maintain a dead Godot app inside LOADOUT.
```

---

# 4. `apps/landing` — MODIFY HEAVILY

## Decision: **KEEP THE NEXT.JS SKELETON, REBUILD THE PRODUCT**

Useful base:
- Next.js app structure
- routing
- SEO plumbing
- robots/sitemap
- image handling
- deployment config
- API/proxy utilities where still applicable

### Keep

```text
apps/landing/
├── package.json
├── next.config.ts
├── postcss.config.mjs
├── Dockerfile
├── app/robots.ts
├── app/sitemap.ts
└── basic app/lib structure
```

### Modify

```text
app/globals.css
app/_components/
app/_content/
app/api/
app/[lang]/          # only keep if multilingual support is actually wanted
lib/
proxy.ts
public/
```

### Replace completely

Pixl:
- open-world story
- restoration/civilization story
- Pixl characters/NPC copy
- Pixl shop marketing
- Pixl branding

LOADOUT landing should explain, in order:

```text
1. Build your own technical stack.
2. Four tracks: Tools / Systems / Compute / Hardware.
3. Research Mode is optional, not a fifth track.
4. Reviewers split XP across the fields a ship actually used.
5. Bolts are one global currency.
6. Track levels shape shop access and price.
7. Permanent discounts are capped on expensive items.
8. Rare Requisitions push past the cap.
9. Digital Loadout → Physical Loadout.
10. Custom Orders.
11. Journals + tracking prove real work.
12. Join / RSVP / Slack.
```

### Visual target

```text
1920px canonical desktop
warm beige graph-paper background
black rectangular sections
left-aligned editorial layout
pixel/block display type
customizable builder character
restrained lime
few decorative SVGs
```

---

# 5. NEW `apps/web` — PARTICIPANT PRODUCT

## Decision: **CREATE NEW**

Do not turn the Pixl internal admin dashboard into the participant interface.

Create a clean participant app, reusing API/types/components selectively.

Recommended routes:

```text
/
├── dashboard
├── projects
│   ├── new
│   └── [projectId]
├── journals
│   ├── new
│   └── [journalId]
├── tracks
│   ├── tools
│   ├── systems
│   ├── compute
│   └── hardware
├── ship
├── missions
├── shop
├── orders
├── custom-orders
├── community
├── leaderboard
├── season
├── profile/[username]
├── loadout
└── settings
```

Research Mode is exposed as a project filter/mode, not a fifth progression route.

Requisition inventory can live under `loadout/requisitions` rather than adding another permanent sidebar item.

### Shared shell

Persistent sidebar:

```text
LOADOUT

BUILD
Dashboard
Projects
Journals
Tracks
Missions

ECONOMY
Shop
Orders
Custom Orders
Referrals

COMMUNITY
Community
Leaderboard
Season

YOU
Loadout
Profile
Settings
```

Top utility bar:
- search
- notifications
- Bolt balance
- pixel avatar

---

# 6. `apps/dashboard` → `apps/admin`

## Decision: **KEEP + RENAME + REFACTOR**

Pixl's dashboard is valuable because it already contains substantial operational tooling.

Rename:

```text
apps/dashboard → apps/admin
@pixl/dashboard → @loadout/admin
```

## Keep / adapt these areas

### Review system — **HIGH VALUE**

Keep and rewrite around LOADOUT:

```text
ReviewForm.tsx
ReviewDetailTabs.tsx
ReviewTable.tsx
ReviewTabs.tsx
ReviewHeartbeat.tsx
ReviewPipelineSteps.tsx
ReviewVerdictChart.tsx
LiveReview.tsx
SecondPassChecklist.tsx
```

Add LOADOUT review dimensions:

```text
LOADOUT Fit
Eligible technical scope
Approved Hours
AI declaration
Originality
Technical Depth
Execution
Documentation
Builder-proposed track split
Reviewer-final track allocation
Total Track XP
Per-track XP awards
Quality multiplier
Global Bolts issued
Signal / bonuses
```

### Fraud / moderation — **KEEP**

```text
FraudTriageForm.tsx
Moderate.tsx
bans/
audit/
admins/
```

Adapt flags for:
- fake Hackatime
- duplicate journal assignment
- double dipping
- vote rings
- fake usage/Signal
- referral abuse
- AI declaration problems

### Shop / fulfillment — **HIGH VALUE**

Keep/adapt:

```text
AddShopItemForm.tsx
BulkUploadShopItemsForm.tsx
ShopConfigEditor.tsx
ShopConfiguratorPanel.tsx
ShopItemConfigurators.tsx
ShopItemEditConfigurator.tsx
PriceUsdInput.tsx
fulfillment/
fulfillers/
```

Add:
- primary / related track affinity
- access class: OPEN / SPECIALIST / MASTERY
- relevant Track Level requirement
- global Bolt base price
- cross-track markup
- permanent level discount
- normal discount savings cap
- Requisition eligibility / tier rules
- stock
- region
- sponsor subsidy
- Custom Order handling
- locked/unlocked state

### Evidence / project review — **KEEP**

```text
CommitList.tsx
HackatimePanel.tsx
ProjectNotes.tsx
ProjectBadges.tsx
GuidelinesGate.tsx
uploads/evidence views
```

### General admin utilities — **KEEP**

```text
CommandPalette.tsx
GlobalSearch.tsx
GrowthChart.tsx
NotifyForm.tsx
PendingButton.tsx
Shell.tsx
TeamLog.tsx
```

## Delete or archive from admin

```text
NpcForm.tsx
```

Likely Pixl-event/lore-specific components should be removed after verifying dependencies, including `Blackout*` components if they only support Pixl's Blackout mechanic.

## Refactor immediately

`app/actions.ts` is extremely large.

Do **not** keep adding LOADOUT logic to one giant actions file.

Split by domain:

```text
actions/
├── auth.ts
├── users.ts
├── reviews.ts
├── projects.ts
├── journals.ts
├── economy.ts
├── shop.ts
├── fulfillment.ts
├── moderation.ts
├── signals.ts
└── admin.ts
```

---

# 7. `apps/server` — KEEP, THEN AGGRESSIVELY PRUNE

## Decision: **THIS IS THE MOST VALUABLE REUSE**

Keep the Express/TypeScript service, database client, auth patterns, security middleware, uploads, project/review plumbing, and integrations.

### Keep core infrastructure

```text
src/auth/
src/db/
src/clientIp.ts
src/crypto.ts
src/rateLimit.ts
src/moderation.ts
src/imageValidation.ts
src/hcaEligibility.ts
src/hackatime/
```

Adapt:

```text
src/config.generated.ts
src/index.ts
```

### `src/index.ts`

Keep:
- Express app
- security headers
- rate limiting
- JSON error handling
- session revocation
- active-ban enforcement
- HTTP server

Remove:
- game WebSocket attachment
- LittleGuy forwarder
- game-only routes

Change final identity:

```text
{name: "loadout-server", status: "ok"}
```

---

# 8. Server Routes — File-by-File Decision

## KEEP + MODIFY

### `routes/auth.ts`
**Keep.**

Use for:
- Hack Club auth
- sessions
- eligibility
- account bootstrap

Remove Pixl-specific:
- auto-joining `#pixl`
- Pixorpheus-specific callback behavior
- game redirects

Add:
- LOADOUT profile bootstrap
- Builder Profile initialization
- LOADOUT Slack channel behavior only if wanted

---

### `routes/hackatime.ts`
**Keep almost entirely.**

This is core infrastructure.

Adapt:
- redirect URLs
- branding
- project linkage
- session→journal assignment API

Add:
- unassigned-time endpoint
- claimed/consumed session minutes

---

### `routes/projects.ts`
**KEEP, MAJOR REFACTOR.**

This is one of the most valuable files.

Preserve:
- project CRUD
- ownership
- collaborators
- repo/demo links
- ship concepts
- evidence where applicable

Add:

```text
capability_statement
research_mode
ship_version
proposed_track_allocation
final_track_allocation
total_track_xp
per_track_xp_awards
approved_minutes
ai_declaration
quality_scores
multiplier
bolts_awarded_global
signal_data
```

Split the current large route into:

```text
routes/projects/
├── index.ts
├── crud.ts
├── ships.ts
├── journals.ts
├── evidence.ts
└── validation.ts
```

---

### `routes/profile.ts`
**Keep, major refactor.**

Add Builder Profile:

```text
builder_level_summary
tools_xp / level
systems_xp / level
compute_xp / level
hardware_xp / level
track_max_level = 15
requisition_inventory_summary
avatar_config
next_unlocks
```

Prefer XP transaction ledgers instead of only mutable total columns.

---

### `routes/collaborators.ts`
**Keep.**

LOADOUT team projects need per-person attribution.

Rules:
- each user tracks own time
- each user journals their own work
- each receives XP/Bolts based on their approved contribution

---

### `routes/uploads.ts`
**Keep.**

Use for:
- project screenshots
- journal evidence
- hardware photos
- benchmark images
- avatar asset uploads if needed

---

### `routes/projectUrlSafety.ts`
**Keep.**

Useful for untrusted project/demo URLs.

---

### `routes/gitRepoUrl.ts`
**Keep.**

Useful for repository normalization/validation.

---

### `routes/urlLiveness.ts`
**Keep.**

Useful for verifying public demos/links during review.

---

### `routes/notifications.ts`
**Keep.**

LOADOUT needs:
- review results
- changes requested
- level up
- unlocks
- Requisition earned / restored
- reward/order status
- Custom Order decisions

---

### `routes/admin.ts`
**Keep/modify.**

LOADOUT admin actions and operational endpoints.

---

### `routes/reports.ts`
**Keep.**

Use for community/project/user reporting.

---

### `routes/activity.ts`
**Keep/modify.**

Power:
- dashboard recent activity
- profile activity
- community feed

Do not turn it into engagement farming.

---

### `routes/explore.ts`
**Keep/repurpose.**

Make this LOADOUT project discovery:
- track
- newest
- shipped
- beginner
- Signal
- trending
- season

---

### `routes/journalsPublic.ts`
**Keep/expand.**

Journals are core to LOADOUT.

Add:
- public/private evidence separation
- tracked-session assignment
- approved minutes
- ship binding
- no double assignment

---

### `routes/referral.ts`
**Keep, defer until Phase 2 if necessary.**

LOADOUT referrals only become valid after an approved first ship.

---

### `routes/shop.ts`
**KEEP, MAJOR REFACTOR.**

Preserve:
- item listing
- pricing/stock patterns
- region handling
- order foundations

Replace:
- Pixl `pixels` economy assumptions

Add:
- global Bolt base cost
- primary / related tracks
- OPEN / SPECIALIST / MASTERY access
- Track Level requirements
- cross-track markup
- permanent track discount calculation
- normal savings cap per item
- Requisition eligibility
- Requisition quote preview
- stock/region/sponsor fields
- locked visibility
- order history
- Custom Order relationship

---

### `routes/upvotes.ts`
**Keep if used for community feedback / shop suggestions.**

Do not use upvotes as a major economic source.

Good uses:
- Shop Suggestions
- useful project reactions
- community interest

---

## KEEP / REPURPOSE LATER

### `routes/sidequests.ts`
Rename to:

```text
routes/missions.ts
```

Use for:
- weekly missions
- seasonal quests
- small Bolt/XP bonuses

Do not let mission farming replace real projects.

---

### `routes/events.ts`
Keep only if Seasons / IRL / sponsor events need it.

Otherwise defer.

---

### `routes/showNTell.ts`
Potentially repurpose as:
- project showcase
- featured ships
- weekly community digest

Defer if unnecessary.

---

### `routes/ideas.ts`
Optional.

Could become a lightweight project idea board, but it is not MVP-critical.

---

### `routes/forms.ts`
### `routes/formVerification.ts`

Keep only if LOADOUT uses embedded RSVP/application/sponsor forms.

Otherwise remove after launch architecture is stable.

---

### `routes/bomCsv.ts`

Keep only if we want hardware BOM tooling.

Good future fit for Hardware track, but not MVP.

---

### `routes/news.ts`

Delete or defer unless LOADOUT gets an actual program news system.

---

### `routes/operations.ts`

**INSPECT BEFORE DECIDING.**

Do not delete blindly. Keep operational functionality only if it supports moderation/reviews/fulfillment rather than Pixl lore/game operations.

---

# 9. Server Routes / Systems to DELETE

After dependency checks:

```text
routes/npcs.ts
routes/story.ts
routes/village.ts
```

Remove all imports/mounts in `src/index.ts`.

### Friends

```text
routes/friends.ts
```

Recommendation: **DEFER/REMOVE for MVP.**

LOADOUT is a builder community, but a friends graph/DM system is not part of the core mechanic.

Can be reintroduced later if strong user demand exists.

### Vault

```text
routes/vault.ts
```

Recommendation: **ARCHIVE/DELETE unless inspection shows reusable generic reward infrastructure.**

Do not keep Pixl lore vocabulary.

---

# 10. `src/ws/` — DELETE

Current files include:

```text
gameServer.ts
gameServer.test.ts
gameServer.db.test.ts
lobbies.ts
lobbies.test.ts
```

LOADOUT does not need:
- realtime player movement
- game lobbies
- scene presence
- proximity voice
- live multiplayer world state

Remove:

```ts
attachWebSocketServer(httpServer)
```

from `src/index.ts`.

If LOADOUT later needs realtime notifications, add a small purpose-built mechanism rather than carrying a 48 KB game server.

---

# 11. `src/littleGuy.ts` — DELETE

Remove the Pixl game-forwarder behavior.

If LOADOUT needs a bot later, it belongs in `apps/slack-bot`, not hidden inside the main API server.

---

# 12. `src/macondo/` — KEEP AS OPTIONAL IMPORT INTEGRATION

## Decision: **KEEP, BUT ISOLATE**

This code consumes Macondo projects/journals from Hack Club.

Potential LOADOUT uses:
- import previous projects
- import journals
- bootstrap a Builder Profile
- migration from other Hack Club project systems

Do not make LOADOUT dependent on Macondo to function.

Move behind an integration boundary:

```text
src/integrations/macondo/
```

Mark Phase 2 if MVP scope gets too large.

---

# 13. `src/ysws/` — KEEP

## Decision: **HIGH-VALUE ANTI-ABUSE CODE**

Current code includes:
- YSWS archive lookup
- imports
- double-dip detection
- routes

This is directly useful to LOADOUT.

Keep and adapt:

```text
ysws/archive.ts
ysws/doubleDip.ts
ysws/imports.ts
ysws/routes.ts
```

Use during review to detect when the same work/repo was already rewarded elsewhere.

Important LOADOUT distinction:
- importing previous work may contribute to **profile history** only under explicit policy
- it should not automatically mint new Bolts for work already paid elsewhere

---

# 14. Database / Drizzle Strategy

## Do not deploy the full Pixl migration history unchanged

Pixl's migration chain contains game-specific tables for positions, player characters, NPC state, lobbies, friends, and other open-world/social systems.

It also contains valuable YSWS pieces such as:
- Hackatime projects;
- moderation;
- project journals;
- shipping;
- review audit;
- reward/project systems.

Keep old migrations read-only as reference while extracting code.

Before first LOADOUT deployment, create a fresh LOADOUT schema baseline rather than carrying every game migration into production.

Suggested baseline domains:

```text
users
sessions / revocation
bans
violations
admins

builder_profiles
tracks
track_level_config
builder_track_progress
track_xp_transactions

projects
project_collaborators
project_capability_statements
tracked_sessions
journals
journal_time_assignments
ships
ship_claimed_minutes
ship_track_allocations
digital_loadout_artifacts

reviews
loadout_fit_reviews
peer_ratings
review_audit
appeals

bolt_transactions

rewards
reward_track_affinities
reward_requirements
reward_price_policies
reward_orders

requisition_definitions
requisition_grants
requisition_reservations
requisition_redemptions

custom_orders
custom_order_quotes
physical_loadout_items

seasons
missions
achievements
referrals
signal_events
notifications
reports
uploads
avatar_configs
```

Critical invariants:
- no mutable-only Bolt balance;
- no mutable-only XP history;
- track allocations for a ship total 100%;
- level-based Requisition grants are idempotent;
- a Requisition cannot be redeemed twice;
- one order can consume at most one Requisition;
- Bolt/Requisition reservations are released on failed/cancelled fulfillment;
- price quote records preserve enough detail to audit how a final price was calculated.

Keep transaction history for Bolts, XP, and scarce Requisition state transitions where practical.

---

# 15. `apps/pixorpheus` — EXTRACT, DO NOT PORT WHOLE

## Decision: **DEFER / PARTIAL REUSE**

Pixorpheus contains a lot of functionality that LOADOUT does not need:
- AI personality
- unsolicited chime behavior
- roasts
- per-user AI memory
- speaking-style learning
- random utility commands
- AI model routing

Do not ship all of that with LOADOUT.

## Useful pieces worth extracting

```text
src/tickets/       → support workflow
src/slack/         → Slack app/bootstrap
src/github/        → GitHub → Slack notifications
src/external/      → dashboard ↔ Slack support bridge
src/pixelate/      → optional avatar/pixel utility
```

Possible future app:

```text
apps/slack-bot/
```

MVP scope:
- program notifications
- support tickets
- ship announcements
- reviewer/helper workflow

No AI persona required.

---

# 16. `apps/pixo-dm` — DELETE

Tiny separate DM app.

LOADOUT does not need another overlapping Slack service.

If any behavior is useful, merge it into the future `apps/slack-bot`.

---

# 17. `apps/web-shell` → `apps/docs`

## Decision: **KEEP / RENAME IF WE WANT DOCS EARLY**

Useful:
- Next.js docs shell
- proxy handling
- docs navigation
- generated docs support

Rename:

```text
apps/web-shell → apps/docs
@pixl/web-shell → @loadout/docs
```

If early MVP speed matters more:
- keep the code in repo
- do not deploy it yet
- put rules in the main web app initially

---

# 18. `packages/config` — KEEP CONCEPT, REWRITE CONTENT

Current Pixl package has one central program config and syncs generated copies into multiple apps.

That architecture is useful.

Rename:

```text
@pixl/config → @loadout/config
pixl.json → loadout.json
```

Suggested LOADOUT config:

```json
{
  "programName": "LOADOUT",
  "currencyName": "Bolts",
  "tracks": ["tools", "systems", "compute", "hardware"],
  "slackChannel": "#loadout",
  "season": {
    "id": "S00",
    "name": "BOOT"
  },
  "aiImplementationMaxPercent": 40
}
```

Do not put every mutable shop price in this file.

Shop inventory/pricing belongs in the database/admin system.

### Update `sync.ts`

Generate config only for:

```text
apps/web
apps/server
apps/admin
apps/landing
apps/docs
apps/slack-bot (if enabled)
```

Remove:
- Godot/game output
- Pixorpheus output if Pixorpheus is retired

---

# 19. `packages/theme` — KEEP CONCEPT, REWRITE PALETTE

## Decision: **VERY USEFUL**

Use as canonical LOADOUT design tokens.

Remove Godot-specific output.

Suggested tokens:

```text
paper        #F4EEDC
paper-light  #FBF8EC
grid         #DDD6C2
ink          #101112
ink-soft     #26282A
muted        #77776F
lime         #B8FF3D

border       1px solid ink
radius       0–2px
sidebar      ~240–280px desktop
```

Track semantic accents:

```text
Tools          warm yellow / lime-adjacent
Systems        indigo / steel
Compute        cool blue
Hardware       orange
Research Mode  violet status marker only
```

Important:
- lime remains the main UI action/progress accent
- track colors are secondary information
- no permanent neon-green cyberpunk look

---

# 20. `packages/map-sync` — DELETE

Pixl open-world map syncing has no LOADOUT purpose.

Remove:
- package
- root `map:sync` script
- consumers/imports

---

# 21. `packages/docs-engine` — MODIFY OR DEFER

Useful features:
- Markdown rules/docs
- generated previews
- config token replacement

Problem:
- current output targets Pixl game web paths

Options:

### Option A — reuse
Retarget output to:

```text
apps/docs/
```

Rename tokens and config source to LOADOUT.

### Option B — simplify
Use normal Next.js Markdown/MDX rendering and remove the custom engine later.

**Recommendation:** keep it initially if it saves time, but do not spend MVP time expanding it.

---

# 22. Root `docs/` — REWRITE BY CATEGORY

## KEEP AS STRUCTURAL REFERENCES

Rewrite these concepts for LOADOUT:

```text
welcome
eligibility
software requirements
hardware requirements
moderation
what counts as shipping
building
first project
shipping/submitting
rewards
shop
Hackatime
collaboration
AI policy
```

## DELETE / REPLACE PIXL LORE

Examples:

```text
restoration
vault
open-world story
NPC/trial explanations
Pixl-specific sidequest lore
```

## Add LOADOUT docs

```text
010-welcome.md
020-how-loadout-works.md
030-eligibility.md
040-builder-profile.md
050-tracks.md
060-hackatime-lapse.md
070-journals.md
080-shipping.md
090-review.md
100-quality-multiplier.md
110-track-xp-levels.md
120-bolts.md
130-shop.md
140-custom-orders.md
150-ai-policy.md
160-teams.md
170-double-dipping.md
180-signal.md
190-seasons-missions.md
200-moderation-appeals.md
```

---

# 23. LOADOUT-Only Systems We Need to ADD

Pixl supplies plumbing. These systems are LOADOUT's actual product.

## A. Builder Profile + Four Track Progressions

```text
BuilderProfile
BuilderTrackProgress
TrackXPTransaction
TrackLevelConfig
```

Tracks:
- Tools
- Systems
- Compute
- Hardware

Track levels:
- lifetime;
- max LV.15;
- config-driven XP thresholds.

Research is project metadata/mode, not a fifth progression ledger.

## B. Multi-Track Allocation Engine

```text
ShipTrackAllocation
```

Responsibilities:
- store builder-proposed allocation;
- store reviewer-final allocation;
- validate sum = 100%;
- default UI increments of 5%;
- calculate per-track XP awards from total XP;
- support per-member allocations on team projects.

Bolts remain global and do not split.

## C. Level Engine

Functions:

```text
xpForNextLevel(track, level)
getLevelForXp(track, xp)
awardTrackXp(...)
getBuilderTrackLevel(...)
getNextTrackUnlocks(...)
grantMilestoneRequisitionIfNeeded(...)
```

Milestone grants must be idempotent so retries cannot duplicate scarce Requisitions.

## D. Bolt Ledger

```text
BoltTransaction
```

Sources:
- approved ship
- Signal
- missions
- verified referral
- corrections

Spends:
- reward orders
- custom orders
- reversals/refunds

One global balance.

## E. Field-Aware Shop Pricing Engine

A price quote needs:

```text
base_bolt_price
primary_track
related_tracks[]
access_class
cross_track_markup_percent
minimum_track_level
user_relevant_track_level
permanent_discount_percent
normal_discount_cap_bolts
requisition?
final_bolt_price
```

Pricing order:

```text
base
→ track affinity / cross-track markup
→ permanent level %
→ normal savings cap
→ optional one Requisition
→ final quote
```

The quote should be persisted with the order for auditability.

## F. Requisition System

```text
RequisitionDefinition
RequisitionGrant
RequisitionReservation
RequisitionRedemption
```

Field progression grants:

```text
LV.3   Req I
LV.6   Req I
LV.9   Req II
LV.12  Req II
LV.15  Master
```

Rules:
- permanent inventory until spent;
- one-use;
- one per order;
- non-transferable;
- minimum item value;
- cannot bypass Mastery gates;
- mandatory confirmation before redemption;
- General Requisitions supported separately.

## G. Reward Requirements

A reward can require/configure:

```text
base_bolt_price
primary_track
related_tracks[]
access_class
minimum_track_level
cross_track_markup_percent
normal_discount_cap_bolts
requisition_eligible
allowed_requisition_tiers[]
country
stock
season
sponsor
```

## H. Custom Orders

```text
CustomOrder
CustomOrderQuote
CustomOrderStatus
```

Flow:

```text
ELIGIBILITY
↓
REQUEST
↓
FULFILLABILITY / QUOTE
↓
APPROVAL
↓
OPTIONAL REQUISITION
↓
BOLT + REQUISITION RESERVATION
↓
PURCHASE
↓
SHIP
↓
DELIVER
```

## I. Journal Time Assignment

```text
TrackedSession
Journal
JournalTimeAssignment
```

Rules:
- each tracked minute assigned at most once;
- ships claim journaled minutes;
- future versions can only claim new minutes;
- reviewers can partially approve.

## J. Ship Result

Major product moment:

```text
PROJECT SHIPPED

31.3h approved
14.6× quality

+507 Bolts
+820 total Track XP

Compute 70%  +574 XP
Systems 30%  +246 XP

COMPUTE
LV.8 → LV.9

MILESTONE
Compute Requisition II earned
```

## K. Digital Loadout

Every accepted ship adds a persistent artifact entry tied to the final technical classification.

## L. Customizable Builder Character

```text
AvatarConfig
```

Composable pixel/SVG parts. Identity only; no open-world dependency.

---

# 24. What We Should Reuse From Pixl vs Rebuild

## Reuse aggressively

```text
Hack Club auth
session handling
ban/revocation middleware
rate limits/security headers
Hackatime OAuth/API
Lapse-related evidence concepts
project CRUD
collaborators
uploads
repo/demo URL safety
URL liveness checks
double-dip/YSWS archive logic
admin/reviewer operational patterns
review UI components
shop admin/fulfillment patterns
notifications
reports/moderation
Supabase/Postgres connection patterns
```

## Rebuild around LOADOUT

```text
participant UI
visual design system
Builder Profile
four-track system
multi-track XP allocation
LV.1–15 progression
global Bolts ledger
field-aware pricing engine
cross-track markup
permanent field discounts
per-item savings caps
Requisition grants/reservations/redemption
Open / Specialist / Mastery reward access
Custom Orders
journal-time assignment
Digital Loadout
ship result/progression UX
missions/seasons presentation
community/leaderboards
avatar builder
```

## Delete

```text
Godot/open world
NPCs
villages
story/lore
map sync
game websocket server
lobbies
movement/presence
proximity voice
Pixo DM
most Pixorpheus AI/personality features
```

---

# 25. Migration Order

## Phase 0 — Safe Fork

1. Fork `hackclub/pixl`.
2. Preserve the MIT license.
3. Create branch:
   ```text
   loadout/rebase
   ```
4. Tag original upstream state:
   ```text
   pixl-upstream-baseline
   ```
5. Verify current Pixl builds/tests before changing anything.

Do not remove code until the baseline is reproducible.

---

## Phase 1 — Remove the Game Surface

Delete from active workspace:
- `apps/game`
- `packages/map-sync`
- `apps/pixo-dm`

Remove:
- `map:sync`
- `npcs:bake`
- game-specific scripts

Server:
- remove WebSocket game bootstrap
- remove `npcs`, `story`, `village`
- remove LittleGuy
- remove game-only route mounting

Run:
- install
- typecheck
- tests
- build

Commit:

```text
chore: remove pixl open-world runtime
```

---

## Phase 2 — Rename Infrastructure

Rename:

```text
@pixl/* → @loadout/*
Pixl → LOADOUT where it is product identity
pixels → Bolts only in economy semantics
```

Do **not** blindly replace every "pixel" string; pixel art/design language remains valid.

Rename apps:
- dashboard → admin
- web-shell → docs

Update:
- env examples
- callback URLs
- service names
- health response
- generated config

Commit:

```text
chore: rebrand shared infrastructure for loadout
```

---

## Phase 3 — Establish LOADOUT Theme

Implement canonical design tokens:
- beige/paper
- grid
- charcoal
- lime
- track colors
- border/radius rules

Create common primitives:
- Sidebar
- TopBar
- Panel
- BlackPanel
- PixelHeading
- Stat
- ProgressBar
- TrackBadge
- BoltAmount
- BuilderAvatar
- LockedState

Commit:

```text
feat: add loadout design system
```

---

## Phase 4 — Fresh Participant App

Create `apps/web`.

Build only with mock/fake data first:
1. Dashboard
2. Builder Profile
3. Tracks
4. Projects
5. Shop
6. Custom Order
7. Ship Result

Do not wire every backend endpoint before the interaction model feels right.

Commit:

```text
feat: add loadout participant shell
```

---

## Phase 5 — Database Baseline

Create a fresh LOADOUT schema from only the domains we need.

Migrate/adapt:
- user/auth;
- projects;
- Hackatime;
- journals;
- ships;
- reviews;
- moderation;
- shop/orders.

Add:
- four track progressions;
- track level config;
- multi-track ship allocations;
- global Bolt ledger;
- Digital Loadout;
- field-aware reward configuration;
- Requisition domain;
- Custom Orders.

Do not deploy game tables.

Commit:

```text
feat: create loadout database baseline
```

---

## Phase 6 — Projects + Journals

Wire:
- create project;
- Capability Statement;
- proposed track split;
- Research Mode;
- Hackatime/Lapse;
- journal entry;
- time assignment;
- project page;
- ship version.

Critical invariant tests:
- minute cannot be assigned twice;
- old ship minutes cannot be paid twice;
- team members cannot claim each other's time.

---

## Phase 7 — Review + Multi-Track Progression

Adapt Pixl reviewer tooling.

Review output:
- LOADOUT Fit;
- eligible technical scope;
- approved minutes;
- Originality;
- Technical Depth;
- Execution;
- Documentation;
- quality multiplier;
- global Bolt award;
- total Track XP;
- final per-track allocation;
- per-track XP transactions.

Add milestone grant test:
- crossing LV.3/6/9/12/15 grants the correct Requisition exactly once.

---

## Phase 8 — Field-Aware Shop + Requisitions

Adapt Pixl shop/admin/fulfillment.

Add:
- global Bolt costs;
- primary / related track affinity;
- Open / Specialist / Mastery access;
- cross-track markup;
- track level pricing;
- permanent discount curve;
- per-item normal savings cap;
- Requisition inventory;
- minimum eligible item values;
- one-Requisition-per-order validation;
- quote preview;
- mandatory redemption confirmation modal;
- reservation / restore semantics.

This phase is now **core MVP**, not a later polish feature.

---

## Phase 9 — Custom Orders

Build after normal shop + pricing + Requisition engine are stable.

Custom Orders require:
- eligible track level/tier;
- enough Bolts;
- program fit;
- fulfillability approval.

Use Bolt and Requisition reservations during approval/checkout so a user cannot double-spend either scarce resource.

---

## Phase 10 — Seasons / Missions / Community

Add after the core economy works.

- missions
- seasons
- leaderboard
- referrals
- Signal
- achievements
- shop suggestions
- Slack bot support

---

# 26. Things NOT to Build in V0

Do not recreate Pixl's complexity.

Skip initially:
- open world
- real-time chat/DMs
- friend graph
- NPCs
- AI mascot/personality
- elaborate lore
- 20 avatar systems
- sponsor challenge automation
- automated Signal scoring
- complex referrals
- IRL event system
- dozens of mission types

V0 should prove:

```text
PROJECT
→ EVIDENCE
→ SHIP
→ REVIEW
→ XP + BOLTS
→ LEVEL
→ UNLOCK
→ REWARD
```

If that loop is satisfying, LOADOUT works.

---

# 27. Critical Technical Risks

## Risk 1 — Hidden Pixl coupling

Pixl code may reference:
- game URLs
- `#pixl`
- Pixorpheus
- pixels
- regions
- NPCs
- game DB tables

Before deleting any domain:

```text
search imports
search table names
search env vars
search route paths
run typecheck
run tests
run build
```

---

## Risk 2 — Copying Pixl's economy accidentally

LOADOUT is not "Pixl but Bolts".

Do not preserve old earning equations blindly.

LOADOUT needs:
- quality multiplier
- four-track XP with reviewer allocations
- LV.1–15 progression
- one global Bolt balance
- field-aware prices
- expensive-item discount caps
- rare Requisitions
- Mastery gates
- builder-first rewards
- Custom Orders

Additional economy risks:
- one track becoming the obvious min-max choice;
- GPU/laptop discounts creating outsized liability;
- permanent global discounts compounding leaderboard advantage;
- Requisitions being too common or too weak;
- cross-track prices becoming punitive.

---

## Risk 3 — Old migrations become permanent baggage

Do not launch a fresh LOADOUT DB with every old game migration merely because the codebase started there.

Create a clean production baseline.

---

## Risk 4 — Admin actions monolith

Pixl's admin `actions.ts` is already extremely large.

Split it before LOADOUT adds more review/economy logic.

---

## Risk 5 — Visual clone

The engineering fork is fine.

The product should visually read as LOADOUT:
- warm graph paper
- fixed sidebar
- black utility panels
- lime progress/actions
- customizable builder character
- track/level progression
- fewer decorative SVGs
- no Pixl open-world visual language

---

# 28. First Concrete Build Slice

The first fully working vertical slice should prove the **new v4 loop**, not merely XP + Bolts.

```text
Hack Club Login
      ↓
Builder Profile
      ↓
Create Project
      ↓
Capability Statement
      ↓
Propose:
Compute 70% / Systems 30%
      ↓
Connect Hackatime
      ↓
Write Journal
      ↓
Ship Project
      ↓
Admin LOADOUT Fit + Validity Review
      ↓
Approve 5h
      ↓
Reviewer confirms / changes track allocation
      ↓
Award:
+Global Bolts
+Total Track XP split by track
      ↓
Track level changes
      ↓
If milestone crossed:
grant Requisition exactly once
      ↓
Open Shop
      ↓
Quote one item using:
track affinity
+ permanent discount
+ savings cap
      ↓
Preview optional Requisition
      ↓
Confirmation Modal
      ↓
Place Order
```

Do this before:
- referrals;
- Signal automation;
- complex community;
- elaborate seasons;
- fancy Slack bot;
- large Custom Order workflows.

This proves LOADOUT's unique mechanic end-to-end.

---

# 29. Final Repo Verdict

## KEEP

- monorepo/Bun/Turbo foundation
- MIT license
- server foundation
- Hack Club auth
- Hackatime
- project/collaborator infrastructure
- URL/upload safety
- YSWS double-dip logic
- moderation/admin foundations
- reviewer tooling
- shop/fulfillment foundations
- config-package concept
- theme-package concept
- docs infrastructure where useful

## MODIFY

- landing
- server routes
- admin dashboard
- database schema
- docs
- config
- theme
- shop
- project flow
- reviews
- profiles
- referrals
- sidequests → missions
- explore → project discovery
- Macondo → optional integration
- Pixorpheus → small optional Slack bot

## DELETE / ARCHIVE

- Godot game
- open-world systems
- NPCs
- village/story systems
- map sync
- game WebSockets/lobbies
- LittleGuy
- Pixo DM
- most AI personality/memory/roast bot features
- game-specific database tables/migrations in the new production baseline

## ADD

- participant web app
- Builder Profile
- four Track XP systems with reviewer allocation
- Builder Levels
- Bolt ledger
- LV.1–15 progression
- field-aware shop pricing
- cross-track markup
- permanent track discounts
- per-item savings caps
- Requisition inventory/redemption
- Open / Specialist / Mastery reward access
- Custom Orders
- journal time assignment
- versioned ship claims
- LOADOUT-specific review formula
- customizable builder character
- LOADOUT design system

---

# 30. Definition of "Forking Pixl Successfully"

We are done with the migration when someone unfamiliar with the repository can look at it and say:

> “This is clearly LOADOUT, and Pixl was used as proven infrastructure.”

—not—

> “This is Pixl with a different theme.”

The reused code should save implementation time.

The visible product, data model, progression loop, economy, and identity should belong to LOADOUT.

The fork is **not** complete until:
- old five-track assumptions are gone;
- Research is a mode rather than a progression ledger;
- reviews support final percentage track allocation;
- Track XP caps at LV.15;
- Bolts are global;
- reward quotes are field-aware and auditable;
- expensive-item savings caps work;
- Requisitions can be granted, reserved, confirmed, redeemed, and restored safely;
- scarce Mastery items use real level gates;
- no Pixl game/lore dependency is required for normal operation.

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
