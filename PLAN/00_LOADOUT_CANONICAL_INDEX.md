# LOADOUT — Canonical Plan Index

**Status:** Current source-of-truth index after splitting the old master plan.

**Homepage refinement, 2026-10-05:** [Plan 12](12_LOADOUT_HOMEPAGE_CLARITY_FLOW_AND_ERAS.md) is approved and implemented locally. It covers the vertical process, lifetime progression, Community Eras, Requisition and Custom Order explanations, pixel SVGs, footer, spacing, and horizontal clouds. Plans 01/02/11 remain the product-policy owners. Tests, CI/pipeline changes, live mechanics, and publication are separate scopes.

**Homepage information architecture, 2026-10-05:** [Plan 13](13_LOADOUT_HOMEPAGE_INFORMATION_ARCHITECTURE.md) is approved and implemented locally. Its consolidated introduction, grouped tracks/fit, unchanged process diagram, unified gear/rewards section, and later community section supersede Plan 12 §5's sequence. Final local checks pass; publication is a separate step.

**Progress and prizes hierarchy, 2026-10-05:** [Plan 14](14_LOADOUT_PROGRESS_AND_PRIZES_HIERARCHY.md) is approved and implemented locally. Levels, pricing, discounts, Requisitions, the prize catalog and Custom Orders now sit beneath one Progress & Prizes section. Final local checks pass; publication is a separate step.

**LOADOUT IRL // RUHR, 2026-10-06:** [Plan 15](15_LOADOUT_IRL_RUHR.md) records the future three-day Germany build-weekend concept, its proposed Ruhr location priorities, same-global-Era connection, and readiness gates. No venue, date, capacity, funding, partner, or event launch is confirmed. The earlier Plan 05 one-to-two-day sketch is superseded.

**Homepage mechanics clarity, 2026-10-06:** [Plan 16](16_LOADOUT_HOMEPAGE_MECHANICS_CLARITY.md) is implemented locally with clearer Community Era, Field Requisition, and Custom Order explanations, plus the user-approved visible future IRL concept. Final local checks pass. Plans 01/02/11 remain policy owners; live mechanics, event operations, and publication are separate scopes.

This file is intentionally short. The detailed plans live in the focused documents next to it.

## Canonical product decisions

- LOADOUT is a **technical-capability YSWS**, not a general build-anything YSWS.
- Four lifetime tracks: **Tools, Systems, Compute, Hardware**.
- **Research Mode** is a modifier, not a fifth track.
- Each track has **15 lifetime levels**.
- **Bolts are global**.
- Reviewers decide the final XP percentage split for multi-track ships.
- Most rewards can still be bought cross-track.
- Track specialization gives better field pricing; cross-track buying can cost more.
- Permanent field discounts stay modest and are capped on expensive items.
- Rare **Requisitions** let specialists push beyond normal discount caps.
- Field Requisitions are earned at **LV.3 / 6 / 9 / 12 / 15**.
- Requisitions are one-use, non-transferable, never expire, do not stack on one purchase, and have minimum eligible item prices.
- Rare **General Requisitions** reward exceptional season/community/review contribution without creating permanent global privilege.
- Hard track locks are reserved for a small set of genuine **Mastery** equipment.
- Core principle: **Depth gives leverage. Breadth gives flexibility. Mastery gives access.**
- Core identity: **Build your own technical stack.**
- Community Eras are a shared technical progression. They remain distinct from seasons, tracks, Bolts, and Track XP; Plan 11 owns the approved Era rules.

## Plan map

### `01_LOADOUT_PRODUCT_AND_PROGRAM.md`
What LOADOUT is and what counts:
- identity and positioning
- project eligibility
- four tracks + Research Mode
- Builder Profile / Digital Loadout
- tracking and journals
- shipping and review
- AI rules
- team projects / reviewers / appeals
- community and project discovery

### `02_LOADOUT_ECONOMY_AND_REWARDS.md`
How progression and money-like mechanics work:
- Bolts + XP
- quality multiplier
- Signal / open-source / referral bonuses
- seasons and leaderboards
- shop field affinities
- cross-track pricing
- permanent discounts and savings caps
- Requisitions
- Custom Orders
- economy balancing and guardrails
- Eras, Era Points, the qualifying-project Bolt bonus, and economy stacking

### `03_LOADOUT_UI_DESIGN_SYSTEM.md`
The current visual/product-interface direction:
- pixel typography and avatars stay
- simplified industrial / engineering look
- steel / graphite / warm technical surfaces
- orange safety accent
- web-recreatable components
- page-level UI requirements
- anti-"AI UI" rules
- future Era progress, advancement-ready, and objective states

