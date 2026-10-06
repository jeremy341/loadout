# LOADOUT — UI & Design System

**Homepage refinement, 2026-10-05:** [Plan 12](12_LOADOUT_HOMEPAGE_CLARITY_FLOW_AND_ERAS.md) is approved and implemented locally. It covers the vertical process, lifetime progression, Community Eras, Requisition and Custom Order explanations, final 32×32 pixel sprite icons, footer, spacing, and horizontal clouds. Plans 01/02/11 remain the product-policy owners. Tests, CI/pipeline changes, live mechanics, and publication are separate scopes.

## 0. Direction

The current visual direction is:

# **Industrial Field Manual + Pixel Utility**

LOADOUT should feel like a **technical builder workstation** with an industrial/engineering graphic language.

It should **not** look like:
- Pixl with only its accent changed
- a factory simulator
- a videogame HUD
- AI-generated "industrial UI"
- literal rusty sheet metal everywhere
- cyberpunk
- steampunk
- an esports dashboard

The design must be straightforward to reproduce in normal HTML/CSS/React.

> **Industrial through graphic design, not through fake machinery.**

> **Visual update (2026-10-04):** The current public-site palette and tokens in the workspace-root LOADOUT_DESIGN_SYSTEM.md supersede older accent values in this document. Use the clean off-white grid, black/graphite structure, and Bolt Yellow system. The newest user screenshots control homepage composition; this plan remains the source for product UI behavior.

## 1. What stays from the existing mockups

Keep:
- the existing page layouts and information hierarchy
- persistent left sidebar
- compact top utility bar
- large pixel/block headings
- pixel builder avatars
- rectangular cards and dense dashboards
- project images / real reward images
- graph-paper / technical-paper background
- mostly square corners
- clear XP / Bolt / level data
- strong black/graphite feature panels

Do not redesign every page from scratch. The industrial identity should be applied as a **system of tokens and components**.

## 2. Industrial visual language

Use cues from:
- machine manuals
- engineering drawings
- workshop inventory labels
- equipment spec plates
- German industrial / precision-tool graphic design
- steel / graphite / aluminum color language
- control panels
- technical catalogues

Do **not** use:
- photorealistic metal textures
- rust
- scratches/grunge as a major visual layer
- rivets on every component
- giant hazard stripes
- fake 3D bevels
- glass / neon
- glowing sci-fi controls
- random gears/circuit patterns
- fake screws on every card
- decorative pipes/cables
- excessive yellow

Small industrial details are allowed, but they should be optional CSS/SVG accents.

## 3. Palette

```text
CANVAS          #F1EFEA
SURFACE         #F7F5F0
SURFACE ALT     #E5E3DE

GRID            #D8D6D1
STEEL           #A5A5A5
STEEL DARK      #606161

GRAPHITE        #202225
GRAPHITE ALT    #2B2D30
INK             #17181A

BOLT YELLOW     #FBC834
YELLOW DARK     #D8AC29
YELLOW SOFT     #FBCF50

SUCCESS         #5D9E63
DANGER          #C94A42
```

### Accent rule

**Bolt Yellow** is the primary LOADOUT brand accent. Black is structure; off-white is the canvas.

Use Bolt Yellow for:
- selected navigation
- primary buttons
- selected filters
- important progression moments
- industrial label tabs
- primary XP/progression where appropriate

Use yellow selectively; keep most page area off-white with graphite structure.

Track identity comes from each track's name, icon, and examples, not separate rainbow colors. Use graphite panels with yellow and neutral accents.

Research Mode uses a small neutral/yellow marker; it is not a fifth main track.

## 4. Surface rules

### Standard surface
```css
background: #F7F5F0;
border: 1.5px solid #17181A;
border-radius: 0-2px;
box-shadow: none;
```

### High-emphasis panel
```css
background: #202225;
color: #F7F5F0;
border: 1.5px solid #17181A;
```

### Industrial header strip
Use a flat graphite or steel header bar with a small Bolt Yellow index/tab.

Example:

```text
[03]  COMPUTE / PROGRESSION
```

Not every card needs a header strip.

## 5. Borders and "hardware" details

Industrial detail should stay restrained.

