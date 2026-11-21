# Redesign phase 1: shell, navigation and the one modal

Owner change, 16 Nov 2026: the navigation is a left sidebar (a drawer on narrow screens), not the two-row top bar the plan drew in section 3.1. This brief is the current spec.

Binds to `.ulpi/design/DESIGN.md` and `docs/design/system/design-system.md`. Plan: `plans/proposals/participant-redesign-plan.md` sections 3.1, 3.9, 3.10 and phase 1. Owner answers: `plans/proposals/participant-redesign-decisions.md` (row 5 navigation, row 17 build base). Written 16 Nov 2026, before code.

**Design read.** Product UI for builders, a working surface, LOADOUT's own look kept (graphite and stone, Pixelify headings, IBM Plex Mono body, square corners, 1px outlines, hard offset shadow, no blur, no glow). The change is structure only: one sidebar with a clear hierarchy instead of seven spaced tokens in a top bar, and one modal instead of three shapes. The sidebar is in our pixel style: a square panel, a 1px outline, a hard offset edge, Pixelify section labels with a square marker, no copy of Pixl's layout. Dials: variance 3, motion 2, density 4. Skills loaded for this change: frontend-design-ui-ux, frontend-design, design-taste-frontend, emilkowal-animations, svg-design, pixel-art-sprites, pixel-art-animator. The last two apply to no asset here (no sprite is made or edited); no icon is added (Menu and Close are text buttons, and the user icon is the existing one).

## Sidebar and drawer

One `aside` (landmark "Site") holding the participant navigation. Same markup at every width; CSS decides whether it is a sidebar or a drawer.

```
Desktop, 900px and up                     Phone, under 900px
+------------+---------------------+      +--------------------------+
| LOADOUT    |                     |      | [Menu]  LOADOUT          |  slim strip, 56px
|            |   page (1080px      |      +--------------------------+
| PROJECTS   |   column, centred   |      |  page                    |
| EXPLORE    |   in the rest)      |
| SHOP       |                     |      Drawer open: sidebar slides over the page
| DOCS       |                     |      from the left, scrim behind it
|            |                     |
| [Ore  170] |                     |
| [theme]    |                     |
| [Account]  |                     |
+------------+---------------------+
```

- Desktop: 240px wide, sticky, full height, `--pf-panel` fill, 1px outline on its right edge and a 4px hard offset edge. Top: wordmark. Middle: the sections as a vertical list. Bottom: the Ore chip (links to the ledger), the theme switch (with its label), the Account button (square user icon and the word Account).
- Sections: Projects, Explore, Shop, Docs. That is four links; the list is built from `PARTICIPANT_TABS` so a fifth is one line in `lib/platform/nav.ts`. Community is not linked (its pages stay reachable by address). Expeditions lives inside Shop, Overview inside Projects.
- Each section is Pixelify 16px uppercase, 48px tall. The current one has full-ink text, a 3px bar on its left in `--pf-link`, a filled square marker and `aria-current="page"`. The others have the muted ink and a hollow square marker. Meaning never depends on colour alone.
- Current section: Projects owns `/dashboard/projects/*` and `/dashboard/tracks/*`; Explore owns `/dashboard/explore/*` and `/dashboard/builders/*`; Shop owns `/dashboard/shop/*` and `/dashboard/orders/*`; Docs owns `/docs/*`. Profile, Ledger, Settings, Referrals and Community pages have no current section.
- Phone: the page has a slim strip at the top with only the Menu button (text label, `aria-expanded`, `aria-controls`) and the wordmark. The strip is sticky. The Menu button opens the drawer.
- Drawer: 300px wide at most (screen minus 48px), slides in over 180ms with `--pf-ease`, scrim `rgba(0,0,0,0.6)` fades in. It has a Close button at its top. Instant under reduced motion.
- Drawer behaviour: on open, the page behind (`main` and the strip) is `inert` and focus moves to Close. Tab and Shift+Tab wrap inside the drawer. Escape closes it (or closes the Account panel first, if that is open), as does Close, a press on the scrim and following a link. On close, focus returns to the Menu button, except after following a link. If the window grows past 900px while it is open, it closes. When closed it is `visibility: hidden`, so it is not in Tab order or the accessibility tree.
- No hide on scroll, no grain over the sidebar.

