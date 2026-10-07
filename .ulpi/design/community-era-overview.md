# Community Era Homepage Overview

**Status:** Implemented locally and expanded on 2026-10-06.
**Scope:** Brief public definition and de-duplication of Era mentions elsewhere on the homepage. Do not redesign or implement the full homepage visual-clarity plan in this slice.
**Audience:** A first-time visitor who needs to know what a Community Era means.
**Design authority:** .ulpi/design/DESIGN.md.

## Design read

The Era section should explain the shared-progress idea without presenting it as a launch promise. Keep the LOADOUT field-manual look and use plain public copy. A compact fact strip may distinguish Era Points, Track XP, and the planned Bolt bonus; keep detailed schedules and operating rules off the homepage.

## Public overview

- Keep the section anchor #eras.
- Define an Era as a shared technical theme that approved projects help the community move forward.
- Explain in compact UI that projects can follow optional objectives across the four tracks and contribute Era Points to shared progress.
- Show once that qualifying projects are planned to earn **+10% of the approved base Bolt award**, with no Track XP bonus. Label it as planned and say final launch configuration is still being finalized.
- Distinguish Era Points from personal Track XP and spendable Bolts; an Era change does not reset shipped projects or personal progress.
- Use a small, static three-part idea rail: Approved projects → Shared Era Points → Next technical theme. It is explanatory, not a live timeline or promise of immediate advancement.
- Show no named future Era themes, target values, dates, timers, weekly-reset rules, detailed objective examples, or Season comparison. Keep the bonus to the single planned summary above.
- Keep full policy and operating rules in Plan 11 and the economy documentation; this homepage reduction does not amend them.

## Remove repeated Era explanations

- Remove the Era-objectives note from How it works.
- Remove the Era persistence clause from the lifetime Track XP copy; keep its Season statement if still accurate.
- Shorten the Community Eras FAQ answer to a one-line definition.
- Remove the detailed shared-Era advancement sentence from the IRL concept; retain its online Tracks/review relation and optional future status.
- Keep unrelated section content out of this Era slice. The owner-directed page-level composition changes are recorded in Plan 06.

## Accessibility and responsive behavior

- Keep a visible section heading and one-sentence definition.
- Use a semantic ordered list for the static concept rail; connectors are decorative and hidden from assistive technology.
- Stack the rail vertically when needed. No horizontal overflow at 320px or 200% zoom.
- Preserve readable contrast, current body size, focus styles, and reduced-motion behavior. No new animation, interaction, asset, or dependency is required.

## Acceptance

- No specific Eras (Steam, Electrification, Computing, Networks, Acceleration) appear on the public homepage.
- Visitors can quickly understand that an Era is a shared technical theme advanced by approved projects.
- Detailed Era timing and objectives do not appear on the homepage; the planned bonus appears once with a clear status.
- All internal canonical Era/economy rules remain untouched.
## Implementation review

The section uses the existing industrial field-manual typography, neutral surface, straight dividers, and compact fact cells for shared points, the planned +10% Bolt bonus, and zero Track XP bonus. Its three labels remain a single ordered list; CSS stacks them vertically on narrow screens. No motion, animation, new icon, image, dependency, or live metric was added.

## Local verification

- Bun lint and typecheck pass.
- Unit suite: 5 passed.
- Landing browser suite: 25 passed, including mobile overflow, no-JavaScript, keyboard, and axe checks.
- Production build passes.
- Browser review completed at mobile width and the normal desktop viewport.

Changes are local; no commit or deployment was made.
