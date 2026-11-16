# Participant platform: Profile and Toolbelt

**Status:** product spec, 16 Nov 2026, from the owner's request ("how a profile looks, how people can add a public project to their project to qualify for the Toolbelt") and `plans/proposals/toolbelt.md` + `plans/proposals/platform-roadmap.md` (P3). This file is the contract for the data, rules and screens; the UX and layout detail is added by the design-spec step (`frontend-design-ui-ux`) in section "UX spec" below before any UI code. The participant platform keeps the LOADOUT design system (`.ulpi/design/DESIGN.md`, `docs/design/system/design-system.md`): this is NOT the reviewer site, which has its own Pixl look.

## Rules this builds on (do not change them)

- One track per project, locked on submit ([[one-track-per-project]]; `lib/platform/projects.ts` `trackLocked`).
- Levels, depth, Ore come from approved hours, which do not exist yet: the platform shows the sample hours the dashboard already uses (`sampleTrackHours`, `projectHours`). Nothing here may present sample numbers as real earnings, and no Ore is paid by this work.
- Handles only, no real names, schools or locations (ages 13 to 18). The participant sees a handle, never an email.
- Toolbelt (plans/proposals/toolbelt.md, decided 14 Nov 2026): a builder may equip **up to two** accepted, **open-source** tool/projects into one of their own projects; each equip needs a use note that names the file or feature; **no Track XP** from equipping; the equip counts only after the **significant-use gate**: the equipping project has at least **25 approved hours**, the tool is used in a core part, the journal shows real use, and a reviewer confirms. Provisional values (shown as provisional): user gets **50 Ore once per tool/project**, maker gets **10 Ore per verified user**, capped at **500 Ore per tool/project per season**. A maker can **block** a builder from equipping their tool/project. Equips and use notes are public like journals. No direct messages.

## Data model (Prisma, new migration)

- `Person.handle String? @unique` (3 to 24 characters, `a-z`, `0-9`, `_`, `-`, lower-case, must start with a letter, no reserved words such as `admin`, `staff`, `loadout`, `review`, `me`), `Person.bio String?` (max 160 characters).
- `Project.repoUrl String?` (public source address, https only), `Project.demoUrl String?`, `Project.pinned Boolean @default(false)`, `Project.hidden Boolean @default(false)` (owner hides it from the public profile and Explore), `Project.showBuilding Boolean @default(false)` (show a logging project as "currently building").
- `ToolbeltUse { id, projectId (the equipping project), toolId (an approved project), note String, status "pending" | "confirmed" | "declined", createdAt, decidedAt? }`, unique `(projectId, toolId)`, indexes on both. At most two rows per `projectId` that are pending or confirmed (enforced in code and by a partial check in the action).
- `ToolbeltBlock { id, makerId (Person), blockedId (Person), createdAt }`, unique `(makerId, blockedId)`.
- All reads and writes go through `lib/platform/` modules with pure rules in their own files and bun tests; server actions follow the pattern in `lib/platform/actions.ts` (viewer required, owner checks, plain error messages, audit events where the app already audits).

## Profile

- **Routes:** `/dashboard/profile` (your own; edit handle, bio, pins, visibility) and `/dashboard/builders/[handle]` (another builder's public view; a person's own handle redirects to `/dashboard/profile`). Both need a signed-in builder like Explore does. A builder without a handle sees a prompt to choose one and has no public profile until they do. Unknown handle, banned person or no handle: plain 404. Add a Profile entry reachable from the top-bar account control and from Settings; the seven top-level tabs stay as they are.
- **Identity card:** handle, avatar mark (initial, no uploads), bio (160 characters), joined month, highest track and its level.
- **Loadout:** the four track levels with the existing `LevelStrip`/`LevelCells` components, total depth, total approved hours (sample until the ledger exists, labelled as the dashboard labels it).
- **Projects, all of them:** a tabbed list. Own view: every project in every state (Draft, Logging, Submitted, In review, Needs changes, Approved) with a count per tab, filter by track, sort by recent, each row with cover, track, status, hours and the Toolbelt count; it is the same data as `/dashboard/projects`, embedded so there is one place to look. Public view: approved projects plus logging projects the owner chose to show as building; drafts, in review and hidden projects never appear. Up to **3 pinned** approved projects form a strip above the list.
- **Toolbelt section:** tools this builder has equipped (confirmed ones) and builders using their tools (count and handles of confirmed users).
- **Recent activity:** recent journal entries on public projects. Journals do not exist yet: show an honest empty state.
- **Privacy:** handle only. Owner can hide any project. No follower graph in v1, no messages.

## Toolbelt

- **On your own project page** (`/dashboard/projects/[id]`): a Toolbelt section. Shows equipped tools (max 2) with status chip and words (Pending, Confirmed, Declined), the use note, Remove. "Equip a tool" opens a dialog: search approved, open-source (repoUrl set), not hidden, not your own, not blocked-by-maker projects; choose one; write the use note (10 to 500 characters, must name a file or feature: show the hint); submit creates a pending use. A gate card shows the four conditions with the project's approved hours against 25 (sample until the ledger exists) and says a reviewer confirms; it never claims anything is paid. Equipping is allowed while the project is a draft, logging or needs changes; confirmation only happens at review (not built here).
- **On your own approved project (maker view):** "Toolbelt users": builders who equipped it, status, and a Block button (with confirmation) that prevents new equips and marks existing pending ones declined.
- **Explore:** project cards and detail show "Used by N" (confirmed uses only) and, on the detail page, who equipped it (handles) and the maker's profile link. The detail page lists the tools this project equips.
- **Rewards text** appears once on the Toolbelt section as a provisional note (the numbers above), with a link to the Docs Toolbelt page if one exists (`content/docs`: check) and never as a promise of Ore.
- **Reviewer side (sample site):** the reviewer desk may later show Toolbelt equips for the gate; out of scope here, but add the read helper `listUsesForProject(projectId)` so the desk adapter can use it.

## Local development data

Extend `scripts/seed-local-accounts.ts` (dev only, behind `localTestAccountsEnabled`) so the local database has a few builders with handles, bios and approved open-source projects (repoUrl on `.example`/real GitHub-style addresses, no real people), plus one pending and one confirmed Toolbelt use, so Explore, Profile and Toolbelt are not empty. Re-run with `bun run db:seed:local`.

## Out of scope

Real approved hours, Ore payouts, reviewer confirmation of the gate, journals, notifications, uploads, followers, messaging, Hack Club Auth.

## Acceptance

`bun run typecheck`, `bun run lint`, `bun run test` green; Prisma migration applies on a clean database and on the existing one (`bun run db:migrate` or `prisma migrate deploy` against the local Postgres); pages render for the local builder accounts; 404 rules hold; a builder cannot equip their own project, a hidden or non-open-source project, a fifth tool, a duplicate, a blocked maker's tool; handle rules enforced on the server; keyboard and screen-reader sound; both themes; 390 px.

## UX spec

**Status:** design spec, 16 Nov 2026. Binds to `.ulpi/design/DESIGN.md`, `docs/design/system/design-system.md` and the real platform code (`platform.css`, `page-head.css`). No production code is written by this step. Not reviewed by the owner yet. Visible strings below use no em or en dashes; write "13 to 18", not a range with a dash.

### 0. Skills, design read and what was looked at