### Account menu

A disclosure (not an ARIA menu): button `aria-label="Account"`, `aria-expanded`, panel of plain links in Tab order: Profile, Ledger, Orders, Referrals, Settings. In the sidebar the panel opens upward from the button and is as wide as the sidebar. Escape closes it and returns focus to the button. A press outside or Tab leaving closes it. Following a link closes it (and the drawer).

## The one modal: PfModal

One component on the native `<dialog>` (inert background, Escape and focus trap from the browser), used by every modal on the participant platform.

- Anatomy: panel 1px outline, `--pf-bg` fill, shadow `6px 6px 0 var(--pf-edge)`. Header: Pixelify title and a 44px close button (`Close`, square, text label kept so the existing accessible name stays). Body scrolls inside. Footer holds actions (primary right, plain left).
- Sizes: `confirm` 440px, `form` 560px, `wide` 600px; always `min(size, 100vw - 32px)`.
- Variants by a 4px top edge only: default `--pf-ac`, danger `--pf-err`, notice `--pf-ok`.
- Behaviour: opens with `showModal()`; focus moves to the first field or to a named control (confirms focus Cancel); Escape closes; backdrop click closes unless something was typed; on close focus returns to the element that opened it if it is still on the page; errors stay in a polite status region inside the body.
- Motion: panel fades and rises 8px over 180ms with `--pf-ease`; backdrop fades. Reduced motion (system or the site setting) is instant.
- Backdrop: `rgba(0,0,0,0.6)`, no blur.
- Migrated: ConfirmDialog (Remove, Block), EditProjectDialog, NewProjectDialog (stays a dialog until phase 2), JournalDialog, ProfileEditDialog, the ship submit dialog, Delete project (type the name to confirm, same field and button text) and Delete journal entry (replaces the browser confirm, same sentence). Copy and behaviour otherwise unchanged. The `.pf-dialog*` rules become `.pf-modal*` and the old ones are deleted in the same change.

## Empty and loading primitives

- `EmptyState`: dashed 1px outline panel, a title line in Pixelify (optional), one plain sentence in `--pf-mut`, one optional action (link or button). Never an apology. Used by Projects (no projects, no match), Explore (no match, nothing saved, awaiting first projects) and Shop (nothing affordable, empty catalog). The wording of existing sentences is kept where tests assert it; Projects' empty state uses the plan wording: "Nothing here yet. Start your first project."
- `Skeleton`: dithered grey blocks (the track pixel dither, `--pf-cell-off`), `aria-hidden`, the label "Loading" in a visually hidden status. Shimmer is a 1.4s step animation that is off under reduced motion. Route level `loading.tsx` for Projects, Explore and Shop that matches each layout's rows and cards so nothing shifts.

## States

| Surface | Default | Loading | Empty | Error |
|---|---|---|---|---|
| Sidebar | sections, Ore, theme, Account | Ore shows its last value (server rendered) | not applicable | not applicable |
| Drawer | closed | not applicable | not applicable | not applicable |
| Account menu | closed | not applicable | not applicable | not applicable |
| PfModal | closed, then open on trigger | action buttons show text state (Saving, Deleting) | not applicable | message in the polite status region, modal stays open |
| Projects, Explore, Shop | page content | skeleton from `loading.tsx` | EmptyState | existing route error handling |

## Themes

Both themes through the existing `--pf-*` tokens only (dark graphite `#222627`, accent blue; light stone `#DDD3BF`, yellow). No new colour. The sidebar, drawer, scrim, account panel, modal, backdrop and skeletons are checked in both themes with axe, and the current section, focus ring and danger edge are checked for 3:1 non-text contrast.

