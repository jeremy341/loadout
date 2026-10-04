# LOADOUT Homepage RSVP, Motion and Content Refinement Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for the existing direct-code build path. Use checkbox steps task by task. Delegation, when required by the UI/UX handoff or chosen for independent work, must use GPT-6 Luna at medium under the user's AGENTS instruction.

**Goal:** Refine the current homepage with a real RSVP destination, a more specific slogan, source-grounded Pixl motion, downward scroll guidance, larger horizontally moving clouds, a greyer/muted palette, and the missing public explanations.

**Architecture:** Retain `loadout/apps/landing`, its containers, Next root route, Lenis wrapper, SVG system, and Framer Motion. Change public configuration/copy, a few page components, and existing CSS rules in place. New content is static marketing explanation; signup stays on the external RSVP service.

**Tech Stack:** Existing Next16.3.5, React19.2.4, TypeScript5, Bun1.3.14, Framer Motion12.40, Lenis1.3.23, Playwright/axe. No new UI framework, animation library, CMS, or backend.

**Spec:** `loadout/.ulpi/design/loadout-homepage-refinement-proposal.md`; evidence: `loadout/docs/source-audit/PIXL_MOTION_PARITY.md`; product authority: PLAN/00–02 and public-page requirements in PLAN/06. Current visual authority remains `LOADOUT_DESIGN_SYSTEM.md` / `loadout/.ulpi/design/DESIGN.md` until this proposal is implemented.

**Status:** Planning only. The user approved the seven-item scope and selected **Build your own technical stack.** on 2026-10-04. Execution follows review of this concrete plan; the direct-code method has already been selected. No product-code changes are part of this planning pass.

## Global constraints

- Preserve dirty work on `chore/reference-layout`; no reset, blanket cleanup, forced history rewrite, temporary organization, or lane promotion during planning.
- Branch flow remains short-lived branch → PR to development → promotion PR to testing → promotion PR to main. Both trusted maintainers may merge after required checks pass; zero required human approvals, no Jeremy/owner-only gate.
- Pixl source pin is `8141b992e92e05583246fd914c63a101100f6fe4`; keep MIT attribution. Reference checkouts remain unchanged. YSWS Template/Stardance stay reference-only.
- Canonical tracks: Tools, Systems, Compute, Hardware. Research Mode is a modifier. Bolts global; Track XP per-track and non-spendable; 15 lifetime levels. Quality: Originality, Technical Depth, Execution, Documentation.
- User-confirmed RSVP URL: **https://rsvp.soon.it/loadout**. Its page is a draft-program RSVP and routes users through its own login. No agent test submits a form, authenticates, or enrolls anyone.
- Preserve fullscreen normal-flow hero, grid paper, pixel type, authored yellow lightning currency SVG, dark track containers and technical identity. Pixl has no pinned hero/scroll zoom in the audited source.
- No made-up dates, eligibility, inventory, prices, percentages, payout rates, live participant stats, endorsements, or login/rules/privacy/contact destinations. Keep preview noindex and sitemap empty while origin/indexing permission remain unset.
- Public homepage only. No participant/admin app, auth backend, tracker integration, economy/review/shop/fulfillment migration.

## Review focus and owning verification

1. RSVP config absent vs explicit empty/invalid override: intentional fallback rather than a dead or unsafe URL — Task1 unit/browser checks.
2. Long selected headline, small/landscape viewports, fixed nav and bottom cue: no clipping/overlap; hero can grow above one viewport — Task2/3 layout checks.
3. Horizontal clouds: X changes, animated Y stays zero; no page overflow or content interception — Task3 motion checks.
4. SSR/hydration, live reduced-motion changes, JS unavailable: essential content stays visible; zero-initialized springs remain stable — Task2/3 regression checks.
5. Missing live programme/policy/catalogue data: draft RSVP does not imply accepted launch/stock/eligibility; footer actions exist only with verified destinations — Task4 content/link audit.

## Required skill workflow

