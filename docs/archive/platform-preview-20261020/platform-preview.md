> **Archived 2026-10-20:** the Pixl-derived participant platform preview was removed from the repository. This record is kept for provenance; current product scope is in [Plan 06](../../../plans/06-public-homepage.md) and [the future-platform proposal](../../../plans/proposals/future-platform-ui.md).

# Platform preview

`apps/platform` is the participant platform shell. Until the real services exist, every internal tab is a working preview feature on labelled sample data. This page is for developers. The design is in [`.ulpi/design/participant-platform-shell.md`](participant-platform-shell.md). The decision and the way it ends are in [DECISIONS.md](../../source-audit/DECISIONS.md) (2026-10-20, "Preview milestone ships working features on sample data").

## Run it

From the repository root, with Bun 1.3.14 (see [SETUP.md](../../development/SETUP.md)):

```powershell
bun install --frozen-lockfile
bun run dev:platform
```

The preview serves http://localhost:3100. `/` redirects to `/overview`. Other root scripts: `lint:platform`, `typecheck:platform`, `test:platform` and `build:platform`.

Set `NEXT_PUBLIC_LANDING_URL` to the landing app's origin (no path, for example `http://localhost:3000`) so the Docs and Accessibility settings links leave the platform correctly. When it is unset those links stay relative to the platform host. The platform shares only the `loadout-theme` key with the landing app, and only on the same origin.

## What is sample and what is real

- Everything in `apps/platform/components/pages/**` is sample data plus the participant's own actions in this browser. Nothing is sent to LOADOUT. There is no sign-in, database or API route.
- The preview identity is fixed: `ME` in `apps/platform/lib/sample/builders.ts`. Other builders, projects, ideas, events, shop items and orders are invented.
- The plans' rules are implemented as written (for example 12 reviews, 1x to 20x, 40 percent combined reduction). Where a plan is silent, the page shows a "Draft preview rule". The list is in [platform-preview-open-questions.md](platform-preview-open-questions.md).
- Pages carry a `PreviewNote`, the top rail shows "Preview: sample data", and platform pages are `noindex`.
- Only Docs is `live`. It links to the landing app.

## State: where it lives, how to reset or export

- `apps/platform/lib/preview-store.ts` keeps state in `localStorage`. Every key starts with `loadout-platform:v1:`, then a module prefix: `build.`, `comm.`, `commb.`, `gear.`, `hub.`. The Ore ledger (`ore-ledger`) and notifications (`notifications`) are shared.
- `usePreviewState(key, initial)` returns `[value, set, hydrated]`. The server render and first client render use `initial`, so keep `initial` a module-level constant. Use `getPreview` and `setPreview` only in event handlers and pure helpers.
- Modules read each other only through summary hooks (`useBuildSummary`, `useCommunityASummary`, `useCommunityBSummary`, `useGearSummary`). Do not read another module's keys.
- Ore moves only through `addOreEntry` in `lib/ore-ledger.ts`. It is append-only and refuses a negative balance. Notifications go through `pushNotification`.
- Account > Data exports every `loadout-platform:v1:` key to JSON, imports such a file, and resets everything (typed phrase `RESET`). To reset from the console, remove the keys with that prefix. The theme key `loadout-theme` is separate.

## Add a tab

1. `components/shell/nav-data.ts`: add the item to its group with `slug`, `label`, `purpose`, `status: "preview"`, `policy` and `from`. Check `nav-data.test.ts` still passes and update the tab counts in the design brief. Add its icon to `components/shell/icons.tsx`; `icons.test.ts` fails without one.
2. `components/pages/registry.ts`: register the page component under the slug through the group's `index.ts`. `registry.test.ts` fails if a routed slug has no page.
3. Page: build it from `components/ui/ui.tsx` (`PageHeader`, `PreviewNote`, `Panel`, `Field`, `Tabs`, `EmptyState`, `Status`). Keep rules in `logic/` as pure functions, put every invented number in one labelled constant, and label seeded items Sample.
4. Summary hook: if Overview, Profile or Achievements should show the tab's numbers, export a `useXSummary` hook from the group's `summary.ts` and read it from `components/pages/hub/`.
5. Tests: `bun test` in `apps/platform` for the pure logic, plus a server render test like `gear/render.test.ts`. Add a `SOURCES.md` line for every reference you read and every rule the plans leave open, then add the rule to the open-questions list.
6. Docs: update the port map and `ATTRIBUTION.md` if you read or adapted a reference, and the design brief's "Page features per tab".

## Preview tools

A control that stands in for a person or service that does not exist yet (a reviewer, a moderator, a team check, time passing, a shop fulfilment step) goes in a labelled "Preview tools" group, marked Preview only, set apart from the main flow. It is a section with a heading or a `details` element. Never mix such a control into the normal flow, and never describe its result as a real decision. Examples: `build/ship-tools.tsx`, `community-b/shared.tsx`, `hub/shared.tsx` (`PreviewTools`).

## Retire a preview module

Do this per module, in the change that connects its real service.

- [ ] The plan phase gate for the module has passed (identity and database: Phases 0 and 2; projects: 3; review and award: 4; shop: 5; community and progression: 6; events: 7).
- [ ] Replace the module's `usePreviewState` hooks with the real data source. Keep the page contract and the pure `logic/`.
- [ ] Delete the seed data, the module's `loadout-platform:v1:` keys from Account > Data, and its Preview tools.
- [ ] Replace each "Draft preview rule" the plans now settle with the plan's value, in the one constant that held it. Remove the label.
- [ ] Remove the `PreviewNote` text that talks about sample data, and flip the tab's `status` to `live`.
- [ ] Swap the shared Ore ledger and notification inbox writes for the server's, where the module used them.
- [ ] Update the open-questions list, the port map and DECISIONS.md. If the tab has no real service, remove it from the navigation instead.
- [ ] Run lint, typecheck, tests and build for `apps/platform` and the landing checks in [WORKFLOW.md](../../development/WORKFLOW.md).
