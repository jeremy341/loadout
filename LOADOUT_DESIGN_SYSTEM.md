# LOADOUT — Website Design System

**Proposed homepage amendment, 2026-10-05 (planning only):** Plan 12 and .ulpi/design/loadout-homepage-clarity-flow-and-eras.md specify clearer track/progression/Requisition copy, a separate Eras explanation, a Pixl-derived downward process, deliberately stepped Bolt/badge SVGs, larger footer typography, more section spacing, and larger clouds with farther horizontal movement. Preserve the implemented grey/yellow identity and hero. Proposed values and the optional arrow-only patch are explicitly separated from current production behavior in .ulpi/design/DESIGN.md. No UI assets or code changed in this planning phase.

**Status:** Canonical visual system for the LOADOUT public website  
**Reference:** Current long-form LOADOUT landing-page mockup  
**Direction:** Industrial technical manual + pixel utility  
**Primary accent:** Bolt Yellow  
**Theme:** Light industrial / off-white grid / black technical panels

**Hero and currency amendment, 2026-10-04:** The user requested a fullscreen hero matching `codex-clipboard-15beff91-84dd-439c-8541-1ac5add39397.png`, larger pixel clouds that move with scrolling, and a custom yellow lightning SVG for Bolts. The hero uses at least one stable viewport height, with centered framed copy and upper-left/lower-right slash markers. Currency uses the lightning glyph; the compact brand mark is separate.

---

# 1. Core visual idea

LOADOUT should feel like:

> **an industrial engineering manual turned into a builder website**

The design should combine:

- off-white / light gray technical-paper backgrounds
- faint engineering grid lines
- heavy black pixel-style display typography
- clean mono body copy
- strong black outlines
- small industrial markers
- restrained yellow accenting
- flat rectangular cards
- simple custom SVG icons
- no fake game world
- no glossy SaaS gradients
- no photoreal metal texture
- no excessive rivets, screws, rust, or grunge

The interface should look intentionally designed and easy to rebuild with normal HTML/CSS/SVG.

---

# 2. Color system

The current mockup is primarily:

| Token | Hex | Use |
|---|---:|---|
| `canvas` | `#E8E9E6` | Main page background |
| `surface` | `#F0F1ED` | Cards, nav, FAQ rows |
| `surface-muted` | `#DDE0DC` | Secondary panels / subtle fills |
| `grid-line` | `#D8D6D1` | Engineering grid |
| `ink` | `#1D2021` | Main text / outlines |
| `graphite` | `#292C2D` | Dark cards |
| `graphite-2` | `#34383A` | Dark-card hover/secondary |
| `steel` | `#A5A5A5` | Secondary text / dividers |
| `steel-dark` | `#575E60` | Muted copy |
| `bolt-yellow` | `#D9B64C` | Primary accent |
| `bolt-yellow-dark` | `#B3913B` | Pressed/hover border tone |
| `bolt-yellow-soft` | `#E1C56D` | Highlight / lighter yellow |
| `white` | `#FFFFFF` | Text on dark / product backgrounds |
| `danger` | `#A96F6C` | Errors only |
| `success` | `#718C79` | Success states only |

## Primary rule

**Yellow is the brand accent. Black is the structure. Off-white is the canvas.**

Do not introduce large areas of green, blue, purple, or orange into the public site.

Color should approximately follow:

```text
70% canvas / surface
20% black / graphite
8% yellow
2% status colors
```

## CSS tokens

```css
:root {
  --loadout-canvas: #E8E9E6;
  --loadout-surface: #F0F1ED;
  --loadout-surface-muted: #DDE0DC;

  --loadout-ink: #1D2021;
  --loadout-graphite: #292C2D;
  --loadout-graphite-2: #34383A;

  --loadout-steel: #A5A5A5;
  --loadout-steel-dark: #575E60;
  --loadout-grid: #D8D6D1;

  --loadout-yellow: #D9B64C;
  --loadout-yellow-dark: #B3913B;
  --loadout-yellow-soft: #E1C56D;

  --loadout-white: #FFFFFF;
  --loadout-danger: #A96F6C;
  --loadout-success: #718C79;
}
```

---

# 3. Background system

## Base background

```css
body {
  background-color: #E8E9E6;
}
```

## Engineering grid

Use two subtle 1 px grid layers.

