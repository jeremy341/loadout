# Public UI audit pass (2026-11-19)

Scope: the public homepage, the Docs, the shared Accessibility tab and the public Review Queue. Parent brief: `ui-audit-followup.md`. Identity stays the field-manual system in `DESIGN.md` and `docs/design/system/design-system.md`. This is a fix pass, not a redesign. No product policy changes; the copy fix makes the pages say what the program rule already says.

Skills: the seven skill files in `docs/development/ui-skills.md` were opened; the headers of all of them were read, and the animation rules and the layout-discipline section of `design-taste-frontend` were read in full. This brief and the implementation follow `frontend-design-ui-ux`, `frontend-design` and `design-taste-frontend` (audit first, keep the locked identity). `emilkowal-animations` applies only to the Review Queue toggle and the tab transform: short ease-out, reduced motion respected. `svg-design`, `pixel-art-sprites` and `Pixel Art Animator` have no work here: no icon, sprite or frame animation is created or edited.

Design read: a public reference page for teens checking a status. Quiet, plain, one obvious thing to do per screen.

## 1. One project, one track (copy)

Rule: a project has exactly one track; all Track XP goes to it; changeable until submit; a team ship shares one track.
- Homepage Tracks lead, Tracks doc intro and description, Progress, FAQ and Start copy no longer say a project can touch or count in several tracks.
- The Tracks intro carries one short example: a sensor board is Hardware, the service that reads it is Systems, so they ship as two projects.
- Acceptance: no public line says "tell us about both", "more than one" track or "fields you worked in".

## 2. Accessibility tab never covers content

States: default (vertical edge tab), phone retracted, keyboard focus, enlarged reading (125, 150, 200%) or wider spacing, dialog open.
- Homepage: the left tab sits over the top-left hero marking (`.meta-left`) on phones and tablets. Move that marking clear of the 44px tab (56px inset) at every width where the tab is visible. Small phones and short landscape screens lose the coordinates strip, which is decoration (`aria-hidden`) and collides with the badge and title there. Hide-markings stays an independent user choice.
- Review Queue (visitor frame): the tab moves into the header row as a horizontal control, so it can never cover the title. The phone "retracted" slide moved it left over the content in this frame; in the header it never slides.
- Docs: the bottom-left floating tab covers the lower guide links on wide screens and the left edge of text on phones. Above 820px it docks in the directory header (as enlarged reading already did); at 820px and below it waits off-screen and is reached from the Guides drawer, the page footer or keyboard focus.
- Keyboard: the tab keeps its place after the skip link. Focus outline unchanged.

## 3. Homepage ornaments and the Docs shortcut

- The Docs shortcut is fixed bottom-right. On small phones it lands on the hero facts line and on short landscape screens on the hero copy. Give the hero enough bottom padding at those sizes, and hide the coordinates strip where it hits the badge.
- Acceptance: at 320x568, 360x640, 390x844, 667x375 and 844x390, at 100/150/200% reading size, no ornament or fixed shortcut covers hero text.

## 4. Docs tables on phones

Problem: at 390px three equal columns break words mid-word ("measuremen / ts").
- At 560px and below, each table row becomes a labelled block: the first cell is the row title, the other cells show their column header above the value. Table semantics are restored with ARIA roles so assistive tech still reads a table. The label text is the header cell text, set by the Docs renderer.
- Wide tables stay tables above 560px. Numeric price tables keep working because each cell keeps its label.
- Acceptance: no word is broken inside a Docs table cell at 390px and at 200% reading size; no horizontal scroll.

## 5. Review Queue

Flow: land, type name or #ID, see position; or glance at the totals; or switch queue; then move on.
- Order: title and live status, search (primary), result, quiet overview, queue list with the toggle, passed first review, footer.
- Overview becomes a single quiet summary strip (waiting total, split by queue, final checks, last 24 hours) with the thin meter, no boxed panel.
- Software and Hardware toggles are a two-column group of equal width and equal height, pressed or not, at every reading size. Pressed state also has a visible border so it is not colour only.
- Visitor frame: header has Home and Docs links; the footer adds "How review works" and "Back to LOADOUT". The signed-in shell keeps its sidebar and shows no extra links.
- Kept: `/` focuses search, Escape clears it, one `aria-live` result, copy link, deep links, Eraxty footer, empty states, availability errors, the local test builder default.

## Checks

- Focused Playwright: Review Queue (visitor and signed-in, 390 and 1440, 100% and 200%), Docs table at 390, hero and tab overlap at the sizes above.
- `bun test app/docs app/_components/display-preferences.test.ts`, typecheck and lint on touched files.
