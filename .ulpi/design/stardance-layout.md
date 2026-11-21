# Participant platform: Stardance layout for projects, Explore and Shop, and a search-first Toolbelt

**Status:** design spec, 16 Nov 2026. Request (owner, 16 Nov 2026): "Equip a tool is trash. It should be a search bar: you search for something and it appears; search for an existing project, or maybe bookmark it. The whole Toolbelt and the whole UI is trash. It should be more oriented around the Stardance layout for the UI regarding projects: the project page, project discovery (Explore) and the shop page and stuff."
**Binds to:** [DESIGN.md](DESIGN.md), the [design system](../../docs/design/system/design-system.md), [profile-and-toolbelt.md](profile-and-toolbelt.md) (the Toolbelt contract; sections 3.14 to 3.17 are superseded by section F below, the rules stay), [m1-platform-shell.md](m1-platform-shell.md), plan 02 (shop rules). Not the reviewer site.
**What this is:** layout and information architecture only. Stardance is read for structure, never for look, colour, font, art or text. No new colour, font or radius. No code is written here.

## 0. Skills, design read, what was looked at

- Skills loaded in this session: `frontend-design-ui-ux` (this spec), `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites`, `pixel-art-animator`. Applied: the first four. Loaded and not applied because this work adds no new sprite, icon art or frame animation: the last three (the star and search glyphs are drawn as `crispEdges` path markup like the existing back arrow and plus; see C.9). The implementer loads all seven again before UI code (`docs/development/ui-skills.md`).
- Current pages screenshotted at 1440 and 390 and opened: `/dashboard/projects`, `/dashboard/projects/seed-private-wiki`, `/dashboard/projects/seed-mini-router`, `/dashboard/explore`, `/dashboard/explore/seed-tape-deck`, `/dashboard/shop`, `/dashboard/shop/framework-12`, in `C:\Users\jerem\AppData\Local\Temp\claude\21662715da1c6a9b\4e167f80-2778-46dc-84bc-b914c68b6d8f\scratchpad\screenshots12\` (files `project-1440.png`, `project-390.png`, `project-top-390.png`, `projects-1440.png`, `projects-top-1440.png`, `projects-top-390.png`, `explore-1440.png`, `explore-390.png`, `explore-detail-1440.png`, `explore-detail-top-1440.png`, `explore-detail-top-390.png`, `shop-1440.png`, `shop-top-1440.png`, `shop-top-390.png`, `shop-item-top-1440.png`, `shop-item-top-390.png`, `shop-item-1440.png`, `shop-item-390.png`).
- Stardance read (layout and IA only): project show page and styles, project creation page, home feed and the discover rail, search result partials and the command palette, shop hub, category page, item card, item page and wishlist widget.

### Audit of what is there (why the owner says it is trash)

1. **Project page** (`projects/[id]`): a stack of six equal boxes (stage strip, Hackatime, Ship requirements, Toolbelt, Timeline, Delete). The Toolbelt is the fourth box, 700 px below the top at 1440 and 1900 px at 390. The hero is a text block with a small cover pushed to the right column, so nothing is "the project": no banner, no byline, no stats row. The two empty Toolbelt slots are 160 px dashed boxes that shout "Equip a tool" twice. A builder who wants one tool must open a modal with a radio list.
2. **Explore**: one search box and five chips over a 2-column grid of identical large cards, each with a 168 px dithered cover that says "0 M". All covers carry the same information. No rails, no saved, no sense of "what is new" or "what is used". The search needs a button press and a page load. At 390 the first screen is mostly cover.
3. **Shop**: a notice line, an Ore plate, a search, six chips, a sort row, then a 3-column grid of 70 equal cards in one 8 800 px column (1440). No categories, no "new" strip, no rail. The item page has the photo top-left, then a large empty area under it at 1440; the price box carries everything and there is no wishlist control.
4. Every page uses the same card plus the same box, so nothing has a role. That is the "generic grid of cards" the design brief warns about.

### Design read

LOADOUT is a field manual. Stardance is a social feed with a calm hero banner. What carries over is not its look but its **hierarchy**: one identity panel that says whose project this is and what it has done, a single row of facts, actions in one place, the work below it as a feed; discovery that begins with a search that answers while you type, then short rails with a clear job; a shop that opens on categories and a "new" strip before the long grid; an item page where the price and the action stay in view.

Direction: stay industrial and signage. The project page reads as a **core sample sheet**: a wide strata cover (the dithered core, the platform's own "banner") with the depth chip, then a ruled identity plate. Discovery reads as a **drill log**: short ruled lists and one strip of cores per job. The shop reads as a **parts counter**: category strips with the product photo big and the Ore price chip small and hard.

Counterfactual test: if these screens could be a SaaS project gallery with a search bar, they have failed. They must show, on every screen without the logo: the dithered track-colour cover, pixel headings, the depth value ("0 M"), the Ore gem with the price, square corners, hard shadows, `[ ]` nav, ruled lists. Things that would make them a generic grid: three identical cards per row with the same cover; a search with rounded pill and magnifier; a hero with gradient; avatars; likes. None of those appear.

Dials (design-taste): variance 5 (asymmetric two-column plate on desktop, one column on phone), motion 2 (no scroll motion, only the existing 160 ms press and an 120 ms result fade, both off under reduced motion), density 6 (ruled lists in rails, normal grid below). Register: product inside a brand system, so native controls, no new library.

### Rules kept from earlier decisions (do not change)

Up to two tools per project; only approved open-source projects of other builders; use note naming a file or feature; 25-hour gate checked at review (only the hours line ever ticks); rewards provisional and shown once with a Provisional tag and no link; no Ore paid; no Track XP from equipping; maker Block with its confirm; declined uses listed and removable; one track per project; depth is approved hours, 1 M per hour; handles only, never names or emails; Ore prices the same everywhere; items name their tracks or General; requisition note only where eligible; sample hours stay unlabelled (owner, 31 Oct); no em or en dashes in copy.

## A. What Stardance does that makes those pages work

**Project page.** One centred column about 920 px wide, everything in it the same width.
- A wide banner (aspect 4.7 to 1) at the top with only a round back button over it. The banner is the project's face. The page is not a dashboard; it is one project.
- A **panel that continues the banner** (no gap): left, the identity (title, a tag such as "Hardware", a byline with avatars and "By name"), right, a **stats row of two big numbers** (devlogs, total hours). Under them the description in readable measure, then one footer line: followers on the left, pills on the right (Source, Edit project, Follow, Report). Actions are pills in one row, outline for secondary, filled for the one primary.
- Below the panel, a **nav of actions** ("Post a devlog +", "Record timelapse", "Complete project info", ship), the primary one only when it is actionable now; disabled ones are soft-disabled with a tooltip reason. Notices (blocked, review decisions) sit between panel and feed in full width.
- The **feed** (devlogs and ship cards) is the main body, newest first, in the same column. The sidebar-less layout keeps the work above the fold. Editing happens in place on the same hero (the title and description become inputs), not on another page.
- On phones the banner keeps its aspect, the back button shrinks, the panel pads smaller and the summary stacks.

**Discovery.** The home is a feed with a row of tabs (For you, Hardware, New builders, Following, Popular, Newest), and a **discover rail** on the right (264 px, sticky; collapses to a toggle under 1280) whose first item is a **search input that replaces the widgets with live results as you type** ("Search for X", then a list of results, each a title and one meta line; empty: "No results found"). A global **command palette** (dialog, search row on top, grouped listbox: Commands, Projects, Users; footer hint "up and down to navigate, enter to select, esc to close", `role="listbox"`, `role="option"`, `aria-activedescendant`). Results are grouped and short. Project shelves are small cards: a media crop, a title, a two-line description.

**Shop.** The **hub** opens on a top bar (search left, region right), then a **grid of category tiles** (art made of three product thumbnails, a name), then **horizontal rails** "New" and "Popular" with "See all" links and scroll arrows, then (separately) a category page with a title row, a **toolbar** (search, price range, access, sort), a 3-column item grid and a "Back to shop" link. The **item card**: image on top with ribbons (New, N given out, X percent off, N left, Added when), a **star** button for the wishlist in the corner, then title, description, hours estimate, price and one call to action. A **wishlist widget** in the rail shows saved items with a progress bar toward the price. The item page is two columns: item (image, title, badges, requirements, description) and the order form beside it.

**Why it works:** (1) one column and one width, so the eye never reorders; (2) identity and numbers in one plate; (3) actions grouped, one primary; (4) search is inline and answers at once; (5) browse is split into short jobs (new, popular, by category) before the long list; (6) the card has one image, one title, one line, one price, one star; (7) sticky only where it helps (rail, order box).

## B. Patterns adopted, and how each maps to LOADOUT

| Stardance pattern | LOADOUT version |
|---|---|
| Banner at the top of a project | **Hero cover**: the existing dithered track-colour core as a wide strip (`pf-hero`, aspect 4.7 to 1 at 1440, 3 to 1 at 390, min height 120). Status and track badges stay on it; the depth chip stays bottom left. No upload, no image. A project with no track uses the neutral grey dither. |
| Panel under the banner with identity | **Identity plate** (`pf-plate`): title in the pixel heading, track tag, byline "By {handle}" (handle link, never a name, "a builder" without handle), one-line description. No avatar; a square letter plate is NOT used here (profile keeps its ID plate). |
| Stats row of big numbers | **Stats row** of four ruled cells: Journal entries, Approved hours, Depth, Used by. Numbers in the display font (as `pf-stat-list`), labels in the dot font. "Used by" only for an open-source project. |
| Pills for Source, Edit | `pf-btn` row: Source (external link, host shown), Demo, Edit project. Secondary outline; one filled primary at most. |
| Action nav with a primary | **Actions row**: New journal entry (disabled, reason), Start timelapse, Submit for review (disabled, reason). Same disabled-with-reason pattern as the Toolbelt (`aria-disabled`, visible reason). |
| Feed below | **Journal** section (empty today) and **README** section (as the reviewer site renders it, once available; empty line today). |
| Notices | Existing stage strip becomes the **Stage band** under the plate (one line, as today), kept. |
| Discover rail search, command palette | **Search-first header** on Explore and the **Find a tool combobox** on the project page. One shared result row. |
| Tabs For you / New / Popular | **Rails** with a job each (Explore) and a track filter. No "For you" (no algorithm), no Following (no follows, plan). |
| Wishlist star | **Save** star on projects (bookmark) and **wishlist** star on shop items (closed until the Shop release). |
| Shop category tiles | **Category rail** of the five tags (four tracks and General) drawn as ruled tiles with three small photos. |
| Shop New and Popular rails | **Recently added** (last items in the catalogue order marked new) and **Within reach** (items you can afford now). No sales figures exist, so no "Popular". |
| Shop toolbar | Search, sort and Affordable only, as now, moved into one bar. |
| Item card with star and price | **Item card** with the photo, kind, name, tags, Ore price chip and the star. |
| Order box beside the item | **Price box** beside the photo, sticky at 900 px and up. |

Not adopted: followers, likes, reposts, avatars, region dropdown, stock ribbons (no stock data), "given out" counts (invented numbers), banners from uploads, in-place edit of the hero (the existing Edit project dialog stays), gradient and rounded pill styles.

## C. Shared parts (built first, used by all three packages)

### C.1 Save (bookmark)

Data already exists: `ProjectBookmark` (migration `20261116190000_project_bookmarks`), pure rules in `lib/platform/bookmarks.ts` (`canBookmark`, `checkBookmarkLimit`, `toggleOutcome`, `MAX_BOOKMARKS` 200) with tests, and search rules in `lib/platform/search.ts` (`parseSearchQuery` with `track:` and `by:`, `rankResults`, `highlightRanges`) with tests. Saved is private to the person who saved it.

- **Component `SaveButton`** (`app/_components/platform/SaveButton.tsx`, client). Props: `projectId`, `saved: boolean`, `title`, `variant: "card" | "row" | "button"`, `onChange?`. Native `button` with `aria-pressed`. Name is "Save {title}" or "Saved {title}" is NOT used: the name stays "Save {title}" and `aria-pressed` carries the state (do not change the label with the state). Visible text only in the `button` variant: "Save" and "Saved". In `card` and `row` variants a 44 by 44 target with the star glyph and a `pf-sr` name.
- Glyph: a pixel star, 12 by 12 grid, `shapeRendering="crispEdges"`, `fill: currentColor` when saved, outline (2 px stroke path) when not. Same drawing language as the check and plus paths already in the codebase. Colour `--pf-fg`; saved uses `--pf-ac` fill with `--pf-fg` outline so the state is not colour alone (filled versus outline).
- Server action `toggleBookmark(projectId)` in `lib/platform/profile-actions.ts` style: returns `{ status: "saved" | "removed" | "limit" | "error", saved, count, message }`. Rules from `bookmarks.ts`. Optimistic: flip at once, roll back on error with the message in the status line.
- Messages: "Saved." / "Removed from Saved." / "You can save up to 200 projects. Remove one first." / "That project was not found." / "Could not save. Try again."
- Live message: one `role="status"` per page region (the page keeps a single status element, `pf-saved` style) so a screen reader hears the result. Focus stays on the button.
- Own projects can be saved (`canBookmark` allows it). On the owner's own project page the button is not shown (nothing to save from yourself); it is shown on the Explore detail, including for own projects.

### C.2 Search endpoint

`GET /api/platform/projects/search?q=&track=&scope=explore|tools&saved=1&limit=` (route `app/api/platform/projects/search/route.ts`, owner of the package that builds it: Explore). Auth: the viewer session (same guard as the pages, 401 plain when none). Rate limit with `searchLimiter` (30 per 10 s per viewer, `lib/platform/rate-limit.ts`); on limit answer 429 with `{ error: "slow" }` and the UI says "Searching too fast. Wait a moment."
- `scope=explore`: approved, not hidden, owner not banned (as Explore today).
- `scope=tools`: the `searchEquippableTools` rules (approved, visible, has `repoUrl`, not the viewer's own, maker has not blocked the viewer, owner not banned). A blocked maker's tool never appears and is never explained.
- Result shape: `{ results: [{ id, title, description (160 chars), track, ownerHandle, usedBy, openSource, saved, repoHost (host and path only, https only, else null), href }], total, query }`. At most 8 for the combobox, 24 for Explore results. Ranked with `rankResults` (saved and used break ties). Empty query returns the empty-query set (C.3).
- No emails, no names, no ids of people. Cache `private, no-store`.

### C.3 Empty query results

When the query is empty the endpoint returns, for `scope=tools`: the viewer's **Saved** open-source projects first (up to 5), then **Used most** (by `usedBy`, up to 5), de-duplicated, with each row carrying `group: "saved" | "popular"`. For `scope=explore` the empty query is not used (the page shows rails).

### C.4 Result row (`ProjectResultRow`, used in the combobox and in Explore live results)

One line plan, 56 px high at 1440 and 72 px at 390 (two lines). Anatomy, left to right:
1. **Track swatch** 12 by 12 (existing `pf-swatch`/`data-track` colours) plus the track name in the dot font on desktop; at 390 only the swatch and the name below the title.
2. **Title** (pixel font 16 px, uppercase as card titles, one line, ellipsis) with matched text wrapped in `mark` using `highlightRanges` (`mark` styled with `--pf-ln` background and `--pf-fg` text, underline 2 px so it is not colour only).
3. **Meta line** (dot font 11 px): "by {handle}", "Used by {n}", and for the tools scope the repo host and path (`github.com/owner/repo`, plain text, not a link inside an option; the link is on the detail page).
4. **Description** (one line clamp, 13 px, muted).
5. **Save star** at the right (variant `row`).

In the combobox the Save star is **not** inside the option (nested interactive content in `role="option"` is not allowed). It is a sibling button positioned in the row; see F.3 for keyboard.

### C.5 New `pf-` components and files

New components (all in `app/_components/platform/`): `SaveButton.tsx`, `ProjectResultRow.tsx`, `ProjectHero.tsx` (cover plus plate plus stats), `StatsRow.tsx`, `ToolFinder.tsx` (the combobox), `ToolStep.tsx` (inline equip step), `ExploreSearch.tsx`, `ExploreRails.tsx`, `ShopHub.tsx` pieces as listed in section G. New CSS (one per package, imported by the components, never edit `platform.css`): `project-page.css`, `explore.css`, `shop.css`. Tokens only: `--pf-*`, `--tk-*`, `--font-pixel`, `--font-dot`, `--font-display`, `--pf-ease`.

## D. PROJECT PAGE (owner page, `/dashboard/projects/[id]`)

### D.1 Layout at 1440 (content column 1032 px, existing centre column)

Top to bottom, above the fold marked:
1. **Crumb row**: "Back to projects" left, **Edit project** right (existing). 40 px.
2. **Hero cover** (`pf-hero`): full column width, 4.7 to 1 (about 220 px). Status badge top left, track badge top right, depth chip bottom left (existing `ProjectCover` pieces; `ProjectCover large` is replaced by `ProjectHero`). No other text on it.
3. **Identity plate** (`pf-plate`), joined to the cover with no gap (border shared, one hard shadow around both). Two columns inside, 1fr and 320 px:
   - Left: `h1` title (pixel, 44 px), description (lead, max 65ch, or the muted "No description yet."), byline "By {handle}" plus the track tag and a **Locked** tag when the track is locked. Under it the **action row**: primary "New journal entry" (disabled with reason), "Start timelapse" (external), "Source" and "Demo" links when set (host text).
   - Right: **stats row** (`pf-stats-row`): four cells in a 2 by 2 grid: **Journal entries 0**, **Approved hours 0 H**, **Depth 0 M**, **Used by n** (open source only; otherwise **Pending hours** so the grid stays 2 by 2). One hint under: "Depth is your approved hours in metres: 1 M for every approved hour." (kept, `pf-hint`).
   - Above the fold at 1440 (900 px viewport): crumb, cover, plate, action row. The stage band follows at about 640 px.
4. **Stage band** (existing `StageProgress`, unchanged).
5. **Toolbelt** section, first-class (F). It comes right after the stage band, before Hackatime and Ship, because the owner asked for it to be the first-class working area and because search makes it short (about 220 px when closed).
6. **Two-up row**: Hackatime (existing box) and Ship requirements (existing box).
7. **Journal** (was Timeline; keep the existing `pf-timeline`, retitled "Journal", same empty line "No journal entries yet. Journals open in a later release.") and **README** box (empty line "The README shows here once the source address is set and readable." Not rendered when no `repoUrl`).
8. **Toolbelt users** (maker view, existing `ToolbeltUsers`, unchanged contract) when applicable.
9. **Delete project** (existing) last.

Section nav: a one-line **ruled jump list** under the plate: "Toolbelt, Hackatime, Ship, Journal" as anchor links (`nav aria-label="On this page"`), shown from 900 px up only, sticky nothing. The existing "Toolbelt: 0 of 2 slots in use. Used by n builders." summary line is deleted (the stats row and the section header carry it).

### D.2 Layout at 390

One column, 16 px gutters. Order: crumb row (Back, Edit button 44 px), hero cover at 3 to 1 (130 px high), plate (title 30 px, description, byline, tags), stats row 2 by 2 (cells 44 px minimum), actions as full-width buttons stacked (primary first), stage band, Toolbelt, Hackatime, Ship, Journal, README, Toolbelt users, Delete. No jump list. At 390 the Toolbelt header starts about 780 px down (it was 1900 px).

### D.3 States (page level)

| State | Behaviour |
|---|---|
| Own project, any status | Page as above. Non-owner gets the existing 404 (the Explore detail is the public view). |
| No description | Muted "No description yet." |
| No track | Cover neutral, track badge omitted, tag line "Track not picked", stats unchanged. |
| Locked track | "Locked" tag, reason title "Locked on submit". |
| No handle on the viewer | Byline "By a builder". |
| Submitted, in review, approved | Primary action area replaced by the status sentence (existing next-step text); Toolbelt slots closed per F.8. |
| Loading | Server-rendered; no skeleton needed. Client parts (finder results) show the inline loading text in F.4. |
| Error | Existing route error page. Actions show an alert in place. |
| Banned owner | Not reachable (session). |

### D.4 Copy

"Journal entries", "Approved hours", "Depth", "Used by", "Pending hours" (cell labels). Cell text "0", "0 H", "0 M". Actions: "New journal entry", "Start timelapse", "Source", "Demo", "Edit project". Reason under disabled primary: "Journal entries open in a later release. Hardware ships need a Lapse recording. Planning 7+ hours? Record the session." (existing). Jump list: "Toolbelt", "Hackatime", "Ship", "Journal". README empty: "The README shows here once the source address is set and readable."

### D.5 Accessibility, motion

Landmarks: `main`, the hero is decorative (`aria-hidden` on the dither, badges are real text), `h1` once, sections have `aria-labelledby`. The stats row is a `dl`. The jump list is a `nav` with a name. No motion on this page except the existing button press. Focus order follows visual order: Back, Edit, primary, secondary links, jump list, then sections.

## E. EXPLORE (`/dashboard/explore`, `/dashboard/explore/[id]`)

### E.1 Layout at 1440

1. **Search-first header** (`pf-xsearch`): a full-width combobox row (52 px) with a pixel magnifier at the left, the input ("Find a project or a builder", visible label "Search projects" above it in `pf-sr` only is NOT enough: use a visible dot-font label "Search" 11 px above the field), a Clear button when it has text, and the hint line under it: "Try a name, a builder, or track:tools or by:handle." Results appear **live under the input** in a `pf-xresults` panel that pushes the rails down (no overlay, no layer, so no focus trap). Same row component as the project page finder, but with scope `explore`, up to 12 results, "Show all results" link to `?q=` for the full list (keeps today's server-rendered, linkable search and works with no JavaScript).
2. **Filter row** (kept): All tracks, Tools, Systems, Compute, Hardware, plus **Saved** as the sixth chip (with the count: "Saved 3"). Chips are links with `aria-current` as now. Saved filters to the viewer's saved list (`?saved=1`).
3. **Rails** (when no query and no filter), each a `section` with an `h2`, a ruled head row ("See all" link when there are more) and a **horizontal strip** of compact cards (`pf-shelf`, scroll-snap, 4 visible at 1440, 1.5 visible at 390, arrow buttons from 900 px up, keyboard scroll by focus, native overflow):
   - **Saved** (only if the viewer has any; first, because it is theirs). Up to 8.
   - **New** (newest approved). Up to 8.
   - **Used most** (by confirmed uses; open-source only; hidden when everything is 0).
   - **By track**: four short rails named "Tools", "Systems", "Compute", "Hardware", 4 each, each with "See all {track}" link. Shown only when the track has projects.
4. When a query or filter is active the rails are replaced by the **result grid** (existing `pf-project-grid`, 3 columns at 1440 using the compact card, 2 at 700, 1 at 390) with a count line `role="status"`: "12 projects." and the Clear link.
5. Compact card (`ExploreCard` rework, section E.3). Page width stays 1032.

### E.2 Layout at 390

Search field full width, Clear at the right inside the field (44 px target). Hint under it. Filter chips wrap as now (2 rows; "Saved 3" last). Rails stack; each strip scrolls horizontally with 1.2 cards visible and snap, the head row shows "See all". Results grid one column. The live results panel shows at most 6 rows; "Show all results" below.

### E.3 Card anatomy (compact, replaces the 168 px cover)

200 px wide in a strip, equal column in a grid. Top: a **short cover** (96 px, dithered core in the track colours, no depth chip, no badges except the Save star at top right and nothing at left). Body: title (pixel 16 px, one line), description (two-line clamp, 13 px), then a **foot line** in the dot font: "by {handle}" left, "Used by {n}" right for open source, "{n} H" otherwise. No status badge on Explore (every project is approved; the status was noise). Track name shown as a 12 px swatch plus word at the top left of the cover on a plate (existing `pf-badge`). The whole card is a link; the Save star is a sibling button placed over the cover corner (not inside the link): in the DOM the star button comes after the link inside the `li`, positioned absolutely. The card height is fixed by content, not by the cover.

### E.4 Explore detail (`/dashboard/explore/[id]`)

Same shape as the project page, read only:
1. Crumb row: "Back to Explore" left; **Save** button (variant `button`, text "Save" / "Saved") right.
2. Hero cover with the approved badge and track badge and the depth chip.
3. Identity plate: title, description, byline "By {handle}" (link to the profile), track tag. Stats row: **Approved hours**, **Depth**, **Journal entries** (0 until journals), **Used by** (open source).
4. Action row: "Source" (external, host text) and "Demo" when set. Nothing else.
5. Two-up row: **Used by** (handles, 12 and "and {n} more", else "No one has equipped this project yet.") and **Tools in this project** (as now). The old "Links" box is removed (links moved to the action row).
6. **Journal** and **README** boxes as D.1, read-only.
At 390 the same order in one column, Save as a 44 px button at the right of the crumb row.

### E.5 States

| Block | Empty | No results | Loading | Error | Disabled | Own vs other |
|---|---|---|---|---|---|---|
| Live results | Hint line only (no panel) | "No projects match. Clear the search." | Inline text "Searching." in the status line after 200 ms (no skeleton, the rows appear in place) | "Search is not available. Try again." and the full-page link still works | none | Own approved projects appear and are marked "Yours" in the meta line |
| Saved rail | Omitted when none. On the Saved filter: "You have not saved anything yet. Press the star on a project to keep it here." | Filter plus query: "No saved projects match. Clear the search." | n/a | Save error in the status line | Star `aria-disabled` at 200 with "You can save up to 200 projects. Remove one first." | Saved is private; the page says "Only you can see this list." under the Saved heading |
| New, Used most, By track | Rail omitted if empty | n/a | n/a | n/a | n/a | n/a |
| Whole page, nothing approved | "Awaiting the first projects. Approved projects from builders show up here." | n/a | n/a | route error page | n/a | n/a |

### E.6 Interactions and focus

- The input uses the combobox pattern (F.3) with scope `explore`. Enter with no option active submits the form (full results page, `?q=`); Enter with an option active opens that project.
- The filter chips are links, so a filter change is a navigation; focus lands on the page `h1` (`pf-sr` one) as the framework does now, and the count line announces.
- Strip arrows (`button`, "Scroll {rail} left/right", `aria-controls` the strip) scroll by one card width; the strip is also a `tabindex="0"` region named by its heading only when it has no focusable child (it always does, so no tabindex). Disabled arrows at the ends are `disabled`.
- Save: C.1.

### E.7 Copy

Label "Search"; placeholder "Find a project or a builder"; hint "Try a name, a builder, or track:tools or by:handle."; "Clear"; "Show all results"; rails "Saved", "New", "Used most", "Tools", "Systems", "Compute", "Hardware"; "See all"; "See all Tools"; "12 projects."; chips "All tracks", "Tools", "Systems", "Compute", "Hardware", "Saved 3"; "Save", "Saved"; "Only you can see this list."; empty and error lines as the table.

## F. TOOLBELT, search-first (replaces 3.14 and 3.15 of profile-and-toolbelt.md, keeps 3.16 and 3.17)

### F.1 Layout

Section `Toolbelt` (`pf-belt`, one `pf-box`) on the project page after the stage band. From top:
1. **Head row**: `h2` "Toolbelt" left, "{n} of 2 slots in use" right.
2. **Find a tool** (`ToolFinder`): label "Find a tool" (visible, dot font), a full-width combobox input with a pixel magnifier, hint "Search approved open-source projects from other builders. Press the star to save one for later." and a status line. Shown only while a slot is free and equips are open (F.8).
3. **Inline step** (`ToolStep`): appears under the finder, replacing the results, when a result is chosen (F.5).
4. **Slots**, compact: two rows (not tall dashed boxes) in a `ul` (`pf-belt-slots`, one column at all widths, two columns from 900 px). A **filled slot** is a ruled row: use chip, tool title link, "by {handle}", Remove button right, and the use note below in full (wrapped, up to 500). An **empty slot** is one 44 px line: "Slot 1 is free" in the muted dot font with no button; the finder above is the way in. This keeps the two slots visible without two large "Equip a tool" targets.
5. **Declined lines**, **Gate card** (4 lines, hatched hours meter) and the **Provisional rewards note**: unchanged in content and rules from 3.14, moved below the slots. At 1440 the gate card and the note sit in a two-column row (gate 1fr, note 320 px); at 390 they stack. The numbers appear once, as before.
6. **Saved tools** line: when the viewer has saved open-source projects not yet equipped, a short ruled list "Saved tools" (up to 3 rows of `ProjectResultRow` with an **Equip** text button each) under the slots; "See all saved" link goes to Explore Saved. Hidden when none or when no slot is free.

At 1440 a closed Toolbelt with two empty slots and no saved tools is about 230 px high (head 40, finder 90, slots 88). At 390 about 330 px.

### F.2 Why a combobox and not a dialog

The owner's point: one task, "find a project and attach it". The dialog had a search, a radio list, a note and two buttons in a layer. The combobox does the find inline, the note appears in place, no focus trap, no layer, state stays on the page. Equip dialog (`EquipDialog.tsx`) is removed once this ships; `ConfirmDialog` stays for Remove and Block.

### F.3 Combobox (ARIA 1.2 editable combobox with list autocomplete, popup is a listbox that is part of the page flow)

- Input: `role="combobox"`, `aria-expanded`, `aria-controls="{id}-list"`, `aria-autocomplete="list"`, `aria-activedescendant` (the active option id or empty), `autocomplete="off"`, `type="text"` (not `type="search"`, to keep the role), `inputmode="search"`, `maxlength 80`, `enterkeyhint="search"`. Name from the visible label.
- List: `ul role="listbox"` `aria-label="Tools"` (or labelled by the group heading), grouped when the query is empty with `role="group"` and `aria-labelledby` for "Saved" and "Used most"; options `li role="option"` with `aria-selected` on the active one, `id` per option, accessible name = title, "by {handle}", "used by {n}", track, "saved" if saved (set with `aria-label` on the option so the star and highlight markup do not read twice).
- The Save star is a real `button` that is a **sibling** of the option inside the row `div`, tabbable only by the **Tab key** (not by the arrows) and also reachable with a shortcut: with an option active, **Space is not used** (it types in the input); use **Alt+S** to toggle Save on the active option (announced by the status line). On touch the star is directly tappable. This avoids nested interactive content and keeps arrows simple.
- Keys: typing filters (debounce 150 ms, results fetched from C.2 `scope=tools`); **Down** opens the list when closed and moves to the next option, wrapping at the end; **Up** moves to the previous, wrapping; **Home** and **End** with the list open move the caret (input default), not the option; **Enter** with an active option chooses it (opens the inline step F.5); **Enter** with none active and one result chooses that result; **Escape** once closes the list and keeps the text, a second Escape clears the input; **Tab** closes the list and moves on without choosing. Focus never leaves the input while arrowing (`aria-activedescendant`).
- Mouse and touch: click or tap an option chooses it; the list does not close on blur until focus goes outside the combobox and its list.
- The list sits in the flow under the input, max height 320 px with its own scroll (about 5 rows at 1440, 4 at 390), `overscroll-behavior: contain`. No portal, no z-index layer.
- **Status line** (`role="status"`, `aria-live="polite"`, always rendered, `pf-hint`): empty query "Saved and most used tools." ; typing "Searching." after 200 ms ; results "{n} tools match." (singular "1 tool matches.") ; none "No tools match. Clear the search." ; error "Search is not available. Try again." ; rate limit "Searching too fast. Wait a moment." ; saved toggle "Saved {title}." or "Removed {title} from Saved.". Updates after a 250 ms pause like today's count, so a screen reader hears one message.
- Result rows: C.4, with tools scope (repo host and path in the meta line).
- Min touch target 44 px per row; the whole row except the star chooses the option.

### F.4 States of the finder

| State | Behaviour |
|---|---|
| Idle, empty input, closed | Hint and label only. Opening (focus then Down, or click into the field) shows the empty query set (Saved, then Used most). |
| Empty query, none saved, nothing popular | List shows one row of text (not an option): "No tools to equip yet. Tools show up here once other builders have an approved, open-source project." Same text when everything eligible is blocked or hidden: a block is never revealed. |
| Loading | After 200 ms the status line says "Searching."; the previous rows stay (no flash to empty); `aria-busy="true"` on the list. First load of the empty set shows three ruled skeleton rows (the same height as a row, `--pf-ln` bars, no shimmer) for at most 600 ms. |
| Results | Rows with highlight; first row is not auto-active (so Enter submits nothing by accident), except when only one result matches. |
| No results | The "No tools match" line plus a **Clear** button inside the list; focus stays in the input. |
| Error | Alert line `role="alert"` in the status area with a **Try again** button (re-sends). The input is never disabled. |
| Already equipped | The row is not shown (filtered by the server by `projectId`; the endpoint takes `exclude=projectId` and omits tools already pending or confirmed, includes declined ones as normal). |
| Disabled with a reason | When slots are full or closed the finder is not rendered; one reason line is, as today: "Both slots are in use. Remove one to equip another." or "Equips are closed once a project is submitted. They open again if a reviewer asks for changes." The line is visible text under the head row. |
| Own vs other | The finder never lists the viewer's own projects. The maker view (Toolbelt users) is unchanged and shows only for the owner. |

### F.5 Inline step after choosing a result (replaces the dialog)

1. Choosing a result closes the list, fills the input with the tool title (read only visually, `aria-readonly`) and opens `ToolStep` right under it (a `form`, `pf-belt-step`, ruled box with a 4 px left bar like the slots). The input remains editable: typing again cancels the step.
2. Step content: a summary line (track swatch, title, "by {handle}", "Used by {n}", repo host text), then **Use note** textarea (label "How does your project use it?", hint always visible: "Name the file or feature that uses the tool. Example: calls the parser in src/build.ts to read every config file.", counter "{n} of 500" in the hint line, `minlength` 10, `maxlength` 500, 3 rows), then actions: **Cancel** and **Equip tool** (`pri`). Submit stays enabled until pressed (the inline errors explain).
3. Focus moves to the note textarea when the step opens (announce: the step has `role="group"` `aria-label="Equip {title}"`).
4. Errors (inline, same messages as before): "Write at least 10 characters." "Keep it to 500 characters." and the action alerts "You can equip two tools in one project." "You already equipped this tool." "This tool is not available." "You cannot equip your own project." Errors link to the note by `aria-describedby`; the note is focused on error.
5. Cancel: closes the step, clears the note, returns focus to the finder input. Escape inside the step does the same.
6. Success: the step closes, the new slot row appears with a `Pending` chip, the finder resets, the status line (`role="status"`, as today) says "Equip sent. It stays Pending until a reviewer confirms it." and **focus moves to the new slot's chip** (`tabIndex=-1`, `data-focus="chip-{toolId}"`, existing mechanism). If that was the second slot, the finder disappears (full) and the reason line shows.
7. While saving: Equip shows "Saving" and is disabled; Cancel stays enabled.
8. Remove: unchanged (ConfirmDialog; after success focus goes to the finder input if a slot is free, else to the Toolbelt heading).

### F.6 Mobile (390)

The finder input is 52 px high, full width, the label above. Results list max height 280 px; rows two lines, star 44 px at the right. The step is full width under the finder; the textarea min height 88 px; buttons stack, Equip first. With the soft keyboard open the list scrolls inside itself and the step scrolls into view (`scrollIntoView({ block: "nearest" })` on open and on error, no smooth scrolling under reduced motion).

### F.7 Slot, chips, gate, note

Unchanged from profile-and-toolbelt.md 3.14: chips Pending (dashed), Confirmed (solid ok border with check glyph), Declined (solid err border); word carries meaning; gate lines (only hours can tick), "Checked at review" for the other three, hatched meter, "A reviewer confirms each use after you submit. Nothing here pays Ore.", provisional note once with the Provisional tag and no link.

### F.8 Closed and full

Closed (submitted, in review, approved): no finder, the reason line, slots listed read only (Remove only on pending and declined as `canRemoveUse` says). Full: no finder, "Both slots are in use. Remove one to equip another." Declined uses do not count and are listed with Remove.

## G. SHOP (`/dashboard/shop`, `/dashboard/shop/[id]`), on the existing 70 item sample catalogue

Rules that do not change: Ore prices are the same everywhere; each item names its tracks or General; the best related track's discount applies, never summed; Requisition note only where eligible; nothing can be ordered (the closed notice stays); proposed items at draft prices; the oscilloscope and graphics card keep their level lock; photos and credits as now.

### G.1 Hub layout at 1440

1. **Top bar** (`pf-shop-top`): search combobox-free simple field with live filtering (see G.4) left (flex), Ore plate right: the Ore gem, the balance, "10 Ore per approved hour" under it. The four discount values (Tools 4.8 percent off and so on) become a **ruled discount row** under the top bar, in one line, each a link to the track page (kept from the current plate). The closed notice moves to a one-line strip under the discount row: "Ordering opens in a later release. These are proposed items at draft prices." with the link "Your orders and wishlist".
2. **Category rail** (`pf-shop-cats`): five tiles in one row (Tools, Systems, Compute, Hardware, General), each a link to `?tag=`, 1fr each, 120 px high: three small product thumbnails (the first three items of that tag that have a photo, 40 px, pixel-crisp, no overlap) on a `--pf-panel` plate, the tag name in the pixel font, the item count in the dot font ("17 items"), the track swatch. At 390 a 2 by 3 grid of 96 px tiles (General spans two columns).
3. **Recently added** rail: the last eight items of the catalogue marked `added` (new field `addedAt` or simply the last eight entries; default: the eight entries from the "From Stardance's prize list" group and the newest boards, curated by an `isNew` flag in `shop.ts`). Horizontal strip, compact item cards.
4. **Within reach** rail: items whose final price is at or below the Ore balance (with balance 0 today the rail is omitted). Replaces "Popular", for which no data exists.
5. **All items** section: heading, count line `role="status"`, sort links (Featured, Price low, Price high, Affordable only; as now), the **grid** (3 columns at 1440, 2 at 700, 1 at 390 where cards turn into a horizontal row card, G.3), page size 24 with "Show more" (a link to `?page=2`, no infinite scroll; today's 70 items in one scroll is removed). When a query or tag is active the rails and category tiles collapse and only the grid shows, with the active tag as the page title.

Above the fold at 1440 (900 px): top bar, discount row, notice, category tiles and the top of Recently added.

### G.2 Layout at 390

Top bar stacks: search full width, Ore plate under it (one line: gem, balance, "10 Ore per approved hour"). Discount row becomes a two-column ruled list. Category tiles 2 by 3. Rails are horizontal strips with 1.3 cards visible. The All items grid is one column of **row cards** (88 px photo left, text right) so one screen shows five items instead of one (the current card is 340 px tall at 390).

### G.3 Item card anatomy (compact, `ShopCard` rework)

Photo area 4 to 3 at 200 px wide (in strips) or the grid column; `pf-shop-photo` kept (sprites stay pixelated, logo flip kept). Top-left: **Limited** or **Needs {track} LV.{n}** badges (existing `pf-badge`). Top-right: the **wishlist star** (G.5). Body: kind (dot font 11 px), name (pixel 16 px, two lines max), tags (swatches, as now, one line). Foot: the **Ore price chip**: the Ore gem (existing `pf-ore-icon`, 16 px), the final price in the pixel font, struck base price when discounted (with `pf-sr` "Was" and "now"), then "{n} H of work" in the dot font at the right. No ribbons for stock or "given out". The chip is a plain bordered box (`--pf-fg` 1 px, square), not a button; the whole card links to the item. The star is a sibling button over the photo corner, as on Explore cards.

### G.4 Search and filters

Search is a single field with a visible label "Search the shop", filtering the **grid** live in the page (client filter over the catalogue slice already sent, with the same match as `filterShopItems`: name, kind, blurb) and keeping the address in sync with `?q=` via `history.replaceState` after a 300 ms pause; Enter and a submit button (kept, labelled "Search") work with no JavaScript. Not a combobox: results are the page itself. The status line `role="status"`: "70 items." then "6 items match." or "No items match. Clear the filters." Category tiles, tag chips and sort remain links (state in the address, shareable). Chips row (kept) sits under the category rail only in result mode, so there are not two filters for the same thing in view.

### G.5 Wishlist

Plan 02: a personal wishlist that does not reserve stock, lock a price or guarantee availability. Wishlist data is sample only today (`WISHLIST_IDS` in `orders.ts`, "Ordering and wishlists open with the Shop release. Nothing here is saved."). So:
- The star on cards and the item page is rendered as an `aria-disabled="true"` button (focusable), named "Add {item name} to your wishlist", with the reason as visible `pf-hint` text on the item page ("Wishlists open with the Shop release. Nothing is saved yet.") and as the `aria-describedby` of the card star pointing at the single notice strip text on the hub ("Ordering and wishlists open with the Shop release."). The activation is ignored. Items already in the sample `WISHLIST_IDS` show the filled star and `aria-pressed="true"`.
- No persistence is built by this package. When the Shop release adds it, the star becomes live with the same markup (it reuses `SaveButton`'s glyph and a `WishlistButton` variant). Open question 4.

### G.6 Item page (`/dashboard/shop/[id]`)

1. Crumb row: "Back to Shop" left; **star** right (wishlist, G.5, variant `button`: "Wishlist").
2. Two columns at 900 px and up (photo column 1fr, buy column 400 px, gap 32): **left** the photo panel (existing, 4 px hard shadow), under it the credit line, then **About** (blurb as the lead, the kind, the tags, and for locked items the lock note) and **Related** (a strip of up to 4 items sharing a track, compact cards). **Right**, `position: sticky; top: 88px` (below the top bar): the **price box**: kind and Limited tag, `h1` name, the **Ore price chip** large (final price in the display font with the gem, struck base when discounted), the "That is about {n} approved hours of work." hint, the price lines (Base price, level discount, You pay) in the existing `pf-shop-lines`, the requisition sentence only where eligible (unchanged rules), the lock note, then one full-width button "Order opens later" (`aria-disabled`, reason visible: "Ordering opens in a later release. This is a proposed item at a draft price." with the "How prices are worked out" link). The button exists so the page has a call to action in the place buyers expect and so the closed state is the designed state.
3. At 390 one column: crumb, photo (4 to 3), name and price chip, tags, price box (not sticky), button, About, Related strip (horizontal).
4. This removes today's empty 700 px under the photo at 1440.

### G.7 States

| Block | Empty | No results | Loading | Error | Disabled | Notes |
|---|---|---|---|---|---|---|
| Category tile | tag with no items: not drawn | n/a | n/a | n/a | n/a | thumbnails fall back to the tag swatch |
| Recently added, Within reach | omitted when empty | n/a | server rendered | n/a | n/a | Within reach hidden at balance 0 |
| All items grid | "The catalog is empty." | "No items match. Clear the filters." / afford only "Nothing you can afford yet. Every approved hour earns 10 Ore. Show everything" | live filter instant, no loader | route error page | wishlist star `aria-disabled` with reason | sort and tag in the address |
| Item page | unknown id is the 404 | n/a | n/a | n/a | Order button `aria-disabled` with reason; wishlist star with reason | locked item shows the lock note |

### G.8 Copy

"Search the shop", "Search", "Recently added", "Within reach", "All items", "See all", "{n} items.", "{n} items match.", "No items match. Clear the filters.", "Show more", "Wishlist", "Add {name} to your wishlist", "Wishlists open with the Shop release. Nothing is saved yet.", "Order opens later", "Related", "About", "Back to Shop", "{n} H of work", "Needs {Track} LV.{n}", "Limited".

## H. Cross-cutting

### H.1 Reuse list (do not re-implement)

`PageHead` (not used on these pages), `ProjectCover` (kept for the profile; the hero uses its badge and depth pieces), `DepthValue`, `StageProgress`, `HackatimePanel`, `ToolbeltGate`, `ToolbeltUsers`, `UseChip`, `ConfirmDialog`, `EditProjectDialog`, `DeleteProject`, `ShopPhoto`, `ShopTags`, `pf-box`, `pf-btn`, `pf-tag`, `pf-badge`, `pf-hint`, `pf-empty`, `pf-error`, `pf-saved`, `pf-checks`, `pf-new-plus` markup, `pf-swatch`, `pf-ore-icon`, `pf-shop-lines`, `pf-timeline`, `pf-explore-filters` (chips), `pf-project-grid`, `pf-sr`, the hatched gradient of `pf-belt-meter`. Existing e2e names to keep working or update in the same change: "Equip a tool" button role is replaced by the combobox named "Find a tool", "Equip tool" button stays (now in the inline step), the status text "Equip sent. It stays Pending until a reviewer confirms it." stays.

### H.2 Motion (emilkowal rules applied)

Only what serves: (1) result list rows fade in with opacity only, 120 ms, `--pf-ease`, never on keyboard navigation between options; (2) the inline step opens with a 160 ms opacity and 4 px translate, ease-out; (3) the Save star press uses the existing button press (scale 0.97, 160 ms in, 80 ms out); (4) strips use native scroll snap, no scripted scroll animation. Nothing animates height. No motion for keyboard-initiated option changes. All of it behind `prefers-reduced-motion: no-preference` and `html:not([data-motion-paused="true"])`, as `platform.css` does; reduced motion shows the final state at once. No scroll-linked effects, no parallax, no marquee.

### H.3 Accessibility

WCAG 2.2 AA in both themes, the colour-vision palettes, 150 and 200 percent text, wider spacing, larger controls. Target size 44 px for rows, stars and chips. Focus: existing `:focus-visible` outline, never removed; the active option in the combobox shows a 2 px inset outline in `--pf-focus` plus a left bar (not colour alone). Highlight uses underline plus background. State words, not colour, carry Saved (filled star plus `aria-pressed`), Pending, Confirmed, Declined. The star label does not change with state. All status messages in one live region per area, debounced. Skeleton rows are `aria-hidden`. Horizontal strips are keyboard reachable through their links and arrow buttons and do not trap focus. The sticky price box never covers content (no overlap at 200 percent text: sticky only from 900 px and only when the viewport is taller than the box). No horizontal page scroll at 320, 390, 471, 700, 900, 1440.

### H.4 Pre-flight (design-taste and frontend-design-ui-ux)

- Identity lock: tokens, fonts, square corners, hard shadows, pixel headings, track colours, Ore gem only. Pass.
- Anti-slop: no gradient, glass, glow, avatars, rounded pills, three identical cards without roles, eyebrow labels above every section (section heads are real headings; the dot-font labels are field labels, not decoration; count of uppercase tracking micro labels above section headlines kept under one in three), no decorative dots, no fake numbers (all counts come from data; sample hours remain the owner-approved sample), no em or en dashes. Pass.
- Section layout repetition: project page uses plate, band, box, two-up, list; Explore uses search, chips, strips, grid; Shop uses top bar, tiles, strips, grid. At least four layout families per page. Pass.
- State coverage: tables in D.3, E.5, F.4, G.7. Pass.
- Accessibility: H.3 and the ARIA pattern in F.3. Pass, to be proven by axe at 390 and 1440 in both themes plus keyboard e2e.
- Cognitive load: one decision per area (find a tool; find a project; find an item). Rewards numbers appear once. Pass.
- Scored self-critique (1 to 5): distinctiveness 4, consistency 5, state coverage 5, accessibility 4 (the combobox is the risk, so a keyboard e2e is required), cognitive load 4. Nothing at 2 or below. Watch point: Explore rails could repeat the same card; mitigated by the Saved and By track rails having different heads and the compact card carrying the track swatch.

## I. Acceptance criteria

Project page and Toolbelt
- [ ] Project page shows crumb, hero cover, identity plate, four stats, actions, stage band, then the Toolbelt before Hackatime; at 390 the Toolbelt heading is within the first 900 px.
- [ ] "Find a tool" is an ARIA combobox: roles, `aria-activedescendant`, Down, Up, Enter, Escape (once closes, twice clears), Tab leaves; status text updates after 250 ms; empty query shows Saved then Used most.
- [ ] Choosing a result opens the inline step with the note focused; hint always visible; errors inline; success announces "Equip sent. It stays Pending until a reviewer confirms it." and focuses the new chip; no dialog is used for equip.
- [ ] Two slots shown compactly, full, closed and blocked cases show their reasons; a blocked maker's tool is never listed or explained; own project, third tool, duplicate and non-open-source are refused by the server with the existing messages.
- [ ] Gate card, hatched meter, provisional note (once, no link), Remove and Block confirms unchanged.
- [ ] Save star works in rows (Alt+S and tap), shows state with `aria-pressed`, limit message at 200.

Explore
- [ ] Search-first header answers while typing (debounced, rate limited), the full results page works with no JavaScript, `track:` and `by:` filters work, "Saved" chip filters the viewer's saved list.
- [ ] Rails (Saved, New, Used most, By track) appear only with data; strips scroll by touch and by arrow buttons; cards carry the Save star as a sibling of the link.
- [ ] Detail has crumb with Save, hero, plate, stats, Source and Demo, Used by, Tools in this project, Journal, README.

Shop
- [ ] Hub shows top bar, discount row, notice, category tiles, Recently added, Within reach (when affordable items exist), All items paginated at 24; at 390 the grid is row cards.
- [ ] Item page two columns at 900 up with a sticky price box, the Order opens later button `aria-disabled` with its reason, wishlist star `aria-disabled` with reason, Related strip; no empty area under the photo.
- [ ] Prices, discounts, requisition, locks, tags unchanged and correct for all 70 items.

All
- [ ] No new colour, font or radius; reduced motion honoured; no horizontal scroll at 320, 390, 471, 700, 900, 1440; axe finds no violation at 390 and 1440 in both themes on every changed page; `bun run typecheck`, `bun run lint`, `bun run test` pass; e2e (`platform.spec.ts`, `toolbelt.spec.ts`, `profile.spec.ts`) updated for the new Toolbelt entry and Explore header.

## J. Build order and work packages

Order: (0) shared parts C.1 to C.4 and the search route and actions, then three packages in parallel.

**Package 0, shared (small, done first, owned by the Explore worker):** `SaveButton.tsx`, `ProjectResultRow.tsx`, `app/api/platform/projects/search/route.ts`, `toggleBookmark` action, `bookmarks` and `search` wiring (the pure files exist), `lib/platform/search-data.ts` (DB reads for ranking and saved), tests. The other two packages code against the contracts in C.1 to C.4 (props and route shape) and stub with fixtures until Package 0 lands.

**Package A: PROJECT PAGE and TOOLBELT.** Files: `app/(platform)/dashboard/(shell)/projects/[id]/page.tsx`, `ProjectHero.tsx`, `StatsRow.tsx`, `ToolFinder.tsx`, `ToolStep.tsx`, `ToolbeltSection.tsx` (rework), `EquipDialog.tsx` (delete when unused), `toolbelt.css` (edit), `project-page.css` (new), `lib/platform/toolbelt-ui.ts` (+ tests for finder reducer: open, active index wrap, choose, escape), e2e `toolbelt.spec.ts`. Does not touch Explore or Shop files, `platform.css`, or shared C files except importing them.

**Package B: EXPLORE.** Files: `explore/page.tsx`, `explore/[id]/page.tsx`, `ExploreCard.tsx`, `ExploreSearch.tsx`, `ExploreRails.tsx`, `explore.css` (new), `lib/platform/explore.ts` (+ tests: rails selection, saved filter), plus all Package 0 files, e2e Explore tests in `profile.spec.ts` and `platform.spec.ts` Explore blocks. The detail page reuses `ProjectHero` and `StatsRow` from Package A as a read-only variant; to keep packages disjoint, Package B builds its own `ExploreHero.tsx` first and the two are merged in a later cleanup commit (open question 6).

**Package C: SHOP.** Files: `shop/page.tsx`, `shop/[id]/page.tsx`, `ShopCard.tsx` (rework, keep `ShopPhoto` and `ShopTags` exports), `ShopRails.tsx`, `ShopCategoryTiles.tsx`, `WishlistStar.tsx`, `shop.css` (new), `lib/platform/shop.ts` (add `isNew`, `relatedItems`, `categoryThumbs`, pagination helper, + tests in `shop.test.ts`), e2e Shop blocks in `platform.spec.ts`. `WishlistRow.tsx` and `orders` pages untouched except import compatibility.

The three packages share no files except the Package 0 contracts, and `platform.spec.ts` (each edits only its own `test()` blocks; merge by block). Commit one squashed change per package, no tool credit in any commit or PR text (workspace rules), screenshots at 390 and 1440 in both themes in each PR.

## K. Open questions with default answers

1. **Bookmark name.** "Save" and "Saved" (default) versus "Bookmark". Default: Save, as the Toolbelt copy and the table name `ProjectBookmark` already say "Saved".
2. **Saved visible to others?** Default: private, never listed (as the schema comment says).
3. **Explore "Used most" with all zeros.** Default: rail hidden until at least one project has a confirmed use.
4. **Wishlist persistence.** Default: not built here; stars are disabled with a reason until the Shop release (plan 02 keeps ordering closed). If the owner wants it live now, it needs a `WishlistItem` table and an action; the markup does not change.
5. **Shop "Recently added".** Default: a hand-set `isNew` flag on the last eight catalogue entries; no dates exist. Alternative: drop the rail until there are dates.
6. **Shared hero.** Default: Package B builds its own read-only hero, merged with Package A's `ProjectHero` in one follow-up so the packages stay file-disjoint.
7. **Equip dialog removal.** Default: delete `EquipDialog.tsx` once the inline step passes the e2e; keep `ConfirmDialog`.
8. **Alt+S shortcut.** Default: include it, documented in the hint line "Alt+S saves the highlighted tool", since the star cannot be an arrow target. Alternative: show the star only on hover and focus-within.
9. **Jump list on the project page.** Default: shown from 900 px up; drop it if the page reads busy.
10. **Page size of the shop grid.** Default: 24 with "Show more" as a link; the owner may prefer all 70 with category tiles only.
11. **Explore card without a depth chip.** Default: depth is dropped from cards (it is 0 M on every card today) and kept on the detail; revisit when real hours exist.

## L. Build handoff

- **Target:** this repository's engineering session (Next.js App Router, server actions, existing `pf-` CSS). Design system: the LOADOUT platform styles; no library added.
- **Instruction:** implement exactly this spec. Theme with the existing tokens; do NOT redesign or re-implement existing components; no motion, colour, font or radius beyond what is stated.
- **Skills:** the implementer loads the seven skills from `docs/development/ui-skills.md` before UI code. The design session loaded all seven and applied `frontend-design-ui-ux`, `frontend-design`, `design-taste-frontend` and `emilkowal-animations`; `svg-design`, `pixel-art-sprites` and `pixel-art-animator` were loaded and not applied (no new asset beyond a crisp-edge star and magnifier path, which follows the existing 12 by 12 path style).
- **Evidence in each PR:** this spec, checks run, screenshots at 390 and 1440 in both themes, axe results, keyboard e2e for the combobox.