| Skill | Concrete use |
|---|---|
| frontend-design | Keep the field-manual composition and hierarchy; measure the new headline before sizing it; use the proposed palette consistently. |
| frontend-design-ui-ux | Use the proposal's flows/states/component contracts; synchronize its approved changes to the design lock at implementation; hand off engineering without inventing a different aesthetic. |
| design-taste-frontend | Audit the incumbent page first; preserve the user-pinned grids/type/paper; eliminate interchangeable marketing copy and decoration that hides content. |
| impeccable — both requested installations | Read both manifests as guidance; primary launcher is `.agents/skills/impeccable`, secondary `.codex/skills/impeccable`. Keep `buildPath: code`. Context was already loaded in this thread; do not rerun/ask the build-path question. One final detector pass; the explicitly requested grid is an intentional exception. |
| emilkowal-animations | One transform owner, correct entrance/hover timing, stable hit areas, clean interruption, and static reduced-motion state. |
| svg-design | Author the double downward chevron; migrate Bolt/brand/icon colours coherently; keep standalone SVG files self-contained and decorative SVGs aria-hidden. |
| pixel-art-sprites | Crisp stepped cloud silhouettes, restrained neutral palette, consistent icon visual weight; no imagegen/raster-photo imitation. |
| Pixel Art Animator | Apply deliberate loop/timing rules to the arrow and inner cloud drift. Existing SVG/CSS is sufficient; no Aseprite install or sprite-sheet pipeline is needed for these vector effects. |

Impeccable review is bounded: build fully, inspect desktop/mobile together, fix the findings in one batch, confirm once. Existing user instructions and reference composition outrank generic heuristic bans.

## Source parity decision

Detailed source paths/recipes/dispositions are in `PIXL_MOTION_PARITY.md`. Keep/adapt fullscreen flow, staged hero entrance, Lenis, nav direction behavior, viewport reveals, hover/press feedback, FAQ transitions and the bottom scroll cue. The shop/sidequest marquee, map dragging, video playback, countdown, particle celebration, secret iframe and source crew are reference-only/ignored for the reasons in that audit. This plan does not claim that every Pixl effect is already present or appropriate for LOADOUT.

## File responsibility map

Paths below are relative to `loadout/` unless prefixed `PLAN/` or workspace-root.

| File | Responsibility |
|---|---|
| `apps/landing/app/site-config.ts`, `.env.example`, `app/site-config.test.ts` | Verified RSVP default, optional overrides, HTTPS guard and preview metadata. |
| `app/site-content.ts` | Central headline/support/metadata copy, process/FAQ explanation data. |
| `app/_components/LoadoutHero.tsx`, new `ScrollCue.tsx`, `icons/LoadoutIcon.tsx`, new `public/loadout/scroll-down.svg` | Source-inspired entrance and an accessible downward cue; hero CTA pair. |
| `app/_components/SiteNav.tsx`, `SmoothScroll.tsx`, `Reveal.tsx` | Existing nav/scroll safety plus source timings and optional child stagger. |
| `app/_components/PaperScenery.tsx`, `public/loadout/cloud-*.svg` | Horizontal-only parallax and larger/more subdued scenery. |
| `app/loadout.css`, `icons/LoadoutIcon.tsx`, `public/loadout/bolt.svg`, `app/icon.svg`, `public/loadout/cloud-*.svg`, `skyline.svg` | Muted theme and SVG literals; consolidate affected rules rather than stack extra overrides. |
| `HomepageSections.tsx`, new `DigitalPhysicalLoadout.tsx`, new `FinalCTA.tsx`, `SiteFooter.tsx`, `app/page.tsx` | Bounded missing content and closing action; keep existing grids. |
| `e2e/homepage.spec.ts`, `scripts/capture-homepage.mjs` | Behavioral regressions and reference/viewport captures. |
| Workspace `LOADOUT_DESIGN_SYSTEM.md`, PLAN/03/06/09; `.ulpi/design/*`, source-audit docs, README | Synchronize approved copy/theme/motion and verified evidence during execution. |

