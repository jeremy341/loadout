---
feature: compact LOADOUT IRL Ruhr card
design_language: ./DESIGN.md
surface: public landing page
status: ready for implementation
---

# Design Read

Turn the existing future-event section into a compact industrial event plate: one strong
location-and-format statement, one supporting sentence, and one honest planning status. The
section should feel like a useful field notice, not a second landing page.

## Locked direction

Industrial / signage, bound to `DESIGN.md`: graph-paper canvas, straight ink rules, Jersey 10
display headings, IBM Plex Mono body copy, Bolt Yellow as the single accent, and hard offset
shadows only. Do not add gradients, pills, rounded cards, new colors, or new iconography.

## Copy

- Eyebrow: `Future concept`
- Heading: `LOADOUT IRL // RUHR`
- Lead: `A planned three-day hackathon in Germany's Ruhr area.`
- Supporting copy: `Builders will meet in person to choose a technical project, build together, and share what they make using LOADOUT's four tracks.`
- Status: `Planned concept. Dates, venue, funding, and registration are not confirmed yet.`

Remove the existing weekend itinerary and its Friday/Saturday/Sunday timeline entirely.

## Component specification

### Purpose

Communicate the planned in-person event without competing with the main process flow.

### Layout

- Keep the existing section anchor `#loadout-irl` and heading relationship.
- Use a single compact plate below the section heading.
- Use a two-column internal layout on desktop: lead copy on the left, status block on the right.
- Collapse to one column on narrow screens.
- Keep the existing section spacing and max-width conventions.
- The lead sentence is the visual focal point; the status is subordinate.
- Use a vertical ink rule or existing section rule to separate the two columns only if it already
  exists in the current style language. Do not introduce decorative UI.

### Responsive behavior

- Desktop: two columns with a deliberate asymmetric ratio around 3fr 2fr.
- Mobile: stacked content with the status below the supporting copy and no horizontal overflow.
- Preserve readable body text at the existing minimum size and comfortable line height.

### Accessibility

- Keep a semantic `<section>` with `aria-labelledby`.
- Keep the existing `h2` heading.
- Status text is plain content, not a badge requiring color interpretation.
- No interactive controls are required.
- Preserve visible focus behavior for page navigation links.
- No new motion; existing reduced-motion behavior remains unchanged.

## States and edge cases

- Only static planned-content state exists.
- No loading, error, empty, or interaction states are needed.
- Copy must remain truthful when dates and venue are unknown.
- Refresh, back navigation, offline use, and reduced motion must render the same static content.

## Design pre-flight

- [x] Identity lock: only existing palette, type, spacing, borders, and shadow language.
- [x] Anti-slop: no gradients, pills, nested cards, fake precision, or decorative status dot.
- [x] State coverage: static content has no interactive or asynchronous states.
- [x] Accessibility: semantic heading relationship, readable contrast, no color-only meaning.
- [x] Layout craft: asymmetric plate on desktop, stacked reading order on mobile.
- [x] Cognitive load: one event statement and one status note.
- [x] Motion: no new motion; reduced-motion behavior is preserved.

Self-critique: distinctiveness 3/4, hierarchy 4/4, consistency 4/4, accessibility 4/4,
state coverage 4/4, copy quality 4/4, restraint 4/4, motion motivation 4/4. Total 31/32.
The only non-perfect axis is distinctiveness because this is intentionally a restrained
single-content plate within an existing brand system.

## Build handoff

Target: Next.js/React engineering agent.

Implement exactly this spec. Theme the existing markup and styles with the locked tokens in
`DESIGN.md`; do not redesign or re-implement unrelated components. Remove only the obsolete
itinerary data and markup, update the copy exactly, and keep the existing section anchor.
