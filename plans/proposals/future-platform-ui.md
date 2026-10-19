# Future LOADOUT participant platform

**Status:** Product feature scope selected; engineering and service implementation are not approved or built. The current application is the public homepage and program-draft Docs. Plan 01 owns participant/program policy, Plan 02 owns economy and rewards, Plan 11 owns Community Eras and missions, Plan 15 owns LOADOUT IRL, and Plan 22 owns peer review.

This proposal records the future participant surfaces selected during the feature review on 2026-10-19. “Planned” means included in product direction, not available to participants today.

## Planned platform features

- **Account and eligibility:** Hack Club teen verification is required. Exact login/account integration and operational authorization must be confirmed with Hack Club.
- **Builder dashboard and profile:** track levels, achievements, seasons, approved projects, Ore, community progress, notifications, and Digital Loadout artifacts, backed by real participant data.
- **Public project pages and journals:** ships and journals are public by default. Public source links and open-source licensing are required for accepted projects. Lapse recordings for Hardware are visible only to reviewers. A non-Lapse attachment may be reviewer-only under the existing privacy rule.
- **Build tracking:** Hackatime is required for software projects; Lapse is required for Hardware projects. Each builder writes a journal entry at least once per eight hours of development on each project. Hardware ships include a bill of materials.
- **Ship and peer review:** a team fit/validity gate followed by 12 countable peer reviews, using the four LOADOUT categories scored 1–9. Hardware uses the same peer-review payout path. Builders owe eight reviews before their own payout. See Plan 22 for timing, aggregation, flags, and penalties.
- **Payout and Signal:** normal rates range from 1×–20× with a 10× mean. Stardance-style Great Signal claims can raise the hourly cap to 30×. The Good/Great evidence thresholds and rewards are recorded in Plan 02.
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

- **Pixl platform base:** The first participant-platform pass aims to adapt Pixl's full participant shell and backend capability breadth, including grouped navigation, responsive shell behavior, dashboard, shop, orders, and the services behind selected LOADOUT modules. Pixl's pinned repository is MIT licensed; any reused code must retain its license and attribution. Reuse does not transfer Pixl's domain rules, data, credentials, or integrations to LOADOUT.
- **LOADOUT-specific product:** Rebuild Pixl's domain behavior around LOADOUT's participant policy, Hackatime/Lapse evidence, journals, ships, peer review, Ore, track discounts, and catalog/order rules. Plans 01, 02, 11, 15, and 22 remain authoritative for those rules.
- **Exclude the game:** Do not port Pixl's game or game-only systems: explorable world/regions, NPCs, Restoration Energy, game launch/return links, Pixl currencies, or other world-state mechanics. LOADOUT missions use its own structured interface; no open-world game is planned.
- **Presentation:** The whole participant UI uses the LOADOUT visual system, including its themes, type, controls, responsive behavior, and optional accessibility settings. Pixl shell structure is the reference; Pixl visual identity is not.
- **Scope handoff:** The draft architecture and rollout proposal is in [the Pixl shell and backend design spec](../../docs/superpowers/specs/2026-10-19-pixl-shell-platform-design.md). That spec requires owner review before a task-level implementation plan or code changes.
- Preserve accessible defaults and optional display settings; include keyboard, screen-reader, responsive, reduced-motion, and privacy requirements in each surface's separate design and implementation plan.
- Do not display live balances, counts, rankings, inventory, review state, prices, order status, or event logistics without real configured data.
- Each service needs a separate data contract, privacy review, operational owner, accessibility review, and release plan before implementation.