## Task0 — Preserve the baseline and make commits reviewable

Current Git evidence: the app, manifests, lockfile, design docs and newer audits are still untracked; other bootstrap docs/CI are dirty. Incremental commits cannot truthfully isolate new modifications to files that have never been committed.

- [ ] Inspect status/diff/untracked paths again. Keep current branch per the user's preference.
- [ ] Preserve the reviewed current homepage/bootstrap as explicitly grouped baseline commits before refinement commits. Stage only reviewed paths; never `git add .`. Keep the new proposal/audit/plan documentation distinguishable from the prior verified UI.
- [ ] Do not push or promote as a side effect. Remote CI/protections/CodeScene and publication are separate verified steps, with existing authorization checked at that time.

## Task1 — RSVP and selected headline

**Files:** `site-config.ts`, `site-content.ts`, `.env.example`, `site-config.test.ts`, `LoadoutHero.tsx`, `SiteNav.tsx`, `SiteFooter.tsx`, `e2e/homepage.spec.ts`.

**Interfaces:** Keep `createSiteConfig(inputs: PublicSiteInputs = {})`. Add/export `DEFAULT_RSVP_URL = "https://rsvp.soon.it/loadout"`; keep existing `joinUrl` as the navigation destination interface. Undefined override uses the verified default; explicit empty/invalid override yields undefined. Keep site origin/indexing opt-in independent. Export `heroCopy: { headlineLines: readonly string[]; tagline: string; support: string }` from `site-content.ts`.

- [ ] Write configuration assertions: default destination is exactly the confirmed URL; `joinUrl:""` disables it; `javascript:...`, HTTP, or credential-bearing URL disables it; an HTTPS override works. Unset origin/indexing still means noindex.
- [ ] Run `bun run test` and observe the new default/override cases fail before changing configuration.
- [ ] Implement that contract. Document the public URL in `.env.example`; no credentials or private service config.
- [ ] Use the user-selected copy: headline lines **BUILD YOUR OWN / TECHNICAL STACK.**, tagline **Build your own technical stack.**, support from the design proposal. Update metadata title/OG and footer identity consistently; h1 accessible name is the normal sentence-case tagline. Do not ask the slogan-selection question again.
- [ ] Active hero/nav labels: **RSVP now**; hero secondary **Explore tracks**. Explicit disabled destination: primary Explore tracks and secondary What counts; Login remains configured-only.
- [ ] Browser assertions: nav/hero href equals the supplied RSVP URL, label says RSVP not account enrollment, h1/metadata contain selected copy, all secondary anchors resolve. Remote form navigation is intercepted/asserted, never submitted.
- [ ] Re-run the focused checks. Commit proposal: `feat: connect LOADOUT RSVP and sharpen homepage identity`.

## Task2 — Actual Pixl hero behavior and continue cue

**Files:** `LoadoutHero.tsx`, new `ScrollCue.tsx`, `icons/LoadoutIcon.tsx`, new `public/loadout/scroll-down.svg`, `loadout.css`, `SiteNav.tsx`, `SmoothScroll.tsx`, `Reveal.tsx`, `HomepageSections.tsx`, `e2e/homepage.spec.ts`.

**Interfaces:** `ScrollCue({ targetId = "about" }: { targetId?: string })` renders a normal anchor with an authored decorative chevron, stable ≥44px target and visible text. Add `down` to `IconName`. `Reveal` keeps `{ children: React.ReactNode; className?: string; delay?: number }` and adds `stagger?: boolean`; existing calls are unchanged. Stagger mode exposes `data-revealed` and `data-stagger`, defaults to visible during SSR/first hydration, and keeps the parent transform static. Actual card/list elements receive class `reveal-item` and numeric CSS custom property `--reveal-index`; child opacity/individual `translate` entrances use index×.1s. Existing hover `transform` stays independent; no div wrapper is inserted between ol and li.

