# Copy follow-through: approved fixes 1–4

Status: owner-approved scope; local implementation. No commit, push, deployment, or Slack post requested. This follows the read-only review of `feature/real-details`.

## Intent and design read

Make the existing program explanation more accurate and easier to read. Keep LOADOUT's industrial field-manual identity, the existing design system, page sequence, rulers, paper/grain, typography, prize belt, Jeff, and interaction behavior. No new layout, art, components, or animations. The real-project showcase is deferred.

References: [DESIGN.md](DESIGN.md), [design system](../../docs/design/system/design-system.md), [real-details.md](archive/real-details.md). Macondo informs direct, friendly wording; its program rules are not LOADOUT facts.

## Approved changes

1. Hero support, shortened at the owner's request: “Build tools, servers, GPU projects or hardware. Earn Ore for approved work and spend it on your next build.” Keep the headline and action labels. Keep the shared `heroCopy.support` source consistent.
2. Replace launch-date asides such as “we won't invent one” and “the day it opens” with a short status and an RSVP explanation. An RSVP records interest; it is not enrollment. Apply to the homepage FAQ and corresponding Docs wording.
3. Reorder the existing prize data to put approachable items first: ESP32, soldering kit, Raspberry Pi, SSD, domain, A1 Mini printer, enclosed printer, Framework laptop. Do not alter prices, source images, belt behavior, or add hours/promises to the homepage.
4. Give each existing explanation a job. How it works keeps its exact current file and diagram. Progression owns lifetime level pacing and milestone awards. Rewards owns purchase discounts and their additive relationship. The FAQ gives short answers and a link to its full Docs page. Custom Orders gets a plain homepage introduction and an illustrative Docs request/quote example.
5. Further owner-approved copy amendment: Project Fit heading becomes “What projects fit?” and the Eras heading becomes “Community Eras”. Replace the Era lead with “Each Era gives everyone a shared challenge, like measuring energy use. Ship a qualifying project for 10% extra Ore.” The example is illustrative, not an announced active objective. Retain the existing planned-rule label, qualification notes, flow, and all layout/styles. A personal organizer explanation remains excluded.
6. Owner-approved Docs rule reconciliation: describe settled mechanics directly. Start and Eligibility hold the general launch-status explanation. Other Docs headers link to that status instead of repeating “In development · Draft reference”. Keep frontmatter `status: draft` and the existing renderer/search boundary. Topic pages name an unresolved parameter only where it changes the answer. No new numeric policy, participant services, or homepage edit is authorized by this amendment. The IRL page retains its event-specific status once.

## Docs content

- Correct the repeated claim that every tracked hour earns Ore to say approved hours.
- Link Custom Orders to track progression, distinguishing that from still-unpublished request-specific gates. The request example must not invent a tier, price, or approval decision. It shows the requested item, demonstrated track, evidence, team-assigned gate, quote breakdown, and accept/decline step. Use symbolic amounts until a quote is approved.
- Replace the stale Era statement that award sizes are unpublished. Use the existing 720 + 72 = 792 example as arithmetic, not a promised award. Keep any genuinely unsettled bonus-stacking detail open.
- Shorten FAQ repeats and retain all existing headings/anchors and substantive conditions.
- Align the prize table order with the preview and write 2.4 hours for a 24-Ore domain at the stated 10-Ore/hour illustration.

## States, responsive behavior, and accessibility

All controls, landmarks, headings, links, artwork, loading/error behavior, focus treatment, reduced-motion handling, and breakpoints retain their current implementation. Prize data order also controls accessible reading order; duplicate belt content remains aria-hidden. No unannounced new discount, payout, eligibility, launch, stock, or fulfillment rule. Check that longer hero copy fits the existing width at desktop and phone sizes. Preserve Docs slugs and explicit anchors.

## Preflight and handoff

Existing identity is the constraint. No new tokens, fonts, decorative effects, imagery generation, or vector/sprite changes. Reuse of current cards is intentional under the owner's layout-preservation instruction. Scope is copy, prize order, and Docs only. No new end-to-end rewards example from the excluded earlier section 5.

Skills: project-frontend and copywriting guide the change. The repository's seven UI skills were consulted: frontend-design-ui-ux supplies this brief; frontend-design and design-taste-frontend constrain presentation; emilkowal-animations, svg-design, pixel-art-sprites, and Pixel Art Animator add no specialist work because their surfaces are unchanged.

Build handoff: a GPT-6 Luna engineering agent at medium reasoning owns homepage component edits and shared hero copy. Implement exactly this spec using the locked design system; do not redesign its components. The parent owns public Markdown. Do not edit HowItWorks.tsx, styles, tests, economy plans, or unrelated work. Run no test suites; use focused lint/type checks and content/link inspection, and report any unavailable browser verification honestly.

## Implementation check

The earlier homepage copy changes were implemented locally and received focused lint/type checks and desktop inspection. A full responsive regression pass was not run.

The rule-reconciliation amendment updates the public Markdown, Docs header and internal product/economy records. It removes obsolete capped/tiered Field Requisition rules and distinguishes agreed policy from candidate XP, review and Custom Order parameters. Intermediate XP/discount estimates remain internal. The Docs component passes focused ESLint, `bun run typecheck` passes, all 18 public pages parse without internal-link errors, and `git diff --check` passes. No additional homepage, stylesheet or artwork changes were made for this amendment. No test suites, commit, push, deployment or Slack post were performed.