Allowed:
- 1–2px steel/graphite borders
- small square index tags
- occasional `///` yellow mark
- thin ruled lines
- small spec labels
- tiny corner square or dot
- at most one small bolt/screw motif on a **major** panel if we really want it

Avoid literal bolts/rivets on every card. That is hard to maintain and immediately looks generated.

## 6. Typography

### Display
Use the existing pixel/block display family for:
- LOADOUT wordmark
- page titles
- major levels
- large Bolt values
- section numbers

### UI / metadata
Use a compact mono for:
- technical labels
- item class
- field
- requirement
- XP
- timestamps
- IDs
- specs

### Body
Use a normal readable sans/mono hybrid for:
- descriptions
- journal text
- help text
- long forms

Do not put every sentence in the pixel font.

## 7. Technical label system

This is one of the easiest ways to make the product feel industrial without complicated art.

Examples:

```text
LD/COM/08
FIELD / COMPUTE
CLASS / SPECIALIST
REQ / LV.08
```

Reward:

```text
ITEM  / GPU-0042
FIELD / COMPUTE
CLASS / MASTERY
```

Project:

```text
ARTIFACT / RUNTIME
TRACK    / SYSTEMS + COMPUTE
STATUS   / SHIPPED
```

Use these sparingly on detail pages and shop cards.

## 8. Component system

Build the UI from a small set of reusable parts:

1. Sidebar
2. Top utility bar
3. Page header
4. Surface card
5. Dark technical card
6. Section header/index
7. Primary/secondary button
8. Track badge
9. Status badge
10. Progress bar
11. Stat block
12. Project card
13. Reward card
14. Requisition badge/card
15. Form field
16. Table/list row
17. Confirmation modal
18. Pixel avatar
19. Empty state
20. Spec label

Aim for **90% normal CSS + 10% simple decorative SVG/pixel assets**.

## 9. Page shell

Desktop-first canonical canvas:
```text
1920 × 1080
```

Keep:
- fixed/persistent left sidebar
- optional thin top bar
- wide main work area
- square component geometry
- dense but readable spacing

Responsive behavior comes after the desktop system is stable.

## 10. Dashboard

Preserve the existing dashboard structure:
- greeting / page header
- builder profile + overall level
- global Bolts
- recent activity
- next missions
- featured reward
- unlock progression
- one restrained pixel illustration

Industrial treatment:
- profile/progression block becomes graphite
- selected nav is Bolt Yellow
- XP bar uses Bolt Yellow with a track label
- cards use steel borders
- small section numbers / technical labels
- keep the page mostly light; do not turn everything dark

## 11. Builder Profile

Preserve:
- avatar/profile column
- overall level
- Bolts
- track progression
- achievements
- perks
- shipped projects

Canonical tracks shown:
- Tools
- Systems
- Compute
- Hardware

Research is shown as a **mode/tag on projects**, not a fifth track card.

Track cards should look like small instrument panels, but remain flat CSS boxes.

Add:
- permanent track discount
- next Requisition milestone
- next specialist/mastery unlock
- Digital Loadout artifacts

## 12. Create Project

Preserve the current multi-step form layout and preview panel.

Update the form to current LOADOUT rules:
- Capability Statement is mandatory
- primary track
- optional secondary tracks
- optional Research Mode
- repository/demo
- screenshots/media
- journals/evidence
- review + submit

Industrial styling:
- numbered form modules
- graphite module headers
- Bolt Yellow active step
- steel-gray inactive steps
- normal flat inputs
- preview stays dark/high-emphasis

Do not style every input like a metal machine part.

## 13. Projects / Explore

Preserve:
- search
- filters
- grid/list toggle
- project card grid
- real project imagery
- builder attribution
- usage/community stats

Replace obsolete broad categories with:
- Tools
- Systems
- Compute
- Hardware
- Research Mode
- Open Source
- Beginner Friendly
- Signal
- Newest

Cards stay simple. Industrial identity mainly comes from:
- borders
- label chips
- Bolt Yellow selection
- technical metadata

## 14. Project Detail

Preserve:
- hero/project image
- project title and summary
- repo/demo actions
- builder card
- XP/Bolts result
- journal timeline
- milestones
- project info rail

