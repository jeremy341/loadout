# LOADOUT - Public Homepage Plan

**Owner:** Public-facing `apps/landing` experience  
**Status:** Canonical plan for the first public LOADOUT page  
**Depends on:** `00`, `01`, `02`, `03`, `04`  
**Primary source implementation:** Pixl `apps/landing`, redesigned for LOADOUT

> **Build your own technical stack.**

> **Visual amendment (2026-10-04):** Follow the workspace-root LOADOUT_DESIGN_SYSTEM.md and the latest supplied hero/full-page screenshots for public-site composition. Use the user-selected “BUILD YOUR OWN / TECHNICAL STACK.” headline. The grey/muted palette, confirmed RSVP link, Pixl entrance/cue, and horizontal clouds follow implemented Plan10. Keep the hero centered and open, with technical side labels, corner marks, grid paper, and yellow CTA styling; do not add the older right-side pixel-builder scene. The screenshot's progression and field-pricing sections may inform the section rhythm, but its numeric offers and copy are illustrative only.

## 0. Purpose

The public homepage is the first thing someone sees before they join or log in.

It must answer these questions quickly:

1. What is LOADOUT?
2. What can I build?
3. What happens after I ship?
4. What can I earn?
5. Why is this different from a generic hours-to-prizes YSWS?
6. How do I join?

The homepage is not the logged-in dashboard. It should not expose every internal control, reviewer rule, pricing formula, or admin concept.

The page should communicate the central LOADOUT loop:

```text
BUILD TECHNICAL CAPABILITY
        ↓
TRACK + JOURNAL REAL WORK
        ↓
SHIP
        ↓
EARN TRACK XP + GLOBAL BOLTS
        ↓
GROW YOUR DIGITAL LOADOUT
        ↓
UPGRADE YOUR PHYSICAL LOADOUT
        ↓
BUILD HARDER STUFF
```

The defining message:

> **Your projects become your Digital Loadout. Your rewards upgrade your Physical Loadout. Together, they make you a more capable builder.**

---

# 1. Engineering Base

Use Pixl's existing `apps/landing` as the implementation base.

Keep or adapt where useful:

- Next.js application structure
- routing
- SEO plumbing
- sitemap and robots support
- image handling
- deployment configuration
- reusable motion helpers if they remain lightweight
- responsive primitives
- content/component separation
- any accessibility patterns that are already good

Do not preserve Pixl's public product identity merely because the code already exists.

Replace:

- Pixl branding
- Pixl story/lore
- open-world framing
- Pixl-specific illustrations
- restoration/world language
- Pixl-specific reward explanation
- visual elements that make the page read as Pixl

The result should feel like LOADOUT was designed independently, with Pixl used only as proven engineering infrastructure.

---

# 2. Visual Direction

The homepage follows `03_LOADOUT_UI_DESIGN_SYSTEM.md`.

Public marketing can use the industrial identity slightly more strongly than the logged-in dashboard, but it must remain easy to recreate in normal HTML/CSS/React.

## Core visual language

- off-white technical-paper canvas
- subtle graph-paper grid
- graphite and steel structure
- Bolt Yellow as the primary LOADOUT accent and the Bolt currency color
- pixel/block display typography
- readable mono labels
- restrained pixel builder art
- flat 1-2px borders
- mostly square geometry
- technical numbering such as `01 / BUILD`
- real project and product imagery when available

## Do not use

- photorealistic metal textures
- rust
- fake 3D panels
- excessive rivets or screws
- giant hazard stripes
- random gears
- circuit-board wallpaper
- glowing sci-fi UI
- glassmorphism
- large gradient blobs
- generic AI landing-page cards
- decorative SVG scenery that obscures content (the approved larger, low-contrast edge clouds remain intentional)
- fake military or weapons branding

> **Industrial through graphic design, not through fake machinery.**

---

# 3. Public Navigation

Desktop:

```text
LOADOUT

HOW IT WORKS
TRACKS
LOADOUT
REWARDS
PROJECTS
FAQ

[ LOG IN ] [ JOIN LOADOUT ]
```

Mobile:

- compact LOADOUT wordmark
- menu button
- Join CTA remains obvious
- menu opens the same sections

