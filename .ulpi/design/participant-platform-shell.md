# Participant platform shell

Status: scoped brief for the first participant-platform shell port, written 2026-10-20. App `apps/platform`. The preview milestone is merged to `development` in PR #134; this brief is the spec the code is checked against. Phase 0 of the [implementation plan](../../docs/superpowers/plans/2026-10-19-pixl-shell-platform.md) (identity, database, hosting, operating owners) is still open, so this milestone has no sign-in and no backend. Revised the same day: every tab is now a working preview feature on labelled sample data (see "Confirmed owner decisions" 3 and 4).
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md). Policy owners are named per tab below; this brief decides presentation only.
Source map: [`docs/source-audit/pixl-platform-port-map.md`](../../docs/source-audit/pixl-platform-port-map.md). Attribution: [`docs/source-audit/ATTRIBUTION.md`](../../docs/source-audit/ATTRIBUTION.md).

## Confirmed owner decisions (2026-10-20)

1. The first platform port copies Pixl's participant shell (structure and code), minus the game and everything coupled to it, and restyles it with the LOADOUT design system. Pixl colours, fonts, logo and images do not carry over.
2. The shell lives in a new Next app, `apps/platform`, separate from `apps/landing`. A modular monolith behind it is a later step.
3. The shell ships all 23 destinations: 22 internal tabs and Docs, which links out to the public site. The first commit (`8a3bb44`) routed every tab to a "not available yet" page. The owner then instructed on 2026-10-20: "remove all the not available yet and add real functions and placeholders so add all real functionality". Every internal tab is now a fully working feature that runs in the browser on clearly labelled sample data ("placeholders"). State is kept in `localStorage`. There is no backend.
4. **Override, this milestone only.** [`plans/proposals/future-platform-ui.md`](../../plans/proposals/future-platform-ui.md), the draft spec and the draft plan say "do not show navigation links to unimplemented modules", "show only real records", "no seeded sample data outside tests" and "do not ship placeholder pages". The owner instructions above override those rules for the preview milestone only. The safeguards below stay in force. Later milestones return to the rules: a module's sample data and local store are replaced by its real service, or the tab leaves the navigation (see `docs/source-audit/DECISIONS.md`, entry "Preview milestone ships working features on sample data"). Nothing else in the draft plan changes.
   - A `PreviewNote` on every page says what is sample and what is saved in this browser.
   - A "Preview: sample data" chip is in the top rail.
   - Sample items carry a Sample label. Rules the plans leave open are labelled "Draft preview rule".
   - Nothing is sent to LOADOUT. Platform pages are `noindex`.
   - `NavStatus` is `"preview" | "live"`. Only Docs is `live`.
5. The Slack scope post to `#loadout-development` has not been sent. No Slack tool was available. A maintainer must post it ([WORKFLOW.md](../../docs/development/WORKFLOW.md)).

## Design read

The back office of the field manual. The public site is the manual's cover and rules; the platform is the cabinet behind it, with one labelled drawer per job. In the preview every drawer opens and works, but the contents are a practice set. Each drawer says so on its front, and nothing in it is passed off as a real record.

## The audience

A verified teen builder (internal age policy 13–18; see AGENTS.md) who has already read the public site. They will return to this shell often, on a laptop while building and on a phone to check on things. They need to find a place fast and trust what they see. Maintainers and reviewers also open it to check the shell. Staff tools are not part of the participant shell.

## Direction

Industrial and signage, inherited from DESIGN.md. The shell uses the Docs token set from the design system: dark graphite default (`#222627`), stone-paper alternate (`#DDD3BF`), one accent per theme, square corners, 2px rules, hard 4px offset shadows, no blur. Pixelify Sans is for signage, IBM Plex Mono is for reading, and Jersey 10 is for the wordmark. No fake dashboards: figures come from the sample data and the participant's own actions, and every page says so in its `PreviewNote`. No glow, glass or decorative charts; a chart or meter must show a real calculated value.

Counterfactual test: a left rail with icons and a bottom bar on phones is the standard app-shell pattern. It is acceptable here because the rail is the program's own index (four named groups, program vocabulary such as Ore, Seasons, Missions), the icons are 16 by 16 whole-pixel marks, and every surface uses LOADOUT tokens. If the shell could be mistaken for a generic admin template, or for Pixl, it has failed.

## What this milestone includes and excludes

Included:

- The shell chrome (sidebar, top rail, phone dock, MORE sheet) and the 23 destinations.
- A working preview page for each of the 22 internal tabs (see "Page features per tab"), registered by slug in `components/pages/registry.ts`, running on sample data saved in the browser (see "Preview data model").
- Shared building blocks (`components/ui/ui.tsx`, `ui.css`), a shared Ore ledger (`lib/ore-ledger.ts`) and a shared notification inbox (`lib/notifications.ts`), both append-only or shared across modules.
- An Overview that reads every module's summary hook and lists all 23 destinations under "Where everything lives".
- A 404 page and an error page without the shell.
- The theme toggle, using the shared `loadout-theme` key (`dark` or `light`).
- A link to the public accessibility page, a skip link, and the external Docs link.

Not included (stated plainly so nobody assumes otherwise):