### `04_LOADOUT_PIXL_MIGRATION_PLAN.md`
Engineering-only plan:
- what to KEEP / MODIFY / DELETE from Pixl
- target repo shape
- route-by-route decisions
- database strategy
- new LOADOUT systems
- migration phases
- first vertical slice
- technical risks

### `05_LOADOUT_LAUNCH_AND_OPERATIONS.md`
Running the actual YSWS:
- sponsor model
- fulfillment
- fraud/abuse ops
- launch sequence
- pilot / Season 00
- metrics
- LOADOUT IRL / Germany build weekend concept
- Era schedule, thresholds, reviewer criteria, and objective readiness

### `06_LOADOUT_PUBLIC_HOMEPAGE.md`
Public marketing/entry experience:
- homepage information architecture
- hero and program explanation
- four tracks + Research Mode
- Digital / Physical Loadout story
- progression, rewards, Requisitions, Custom Orders
- FAQ / CTA / responsive / accessibility
- reuse of Pixl `apps/landing` without retaining Pixl identity

### `07_LOADOUT_SOURCE_AUDIT_AND_REPO_WORKFLOW.md`
Source and development workflow:
- local Pixl + YSWS-template reference clones
- feature/UI/architecture audit
- independent fresh-history `jeremy341/loadout` repo
- licensing/attribution tracking
- short-lived branch → `development` PR → `testing` promotion PR → `main` production PR; see Plan 07 for the active staged workflow
- contributor/PR workflow
- CI + CodeScene
- later transfer readiness for `hackclub/loadout`


### `08_HACKCLUB_YSWS_ECOSYSTEM_CONTEXT.md`
Supporting external-context brief:
- generated by `PROMPT_00_GATHER_HACKCLUB_YSWS_CONTEXT.md`
- current Hack Club / YSWS philosophy, rules, workflows and infrastructure
- representative program comparisons
- Hackatime/Lapse/review/fulfillment context
- items requiring Hack Club confirmation

**Important:** `08` is research context, not a canonical LOADOUT product plan. It never overrides `00-07` by itself.

### Public-site execution and refinement records

- `09_LOADOUT_PUBLIC_SITE_PIXL_PORT_AND_REDESIGN.md` records the completed public landing port/redesign and source-informed motion audit.
- `10_LOADOUT_HOMEPAGE_RSVP_MOTION_AND_CONTENT_REFINEMENT.md` records the completed RSVP, motion, horizontal-cloud, muted-palette, content, and desktop-width refinement.
- `11_LOADOUT_ERAS_AND_COMMUNITY_PROGRESSION.md` records the user-approved Eras design. It is a product plan, not an implementation authorization.
- `13_LOADOUT_HOMEPAGE_INFORMATION_ARCHITECTURE.md` records the implemented homepage order, consolidation, preserved How it works section, and final local verification.
- `14_LOADOUT_PROGRESS_AND_PRIZES_HIERARCHY.md` records the implemented progression/prize hierarchy, terminology, retained anchors and local verification.

### Future event and public-copy plans

- `15_LOADOUT_IRL_RUHR.md` owns the future in-person event concept and its operational readiness gates. It does not authorize an event launch.
- `16_LOADOUT_HOMEPAGE_MECHANICS_CLARITY.md` owns the planned copy clarification and optional data-gated event section. Plans 01, 02, 11, and 14 remain authoritative for the underlying product/economy decisions and current page hierarchy.

### Historical bootstrap sequence (completed)

```text
1. PROMPT_00_GATHER_HACKCLUB_YSWS_CONTEXT.md
   → researches ecosystem
   → replaces/populates 08_HACKCLUB_YSWS_ECOSYSTEM_CONTEXT.md

2. Human reviews the context brief if needed.

3. PROMPT_01_BOOTSTRAP_AUDIT_AND_PUBLIC_HOMEPAGE.md
   → reads 00-08
   → audits source repos
   → bootstraps independent LOADOUT repo
   → sets up workflow
   → implements the first public homepage
```

This records how the initial repository was created. Do not rerun the bootstrap prompts for routine work.

## File cleanup policy

Going forward, edit **these split documents**, not the old monolithic drafts. For engineering source selection and branch workflow, `07` is canonical.

### Archive / delete after confirming the split
- `OVERCLOCK_YSWS_FULL_PLAN(3).md`
- `LOADOUT_YSWS_FULL_PLAN_v2(3).md`
- `LOADOUT_YSWS_FULL_PLAN_v3(2).md`
- `en u(2).md` (old standalone Pixl migration map)
- `LOADOUT_MASTER_PLAN_v4(1).md` can be kept **read-only as a snapshot**, then archived once this split has been used for a while.

Reason: the older files contain superseded names, track models, economy rules, or visual directions. Keeping them editable risks accidentally reintroducing old decisions.