## Breakpoints

320, 390, 471, 700, 900 and 1440, no horizontal page scroll at any of them.

- 320 to 899: slim strip plus drawer. The strip holds the Menu button and the wordmark only, so it never needs more than about 220px.
- 900 to 1439: sidebar 240px, page column takes the rest (never narrower than 660px).
- 1440: sidebar 240px, page column 1080px centred in the remaining 1200px.
- Modals: full width minus 16px below 480px; the body scrolls, the footer stays visible.

## Accessibility

Skip link first. The sections are real links in a `nav` named Participant with `aria-current`. 44px targets (48px and more here; 52px with Larger controls). Visible focus on every control. Escape and focus return on the drawer, the account panel and every modal. Reduced motion honoured by site setting and system. Forced colours: the current section uses `Highlight`, borders use `CanvasText`.

## Acceptance

1. A sidebar at 900px and up and a drawer below it, with four sections, the Ore chip, the theme switch and the Account menu; no Overview, Community or Expeditions link.
2. `/dashboard` answers a permanent redirect to `/dashboard/projects`. `/dashboard/expeditions` (and `/dashboard/expeditions/<id>`) redirect permanently to `/dashboard/shop/expeditions`.
3. Every modal on the list above is a `PfModal`; no `.pf-dialog` rule remains.
4. Projects, Explore and Shop use `EmptyState` and have a route skeleton.
5. No horizontal scroll at the six widths, in both themes; axe finds no WCAG 2.2 AA violation on the shell.
6. Escape closes the drawer and a modal, and focus returns to the trigger.
7. Removed markup's CSS is deleted in the same change; shared rules are kept.

Hand off to: the Next.js engineering agent. Implement exactly this. Do not redesign.

## Follow-up, 16 Nov 2026

Owner changes after phase 1. These supersede the sidebar, account menu, acceptance 1 and 2 above where they differ.

- **Top bar.** A slim bar sits at the top of the page content at every width (sticky, 56px). Right side: the Ore chip (links to the ledger) and the account menu (square user icon and the handle). The panel opens downward, right aligned, same links as before. Left side, under 900px only: the Menu button and the wordmark (the wordmark is hidden under 480px so Ore and Account always fit at 320).
- **Sidebar.** Logo, grouped links, theme switch. No Ore chip, no account button. Groups have a small pixel heading (Pixelify-style dot font, uppercase, muted):
  - Build: Overview (/dashboard), Projects, Expeditions (/dashboard/shop/expeditions).
  - Discover: Explore, Docs.
  - Shop: Shop, Ledger, Orders.
  - Me: Profile, Settings.
  Not linked: Referrals (left out for now) and Community (its page stays reachable by address). Each link shows the current state with the filled marker, the bar and `aria-current`. Under 900px the drawer shows the same links as one list (headings hidden). Expeditions has its own current state; Shop is current only on shop pages.
- **Overview is back** as the home at `/dashboard` (the permanent redirect is gone; `/dashboard/expeditions` still redirects). Content: greeting with the handle, Ore balance (confirmed, pending), Next up, the four track rows, the latest three projects with their stage, the latest three ledger rows. Empty states use EmptyState. Projects stays its own list page.
- **Projects filter.** The stage and track link rows are no longer on the page. One Filter button (right aligned above the grid, label "Filter (n)" when n filters are on) opens a PfModal titled "Filter projects" holding the same two link rows with their counts and the same URL params (`stage`, `track`). Choosing a link navigates and closes the modal. Escape, Close and a backdrop press close it and focus returns to the button. The button shows only when the person has projects.
- **Acceptance now.** 1: grouped sidebar at 900px and up, drawer below, top bar with Ore and Account at the top right. 2: `/dashboard` is a page; `/dashboard/expeditions` redirects permanently. Checks: unit nav.test.ts; e2e redesign-shell.spec.ts, projects.spec.ts.