- **The full Accessibility preferences dialog and its display-preferences storage are not ported in this PR.** Reading size up to 200%, the five colour-vision palettes, Phantom Sans, grain choices, stronger contrast, wider spacing, larger controls, Reduce motion, decoration toggles, the custom cursor and underlined links all live in the landing app (`apps/landing/app/_components/display-preferences.ts`) and are not shared.
- The shell links to the landing's accessibility page for those settings. The platform shares only the `loadout-theme` key, and only when the platform and the landing app are on the same origin. On a different origin the platform keeps its own theme choice until a shared preference module exists.
- What the platform does honour without those settings: the OS reduced-motion request, the OS `prefers-contrast: more` request, browser zoom and browser text size, and forced colours. The acceptance criteria below test only these.
- Real sign-in and real accounts. The preview has one fixed signed-out identity (`ME` in `lib/sample/builders.ts`).
- Any backend, database, API route or network call to LOADOUT. Every Ore figure, level, count, ranking, order and notification is sample data or the participant's own local action. None is a real record.
- Real stock, delivery, dates, prices beyond the plans' working examples, and any reward the plans do not set. These show as "to be announced" or as a "Draft preview rule".
- Pixl's game, world, currencies (Pixels, Restoration Energy), Core Integrity chip, Report tab, Pixl art, fonts, logo and images. See "Deliberately excluded".

Follow-up, not a promise: a shared display-preferences module (landing and platform) so the platform honours Reading size, colour-vision palettes and the other optional settings. That needs its own brief.

## User flow

1. A visitor opens the platform root. `/` redirects to `/overview`.
2. The skip link is the first tab stop and jumps to the main content.
3. They scan the sidebar groups (Build, Community, Gear, You) and pick a tab. The page loads with its label as the `h1`, the purpose sentence, a `PreviewNote`, and the working feature below.
4. They use the feature: add, edit, delete, submit, reload. Changes persist in this browser. Feedback appears in a polite live region and destructive actions confirm inline.
5. Overview carries the same `PreviewNote` and, in "Where everything lives", lists every destination with its purpose as links. This is also the route to all 23 destinations when JavaScript is off.
6. On a phone, the dock gives four tabs (Overview, Projects, Shop, Explore) and More. More opens a grouped sheet with the other 19 destinations. Choosing one navigates and closes the sheet.
7. Docs is an external link to the public Docs in the landing app. It opens in the same tab and is marked as leaving the platform.
8. Theme: the toggle in the top rail flips dark and light and remembers the choice.
9. An unknown address shows the 404 page. A failed render shows the error page.

## Tab inventory

This table matches `apps/platform/components/shell/nav-data.ts`, the authoritative list. If they disagree, fix both in the same change. 23 tabs: Build 6, Community 7, Gear 6, You 4. Pixl's Report tab is excluded.

"Status" is `NavStatus` in `nav-data.ts`: `preview` means a working feature on sample data, `live` means it reads real LOADOUT records or links to a live page. Only Docs is `live`. "Source" is the `from` field in `nav-data.ts`: the Pixl tab a LOADOUT tab descends from. "new" means no Pixl tab is named there. Policy owners are the plans or documents that own the rules; none of them changes in this milestone.

| # | Group | Slug | Label | Source | Status | Policy owner |
|---|---|---|---|---|---|---|
| 1 | Build | `overview` | Overview | Pixl `dashboard` | preview | `plans/proposals/future-platform-ui.md` |
| 2 | Build | `projects` | Projects | Pixl `projects` | preview | Plan 01 |
| 3 | Build | `journals` | Journals | new | preview | Plan 01 |
| 4 | Build | `reviews` | Reviews | new | preview | Plan 22 |
| 5 | Build | `missions` | Missions | Pixl `trials` | preview | Plan 11 |
| 6 | Build | `docs` | Docs | new | live (external link) | `apps/landing` `/docs` |
| 7 | Community | `explore` | Explore | Pixl `explore` | preview | `plans/proposals/future-platform-ui.md` |
| 8 | Community | `ideas` | Ideas | Pixl `ideas` | preview | `plans/proposals/future-platform-ui.md` |
| 9 | Community | `show-and-tell` | Show & Tell | new | preview | `plans/proposals/future-platform-ui.md` |
| 10 | Community | `leaderboards` | Leaderboards | new | preview | `plans/proposals/future-platform-ui.md` |
| 11 | Community | `seasons` | Seasons | new | preview | Plan 11 |
| 12 | Community | `events` | Events | new | preview | Plan 15 |
| 13 | Community | `friends` | Friends | new | preview | `plans/proposals/future-platform-ui.md` |
| 14 | Gear | `shop` | Shop | Pixl `shop` | preview | Plan 02 |
| 15 | Gear | `wishlist` | Wishlist | New (Pixl `vault` is not a wishlist; see note 1) | preview | Plan 02 |
| 16 | Gear | `orders` | Orders | Pixl `orders` | preview | Plan 02 |
| 17 | Gear | `collectibles` | Collectibles | Pixl `collectibles` | preview | `plans/proposals/future-platform-ui.md` |
| 18 | Gear | `referrals` | Referrals | Pixl `refers` | preview | Plan 02 |
| 19 | Gear | `ore-calculator` | Ore calculator | Pixl `calc` | preview | Plans 02 and 22 |
| 20 | You | `profile` | Profile | new | preview | `plans/proposals/future-platform-ui.md` |
| 21 | You | `achievements` | Achievements | new | preview | Plans 02 and 11 |
| 22 | You | `notifications` | Notifications | new | preview | `plans/proposals/future-platform-ui.md` |
| 23 | You | `account` | Account | Pixl `account` | preview | Plan 01 |