- [ ] Add checks for a **Continue scrolling** link to `#about`, keyboard activation/destination focus, natural hero scroll-away, full first viewport, no headline/action/cue overlap at320/390/768/1440 and short landscape. Source has no pin/scroll snap/scroll zoom.
- [ ] Implement the source choreography: title .8s/delay.2, y−80→0 and scale.85→1; badge .8s/delay.45, y−20→0; support/actions .9s/delay.7, y32→0; ease [.22,1,.36,1]. Use CSS entrances that complete without JS, or equivalent verified fail-open wrappers. Remove existing competing h1/span entrance rules and redundant Framer transform owners.
- [ ] Cue fades in after1.4s over.8s. Animate SVG y[0,7,0] over1.4s easeInOut, with static reduced-motion fallback. Stable link wrapper does not move; pause the arrow on hover/focus. Follow current section-heading focus behavior without fighting Lenis.
- [ ] Reserve ≥104px bottom padding for the cue; allow natural hero growth on short screens. Collapse side labels/fragments before they intersect content.
- [ ] Adapt hero CTA hover1.03/press.97 and existing hard-shadow feedback through a single transform owner. Use source nav threshold120px and300ms while retaining its4px deadzone and LOADOUT's focus/open-menu exceptions.
- [ ] Keep Lenis1.1s/−90 offset and cleanup/live preference handling. Verify wheel/touch/keyboard, anchors and browser history; repair URL/history behavior only if the audit test exposes a real defect.
- [ ] Add .1s child reveal stagger selectively; preserve DOM order/readability. Adapt FAQ .35s height and .25s chevron, muted hover/press feedback and current ARIA/buttons. No hover-only essential text.
- [ ] Test animation-disabled and JS-disabled content, preference switching and console/page hydration errors. Commit proposal: `feat: adapt Pixl hero motion and add scroll guidance`.

## Task3 — Greyer palette and horizontal clouds

**Files:** `loadout.css`, `PaperScenery.tsx`, icon/standalone SVG files from the map, design-system documents; `e2e/homepage.spec.ts`.

**Interfaces:** Keep `ScrollCloud({ top, side, variant, index })` and per-cloud viewport progress. Keep displayX initialized to0 on server/client and preference-dependent subscriptions after hydration. Remove targetY/displayY and their subscriptions. Animated transform is X-only.

- [ ] Change the cloud regression to assert m41 changes by>8px on scroll and m42 remains0 before/after. The current diagonal implementation must fail the Y assertion.
- [ ] Apply the proposed palette table, including literal SVG/status/hover colors, selection/focus, and standalone Bolt/brand assets. Keep them self-contained; preserve the lighting glyph and separate brand mark. Check every text/icon/control pair, not only the four calculated sample contrasts.
- [ ] Update existing CSS rules in place: cloud desktop `clamp(200px,26vw,420px)`, mobile220px; opacity approximately.55/.4; left/right clipping keeps scenery behind content and pointer-events:none. Use opaque card surfaces wherever large clouds pass behind copy.
- [ ] X mapping left−72→72/right72→−72px, mobile±36px. Preserve spring90/26/.4 and clean subscriptions, CSS-only inner horizontal drift, and immediate static reduced-motion behavior. Document-position Y naturally follows the page; animated Y is0.
- [ ] Verify both initial motion preferences and live switches, resizing, no horizontal page overflow, no cloud interception, and no repeated render/RAF leak. Test normal-mode X motion and reduced-mode no transform/drift.
- [ ] Synchronize approved palette/cloud rules to the canonical visual docs at execution. Commit proposal: `style: mute LOADOUT palette and make cloud parallax horizontal`.

## Task4 — Bounded homepage completeness

**Files:** `site-content.ts`, `HomepageSections.tsx`, new `DigitalPhysicalLoadout.tsx`, new `FinalCTA.tsx`, `page.tsx`, `SiteFooter.tsx`, `loadout.css`, `e2e/homepage.spec.ts`.

**Interfaces:** `DigitalPhysicalLoadout()` is a static, compact two-part explainer below About. `FinalCTA()` reads the shared site configuration and appears after FAQ/before footer. Neither fetches participant/catalogue data.

