# Homepage copy record

Merged on 25 Oct 2026 from 8 design briefs. Each section keeps its original text. Only the design system and the code are current; a brief records what was decided and built.

## Homepage copy and depth navigation

_Merged from `homepage-copy-depth-navigation.md`._

Status: owner-approved local implementation, 2026-10-13. Extends the existing preview branch; publication is not requested.

### Direction and scope

Use the existing industrial field-manual design system: graphite/stone paper, ink rules, pixel signage, IBM Plex Mono reading text, and the theme accent. Keep the homepage sections, cards, diagrams, assets and approved ASCII motion. Shorten only repeated Ore/XP explanations. Make the ruler useful for navigating the page, without representing live program progress.

### Copy ownership

- How it works: the accepted-build outcomes. Ore can be spent across tracks; Track XP is kept as lifetime progress; projects form the Digital Loadout. The upgrade step explains the Physical Loadout without repeating discount rules.
- Progression: each track's lifetime level and the benefit of better related prize prices. Keep the existing milestone rail and a short one-use Requisition note. Link to /docs/progress for details.
- Rewards: using Ore, a related track discount and a matching Requisition in a purchase. Describe a Requisition accurately as allowing more of the earned discount on one eligible prize. Replace the repeated limitation paragraph with links to /docs/pricing and /docs/requisitions.
- Keep FAQ answers independently understandable and retain unique rules in Custom Orders and Eras. Preserve proposal status and all launch caveats. Add no prices, rates or availability claims.

### Depth navigation

The existing decorative top and left rulers stay aligned to the actual depth strips. Add an interactive navigation layer in SheetRuler, visible only on the homepage.

