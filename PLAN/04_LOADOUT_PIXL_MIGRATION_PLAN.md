# LOADOUT - Pixl Source Migration Plan

**Purpose:** Engineering-only plan for using a clean `hackclub/pixl` source snapshot as the primary starting codebase for an independent LOADOUT repository.

**Product rules are owned by:** `01_LOADOUT_PRODUCT_AND_PROGRAM.md` and `02_LOADOUT_ECONOMY_AND_REWARDS.md`.

**UI rules are owned by:** `03_LOADOUT_UI_DESIGN_SYSTEM.md`.

> Pixl is an engineering base, not a product/UI to reskin. LOADOUT remains an independent repository with fresh Git history.

This engineering plan is part of the same LOADOUT master document. It is updated for the v4 product/economy model rather than the older five-track/simple-unlock model.

**Date:** 2026-10-02  
**Primary source base:** `hackclub/pixl` (`main`)  
**Secondary reference:** `EDRipper/ysws-template` (`master`), audited under `07_LOADOUT_SOURCE_AUDIT_AND_REPO_WORKFLOW.md`  
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
CLONE PIXL AS A LOCAL REFERENCE
   ↓
RECORD THE EXACT SOURCE COMMIT
   ↓
CREATE A FRESH INDEPENDENT LOADOUT REPOSITORY
   ↓
COPY A CLEAN PIXL WORKTREE SNAPSHOT
(no Pixl .git history)
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

Also do not import Pixl's `.git` directory into LOADOUT. The exact Pixl source SHA is recorded for provenance, while LOADOUT starts with its own clean Git history.

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
3. The untouched local `references/pixl/` clone remains the historical/source reference.
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
cool/warm technical off-white graph-paper background
graphite + steel rectangular sections
left-aligned industrial field-manual layout
pixel/block display type
customizable builder character
signal orange as restrained primary accent
Bolt gold reserved for currency
few decorative SVGs; no fake metal textures
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

# 30. Definition of "Migrating from Pixl Successfully"

We are done with the migration when someone unfamiliar with the repository can look at it and say:

> “This is clearly LOADOUT, and Pixl was used as proven infrastructure.”

—not—

> “This is Pixl with a different theme.”

The reused code should save implementation time.

The visible product, data model, progression loop, economy, and identity should belong to LOADOUT.

The migration is **not** complete until:
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
