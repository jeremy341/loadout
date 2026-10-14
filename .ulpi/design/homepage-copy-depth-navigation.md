# Homepage copy and depth navigation

Status: owner-approved local implementation, 2026-10-13. Extends the existing preview branch; publication is not requested.

## Direction and scope

Use the existing industrial field-manual design system: graphite/stone paper, ink rules, pixel signage, IBM Plex Mono reading text, and the theme accent. Keep the homepage sections, cards, diagrams, assets and approved ASCII motion. Shorten only repeated Ore/XP explanations. Make the ruler useful for navigating the page, without representing live program progress.

## Copy ownership

- How it works: the accepted-build outcomes. Ore can be spent across tracks; Track XP is kept as lifetime progress; projects form the Digital Loadout. The upgrade step explains the Physical Loadout without repeating discount rules.
- Progression: each track's lifetime level and the benefit of better related prize prices. Keep the existing milestone rail and a short one-use Requisition note. Link to /docs/progress for details.
- Rewards: using Ore, a related track discount and a matching Requisition in a purchase. Describe a Requisition accurately as allowing more of the earned discount on one eligible prize. Replace the repeated limitation paragraph with links to /docs/pricing and /docs/requisitions.
- Keep FAQ answers independently understandable and retain unique rules in Custom Orders and Eras. Preserve proposal status and all launch caveats. Add no prices, rates or availability claims.

## Depth navigation

The existing decorative top and left rulers stay aligned to the actual depth strips. Add an interactive navigation layer in SheetRuler, visible only on the homepage.

Stops: Surface (#top), -000 Tracks (#tracks), -100 Build loop (#process), -200 Project fit (#project-fit), -300 Levels (#progression), -400 Prizes (#shop), -500 Custom orders (#custom-orders), -600 Eras (#eras), -700 IRL (#loadout-irl), -800 FAQ (#faq), -900 Team (#behind-loadout). Omit absent sections, including the optional IRL block. Read real depth values so omitted sections do not renumber the ruler.

- At >=1420px and sufficient height, show a quiet fixed rail in the left gutter. Fit within the gutter (about 144px wide), use small metre labels and plain section names. Mark the current stop with accent ink plus a visible line/indicator, and aria-current=location.
- Below 1420px or at short height, show a compact depth button at bottom left. It must fit beside the existing Docs tab at 320px. Opening it reveals a bounded, internally scrollable list with >=44px link targets. Avoid a second horizontal scrollbar.
- Use real anchor links and the existing scrolling behavior. Preserve URL hashes, direct deep links and browser back/forward. Choosing a stop closes the compact panel and moves focus to the destination heading without a second scroll.
- Track the current section while scrolling and after resize. Use a passive scroll listener scheduled through requestAnimationFrame; update React state only when the active stop changes. Reuse measurements and clean up listeners/observers.
- The compact control has a descriptive accessible name, aria-expanded and aria-controls. Escape closes the list and returns focus; leaving the panel closes it. Desktop and compact variants share one link list and active state.
- Keep contrast/focus in both themes. Under reduced motion, avoid smooth scrolling and indicator transitions. No scroll-position live announcements.

## Acceptance

Verify active highlighting through scroll and clicks, native hashes/back/forward, keyboard activation and Escape, 320/390px bounded layout, 1920/1440px gutter fit, 200% reflow, both themes, reduced motion, and absence on Docs/404. Keep the current ASCII drift intact. Add focused browser tests for navigation behavior; do not add tests that mirror copy strings.

## Handoff

Two GPT-6 Luna agents at medium reasoning: a copy implementer owns HowItWorks.tsx, Progression.tsx and Rewards.tsx; a navigation implementer owns SheetRuler.tsx, ruler.css and new depth-navigation browser tests. The parent owns this brief, design-system/index updates and final browser review. No overlapping writes, commits or publication.

Skills consulted: project-frontend; frontend-design-ui-ux; frontend-design; design-taste-frontend; emilkowal-animations; accessibility; copywriting; SVG Design; pixel-art-sprites; Pixel Art Animator. No new SVG or sprite assets are needed. Existing identity and components pass the design preflight; interaction and accessibility acceptance are verified after implementation.
