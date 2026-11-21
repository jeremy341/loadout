# LOADOUT design briefs index

[`DESIGN.md`](DESIGN.md) is the tool-compatible entrypoint and links to the canonical [design system](../../docs/design/system/design-system.md), which is the only current source for tokens, type, colour, grain, rulers, icons and motion. The records below hold what was decided and built. A record does not authorize a change, and where a record disagrees with the design system, the design system wins.

On 25 Oct 2026 the 43 separate briefs were merged into the seven records in the first table. Each section keeps its original text and names the brief it came from. Links to plans removed on 25 Oct now read "removed". Briefs written after that date are separate files, listed in the groups below.

Index restructured 20 Nov 2026 (working entry, not an owner decision): every brief in this folder is listed once, grouped by surface. Where a newer brief replaces part of an older one, the older row says so and the older brief stays as a historical record. Nothing was deleted or rewritten. Status words come from each brief's own header; most participant and reviewer briefs say "not reviewed by the owner yet".

## Public site, brand and accessibility (merged records)

| Record | Covers | Briefs |
|---|---|---|
| [`accessibility-record.md`](accessibility-record.md) | Accessibility standard, remediation, field panel, display preferences, colour-vision palettes, Docs colour follow-up | 9 |
| [`homepage-copy-record.md`](homepage-copy-record.md) | Homepage voice and copy, depth-navigation copy, Community Era overview, who's behind LOADOUT, IRL concept card, organizer copy, the "less vibed" pass | 8 |
| [`homepage-layout-motion-record.md`](homepage-layout-motion-record.md) | Homepage clarity **(proposed, not authorized)**, hero atmosphere, corner brackets, depth darkness and labels, floating motion, Stasis motion, Pixl tab motion, Docs tag and Era refresh | 9 |
| [`mole-record.md`](mole-record.md) | Orry the mole: look, behaviour, moods and sequences | 2 |
| [`prize-record.md`](prize-record.md) | Prize belt, loop spacing, prize photos | 3 |
| [`brand-and-type-record.md`](brand-and-type-record.md) | Logo and helmet mark, share preview, custom cursor, open C in the pixel font, pixel icons, the Ore currency | 6 |
| [`site-navigation-record.md`](site-navigation-record.md) | Compact mobile nav, Docs guides drawer, 404 and cave-in pages, Era footer, FAQ readability, community links | 6 |

Separate public-site files:

- [`prize-numbers.md`](prize-numbers.md): the prize and Ore number readouts in Jersey 10. Works with `prize-record.md`; listed separately because it was written after the merge plan. Header status reads "in progress ... uncommitted" (Oct 2026) and has not been refreshed.
- [`irl-ticket-prize.md`](irl-ticket-prize.md): the Düsseldorf IRL ticket as one limited item in the shop belt, not open for registration. Same status note as `prize-numbers.md`.
- [`review-queue.md`](review-queue.md): the public Review Queue and participant navigation. Audit pass of 19 Nov 2026 is recorded in the brief.
- [`ui-audit-public.md`](ui-audit-public.md): public site, Docs and Review Queue audit fixes (19 Nov 2026).

## Participant platform: shell, navigation and foundation

- [`m1-platform-shell.md`](m1-platform-shell.md): the M1 participant shell, builder overview and admin basics. Implemented on `feature/participant-platform-m1`. **Partly superseded:** the top-bar navigation is replaced by `redesign-phase-1-shell.md`, and the staff group moved to the reviewer site on 6 Nov 2026 (noted inside the brief). Track page and overview decisions in it still stand until a later brief changes them.
- [`redesign-phase-1-shell.md`](redesign-phase-1-shell.md): the current shell spec. Left sidebar (a drawer on narrow screens), account panel and the one modal. Replaces the navigation in `m1-platform-shell.md`; owner changes after phase 1 are listed in the brief.
- [`redesign-phase-2-wizard.md`](redesign-phase-2-wizard.md): the project creation wizard.
- [`dashboard-minimal-pass.md`](dashboard-minimal-pass.md): the 18 Nov 2026 dashboard pass: fewer boxed buttons, calmer Ledger and Shop, raised small-text tiers. A later pass over the earlier participant briefs; where it differs on those points, it is the newer record.
- [`participant-ui-audit-followup.md`](participant-ui-audit-followup.md): participant Projects, Project and Shop audit fixes (19 Nov 2026).
- [`ui-audit-followup.md`](ui-audit-followup.md): public, participant and staff UI audit fixes (19 Nov 2026). Pair with `ui-audit-public.md` and `participant-ui-audit-followup.md`.

## Participant platform: profile, Toolbelt, projects, Explore and Shop

- [`profile-and-toolbelt.md`](profile-and-toolbelt.md): the profile and Toolbelt contract (16 Nov 2026): data, rules and screens. **Partly superseded:** sections 3.14 and 3.15 (the Toolbelt UI) are replaced by section F of `stardance-layout.md`; sections 3.16 and 3.17 and the rules stay.
- [`stardance-layout.md`](stardance-layout.md): Stardance layout for the project page, Explore and Shop, and the search-first Toolbelt (16 Nov 2026). Replaces the Toolbelt UI sections of `profile-and-toolbelt.md`.
- [`profile-two-column.md`](profile-two-column.md): the two-column profile with the activity heatmap. **Layout superseded** by `redesign-profile.md`; its heatmap section stays true.
- [`redesign-profile.md`](redesign-profile.md): the profile's wide header and internal tabs. Replaces the layout in `profile-two-column.md`.
- [`redesign-shop.md`](redesign-shop.md): the Shop as a parts counter. Read with the Shop part of `stardance-layout.md` and the Shop notes in `dashboard-minimal-pass.md`.

