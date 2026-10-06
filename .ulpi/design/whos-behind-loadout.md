# Who's Behind LOADOUT?

Status: approved and implemented locally on 2026-10-06 on `feature/whos-behind-loadout`. The placement amendment is binding: FAQ → this section → footer.

## Design read and identity

An organizer directory for prospective technical builders, in LOADOUT's existing industrial field-manual language. Bind to `DESIGN.md`: graph paper, gray surfaces, ink rules, muted Bolt Yellow, Jersey 10 headings, Pixelify Sans names, and IBM Plex Mono body text. Use the existing `SectionHeading` and approved icon family. No palette, font, brand, scenery, or page-wide motion changes.

The distinguishing composition is a vertical organizer list beside one graphite community-context plate. This avoids repeating the page's four-column track and prize grids. DFII: impact 4 + fit 4 + feasibility 4 + performance 4 − consistency risk 2 = 14.

## Scope and composition

- Add one `#behind-loadout` section after the existing FAQ, before `SiteFooter`, inside the main landmark.
- Heading: “Who's behind LOADOUT?”; brief introduction: “The people building the program, the website, and the tools around it.”
- The left column contains three organizer rows. Each row uses an existing decorative 32px sprite in a 64px glyph plate, then the public name, role, and one concise responsibility sentence.
- The right column explains Hack Club and YSWS, links to official information, and plainly states LOADOUT's current proposal status.
- Add a footer Community link to this section. Keep the existing main navigation intact.
- Keep the layout static. Organizer rows are informational, with no hover lift or invented clickable profile destination. The official community links and the LOADOUT repository link use standard focus/underline feedback.
- Optional portraits and highlight cards are outside this first version; no personal images or reference-repository media have been approved.

## Approved people and copy

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

## Component and data contract

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

## Source-use decisions

- Stardance `app/views/landing/sections/_what_is_hc.html.erb` at `3a0fe8148b07c1edfe005e94dfc9d1faa4b64c14`: REFERENCE ONLY for explaining the organizer/community relationship. No Rails code, copy, or media reused.
- Stardance `_highlights.html.erb` at the same pin: REFERENCE ONLY. Its optional highlight format is not implemented without approved assets.
- YSWS Template `frontend/src/routes/+page.svelte` at `1ac191fa5eee1e57983b29ab7101f700c166e207`: REFERENCE ONLY for trust context. No code/media reused; no reuse license is established.
- Pixl at `8141b992e92e05583246fd914c63a101100f6fe4`: existing LOADOUT landing primitives remain the engineering base; this section uses local components instead of copying more upstream code.

## Preflight and acceptance

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

## Engineering handoff

The `frontend-design-ui-ux` skill requires an engineering handoff. Use one Next.js implementation agent with GPT-6 Luna at medium, honoring the user's model instruction. Its file scope is the new component/content/CSS modules plus integration in `page.tsx`, `layout.tsx`, and one footer anchor. Implement exactly this spec with the locked tokens; do not redesign surrounding sections. The main agent owns the spec, documentation, integration review, and verification. Do not commit, push, merge, or deploy in the delegated build.

## Implementation and verification record

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