- Skills loaded in this pass: `frontend-design-ui-ux`, `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites`, `pixel-art-animator` (all seven loaded through the Skill tool). Applied: the first four. `svg-design`, `pixel-art-sprites` and `pixel-art-animator` were loaded and consulted but not applied, because this work needs no new SVG, sprite or frame animation: the avatar is a letter, the chips are words, the only pictograms reused are the existing head-and-shoulders icon and the back arrow. Do not add a sprite task to the build.
- Looked at (live, dev server on port 3010, builder test account): Overview, Projects (empty and with one project), a project page (1440 and 390, dark, plus light at 1440), the Edit project dialog, Explore (empty, 1440), Settings. Screenshots are in the session scratchpad `screenshots10` folder (not committed).
- **Design read.** A builder's service record on the core wall: plain, measured, factual. A profile here is a field ID plate plus the work that has been through review, not a social page. Nobody is ranked, counted or followed.
- **Direction.** The existing LOADOUT industrial signage direction (graphite or stone paper, hard 1px rules, 4px hard shadows, square corners, pixel headings, IBM Plex Mono for reading, track strata colours). Dials: variance 4, motion 1, density 5. This is a product screen set, so the register is the platform's, not the homepage's.
- **Differentiation anchor.** Two things carry the identity. (1) The ID plate: a square paper plate with the handle's first letter in Jersey 10 and a strip along its foot in the builder's top track colour, drawn like the `pf-profile-slot` square. (2) The Toolbelt is exactly **two slots**, shown as two physical slots on a belt: a filled slot is a solid plate, an empty slot is the dashed "New project" pattern with the action in it. The product rule (up to two) becomes the layout, so nobody needs to read a rule to learn it.
- **Counterfactual test.** The generic answer to "profile page" is a round avatar, a follower count, a row of stat cards and ARIA tabs. This spec has none of those: no follower numbers, no round avatar, no stat-card row, no ARIA tab widget, no decorative dots or badges. If a screenshot of these screens with the nav removed could belong to any hobby-project site, it failed.
- **Slop check (named bans).** No gradients, glow or glass; no cards inside cards (a slot is a plate inside a `pf-box` heading section, not a card in a card: the slots sit directly on the box, the box has no inner panel background); no repeated equal-card grid except the existing project grid the platform already uses; no fake dashboard figures; no decorative bolts.

### 1. Rules this spec applies (and what it will not do)

- **Handle is the only public identity.** Everywhere another builder can see a person, show the handle (linked to the public profile), never `displayName` or email. This changes three existing places, which are part of this work: Explore cards say "by {handle}" (today `displayName`), the Explore detail "Builder" cell shows the handle, and Explore search matches the handle, not the display name (the placeholder stays "Find a project or a builder"). A builder with no handle shows as the plain text "a builder", unlinked, and cannot be searched by name. Banned people's projects and handles are excluded from Explore, search, the equip list and "Used by" lists.
- **Sample numbers.** The platform shows sample track hours (`sampleTrackHours(track)`, same figures for everyone) and no "Sample" label, by the owner's 31 Oct decision. This spec adds no label either. The protection is structural: **Ore earned is never shown** on these screens, the Toolbelt gate card never says anything is paid, the rewards note says "not paid yet", and the gate's hours come from `projectHours`, which is 0 today (real, not sample). Do not add chips or footnotes saying "Sample".
- **Public levels need an owner decision (Q1).** `sampleTrackHours` takes a track only, so every builder has identical levels (LV.8 Tools). Showing them on other people's public profiles would present the same invented figures as 20 different people's records. Default specified here: the **own view** shows levels exactly as the Overview does; the **public view hides the Loadout block** and the "Top track" cell, and says "Levels show here once approved hours are recorded." One constant (`PUBLIC_LEVELS_ENABLED = false`) switches it on when per-person hours exist.
- **Two depths already disagree.** The Overview shows -74 M (track samples), the Projects tab shows 0 M (`projectHours`). The profile's Loadout block takes its levels, depth and approved hours from the Overview source (`sampleTrackHours`, summed with `sumHours`), and every per-project figure from `projectHours`. They will visibly differ until the ledger exists (Q2). Do not reconcile them in this work.
- **No new tokens.** Colours, fonts, radii (square), shadows and breakpoints (560, 720 where already used, 900) come from `platform.css`. No new colour, font or radius.
- **No new product rules.** Max two tools, no Track XP from equipping, rewards as provisional text, no messages, no followers. Rewards numbers appear once, in the Toolbelt section's provisional note.

### 2. Information architecture and URLs

| Page | URL | Who | Notes |
| --- | --- | --- | --- |
| Own profile | `/dashboard/profile` | signed-in builder | Edit handle and bio, see every project, pins and visibility |
| Public profile | `/dashboard/builders/[handle]` | any signed-in builder | Own handle redirects to `/dashboard/profile`. Lookup is lower-case; a mixed-case handle redirects to lower-case |
| Projects filter | `?tab=all|draft|logging|submitted|in-review|needs-changes|approved|building` and `&track=tools|systems|compute|hardware` | on both profile pages | State lives in the address, like Explore and Shop. Links end in `#profile-projects` so the page stays at the list |
| Own project | `/dashboard/projects/[id]` | owner | Gains the Toolbelt section and, when approved, "Toolbelt users" |
| Explore detail | `/dashboard/explore/[id]` | signed-in builder | Gains "Used by", "Tools in this project" and source links |
| Account control | top bar, right | everyone | A disclosure with two links, Profile and Settings |

- The seven top-level tabs do not change. Profile has no tab; it lives behind the account control and Settings. Nav `isCurrent`: `/dashboard/profile` and `/dashboard/builders/*` highlight no tab (they are reached from the account control or from a handle link); the account button shows the current state (see 3.9).
- 404 (the existing `notFound()` page): unknown handle, a person who is banned, and a handle that does not exist. A person with no handle cannot be reached by any URL. There are no "private profile" pages: a builder with a handle is public to signed-in builders.
- **Why filter links and not ARIA tabs.** The project list is server-rendered, the state is shareable, and Explore and Shop already use `nav` filter links with `aria-current` and counts. A real tab widget would need arrow-key roving, panel wiring and client state for no gain. Follow `pf-explore-filters`.

### 3. Screens and blocks

All widths below refer to the content column (`pf-main`, max 1080 px, 16 px gutters on phones, 24 px from 720). "1440" means the desktop layout from 900 px up; "390" means the single column below 560 px; 560 to 899 px uses the phone layout with two-up grids where noted.

#### 3.1 Profile page, shared frame (own and public)

Order, top to bottom:

1. Crumbs row (`pf-crumbs`): own view has only the **Edit profile** button on the right; public view has "Back to Explore" (`pf-back`) on the left.
2. Identity card (3.2).
3. Pinned strip (3.3), only if there is something to show.
4. Loadout block (3.4), own view only (public view: see Q1).
5. Projects (3.5).
6. Two-up row (`pf-split`, one column on phones): Toolbelt (3.6) and Recent activity (3.7).

The page `h1` is visible: the handle (as the project page shows the project name), so `h1` is `@`-less text, for example `ferrite`. An own profile without a handle shows "Your profile" as the h1.

#### 3.2 Identity card