Notes on the table:

1. **Wishlist is not Pixl's Goals tab.** In the pinned Pixl source, `vault` (labelled GOALS) is "The Core Vault": a community Restoration Energy goal that rewards top contributors (`apps/game/web/vault/index.html`, `apps/server/src/routes/vault.ts`). It is game-coupled and is not a personal saved-items list. Wishlist is therefore a new LOADOUT tab (Plan 02 owns the behaviour). `nav-data.ts` now records `vault` as a note on Seasons, not on Wishlist. The icon geometry copied from `vault` is only a shape. Logged as an open question in the port map.
2. Pixl pages exist for several tabs marked "new" and are later references only, not part of this port: Pixl's journals page (Journals), `explore/leaderboard` (Leaderboards), `show-n-tell` (Show & Tell), `timeline` (Seasons), `explore/players` (Profile). They are listed in the port map.
3. Streaks, collectibles, comments and notification rules are named in the proposal but their policy is not settled in a plan. The tabs exist; their behaviour needs a policy owner before any real page.
4. Labels are the same text in the sidebar, the MORE sheet, the page `h1`, the top rail and the document title (design system voice rule). Pixl used uppercase labels (OVERVIEW, GOALS); LOADOUT labels are plain text from `nav-data.ts`, and uppercase appears only through CSS where the signage style calls for it, so the accessible text stays natural.

## Page features per tab

What a tester can do on each tab. Every action works on sample data and is saved in this browser. Rules the plans do not set are labelled "Draft preview rule". Source folders are under `apps/platform/components/pages/`. Each has a `SOURCES.md` listing the references read and the rules the plans leave open. [`platform-preview-open-questions.md`](../../docs/source-audit/platform-preview-open-questions.md) consolidates them.

**Build** (`build/`; Overview is in `hub/`)

- Overview: first-run checklist, stat grid read from every module's summary hook, next actions, Season and Era progress, recent activity, and "Where everything lives" with all 23 destinations.
- Projects: create, edit and delete a project. Keep versions, attach evidence and a bill of materials. Run the ship checklist (open source, journals, bill of materials, summary, AI declaration), submit a ship and follow it through team check, peer review, award and flag window. See the public page preview. Preview tools stand in for the team and the reviewers.
- Journals: write entries against a project, see the eight-hour cadence and uncovered hours, filter the feed, download an entry as text, delete with an inline confirm.
- Reviews: take the next ship from a one-at-a-time queue (skip, report or review it), score four categories from 1 to 9 with a reason of at least ten words, read feedback on your own ships, and read the scoring guide.
- Missions: browse the seven sample missions and the seasonal quests, check prerequisites, tick steps, submit, and simulate the reviewer to earn the draft reward once.
- Docs: external link to the public Docs. It leaves the platform.

**Community** (`community-a/`, `community-b/`)

- Explore: search, filter and sort sample projects, 12 per page. Open a detail view (kept in the URL hash). Like, comment, follow, and report with the options to hide the item or block the builder.
- Ideas: post an idea (title, description, daily limit), upvote once, sort by newest or top, comment, withdraw or reopen your own idea.
- Show & Tell: post a showcase entry with a link and a track, react, comment, report, filter, and see a sample "Featured this week" strip.
- Friends: find builders, follow, send and accept requests, unfriend, turn post notifications on per builder, read the 10-event activity list, and manage blocks and reports in the Safety tab.
- Leaderboards: week, Season and all-time boards by metric and track, a podium, paged standings, your own rank, and a "Hide me from public leaderboards" switch.
- Seasons: Season and Community Era progress, a work log that adds Era Points for approved ships, draft quests, a weekly streak and an archive. Time rules follow a Preview date that Preview tools can move.
- Events: RSVP to four sample online events, join a waitlist when one is full, add to calendar (.ics), mark attended in Preview tools, and verify an achievement certificate code.

**Gear** (`gear/`)

- Shop: search, sort and filter 16 sample items. See level locks and track discounts. Buy with Ore, apply a Field Requisition, request a Custom Order.
- Wishlist: save and remove items, add notes, see affordability against the sample balance. A wishlist reserves nothing.
- Orders: track sample orders, cancel (refunds the Ore once), read the append-only Ore ledger with a running balance, export it as CSV.
- Collectibles: browse the sample catalog, see progress toward each unlock, claim where the preview can check the condition, pin favourites.
- Referrals: copy a sample code, enter someone else's code (self-referral is blocked), manage invites, follow the qualification steps, record Usage Milestone counts (reward to be announced).
- Ore calculator: enter hours, track level, Signal tier and scores. Read the estimate with the 1x to 20x range and the 30x Great ceiling. Save and compare scenarios, and see what the Ore could buy.

**You** (`hub/`)

