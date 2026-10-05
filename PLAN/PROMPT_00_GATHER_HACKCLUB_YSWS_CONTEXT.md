# PROMPT 00 — Gather Hack Club / YSWS Ecosystem Context

You are preparing to work on **LOADOUT**, an independent Hack Club YSWS project.

This is a **research/context-gathering stage only**.

Do **not** create the LOADOUT repository yet.
Do **not** copy Pixl into a new repo yet.
Do **not** redesign or implement the homepage yet.
Do **not** start migrating features.
Do **not** edit the canonical LOADOUT product plans unless explicitly asked.

Your job in this stage is to understand the broader Hack Club / YSWS ecosystem well enough that the later implementation agent does not treat LOADOUT like a generic rewards app.

At the end, produce a durable context brief that the next bootstrap prompt can read.

---

# 1. Read the existing LOADOUT plans first

Read these completely:

```text
00_LOADOUT_CANONICAL_INDEX.md
01_LOADOUT_PRODUCT_AND_PROGRAM.md
02_LOADOUT_ECONOMY_AND_REWARDS.md
03_LOADOUT_UI_DESIGN_SYSTEM.md
04_LOADOUT_PIXL_MIGRATION_PLAN.md
05_LOADOUT_LAUNCH_AND_OPERATIONS.md
06_LOADOUT_PUBLIC_HOMEPAGE.md
07_LOADOUT_SOURCE_AUDIT_AND_REPO_WORKFLOW.md
```

Use them to understand what LOADOUT is trying to become.

Important:

- These files are the source of truth for LOADOUT.
- The research you gather in this prompt is **context**, not permission to overwrite LOADOUT's product decisions.
- If external YSWS examples conflict with LOADOUT, document the difference instead of silently changing LOADOUT.

---

# 2. Research the official Hack Club / YSWS context

Use current public sources and, if available to you, explicitly provided/connected Hack Club sources.

Prioritize authoritative or first-party sources.

Start with at least:

```text
https://ysws.hackclub.com/
https://readme.hackclub.com/ysws
https://github.com/hackclub/YSWS-Catalog
https://hackclub.com/
```

Also inspect relevant public Hack Club repositories, docs, program websites, and source code where useful.

If a source is private (for example a Slack Canvas/channel) and you do not have access, say so. Do not invent its contents.

Record URLs and access dates in the final research brief.

---

# 3. Understand what a YSWS is

Document, with source support:

- what "You Ship, We Ship" means
- why Hack Club runs YSWS programs
- who the programs are intended for
- the general philosophy of rewarding actual building
- the role of shipped projects
- the distinction between learning/research time and building time where official sources discuss it
- how YSWS programs vary from one another
- how program-specific rules coexist with universal rules
- what participants generally expect from a YSWS website and workflow

Do not reduce YSWS to "hours in, prizes out."

Identify the cultural/product qualities that make YSWS feel like Hack Club rather than a generic bounty platform.

---

# 4. Universal rules and common constraints

Research and clearly separate:

## A. Universal or broadly official rules

Examples to verify rather than assume:

- age/student/teen eligibility
- project originality expectations
- no hour inflation
- no double-dipping time across YSWS programs
- pre-program time restrictions
- proof/tracking requirements
- resubmission/rejection expectations
- public project/repository expectations where applicable

## B. Program-specific rules

Examples:

- theme restrictions
- minimum hours
- specific tech stack
- reward formula
- custom review criteria
- AI rules
- team rules
- deadlines
- physical fulfillment constraints

For every rule, label it as one of:

```text
UNIVERSAL / OFFICIAL
COMMON PATTERN
PROGRAM-SPECIFIC
UNCERTAIN / NEEDS HUMAN CONFIRMATION
```

This distinction is extremely important.

---

# 5. Participant lifecycle

Map the normal YSWS participant journey as it exists today.

Research a realistic sequence such as:

```text
discover program
→ understand theme/rules
→ join Slack / RSVP if applicable
→ authenticate / verify eligibility
→ start project
→ track work
→ journal/devlog if required
→ submit/ship
→ review
→ changes requested or approval
→ reward/shop/order
→ fulfillment
```

Do not assume every YSWS uses every step.

