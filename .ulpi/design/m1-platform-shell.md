# M1 design brief: participant shell, builder overview, admin basics

**Status:** Design spec for milestone M1 (see [participant-platform-milestones.md](../../plans/proposals/participant-platform-milestones.md)). Implemented on `feature/participant-platform-m1`. Not reviewed by the owner yet.
**Binds to:** [LOADOUT design system](../../docs/design/system/design-system.md) and [DESIGN.md](DESIGN.md). Only the design system and code are current; this brief records the M1 decisions.

## Design read

A field instrument panel for a builder who needs to see the state of their own work. It is plain, measured and factual. No game chrome, no glass, no sample numbers, no decorative graphs. Empty states are the normal first screen, so they must read as the designed state, not as a broken one.

Counterfactual test: a screen could belong to any SaaS dashboard unless it carries the field-manual rules (hard rules, square corners, pixel headings, one accent per theme). The shell reuses the homepage tokens and Jersey/Pixelify type, not a new palette.

## Scope (M1 only)

In: sign-in (local test accounts only, until G1), session, the shell, overview (real data only), projects list (empty until M2), settings (display preferences and sign-out), admin users with roles and bans, admin audit log, admin feature flags.

Out: Ship, Earn and Community groups (no live pages yet, so the shell does not show empty tabs for them); Hack Club Auth; Hackatime; journals; Ore; shop; notifications; export and deletion (M2).

## Navigation

- Revised 30 Oct 2026 (owner choice from the direction drafts): no sidebar. On desktop (900 px and up) the pages are text tokens in the top bar, between the wordmark and the account controls. The current page is shown in brackets, `[ OVERVIEW ]`, in the link accent colour, so it does not rely on colour alone. The brackets are decoration with no spoken text. Labels are visible, never icon-only.
- On narrow screens a labelled menu button in the top bar opens a vertical list under it, with each group's heading visible.
- Tabs, agreed 30 Oct 2026: Overview and Projects are live in M1; Shop, Explore, Community and Expeditions are placeholder tabs until their milestones. Ship lives inside Projects. There is no You tab yet: it waits for the character icon design. Settings is a text link in the top bar, not a tab.
- Placeholder tabs are the one exception to "no coming soon pages" in the Pages section below. Each one says in plain words when it opens, in one sentence, and shows no figures, names or sample data.
- The top bar carries only the user icon at the top right, a placeholder that links to Settings for now. Settings, Accessibility and Sign out live on the Settings page until the profile menu replaces the icon.
- The staff group (Users, Audit log, Flags) follows the tabs after a vertical rule on desktop, shown only to holders of the staff role. Its label is shown on desktop, and the tab group heading stays for screen readers only.
- The current page has `aria-current="page"`. The nav landmark has the accessible name `Participant`.
- Keyboard: the skip link is first; Tab order follows the visual order; no focus trap.

## Pages and states

### Sign-in (`/dashboard/sign-in`)

- Production (no local test flag): heading, one sentence "Sign-in opens once Hack Club Auth is connected. Until then this page is closed." No form. Status code 200, no account data.
- Local test mode: a form with one field, the test account's email, and one button. Error: "No test account has that email." (inline, below the field, linked from the field via `aria-describedby`).
- Banned account: "This account cannot sign in. Contact the team." No reason given (the reason is staff-only).

### Overview (`/dashboard`)