Add:
- Capability Statement
- track XP allocation
- Digital Loadout artifact type
- Research Mode marker when applicable
- Signal
- ship/version history

Use dark graphite for reward/result modules and light surfaces for content.

## 15. Shop

The shop must visually explain the economy.

Keep:
- featured reward
- search
- filters
- product grid
- real product photos
- Bolt prices

Every reward card can expose:

```text
FIELD
ACCESS CLASS
BASE PRICE
YOUR PRICE
TRACK DISCOUNT
NORMAL SAVINGS CAP
LEVEL REQUIREMENT
REQUISITION ELIGIBLE
```

Do not show all fields simultaneously on compact cards; use progressive disclosure.

Color rules:
- Bolts = gold
- current field advantage = Bolt Yellow with a track label
- locked Mastery = graphite/steel
- savings = restrained green

## 16. Requisition UI

Requisitions should feel rare and valuable without becoming fantasy items.

Use an industrial voucher/spec-card look:
- flat surface
- thick top label or index
- field
- tier
- minimum item value
- max additional discount allowance
- earned-from milestone
- quantity owned

Confirmation modal must show:
- normal price
- price with Requisition
- extra saving
- quantity before/after
- rarity warning for Master
- `KEEP REQUISITION` / `USE & BUY`

## 17. Custom Orders

Preserve:
- progress/eligibility
- Bolt balance
- request form
- examples
- existing order status

Update for:
- relevant track(s)
- field-based Custom Order tier
- final approved quote
- cross-track markup
- Requisition eligibility
- level requirement

Industrial look should be strongest here because this page is essentially a technical procurement form.

## 18. Missions / Seasons / Eras

Preserve:
- weekly missions
- seasonal quests
- optional Era Objectives
- streak
- season progress
- current Era state and community progress when backed by live data
- advancement-ready state and next eligible reset when configured
- rewards
- earnings chart

Use:
- Bolt Yellow progress
- steel inactive states
- gold Bolts
- one season illustration
- small industrial label marks

Avoid giant game-like quest art. Keep Seasons (competitive period), Eras (community technical progression), and weekly resets (mission refresh/possible advancement check) visually and semantically distinct. Never render sample progress, counts, or countdowns as live values.

## 19. Community / Leaderboards

Preserve:
- top builders
- track leaderboards
- featured builders
- activity
- trending projects

Change leaderboard categories to the current four tracks.

Reward high-quality review/community contribution through General Requisitions, but do not make the community UI feel like a social network feed.

## 20. Animation

Use only for feedback:
- progress bar fill
- +XP
- +Bolts
- track level-up
- Requisition earned
- mastery unlock
- order confirmation
- subtle 1–2px hover movement

No ambient factory animations.

## 21. Anti-AI-look checklist

Before accepting a screen, ask:

- Could this be reproduced with straightforward CSS?
- Are there fewer than ~3 decorative motifs competing on the page?
- Is industrial identity coming from typography, color, labels and geometry rather than fake textures?
- Are there unnecessary rivets, bolts, scratches or hazard stripes?
- Is every decorative element doing a job?
- Is Bolt Yellow used selectively?
- Does the layout still resemble the functional LOADOUT wireframe?
- Would a developer know what reusable component each block is?
- Does it look like a real product rather than concept art?

If not, simplify it.

## UI implementation skill workflow

Every UI change follows `docs/development/UI_SKILLS.md`: start with a spec-only `frontend-design-ui-ux` pass bound to the locked design system, then implement with `frontend-design` and `design-taste-frontend`. Load `emilkowal-animations` for motion and the SVG/pixel-art specialist skills as listed there. These skills do not authorize changes to product behavior or policy.

## 22. Logo / brand direction

The LOADOUT mark should remain:
- geometric
- pixel-aware
- compact at favicon size
- monochrome-capable
- easy to print/sticker
- not military/esports
- not lightning-bolt cliché
- separate from the Bolt currency icon

The currency icon uses the final yellow lightning sprite from the 2026-10-06 final icon set. Keep that currency symbol distinct from the brand mark. The earlier bolt.svg remains an unused source file.

Potential visual motifs:
- modular slot
- equipment bay
- stacked technical layers
- indexed crate/module
- pixel bracket / connector