Navigation should scroll to page sections where appropriate.

Do not copy the participant app's left sidebar onto the marketing homepage.

---

# 4. Homepage Structure

## 4.1 Section 00 - Announcement / utility strip

Optional small strip above the main navigation.

Possible uses:

- applications open
- RSVP open
- season status
- program dates once confirmed
- important eligibility note

Do not invent dates or deadlines. If program data is not configured, hide the strip.

---

## 4.2 Section 01 - Hero

Primary copy:

```text
LOADOUT

BUILD YOUR OWN
TECHNICAL STACK.

Build tools, systems, compute and hardware
that make you or other builders more capable.

Your projects become your Digital Loadout.
Your rewards upgrade your Physical Loadout.

[ JOIN LOADOUT ]   [ EXPLORE PROJECTS ]
```

Supporting technical label:

```text
YSWS / TECHNICAL BUILDER PROGRESSION
```

Visual on the right:

- one restrained pixel builder
- a workbench / technical desk / modular equipment scene
- small references to hardware, compute, tooling, and systems
- flat pixel artwork, not an AI-looking cinematic illustration

The visual should be replaceable with a static PNG/SVG without affecting the layout.

### Hero goal

A new visitor should understand the program concept without needing to understand:

- Requisition formulas
- multiplier math
- review stages
- cross-track markup
- detailed level thresholds

Those belong lower on the page or in docs/FAQ.

---

## 4.3 Section 02 - The Loop

Heading:

```text
01 / HOW IT WORKS
BUILD. SHIP. UPGRADE.
```

Use a simple horizontal or vertical sequence:

```text
BUILD
Create technical capability.

TRACK
Use Hackatime / Lapse and journals.

SHIP
Submit a real working artifact.

LEVEL
Earn Track XP and global Bolts.

UPGRADE
Improve your physical loadout.

REPEAT
Attempt harder technical work.
```

Use six simple flat modules, not elaborate isometric art.

---

## 4.4 Section 03 - What Counts

Heading:

```text
02 / WHAT CAN YOU BUILD?
```

Show the four canonical tracks:

### TOOLS

```text
CLI
SDK
DEBUGGER
PROFILER
DEV TOOLING
AUTOMATION
```

Description:

> Build tools that help people design, debug, automate, understand, test, or ship technical work.

### SYSTEMS

```text
RUNTIME
DATABASE
SERVER
NETWORKING
COMPILER
STORAGE
```

Description:

> Build the low-level software and infrastructure other things depend on.

### COMPUTE

```text
GPU
GRAPHICS
ML SYSTEMS
KERNELS
OPTIMIZATION
SIMULATION
```

Description:

> Make computation faster, smarter, more capable, or more efficient.

### HARDWARE

```text
EMBEDDED
PCB
ROBOTICS
FPGA
SENSORS
TEST GEAR
```

Description:

> Build technical capability in the physical world.

Research appears separately as:

```text
+ RESEARCH MODE
Experiment, benchmark, reproduce, investigate.
```

Research Mode must never appear as a fifth track.

---

# 5. LOADOUT Fit Explanation

This should be short but important.

Heading:

```text
NOT EVERYTHING HAS TO BE A LOADOUT PROJECT.
```

Copy:

> LOADOUT is intentionally technical. A good project can still be outside the program.

Simple examples:

```text
NORMAL GAME
usually not LOADOUT

CUSTOM RENDERER / NETCODE / ENGINE
LOADOUT


API CHATBOT WRAPPER
usually not LOADOUT

CUSTOM INFERENCE RUNTIME / GPU BACKEND
LOADOUT


TODO APP
usually not LOADOUT

LOCAL-FIRST SYNC ENGINE / DATABASE
LOADOUT
```

CTA:

```text
[ READ THE PROJECT RULES ]
```

---

# 6. Digital Loadout

Heading:

```text
03 / DIGITAL LOADOUT
THE THINGS YOU BUILD STAY WITH YOU.
```

Show a compact example builder profile:

```text
JEREMY341 / DIGITAL LOADOUT

TOOLS       LV.07
SYSTEMS     LV.04
COMPUTE     LV.09
HARDWARE    LV.03

ARTIFACTS
✓ Vulkan benchmark harness
✓ GPU runtime
✓ Deployment CLI
✓ FPGA inference testbench
```