```css
body {
  background-color: #E8E9E6;
  background-image:
    linear-gradient(to right, rgba(23, 24, 26, 0.045) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(23, 24, 26, 0.045) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

Optional larger guide line:

```css
.page-grid {
  background-image:
    linear-gradient(to right, rgba(23,24,26,.045) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(23,24,26,.045) 1px, transparent 1px),
    linear-gradient(to right, rgba(23,24,26,.025) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(23,24,26,.025) 1px, transparent 1px);

  background-size:
    24px 24px,
    24px 24px,
    120px 120px,
    120px 120px;
}
```

Do **not** use:

- paper stains
- scratch textures
- random black distress marks
- concrete textures
- photoreal metal
- noise strong enough to make the site dirty

The background should be clean enough to feel like a website.

---

# 4. Typography

## Display headings

Use a heavy pixel/block display font.

Recommended implementation:

```css
--font-display: "Jersey 10", "Pixelify Sans", monospace;
```

Preferred visual characteristics:

- square construction
- thick strokes
- compact width
- readable at very large sizes
- no retro arcade glow

Hero heading:

```css
.hero-title {
  font-family: var(--font-display);
  font-size: clamp(4rem, 8vw, 8.5rem);
  line-height: 0.82;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  color: #1D2021;
}
```

## UI / body

Use a clean technical mono.

```css
--font-ui: "IBM Plex Mono", "Space Mono", monospace;
```

Suggested usage:

| Element | Weight | Size |
|---|---:|---:|
| Hero body | 400 | 18–22 px |
| Nav | 600 | 14 px |
| Section eyebrow | 500 | 11–13 px |
| Section heading | 700 | 36–52 px |
| Card title | 700 | 18–22 px |
| Card body | 400 | 13–16 px |
| Metadata | 400 | 11–13 px |
| Footer | 400 | 12–14 px |

## Text behavior

- headlines are short
- labels are uppercase
- body copy uses normal sentence case
- avoid marketing buzzwords
- avoid long center-aligned paragraphs
- mono text should remain comfortably readable

---

# 5. Border system

The website should use simple technical outlines.

## Standard border

```css
border: 1.5px solid #1D2021;
```

## Strong container

```css
border: 2px solid #1D2021;
```

## Dark card

```css
background: #292C2D;
border: 1.5px solid #1D2021;
```

## Radius

Almost square.

```css
--radius-xs: 2px;
--radius-sm: 4px;
--radius-md: 6px;
```

Do not use 16–32 px SaaS-style rounded cards.

---

# 6. Shadow system

Use **hard offset shadows**, not soft blur.

```css
--shadow-hard: 4px 4px 0 #1D2021;
--shadow-small: 2px 2px 0 #1D2021;
```

Buttons:

```css
box-shadow: 3px 3px 0 #1D2021;
```

Hover:

```css
transform: translate(1px, 1px);
box-shadow: 2px 2px 0 #1D2021;
```

Pressed:

```css
transform: translate(3px, 3px);
box-shadow: none;
```

Avoid:

- blurred shadows
- glowing cards
- glass shadows

---

# 7. Spacing

Use a 4 px base grid.

```text
4
8
12
16
24
32
48
64
80
96
128
```

Page max width:

```css
--page-max: 1440px;
```

Main section spacing:

```css
section {
  padding-block: 96px;
}
```

Large desktop hero:

```css
.hero {
  min-height: 100svh;
}
```

---

# 8. Top navigation

The public navbar remains a simple technical bar.

## Desktop

```text
[BOLT] LOADOUT     ABOUT   TRACKS   SCHEDULE   FAQ   COMMUNITY

                                  language   LOGIN   RSVP NOW
```

Specs:

```css
height: 64px;
background: #F0F1ED;
border: 2px solid #1D2021;
```

Placement:

- centered page width
- approximately 24 px from page top
- no floating pill nav
- no translucent/glass navbar

## Logo icon

Use a **top-down machine bolt / hex-head bolt SVG**.

Icon construction:

- dark graphite square housing
- gold/yellow hexagonal bolt head
- small darker center hole or socket
- flat SVG
- no lightning bolt symbol
- no glossy 3D rendering

Example concept:

```text
┌──────┐
│  ⬢   │
│  ◉   │
└──────┘
```

---

# 9. Hero section

The hero should stay highly minimal.

## Structure

```text
                 main headline