- **1440.** One row, two columns: the ID plate (112 px square) and the text column. Text column: `h1` handle in the `pf-project-head h1` style, then the bio as `pf-project-lead`, then a `pf-meta-box` (the same boxed `dl` as the project page) with cells **Joined** (month and year, "Nov 2026"), **Top track** (own view only: track name with its swatch and "LV.8"), **Projects** (public count: approved plus shown-as-building) and **Toolbelt** (confirmed tools equipped, as a number). Own view adds one `pf-hint` line under the box: "Other builders see your approved projects and the ones you show as building. Drafts and work in review stay private."
- **390.** The plate shrinks to 72 px and sits left of the handle; the bio and meta box go full width below. The meta box wraps to two cells per row (it already wraps).
- **ID plate** (`pf-prof-plate`): square, `--pf-panel` background, 1px `--pf-fg` border, `3px 3px 0 var(--pf-edge)` shadow like `pf-profile-slot`. The first letter of the handle, upper-case, Jersey 10 (`--font-display`), 3.5em, colour `--pf-fg`. Along the foot, an 8 px strip in the builder's top track colour (`data-track` + `--tk`); without a top track (public view, or no hours) the strip is `--pf-rule`. The strip is decoration (`aria-hidden`); the plate is `aria-hidden` too, since the handle is in the h1. Text is never placed on the track colour, so contrast holds in both themes.
- **Bio.** Plain text, 160 characters, rendered as text (never as HTML or links). Preserve single line breaks off (one paragraph).
- **States.**
  - Own, handle and bio set: as above.
  - Own, **no handle yet**: the h1 reads "Your profile". Instead of the plate and meta box, a `pf-next` block (the Overview "Next up" pattern): kicker "Next up", `h2` "Choose a handle", text "Your handle is how other builders see you. Until you choose one, you have no public profile.", primary button "Choose a handle" which opens the profile dialog. Loadout and Projects still render below, so the page is useful before the choice.
  - Own, handle but **no bio**: bio line reads "No bio yet." (`pf-muted`).
  - Public, no bio: the bio line is omitted, no placeholder.
  - Own view, handle just saved: a `role="status"` line under the h1 area reads "Profile saved." for the session only (do not persist).
  - Public, **banned or unknown**: 404.
  - Public, own handle: redirect to `/dashboard/profile` (no flash).

#### 3.3 Pinned strip