- Heading "Overview". A summary strip with three facts that exist in M1: Projects (count), Roles (the signed-in person's role grants), Account state (active or banned, though banned users never reach here).
- Projects count is `0` on a new account, shown as "No projects yet" with one sentence explaining the first step. There is no Ore, level or rank figure in M1, so none is shown.
- Loading: none needed; the page is server-rendered. Error: a generic message and a retry link (reload).

### Projects (`/dashboard/projects`)

- Heading "Projects". The list is empty in M1: a designed empty state with a sentence saying projects open in a later release. No create button in M1.

### Settings (`/dashboard/settings`)

- Reuses the existing `AccessibilitySettings` page layout so the display preferences match the homepage and Docs exactly.
- Sign out button (native form POST). Account details shown: display name and email.

### Admin: users (`/dashboard/staff/users`)

- Table with columns Name, Email, Roles, Status. Empty state if no users match search.
- Row action opens a side panel (not a new page) with: role grants (checkbox per role), ban toggle. Both require a reason field (required, min 10 characters). Submit records one audit event per change.
- Errors: inline below the reason field, announced by the field's `aria-describedby`.

### Admin: audit log (`/dashboard/staff/audit`)

- Newest first, 50 rows per page with Previous and Next links. Columns: time, actor, action, target, reason. Empty state: "No staff actions yet."

### Admin: feature flags (`/dashboard/staff/flags`)

- List of flags with name, description and state. Toggle form with reason, same validation as users. A flag absent from the table is off.

## Components

- **Shell** (`DashboardShell`): sidebar nav, main landmark, page heading. Props: `currentPath`, `staff: boolean`, `person: {name}`.
- **EmptyState**: title, sentence, optional link. Never a placeholder number.
- **ReasonForm**: a text field (required, 10 to 500 characters) and a submit button. Errors inline.
- **DataTable**: native `table`, `th scope="col"`, headers always visible, cells wrap at phone width (the GOV.UK table rule already in the design system).

## Responsive

- Phone (320 to 430 px): single column; the nav becomes the disclosure; tables wrap cells, no horizontal page scroll.
- Desktop (1024 px and up): two columns, sidebar 240 px, content max width 960 px.
- Tested at 375 px and 1440 px (the e2e suite convention in the accessibility record).

## Accessibility

- WCAG 2.2 AA. The axe suite runs on every M1 page in both themes.
- Focus: the existing visible `:focus-visible` outline.
- Reduced motion: M1 adds no motion. The shell has no transitions except the existing hover state.
- Plain language: short sentences; no jargon; no em dashes in visible copy.
- Forms: visible labels above inputs; errors below; no placeholder-only labels.

## Copy rules

- No em dashes (—) or en dashes in visible text. Hyphens only.
- No sample or example numbers. No "coming soon" pages: a page either works or does not exist yet.

## States coverage

| Page | Loading | Empty | Partial | Success | Error | Edge |
|---|---|---|---|---|---|---|
| Sign-in | n/a (form) | n/a | n/a | redirect to overview | inline unknown email | banned, production closed |
| Overview | server-rendered | "No projects yet" | n/a | counts shown | generic + reload | expired session redirects |
| Projects | server-rendered | empty state | n/a | n/a (M2) | generic | expired session redirects |
| Settings | client prefs | n/a | n/a | prefs saved locally | n/a | sign-out |
| Staff users | server | no matches | n/a | role/ban saved, audit row | inline reason error | non-staff gets 404 |
| Audit | server | "No staff actions yet." | last page | rows | generic | page out of range shows page 1 |
| Flags | server | no flags | n/a | toggled, audit row | inline reason error | absent flag shown as off |

## Build handoff

- Implementer: this repository's engineering session (the build is done in-session, not by a delegated agent; no subagent was requested).
- Acceptance: each row above behaves as stated; axe reports zero violations on every M1 page in both themes at 375 and 1440 px; `bun run typecheck`, `bun run lint`, `bun run test` and `bun run build` pass; no page shows a number that is not from the database.

## Skill pass record

- Loaded and applied: `frontend-design-ui-ux` (this brief), `frontend-design` (direction: field instrument, not dashboard template), `design-taste-frontend` (no fake dashboards, no sample data, no decorative dots, copy checked for em dashes).
- Not loaded in this session: `emilkowal-animations` (M1 adds no motion), `svg-design` and `pixel-art-sprites` and `pixel-art-animator` (M1 adds no SVG or sprite assets). These are disclosed rather than claimed.

## Overview (revised 30 Oct 2026)

Decisions, from the owner's review of the direction drafts:
- Navigation stays in the top bar, not a sidebar. Six tabs and the staff group fit in one row at desktop width, and the full width is kept for track bars and tables. Pixl needed a sidebar because it had 23 tabs.
- The content column is centred at 1080px, as on the Pixl and Stasis dashboards. Text inside stays left-aligned for reading.

Content, top to bottom:
1. Title and one line of lead text.
2. Three facts: Ore on hand, Projects, and the next step (Start a project, or Write a journal entry).
3. Tracks: four rows (Tools, Systems, Compute, Hardware). Each shows a 15-cell bar, one cell per level, and the status. Track XP is separate from Ore.
4. Two columns: Projects (counts by status, or an empty state) and Recent activity (an empty state until ship decisions and journal entries exist).

Rules for every figure: none is shown until it comes from the database. Tracks read Not started at level zero, and Ore reads zero until approved hours exist.
Left out for now: the depth readout from the drafts (not in the plans; needs an owner decision), Restoration Energy, trials, rolls and leaderboards.

## Sign-in removed (31 Oct 2026)

Sign-in and sign-out are removed until Hack Club Auth is connected. The platform opens directly:
- Locally, the dashboard opens as the builder test account. Set LOADOUT_PREVIEW_ROLE=staff in .env.local to open as staff.
- In production, with no sign-in, the shell shows an "Opening soon" notice.
Settings no longer has Sign out. The profile icon will open the account menu later.

## Shell and Overview (revised 31 Oct 2026)

Decisions, from the owner's review against the YSWS references (Pixl, Stardance, Stasis) and the homepage:
- Shell: the top bar stays, with the homepage's framed nav (2px ink border, slight radius, thin hard shadow). At the right sits an Ore chip, showing 0 until approved hours exist, next to the user icon. Pixl's top rail and Stardance's balance show the player's key number on every page, and this follows them. No sidebar.
- Overview headline: the homepage's display-size pixel heading, with its meta labels above (location and "4 tracks, Tools to Hardware", the same copy as the homepage hero) and corner brackets around the title. No sample numbers.
- Tracks: four cards from the homepage Tracks section (same copy from `app/_components/home/tracks-data.ts`), each with its pixel icon, the "what you could build" line, its tag, and the status "Not started". The 15-cell level bar is out of the Overview for now; `levelCells` remains in `lib/platform/progress.ts` for when levels exist.
- Empty states: Projects and Recent activity become one "Start here" block. It says projects open in a later release, and it lists status counts and a link once a project exists. Recent activity returns with its own content when ship decisions and journal entries exist.
- Phone fixes (31 Oct 2026, same day): the wordmark uses the homepage nav's size and tracking (Jersey 10, 31px on phones, 36px wide). The top bar is one row on phones: wordmark, Ore chip, user icon, then Menu. The Ore gem is the sprite used as a mask, so it takes the accent colour (blue in dark mode). Ore and Projects share a row under the headline, and the next step takes the full width. The headline size follows the viewport so it fits at 320px.