- Profile: edit handle (validated), display name, bio, links and pinned projects. See what is public and read the public view.
- Achievements: filter the draft catalog, see progress, claim the external-contributor achievement once (+50 Ore), and read the list "Awarded by review".
- Notifications: inbox with filters, mark read or unread, delete. Settings per kind, and quiet hours (stored, no effect yet).
- Account: verification state (no real sign-in), privacy, connections (Hack Club, Hackatime, Lapse and Slack, shown as not connected), Data (export, import, reset) and Display (theme and a link to the public accessibility page).

## Preview data model

- **Where state lives.** `apps/platform/lib/preview-store.ts`. Every key starts with `loadout-platform:v1:`. Modules add their own prefix after it: `build.`, `comm.`, `commb.`, `gear.`, `hub.`. The Ore ledger (`ore-ledger`) and the notification inbox (`notifications`) are shared, so they have no module prefix.
- **Theme is separate.** The theme is the shared `loadout-theme` key (`dark` or `light`). Reset does not touch it.
- **Hooks.** `usePreviewState(key, initial)` returns `[value, set, hydrated]`. `getPreview` and `setPreview` serve event handlers and pure helpers. `uid` makes local ids.
- **Hydration rule.** The server render and the first client render both use `initial` (the sample seed). The saved value replaces it after hydration, through `useSyncExternalStore`. `initial` must be a module-level constant so its reference is stable. Never read storage during render outside the hook.
- **Shared kit.** `useOre` and `addOreEntry` append to one ledger. It is append-only, refuses a balance below zero, and a correction is a new entry. `pushNotification` writes the shared inbox. Modules read each other only through summary hooks (`useBuildSummary`, `useCommunityASummary`, `useCommunityBSummary`, `useGearSummary`), never another module's keys.
- **Reset, export, import.** Account > Data. Reset removes every `loadout-platform:v1:` key and needs the typed phrase `RESET`. Export downloads every such key as one JSON file of sample data. Import restores from that file, within size and entry limits. All of it touches only this browser.
- **Failure mode.** If storage is blocked or full, a write is dropped without an error and the page keeps showing the last saved (or sample) state. Nothing throws. The code comment in `preview-store.ts` says the in-memory cache lets the tab continue, but `write` clears the cache entry after a failed write, so changes do not show. Open item, see the platform-preview-open-questions record.
- **Retiring a module.** Replace the module's hook with its real service and delete its seed. See [`docs/development/platform-preview.md`](../../docs/development/platform-preview.md).

## Layout

### Desktop, wider than 900px

- Sidebar: fixed, 260px wide, full height, right edge a 4px rule in `--stroke`. The group list scrolls inside the sidebar (`overflow-y: auto`) so 23 items and four group labels never clip at short window heights.
- Top of sidebar: the LOADOUT wordmark with the helmet mark (the landing's logo, not Pixl's), in a band as tall as the top rail, linking to Overview. Its accessible name is "LOADOUT, Overview".
- Four groups in order: Build, Community, Gear, You. Each group has a small pixel-type label (real text, not decoration). The `nav` has an accessible name ("Platform sections") and each group is a labelled group.
- Item: 44px minimum row height, a 28px icon box with a 16 by 16 pixel icon, and the label. Docs shows an external arrow. There are no status tags: every tab works.
- Top rail: sits at the top of the content column (sticky), 54px minimum height, and may wrap to more rows instead of clipping. From 1101px it shows the current section's name. It holds the status group (the "Preview: sample data" chip and the sample Ore chip) and the actions (Accessibility settings, theme toggle). The actions show their text from 1280px; below that they show only their icon and keep the text as the accessible name.
- Main content: to the right of the sidebar, `max-width` 1120px.

### Phone and tablet, 900px and narrower