- Up to **3** pinned approved projects. Compact plates, not full cards, so projects are not drawn twice in two sizes. Heading `h2` "Pinned" (`pf-box h2` style, no box background; a top rule `pf-section` like Overview's Tracks).
- **1440.** Three columns (`repeat(3, minmax(0, 1fr))` from 900 px; one column below 900). Each plate (`pf-prof-pin`, a link): the project title (pixel, 1.125em, one line with ellipsis), a line with the track swatch and track name, then "{n} H approved" and "Used by {n}". Border 1px `--pf-fg`, hard 4px shadow, lift and `--pf-link` border on hover like `pf-project-card`.
- **390.** One column, stacked, same plate.
- **Own view.** Empty slots show as dashed plates ("Pin an approved project", not a button, just text with the hint "Use Pin on a project below.") only while there is at least one approved, unpinned project. With no approved project the strip is omitted entirely.
- **Public view.** Filled plates only; the strip is omitted at 0 pins.
- Order: the order pinned (oldest pin first). No drag reordering in v1.

#### 3.4 Loadout block (own view)

- Reuse the `CoreGauge` look (`pf-gauge`, `pf-bands`, `pf-band`, `pf-cells`), titled `h2` "Loadout" with the note "{n} of 80 levels. Approved hours raise each band." (the existing gauge string). Below it a `pf-stat-list` with two values: **Depth** (`DepthValue` from the summed sample hours) and **Approved hours** ("74 H"), both from `sampleTrackHours`.
- Implementation note: `CoreGauge` today reads `sampleTrackProgress()` directly and has a fixed `h2` "Core depth across the four tracks". Give it optional `title`, `note` and `rows` props (default unchanged, so the Projects page is untouched) rather than copying it. Do not use `LevelStrip` here: it is a per-track page component, too tall for a profile.
- **390.** The bands already stack as one per row; the stat list wraps.
- Public view: the block is not rendered (Q1), and nothing takes its place (no empty plate), which keeps the public page short.
- No Ore anywhere in this block.

#### 3.5 Projects (all of them) with pins and visibility

- Section `h2` "Projects" with id `profile-projects`.
- **Status filter** (`nav aria-label="Project status"`, `pf-explore-filters` pattern, links with `aria-current="page"` on the current one, counts in the link text).
  - Own view links: "All 4", "Draft 1", "Logging 1", "Submitted 0", "In review 0", "Needs changes 1", "Approved 2". Zero-count links stay (so the set is stable) but read as muted text with `aria-disabled` removed: they are still links, they just lead to the empty state of that tab.
  - Public view links: "Approved 2" and, only when at least one exists, "Building 1". Public "All" is not shown: approved is the default.
  - The count is part of the link's accessible name ("Draft, 1 project").
  - The links wrap on one or more lines at any width; each is at least 44 px tall (the existing filter style).
- **Track filter** (`nav aria-label="Filter by track"`): "All tracks", Tools, Systems, Compute, Hardware, exactly the Explore row. It keeps the chosen status tab and vice versa.
- **Order.** Newest first, fixed, no sort control (the contract's "sort by recent" is the default order; Q9 asks whether an oldest-first toggle is wanted).
- **List.** The existing two-across `pf-project-grid` of `ProjectCard`s, 60 at most, no endless scroll. The own view's first cell is not a New project card (that stays on the Projects tab). Show a "Start a project" text link under the filters instead, to `/dashboard/projects`.
- **Card in profile mode.** Add a `variant="profile"` to `ProjectCard` and `ExploreCard`'s footer rules: footer left is "{n} H approved", footer right is "Used by {n}" for open-source projects (a `repoUrl` set) and nothing otherwise. Own view also shows the status badge (already on the cover) and a `pf-tag` under the card (see controls) saying what the public sees.
- **Own-view controls strip** (`pf-prof-controls`, directly under each card, inside the same `li`, outside the card link so there is no nested interactive element). It has one status tag on the left and up to three toggle buttons:
  - Status tag (`pf-tag`): "On your profile" (approved and shown, or logging and set to show), "Hidden" (hidden by you), "Private" (draft, submitted, in review, needs changes: never public). The tag is text, not colour alone.
  - Approved: **Pin** or **Unpin** (`aria-pressed`), and **Hide** or **Show** (`aria-pressed` reversed: label "Hide from profile" / "Show on profile").
  - Logging: **Show as building** or **Stop showing** (`aria-pressed`).
  - Pin is disabled (with a reason text) when 3 are pinned: the button is `disabled` and an adjacent `pf-hint` says "3 pinned. Unpin one first." Linked by `aria-describedby`. Hidden projects cannot be pinned: Hide on a pinned project also unpins it, and the status line says "Hidden and unpinned."
  - Draft, submitted, in review, needs changes: no buttons; the strip is the "Private" tag only, with the hint "Private until approved." on first use only (not repeated on every card): put this once as a hint under the filters instead.
  - All buttons are `pf-btn` (44 px minimum). They run a server action, then the page refreshes in place; the result is announced in a `role="status"` live region shared by the whole list ("Pinned Spec check tool.", "Hidden from your profile.", "Now shown as building.", "Unpinned.") and the pressed button keeps focus (do not re-mount the list in a way that loses it: key the strip by project id).
  - Failure: `role="alert"` under that card's strip: "Could not save. Try again."
- **Public-view list.** Same grid, no controls strip, no status tag, no "Private" hint. Building projects show the status badge "Logging" on the cover; the `Building` tab explains itself with the hint "Projects this builder is working on now."
- **States.**
  - Own, no projects at all: "No projects yet." with the link "Start one from Projects" (to `/dashboard/projects`), no filters shown.
  - Own, tab empty: "No {Draft} projects." (status label as in the tab), for example "No Needs changes projects." with a link "Show all" to `?tab=all`.
  - Own, track filter finds nothing: "No projects match. Clear the filter" (as Explore).
  - Public, no public projects: "No public projects yet." No filters.
  - Public, track filter finds nothing: "No projects match. Clear the filter".
  - Partial: a hidden project counts in own-view tab counts but not in public counts.
  - Error (database): the existing route error page; no custom state.

#### 3.6 Toolbelt block on the profile (read only)

- `pf-box`, `h2` "Toolbelt", two groups (two columns from 900, stacked below) separated by a rule:
  - **Equipped** (`h3`): confirmed tools this builder has equipped, as a list of lines: tool title (link to its Explore page when it is still public, else plain text), "by {handle}" (linked to that profile) and the use note on the next line, clamped to two lines (`pf-clamp`). "{n} of 2 slots in use" is shown in the own view only (it includes pending ones, which are not listed publicly); the public view lists confirmed only and never mentions pending.
  - **Used by** (`h3`): "{n} builders use this builder's tools." then the handles as links in a wrapping row, 12 at most, then "and {n} more". Count is distinct builders with a confirmed use.
- Empty states: Equipped, own: "No tools equipped yet. Equip one from a project page." (link to Projects). Equipped, public: "Has not equipped any tools." Used by, own: "No one uses your tools yet." Used by, public: "No one has equipped this builder's tools yet."
- 390: groups stack, Equipped first.

#### 3.7 Recent activity

- A `pf-plain-panel` with `h2` "Recent activity" and the existing line "No journal entries yet. Journals open in a later release." (same string as the Projects tab). Own and public identical. Nothing else until journals exist.

#### 3.8 Profile edit dialog (handle and bio)

- Opened by "Edit profile" (own view crumbs row) or by "Choose a handle" in the no-handle block (both open the same dialog; use the existing window-event pattern from `OPEN_NEW_PROJECT_EVENT`). Native `dialog` with the `pf-dialog` classes, `aria-labelledby` the heading, the form remounted each time it closes (same approach as `EditProjectDialog`).
- **Fields only for what exists: handle and bio.** The word "visibility" in the first brief maps to the per-project controls (3.5), because there is no person-level visibility field. Do not add a visibility switch to this dialog.
- Layout: head "Edit profile" with Close (or "Choose a handle" when none exists); fields stacked; actions row Cancel and "Save changes" (`pri pf-wide`). Phone: the dialog is full width minus 32 px and the form scrolls with pinned buttons (existing behaviour).
- **Handle** (`input`, label "Handle", `autocomplete="off"`, `autocapitalize="none"`, `spellcheck="false"`, `maxlength` 24, `pattern` not used for validation so messages are ours; the field is lower-cased on the server). Hint (`pf-hint`, linked by `aria-describedby`): "3 to 24 characters. Use a to z, 0 to 9, _ and -. Start with a letter. Use a handle, not your real name. Do not add your school or where you live."
- **Bio** (`textarea`, label "Bio (optional)" with the existing hint style). Hint: "Up to 160 characters. Everyone signed in can read it." Counter text in the hint line: "{n} of 160" (updates visually only; not a live region, to avoid noise; the limit is enforced by `maxlength`).
- **Errors** (inline under the field, `pf-error`, `aria-invalid`, `aria-describedby`; first error field gets focus on submit):
  - Empty handle on first save: "Choose a handle."
  - Length: "Use 3 to 24 characters."
  - Characters: "Use a to z, 0 to 9, _ and - only. Start with a letter."
  - Reserved: "That handle is not available."
  - Taken: "That handle is taken. Try another."
  - Bio too long: "Keep it to 160 characters."
  - Anything else: `FormStatus` alert "Could not save. Try again."
  - The "reserved" and "taken" messages deliberately do not say which.
- **Success.** The dialog closes, the page refreshes, "Profile saved." appears in the status line (3.2) and focus goes to the page `h1` (`tabIndex={-1}`), because the Edit button that opened the dialog may have been replaced (no-handle block).
- **Rename.** Changing the handle changes the public address. It is allowed once the owner confirms (Q3); the dialog hint when a handle already exists adds: "Changing your handle changes your profile address."
- **Cancel or Escape:** discard silently (the form is short). Pending: button text "Saving", disabled (existing pattern).

#### 3.9 Profile entry in the account control

- Replace the placeholder link in `PlatformShell` (`pf-profile-slot`, currently a link to Settings with an aria-label that says "placeholder") with a client component `PlatformAccountMenu`: a button using the same square icon, 44 by 44, accessible name "Account", `aria-expanded`, `aria-controls` the panel. Settings must stay reachable, so the panel has **two links**: "Profile" (to `/dashboard/profile`) and "Settings" (to `/dashboard/settings`). Settings keeps a "Profile" section too (3.10), so both paths work.
- It is a disclosure like the `PlatformNav` Menu toggle, not an ARIA menu: no `role="menu"`, no arrow-key roving; Tab moves through the links in order.
- Panel (`pf-account-menu`): absolutely positioned under the button, right-aligned, 8 px under the top bar, width 200 px (never wider than the viewport minus 16 px), `--pf-panel` background, 1px `--pf-fg` border, `4px 4px 0 var(--pf-edge)`. Links are 44 px tall, pixel font, upper-case, like `pf-nav` links. The current page's link has `aria-current="page"` and the bracket treatment of the nav (`[ PROFILE ]`).
- Behaviour: click or Enter or Space on the button toggles; opening moves nothing (focus stays on the button; the first link is one Tab away); **Escape** closes and returns focus to the button; focus leaving the control (Tab out) or a press outside closes it; activating a link closes it. Opening the account panel closes the phone Menu and the other way round.
- The button has a current marker when on Profile or Settings: a 2 px `--pf-link` border. Colour is decoration only; the link inside carries `aria-current`.
- **390.** The top row keeps wordmark, Ore, icon, Menu; the panel opens right-aligned and fits 320 px. No layout change to the row.
- Without a handle: the Profile link reads "Profile" and the page shows the choose-a-handle block.

#### 3.10 Settings additions

- Account `dl` gets a third fact **Handle**: the handle, or "Not chosen" with a link "Choose one" to `/dashboard/profile`. It spans the full row from 720 px (`grid-column: 1 / -1`).
- A new section "Profile" (above Referrals, same markup as the Referrals section): "Your handle and bio. Other builders see them. <link>Open Profile</link>".

#### 3.11 Projects tab: unchanged except one line

- No change to `/dashboard/projects` layout. Add nothing. Each card there may later show the Toolbelt count; not in this work.

#### 3.12 Edit project dialog: two new fields (needed for the Toolbelt to work)

The data model adds `repoUrl` and `demoUrl` but no screen sets them, and a tool can only be equipped when `repoUrl` is set. Add to `EditProjectDialog` (and not to the New project dialog, which stays two steps):

- "Source code address (optional)": `type="url"`, label hint "A public https address. Needed if you want other builders to equip your project from the Toolbelt." Error: "Use a public https address."
- "Demo address (optional)": `type="url"`, error "Use an https address."
- Place both under Description and above Track. Show them as links on the Explore detail when set (3.13).

#### 3.13 Explore additions

- **Card** (`ExploreCard`): footer left "by {handle}" (the handle as plain text inside the card link, since the whole card is a link; no nested links), or "by a builder" with no handle. Footer right: "Used by {n}" when the project is open source, replacing the hours that were there (depth already shows the approved hours on the cover). Footer text uses the existing `pf-project-foot` style; both items stay on one line, the left one ellipsises.
- **Detail** (`/dashboard/explore/[id]`): the meta box's Builder cell becomes a link to the profile (or "a builder"), and gets a fifth cell **Used by** with the confirmed count. Under the header add two sections in a `pf-split`:
  - "Links" (`pf-box`): "Source code" and "Demo" as external links (`target="_blank" rel="noopener noreferrer"`, show the host and path as text; only https is rendered as a link; else plain text). If neither: the box is omitted.
  - "Used by" (`pf-box`): handles as links, 12 at most plus "and {n} more"; empty: "No one has equipped this project yet."
  - Below, full width, "Tools in this project" (`pf-box`): confirmed equipped tools as lines (title linking to its Explore page, "by {handle}", the use note); empty: "This project does not equip any tools." The box is always shown; the empty line is short.
- Search placeholder and label stay "Find a project or a builder"; the match is on title, description and **handle**.
- Empty states are unchanged.

#### 3.14 Toolbelt on a project page (owner)

Placed in `/dashboard/projects/[id]` after the Hackatime and Ship requirements split and before the Timeline: a full-width `pf-box` titled `h2` "Toolbelt" (the heading row shows "{n} of 2 slots in use" on the right in `pf-hint` style). Reason for the place: the gate depends on hours and journals, which live in those two boxes just above.

Structure inside the box, top to bottom:

1. **Two slots** (`pf-belt-slots`): `grid-template-columns: 1fr` below 560, two equal columns from 560. A slot is `pf-belt-slot`, 1px `--pf-fg` border, no box background of its own beyond the section's, a 4 px left bar in `--pf-rule`.
   - **Filled slot.** Status chip (`pf-belt-chip`, data-status), then the tool title as a link to its Explore page (plain text when that project is no longer public), then "by {handle}" (link), then the use note (full text, wrapped, up to 500 characters), then a **Remove** button (`pf-btn`).
   - **Empty slot.** The dashed `pf-new-card` pattern, 120 px tall, containing the plus icon (reuse the existing `pf-new-plus` svg markup), label "Equip a tool" and the sub line "Pick an approved open-source project." This slot is the button that opens the equip dialog. With one tool equipped, the second slot is the empty slot; with two, no empty slot.
   - **Chips.** `Pending` (dashed border `--pf-fg`, matches the platform's hatched-means-pending idea), `Confirmed` (solid border `--pf-ok`, a small check glyph from the stage strip's pixel check path), `Declined` (solid border `--pf-err`). Text colour is `--pf-fg` in all three, so contrast comes from the page, and meaning comes from the word, never colour alone. The declined line adds "A reviewer or the maker declined this use." and never says which.
   - Declined uses do not count toward the two slots. They are listed under the slots as plain lines ("{title}, Declined, Remove") in a muted list, so the owner can clear them.
2. **Gate card** (`pf-belt-gate`, a labelled section with `h3` "Before a use counts"): four lines in the existing `pf-checks` list pattern.
   - "The project has 25 approved hours", right side "{n} of 25 H" (this one ticks when `projectHours(id).approved >= 25`; with the hatched meter below showing pending hours, see below).
   - "The tool is used in a core part of the project": "Checked at review".
   - "Your journal shows real use": "Checked at review".
   - "A reviewer confirms the use": "Checked at review".
   - Only the first line can ever show a tick. The other three never tick on this page. A line is a list item with the status as text, like the Ship requirements (`, done` or `, not done` for screen readers, and "Checked at review" as the visible text for the other three).
   - A thin meter under the first line: filled to approved hours over 25, pending hours hatched, reusing the hatched gradient already in `platform.css` (`repeating-linear-gradient(135deg, transparent 0 3px, var(--tk) 3px 5px)` pattern from `pf-strip-pending`) with `--pf-ac` as the fill. The meter is `aria-hidden`; the number text is the real information. New class `pf-belt-meter`.
   - One sentence under the list: "A reviewer confirms each use after you submit. Nothing here pays Ore."
3. **Provisional rewards note** (`pf-belt-note`, `pf-hint` size, with a `pf-tag` reading "Provisional" in front): "Provisional rewards, not paid yet: 50 Ore once per tool for the builder who uses it, 10 Ore for the maker for each verified user, up to 500 Ore per tool each season. Equipping gives no Track XP." This is the **only** place the numbers appear in the product. It has **no link**: there is no Toolbelt page in `content/docs` yet (checked), so a link would be dead. Add the link in the same change that adds the Docs page.

Interactions and states:

- **Equip a tool** opens the equip dialog (3.15). The empty slot is a `button`, named "Equip a tool".
- **Disabled with a reason** (the button stays in the layout, `aria-disabled="true"` and not `disabled`, so it stays focusable and its reason is read; the activation is ignored). The reason is a visible `pf-hint` inside the slot, linked by `aria-describedby`:
  - Project is submitted, in review or approved: "Equips are closed once a project is submitted. They open again if a reviewer asks for changes."
  - Two uses already pending or confirmed: no empty slot is drawn, and a line under the slots reads "Both slots are in use. Remove one to equip another."
  - Platform has no eligible tools: not disabled; the dialog shows its empty state (3.15). Reason: the dialog tells the truth in one place instead of two.
- **Remove.** Opens a native confirm dialog (`ConfirmDialog`, 3.16). Title "Remove {tool}?" Text "Its use note is deleted. You can equip it again later." For a confirmed use add: "This use is already confirmed. If you equip it again, it is checked again." Buttons: Cancel (focused first) and "Remove tool" (`pf-btn-danger`). After success the dialog closes, the slot becomes empty, a status line says "Removed {tool}.", and **focus moves to the "Equip a tool" slot** (or, if both were full and one freed, to that slot). If it was the only declined line being cleared, focus moves to the Toolbelt heading.
- After a successful equip: status line "Equip sent. It stays Pending until a reviewer confirms it." and focus moves to the new slot's chip (`tabIndex={-1}`), because the button that opened the dialog was replaced.
- Errors from actions (limit reached, duplicate, blocked, hidden, own project, not open source, raced): shown inside the dialog as an alert with plain text; messages: "You can equip two tools in one project." "You already equipped this tool." "This tool is not available." (the same text for blocked, hidden, not open source and unknown, so a block is never revealed) and "You cannot equip your own project."
- Status of the Toolbelt for projects with no track, draft or any status: the section is always visible on the owner's page.

#### 3.15 Equip dialog

- Native `dialog.pf-dialog`, width 560 on desktop, full width minus 32 px on phones, head "Equip a tool" with Close. One step. Form scrolls, actions pinned (existing dialog behaviour).
- **Find a tool** (`input type="search"`, label above, hint "Approved open-source projects from other builders." `autocomplete="off"`). It filters the list in the browser over the eligible tools the server sent (the 100 newest; Q4 asks whether a bigger set needs server search). It matches tool title, description and the maker's handle.
- **Result count.** A `role="status"` `aria-live="polite"` line under the input: "12 tools." then "3 tools match." or "No tools match. Clear the search." Updates on input after a 250 ms pause. The line is visible text (`pf-hint`), not hidden.
- **Tool list.** A `fieldset` with legend "Tool" and native radios, laid out as the `TrackChoices` pattern (`pf-choice` labels): one column, `max-height: 280px` with its own scroll (the radios inside keep it keyboard reachable; give the list `tabindex` 0 only if it has no focusable child, which it always does). Each choice shows the title in the pixel font with the track swatch, "by {handle}", a one-line description (`pf-clamp` to 1 line) and "Used by {n}". Choose with Arrow keys inside the radio group as native.
- **Use note** (`textarea`, label "How does your project use it?", `minlength` 10, `maxlength` 500). Hint always visible: "Name the file or feature that uses the tool. Example: calls the parser in src/build.ts to read every config file." Counter "{n} of 500" in the hint line. It is required.
- **Errors** (inline): no tool picked "Pick a tool."; note short "Write at least 10 characters."; note long "Keep it to 500 characters."; limit and conflicts as in 3.14 as an alert at the top of the form.
- **Actions.** Cancel and "Equip tool" (`pri pf-wide`), "Saving" while pending. The submit stays enabled until pressed (do not disable it for an invalid form: the inline errors explain).
- **Empty (today's state, nothing eligible).** Instead of the form: a `pf-empty` plate, `h3` "No tools to equip yet", text "Tools show up here once other builders have an approved, open-source project." and a single Close button. The same text is used when every eligible tool is blocked or hidden: never reveal why.
- **Initial focus** on the search input; Escape closes without confirmation; focus returns to the empty slot (or its replacement, see 3.14). The dialog is remounted on close so no stale selection remains.
- **Phone.** Radios have 44 px rows; the textarea min height stays 88 px; with the soft keyboard open the form scrolls and the buttons stay reachable (existing dialog rules).

#### 3.16 Maker view: Toolbelt users (and Block)

- On the owner's page of an **approved** project that has a `repoUrl`, add a second `pf-box` after the Toolbelt box, `h2` "Toolbelt users". It is also shown for a project that has users even if its status later changed.
- Rows (`pf-belt-user`, a ruled list): handle (link), status chip (Pending, Confirmed, Declined, or Blocked), the use note (up to 500 characters, wrapped) and the equipping project's title (link to Explore only when it is public). Right side: a **Block** button (`pf-btn pf-btn-danger`) on rows that are not blocked. 100 rows at most, newest first; beyond that "and {n} more" (no pagination in v1, Q5).
- **Block confirm** (`ConfirmDialog`): title "Block {handle}?" text "They cannot equip any of your tools again. Their pending uses of your tools are declined. Confirmed uses stay. They are not told." Buttons Cancel (focused first) and "Block builder" (`pf-btn-danger`). The block is person to person (`ToolbeltBlock`), not per project.
- After Block: the dialog closes, the row's chip becomes "Blocked" in place (status text updates; pending ones also show "Declined" in their own use line), a status line says "Blocked {handle}.", and **focus goes to that row's status text** (`tabIndex={-1}`), because the Block button disappears.
- **Unblock** (Q6): recommended but not in the contract. If the owner approves, a blocked row shows an "Unblock" `pf-btn` with its own confirm ("Unblock {handle}? They can equip your tools again."). If not approved, blocked rows show the chip only. Do not build it before the owner answers.
- Empty: "No one has equipped this project yet. Builders can equip it from their own project pages once it is approved." Not approved or no `repoUrl`: the section is omitted, with no hint (the Edit project dialog already explains the address).
- A banned builder's rows are hidden.

#### 3.17 Confirm dialog (shared, new)

`ConfirmDialog`: native `dialog.pf-dialog` at 440 px max, head with `h2` title and no Close button (Cancel is the close), body text, actions Cancel and the confirm button. `aria-describedby` points at the body text. Cancel has initial focus. Escape cancels. The confirm button shows "Saving" and is disabled while pending, errors show in an alert in the body. On success the caller decides where focus goes (see 3.14 and 3.16). The existing `DeleteProject` (type the name) is unchanged: that action is heavier and keeps its own pattern.

### 4. Seed and sample situation (what the empty and seeded platform looks like)

- Today only sample hours exist. The profile therefore shows, in the own view, the same levels as the Overview (LV.8 Tools, LV.3 Systems, LV.0 Compute, LV.1 Hardware) and project hours of 0 H. No Ore figure appears on these screens. No "Sample" label is added (owner, 31 Oct 2026). The gate card reads "0 of 25 H".
- The public view for another builder shows no levels (3.4). That keeps invented figures from reading as another person's record.
- Seed fixtures (`bun run db:seed:local`) must make every state reachable: one builder with a handle, bio and three pins; one with a handle and no bio and no approved project; one with a handle and a hidden approved project; one with **no handle**; one banned; at least four approved open-source projects across the four tracks (fictional handles, `.example` or GitHub-style addresses); one pending use, one confirmed use and one declined use; one builder blocked by a maker. Use plain invented handles such as `ferrite`, `nox_lab`, `quill-7`; no real people.

### 5. Components

**Reuse (do not rebuild):** `PlatformShell` and `PlatformNav` (frame, disclosure pattern), `PageHead` (not used: the profile has a visible handle h1 like the project page), `ProjectCard`, `ProjectCover`, `ExploreCard`, `DepthValue`, `CoreGauge` (extended with optional props), `TrackChoices` (as the radio-choice pattern for the equip list), `EditProjectDialog` (two new fields), `NewProjectDialog` (the open-by-event pattern), `FormStatus`, the `useActionState` form pattern from `forms.tsx`, `StageProgress` (unchanged), and the platform classes `pf-box`, `pf-box-head`, `pf-split`, `pf-crumbs`, `pf-back`, `pf-meta-box`, `pf-project-head`, `pf-project-lead`, `pf-project-grid`, `pf-project-card`, `pf-explore-filters`, `pf-explore-search`, `pf-dialog` family, `pf-field`, `pf-input`, `pf-textarea`, `pf-hint`, `pf-error`, `pf-saved`, `pf-tag`, `pf-badge`, `pf-btn`, `pf-btn.pri`, `pf-btn-danger`, `pf-checks`, `pf-check-box`, `pf-new-card` and `pf-new-plus`, `pf-empty`, `pf-empty-line`, `pf-plain-panel`, `pf-clamp`, `pf-sr`, `pf-muted`, `pf-next`, `pf-kicker`, `pf-stat-list`, `pf-gauge` and `pf-bands`, `data-track` colours (`--tk`, `--tk-ink`).

**New (where):** put the styles in two new files imported by their components, the way `page-head.css` is: `app/_components/platform/profile.css` (classes `pf-prof-*`) and `app/_components/platform/toolbelt.css` (classes `pf-belt-*`). Do not append to the 1177-line `platform.css`.

| Component | File | Notes |
| --- | --- | --- |
| `ProfileIdentity` | `ProfileIdentity.tsx` | Plate, handle h1, bio, meta box, own-view hint. Props: handle, bio, joinedAt, topTrack (or null), projectCount, toolbeltCount, own |
| `ProfileEditDialog` | `ProfileEditDialog.tsx` (client) | Handle and bio; the open event; remount on close |
| `ProfilePins` | `ProfilePins.tsx` | The three plates, empty slots in own view |
| `ProfileProjects` | `ProfileProjects.tsx` | Filters, grid, per-card controls, live status region |
| `ProjectVisibilityControls` | `ProjectVisibilityControls.tsx` (client) | Pin, Hide, Show as building, with the three server actions |
| `ProfileToolbelt` | `ProfileToolbelt.tsx` | Equipped and Used by groups |
| `PlatformAccountMenu` | `PlatformAccountMenu.tsx` (client) | The account disclosure; replaces the link in `PlatformShell` |
| `ToolbeltSection` | `ToolbeltSection.tsx` | Slots, declined lines, gate card, rewards note |
| `ToolbeltGate` | `ToolbeltGate.tsx` | The four lines and the hatched meter |
| `EquipDialog` | `EquipDialog.tsx` (client) | Search, radios, note, states |
| `ToolbeltUsers` | `ToolbeltUsers.tsx` | Maker rows and Block |
| `ConfirmDialog` | `ConfirmDialog.tsx` (client) | Shared Remove and Block confirmation |

Classes to add (all `pf-` and namespaced): `pf-prof-id`, `pf-prof-plate`, `pf-prof-plate-strip`, `pf-prof-pins`, `pf-prof-pin`, `pf-prof-pin-empty`, `pf-prof-controls`, `pf-prof-status`, `pf-account-menu`, `pf-belt-slots`, `pf-belt-slot`, `pf-belt-chip`, `pf-belt-gate`, `pf-belt-meter`, `pf-belt-note`, `pf-belt-user`, `pf-belt-list`, `pf-belt-results`.

Data helpers the UI expects from `lib/platform/` (the contract's modules): `profileByHandle`, `profileProjects(personId, view, filters)`, `usedByCount` and `listUsedBy(projectId)`, `listUsesForProject(projectId)`, `eligibleTools(viewerId, projectId)`, and `handleError(value)` as a pure function that returns the exact messages above.

### 6. Motion

- None is added. Every change of state is an instant swap: the account panel, the filter links, the dialogs (native, no transition), the pressed toggles, status lines.
- Reason: these are frequent, task-focused actions with keyboard use (`emilkowal-animations`: never animate keyboard-initiated or high-frequency actions). Motion would delay the result and the screens already carry the identity in their layout.
- The existing `pf-btn` hover lift and press (160 ms and 80 ms on `--pf-ease`, transform only) apply to the new buttons unchanged. They already sit behind `prefers-reduced-motion: no-preference` and the display Reduce motion setting; nothing new needs a reduced-motion branch.

### 7. Accessibility

- **Semantics.** One `h1` per page (the handle, or "Your profile"). Sections have `h2`s: "Pinned", "Loadout", "Projects", "Toolbelt", "Recent activity"; Toolbelt groups use `h3`. Filter rows are `nav` with an `aria-label` ("Project status", "Filter by track"). Lists are real lists. The ID plate and decorative strips are `aria-hidden`.
- **Status messages.** Action results (profile saved, pinned, hidden, equip sent, removed, blocked) use a `role="status"` live region that exists in the DOM before it changes. Errors use `role="alert"`. The equip result count is a polite live region.
- **Focus management.** After a dialog closes: to the opener if it still exists, otherwise to the named target (profile h1, the new slot chip, the Equip slot, the Toolbelt heading, the row status). No element receives focus that was removed. Dialogs are native `dialog` with `showModal`, so focus is contained and Escape works. Initial focus: first field (profile, equip) or Cancel (confirms).
- **Keyboard.** Tab order follows reading order. Account control: Enter or Space toggles, Escape closes and returns focus, Tab through the two links, leaving closes. Equip list: native radio arrows. No custom key handling beyond Escape on the account control.
- **Disabled controls with a reason.** Use `aria-disabled` plus `aria-describedby` pointing at the visible reason text; do not use the `disabled` attribute for a control whose reason a keyboard user must be able to hear. (The platform's existing disabled buttons use `disabled`; the new ones are an exception because they carry a reason.)
- **Names.** Counts are in names ("Draft, 1 project"); toggles use `aria-pressed` and a stable label ("Pin" with `aria-pressed`, the visible text "Pinned" or "Pin" may change with it only if the accessible name stays one of the two; choose a stable name "Pin to profile" and let `aria-pressed` carry the state); chips are text; repeated buttons include the project or tool in `aria-label` ("Remove Spec check tool").
- **Contrast.** All text sits on `--pf-bg` or `--pf-panel` in `--pf-fg` or `--pf-mut` (both pass 4.5:1 in both themes today). Chip and slot colours (`--pf-ok`, `--pf-err`, `--tk`) are borders and bars only, never text on a track colour. The ID plate letter is `--pf-fg` on `--pf-panel`. Check light and dark and the colour-vision palettes, which re-map `--pf-ac`.
- **Touch targets.** Every control is at least 44 px tall (filters, toggles, slots, radios, account links); 52 px for primary buttons as existing. Handle links in the "Used by" rows are inline text; place them in a wrapping row with 44 px minimum line boxes (`display: inline-flex; min-height: 44px`) so they pass the target size rule.
- **Display settings.** Everything is in `em`, so reading size scales; wider spacing and larger controls selectors from `platform.css` apply to the new classes through the existing `.pf` descendants (add the new interactive classes to the `larger-controls` rule). The dialogs scroll internally when text is enlarged.
- **Privacy.** No email or display name appears in any profile, Explore, Toolbelt or dialog text for another builder.

### 8. Responsive summary

| Block | 1440 (900 and up) | 560 to 899 | 390 and below |
| --- | --- | --- | --- |
| Identity | plate 112 + text | plate 112 + text | plate 72 beside handle, rest below |
| Pins | 3 columns | 1 column | 1 column |
| Loadout | gauge, then stat list | same | bands stack, stat list wraps |
| Projects filters | wrapping rows | wrapping rows | wrapping rows, 44 px links |
| Projects grid | 2 across | 2 across | 1 across |
| Toolbelt and Recent | 2 columns | 1 column | 1 column |
| Toolbelt slots (project page) | 2 columns | 2 columns | 1 column |
| Gate card | full width under the slots | same | same |
| Equip dialog | 560 px | full width minus 32 | full width minus 32, form scrolls |
| Account panel | 200 px right-aligned | same | same, fits 320 |

No horizontal scroll at 320, 390, 471, 700, 900 or 1440 (the suite's widths).

### 9. States matrix

| Block | Empty | Partial | Error | No handle | Own vs public | Banned or 404 | Success | Disabled with a reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Profile page | no projects, no tools | some blocks empty | route error page | "Your profile" and the choose-a-handle block | own: controls, hint, Loadout; public: none | 404 | "Profile saved." | n/a |
| Edit dialog | first save | n/a | inline field errors, alert | opens as "Choose a handle" | own only | n/a | closes, status, focus h1 | button "Saving" while pending |
| Projects list | 3.5 empty lines | hidden ones counted only for owner | per-card alert | n/a | controls own only | n/a | live message | Pin when 3 pinned |
| Pins | omitted when none, dashed slots when approved exist | 1 or 2 filled | n/a | n/a | slots own only | n/a | n/a | n/a |
| Toolbelt (profile) | per group lines | one group filled | n/a | n/a | slot count own only | n/a | n/a | n/a |
| Toolbelt (project page) | two empty slots | one filled | dialog alerts | n/a | owner only | non-owner 404 (existing) | "Equip sent." | after submit, or both slots full |
| Equip dialog | "No tools to equip yet" | n/a | alerts | n/a | owner | n/a | closes, focus new chip | n/a |
| Toolbelt users | empty line | mixed statuses | alert in confirm | rows with no handle read "a builder" | maker only | banned rows hidden | "Blocked {handle}." | n/a |
| Account control | n/a | n/a | n/a | same links | n/a | n/a | n/a | n/a |

Edge cases: a tool project is hidden after being equipped (the confirmed use stays listed on the user's page, the title is plain text, no link); a tool project is deleted (its uses disappear from every list, no message); the equipping project is deleted (the maker's row disappears); a use is confirmed while the owner has the page open (the chip updates on the next refresh, no live push); session expiry follows the existing redirect; offline: server actions show "Could not save. Try again."

### 10. Copy (exact short strings)

- Account panel: "Profile", "Settings".
- Profile: "Your profile", "Edit profile", "Choose a handle", "Joined", "Top track", "Projects", "Toolbelt", "Pinned", "Loadout", "Recent activity", "Used by {n}", "No bio yet.", "Profile saved."
- Dialog: "Handle", "Bio (optional)", "Save changes", "Saving", messages in 3.8.
- Projects: "Pin to profile", "Unpin", "Hide from profile", "Show on profile", "Show as building", "Stop showing", "On your profile", "Hidden", "Private", "Private until approved.", "3 pinned. Unpin one first.", "Start one from Projects".
- Toolbelt: "Equip a tool", "Pick an approved open-source project.", "Pending", "Confirmed", "Declined", "Remove", "Remove tool", "Block", "Block builder", "Blocked", "No tools to equip yet", "Both slots are in use. Remove one to equip another.", "Before a use counts", "Checked at review", the rewards note and sentences in 3.14 to 3.16.
- Voice rules: plain, short sentences, no hype, no exclamation marks, no em or en dashes, "13 to 18", handle not "username", "builder" not "user", "tool" for a tool/project in the UI (the Docs may say tool/project).

### 11. Acceptance criteria

Checklist for the implementer and the checks run on each page:

- [ ] `/dashboard/profile` and `/dashboard/builders/[handle]` render for the seeded builders; own handle redirects; unknown, banned and no-handle give the 404 page.
- [ ] No page shows an email or a display name for anyone but the signed-in person's own Settings; Explore cards, detail and search use handles.
- [ ] Profile dialog enforces every handle rule on the server with the messages in 3.8; success closes, announces and moves focus to the h1.
- [ ] Filter links keep state in the address, carry counts in their names, and land at `#profile-projects`.
- [ ] Pin allows 3; the fourth is `aria-disabled` with its reason; Hide unpins; drafts, submitted, in review and needs changes never appear publicly; hidden never appears publicly or in Explore.
- [ ] A builder cannot equip their own project, a hidden or non-open-source project, a third tool, a duplicate, or a blocked maker's tool, and the blocked case reads exactly like unavailable.
- [ ] The gate card shows only one tickable line (hours); no line says anything is paid; rewards numbers appear exactly once, marked Provisional, with no link.
- [ ] Remove and Block confirm in a dialog; Cancel is the first focus; focus lands where 3.14 and 3.16 say.
- [ ] Account control works by keyboard (Enter, Space, Escape, Tab) and by touch; Settings is still reachable; it fits 320 px.
- [ ] Both themes, the colour-vision palettes, 150 and 200 percent text, wider spacing and larger controls all stay usable; axe finds no violation on each new page and dialog in both themes at 390 and 1440.
- [ ] No horizontal scroll at 320, 390, 471, 700, 900 and 1440.
- [ ] No new colour, font or radius; no motion beyond the existing button transitions; no Ore figure on any screen from this work.
- [ ] `bun run typecheck`, `bun run lint`, `bun run test` pass; handle and block rules are pure functions with tests.

### 12. Design pre-flight

- **Identity lock.** Palette, fonts, square corners, hard shadows, pixel headings and the track colours all come from existing tokens. The two signatures (ID plate, two slots) reuse existing components' look. Pass.
- **Anti-slop.** No gradients, glass, glow, round avatar, follower count, stat-card row, ARIA tab widget, emoji or decorative dots; no nested cards; no fake numbers; copy checked for em and en dashes and filler verbs. Pass.
- **State coverage.** Section 9 covers empty, partial, error, no handle, own versus public, banned, success and disabled with a reason for every block. Pass.
- **Accessibility.** Section 7. Pass, to be proven by the suite.
- **Layout craft.** One main column, one two-up row, a stated 390 layout for every block, 44 px targets. Pass.
- **Cognitive load.** Per screen the builder makes one primary decision: profile (edit it or pin a project), project page (equip or remove). The Toolbelt rule shows itself as two slots. Rewards appear once. Public view shows less than own view by design.
- **Scored self-critique (1 to 5).** Distinctiveness 4, consistency 5, state coverage 5, a11y 4, cognitive load 4. Nothing at 2 or below. One weak point to watch in review: the per-card controls strip adds visual weight to the own project list; if it reads busy at 390, move Pin, Hide and Show into a single "Profile" disclosure per card (same actions, one button), which does not change the spec's behaviour.

### 13. Open questions for the owner

1. **Public levels (Q1).** `sampleTrackHours` gives every builder the same levels. Show them on other people's profiles anyway, or hide them until real hours exist? Default here: hide.
2. **Two depths (Q2).** Overview shows -74 M, Projects shows 0 M. Reconcile now, or leave until the ledger?
3. **Handle rename (Q3).** Can a builder change a handle after choosing it? If yes, does the old address redirect? Default here: allowed, with a warning, no redirect.
4. **Equip search size (Q4).** Client-side search over the 100 newest eligible tools is enough for the seed phase; do we need server search later?
5. **Many users (Q5).** The maker list stops at 100 rows with no pagination. Fine for v1?
6. **Unblock (Q6).** Add an Unblock button? The contract only has Block, and a one-way block is easy to regret.
7. **Handle required (Q7).** Should a handle be required before a project can be submitted, equipped or shown in Explore? Without one the builder shows as "a builder".
8. **Explore card footer (Q8).** "Used by N" replaces the hours on the card. OK, or keep both and drop something else?
9. **Sort (Q9).** Newest first only, or an oldest-first toggle too?
10. **Own profile preview.** An own handle redirects to the own view, so there is no "see my public page" link. Add a read-only preview mode, or accept the hint line instead?
11. **Source and demo fields.** Adding them to Edit project (3.12) is needed for the Toolbelt to work; confirm they go there and not in the New project dialog.
12. **Contract wording.** The contract's Acceptance says "a fifth tool"; the rule is two, so this spec enforces a third. Fix the wording when this is merged.

### 14. Build handoff

- **Target:** this repository's engineering session (as for M1), Next.js App Router with server actions, existing `pf-` CSS. Design system: the LOADOUT platform styles in `platform.css`; do not add a library.
- **Instruction:** implement exactly this spec. Theme with the existing tokens; do NOT redesign or re-implement existing components, and do not add motion, colours, fonts, radii or a Docs link beyond what is stated.
- **Order of build:** (1) pure rules and tests (`handleError`, equip rules, block rules), (2) migration and seed, (3) account control and Settings, (4) profile page and dialog, (5) projects filters, pins and visibility, (6) Toolbelt section, equip dialog, confirm dialog and maker view, (7) Explore handle and "Used by" changes, (8) light and dark, 390 and 1440 checks with screenshots in the pull request.
- **Skill pass record.** Loaded and applied: `frontend-design-ui-ux` (this spec), `frontend-design` (direction), `design-taste-frontend` (audit and anti-slop), `emilkowal-animations` (motion decision: none). Loaded, not applied because no asset was needed: `svg-design`, `pixel-art-sprites`, `pixel-art-animator`. The implementer must load the seven skills again before UI code, as `docs/development/ui-skills.md` requires.
