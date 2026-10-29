# Future LOADOUT participant platform

**Status:** Product feature scope selected; engineering and service implementation are not approved or built. The current application is the public homepage and program-draft Docs. The Pixl-derived preview built on 2026-10-20 was removed from the repository; these surfaces remain a proposal. Plan 01 owns participant/program policy, Plan 02 owns economy and rewards, Plan 11 owns Community Eras and missions, Plan 15 owns LOADOUT IRL.

This proposal records the future participant surfaces selected during the feature review on 2026-10-19. “Planned” means included in product direction, not available to participants today.

## Planned platform features

- **Account and eligibility:** Hack Club teen verification is required. Exact login/account integration and operational authorization must be confirmed with Hack Club.
- **Builder dashboard and profile:** track levels, achievements, seasons, approved projects, Ore, community progress, notifications, and Digital Loadout artifacts, backed by real participant data.
- **Public project pages and journals:** ships and journals are public by default. Public source links and open-source licensing are required for accepted projects. Lapse recordings for Hardware are visible only to reviewers. A non-Lapse attachment may be reviewer-only under the existing privacy rule.
- **Build tracking:** Hackatime is required for software projects; Lapse is required for Hardware projects. Each builder writes a journal entry at least once per eight hours of development on each project. Hardware ships include a bill of materials.
- **Team acceptance:** a team fit/validity gate and a short written accept-or-reject reason, using the four LOADOUT dimensions as guidance. Hardware uses the same team decision. Peer review was removed on 22 Oct 2026.
- **Payout and Signal:** every approved hour earns a fixed 10 Ore; there is no multiplier. Stardance-style Good and Great Signal claims add their Ore and achievement rewards. The Good/Great evidence thresholds and rewards are recorded in Plan 02.
- **Missions and progression:** guided missions use curated steps, prerequisites where appropriate, submissions/review, and configured achievements or rewards, inspired by Stardance. Also include seasonal quests, Seasons, Community Eras, streaks, achievements, leaderboards, and community rewards.
- **Social and community:** builder friends and follows, likes, post notifications, comments, project discovery, a public idea board, upvotes and collectibles, track/season activity, and Show & Tell. Avoid an endless-scrolling generic feed. Reposts are not selected for the initial feature scope.
- **Events:** event RSVPs, achievement certificates, and Show & Tell are planned. LOADOUT IRL is a planned future event; dates, venue, funding, travel support, and registration remain unconfirmed.
- **Shop:** reward catalog, Field and General Requisitions, Custom Orders, and personal wishlists. Shop suggestions/voting are excluded. Ore prices remain uniform across regions; availability and delivery may vary.
- **Referrals and Usage Milestones:** a referral qualifies only after the referred builder verifies, tracks and journals real work, and earns a first approved ship. Usage Milestones count verified actual project users and remain separate from Signal's public-reach measures.
- **External-contributor achievement:** the first meaningful external contribution earns a one-time +50 Ore achievement.
- **Orry and Goose Lee:** Orry is the existing interactive pet-care companion on the homepage. Goose Lee is planned as a Slack community bot. No separate Tamagotchi-style pet system is needed.

## Deferred, excluded, and open ideas

- **No open-world game:** no explorable regions, NPC quest loop, or Restoration Energy. Missions run through LOADOUT's own interface.
- **No chance-based rewards:** no daily rolls or raffle system.
- **Stasis event-lab systems:** parts inventory, team ordering, tool rentals, NFC checkout, and manufacturing/3D-printer queues are for possible IRL event operations only; they are not part of the online platform scope.
- **Starter projects:** use written guides only for now; no curated starter-project catalog.
- **Free resources directory:** planned for a later phase; list only free tools/services confirmed as available to LOADOUT participants.
- **Not selected/open:** online workshops; referral reward amounts and additional milestones; Usage Milestone thresholds/rewards; General Requisition triggers/values; further external-contributor rewards. Keep Limited Drops and sponsor drops/challenges as open ideas only.

## Design and release boundaries

- **Pixl platform base:** The first participant-platform pass aims to adapt Pixl's full participant shell and backend capability breadth, including grouped navigation, responsive shell behavior, dashboard, shop, orders, and the services behind selected LOADOUT modules. The navigation has 23 tabs in four groups (Build 6, Community 7, Gear 6, You 4; Pixl's Report tab excluded), listed in the archived preview (`docs/archive/platform-preview-20261020/`). For the first milestone only, every internal tab was a working preview feature on labelled sample data saved in the browser (owner direction, 2026-10-20; see `docs/source-audit/DECISIONS.md`), until the preview was removed on 2026-10-20. Pixl's pinned repository is MIT licensed, except `apps/pixorpheus` (AGPL-3.0) and third-party or purchased art, product photos, brand assets and fonts; any reused code must retain its license and attribution (see `docs/source-audit/ATTRIBUTION.md`). Reuse does not transfer Pixl's domain rules, data, credentials, or integrations to LOADOUT.
- **LOADOUT-specific product:** Rebuild Pixl's domain behavior around LOADOUT's participant policy, Hackatime/Lapse evidence, journals, ships, Ore, track discounts, and catalog/order rules. Plans 01, 02, 11, and 15 remain authoritative for those rules.
- **Exclude the game:** Do not port Pixl's game or game-only systems: explorable world/regions, NPCs, Restoration Energy, game launch/return links, Pixl currencies, or other world-state mechanics. LOADOUT missions use its own structured interface; no open-world game is planned.
- **Presentation:** The whole participant UI uses the LOADOUT visual system, including its themes, type, controls, responsive behavior, and optional accessibility settings. Pixl shell structure is the reference; Pixl visual identity is not.
- **Scope handoff:** The archived architecture is in the Pixl shell and backend design spec (removed; see git history), and its implementation plan (removed; see git history) breaks delivery into gated phases. Both are historical records; later code changes need a new approved scope.
- Preserve accessible defaults and optional display settings; include keyboard, screen-reader, responsive, reduced-motion, and privacy requirements in each surface's separate design and implementation plan.
- Do not display live balances, counts, rankings, inventory, review state, prices, order status, or event logistics without real configured data.
- Each service needs a separate data contract, privacy review, operational owner, accessibility review, and release plan before implementation.
