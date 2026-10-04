# LOADOUT — Product & Program Plan

> **Build your own technical stack.**

This document owns the definition of LOADOUT itself: who/what qualifies, how projects are tracked and reviewed, and what the builder experience means. Economy details live in `02_LOADOUT_ECONOMY_AND_REWARDS.md`.


---

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