For each stage record:

- what seems universal
- what is common
- what differs by program
- common pain points
- what LOADOUT should be aware of

---

# 6. Organizer lifecycle

Research what is publicly documented about starting/running a YSWS.

Look for:

- idea/differentiation expectations
- `#ysws-drafts` / proposal culture if publicly documented
- Slack channel / community setup
- RSVP patterns
- website requirements
- sponsor/funding process
- review operations
- fulfillment
- fraud prevention
- participant support
- announcements
- closing/season operations

If important organizer guidance only exists in private Slack, mark:

```text
PRIVATE / NOT VERIFIED FROM PUBLIC SOURCES
```

Do not fabricate private Hack Club process.

---

# 7. Tracking systems

Understand the role of:

```text
Hackatime
Lapse
```

and any other current Hack Club work-tracking systems relevant to YSWS.

Research:

- what each tool measures
- software vs non-software use
- how time evidence is normally used
- common limitations
- anti-fraud purpose
- what should not count as valid build time
- integrations available in example YSWS repos

LOADOUT already has its own journal/time-assignment plan. The goal is to understand the ecosystem around it, not replace it.

---

# 8. Review systems

Inspect several YSWS implementations/websites/repos and document common review mechanics:

- queue
- reviewer role/permissions
- approval/rejection
- partial approval
- changes requested
- evidence inspection
- hour approval
- project validity
- quality scoring where used
- appeals
- reviewer notes
- user impersonation/admin troubleshooting if present
- moderation/fraud flags

Prefer real source code/working programs over guessing from marketing pages.

---

# 9. Rewards, shops and fulfillment

Research how YSWS programs currently handle rewards.

Compare models such as:

```text
fixed reward
tiered rewards
hours → shop currency
quality multiplier
grants
physical shop
digital rewards
custom fulfillment
HCB/card-based fulfillment
regional pricing
custom order-like requests
```

Document:

- common fulfillment mechanisms
- international/regional concerns
- taxes/shipping concerns if publicly documented
- stock/availability problems
- HCB integration where relevant
- why a configurable shop may be useful
- examples of high-value rewards without assuming LOADOUT will copy them

LOADOUT's own Bolts/Requisition economy remains defined in its canonical plans.

---

# 10. Authentication, permissions and account systems

Across current YSWS codebases, inspect patterns for:

- Hack Club authentication
- participant role
- reviewer role
- admin role
- fine-grained permissions
- account/profile settings
- impersonation
- bans/moderation
- session/security patterns
- sensitive participant data

Do not copy authentication/security code during this research stage.

The goal is a feature map and architectural understanding.

---

# 11. Infrastructure and reusable patterns

Inspect public YSWS implementations for useful infrastructure patterns:

- frontend framework
- backend framework
- database
- encryption/sensitive-data handling
- CDN/storage
- screenshot uploads
- config files
- integrations
- Slack bots
- email/notifications
- Vercel deployment
- background jobs
- shop configuration
- regional pricing
- review/admin dashboards
- observability
- tests/CI

At minimum inspect:

```text
hackclub/pixl
EDRipper/ysws-template
```

Also select several additional relevant YSWS examples based on what is currently public.

Do not audit every YSWS ever made. Choose examples that teach us something distinct.

---

# 12. Programs to compare

Choose a representative sample rather than only general-purpose programs.

Try to include examples of:

- broad/general builder YSWS
- technically narrow YSWS
- hardware YSWS
- reward-shop/economy YSWS
- grant-based YSWS
- program with strong journaling/tracking
- program with significant fulfillment/review infrastructure

LOADOUT plans already mention or compare programs such as Pixl, Stardance, Forge and others.

Verify current public information before relying on any comparison.

For each comparison program capture only what matters:

```text
PROGRAM
core idea
what participants ship
what they receive
tracking
review
economy/reward model
interesting UX
interesting implementation
what LOADOUT should NOT copy
what LOADOUT can learn
```

---

# 13. Hack Club visual/product culture

Study current Hack Club and YSWS public sites for cultural patterns, not for a visual clone.

Look for:

- playful but functional tone
- teen-built feel
- direct language
- unique identity per YSWS
- handcrafted graphics
- non-corporate copy
- Slack/community integration
- public GitHub/source transparency
- distinctive program gimmicks
- how sophisticated programs avoid feeling like generic SaaS

LOADOUT specifically wants its own:

```text
Industrial Field Manual + Pixel Utility
```

identity.

The research should tell us how to remain recognizably Hack Club without becoming visually identical to Pixl or a generic YSWS template.

---

# 14. Terminology glossary

Create a short glossary for implementation agents.

At minimum investigate/define where supported:

```text
YSWS
ship
Hackatime
Lapse
double-dipping
review
fulfillment
HCB
Hack Club Slack
RSVP
devlog / journal
Hack Club verification / eligibility
Nest
Signal (LOADOUT-specific; clearly label as such)
Bolts (LOADOUT-specific)
Requisition (LOADOUT-specific)
Digital Loadout (LOADOUT-specific)
```

Keep Hack Club terminology separate from LOADOUT inventions.

---

# 15. What is actually relevant to LOADOUT?

After research, produce a section:

```text
IMPLICATIONS FOR LOADOUT
```

Organize it as:

### Must respect

Official rules/infrastructure/cultural expectations that LOADOUT should account for.

### Strongly recommended

Patterns that appear consistently useful.

### Optional

Patterns LOADOUT may use but does not need.

### Avoid

Patterns that conflict with LOADOUT's differentiation or would create unnecessary complexity.

### Needs Hack Club confirmation

Anything that cannot be verified publicly and should be checked with YSWS/Hack Club organizers before launch.

Do not silently change canonical LOADOUT plans based on these findings.

---

# 16. Distinguish facts from interpretation

Every significant finding in the final brief should be distinguishable as:

```text
OFFICIAL / FIRST-PARTY
SOURCE-CODE OBSERVATION
PROGRAM EXAMPLE
INFERENCE
LOADOUT RECOMMENDATION
UNVERIFIED
```

Do not present inference as Hack Club policy.

---

# 17. Output file

Create:

```text
08_HACKCLUB_YSWS_ECOSYSTEM_CONTEXT.md
```

This is a **research brief**, not a canonical LOADOUT plan.

Put this notice at the top:

> This file provides current Hack Club / YSWS ecosystem context for implementation. It does not override LOADOUT plans 00–07. When this file conflicts with a canonical LOADOUT product decision, 00–07 win unless the human explicitly changes the plan.

Suggested structure:

```text
# 08 Hack Club / YSWS Ecosystem Context

## 0. Scope + research date
## 1. Executive summary
## 2. What YSWS is
## 3. Official/universal rules
## 4. Common but non-universal patterns
## 5. Participant lifecycle
## 6. Organizer lifecycle
## 7. Hackatime / Lapse / tracking
## 8. Review + moderation
## 9. Rewards + fulfillment
## 10. Authentication / permissions
## 11. Infrastructure patterns
## 12. Representative program comparisons
## 13. Hack Club product/culture notes
## 14. Terminology glossary
## 15. Implications for LOADOUT
## 16. Items requiring Hack Club confirmation
## 17. Sources
```

Cite/link the sources inside this file.

Include the date of research because YSWS infrastructure and policies can change.

---

# 18. Optional source appendix

If useful, also create:

```text
docs/research/ysws-source-map.md
```

with a compact table:

```text
Source
Type
Why relevant
Date accessed
Key sections/files
Confidence
```

Do not create excessive research documents if `08` contains everything clearly.

---

# 19. No implementation in this stage

This is a hard scope boundary.

Do not:

- create `jeremy341/loadout`
- copy Pixl source
- initialize LOADOUT Git
- configure branches
- configure CI
- install CodeScene
- build the homepage
- migrate backend features
- delete or edit source repositories
- edit 00–07 based on your own interpretation

The next prompt handles bootstrap and implementation.

---

# 20. Final response

When research is complete, report only:

1. where `08_HACKCLUB_YSWS_ECOSYSTEM_CONTEXT.md` was written
2. the research date
3. the most important 5–10 findings for LOADOUT
4. anything that remains unverified/private
5. whether the next bootstrap prompt now has enough context to proceed

Do not claim private Hack Club process is verified unless you actually accessed an authoritative source.