## Participant platform: Expeditions, Community, Events, Orders and placeholders

- [`expeditions.md`](expeditions.md): Expeditions, Events, Referrals and Orders (6 Nov 2026). **List and detail parts superseded** by `expeditions-redesign.md`; the Orders, Referrals and Events parts stay.
- [`expeditions-redesign.md`](expeditions-redesign.md): the Expeditions list and detail pages (17 Nov 2026). Replaces those parts of `expeditions.md`.
- [`community.md`](community.md): the read-only Community hub (news, goals, leaderboard, Era). Fixture-driven.
- [`placeholders-and-funding.md`](placeholders-and-funding.md): the not-connected placeholders and the Hardware funding card. Brief not reviewed by the owner.

## Reviewer site (staff only, sample data)

Read `reviewer-pixl-port.md` first for look, layout and page structure. The other reviewer briefs record features, parity tables and history.

- [`reviewer-pixl-port.md`](reviewer-pixl-port.md): the current direction (owner, 16 Nov 2026): a 1:1 port of Pixl's internal dashboard, then remove and adjust. Replaces the hand-built LOADOUT-styled and egg-styled reviewer UIs; wins over `reviewer-desk-parity.md` and `reviewer-egg-restyle.md` for look, layout and page structure.
- [`reviewer-site.md`](reviewer-site.md): the base brief for the separate reviewer host, rules owner references and the round 4 parity with Pixl's internal dashboard. Its "drop" rows for heartbeat, celebration, AI draft, AI time, other-YSWS check and reviewer perks are superseded by `reviewer-desk-parity.md`.
- [`reviewer-desk-parity.md`](reviewer-desk-parity.md): one track per project on the reviewer desk and the platform, and the Pixl review features the desk lacked, on sample data. Brief written 15 Nov 2026; not reviewed by the owner. Look and layout parts yield to `reviewer-pixl-port.md`.
- [`reviewer-egg-restyle.md`](reviewer-egg-restyle.md): egg look with Pixl layout (16 Nov 2026). **Historical:** superseded the same day by Pixl's own design; see the "Superseded" section inside it.
- [`reviewer-roles.md`](reviewer-roles.md): the role levels ported from Pixl and how they gate each page. The rules live in code and tests.
- Round 4 page groups (7 Nov 2026, parity tables against Pixl's internal dashboard; page structure may since have changed under `reviewer-pixl-port.md`):
  - [`reviewer-people.md`](reviewer-people.md): Players, Reviewers, Projects, Team and roles.
  - [`reviewer-content.md`](reviewer-content.md): Shop, Ideas, Show & Tell, Events, Community goals, Referrals, Expeditions, Forms.
  - [`reviewer-moderation.md`](reviewer-moderation.md): Reports, Violations, Bans, Audit log.
  - [`reviewer-fulfilment.md`](reviewer-fulfilment.md): the Fulfilment group (pipeline, fulfillers, tickets).
  - [`reviewer-operations.md`](reviewer-operations.md): what is left of Operations (Notify and Flags).
- [`operations-airbridge.md`](operations-airbridge.md): the Operations dashboard and Airbridge preview on the reviewer desk (19 Nov 2026). Newer than `reviewer-operations.md`, which covers only Notify and Flags.

## Proposals

- [`research-mode-builder-benefit.md`](research-mode-builder-benefit.md): **proposal only.** Do not publish or implement a Research Mode XP bonus unless the canonical product and economy plans say so.

## Replacement pairs at a glance

| Newer | Replaces | Scope |
|---|---|---|
| `redesign-phase-1-shell.md` | navigation in `m1-platform-shell.md` | Left sidebar, drawer, account panel, one modal |
| `redesign-profile.md` | layout in `profile-two-column.md` | Heatmap section of the older brief stays true |
| `expeditions-redesign.md` | list and detail parts of `expeditions.md` | Orders, Referrals and Events parts stay |
| `stardance-layout.md` section F | sections 3.14 and 3.15 of `profile-and-toolbelt.md` | Toolbelt UI; rules and 3.16, 3.17 stay |
| `reviewer-pixl-port.md` | look and layout of `reviewer-desk-parity.md` and `reviewer-egg-restyle.md` | The egg restyle is historical |
| `reviewer-desk-parity.md` | "drop" rows in `reviewer-site.md` | Heartbeat, celebration, AI draft, AI time, other-YSWS check, reviewer perks |
| `dashboard-minimal-pass.md` | small-text tiers, boxed buttons, Ledger and Shop styling in earlier participant briefs | 18 Nov 2026 pass; the older briefs remain as records |

The design system ([`docs/design/system/design-system.md`](../../docs/design/system/design-system.md)) and the asset catalog ([`docs/design/asset-catalog.md`](../../docs/design/asset-catalog.md)) remain the current visual references.