- [ ] Add the Digital/Physical explanation: accepted shipped artifacts remain part of the builder's technical stack; rewards improve equipment for the next build. Explain lifetime Track XP vs global spendable Bolts with text labels, not color alone. No invented participant profile/levels/projects.
- [ ] Strengthen fit copy with capability statements and canonical renderer/netcode, inference/GPU-backend and local-first sync examples. Label them project-type examples rather than real participant ships.
- [ ] Process/FAQ: planned Hackatime for coding, Lapse for eligible hardware/non-code, attributable journals/evidence; multi-track ships have reviewer-assigned final XP allocation; Research requires reproducible technical outputs.
- [ ] Add AI guidance at the approved high level: declare assistance, show authorship/understanding and original work. Record the draft40% limit as a pre-launch confirmation item; don't present a tunable draft threshold as a final live rule.
- [ ] Add canonical Requisition milestones LV.3/6/9/12/15 and the concise one-use/non-expiring/one-per-order/no-Mastery-bypass concept. Keep Custom Orders conditional on fit, budget, region and fulfillment.
- [ ] Add “How do I RSVP?” describing the external draft-interest form. Add a closing **Equip your next build.** block with shared RSVP action (or working section fallback). No calendar or eligibility promise.
- [ ] Add neutral Pixl engineering attribution with its upstream repository URL and retained notices. Rules/privacy/contact/terms links require owner-provided verified destinations; list them as manual setup items rather than adding dead placeholder links. Real project proof/catalogue/login remain deferred/configured-only.
- [ ] Content/link audit verifies four track cards, separate Research Mode, these explanations, closing CTA and no fake numbers/examples/destinations. Commit proposal: `content: complete LOADOUT program explanations and closing RSVP`.

## Task5 — Verify, document and hand off

- [ ] Run root `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`, `bun run test:e2e`; build/browser checks must use the final source. Keep existing CI jobs and lane contract; do not invent remote successes.
- [ ] Include normal/reduced motion, hydration, live preference changes, fullscreen/short-height/mobile reflow, cue keyboard behavior/focus, X-only clouds, hover/press/FAQ, safe RSVP defaults/overrides, noindex, and axe serious/critical checks.
- [ ] Capture at1659×948 reference,1440×900 and390×844; inspect tablet/landscape behavior. Compare composition/type/spacing/motion separately from product truth. One combined review, one fix batch, at most one confirmation capture.
- [ ] Run the Impeccable detector once and resolve genuine findings; retain the explicitly requested grid/pixel/reference containers. Manually confirm muted colors/focus/target size and document the detector's intentional exceptions.
- [ ] Update README, source/motion/asset audits, active design lock and public plan with measured results. Inventory code/assets for Pixl services, unsupported claims and secrets. Keep all three source refs clean/pinned.
- [ ] Record remaining owner-provided policy/contact/dates/catalogue destinations. Publication/PR/promotions follow the existing branch workflow and actual credentials/required checks; no remote writes merely because this plan exists.

## Definition of done for the future implementation

All seven requested changes are visible/verified; Pixl parity/dispositions are honest; RSVP actions point to the confirmed program landing URL; selected slogan/metadata agree; the paper/accents are greyer and muted; fullscreen hero/cue are readable and keyboard usable; clouds are larger with X-only scroll movement; canonical missing explanations are present; unknown program facts remain data-gated; normal/reduced/no-JS states and hydration pass; source/license boundaries and independent-maintainer workflow remain intact.

## Planning self-review

Scope coverage: RSVP→Task1; slogan→Task1; Pixl behavior/cue→Task2; palette/cloud size/horizontal motion→Task3; missing content→Task4; skills/verification/history→Tasks0/5. Contracts retain existing joinUrl/Reveal/ScrollCloud interfaces where useful. Unknown policy/destination values are explicit setup inputs, not vague invented implementation. Product code is untouched by this planning pass.