Explain:

- every accepted ship becomes a permanent Digital Loadout artifact
- track levels persist across seasons
- multi-track work can grow several fields
- reviewers decide the final XP allocation

Do not turn this into a full dashboard mockup. It is a marketing preview.

---

# 7. Bolts + Progression

Heading:

```text
04 / PROGRESSION
BOLTS ARE GLOBAL.
TRACKS SHAPE ACCESS AND PRICE.
```

Show two concepts side-by-side:

```text
TRACK XP
persistent
cannot be spent
proves depth
unlocks specialist advantages

BOLTS
global spendable currency
earned from approved work
used for equipment and rewards
```

Supporting line:

> **Breadth gives flexibility. Depth gives leverage. Mastery gives access.**

Explain at a high level:

- track levels can improve field pricing
- most equipment remains cross-track purchasable
- Mastery gear may require real specialization
- expensive discounts are bounded
- rare Requisitions reward major specialization milestones

Do not show full pricing formulas on the homepage.

---

# 8. Physical Loadout / Reward Shop

Heading:

```text
05 / PHYSICAL LOADOUT
UPGRADE WHAT YOU BUILD WITH.
```

Use real product-style imagery or clean pixel placeholders.

Example reward categories:

```text
DEVELOPER TOOLS
COMPUTE
SERVERS + STORAGE
EMBEDDED
FPGA
TEST EQUIPMENT
FABRICATION
WORKSTATION UPGRADES
```

Example aspirational items may include:

- dev boards
- logic analyzer
- Raspberry Pi
- SSD / RAM
- mini PC / server
- FPGA board
- GPU / compute grant
- 3D printer
- laptop / workstation upgrade where program-defined

The homepage must not promise a specific item, stock state, price, or country availability unless that data comes from the actual reward configuration.

CTA:

```text
[ EXPLORE REWARDS ]
```

---

# 9. Requisitions

Heading:

```text
06 / SPECIALIZATION
SAVE YOUR REQUISITIONS FOR THE GEAR THAT MATTERS.
```

Show the canonical lifetime milestones:

```text
LV.03   REQUISITION I
LV.06   REQUISITION I
LV.09   REQUISITION II
LV.12   REQUISITION II
LV.15   MASTER REQUISITION
```

Explain only the concept:

> Requisitions are rare one-use progression rewards that let specialists push beyond normal discount limits on an eligible purchase.

Rules worth showing:

- one-use
- do not expire
- maximum one per order
- cannot bypass Mastery level requirements

Do not overload the section with every numerical cap.

---

# 10. Custom Orders

Heading:

```text
07 / CUSTOM ORDERS
CAN'T FIND WHAT YOUR NEXT BUILD NEEDS?
```

Copy:

> Long-term builders can request specialized technical equipment outside the normal shop, subject to track progression, Bolts, program fit, budget, region, safety, and fulfillment.

Example categories:

- FPGA / accelerator boards
- specialized test equipment
- server / networking hardware
- workstation upgrades
- compute
- fabrication tools
- developer hardware

CTA:

```text
[ HOW CUSTOM ORDERS WORK ]
```

---

# 11. Project Proof / Community

Heading:

```text
08 / BUILT BY BUILDERS
```

Eventually populate from real LOADOUT projects.

Each card should expose:

- project name
- builder
- one-sentence Capability Statement
- track badges
- optional Research Mode marker
- real project image / screenshot
- Signal or usage indicator if meaningful
- link to project

Do not fill the launch page with fake testimonials.

Before real projects exist, use a clearly labeled `EXAMPLE PROJECT` state or hide the section.

---

# 12. FAQ

Keep this concise on the homepage.

Recommended questions:

1. What is LOADOUT?
2. What projects count?
3. Can one project use multiple tracks?
4. What is Research Mode?
5. What are Bolts?
6. What are Requisitions?
7. How do Custom Orders work?
8. How is work tracked?
9. Can teams participate?
10. How much AI use is allowed?
11. Who is eligible?
12. How do I join?

Long policy answers should link to proper docs/rules.

---

# 13. Final CTA

