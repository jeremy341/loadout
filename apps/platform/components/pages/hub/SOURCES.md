# Sources: Overview, Profile, Achievements, Notifications, Account

Pages in this folder: `overview-page.tsx` (Build group), `profile-page.tsx`, `achievements-page.tsx`, `notifications-page.tsx` and `account-page.tsx` (You group). Everything runs on sample data and keeps your changes in this browser's localStorage under keys that start with `hub.` (see `data.ts`, `state.ts`). Nothing is sent anywhere. Pure rules are in `logic/` with bun tests; `actions.ts` holds the event-handler code that reads the clock and storage.

## Reference files read

The pinned `references/` submodules are not checked out in this worktree, so no Pixl, Stardance or Stasis source file was opened for these tabs. The behaviour was written from the plans and from the port map (`docs/source-audit/pixl-platform-port-map.md`, rows for Pixl's `dashboard`, `account`, `explore/players` and `routes/notifications.ts`, all marked "reference only").

| Reference | What it informed | Taken into the code |
| --- | --- | --- |
| Pixl `apps/game/web/dashboard` (per the port map) | A status summary page: numbers first, then what is next. | The Overview stat grid and Next actions list. No Pixl currency, level or Restoration Energy. No source copied. |
| Pixl `apps/game/web/account` (per the port map) | Profile, session and connected accounts on one page. | The Account tab set and the Connections cards. No source copied. |
| Pixl `routes/notifications.ts` (per the port map) | An inbox with read state. | The Inbox list and read/unread/delete. No source copied. |
| Stardance achievements | None. Plan 02 records the external-contributor idea; no Stardance achievement file was read. | Nothing. |
| `apps/landing/public/loadout/sprites/*.png` (copied by the shell to `public/loadout/sprites/`) | LOADOUT's own 32 by 32 icons. | Avatar choices and achievement icons, shown pixelated with the design system's dark-mode hue rotation. |

## Plan content used as written

- Plan 02 section 20 and the proposal: the first meaningful external contribution earns a one-time achievement worth +50 Ore. It must come from someone outside the project team and materially improve the project; no typo farming, trivial changes or fake contributor rings. `HUB_RULES.contributorOre` in `logic/rules.ts`.
- Plan 02 section 21: achievements add small bonuses and profile recognition and should not dominate the economy. The example achievements (FIRST TOOL, BARE METAL and the rest) are listed under "Awarded by review" and are not earnable in the preview because reviewers judge them. No Ore is invented for any other achievement.
- Plan 01 section 6.7 and the proposal: project pages, journals and ships are public by default; Lapse recordings are visible only to reviewers; a non-Lapse attachment may be reviewer-only; never publish keys, credentials, private addresses or personal information. Profile visibility defaults to public, and the Privacy tab says so.
- Plan 01 and the proposal: Hack Club teen verification is required; the exact account integration is an operating decision. The Verification tab says "Exact Hack Club sign-in and verification integration is not connected yet". It states no age numbers (AGENTS.md: public age copy is pending correction).
- Plan 01: Hackatime for software projects, Lapse for Hardware. Shown on the Connections cards.
- Proposal "Builder dashboard and profile": track levels, achievements, seasons, approved projects, Ore, community progress and notifications. Overview and Profile show what the other tabs hold, through their summary hooks.
- Plan 11: Season and Era progress comes from the Seasons tab's summary, with its placeholder calendar.

## Draft preview rules (all in `logic/rules.ts` as `HUB_RULES`, plus the achievement catalog in `logic/achievements.ts`)

The pages label these "Draft preview rule" where they appear.

- The computed achievement catalog (`CATALOG`): 21 achievements with criteria, targets and rarity (Common, Uncommon, Rare) that the plans do not define. Four are per-track "Start a Tools / Systems / Compute / Hardware project". All carry "No Ore reward".
- Handle rules: 3 to 24 characters, lowercase letters, numbers and single hyphens, unique against `SAMPLE_BUILDERS`, plus a short reserved list (`reservedHandles`).
- Display name 2 to 40 characters; pronouns up to 24; up to 3 links, labels up to 30; at most 3 pinned projects; claim note up to 300. The bio limit of 280 and the 15-per-page inbox are from the task brief, not a plan.
- Overview limits: 8 recent-activity items, 8 next actions. First-run checklist: create a project, write a journal entry, review a ship, add a wishlist item.
- Notification kinds shown in Settings are the seven in `lib/notifications.ts`. A kind switched off is hidden from the inbox and the unread count but kept.
- Import limits: 2,000,000 characters, 200 entries.
- Verification states (not started, pending, verified, needs attention) and the allowed steps between them (`logic/account.ts`).

## Unsettled by the plans

1. **Achievement catalog, rarity, tracks and rewards.** Plan 02 gives examples and says rewards may be badges, profile cosmetics, modest Ore and seasonal progression, but sets no catalog, criteria, rarity or amounts. Only the contributor +50 Ore is defined.
2. **Contributor achievement scope.** Section 20 says "one-time"; the list in section 21 says "+50 Ore once per project". The preview follows section 20 and the task brief: one claim, one credit. Later contributor rewards are open in the plan.
3. **Who verifies a contribution and what evidence is needed.** The preview takes a project, an https link and a self-attestation, and a Preview-tools button stands in for the reviewer.
4. **Digital Loadout artifacts.** The proposal lists them under the dashboard and profile but no plan says what they are. Not built.
5. **Public profile content.** The proposal says "builder dashboard and profile" but no plan sets the fields, the handle rules, the avatar options or whether profiles are searchable. The preview shows the fields listed above.
6. **Notification rules.** No plan sets which events notify, defaults per kind, quiet hours, or channels. Email is not offered. Slack is shown as "not connected". Quiet hours are stored and do nothing.
7. **Verification flow.** The states, the "needs attention" reasons and what an unverified account may do are open until the Hack Club integration is confirmed.
8. **Connection scopes.** The listed scopes for Hack Club, Hackatime, Lapse and Slack are drafts for each service owner to confirm.
9. **Data export, import and account deletion.** Export and restore cover only this browser's preview data. Retention, deletion and any real data-portability process are not defined; the Account page says "to be defined".
10. **Leaderboard opt-out.** Owned by Leaderboards (Community B). Account links to it and does not duplicate it.

## Cross-module reads

- Through summary hooks only: `useBuildSummary`, `useCommunityASummary`, `useCommunityBSummary`, `useGearSummary`.
- Shared kit: `useOre`, `addOreEntry`, `useNotifications`, `pushNotification`, `usePreviewState`, `getPreview`, `setPreview`, `resetPreviewData`, `PREVIEW_PREFIX`, `lib/theme.ts`, `lib/landing.ts`, `lib/sample/builders.ts`.
- No other module's keys are read directly. Reset and Export work on every `PREVIEW_PREFIX` key without knowing their names.

## Known gaps

- Achievements are written to `hub.earned` when a Hub page that uses `useHub` (Overview, Profile, Achievements) is open. Visiting only other tabs does not earn them until the next Hub visit.
- Other tabs still show the fixed preview identity (`ME` in `lib/sample/builders.ts`). The Profile display name and handle apply to the Profile tab's public view only.
- Notification preferences hide a kind in the Notifications tab and its unread count. The shared `pushNotification` still stores every kind, and no other tab reads the preferences.
- No browser was used to check this work; see the final report.
