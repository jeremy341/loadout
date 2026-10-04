# LOADOUT Public Site Pixl Port and Redesign Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task. Keep the work sequential because the ported baseline is the reference point for the redesign.

**Goal:** Port the pinned Pixl public landing site into LOADOUT as a locally verifiable baseline, then reshape that same Next.js app into the approved LOADOUT public homepage.

**Architecture:** Stage A brings over only the pinned Pixl landing application and the assets it actually uses, preserving its page composition and supported locales so it can be compared against its source. Stage B keeps the landing app and its useful Next.js patterns, replaces Pixl identity and coupling, and builds the LOADOUT page from the canonical plans and current visual system.

**Tech Stack:** Pixl source at Next.js 16.3.5, React 19.2.4, TypeScript 5, Tailwind CSS 4, Bun 1.3.13, Framer Motion 12.40, and Lenis 1.3.23. Keep the landing package's pinned motion dependencies for the port and redesign; do not import Pixl's full monorepo or backend.

**Spec:** This plan implements the user-provided “LOADOUT Public Website — Pixl Port + Redesign Planning Task,” the current full-page LOADOUT landing reference, and canonical product rules in PLAN/00–06. Read PLAN/07–08 for source provenance and YSWS context. PLAN/LOADOUT_MASTER_PLAN_v4.md is a historical snapshot.

**Execution amendment (2026-10-04):** The user explicitly authorized the port/redesign, paused before UI for a model change, then authorized Stage B using `codex-clipboard-6ecd3256-5ec8-4580-a85b-8105eafacdd8.png`. Stage A is verified and the LOADOUT UI is now implemented locally in that same landing app. The latest screenshot adds pixel clouds, a skyline, project-fit containers, and a custom-order/requisition strip. Exact reuse decisions, assets, differences from mockup data, and validation evidence are recorded in `loadout/docs/source-audit/PUBLIC_SITE_PORT.md`. Publication and remote lane/protection verification remain separate.

**Hero refinement:** The user's subsequent reference `codex-clipboard-15beff91-84dd-439c-8541-1ac5add39397.png` governs a fullscreen first viewport. Bolts use a custom yellow lightning SVG; enlarged clouds move with bounded scroll parallax as well as gentle drift. These visual changes preserve canonical program facts and the reduced-motion fallback.

## Global Constraints

- Work in the LOADOUT repository at loadout/ and follow its development → testing → main PR workflow.
- Pixl is the primary engineering base at references/pixl/, pinned to 8141b992e92e05583246fd914c63a101100f6fe4; preserve its MIT notice and update docs/source-audit/ATTRIBUTION.md and DECISIONS.md for copied or adapted landing files.
- Stage A is a local verification baseline. Keep it noindex and do not deploy Pixl identity or content to a LOADOUT domain.
- Do not copy Pixl's next.config.ts rewrites, vercel.json proxies, app/api/rsvp endpoint, Pixl credentials, or Pixl server/game dependencies.
- Audit asset-level rights before copying Pixl media into the LOADOUT product tree. Unclear media remains in the reference submodule and is represented by a temporary neutral placeholder in the local baseline.
- Do not copy code or assets from YSWS Template or Stardance. They remain reference-only.
- LOADOUT has four tracks: Tools, Systems, Compute, Hardware. Research Mode is a modifier, never a fifth track.
- Bolts are global. Track XP drives per-track progression. Shipped work builds the Digital Loadout; rewards upgrade the Physical Loadout.
- Keep LOADOUT's quality rubric as Originality, Technical Depth, Execution, and Documentation. Do not adopt Stardance's Rails architecture, review rubric, score aggregation, percentile, or payout formula.
- Do not invent event dates, eligibility promises, prices, stock, discount percentages, sponsor commitments, participation metrics, or RSVP/login URLs. Render calls to action only when their destinations are confirmed; otherwise use safe in-page navigation.
- Build the Stage B page from LOADOUT-owned content and assets. Do not use game-world lore, generic track labels, fake product imagery, fabricated project examples, or claims that imply Hack Club acceptance or endorsement.
- Treat the current root LOADOUT_DESIGN_SYSTEM.md and the supplied screenshots as the visual direction. Reconcile its Bolt Yellow system with stale orange-accent text in PLAN/03 and PLAN/06 before implementation; product facts in the canonical plans remain authoritative.
- The full-page screenshot is a visual reference for rhythm and presentation. Its sample copy, tier names, hour/Bolt rows, item prices, stock, and discount percentages are not approved product data.
- Do not migrate the participant dashboard, admin/reviewer UI, backend, economy engine, review system, fulfillment, or shop functionality in this work.