```text
YOUR NEXT PROJECT
SHOULD UPGRADE YOUR NEXT ONE.

Build projects.
Level up your profile.
Upgrade your loadout.
Build harder stuff.

[ JOIN LOADOUT ]
```

If the Join URL is not configured, use a neutral disabled or `COMING SOON` state. Never invent an RSVP link.

---

# 14. Footer

Include:

- Rules
- FAQ
- GitHub
- Slack / community link when configured
- Privacy
- Terms / eligibility where needed
- contact
- source attribution

Source attribution should be honest:

- LOADOUT is its own YSWS
- Pixl was used as an engineering starting point where applicable
- licenses/notices are preserved as required

---

# 15. Configuration

Do not hard-code program facts that may change.

The landing page should read program metadata from a small LOADOUT-owned configuration layer.

Suggested fields:

```ts
type PublicLoadoutConfig = {
  programName: string
  tagline: string
  joinUrl?: string
  loginUrl?: string
  githubUrl?: string
  slackUrl?: string
  rulesUrl?: string
  faqUrl?: string
  startDate?: string
  endDate?: string
  announcement?: string
  applicationsOpen?: boolean
}
```

The exact implementation can adapt an existing configuration pattern if the source audit finds one worth keeping.

Do not import the other YSWS template's config system blindly. Audit it first.

---

# 16. Components

Suggested page-specific component set:

```text
PublicHeader
AnnouncementStrip
Hero
HeroPixelScene
SectionIndex
ProcessStep
TrackCard
ResearchModeCallout
LoadoutFitExamples
DigitalLoadoutPreview
ProgressionExplainer
RewardCard
RewardGrid
RequisitionMilestones
CustomOrderCallout
ProjectCard
FAQAccordion
FinalCTA
PublicFooter
```

Reuse global design primitives from `03`.

---

# 17. Responsive Behavior

Desktop is the main design reference.

At tablet/mobile:

- hero becomes single-column
- pixel scene moves below copy
- track grid becomes 2-column then 1-column
- process flow becomes vertical
- reward grid reduces columns
- technical labels remain readable
- CTA buttons remain large enough to tap
- no horizontal overflow from large pixel headings
- decorative art may be hidden before functional content

---

# 18. Accessibility

Minimum requirements:

- semantic headings
- keyboard-accessible navigation
- visible focus states
- sufficient color contrast
- reduced-motion support
- alt text for meaningful project/product images
- decorative pixel art marked decorative
- no meaning communicated only through track color
- buttons and links remain identifiable without animation

---

# 19. Performance

The public homepage should remain lightweight.

Avoid:

- large autoplay video backgrounds
- giant WebGL scenes
- unnecessary animation libraries
- dozens of decorative SVGs
- unoptimized product images
- client-side fetching for static marketing copy

Prefer server/static rendering where reasonable.

---

# 20. Implementation Order

```text
1. Audit Pixl landing implementation
2. Audit YSWS template public frontend for useful ideas
3. Establish LOADOUT design tokens
4. Build PublicHeader + Hero
5. Build How It Works
6. Build four Tracks + Research Mode
7. Build Digital / Physical Loadout explanation
8. Build progression + Requisition summary
9. Build rewards + Custom Orders
10. Build FAQ + footer
11. Responsive pass
12. Accessibility pass
13. Performance pass
14. Screenshot comparison against the design plan
```

Do not wire every backend feature before the homepage reads correctly.

---

# 21. Acceptance Criteria

The public homepage is ready for the first release when:

- a new visitor can explain LOADOUT after scanning the hero and first two sections
- only four tracks are presented
- Research is clearly a mode
- the Digital Loadout / Physical Loadout loop is visible
- global Bolts are explained correctly
- Requisitions are presented as scarce specialization rewards
- Custom Orders are presented without promising unavailable fulfillment
- no fake dates, prices, inventory, sponsors, testimonials, or RSVP URLs appear
- Pixl engineering may remain underneath, but the public page does not visually read as Pixl
- the industrial identity comes from color, typography, geometry, labels, and restrained pixel art
- the page can be implemented with ordinary web components and CSS
- the page works at desktop and mobile widths
- accessibility and reduced-motion basics pass
- build/lint/typecheck/tests for the landing app pass
