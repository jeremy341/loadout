# Reviewer desk: staging honesty, shortcuts and cheer (UI 2 of 2)

**Status:** brief written 22 Nov 2026 on `feature/huge-prep-pr`, before implementation. Not reviewed by the owner yet. Staging only: see [`docs/development/staging-posture.md`](../../docs/development/staging-posture.md).
**Binds to:** [`DESIGN.md`](DESIGN.md), the [design system](../../docs/design/system/design-system.md), and [`reviewer-desk-parity.md`](reviewer-desk-parity.md) (the Local and Stub sentences). Nothing here changes a rule, a rate or a route.
**Surface:** the reviewer desk (`apps/landing/reviewer-dash/app/**`) and the participant Community pages (`app/_components/platform/community*`).
**Skills read for this pass:** `frontend-design-ui-ux`, `frontend-design`, `design-taste-frontend`, `emilkowal-animations`. `svg-design`, `pixel-art-sprites` and `Pixel Art Animator` do not apply: no icon, sprite or frame animation is added.

## Design read

A reviewer's bench in the field manual: ruled rows, square corners, one accent. The pass makes the bench say what is real. Where a fixture backs a page it says "Sample data"; where a service does not exist it says "Not connected". No new colours, fonts, radii or shadows. Counterfactual test: a desk that shows a green tick for something that was not saved fails; one that says "Not connected" beside the control passes.

Dials: variance 2, motion 2, density 7.

## 1. Words

Visible text on the desk uses LOADOUT's own terms: Ore, builders, handles, Track XP, and internal check names. The words Pixl, pixels, players, Slack, Robert, Telescreen, Airtable, HCB, Airbridge and Blackout do not appear in visible text, titles, hints or `aria-label`s. Code identifiers and comments that name a source are not visible and are left alone.

| Was | Now |
| --- | --- |
| Telescreen (Robert) | Automated review check |
| Telescreen note | Automated check note |
| Fraudy time split | Time split check |
| note to the player | note to the builder |
| Beacon (badge) | Flagship |

## 2. Honest data states

Two fixed sentences, taken from `reviewer-desk-parity.md`, never a third state:

- **Sample data.** "Sample data. Changes stay on this server and are gone when it restarts."
- **Not connected.** "Not connected. This service does not exist on staging, so nothing here is saved or sent."

`DataNote` (new, `_ui/DataNote.tsx`) renders either as one `<p class="rv-data-scope">` with the label in bold and a `data-scope` attribute. The label is a word, never colour alone. It is added to: the fraud checks panel (Not connected, because no check runs on staging), the Hackatime panel and the commit list (Sample data, they answer from the sample ship), and the Community head (Sample data for ideas, Show & Tell and the Era strip; voting is Not connected).

## 3. The review form and hints

The form already shows one track, Ore, Track XP, 13 to 18 and Research Mode. This pass adds nothing new there except one sentence under "Additional notes": the four quality dimensions are listed as a ruled list in the hint, one line each with its question, from `QUALITY_DIMENSIONS`, so the reviewer sees what each line of the note is for. No score, weight or new field.

## 4. Badge counts

A count badge shows only when it counts something that is connected. A zero in the top bar or a tab bar is not shown (there is nothing to act on). A zero inside a page tab (for example "Past reviews 0") is shown muted, in words a screen reader reads as "0", because "none" is information there. `CountBadge` takes `data-zero` and a dim style; the top bar already drops zeros.

## 5. Command palette

Ctrl or Cmd+K opens it, as now. Page search is local and always works. Builder and project search needs `/api/search`. If the request fails, answers with a non-JSON body (a 404 page is HTML), or the address is absent, the palette stops asking for the rest of the session and shows one line under the input: "Pages only. Builder and project search is not connected." The input keeps working on page names. `aria-live="polite"` on that line.

## 6. Keyboard shortcuts

Global, ignored while typing, in a modifier, or in a dialog (WCAG 2.1.4: a switch turns them off, kept in `localStorage` and read in a try/catch):

| Key | Action |
| --- | --- |
| `/` | Open search |
| `?` | Open the shortcuts list |
| `g` then `o`, `r`, `p`, `b` | Go to Overview, Review, Projects, Builders (only the ones the viewer's nav has) |

The desk's own keys (left and right arrows or `j` and `k` for previous and next, `r` for the repo, `d` for the demo) stay where they are and are listed in the same dialog. The dialog is a native `<dialog>` with `showModal`, so focus is trapped and Escape closes it. Every key has a button or link alternative already on the page.

## 7. A short celebration

When an approval is sent, the next page shows a status line "Verdict sent. Thank you." and a burst of ten small squares in the accent colour for 900 ms. It runs once, never loops and never blocks input (`pointer-events: none`). The flag travels in `sessionStorage` (try/catch) because the verdict redirects to the next ship. A bounced verdict clears the flag. Under `prefers-reduced-motion: reduce` the squares do not move or appear; only the status line shows, for 4 seconds. The line is `role="status"`, so the message does not depend on the motion. No sound.

## 8. Community pages

Section dividers: the frames on the Community hub get a 2 px rule above each section heading and 32 px between sections, in the same strong rule colour the lists already use, so the Era strip, goals and previews no longer run together. The rule applies in both themes. No change to type, colour tokens or layout columns.

## Responsive behaviour

Notes wrap; nothing is wider than the screen at 390 px. The palette note, the dialog and the toast use the existing `hc-dialog` and `hc-panel` widths. The toast sits bottom-left, above the footer, and never covers the verdict buttons (it is `position: fixed; bottom: 16px; max-width: calc(100vw - 32px)`).

## Accessibility

- All new notes are text with a bold label; colour is a second cue only.
- The shortcuts dialog is labelled, closes on Escape and returns focus to the opener.
- Shortcuts can be turned off.
- The toast is `role="status"` and, under reduced motion, carries no movement.
- Touch targets stay at the existing 44 px minimum for the new buttons.

## Acceptance

1. No banned word in visible desk text (grep on the TSX string literals).
2. With `/api/search` returning 404 or HTML, the palette still lists pages and shows the one line.
3. Fraud checks, Hackatime and commits panels and the Community head each carry a Sample data or Not connected note.
4. `?` opens the list, `/` opens search, `g r` goes to Review, none fire while typing.
5. An approval shows the status line once on the next page; reduced motion shows no movement.
6. Lint, typecheck and the reviewer unit tests pass; an axe pass on a changed page is recorded in the handoff (not run here: no database in this checkout).