- No sidebar column and no left gutter.
- Top rail stays. It shows the logo (the sidebar's logo is hidden), then the actions, then the status group on its own row. It is taller than 54px here, and the page does not assume a rail height.
- Bottom dock: fixed to the bottom, `--dock-h` high (68px) plus `env(safe-area-inset-bottom)`, five slots: Overview, Projects, Shop, Explore, More. Labels are 11px pixel type under a 20px icon.
- The page gets bottom padding of the dock height plus the safe-area inset plus 32px, so the dock never covers the last line of any page.
- More sheet: a dialog that opens above the dock, with a scrim over the page.
  - Header: "More sections" and a Close button (44px).
  - Content: the 19 destinations that are not in the dock, grouped by Build, Community, Gear and You with group labels. The four dock tabs are not repeated. Docs is in the sheet as an external link.
  - Rows are 44px-minimum icon and label rows, laid out in a responsive grid (`auto-fill`, minimum 200px, capped at the available width). On a 320px phone that is one column. Labels wrap and are never truncated, clipped or ellipsised ("Notifications", "Leaderboards" and "Ore calculator" read in full at 320px).
  - Height: no taller than the viewport minus the dock and a 16px margin, scrolls inside itself, `overscroll-behavior: contain`. It never pushes the page.
  - The active tab is marked in the dock or the sheet. When the sheet is open, More shows an expanded mark.

### Containers and breakpoints

Spacing in multiples of 4px. The shell's structural breakpoint is 900px, with refinements at 380px, 1101px and 1280px. Reuse these before adding one.

## Components and states

### Sidebar, dock and sheet items

| State | Treatment |
|---|---|
| Rest | Ink text on the panel, transparent 2px border, icon in a 28px box with a 2px stroke |
| Hover (hover-capable pointers) | Raised panel fill and a visible border |
| Active (current page) | Accent fill with accent-text colour, 2px stroke, `aria-current="page"`, plus a bar on the leading edge (6px on the left in the sidebar and the sheet, 5px on top in the dock). The mark is not colour alone |
| Focus-visible | 3px outline in the focus colour with a 2px to 3px offset, on top of any hover or active style. Never removed. In light theme the focus colour is rust, because the yellow accent is too pale on paper |
| External (Docs) | An external-link glyph and visually hidden "(public Docs, leaves the platform)". Plain anchor, same tab |

### Top rail

- Preview statement: a bordered chip with the text "Preview: sample data". It is plain text, not an alert.
- Ore chip: an Ore icon, the word "Ore", the sample balance from the shared preview ledger (`lib/ore-ledger.ts`, `useOre`) and hidden text "sample balance". Its title says the balance is saved in this browser. It is the only currency element in the shell. The owner may remove it (open question).
- Accessibility settings: a real link to the landing's accessibility page. It leaves the platform, same tab. It is not the dialog (see exclusions).
- Theme toggle: a native `button` that names the theme it switches to ("Light mode" or "Dark mode"), as the public site's switch does. 44px minimum height. It sets `data-display-theme` on `html`, writes `loadout-theme` as `dark` or `light`, and ignores a failed storage write. Default is dark. A small inline script in `head` applies the saved theme before first paint so the page does not flash.

### Preview page template

Every page in `components/pages/**` follows one template, built from `components/ui/ui.tsx`:

- `PageHeader`: optional group label, `h1` with the tab's label, and the purpose sentence from `nav-data.ts`.
- `PreviewNote`: one line under the header saying what is sample and that changes are saved only in this browser. It is on every page.
- The working feature, in `Panel` sections, `Tabs` where a page has several views, and `StatGrid`, `Stat` and `Meter` for figures that are calculated from real state.
- Sample items carry a `Tag` with the word Sample. Rules the plans leave open show "Draft preview rule" next to the value.
- Feedback ("Saved", "Added to wishlist") goes to one `Status` live region per page.
- The policy owner is a developer note and is never rendered.
- A "Preview tools" disclosure holds the controls that stand in for people and services that do not exist yet (a reviewer, a moderator, a team check, time passing). It is a labelled group (a section with a heading, or a `details` element) titled "Preview tools", marked Preview only, and set apart from the main flow.

States every working page must handle:

| State | Treatment |
|---|---|
| Sample data | `PreviewNote` plus a Sample tag on seeded items. Never shown as a real record |
| Empty | `EmptyState` with a title, one sentence saying what goes here and, where it makes sense, the action that fills it |
| Validation error | `Field` shows the message as text under the input with `role="alert"`. The error is not colour alone |
| Destructive action | Inline confirm in place of a modal: a short prompt with a confirm button and a safe "Keep it" button replaces the action, focus moves to the safe button, and the result is announced. Account > Data > Reset needs the typed phrase `RESET` |
| Success | Announced in the `Status` live region and visible as text |
| Before hydration | The first render uses the sample seed, the same as the server render, then the saved state replaces it |
| Preview tools | Disclosure described above |

### Gate (no session)

There is no sign-in in this milestone, so no route is gated. `gate.tsx` is adapted as a presentational component for the later sign-in step. It says "Sign-in is not open yet", offers a button back to Overview, and has no login link. It must not render a token, read a query string, or build a redirect that carries a credential in a URL (see mapping below). `lib/session.ts` returns no session.

### 404 and error pages

One screen each, without the shell, with the LOADOUT logo, a short tag and title, and links back into the platform. The root layout marks the whole preview `noindex`.

### No-JavaScript behaviour

- All 22 internal destinations are plain links and work without JavaScript. The sidebar is fully usable on desktop.
- On a phone without JavaScript, the dock shows its four tabs. More is a button that cannot open the sheet without script. Overview's "Where everything lives" list links to every destination, so a phone visitor without script can still reach all 23. This is an acceptance criterion.
- The theme toggle needs JavaScript. Without it the default dark theme applies.
- The OS colour-scheme is not used to set the theme; the default stays dark, matching the landing.

### Motion

- Hover and press use short colour and border changes only. Nothing bounces, loops or autoplays.
- If the sheet animates, it is one short slide and fade (about 160ms on `cubic-bezier(.22, 1, .36, 1)`).
- `prefers-reduced-motion: reduce`: no transitions, no animation, no smooth scroll. Content stays usable.

## Responsive checks

The browser check runs at 320, 390, 700, 900 and 1440px, in both themes, and at 320 and 390 with the More sheet open.

- 320: no horizontal scroll; the rail wraps without clipping; the dock shows five slots with readable labels; the More sheet is one column, labels wrap, and it scrolls inside itself; the last line of every page is reachable above the dock.
- 390: same, with the sheet still readable.
- 700: dock layout; content has no side gutter; the text measure is comfortable.
- 900: the boundary. At 900px the dock layout applies (the media query is `max-width: 900px`). At 901px the sidebar applies. Check both sides; nothing renders both.
- 1440: sidebar 260px, content column `max-width` 1120px, nothing under the sidebar or the rail.
- At every width: `document.documentElement.scrollWidth <= clientWidth`; the dock never overlaps the final content; the rail never hides a focus target (anchors use `scroll-margin-top`).
- Short windows (landscape phones, about 360px tall): the sheet still fits (viewport minus dock) and scrolls; the sidebar scrolls on desktop widths with short heights.

## Accessibility

- **Skip link:** the first focusable element, text "Skip to content", visible on focus, jumps to `main` (`id="main"`, focusable). Matches the landing's `skip-link`.
- **Landmarks:** one top `header` (the rail), one `nav` named "Platform sections", one `main`. The sidebar and the dock are the same DOM; the `nav` is not duplicated.
- **Current page:** `aria-current="page"` on exactly one link per page. The visible active mark is not colour alone.
- **Focus-visible:** every interactive element shows a visible outline (3px). The sticky rail and fixed dock must not hide the focused element.
- **Sheet focus management (the sheet is a modal dialog):** More has `aria-expanded`, `aria-controls` and `aria-haspopup="dialog"`. The sheet has `role="dialog"`, `aria-modal="true"` and is labelled by its heading. Opening moves focus to Close and makes the page behind and the sidebar groups `inert`. Tab and Shift+Tab wrap between More and the sheet. Escape closes the sheet and returns focus to More. Close, a scrim click and choosing a link all close it; Close and Escape return focus to More, and a link navigates. A switch to the wide layout closes it. Closed, the sheet is `hidden` and out of the tab order.
- **Route change focus:** after a client navigation the page begins at the top and `main` is a programmatic focus target (`tabIndex={-1}`). The implementer should verify that screen-reader users hear the new page; if they do not, move focus to the `h1` on route change.
- **Targets:** 44px minimum for sidebar rows, dock slots, sheet rows, the Close button, the theme toggle and the Accessibility link.
- **Link names:** the visible label is the accessible name (label-in-name). Docs adds hidden "(public Docs, leaves the platform)".
- **Tables:** a wide table sits in a `tbl-wrap` region with `tabIndex={0}`, `role="region"` and an accessible name, so keyboard users can scroll it and it never forces page-level horizontal scroll.
- **Feedback:** results of actions are written to a polite live region (`Status`, `role="status"`, `aria-live="polite"`). Errors sit next to their field and are also announced.
- **Destructive actions:** confirmed inline, keyboard reachable, with focus kept in place. No `window.confirm`.
- **Reduced motion:** see Motion.
- **`prefers-contrast: more`:** rules thicken to 3px, `--stroke`, `--dim` and `--mut` become the ink colour, and the focus colour becomes the ink colour; the active mark stays visible.
- **Forced colours:** the implementer must check that focus rings, the active bar and every `Tag` border remain visible; if they vanish, add system-colour fallbacks.
- **Reading size:** the user's browser text size and zoom up to 200% must not clip or overlap the sidebar, rail, dock or sheet. Text-bearing boxes use `min-height` and wrap rather than fixed heights. This tests the browser's own scaling. The optional "Reading size" setting from the landing is not ported (see exclusions).
- **Colour-vision modes:** the five landing palettes (Standard, Protanopia, Deuteranopia, Tritanopia, Achromatopsia) are not ported and not selectable here. The shell meets the underlying requirement without them: no meaning depends on hue alone (active bar, `Tag` text, external glyph), and contrast passes in both themes, so it reads under all five. Check this by simulation, not by adding palettes.
- **Contrast:** text 4.5:1, large text and UI boundaries 3:1, in both themes. The accent fill pairs with its accent-text colour, as in the Docs. Pixl's gold and teal pairs do not carry over.
- **Language and title:** `lang="en"`; `document.title` is "{Label} | LOADOUT" with the same label as the `h1`; the default is "Platform preview | LOADOUT".
- **Decoration:** icons are `aria-hidden`. Grain, rulers and ASCII art from the landing are not used in the shell.
- **Axe:** no serious or critical violations on every preview page, with the sheet closed and open, in both themes.

## Pixl to LOADOUT mapping per component

Pixl source: `references/pixl/apps/web-shell/app/(shell)/` at `8141b992e92e05583246fd914c63a101100f6fe4` (MIT, Copyright (c) 2026 Pixl). Targets are in `apps/platform`. Full path-level map: [`pixl-platform-port-map.md`](../../docs/source-audit/pixl-platform-port-map.md).

| Pixl file | LOADOUT target | Copied | Changed, and why |
|---|---|---|---|
| `nav-data.ts` | `components/shell/nav-data.ts` | The data shape idea: groups of `{slug, label}`, a `MOBILE_PRIMARY` list of four slugs, one icon per slug | Groups are Build, Community, Gear and You, not PLAY, ECONOMY and YOU. 23 items replace 13. `status`, `purpose`, `policy`, `from` and `external` are new fields so the shell can label each tab, its status and its policy owner from data. Report is removed. Docs is an external item. Labels are plain text |
| `nav-data.ts` icon table (`ICONS`, `MORE_ICON`, `PALETTE_ICON`) | `components/shell/icons.tsx` | Whole-pixel `<rect>` geometry on a 16 by 16 grid, one `currentColor` fill, for the tabs LOADOUT shares with Pixl | Icons are data rendered as React SVG elements, not strings, so there is no `dangerouslySetInnerHTML`. Tabs Pixl did not have get original LOADOUT icons in the same style. The Pixl `RE_ICON` (Restoration Energy) is not used |
| `shell-nav.tsx` | `components/shell/shell-nav.tsx` | The structure: fixed sidebar with grouped links, `usePathname` active matching, a bottom dock with four primary tabs and a MORE sheet | Removed `dangerouslySetInnerHTML` icons. Added `aria-current="page"`, visible focus rings, `aria-expanded`/`aria-controls`, a labelled modal sheet with Close, `inert` background, focus into the sheet and back to More, Tab wrap, Escape handling, and a grouped sheet (Pixl's was a flat grid). Removed the Pixels, Restoration Energy and Core Integrity chips, "BACK TO GAME", the game URL logic and the click-outside listener. The top rail is split into `top-rail.tsx`; the theme control is `theme-toggle.tsx`, a toggle on `loadout-theme` rather than a menu of Pixl-branded themes on `pixl_theme_v2` |
| `layout.tsx` | `app/(participant)/layout.tsx` | A shell layout wrapping `children` in `main` with the nav | Removed the session read, the `serverApi` wallet and events fetches, and the `x-pixl-path` header. The layout renders only static data. Added the skip link target (`main#main`) |
| `gate.tsx` | `components/shell/gate.tsx` | A centred signed-out card component | Removed the Pixl boot-splash image, "part of the Pixl world" copy, and the login link that carried the current URL. Presentational only; unused until sign-in exists |
| `app/globals.css` shell rules | `app/globals.css` | Layout geometry: 260px sidebar, 54px rail, bottom dock and MORE sheet at 900px | Pixl palette, fonts, Pixl shadows, the custom Pixl cursor and `/img/...` URLs are replaced by LOADOUT tokens and fonts, and the system cursor. Square corners and pixel signage are LOADOUT style. Added focus-visible, `prefers-contrast`, `prefers-reduced-motion`, safe-area and `min-width: 0` rules |
| `app/page.tsx` | `app/page.tsx` | A root redirect | Redirects to `/overview`, not `/docs` |
| `app/layout.tsx` | `app/layout.tsx` | Root layout and font variables | LOADOUT's self-hosted fonts through `next/font/local` (the same open-licence files as the landing), `noindex` robots, the theme-init script, `lang="en"` |

New in LOADOUT, not from Pixl: `[section]/page.tsx` (looks the slug up in `components/pages/registry.ts`), the page modules under `components/pages/`, `components/ui/`, `lib/preview-store.ts`, `lib/ore-ledger.ts`, `lib/notifications.ts`, `lib/sample/builders.ts`, `logo.tsx` (the landing's helmet mark), `standalone-page.tsx`, `not-found.tsx`, `error.tsx`, `lib/landing.ts`, `lib/navigation.ts`, `lib/session.ts`, `lib/theme.ts`.

Not carried over, by design: the dashboard page and its CSS (`(shell)/dashboard/`), `app/api/login`, `app/api/proxy`, `proxy.ts`, `lib/session*`, `lib/server-api.ts`, `lib/urls.ts` (game URL and login URL), `app/form`, `app/docs`, `lib/docs.ts`, and `app/_generated/config.ts`. Reasons are in the port map.

### Security changes from Pixl, stated plainly

- `dangerouslySetInnerHTML` for icons is removed. Pixl wrote SVG markup into the page from strings; LOADOUT renders React SVG elements. One use remains in the root layout: the theme-init script, a constant string in `lib/theme.ts` with no user input. It must stay a constant.
- The token-in-URL login is not ported. Pixl's flow returns a session token in the query string (`?token=`) and `proxy.ts` converts it to a cookie, backed by a nonce cookie against login CSRF. That handoff puts a credential in URLs, browser history and referrers. LOADOUT designs its own session flow in Phase 2 of the plan.
- The wildcard CORS policy on Pixl's server (`Access-Control-Allow-Origin: *`, justified there because tokens travel in the query string) is not ported and has no equivalent in this milestone, which has no API.

## Skills

AGENTS.md and [`docs/development/ui-skills.md`](../../docs/development/ui-skills.md) require all seven named skills to be loaded before a UI change. This brief does not claim any were loaded. **The implementer must list the skills actually loaded, and the checks actually run, in the PR description.** Where a skill was unavailable, say so.

How each applies to this milestone:

| Skill | Applies to this change |
|---|---|
| `frontend-design-ui-ux` | This brief. |
| `frontend-design` | The design read and direction above; implementation quality of the shell. |
| `design-taste-frontend` | Audit of the existing Pixl shell and the LOADOUT design system before restyling; anti-slop check against DESIGN.md bans (no fake dashboards, no repeated equal-card grids as decoration, no glow or glass). |
| `emilkowal-animations` | Hover and press transitions, any sheet motion, reduced-motion behaviour. |
| `svg-design` | `icons.tsx` and the logo: the 16 by 16 SVG marks, accessibility attributes, no inline HTML strings. |
| `pixel-art-sprites` | New icons for tabs Pixl did not have (silhouette check at the real display size, constrained one-colour fill). |
| `Pixel Art Animator` | Not applicable: there is no frame-based sprite animation in this milestone. State that in the PR rather than inventing a task. |

## Acceptance criteria

1. `apps/platform` builds and runs separately. `apps/landing` still builds and its checks are unchanged.
2. The route list contains the 22 internal slugs from `nav-data.ts` plus an external Docs link, and `/` redirects to `/overview`. Any other path is the 404. The sidebar, the sheet, Overview's list and `nav-data.ts` agree on the 23 labels, order and groups (Build 6, Community 7, Gear 6, You 4). The Report tab does not exist.
3. Every preview page shows its `h1`, the purpose sentence and a `PreviewNote`, and its feature works end to end on sample data: create, edit, delete, reload, reset. Every seeded item is marked Sample, every invented rule is labelled "Draft preview rule", and nothing implies a real balance, rank, date, price, stock or delivery. Every empty state, validation error and destructive confirm is reachable and readable.
4. At 320, 390, 700, 900 and 1440px, in both themes, there is no horizontal scroll and the dock never covers content (the last line and focused elements are reachable).
5. At 900px the dock layout applies; at 901px the sidebar layout applies; nothing renders both.
6. Desktop sidebar: 260px, scrolls internally at short heights, all 23 items reachable by keyboard.
7. Phone More sheet: grouped, 19 destinations, no duplicates of the dock tabs, labels never truncated at 320px, scrolls inside itself.
8. Keyboard: the skip link is first; Tab order follows visual order; the sheet opens on Enter or Space, moves focus to Close, wraps Tab, Escape closes it and returns focus to More; the page behind is inert while it is open.
9. `aria-current="page"` is on exactly one link per page; the active state is visible without colour.
10. There are no "Soon" or "not available" tags anywhere. Docs shows the external glyph. The top rail shows "Preview: sample data".
11. With JavaScript disabled on a phone-width viewport, all 23 destinations remain reachable (through Overview's list).
12. The theme toggle reads and writes `loadout-theme` (`dark` or `light`), defaults to dark, survives reload, and does not flash the wrong theme on load.
13. Under `prefers-reduced-motion: reduce` nothing transitions or animates; under `prefers-contrast: more` rules strengthen; under forced colours focus and the active mark remain visible.
14. At 200% browser zoom and with enlarged browser text size, no shell element clips or overlaps content.
15. Axe: no serious or critical violations, sheet closed and open, both themes.
16. No `dangerouslySetInnerHTML` other than the constant theme-init script, no credential in any URL, no login control, no network call to a Pixl host, and no Pixl image, font, colour or logo in the output.
17. `docs/source-audit/ATTRIBUTION.md` lists every adapted file and the reference material read for the preview pages; the PR lists the skills actually loaded and the checks actually run.
18. Every table that can overflow sits in a labelled, focusable scroll region (`tabIndex={0}`, `role="region"`), and no page scrolls sideways at 320px.
19. Every action that changes state gives feedback in a polite live region (`role="status"`), and every form error is text next to its field.
20. Every destructive action confirms inline with a safe default, and Account > Data > Reset needs the typed phrase `RESET`.
21. State survives a reload through `localStorage` keys prefixed `loadout-platform:v1:`, Reset removes all of them, and the first render matches the server render (no hydration warning).
22. No page makes a network call to LOADOUT or any other host. Every sample item is labelled Sample, and every rule the plans leave open is labelled "Draft preview rule".

## Deliberately excluded

- Pixl's game, world, regions, NPCs, quest log, Restoration Energy, Core Integrity, Pixels and every Pixl currency or economy number.
- The Report tab (a Pixl player-report page tied to game chat moderation). If the owner assigns it a LOADOUT job, it needs its own brief.
- Pixl art, brand and fonts: logo, boot splash, cursor art, the Poppins/Pixelify stack as Pixl uses it, badge and icon images, and anything under Pixl's `img/` folder. Phantom Sans and other non-MIT assets stay excluded unless the owner confirms the permission covers them (open question in the port map).
- Pixl's staff dashboard (`apps/dashboard`), Pixorpheus (`apps/pixorpheus`, AGPL-3.0), the Pixl docs engine, and the public no-account forms.
- Presenting any preview figure as a real wallet value, level or live status. (The rail's Ore chip shows the sample balance and says so.)
- The Accessibility preferences dialog and display-preferences store (see above).

## Open questions for the owner

- Written evidence of the reuse permission (see DECISIONS.md and ATTRIBUTION.md).
- Production hostname and how the landing app links to the platform (rewrite or separate host). This also decides whether `loadout-theme` is shared and what `NEXT_PUBLIC_LANDING_URL` is.
- Confirm Wishlist is a new tab and that Pixl `vault` informs Seasons only (see note 1).
- Whether the rail's sample Ore chip stays or goes.
- Whether the shell needs a visible "Back to LOADOUT" link to the public homepage. Today the wordmark goes to Overview, and only Docs and Accessibility settings link to the public site.
- When to retire the preview override and return to "real records only". The condition is in `docs/source-audit/DECISIONS.md` (2026-10-20, "Preview milestone ships working features on sample data"). The unsettled rules are listed in `docs/source-audit/platform-preview-open-questions.md`.
- Whether a shared display-preferences module comes before or after the first live tab.

## Build handoff

The preview implementation is merged to `development` in PR #134 against this brief. Deviations from the acceptance criteria are recorded in the PR description. Nothing here authorises real sign-in, real data, a backend, or a policy change. The preview rules in "Draft preview rule" labels are placeholders, not proposals.
