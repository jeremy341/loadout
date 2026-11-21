# Participant UI audit follow-up (19 Nov 2026)

Scope: participant dashboard only, from `ui-audit-followup.md`. Binds to `DESIGN.md` and `docs/design/system/design-system.md`. Owned paths: `apps/landing/app/(platform)`, `apps/landing/app/_components/platform` and participant tests. No policy, data or Review Queue link changes.

Design read: an industrial field manual for builders, kept as it is. Quiet text controls, hairlines, one filled action per screen (`dashboard-minimal-pass.md`). Dials: variance 3, motion 1, density 5. No new motion, no new assets (svg-design, pixel-art-sprites and pixel-art-animator were consulted; nothing in this change is an icon, sprite or animation).

## Flows, states and rules

1. **Projects list.** Default stays title and grid (owner decision, minimal pass update 9). Search appears only when the list is longer than one page (more than 24 projects): one labelled GET form `?q=`, filtered in the page, kept in the paging links. No stage or track filters. Phone (up to 559px): each project is a compact row with no cover. Line one is the title (wraps) and approved hours. Line two is track and status as text with a track-coloured left edge. The desktop card is unchanged. Empty list keeps its sentence.
2. **Project tabs.** The tab row wraps on narrow widths and at 200% text, so Journal, Ship, Toolbelt and Settings are all visible. Scoped to `.pf-tabs-line`; the Profile tabs are untouched.
3. **Project header.** With no uploaded cover the band is short (a 40px strip on phones, 56px wide). The one active action sits beside the title: New journal entry while the journal is open, otherwise a text link to Ship (opens the tab, or `?tab=ship` without script) when checks are left or the project is in review or returned. No new rules: the action comes from `open`, `status` and `shipLeft`.
4. **Journal empty state.** One quiet block: a sentence and one action, no empty box and no repeated "started this project" card above it. The timeline's start item stays once entries exist.
5. **Preview toggle (writer).** Same DOM place, names (Preview, Write) and `aria-pressed`. On phones it is a full-width row at least 44px tall under the formatting buttons, with a visible pressed mark that is not colour alone (filled square and underline), and the state is also stated in text for readers.
6. **Ship checks.** Unmet checks are neutral: an empty square in the text colour, the reason in muted text. No red, no cross. Done is the tick; waiting stays dashed. `data-state`, the "not done" screen-reader text and the checklist id stay.
7. **Returned for changes.** When the status is needs-changes the Ship panel leads with "Changes requested", the reviewer's reason and note exactly as saved (nothing invented; a missing note says the reviewer left none), then three plain steps: read the note, update the project and journal, ship again with a change note. The button keeps the label Submit for review. The `View in Review Queue` link and its logic are not touched; a slot above it is left clear for the parent's queue status line.
8. **Shop.** Tag chips wrap on phones. The level discount row is a labelled legend directly under the chips, not a sticky strip. The Field Requisition control shows its reason as visible text beside the control, linked with `aria-describedby`, and the item page says what unlocks it (from `requisitionReasonText`; no new numbers).

## Accessibility

Targets 44px. Focus rings unchanged. Tabs keep roles, arrow keys and Home/End. No colour-only state. Reflows at 390px and 200% text without horizontal scroll. Reduced motion: nothing animates.

## Acceptance

Typecheck and lint clean for touched files; existing e2e selectors kept (`.pf-badge` on cards, `.pf-sg-hours`, `#ship-checklist`, Preview and Write names, "Submit for review"); no `lib/platform` edits.