## Required Skill Workflow for Stage B

Use the named skills as implementation tools. The user brief, canonical LOADOUT plans, and LOADOUT_DESIGN_SYSTEM.md determine product facts and visual direction; a skill must not introduce conflicting copy, aesthetics, or effects.

| Order | Skill | Use |
|---|---|---|
| 1 | superpowers:brainstorming | Reconfirm the landing page's audience, canonical content, and visual-reference boundaries before making design decisions. |
| 2 | impeccable | Load project context once, shape the public landing page in Persuade mode, and critique the finished surface. Keep the locked off-white, grid-paper, black/graphite, Bolt Yellow identity. |
| 3 | frontend-design-ui-ux | Turn the screenshots and approved product content into a clear page hierarchy, section states, responsive component briefs, and accessibility constraints. Keep its per-page design handoff under loadout/.ulpi/design/ and synchronize approved system-wide tokens into LOADOUT_DESIGN_SYSTEM.md so there is still one canonical visual system. |
| 4 | frontend-design and design-taste-frontend | Build the approved composition with deliberate hierarchy and an anti-AI-slop review. Reject generic SaaS layouts, repeated interchangeable card grids, meaningless decoration, fake precision, and default stock imagery. |
| 5 | svg-design | Create the small reusable LOADOUT icon and marker family as authored SVG. Read its icon-design and accessibility references; optimize paths and label decorative versus meaningful icons correctly. |
| 6 | design-motion-principles and emilkowal-animations | Design the smooth-scroll, navigation, reveal, hover, and FAQ motion as one coherent system with clear triggers, timing, interruption, and reduced-motion behavior. |
| 7 | mobile-responsiveness and accessibility | Validate navigation, section flow, cards, tables, touch targets, keyboard access, focus, contrast, and reduced-motion behavior at mobile and desktop sizes. |
| 8 | review-animations and impeccable critique | Review the implemented motion and full-page visual result before final browser verification; fix the bounded set of findings and capture the resulting screenshots. |
| 9 | superpowers:verification-before-completion | Run the plan's final checks before calling the page complete or preparing its PR. |

Do not generate final icons or interface graphics with image-generation tools. Use hand-authored SVGs for the technical icon family and real, rights-cleared photography only where it adds truthful project or reward context.

## Review Focus

- Missing join, login, schedule, or site URL configuration: no dead links or fabricated destinations; test both absent and configured values.
- Locale paths during Stage A and the English LOADOUT route in Stage B: every supported Stage A locale renders and an unknown locale returns not found; Stage B has one canonical root URL unless localization is separately approved.
- Pixl service coupling: no proxy, RSVP handler, API call, credential, or deployment target can reach Pixl from the LOADOUT app.
- Narrow screens and long content: no horizontal overflow at 320, 390, 768, and 1440 CSS pixels; section navigation and reward content remain readable.
- Motion and interaction: keyboard users can reach every control, focus remains visible, FAQ controls expose state, and reduced-motion preferences suppress nonessential animation and autoplay.
- Unlicensed or misleading assets/content: the landing tree contains only rights-cleared assets and claims backed by canonical plans or confirmed configuration.

---

## Source and Target Map

All source paths below are relative to loadout/references/pixl/. The target paths are relative to the LOADOUT repository root.