Stops: Surface (#top), -000 Tracks (#tracks), -100 Build loop (#process), -200 Project fit (#project-fit), -300 Levels (#progression), -400 Prizes (#shop), -500 Custom orders (#custom-orders), -600 Eras (#eras), -700 IRL (#loadout-irl), -800 FAQ (#faq), -900 Team (#behind-loadout). Omit absent sections, including the optional IRL block. Read real depth values so omitted sections do not renumber the ruler.

- At >=1420px and sufficient height, show a quiet fixed rail in the left gutter. Fit within the gutter (about 144px wide), use small metre labels and plain section names. Mark the current stop with accent ink plus a visible line/indicator, and aria-current=location.
- Below 1420px or at short height, show a compact depth button at bottom left. It must fit beside the existing Docs tab at 320px. Opening it reveals a bounded, internally scrollable list with >=44px link targets. Avoid a second horizontal scrollbar.
- Use real anchor links and the existing scrolling behavior. Preserve URL hashes, direct deep links and browser back/forward. Choosing a stop closes the compact panel and moves focus to the destination heading without a second scroll.
- Track the current section while scrolling and after resize. Use a passive scroll listener scheduled through requestAnimationFrame; update React state only when the active stop changes. Reuse measurements and clean up listeners/observers.
- The compact control has a descriptive accessible name, aria-expanded and aria-controls. Escape closes the list and returns focus; leaving the panel closes it. Desktop and compact variants share one link list and active state.
- Keep contrast/focus in both themes. Under reduced motion, avoid smooth scrolling and indicator transitions. No scroll-position live announcements.

### Acceptance

Verify active highlighting through scroll and clicks, native hashes/back/forward, keyboard activation and Escape, 320/390px bounded layout, 1920/1440px gutter fit, 200% reflow, both themes, reduced motion, and absence on Docs/404. Keep the current ASCII drift intact. Add focused browser tests for navigation behavior; do not add tests that mirror copy strings.

### Handoff

Two GPT-6 Luna agents at medium reasoning: a copy implementer owns HowItWorks.tsx, Progression.tsx and Rewards.tsx; a navigation implementer owns SheetRuler.tsx, ruler.css and new depth-navigation browser tests. The parent owns this brief, design-system/index updates and final browser review. No overlapping writes, commits or publication.

Skills consulted: project-frontend; frontend-design-ui-ux; frontend-design; design-taste-frontend; emilkowal-animations; accessibility; copywriting; SVG Design; pixel-art-sprites; Pixel Art Animator. No new SVG or sprite assets are needed. Existing identity and components pass the design preflight; interaction and accessibility acceptance are verified after implementation.


## Homepage voice: plainer copy on the homepage

_Merged from `homepage-voice.md`._

Status: implemented on the feature/homepage-voice branch, awaiting owner check.
Binds to: [DESIGN.md](DESIGN.md) and [Plan 06](../../plans/06-public-homepage.md). Plan: Plan 19 (removed 25 Oct 2026), workstream C (homepage half). The participant Docs were reworded in a separate change.

### Design read

A reviewer said the site feels written by AI and has few real details. The homepage was already shorter than the Docs were, so this is a light pass: plainer verbs, fewer coined phrases, no new claims. No layout, colour, type or motion changes.

### What changed

| Where | Before | After |
|---|---|---|
| Hero lead | Build tools, systems, compute, and hardware. Earn Ore for equipment and Track XP in the fields your work uses. | Build something technical and get it reviewed. Earn Ore to spend on equipment, and Track XP that grows in the fields you work in. |
| Rewards: Ore | Pay the final price in Ore. | Spend it on prizes. You see the final price first. |
| Rewards: levels | Apply the discount earned in that track. | A higher level in a track takes money off related prizes. |
| Rewards: Requisition | Apply more of your track discount to one eligible prize. | Lets more of your discount apply to one prize. |
| Progression | Each track has its own lifetime level. Higher levels unlock better prices on that track's prizes. | Each track has its own level, and you keep it. A higher level means better prices on that track's prizes. |
| Project fit labels | Higher signal / Lower signal | Stronger fit / Weaker fit |
| Eras | A shared technical theme advanced by approved projects across the four tracks. | A technical theme the whole community works toward. Approved projects, in any of the four tracks, move it forward. |
| IRL | A proposed three-day hackathon in Germany's Ruhr area, not an announced event. | A proposed three-day build weekend in Germany's Ruhr area, Friday to Sunday. It is not an announced event. |

The same hero sentence is kept in `app/site-content.ts`. The test that pins the Eras line is updated; the IRL test keeps its wording rules ("proposed", "not an announced event", not "A planned three-day").

### Rules kept

No new price, number, date, threshold or promise. "You see the final price first" restates [Pricing](../../content/docs/pricing.md), which says the catalog must show the final price before an order. Nothing about the Era bonus or its 14-day minimum moved.

### Not done here

Real numbers and a worked example on the homepage need the owner's decisions (Plan 19, workstream F). A human "who made this" paragraph needs the owner's own words.

### Skills

All seven UI skills were loaded for this branch of work (`frontend-design-ui-ux`, `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites`, `pixel-art-animator`). This is a copy-only change, so the motion, SVG and sprite skills added no work. The copywriting and UX-copy skills guided the wording.

### Acceptance

1. The lines above read as shown and nothing else on the page changes.
2. The whole browser suite, typecheck, lint and unit tests pass.


## Copy follow-through: approved fixes 1–4

_Merged from `copy-follow-through.md`._

Status: owner-approved scope; local implementation. No commit, push, deployment, or Slack post requested. This follows the read-only review of `feature/real-details`.

### Intent and design read

Make the existing program explanation more accurate and easier to read. Keep LOADOUT's industrial field-manual identity, the existing design system, page sequence, rulers, paper/grain, typography, prize belt, Jeff, and interaction behavior. No new layout, art, components, or animations. The real-project showcase is deferred.

References: [DESIGN.md](DESIGN.md), [design system](../../docs/design/system/design-system.md), real-details.md (removed; see git history). Macondo informs direct, friendly wording; its program rules are not LOADOUT facts.

### Approved changes

1. Hero support, shortened at the owner's request: “Build tools, servers, GPU projects or hardware. Earn Ore for approved work and spend it on your next build.” Keep the headline and action labels. Keep the shared `heroCopy.support` source consistent.
2. Replace launch-date asides such as “we won't invent one” and “the day it opens” with a short status and an RSVP explanation. An RSVP records interest; it is not enrollment. Apply to the homepage FAQ and corresponding Docs wording.
3. Reorder the existing prize data to put approachable items first: ESP32, soldering kit, Raspberry Pi, SSD, domain, A1 Mini printer, enclosed printer, Framework laptop. Do not alter prices, source images, belt behavior, or add hours/promises to the homepage.
4. Give each existing explanation a job. How it works keeps its exact current file and diagram. Progression owns lifetime level pacing and milestone awards. Rewards owns purchase discounts and their additive relationship. The FAQ gives short answers and a link to its full Docs page. Custom Orders gets a plain homepage introduction and an illustrative Docs request/quote example.
5. Further owner-approved copy amendment: Project Fit heading becomes “What projects fit?” and the Eras heading becomes “Community Eras”. Replace the Era lead with “Each Era gives everyone a shared challenge, like measuring energy use. Ship a qualifying project for 10% extra Ore.” The example is illustrative, not an announced active objective. Retain the existing planned-rule label, qualification notes, flow, and all layout/styles. A personal organizer explanation remains excluded.
6. Owner-approved Docs rule reconciliation: describe settled mechanics directly. Start and Eligibility hold the general launch-status explanation. Other Docs headers link to that status instead of repeating “In development · Draft reference”. Keep frontmatter `status: draft` and the existing renderer/search boundary. Topic pages name an unresolved parameter only where it changes the answer. No new numeric policy, participant services, or homepage edit is authorized by this amendment. The IRL page retains its event-specific status once.

### Docs content

- Correct the repeated claim that every tracked hour earns Ore to say approved hours.
- Link Custom Orders to track progression, distinguishing that from still-unpublished request-specific gates. The request example must not invent a tier, price, or approval decision. It shows the requested item, demonstrated track, evidence, team-assigned gate, quote breakdown, and accept/decline step. Use symbolic amounts until a quote is approved.
- Replace the stale Era statement that award sizes are unpublished. Use the existing 720 + 72 = 792 example as arithmetic, not a promised award. Keep any genuinely unsettled bonus-stacking detail open.
- Shorten FAQ repeats and retain all existing headings/anchors and substantive conditions.
- Align the prize table order with the preview and write 2.4 hours for a 24-Ore domain at the stated 10-Ore/hour illustration.

### States, responsive behavior, and accessibility

All controls, landmarks, headings, links, artwork, loading/error behavior, focus treatment, reduced-motion handling, and breakpoints retain their current implementation. Prize data order also controls accessible reading order; duplicate belt content remains aria-hidden. No unannounced new discount, payout, eligibility, launch, stock, or fulfillment rule. Check that longer hero copy fits the existing width at desktop and phone sizes. Preserve Docs slugs and explicit anchors.

### Preflight and handoff

Existing identity is the constraint. No new tokens, fonts, decorative effects, imagery generation, or vector/sprite changes. Reuse of current cards is intentional under the owner's layout-preservation instruction. Scope is copy, prize order, and Docs only. No new end-to-end rewards example from the excluded earlier section 5.

Skills: project-frontend and copywriting guide the change. The repository's seven UI skills were consulted: frontend-design-ui-ux supplies this brief; frontend-design and design-taste-frontend constrain presentation; emilkowal-animations, svg-design, pixel-art-sprites, and Pixel Art Animator add no specialist work because their surfaces are unchanged.

Build handoff: a GPT-6 Luna engineering agent at medium reasoning owns homepage component edits and shared hero copy. Implement exactly this spec using the locked design system; do not redesign its components. The parent owns public Markdown. Do not edit HowItWorks.tsx, styles, tests, economy plans, or unrelated work. Run no test suites; use focused lint/type checks and content/link inspection, and report any unavailable browser verification honestly.

### Implementation check

The earlier homepage copy changes were implemented locally and received focused lint/type checks and desktop inspection. A full responsive regression pass was not run.

The rule-reconciliation amendment updates the public Markdown, Docs header and internal product/economy records. It removes obsolete capped/tiered Field Requisition rules and distinguishes agreed policy from candidate XP, review and Custom Order parameters. Intermediate XP/discount estimates remain internal. The Docs component passes focused ESLint, `bun run typecheck` passes, all 18 public pages parse without internal-link errors, and `git diff --check` passes. No additional homepage, stylesheet or artwork changes were made for this amendment. No test suites, commit, push, deployment or Slack post were performed.


## Community Era Homepage Overview

_Merged from `community-era-overview.md`._

**Status:** Implemented locally and expanded on 2026-10-06.
**Scope:** Brief public definition and de-duplication of Era mentions elsewhere on the homepage. Do not redesign or implement the full homepage visual-clarity plan in this slice.
**Audience:** A first-time visitor who needs to know what a Community Era means.
**Design authority:** .ulpi/design/DESIGN.md.

### Design read

The Era section should explain the shared-progress idea without presenting it as a launch promise. Keep the LOADOUT field-manual look and use plain public copy. A compact fact strip may distinguish Era Points, Track XP, and the planned Bolt bonus; keep detailed schedules and operating rules off the homepage.

### Public overview

- Keep the section anchor #eras.
- Define an Era as a shared technical theme that approved projects help the community move forward.
- Explain in compact UI that projects can follow optional objectives across the four tracks and contribute Era Points to shared progress.
- Show once that qualifying projects are planned to earn **+10% of the approved base Bolt award**, with no Track XP bonus. Label it as planned and say final launch configuration is still being finalized.
- Distinguish Era Points from personal Track XP and spendable Bolts; an Era change does not reset shipped projects or personal progress.
- Use a small, static three-part idea rail: Approved projects → Shared Era Points → Next technical theme. It is explanatory, not a live timeline or promise of immediate advancement.
- Show no named future Era themes, target values, dates, timers, weekly-reset rules, detailed objective examples, or Season comparison. Keep the bonus to the single planned summary above.
- Keep full policy and operating rules in Plan 11 and the economy documentation; this homepage reduction does not amend them.

### Remove repeated Era explanations

- Remove the Era-objectives note from How it works.
- Remove the Era persistence clause from the lifetime Track XP copy; keep its Season statement if still accurate.
- Shorten the Community Eras FAQ answer to a one-line definition.
- Remove the detailed shared-Era advancement sentence from the IRL concept; retain its online Tracks/review relation and optional future status.
- Keep unrelated section content out of this Era slice. The owner-directed page-level composition changes are recorded in Plan 06.

### Accessibility and responsive behavior

- Keep a visible section heading and one-sentence definition.
- Use a semantic ordered list for the static concept rail; connectors are decorative and hidden from assistive technology.
- Stack the rail vertically when needed. No horizontal overflow at 320px or 200% zoom.
- Preserve readable contrast, current body size, focus styles, and reduced-motion behavior. No new animation, interaction, asset, or dependency is required.

### Acceptance

- No specific Eras (Steam, Electrification, Computing, Networks, Acceleration) appear on the public homepage.
- Visitors can quickly understand that an Era is a shared technical theme advanced by approved projects.
- Detailed Era timing and objectives do not appear on the homepage; the planned bonus appears once with a clear status.
- All internal canonical Era/economy rules remain untouched.
### Implementation review

The section uses the existing industrial field-manual typography, neutral surface, straight dividers, and compact fact cells for shared points, the planned +10% Bolt bonus, and zero Track XP bonus. Its three labels remain a single ordered list; CSS stacks them vertically on narrow screens. No motion, animation, new icon, image, dependency, or live metric was added.

### Local verification

- Bun lint and typecheck pass.
- Unit suite: 5 passed.
- Landing browser suite: 25 passed, including mobile overflow, no-JavaScript, keyboard, and axe checks.
- Production build passes.
- Browser review completed at mobile width and the normal desktop viewport.

Changes are local; no commit or deployment was made.


## Who's Behind LOADOUT?

_Merged from `whos-behind-loadout.md`._

**Status:** Implemented. Plan 06 owns the current placement and public copy; this brief records the design constraints. The placement is FAQ → this section → footer.

### Design read and identity

An organizer directory for prospective technical builders, in LOADOUT's existing industrial field-manual language. Bind to `DESIGN.md`: graph paper, gray surfaces, ink rules, muted Bolt Yellow, Jersey 10 headings, Pixelify Sans names, and IBM Plex Mono body text. Use the existing `SectionHeading` and approved icon family. No palette, font, brand, scenery, or page-wide motion changes.

The distinguishing composition is a vertical organizer list beside one graphite community-context plate. This avoids repeating the page's four-column track and prize grids. DFII: impact 4 + fit 4 + feasibility 4 + performance 4 − consistency risk 2 = 14.

### Scope and composition

- Add one `#behind-loadout` section after the existing FAQ, before `SiteFooter`, inside the main landmark.
- Heading: “Who's behind LOADOUT?”; brief introduction: “The people building the program, the website, and the tools around it.”
- The left column contains three organizer rows. Each row uses an existing decorative 32px sprite in a 64px glyph plate, then the public name, role, and one concise responsibility sentence.
- The right column explains Hack Club and YSWS, links to official information, and plainly states LOADOUT's current proposal status.
- Add a footer Community link to this section. Keep the existing main navigation intact.
- Keep the layout static. Organizer rows are informational, with no hover lift or invented clickable profile destination. The official community links and the LOADOUT repository link use standard focus/underline feedback.
- Optional portraits and highlight cards are outside this first version; no personal images or reference-repository media have been approved.

### Approved people and copy

The user supplied the public names and responsibilities in this session. The final display spelling “Netic” preserves a concurrent local edit to the organizer data. Bios elaborate only the supplied responsibilities.

| Public name | Role | Responsibility | Existing icon |
|---|---|---|---|
| Jerry | Lead organizer | Leads LOADOUT and develops its website. | `user` |
| Fazin / Wind | Developer & co-organizer | Works on the program plan and helps develop LOADOUT. | `code` |
| Netic | Developer & co-organizer | Develops Rivet, LOADOUT's Slack bot, and helps organize the program. | `terminal` |

Use `siteConfig.githubUrl` for “Follow the build on GitHub”. Personal profile links remain absent because none were supplied with these names.

Hack Club copy: “Hack Club is a nonprofit community of teenagers who learn by making and sharing their own projects.” Follow with: “Its You Ship, We Ship programs encourage building by offering prizes for projects.”

LOADOUT status: “LOADOUT is a YSWS proposal in development. Hack Club acceptance hasn't been confirmed yet.” This reflects `PRODUCT.md`; it must not become “backed by”, “official”, or “run by Hack Club” until approved status changes.

Official link labels and destinations:

- “Explore Hack Club” → https://hackclub.com/
- “Read about YSWS” → https://readme.hackclub.com/ysws

The official Hack Club homepage and YSWS README were checked on 2026-10-06. No organizational statistics, sponsor claims, prices, dates, or testimonials are included.

### Component and data contract

`BehindLoadoutSection` is a static Server Component. Put the approved organizer data in a small `behind-loadout-content.ts` module; render names/roles as text without HTML injection. Reuse `LoadoutIcon` without modifying its asset mapping.

- Purpose: identify the organizers and explain the wider program context.
- Flow: read the team → read the community context → optionally follow an official resource or repository link.
- State: static server-rendered content; no loading, authentication, session, refresh, or error state is introduced. Links work without JavaScript. Missing future portraits do not create empty image boxes. An empty future organizer list must not produce fake profiles.
- Semantics: `section` with `aria-labelledby="behind-loadout-title"`; one h2; team entries and community title use h3; names and responsibilities remain accessible text. Decorative glyphs have empty alt/aria-hidden through `LoadoutIcon`.
- Desktop: a `minmax(0, …)` two-column grid with a wider directory, a 40px gap, and natural content height. Organizer rows use a 64px glyph rail and flexible text. Never truncate names or bios.
- At 768px and below: one column, organizers first and community context second. At narrow mobile widths, the rows retain readable 16px text and may stack internally rather than squeeze the glyph/name column.
- CSS belongs to a scoped `behind-loadout.css` imported by the layout. Use existing color variables; spacing uses 16/24/32/40/64px steps. No fixed section height, new dependencies, or remote images.
- Contrast: existing ink/canvas 13.45:1, muted/canvas 5.43:1, surface/graphite 12.40:1, ink/yellow 8.39:1. Dark-panel links need a visible yellow focus outline; light-panel links use the existing focus convention. Touch links are at least 44px high.
- Reduced motion: identical static output; no animation or scroll listeners introduced. Preserve all existing page movement.

### Source-use decisions

- Stardance `app/views/landing/sections/_what_is_hc.html.erb` at `3a0fe8148b07c1edfe005e94dfc9d1faa4b64c14`: REFERENCE ONLY for explaining the organizer/community relationship. No Rails code, copy, or media reused.
- Stardance `_highlights.html.erb` at the same pin: REFERENCE ONLY. Its optional highlight format is not implemented without approved assets.
- YSWS Template `frontend/src/routes/+page.svelte` at `1ac191fa5eee1e57983b29ab7101f700c166e207`: REFERENCE ONLY for trust context. No code/media reused; no reuse license is established.
- Pixl at `8141b992e92e05583246fd914c63a101100f6fe4`: existing LOADOUT landing primitives remain the engineering base; this section uses local components instead of copying more upstream code.

### Preflight and acceptance

Identity: existing tokens/components only; no new icon family. Copy: three real user-supplied names, zero invented affiliations, statistics, photos, or bios beyond supplied responsibilities. State model is static and complete. The established page has several layout families; this section adds a directory/context composition. There are no form or navigation changes. No new motion requires additional state or reduced-motion handling.

Preflight scores (0–4): distinctiveness 3; hierarchy 3; identity consistency 4; accessibility 3; state coverage 3; copy quality 3; restraint 4; motion motivation 3. Total 26/32. Visual implementation must still be checked; this is a design assessment, not a browser pass.

Acceptance criteria:

1. The rendered order is FAQ → Who's Behind LOADOUT? → footer, with a unique usable anchor.
2. All three public names, roles, and responsibility sentences match the table.
3. Hack Club context uses the verified official destinations and the proposal status remains explicit.
4. No horizontal overflow at 320, 390, 768, and 1440px; names/bios are readable with fonts disabled and without JavaScript.
5. Existing How it works, RSVP count, homepage anchors, logos, icons, scenery, and motion remain intact.
6. Lint, typecheck, unit tests, production build, and relevant browser/accessibility checks pass. Do not add tests that simply mirror static markup.
7. Review the changed surface when the browser permits it; report any visual evidence limitation accurately.

### Engineering handoff

The `frontend-design-ui-ux` skill requires an engineering handoff. Use one Next.js implementation agent with GPT-6 Luna at medium, honoring the user's model instruction. Its file scope is the new component/content/CSS modules plus integration in `page.tsx`, `layout.tsx`, and one footer anchor. Implement exactly this spec with the locked tokens; do not redesign surrounding sections. The main agent owns the spec, documentation, integration review, and verification. Do not commit, push, merge, or deploy in the delegated build.

### Implementation and verification record

The engineering handoff used `/root/whos_behind_build` with GPT-6 Luna at medium. The primary agent reviewed the full scoped diff and the rendered desktop/mobile section. Review fixes made the roster a semantic list, used the direct “What is Hack Club?” heading, placed the repository link with the organizer directory, and aligned new CSS with the locked tokens. JSX entity escaping fixed the two ESLint errors found in the first lint run.

Skills loaded: `project-frontend`, `project-code-quality`, `frontend-design-ui-ux`, `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites`, and `Pixel Art Animator`. SVG and frame-animation creation were not needed because existing static sprites were reused.

Checks on 2026-10-06:

- `bun run lint`: passed after the JSX fixes.
- `bun run typecheck`: passed.
- `bun run test`: 4 passed, 0 failed.
- `bun run build`: passed, including final TypeScript validation and static prerendering.
- `bun run test:e2e`: 24 passed, including page reflow, anchor uniqueness, keyboard/touch behavior, no-JavaScript access, reduced motion, and automated accessibility checks.
- In-app-browser emulation: split columns at 1440px; single column at 768/390px; internally stacked organizer rows at 320px; no section overflow. The community resource link was reached with Tab and retained a visible 3px yellow outline.

The sandbox could not launch Bun child processes; verification used the host runner after that explicit failure. The local preview is available at `http://localhost:3000/#behind-loadout`. Publication is a separate action through the documented development/testing/main pipeline.


## Jerry organizer copy

_Merged from `jerry-organizer-copy.md`._

### Scope

Update both columns in `apps/landing/app/_components/home/HackClub.tsx` with the owner's approved copy. Expand the left column's Hack Club and LOADOUT introduction into four paragraphs. Shorten the right quote's opening and discount explanation, and merge the character introduction with Goose Lee's community-bot role. Keep the existing `figure`, `blockquote`, paragraph styling and `figcaption`.

### Design and behavior

Follow `DESIGN.md` and the current industrial field-manual identity. This is a static copy replacement in the existing homepage section. Native paragraphs wrap at the existing mobile and desktop widths. No new controls, states, graphics, fonts, effects or tokens are needed. Preserve semantic quotation and attribution.

### Acceptance and handoff

Use four paragraphs on the left and three in the right quote. Introduce Orry and Goose Lee before discussing the bot; Goose Lee is a duck. Preserve Kernel's credit and the personal ending. Keep `Jerry, lead organizer` as the caption and the existing links below the left copy. Layout, fonts and effects remain as designed. This local draft does not authorize a commit or publication.


## Design Read

_Merged from `loadout-irl-compact-card.md`._

---
feature: compact LOADOUT IRL Ruhr card
design_language: ./DESIGN.md
surface: public landing page
status: implemented as a labeled future concept; details and readiness owned by Plan 15 and Plan 06
---


Turn the existing future-event section into a compact industrial event plate: one strong
location-and-format statement, one supporting sentence, and one honest planning status. The
section should feel like a useful field notice, not a second landing page.

### Locked direction

Industrial / signage, bound to `DESIGN.md`: graph-paper canvas, straight ink rules, Jersey 10
display headings, IBM Plex Mono body copy, Bolt Yellow as the single accent, and hard offset
shadows only. Do not add gradients, pills, rounded cards, new colors, or new iconography.

### Copy

- Eyebrow: `Future concept`
- Heading: `LOADOUT IRL // RUHR`
- Lead: `A planned three-day hackathon in Germany's Ruhr area.`
- Supporting copy: `Builders will meet in person to choose a technical project, build together, and share what they make using LOADOUT's four tracks.`
- Status: `Planned concept. Dates, venue, funding, and registration are not confirmed yet.`

Remove the existing weekend itinerary and its Friday/Saturday/Sunday timeline entirely.

### Component specification

#### Purpose

Communicate the planned in-person event without competing with the main process flow.

#### Layout

- Keep the existing section anchor `#loadout-irl` and heading relationship.
- Use a single compact plate below the section heading.
- Use a two-column internal layout on desktop: lead copy on the left, status block on the right.
- Collapse to one column on narrow screens.
- Keep the existing section spacing and max-width conventions.
- The lead sentence is the visual focal point; the status is subordinate.
- Use a vertical ink rule or existing section rule to separate the two columns only if it already
  exists in the current style language. Do not introduce decorative UI.

#### Responsive behavior

- Desktop: two columns with a deliberate asymmetric ratio around 3fr 2fr.
- Mobile: stacked content with the status below the supporting copy and no horizontal overflow.
- Preserve readable body text at the existing minimum size and comfortable line height.

#### Accessibility

- Keep a semantic `<section>` with `aria-labelledby`.
- Keep the existing `h2` heading.
- Status text is plain content, not a badge requiring color interpretation.
- No interactive controls are required.
- Preserve visible focus behavior for page navigation links.
- No new motion; existing reduced-motion behavior remains unchanged.

### States and edge cases

- Only static planned-content state exists.
- No loading, error, empty, or interaction states are needed.
- Copy must remain truthful when dates and venue are unknown.
- Refresh, back navigation, offline use, and reduced motion must render the same static content.

### Design pre-flight

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

### Build handoff

Target: Next.js/React engineering agent.

Implement exactly this spec. Theme the existing markup and styles with the locked tokens in
`DESIGN.md`; do not redesign or re-implement unrelated components. Remove only the obsolete
itinerary data and markup, update the copy exactly, and keep the existing section anchor.


## Less vibed, pass two (design brief)

_Merged from `less-vibed-pass-two.md`._

Status: implementation spec for Plan 23 (removed 25 Oct 2026), 2026-10-16. Binds to `DESIGN.md` and `docs/design/system/design-system.md`: the locked identity (graphite and blue, pixel face, hard rules, block shadows, German mining labels, Orry) does not change. Copy and numbers come from Plan 23 and Plan 02; nothing here sets a price, threshold or formula.

Skills loaded for this change: `frontend-design-ui-ux` (this spec), `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites`, `pixel-art-animator`. No new sprite or SVG asset is made: the layout work reuses the existing pixel icon sprite, and the pixel and animator skills were consulted only to confirm that nothing here is a sprite task.

### Design read

Reading this as: a teen-facing program page for a proposal that has no proof yet, with the plain confidence of Stardance and the worked-example clarity of Pixl, keeping LOADOUT's graphite pixel-and-mining identity. The bet: fewer words, taught once, shown with one real example, in layouts that differ from section to section.

Dials: design variance 6, motion intensity 3 (existing reveals only), visual density 4.

### 1. Page order and sections

Hero (with a short "what is this" paragraph), Tracks, How it works, Prizes, Levels and Rewards, Project fit, Custom Orders, Community Eras, LOADOUT IRL, FAQ, Hack Club and the team. The depth strips (German labels and metres) are reassigned in this order and count down without gaps: Übertage −000 (Tracks), Hängebank −100 (How it works), Füllort −200 (Prizes), 1. Sohle −300 (Levels and Rewards), Strecke −400 (Project fit), Streb −500 (Custom Orders), 2. Sohle −600 (Eras), Wettersohle −700 (IRL), 3. Sohle −800 (FAQ). The hero keeps its own markers.

### 2. Section specs

| Section | Layout | Content rules |
|---|---|---|
| Hero | Unchanged frame. Below the headline, one plain paragraph. The right marginal note stops repeating the status. | "Not open yet" appears here once, in the facts row. Headline fits at 320 px (see 3). |
| Tracks | Four cards stay (four equal things). Each card gets one example line and one tag chip. | Tools: a command-line tool that removes a repeated step, tag CLI. Systems: a small database or a chat server, tag Database. Compute: a program that runs a model on a GPU, tag GPU. Hardware: a custom board or a robot, tag Board. Research Mode strip stays, shorter. |
| How it works | A vertical timeline: a rail with numbered nodes, text to the right, six steps, then the worked example as its last stop. Replaces the card row with arrow connectors. | Teaches Ore, Track XP, review and shipping again once. The worked example: 20 hours at a rating of 10 pays 200 Ore (a Raspberry Pi 5); rated 15 it pays 300. One line: "Joining late is fine. Ore and Track XP carry across seasons, so you can start whenever you join." |
| Prizes | The belt, unchanged. | Lead names no status; it says these are examples at planned prices. |
| Levels and Rewards | One section: a wide table of the five levels (level, what it gives) and one row of three facts (Ore, level discount, Requisition) as plain definition rows, not cards. | Numbers and links only. No re-explaining. |
| Project fit | A compact list: four scoring criteria as rows with a one-line meaning each; the Stronger and Weaker example cards are removed. | Criteria: Originality, Technical Depth, Execution, Documentation. |
| Custom Orders | Three steps in a line joined by arrows (a row, not three equal boxes). | Keeps the three steps. Drops the "not open yet" line. |
| Eras | Text on the left, the three-part loop (Approved projects, Era Points, next theme) as a vertical strip on the right. | The 10% bonus is stated once. No "planned" labels. |
| IRL | Three days as a horizontal timeline. | One note: "Dates, venue and funding are not confirmed." |
| FAQ | One accordion built from native details elements. Works without scripts, no second copy. | Answers keep the agreed numbers. "Joining late" answer added. |
| Hack Club and the team | Unchanged block plus Jerry's why paragraph. | Signed Jerry. No claim about other programs' rates. |

Corner brackets stay on headings only (existing rule). Cards that remain use the existing card style.

### 3. States and responsive behavior

- Widths checked: 320, 360, 375, 390, 430, 768, 1024, 1440, 1920. No horizontal scroll.
- Hero headline: the narrow-screen font size uses a divisor of 9.7 (was 8.35) so "technical stack." fits its box from 320 px up; a test fails when any headline line is wider than its container.
- Timeline: a single column on every width; the rail sits left of the text. Below 640 px the node is 28 px and the text keeps 16 px minimum.
- Levels table: scrolls inside its own container only if needed below 360 px; otherwise it fits.
- Custom Orders arrows turn down arrows below 700 px.
- FAQ: closed, open, keyboard (Enter and Space on the summary), no-script (native). Open state shows a minus, closed a plus.
- Reduced motion: no height animation on the FAQ; reveals stay as they are. No new continuous animation is added.

### 4. Motion

Reveals use the existing triggered slide-in. The FAQ height transition is 250 ms ease-out (`cubic-bezier(0.23, 1, 0.32, 1)`) only where `interpolate-size` is supported, and instant elsewhere and with reduced motion. Nothing animates on keyboard actions beyond the native toggle. Heading scramble behaviour is unchanged.

### 5. Accessibility

Semantic headings stay in order (one h1, h2 per section). The timeline is an ordered list. The levels table is a real table with a caption and header cells. Tags are text, not colour-only. Focus rings stay visible on summaries and links. Contrast follows the existing tokens. Decorative ASCII and strips stay aria-hidden.

### 6. Acceptance criteria

1. The page has the order and depth labels above; the depth strip test passes with nine strips.
2. "Not open yet" appears once on the homepage outside the FAQ's own question; the FAQ appears once; no `noscript` copy of it.
3. Eras and IRL carry one caveat each; no "planned" or "still being finalized" wording.
4. No line of the hero headline exceeds its container at 320 to 430 px.
5. Each track card shows an example and a tag chip.
6. How it works is a vertical timeline with the worked example and the joining-late line.
7. Levels and Rewards is one section; Project fit has no Stronger or Weaker cards.
8. The FAQ opens with the keyboard and without scripts.
9. The unit tests, typecheck, lint and the full e2e suite pass; the docs guard tests pass.
10. The why paragraph and the Poorup example page appear in Docs (Program group) and the Hack Club block.

### 7. Build handoff

Target: the Next.js engineer for `apps/landing`. Implement exactly this spec with the locked tokens; do not redesign. One commit per step of Plan 23's order of work, tests green before the next.