LEFT LABELS                         RIGHT LABELS
IDEAS                               BUILD
BUILDERS                            LEARN
TOOLS                               SHIP
COMMUNITY                           GET REWARDED
REWARDS

                 supporting text

          [ RSVP NOW ] [ EXPLORE TRACKS ]

     Free to join | Build from anywhere | Open to everyone
```

## Important rules

Do not add:

- game screenshot
- giant illustration
- 3D workshop scene
- fake dashboard
- hero product carousel
- decorative laptop SVG
- fake stats

The negative space is intentional.

## Hero framing corners

Use four simple CSS/SVG corner marks around the main copy.

```text
┌                           ┐

     BUILD YOUR OWN
     TECHNICAL STACK.

└                           ┘
```

Stroke:

```css
2px solid #1D2021
```

---

# 10. Yellow industrial markers

The three yellow diagonal bars are a supporting brand motif.

```text
///
```

Use sparingly:

- upper left
- lower right
- section transition
- small CTA/header marker

Suggested:

```css
.marker {
  width: 96px;
  height: 24px;
}
```

Each bar:

```text
24–28 px wide
10–12 px gap
~45° slant
#D9B64C
```

Never turn the entire site into hazard stripes.

---

# 11. Section headers

Structure:

```text
ABOUT
What is LOADOUT?
Short sentence.
```

Rules:

- eyebrow centered where appropriate
- display heading below
- max text width 700–800 px
- 48–64 px gap before content

---

# 12. “What is LOADOUT?” cards

Four-card row:

```text
01 CHOOSE A TRACK
02 SHIP REAL PROJECTS
03 EARN BOLTS
04 UNLOCK REWARDS
```

Card style:

```css
background: #F0F1ED;
border: 1.5px solid #1D2021;
padding: 28px;
min-height: 260px;
```

Inside:

- custom SVG icon
- bold title
- 2–3 lines of explanation
- index in bottom-left
- small `///` marker in bottom-right

Icons should be flat, 1–2 color, slightly pixelated or grid-snapped.

---

# 13. “How it works” flow

Use six technical flow cards.

```text
01 Join LOADOUT
     ↓
02 Pick a track or request
     ↓
03 Build and ship your project
     ↓
04 Review and verification
     ↓
05 Earn Bolts and level up
     ↓
06 Spend rewards
```

Desktop layout:

```text
01 → 02 → 03
          ↓
04 → 05 → 06
```

Connectors:

- black 1.5–2 px
- square corners
- no curved SaaS connector paths
- minimal arrowheads

---

# 14. Track cards

Canonical public tracks:

- Tools
- Systems
- Compute
- Hardware

**Research Mode is not a fifth track.**

Use four equal dark cards.

```css
.track-card {
  background: #292C2D;
  color: #FFFFFF;
  border: 1.5px solid #1D2021;
}
```

Accent:

```css
color: #D9B64C;
```

Do not use a rainbow of track-card background colors.

Differentiation should come through:

- icon
- title
- content
- short ID labels

Suggested icons:

```text
Tools      wrench / terminal
Systems    gear / stacked infrastructure
Compute    chip
Hardware   board / physical connector
```

Research Mode should appear as a smaller modifier/callout below or near tracks.

---

# 15. Bolts

Bolts are the spendable currency.

## Bolt visual

Use the custom **yellow lightning Bolt SVG** requested by the user.

Recommended visual:

```text
angular lightning silhouette
yellow face with black outline
small pale-yellow highlight
flat pixel-aware SVG
```

Colors:

```text
body       #D9B64C
edge       #B3913B
outline    #1D2021
highlight  #EAD599
```

The Bolt icon should appear consistently beside balances and reward prices.

---

# 16. “From work to rewards” example table

Use a full-width outlined technical table.

Example structure:

```text
10 h      [bolt] 150 Bolts       Example reward
35 h      [bolt] 650 Bolts       Example reward
100 h     [bolt] 2,500 Bolts     Example reward
```

Important:

These numbers are illustrative mockup content unless the economy plan explicitly defines them.

Visual style:

```css
background: #F0F1ED;
border: 1.5px solid #1D2021;
```

Rows:

```css
border-top: 1px solid #A5A5A5;
```

Large values may use:

```css
color: #F0A04A;
```

but the default brand accent remains Bolt Yellow.

---

# 17. Rewards & shop preview

The public page uses a simple 4 × 2 reward preview grid.

Cards should contain:

- actual item image or clean custom SVG
- item name
- Bolt price
- no fake marketplace metadata

Example categories:

```text
Builder tools
Developer hardware
Compute
Embedded
FPGA
Server / storage
Fabrication
Custom technical requests
```

Avoid making LOADOUT look primarily like a merch store.

Merch can exist, but technical gear should dominate the program identity.

---

# 18. FAQ

FAQ is a centered single-column list.

```css
max-width: 920px;
```

Row:

```css
background: #F0F1ED;
border: 1.5px solid #1D2021;
min-height: 64px;
```

Arrow:

```css
color: #A96F6C;
```

Recommended questions:

```text
Who can join?
What projects count?
Can I work with a team?
How do tracks work?
What is Research Mode?
What are Bolts?
What are Requisitions?
How are projects reviewed?
How do rewards work?
How much AI can I use?
```

---

# 19. Footer

Footer should be simpler than Pixl's.

Structure:

```text
LOADOUT intro

LOADOUT
About
Tracks
Schedule
FAQ
Shop

RESOURCES
Rules
Docs
Community
Code of Conduct

COMMUNITY
Slack
GitHub

HACK CLUB
Hack Club
Code of Conduct
```

Use:

```css
border-top: 1.5px solid #1D2021;
background: rgba(247,245,240,.75);
```

No giant footer illustrations.

---

# 20. Custom SVG style

LOADOUT SVGs should be hand-built and reusable.

## Rules

- 24 × 24 or 32 × 32 base grid
- 2 px strokes
- square line caps where possible
- maximum 3 colors
- black outline
- yellow primary fill
- no gradients
- no glow
- no glass effect
- no realistic reflections

Example icon palette:

```text
Outline      #1D2021
Primary      #D9B64C
Secondary    #F0F1ED
Muted        #A5A5A5
```

SVGs should look like small engineering-manual symbols rather than emoji.

---

# 21. Buttons

## Primary

```css
.button-primary {
  background: #D9B64C;
  color: #1D2021;
  border: 2px solid #1D2021;
  box-shadow: 3px 3px 0 #1D2021;
}
```

## Secondary

```css
.button-secondary {
  background: #F0F1ED;
  color: #1D2021;
  border: 2px solid #1D2021;
  box-shadow: 3px 3px 0 #1D2021;
}
```

## Hover

Primary:

```css
background: #E1C56D;
```

Secondary:

```css
background: #DDE0DC;
```

---

# 22. Form controls

Inputs:

```css
background: #F0F1ED;
border: 1.5px solid #1D2021;
height: 48px;
padding-inline: 16px;
font-family: var(--font-ui);
```

Focus:

```css
outline: 3px solid rgba(251, 200, 52, .45);
outline-offset: 2px;
```

---

# 23. Public vs logged-in UI

The **public site** should remain airy and editorial.

The **logged-in application** can be denser.

Public:

```text
large negative space
large headings
few cards
explanation
strong section rhythm
```

App:

```text
sidebar
dense tables
project cards
review queues
shop
profile
track progress
Bolts
Requisitions
```

Both use the same:

- colors
- typography
- borders
- icons
- grid
- button language

---

# 24. Motion

Motion should be subtle.

Allowed:

```text
button press
card 1–2 px lift
arrow movement
small underline movement
FAQ expansion
number/count animation
```

Timing:

```css
--motion-fast: 120ms;
--motion-normal: 180ms;
```

Avoid:

- parallax
- giant scroll animations
- spinning decorations
- 3D cards
- constantly moving backgrounds

---

# 25. Responsive rules

## Desktop

```text
max-width: 1440 px
hero centered
4 columns for feature/track cards
```

## Tablet

```text
2-column card grids
reduced hero title
side labels hidden
```

## Mobile

```text
single-column
nav collapses
hero title 48–64 px
buttons stack
flow diagram becomes vertical
reward examples become cards
```

The site must never depend on tiny desktop-only text to communicate important information.

---

# 26. Accessibility

Required:

- minimum AA contrast
- visible keyboard focus
- semantic heading order
- all buttons/links keyboard accessible
- SVGs with proper labels where meaningful
- track meaning never communicated by color only
- `prefers-reduced-motion` respected
- body copy minimum 14 px, preferably 16 px
- touch targets minimum 44 × 44 px

---

# 27. Anti-patterns

Do **not** introduce:

```text
lime green as primary accent
neon cyberpunk
glassmorphism
soft gradient blobs
huge border radii
photoreal metal
rust/grunge
rivets on every panel
game-world imagery
fake screws on normal cards
pipes/cables/gears for decoration
random AI-generated industrial art
fake dashboards in the hero
rainbow track cards
generic SaaS illustrations
military/tactical branding
```

---

# 28. Exact visual hierarchy

The public page should visually prioritize:

```text
1. BUILD YOUR OWN TECHNICAL STACK.
2. RSVP / JOIN
3. What LOADOUT is
4. How it works
5. Four technical tracks
6. Bolts / progression concept
7. Real technical rewards
8. FAQ
9. Footer / Hack Club context
```

The homepage should explain the program before showing economy complexity.

---

# 29. Implementation token sheet

```css
:root {
  /* COLORS */
  --canvas: #E8E9E6;
  --surface: #F0F1ED;
  --surface-muted: #DDE0DC;

  --ink: #1D2021;
  --graphite: #292C2D;
  --graphite-2: #34383A;

  --steel: #A5A5A5;
  --steel-dark: #575E60;
  --grid: #D8D6D1;

  --yellow: #D9B64C;
  --yellow-dark: #B3913B;
  --yellow-soft: #E1C56D;

  --danger: #A96F6C;
  --success: #718C79;
  --white: #FFFFFF;

  /* TYPOGRAPHY */
  --font-display: "Jersey 10", "Pixelify Sans", monospace;
  --font-ui: "IBM Plex Mono", "Space Mono", monospace;

  /* BORDERS */
  --border: 1.5px solid var(--ink);
  --border-strong: 2px solid var(--ink);

  /* RADII */
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 6px;

  /* SHADOWS */
  --shadow-small: 2px 2px 0 var(--ink);
  --shadow-hard: 4px 4px 0 var(--ink);

  /* LAYOUT */
  --page-max: 1440px;

  /* MOTION */
  --motion-fast: 120ms;
  --motion-normal: 180ms;
}
```

---

# 30. One-line design rule

> **LOADOUT should look like a clean technical field manual for teenage builders: off-white engineering paper, black pixel typography, graphite technical panels, Bolt Yellow highlights, simple custom SVGs, and almost no decorative effects that could not be recreated directly in CSS.**

## Implemented public-site refinement — 2026-10-04

The selected headline is BUILD YOUR OWN / TECHNICAL STACK. RSVP now uses https://rsvp.soon.it/loadout as the confirmed interest destination. Pixl-inspired entrance choreography and the accessible Continue scrolling cue are active. Clouds use horizontal-only bounded parallax, ±72px desktop/±36px mobile; CSS sizes are clamp(200px,26vw,420px) and220px mobile, with static reduced-motion behavior. The current .ulpi/design/DESIGN.md table is the compact active token record.

Desktop amendment — 2026-10-05: above 1100px, the hero frame is widened to 900px and each headline span stays on one line, producing exactly two rows. Side labels hide at 1101–1300px to avoid overlap. Mobile wrapping remains responsive. Production-browser geometry checks cover 1280, 1440, 1659 and 1920px widths.


## Active homepage clarity refinement — 2026-10-05

Plan 12 is approved and implemented locally. The final process is vertical with parallel Bolt/XP results; the old six-card process and illustrative smooth badges are retired. Actual Requisition milestones are LV.3/6/9/12/15 (I/I/II/II/Master). Community Eras, pricing, Field Requisitions, and Custom Orders have separate readable explanations. No live mechanics or invented prices/counters are implied.

Homepage width is 1080px, superseding older 1440px homepage examples in this document. Major section padding is 72px desktop (88px process/progression/Eras), 56/64px tablet, and 44px mobile. Essential copy is 16px. Footer links have at least 44px targets and reflow five/two/one columns. Clouds now use clamp(280px,32vw,560px) desktop/260px mobile, X-only parallax ±112/±48px, and separate smooth ±12px drift over 48s; reduced motion is static. .ulpi/design/DESIGN.md records the active compact specification.