| Pixl source | Stage A disposition | Stage B disposition |
|---|---|---|
| apps/landing/app/[lang]/page.tsx | Preserve the landing section order and component composition. | Replace the composition with LOADOUT-owned sections at the root route. |
| apps/landing/app/[lang]/layout.tsx and app/[lang]/dictionaries/* | Preserve the five source locales for baseline verification. | Use an English root page per docs/source-audit/UI_MATRIX.md unless localization is explicitly added later. |
| apps/landing/app/_components/Menu.tsx, LanguageSwitcher.tsx, Hero.tsx, Description.tsx, Story.tsx, MapPreview.tsx, MainContent.tsx, FAQ.tsx, Footer.tsx | Port the rendered surface for comparison, with safe local-only configuration and no backend integration. | Retain only useful structure and interaction patterns; replace Pixl copy, identity, URLs, and sections. |
| apps/landing/app/_components/SmoothScroll.tsx, EasterEgg.tsx, Crew.tsx, Flow.tsx, Shop.tsx, Sidequests.tsx, Marquee.tsx | Include only if the baseline route imports or requires them; record dependencies. | Remove Pixl-only behavior and retain an effect only when it improves LOADOUT usability and passes accessibility/performance checks. |
| apps/landing/app/_components/ExampleSubmission.tsx | Not rendered by the current home page; exclude unless source inspection proves a dependency. | Do not include without an approved, real LOADOUT example. |
| apps/landing/app/globals.css and public/* | Port only required CSS and assets after rights review. | Replace Pixl visual tokens and world/game imagery with the LOADOUT design system and rights-cleared media. |
| apps/landing/app/_generated/config.ts | Do not copy as the LOADOUT configuration contract. | Replace with a small LOADOUT-owned site configuration. |
| apps/landing/proxy.ts | Adapt locale negotiation only; remove game-shell path exclusions. | Remove if Stage B uses the canonical English root route. |
| apps/landing/app/robots.ts and sitemap.ts | Keep the route files only as noindex/disallow-all local-baseline behavior. | Generate SEO metadata and sitemap URLs only from a confirmed LOADOUT site origin. |
| apps/landing/app/api/rsvp/route.ts and its tests | Exclude; the landing page does not need Pixl's Airtable handler. | Exclude. Add no RSVP endpoint in this scope. |
| apps/landing/next.config.ts and vercel.json | Recreate a minimal LOADOUT Next config; do not copy rewrites or headers that target Pixl services. | Keep only owned configuration. There is no Pixl proxy or Pixl deployment target. |
| apps/landing/package.json, tsconfig.json, eslint.config.mjs, postcss.config.mjs | Adapt the landing package configuration. | Keep and simplify as needed for the one public app. |

Update docs/source-audit/ATTRIBUTION.md and DECISIONS.md with the exact source paths, pinned SHA, MIT basis, destination paths, and ADAPT/REIMPLEMENT/REFERENCE ONLY/IGNORE classification for each selected idea. Keep the complete Pixl notice in the repository LICENSE.

### Navigation and footer link audit

| Existing link/content | Stage A | Final LOADOUT page |
|---|---|---|
| About, tracks, FAQ, and other section anchors | Preserve their working local behavior. | Rename/repoint to the matching LOADOUT sections. |
| Pixl play, dashboard, shop, and account destinations | Keep only as verified direct outbound links if needed to mirror source behavior; never proxy them through LOADOUT. | Remove until LOADOUT owns an equivalent route. |
| Pixl docs path and Pixl FAQ Google Doc | Keep local-only only after verifying a direct public destination; omit the action if its URL cannot be confirmed. | Replace with an owned LOADOUT documentation route when one exists; otherwise remove. |
| Pixl GitHub URL | Retain only as an outbound reference link in the local baseline. | Repoint to github.com/jeremy341/loadout. |
| Pixl crew Slack profiles, Pixl events, game videos, and source-specific stories | Preserve visible baseline copy only where the link remains safe and verified; do not use a LOADOUT proxy. | Remove. |
| Hack Club Slack, Code of Conduct, workshops, events, team, brand, and donation links | Retain only verified links that are part of the source baseline. | Keep only relevant, current links and neutral wording; do not say “a project by Hack Club” or imply acceptance/endorsement without confirmation. |
| Schedule, login, RSVP, and community navigation | Preserve baseline presentation while ensuring links do not invoke Pixl APIs or proxies. | Show only when an approved destination/config exists. Otherwise omit it or use a safe internal anchor. |
| New LOADOUT navigation | Not applicable. | Add anchors for About, Tracks, Progression, Rewards, and FAQ, plus configured community/schedule/join links only. |

### Pixl motion inventory and redesign disposition

The port should preserve Pixl's motion as a verifiable baseline. Stage B keeps the motion patterns that make the page feel responsive while replacing content-bound Pixl effects with LOADOUT equivalents.

| Pixl source path | Existing motion pattern | LOADOUT disposition |
|---|---|---|
| apps/landing/app/_components/SmoothScroll.tsx and app/globals.css | Lenis smooth scrolling driven by requestAnimationFrame plus CSS scroll-behavior. | Keep smooth, user-controlled scrolling. Own and cancel the animation frame on teardown; avoid double-smoothing, scroll hijacking, and broken anchor/focus navigation. Fall back to native/instant scrolling for reduced-motion preference. |
| apps/landing/app/_components/Menu.tsx | Navigation hides while scrolling down and reappears on upward scroll, with a short transform transition. | Keep this behavior if focus, hover, open menus, and keyboard navigation pin the menu visible. Respect reduced motion and do not hide the focused link. |
| apps/landing/app/_components/Hero.tsx | Staggered hero entrance, CTA hover/press movement, and a repeating scroll-hint animation; also includes a remote Pixl background video. | Keep a restrained headline/CTA entrance, tactile button feedback, and a small scroll cue. Remove the Pixl video from the final page; retain no remote autoplay media without a confirmed right, purpose, and static fallback. |
| apps/landing/app/_components/Description.tsx, Flow.tsx, Shop.tsx, FAQ.tsx, and Footer.tsx | In-view fades/slides, staggered items, card hover lift, animated FAQ disclosure. | Keep a small shared set of opacity/transform reveals, card/button feedback, and an accessible FAQ expand/collapse. Use short durations and avoid content staying invisible if JavaScript or motion fails. |
| apps/landing/app/_components/Marquee.tsx | Continuous looping marquee. | Remove unless the final page has meaningful, nonduplicated content that benefits from it. If retained, provide pause/focus behavior and a reduced-motion static layout. |
| apps/landing/app/_components/MapPreview.tsx and Story.tsx | Pulsing world-map markers and Pixl-specific story/currency transitions. | Remove with the Pixl map and story. Reuse the motion technique only for a truthful LOADOUT concept where it improves understanding. |

## Stage A — Faithful Local Pixl Landing Baseline

The baseline is a temporary engineering comparison surface. Preserve Pixl's visible page structure and copy locally; keep the implementation isolated from Pixl services and prevent indexing or deployment as LOADOUT.

### Task 1: Resolve plan authority and source asset rights

**Files:**
- Read: PLAN/00_LOADOUT_CANONICAL_INDEX.md through PLAN/08_HACKCLUB_YSWS_ECOSYSTEM_CONTEXT.md
- Read: LOADOUT_DESIGN_SYSTEM.md
- Read: loadout/docs/source-audit/SOURCE_BASES.md, UI_MATRIX.md, ARCHITECTURE_NOTES.md, ATTRIBUTION.md, DECISIONS.md
- Modify during implementation: PLAN/03_LOADOUT_UI_DESIGN_SYSTEM.md and PLAN/06_LOADOUT_PUBLIC_HOMEPAGE.md only to align outdated visual tokens with the latest user-approved visual system
- Modify during implementation: loadout/docs/source-audit/ATTRIBUTION.md and DECISIONS.md

- [ ] Confirm the reference checkout is clean and at SHA 8141b992e92e05583246fd914c63a101100f6fe4.
- [ ] Build a source-to-destination list from the table above and the exact imports in apps/landing/app/[lang]/page.tsx.
- [ ] Inventory every asset actually referenced by the landing route. Record path, source license/notice, and Stage A/Stage B disposition; do not copy unrelated files from the 179-file public directory.
- [ ] Reconcile PLAN/03 and PLAN/06 with LOADOUT_DESIGN_SYSTEM.md. The current visual tokens are off-white canvas, black/graphite structure, and Bolt Yellow #FBC834; remove stale orange-as-primary guidance.
- [ ] Record the Stage A local-only/noindex boundary and Stage B LOADOUT design decisions in the source audit before code is copied.

**Check:** The inventory identifies every imported page component, external URL, used asset, source license basis, and excluded Pixl endpoint/config file.

### Task 2: Create the minimal landing workspace and copy the baseline

**Files:**
- Create: loadout/package.json and loadout/bun.lock
- Create: loadout/apps/landing/package.json
- Create/adapt: loadout/apps/landing/app/[lang]/page.tsx
- Create/adapt: loadout/apps/landing/app/[lang]/layout.tsx
- Create/adapt: loadout/apps/landing/app/[lang]/dictionaries.ts and approved source locale dictionaries
- Create/adapt: loadout/apps/landing/app/_components/* used by the route
- Create/adapt: loadout/apps/landing/app/globals.css and required static assets
- Create/adapt: loadout/apps/landing/proxy.ts, next.config.ts, tsconfig.json, eslint.config.mjs, postcss.config.mjs
- Exclude: source vercel.json, app/api/rsvp, game/server packages, and unrelated source workspaces

- [ ] Define a minimal Bun workspace containing apps/landing only. Do not import Pixl's root scripts, packages, Turborepo tasks, server, or dashboard.
- [ ] Retain the pinned landing dependency versions and regenerate the LOADOUT lockfile from only the landing package. Add explicit lint, typecheck, test, build, and local development scripts for this package.
- [ ] Add Playwright as a landing-only development dependency for route and browser checks; do not add a second app or a shared test platform.
- [ ] Before changing code, read the matching Next.js 16.3.5 documentation shipped with the source environment and inspect the landing package instructions for compatibility notes.
- [ ] Port the visible page and its five locales with the source's layout and assets that passed the asset review.
- [ ] Replace app configuration with local-only reference values. Keep outbound links direct; do not create a proxy or call a Pixl API.
- [ ] Set the baseline metadata to noindex, disallow crawling, and avoid publishing a sitemap. Add a visible development-only notice outside the captured page if needed to prevent confusion.
- [ ] Preserve the upstream MIT notice and record copied files in docs/source-audit/ATTRIBUTION.md.

**Check:** Bun install completes from the new lockfile; no source path outside apps/landing is required to build or run the page.

### Task 3: Verify the baseline against the pinned source

**Files:**
- Create: loadout/apps/landing/e2e/pixl-baseline.spec.ts
- No production screenshots or unlicensed reference media are committed.

- [ ] In pixl-baseline.spec.ts, assert that /en, /es, /fr, /hi, and /pt return the expected page language, an unsupported locale returns not found, and rendered navigation anchors stay local.
- [ ] Assert that the LOADOUT app does not expose /api/rsvp or rewrite a request to a Pixl host.
- [ ] Run the pinned Pixl landing source locally and capture both source and LOADOUT baseline at matching 1440px desktop and 390px mobile viewports.
- [ ] Compare section order, typography, spacing, responsive navigation, image/video placement, locale switching, FAQ behavior, smooth scroll, nav hide/reveal, in-view reveals, hover feedback, and FAQ motion. Record material differences and their asset/license or configuration reason.
- [ ] Visit /en, /es, /fr, /hi, and /pt; verify the default locale and invalid-locale behavior.
- [ ] Inspect browser network activity and route config. Confirm the LOADOUT baseline makes no Pixl API calls and has no Pixl-host rewrite, Airtable, game, server, or web-shell route.
- [ ] Keep baseline captures in temporary review artifacts; do not commit Pixl screenshots as LOADOUT media.
- [ ] From apps/landing, run bun run lint, bun run typecheck, and bun run build.
- [ ] From apps/landing, run bunx playwright test e2e/pixl-baseline.spec.ts.

**Check:** Lint, typecheck, build, locale smoke checks, and visual comparison all pass or have documented asset/config exceptions. The app remains noindex and local-only.

## Stage B — Redesign the Existing Port as LOADOUT

Use the current full-page screenshot as a composition and rhythm reference: framed hero, graph-paper canvas, compact navigation, section eyebrows, outlined cards, dark track panels, a progression display, a reward table, FAQ rows, and a dense editorial footer. Use the hero screenshot for the centered headline, negative space, side labels, corner marks, and yellow CTA placement. Do not reproduce image-generated copy or sample economics.

### Task 4: Replace Pixl configuration, metadata, and identity

**Files:**
- Create: loadout/apps/landing/lib/site-config.ts
- Modify: loadout/apps/landing/app/[lang]/layout.tsx, app/robots.ts, app/sitemap.ts, app/icon.png or app/icon.svg
- Modify: loadout/apps/landing/app/[lang]/dictionaries/en.json only if locale files are temporarily retained
- Modify: loadout/docs/source-audit/ATTRIBUTION.md and DECISIONS.md

- [ ] Define an explicit LOADOUT-owned config for site origin, confirmed join URL, confirmed login URL, confirmed schedule URL, and community URL. Leave unconfirmed values unset.
- [ ] Render primary and secondary CTAs as safe in-page links when join/login destinations are absent. Never show a disabled RSVP button or a fake URL.
- [ ] Replace Pixl title, description, Open Graph image, canonical links, and icon. Emit production indexing and sitemap entries only when a confirmed site origin is configured.
- [ ] Remove unused Pixl locale dictionaries and locale switcher when switching to the English root route.
- [ ] Confirm footer wording does not imply Hack Club acceptance, endorsement, or event sponsorship.

**Check:** Config tests cover absent optional destinations, malformed URLs, and configured HTTPS destinations; metadata contains no pixl hostname, Pixl asset, or Pixl product wording.

### Task 5: Reshape the page using LOADOUT's canonical information architecture

**Files:**
- Create: loadout/apps/landing/app/page.tsx
- Create: loadout/apps/landing/app/_components/SiteNav.tsx
- Create: loadout/apps/landing/app/_components/Hero.tsx
- Create: loadout/apps/landing/app/_components/AboutLoadout.tsx
- Create: loadout/apps/landing/app/_components/HowItWorks.tsx
- Create: loadout/apps/landing/app/_components/TrackGrid.tsx
- Create: loadout/apps/landing/app/_components/Progression.tsx
- Create: loadout/apps/landing/app/_components/ResearchMode.tsx
- Create: loadout/apps/landing/app/_components/RewardsOverview.tsx
- Create: loadout/apps/landing/app/_components/ShopPreview.tsx
- Create: loadout/apps/landing/app/_components/FAQ.tsx
- Create: loadout/apps/landing/app/_components/SiteFooter.tsx
- Remove after migration: loadout/apps/landing/app/[lang]/* and Pixl-only components/assets not used by the final page

- [ ] Compose one English canonical root page in this order: navigation and hero; what LOADOUT is; how the program works; four tracks; Research Mode callout; Digital/Physical Loadout and track progression; Bolts and reward overview; approved shop/requisition/custom-order preview; FAQ; footer.
- [ ] Use the hero headline and copy from PLAN/06, preserving the reference's centered composition, framed corners, side labels, yellow primary treatment, and clear secondary in-page action.
- [ ] Explain the loop from choosing a technical track, building and shipping, review, Track XP and global Bolts, to growing a Digital Loadout and upgrading a Physical Loadout.
- [ ] Render exactly Tools, Systems, Compute, and Hardware as tracks. Place Research Mode beside or below them as an optional project mode.
- [ ] Use the current plan's four track levels, LV.1–15, only if that range remains approved at implementation time. If names, benefit thresholds, or item unlocks are unapproved, show the relationship between Track XP and progression without inventing them.
- [ ] Include a field-pricing/access section in the screenshot's position when the approved policy can be explained. Describe track affinity and eligible pricing at the approved level; do not copy screenshot percentages or imply an unconfirmed partner offer. If policy is not ready, merge this content into the track/rewards explanation.
- [ ] Include project-fit examples only when they map to actual approved examples in PLAN/01 and PLAN/06. Do not fabricate shipped projects, participants, metrics, or rewards.
- [ ] Keep Requisitions and Custom Orders subordinate to the core program explanation and describe them only as approved canonical concepts; do not imply an operational shop or fulfillment capability that has not launched.
- [ ] Keep FAQ answers within confirmed program policy. Omit dates, age/region claims, joining promises, reward stock, and AI-use rules until verified.
- [ ] Reuse the existing landing app and its useful semantic patterns. Remove Pixl Story/Map lore, Easter Egg, Crew, world map, Pixl names, Pixl-only links, and unrelated page code.

**Check:** A content audit finds the four canonical tracks exactly once as track cards, Research Mode separately, and no Pixl, fake metric, mock price, invented discount, or unconfirmed CTA destination in the rendered page.

### Task 6: Apply the approved visual language and owned assets

**Files:**
- Modify: loadout/apps/landing/app/globals.css
- Create: loadout/apps/landing/app/_components/icons/*
- Create: loadout/apps/landing/public/loadout/*
- Modify: loadout/apps/landing/app/_components/* from Task 5

- [ ] Apply LOADOUT_DESIGN_SYSTEM.md tokens: canvas #F1EFEA, surface #F7F5F0, grid #D8D6D1, ink #17181A, graphite #202225, and Bolt Yellow #FBC834.
- [ ] Use the restrained graph-paper grid, Jersey 10 or Pixelify Sans display headings, IBM Plex Mono or Space Mono body/UI text, square outlined panels, limited hard shadows, small plus marks, corner brackets, and occasional three-slash markers from the supplied reference. Bundle fonts only with a verified license and readable system fallbacks.
- [ ] Preserve the reference's long-page editorial rhythm with varied layouts: four-card overview, connected work flow, four dark track cards, progression row, compact field-pricing/reward panel, reward cards, FAQ, and footer. Avoid repeating identical card grids for every section.
- [ ] Build a small reusable SVG icon family on a consistent 24px or 32px grid, using black outline, yellow fill, and at most one neutral secondary color. Do not use emoji as final icons.
- [ ] Keep Pixl's smooth-scroll feel, scroll-direction navigation reveal, restrained hero/section entrances, button/card feedback, and animated FAQ behavior as adapted in the motion inventory. Use design-motion-principles and emilkowal-animations to define the shared motion tokens before implementing each interaction.
- [ ] Prefer real, rights-cleared project and reward imagery with accurate labels and alt text. If no approved image exists, use an honest diagram or icon; never imply a pictured item is currently in stock.
- [ ] Keep the background clean and low contrast. Avoid gradients, glass, 3D metal, grime, game imagery, decorative gear/cable motifs, and animation that competes with reading.

**Check:** At 1440px, the page follows the screenshot's visual hierarchy and section rhythm; at smaller sizes, the composition adapts instead of shrinking desktop labels.

### Task 7: Responsive behavior, accessibility, and performance

**Files:**
- Modify: loadout/apps/landing/app/_components/SiteNav.tsx, FAQ.tsx, and any interactive components
- Modify: loadout/apps/landing/app/globals.css
- Create: loadout/apps/landing/e2e/accessibility.spec.ts
- Add: @axe-core/playwright as a landing-only development dependency

- [ ] Validate layouts at 320, 390, 768, 1024, and 1440 CSS-pixel widths. Collapse the navigation accessibly, stack CTAs on narrow screens, change card grids to two columns then one, and convert the desktop process flow to a readable vertical sequence.
- [ ] Use semantic landmarks and ordered headings, descriptive link text, informative image alt text, decorative SVGs hidden from assistive technology, and keyboard-operable FAQ controls with expanded state.
- [ ] Meet WCAG 2.2 AA contrast, visible focus, and 44px minimum touch targets. Do not rely on color alone to distinguish tracks or states.
- [ ] Respect prefers-reduced-motion. Keep smooth scrolling and useful reveals by default, with a native/instant scroll and static-content fallback when reduced motion is requested. Preserve keyboard and browser anchor behavior; remove an effect only when it cannot meet those requirements.
- [ ] Remove autoplay video and remote decorative media from the final LOADOUT homepage unless an approved local asset has a clear user purpose and a static reduced-motion fallback.
- [ ] Use responsive image sizing and lazy loading below the fold; verify that the grid and decorative marks do not create layout shift or block content.
- [ ] Add an accessibility browser check using axe-core/playwright and review its findings manually; do not treat an automated score as proof of WCAG conformance.
- [ ] Verify the motion inventory with normal and reduced-motion settings, keyboard-only navigation, anchor jumps, scroll-up/down menu behavior, and FAQ open/close. Confirm content remains visible when animation is disabled.

**Check:** Keyboard-only walkthrough reaches all navigation and FAQ controls; automated accessibility checks have no serious/critical findings; no horizontal scrolling occurs at tested widths.

### Task 8: Final verification and source cleanup

**Files:**
- Add: loadout/apps/landing/e2e/homepage.spec.ts
- Add: loadout/apps/landing/playwright.config.ts
- Modify: loadout/package.json and loadout/apps/landing/package.json
- Modify: loadout/docs/source-audit/ATTRIBUTION.md and DECISIONS.md
- Remove: unused Pixl-only files from loadout/apps/landing

- [ ] Add browser checks for root metadata, section anchors, confirmed/unset CTA destinations, track count and names, Research Mode placement, FAQ keyboard behavior, footer links, normal/reduced-motion behavior, and absence of Pixl strings/routes.
- [ ] From apps/landing, run bun run lint, bun run typecheck, bun test, bun run build, and bunx playwright test. Run the accessibility spec with bunx playwright test e2e/accessibility.spec.ts.
- [ ] Capture final full-page and viewport screenshots at desktop, tablet, and mobile sizes. Compare the page to the supplied reference for composition, spacing, hierarchy, and section rhythm; review content against PLAN/00–06 separately.
- [ ] Search the final app and generated output for Pixl domains, game/server route names, Airtable terms, source-only metadata, unsupported prices, discount percentages, dates, sponsors, and fake examples.
- [ ] Confirm robots and sitemap behavior for local/preview versus a configured production origin.
- [ ] Update attribution records with each copied/adapted source path and preserve the MIT notice.
- [ ] Open a PR from a short-lived branch to development. Promote to testing and main only through the documented lane PRs after each required CI lane passes.

**Check:** All required CI checks pass; browser and accessibility review pass; no unlicensed assets, Pixl integrations, unsupported claims, or stale Pixl application files remain in the final page.

## Explicit Non-Goals

- Migrating Pixl participant or admin dashboards.
- Building LOADOUT authentication, project submission APIs, reviewer allocation, scoring, appeals, Bolt ledger, shop, requisition engine, or fulfillment.
- Adopting Stardance or YSWS Template architecture, code, assets, or business rules.
- Publishing or deploying the Stage A Pixl baseline.
- Adding an RSVP, login, schedule, waitlist, reward, or discount promise without confirmed destinations and policy.
- Reproducing every pixel of the supplied full-page screenshot at the cost of canonical LOADOUT product facts or accessibility.

## Definition of Done

- The local Stage A baseline was compared with the pinned Pixl landing at matching viewports and its differences were documented.
- Stage B redesign continues in the same landing app and follows the latest LOADOUT design system and supplied visual references.
- The final homepage explains LOADOUT's technical program, four tracks, separate Research Mode, Track XP/global Bolts relationship, Digital/Physical Loadout loop, and approved rewards clearly.
- No invented offers, numerical economics, dates, program acceptance, sponsors, fake examples, or dead RSVP/login destinations appear.
- The page is responsive, keyboard accessible, reduced-motion aware, noindex until the owned origin is configured, and covered by the planned CI/browser checks.
- Pixl provenance and MIT attribution are intact; no Pixl proxy, API, secret, deployment route, or unrelated application was migrated.
- The work stays within the public landing-page scope and advances through the documented branch lanes by PR.
