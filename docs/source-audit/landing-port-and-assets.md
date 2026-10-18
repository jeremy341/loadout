# Landing port, assets, and motion record

This is the implementation record for LOADOUT's public landing site. The audit records the pinned Pixl baseline and how the resulting LOADOUT site adapted its composition, assets, and motion. The dated sections below are historical snapshots; the active PNG sprite set and current scenery paths are listed in the [asset catalog](../design/asset-catalog.md), and current behavior comes from the application code. Licensing and attribution live in [source bases](source-bases.md) and [attribution](ATTRIBUTION.md).

Currency and implementation descriptions in the dated snapshots below are historical records. They may use the former name Bolts; current program currency is Ore. The mobile shortcut and color-vision follow-up is documented in `.ulpi/design/mobile-accessibility-color-vision.md`; its implementation is included with the internal-docs update for promotion through the current release lanes.

## Port and implementation evidence

# Public Landing Port Audit

**Source:** Pixl landing app at SHA 8141b992e92e05583246fd914c63a101100f6fe4  
**Status:** Stage A verified; Stage B and the RSVP/motion/content refinement implemented and verified locally.  
**Scope:** Public landing app only. No participant app, admin dashboard, server, RSVP endpoint, or deployment proxy was copied.

## Stage A source mapping

The temporary baseline was created under apps/landing using the pinned Pixl App Router layout, five locales, rendered components, Lenis/Framer Motion behavior, and referenced public assets. Its generated data was isolated as app/_generated/pixl-baseline-config.ts. Stage B removed these source-only files after verification.

Copied/adapted source paths:

- references/pixl/apps/landing/app/[lang]/page.tsx
- references/pixl/apps/landing/app/[lang]/layout.tsx
- references/pixl/apps/landing/app/[lang]/dictionaries.ts and app/[lang]/dictionaries/*.json
- references/pixl/apps/landing/app/_components/* except the unrendered ExampleSubmission.tsx
- references/pixl/apps/landing/app/globals.css
- references/pixl/apps/landing/app/_generated/config.ts → apps/landing/app/_generated/pixl-baseline-config.ts
- references/pixl/apps/landing/app/icon.png and the assets enumerated in landing-port-and-assets.md
- landing package configuration, adjusted to a minimal LOADOUT workspace

The app-specific README and this audit mark the surface as temporary/local-only. The root robots route disallows crawling, the sitemap is empty, metadata is noindex, the Next config contains no Pixl rewrites, the Pixl vercel.json is excluded, and /api/rsvp is absent. The locale proxy redirects only the root page and does not copy game-shell path exclusions.

The source's Next 16 development server rewrote its tracked references/pixl/apps/landing/AGENTS.md with a generated version block. That generated change was restored; the submodule is clean at its pinned SHA.

## Navigation and footer link audit

Live links were checked on 2026-10-04. Stage A only keeps verified outbound actions needed to represent the source page locally. Unverified source actions are shown as plain copy or omitted. Stage B must replace source-specific links with verified LOADOUT destinations or omit them.

| Source path / link | Stage A decision | Verification / Stage B decision |
|---|---|---|
| app/_components/Menu.tsx → /docs | Repoint to the direct Pixl docs URL; no LOADOUT proxy. | Replace with LOADOUT docs if published; otherwise omit. |
| app/_components/Hero.tsx → /play and /dashboard | Keep as verified direct outbound Pixl links in the local-only baseline. | Remove; LOADOUT has no equivalent route yet. |
| app/_components/Footer.tsx → Hack Club home, Code of Conduct, philosophy, team, brand, philanthropy | Keep as separate, neutral Hack Club resource links. | Keep only relevant current resources; do not imply Hack Club acceptance or sponsorship. |
| app/_components/Footer.tsx → Slack, events, workshops | Keep verified official community/resource links. | Keep selectively with neutral labels. |
| app/_components/Footer.tsx → Summer of Making | Keep as source-baseline copy/link only; the current page says the 2025 event has ended. | Remove as Pixl-specific and outdated. |
| app/_components/Footer.tsx → YouTube video and losangeles.hackclub.com | Remove click targets; the available browser lookup could not verify these destinations. Keep source wording only in this local baseline. | Remove. |
| app/_components/FAQ.tsx → Google Docs FAQ | Remove the click target; the document was not verifiable with the available browser connector. | Replace with owned LOADOUT rules/docs when available, otherwise omit. |
| app/_components/Footer.tsx → github.com/Pixl-YSWS/pixl | Keep as a source-only link; the repository is archived and read-only. | Repoint to the LOADOUT repository when configured. |
| RSVP/login/schedule | No Pixl RSVP endpoint is copied. Stage A retains only source outbound login/game links and contains no registration form. | Show only with confirmed LOADOUT destinations and public program details. |

## Stage A verification evidence

- Pixl source and LOADOUT baseline were captured at the same 1440×900 desktop and 390×844 mobile viewports; screenshots are retained as local review artifacts in .impeccable/review/ and are not committed as LOADOUT assets.
- The visible page structure, copy, component order, and source motion were visually compared. The copied rendering matched the pinned source. The local environment could not load the two Hack Club CDN instruction videos; both source and port otherwise rendered the same poster/fallback surface.
- The source expects public/step-4.mp4 and public/step-5.mp4 but those files are absent. Both cards are already marked “coming soon”; the temporary port suppresses requests for the absent files without changing their visible fallback.
- The Stage A Playwright suite passes all 11 tests: five locale routes, Accept-Language redirect, invalid-locale 404, absent `/api/rsvp`, noindex/robots, working local section anchors, and no requests for the missing coming-soon videos.
- `bun run lint`, `bun run typecheck`, and `bun run build` pass. Lint reports seven upstream source warnings for raw image elements and the generated reference config; there are no lint errors.
- Hosted CI remains repository-integrity-only: it checks whitespace and verifies submodule URLs and pins. It does not currently install or build the landing workspace.
- Initial dependency installation was blocked by the default sandbox proxy; an approved install completed. No GitHub publication was performed as part of this UI work.

## Stage B boundary

The user explicitly authorized Stage B UI work after switching the model. The final page removes Pixl copy, game/lore/region content, project/reward imagery, external Pixl links, locale dictionaries, source configuration, and unused components. The upstream checkouts remain unchanged.

## Stage B source/target decisions

| Exact pinned Pixl source | Decision | Final LOADOUT target |
|---|---|---|
| `apps/landing/app/[lang]/page.tsx` and component composition | ADAPT | `app/page.tsx` composes the hero, homepage sections, and footer inside the same landing application. |
| `apps/landing/app/_components/SmoothScroll.tsx` | ADAPT | `app/_components/SmoothScroll.tsx` retains Lenis/RAF and resize handling; adds cancellation, anchor offsets, and live reduced-motion preference handling. |
| `apps/landing/app/_components/Menu.tsx` scroll-direction hook | ADAPT | `SiteNav.tsx` retains the 4px deadzone and scroll-direction behavior; adds desktop/mobile navigation, focus preservation, and Escape handling. |
| `apps/landing/app/_components/Flow.tsx`, `MainContent.tsx`, `FAQ.tsx` motion/container patterns | ADAPT | `Reveal.tsx` and `HomepageSections.tsx` use Framer Motion viewport entrances and FAQ height transitions in LOADOUT section/grid containers. Content stays visible without motion. |
| `apps/landing/app/[lang]/layout.tsx`, metadata and fonts | REIMPLEMENT | English root layout, self-hosted fonts, LOADOUT metadata, HTTPS URL configuration, and preview noindex/empty sitemap. |
| `apps/landing/app/globals.css`, source media, locale config, lore sections | IGNORE | Replaced by `loadout.css`, owned SVGs, and canonical LOADOUT content. Temporary Stage A assets removed. |
| Pixl proxy/rewrites, RSVP route, server/game code | IGNORE | Absent from the LOADOUT application. |

The final reference is `codex-clipboard-6ecd3256-5ec8-4580-a85b-8105eafacdd8.png`. Its visual order and containers guide the composition; canonical LOADOUT facts govern the copy. Numeric mock prices/discounts/hour payouts are replaced by planned category and work/review/Bolt explanations. Levels illustrate checkpoints within the canonical 15-level range, with editorial captions rather than invented rank/benefit names.

## Stage B motion and visual review

- Lenis anchor scrolling; scroll-direction nav; one hero entrance sequence; once-only section reveals with item stagger; card hover feedback; FAQ transitions; enlarged clouds with horizontal-only scroll parallax (bounded to ±72px desktop and ±36px mobile), plus horizontal inner-layer drift at 36 seconds in eight steps. Animated Y remains zero.
- Reduced motion disables Lenis, drift, entrances, and movement; content and controls remain available. Mobile navigation exposes a landmark and moves focus to the selected section heading.
- Desktop and mobile captures are stored under `.impeccable/review/final/`; screenshot comparison preserves the framed hero, paper grid, cloud edges, outlined containers, dark track cards, progression, rewards, FAQ, and skyline/footer rhythm.
- The Impeccable detector reports one advisory for the grid background. The user explicitly required the paper grid, so it is retained.
- CI definitions now include `Landing quality` and `Landing browser`; GitHub execution and protection selection remain unverified until publication.

## Final local verification — 2026-10-05

- Production build, TypeScript check, and ESLint pass; lint has zero warnings/errors.
- Four configuration unit tests pass, covering the confirmed RSVP default, explicit disabled/unsafe overrides, and opt-in indexing.
- All 24 Playwright cases pass against the production preview using two workers: canonical content/anchors, RSVP and preview metadata, fullscreen desktop/mobile hero, 320/390/768/1440 reflow, keyboard FAQ, mobile navigation landmark/focus and 44px targets, nav scroll direction, reduced motion, horizontal cloud parallax, consistent scenery hydration, keyboard/touch/anchor/history scrolling, JS-disabled content and FAQ, short landscape, card hover, and desktop/mobile accessibility.
- The desktop headline occupies exactly two lines without clipping at 1280×800, 1440×900, 1659×948 and 1920×1080 after fonts load. The desktop hero frame is widened to 900px above 1100px, with each explicit headline span kept on one line. Side labels are hidden at 1101–1300px to protect the widened title. Mobile wrapping remains responsive.
- Automated accessibility review finds no serious or critical issues; this is bounded evidence, not a claim of full WCAG certification.
- All three references remain clean at their documented commits. Source-only domains and service coupling are absent from the application and generated page output.
- The local production preview runs at port 3000. The homepage baseline and refinement are recorded in focused local commits for integration into local `development`; hosted CI, remote promotion, protections, and CodeScene activation remain separate verification/setup steps.

Hero refinement verification: the exact 1659×948 reference viewport and mobile first screen were reviewed. The yellow lightning currency SVG is distinct from the brand mark. Cloud display springs initialize at zero on both server and client; preference-dependent activation happens after hydration, avoiding the reduced-motion attribute mismatch found during development.

The final capture set is `.impeccable/review/final/desktop.png`, `desktop-viewport.png`, `mobile.png`, `mobile-viewport.png`, and `hero-reference.png`. These local review artifacts are ignored by Git. The detector's sole grid-background advisory is retained as an intentional user-requested design choice. Privacy/contact/rules URLs, dates, eligibility, and the live catalogue remain owner-provided setup inputs.


## Plan 12 homepage refinement — 2026-10-05

The earlier verification sections above apply to the previous homepage revision, not this new local diff. No automated tests were run or edited in this refinement.

| Pinned Pixl source at 8141b992e92e05583246fd914c63a101100f6fe4 | Classification | Current LOADOUT target |
|---|---|---|
| apps/landing/app/_components/Flow.tsx: Node, MiniCard | ADAPT | HowItWorks.tsx and homepage-refinement.css central framed nodes, readable padding, hard-shadow feedback. |
| Flow.tsx: Down, Fork, ArrowHead, FlowDiagram | ADAPT | Six semantic ordered actions, crisp central downward connectors, parallel Bolts/Track XP results nested under review, and mobile stacking. |
| Flow.tsx: LADDER, generated config, media | IGNORE | No Pixl currency, chapter/reward policy, videos, rates, or progress-fill values. |
| apps/landing/app/_components/Footer.tsx | ADAPT | SiteFooter.tsx and larger five/two/one-column footer rhythm, ordinary grouped links. Source identity/copy not reused. |
| Description.tsx, Story.tsx | REFERENCE ONLY | Layout/hierarchy context; no source crew, story, launch countdown, or copied media. |
| SmoothScroll.tsx, Menu.tsx | REFERENCE ONLY | Preserve the existing audited adapters; no new scrolling/navigation integration. |
| LOADOUT Bolt/star/ticket/LevelBadge SVG geometry | REIMPLEMENT | Authored stepped integer-grid family; no third-party artwork copied. |

Pixl's MIT notice and all reference repository pins are retained. YSWS Template/Stardance remain reference-only for this public UI work; no Rails code or specialist scoring policy was introduced.

Implemented: clearer program/track/review copy; lifetime progression and five Requisition milestones; Community Eras and separate Season distinction; pricing/Requisition/Custom Order explanation; removal of redundant review/award rows; wider vertical spacing and 16px essential text; larger footer; larger clouds with farther X-only motion. The hero headline, fullscreen behavior, RSVP URL, Lenis/navigation/FAQ baseline, and backend scope remain unchanged.

ESLint, TypeScript, and production build pass through the host runner. Manual responsive/browser inspection is pending because the old error tab was rejected by browser URL policy; a replacement preview opening was requested. This is local, uncommitted work on feature/homepage-clarity-flow-eras. No publication or pipeline completion is claimed.


### Copy clarification follow-up

The user approved the visual result and requested a plain-language rewrite. The new brief is .ulpi/design/homepage-copy-clarity.md. The reopened browser resolves the earlier error-tab blocker. The current wording was manually inspected at desktop and 390/320px mobile, including the Requisition example and expanded Custom Order FAQ; no horizontal page overflow was observed. No styles, assets, motion, routes, or source reuse decisions changed in the copy follow-up. Automated tests, lint/typecheck/build suites, CI, and publication were not run for the string-only revision; previous build evidence applies to the preceding code revision.


## Asset inventory and rights

# Pixl Landing Asset Audit

Historical Stage A source: `references/pixl/apps/landing/public` at Pixl SHA `8141b992e92e05583246fd914c63a101100f6fe4`. No per-file asset license manifest was found. Stage A copied 69 existing public assets for local comparison; all 69 were removed in Stage B. `step-4.mp4` and `step-5.mp4` were absent from the source and were never copied. The Pixl MIT notice remains preserved.

## Current LOADOUT assets

- Current homepage icons: 38 independent transparent 32×32 SVGs from the 2026-10-05 sprite design sheet in `apps/landing/public/loadout/icons/`, wired through `LoadoutIcon.tsx` and `LevelBadge.tsx`. The nut logo, wordmark, lockup, and `app/icon.svg` favicon remain unchanged. The three moving scene-cloud SVGs remain unchanged. The old public URLs `loadout/bolt.svg`, `scroll-down.svg`, `skyline.svg`, and `slashes.svg` are kept and now use sheet-derived art.
- Fonts: `public/fonts/Jersey10-Regular.ttf`, `PixelifySans.ttf`, `IBMPlexMono-Regular.ttf`, and `IBMPlexMono-SemiBold.ttf`. They are self-hosted official Google Fonts files under SIL Open Font License 1.1; the family-specific OFL notices are included beside them. Sources: [Jersey 10](https://github.com/google/fonts/tree/main/ofl/jersey10), [Pixelify Sans](https://github.com/google/fonts/tree/main/ofl/pixelifysans), [IBM Plex Mono](https://github.com/google/fonts/tree/main/ofl/ibmplexmono).
- The shop uses labeled planned category icons. It contains no copied product photos, invented prices, stock, or fulfillment claims.
- Bolt and XP now use the Bolt and star cells from the sprite design sheet. The earlier user-supplied Bolt SVG remains in the user's Downloads folder and is not the active homepage icon.
- `public/loadout/scroll-down.svg` is preserved as a compatibility asset, redrawn from the sheet's downward-chevron cell. The site icon renderer uses its independent counterpart at `public/loadout/icons/down.svg`.
- The 2026-10-05 refinement uses muted yellow/grey SVG fills consistent with the active design tokens. Clouds size to `clamp(200px, 26vw, 420px)` on desktop and 220px on mobile; their movement is controlled by the component/CSS, not embedded SVG animation. Font files and license notices are unchanged.

## Historical baseline inventory

Paths referenced by the pinned landing route:
- `public/flow-explore.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/flow-join.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/hc-logo.png` — temporary Stage A reference; remove before final LOADOUT page.
- `public/hero-bg-poster.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/og-boot-splash-v4.png` — temporary Stage A reference; remove before final LOADOUT page.
- `public/pixel_currency_gold-removebg-preview.png` — temporary Stage A reference; remove before final LOADOUT page.
- `public/pixel_currency_red-removebg-preview.png` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/a1-mini.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/airpods-max.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/airpods-pro-3.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/api.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/apple-dev.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/art-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/aseprite.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/assets-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/bambu-a1-combo.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/bambu-a1.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/blahaj.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/centauri-carbon.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/cookie-cutter.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/cpu-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/domain-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/ender3-v3.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/esp32.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/food-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/framework-13.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/framework-16.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/furycube.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/gamemaker.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/godot-plush.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/google-play.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/gpu-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/hardware-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/hc-stickers.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/hoodie.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/hosting-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/indie-game.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/ipad-air-m4.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/ipad.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/keyboard-s75-pro.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/mac-mini.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/macbook-air.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/macbook-neo.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/meme-pack.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/monitor-4k.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/music-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/mystery-box.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/nintendo-switch-2.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/nothing-phone.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/pencil-pro.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/pico8.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/pixel-composer.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/poster.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/ram-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/retro-handheld.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/rpi.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/samsung-s24.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/samsung-t7-ssd.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/screwdriver.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/signed-photo.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/soldering-iron.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/sony-ch720n.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/sony-headphones.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/sparkx-i7.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/steam-license.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/tamagotchi.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/wacom.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/step-3.mp4` — temporary Stage A reference; remove before final LOADOUT page.
- `public/step-4.mp4` — no file exists in the pinned source; source code marks this step as coming soon, so keep its fallback and do not invent a video.
- `public/step-5.mp4` — no file exists in the pinned source; source code marks this step as coming soon, so keep its fallback and do not invent a video.
- `public/world-map.webp` — temporary Stage A reference; remove before final LOADOUT page.

The hero and first two instructional videos are loaded from Hack Club CDN URLs in source components rather than copied files. They are temporary Stage A only and must not remain in the final page. Final LOADOUT imagery is limited to authored SVG markers/icons and approved real project or reward assets when those exist.

## Font file checksums

SHA-256 of the vendored files on 2026-10-04:

| File | SHA-256 |
|---|---|
| IBMPlexMono-Regular.ttf | 6a3412f058c7d8dfd9170c41e85ade48e5156ecb89356110ca57a0a27734af46 |
| IBMPlexMono-SemiBold.ttf | d3c38e55c78f5b0f28009fddba4834ec503278936a5986032424c9bd2d23aa46 |
| Jersey10-Regular.ttf | db9cbd091617048a145d249daa2b815fe7083be6ab66ac26626e21a4e01c3e82 |
| PixelifySans.ttf | 9ba86cd010a4de309d263ceff8e8044092c9db7efda869620cb9ff1c4389e8a5 |

Verified upstream Google Fonts commit: 
9710da1eacb3be272583c3224dcb70f9da6eadbb
. All four font files and three OFL notices match that immutable revision byte-for-byte.


## Superseded Plan 12 SVG-art experiment — 2026-10-05

The user later requested hand-drawn icons using the supplied raster reference and superseded that standalone-SVG draft. No icons from that 46-file attempt remain in the empty archive. The site uses the previous vector XP star and the user-supplied Bolt SVG.

Cloud source files are unchanged authored LOADOUT art. Display width increases to clamp(280px,32vw,560px) desktop/260px mobile. Movement stays in component/CSS: X-only ±112/±48px viewport parallax and separate smooth ±12px drift over 48s. Reduced motion disables both. No fonts, source photos, dependencies, or license notices changed.



## User-supplied Bolt and hand-design sprite atlas — 2026-10-05

This section records the intermediate asset state before the later sprite-sheet integration below.

`C:/Users/jerem/Downloads/Bolt_for_Loadout.svg` was copied byte-for-byte to `apps/landing/public/loadout/bolt.svg`; `LoadoutIcon` displays it for Bolts. The prior vector XP star is restored. Cropped PNG icon outputs and the raster favicon experiment were removed. The original `app/icon.svg` favicon is restored.

The user-provided visual reference is preserved at `docs/design/references/2026-10-05/pixel-assets/loadout-pixel-icon-sheet.png`. The AI-generated hand-drawing atlas at `docs/design/references/2026-10-05/loadout-32px-sprite-design-sheet.png` is a 224x192 transparent PNG made of 42 independent logical 32x32 cells in a 7-column, 6-row grid. Its exact cell order is recorded in `docs/design/asset-catalog.md`. The atlas covers website UI icons, Requisition badges, brand/logo/favicon guides, slash art, and skyline tiles. The background clouds are excluded; the small Cloud utility symbol is present. The atlas is a design handoff, not website artwork, and there are no extracted PNG sprites wired into the app.

The previous 46-icon-SVG attempt folder was already empty when checked. No standalone-icons archive is in use.

## Sprite-sheet SVG integration — 2026-10-05

Following the later request to use the sprite sheet for the homepage, its 38 non-logo cells are now independent transparent SVGs. All current icon and level-badge image paths resolve to those vector files; FAQ chevron, slash motif, and skyline are also sheet-derived. The site keeps the existing LOADOUT logo mark and favicon plus all three background clouds. Pixel shapes use crisp-edge SVG geometry. `docs/design/asset-catalog.md` records the cell order and exported files. The user-provided Bolt SVG was not deleted from Downloads; the Bolt shown on the site now follows the sheet's Bolt cell.

## Sprite background cleanup and bottom CTA removal — 2026-10-05

Removed the sheet's pale paper-colored pixels from each icon's art so the SVGs remain transparent when displayed over any surface. The skyline composition is regenerated from the cleaned cells. The redundant bottom RSVP callout is removed; the hero RSVP action and footer remain.


## Motion parity audit

# Pixl / LOADOUT landing motion and content audit

Recorded 2026-10-04 before implementation. The inventory below preserves that planning evidence; the execution record at the end describes the verified 2026-10-05 result.

Pixl pin: `8141b992e92e05583246fd914c63a101100f6fe4`, MIT, clean local checkout at `references/pixl/`. Source paths below are relative to that checkout. LOADOUT paths are relative to its repository root.

## RSVP evidence

User-confirmed URL: https://rsvp.soon.it/loadout. A direct HTTPS GET returned HTTP 200 at the same URL, titled **RSVP for Loadout**. The page describes a draft technical-builder YSWS using the four canonical tracks. Its RSVP anchor leads to `/auth/login?return=/loadout&action=rsvp`. No form was submitted and the auth flow was not tested. The web lookup tool could not fetch this page; the evidence comes from the direct read-only GET.

Use the program landing URL, not the internal auth URL. Label the action **RSVP now**; describe RSVP as expressing interest while program details are finalized. It does not establish a launch date, eligibility, Hack Club acceptance, inventory, or active participant login.

## Motion inventory

| Actual pinned Pixl source/behavior | Current LOADOUT | Proposed decision |
|---|---|---|
| `_components/Hero.tsx`: relative `h-screen` shell, centered content, ordinary document flow | `.hero` is `min-height:100svh`, centered, ordinary flow | ADAPT; keep fullscreen. Pixl does **not** pin its hero or drive hero zoom from scroll. Do not invent those behaviors. |
| `Hero.tsx`: muted looping background video, poster and play retries on interaction; black overlay fades .6→0 over 1.2s | Paper grid and SVG scenery; no video | REFERENCE ONLY. Preserve the paper world and lightweight SVGs; exclude video/autoplay retry logic and dark video curtain. |
| `Hero.tsx`: title opacity 0→1, y −80→0, scale .85→1, duration .8s, delay .2s, ease [.22,1,.36,1] | Two line CSS entrance at .65s, 90ms second-line delay; Framer h1 itself has no meaningful entrance | ADAPT to one orchestrated title entrance using the source recipe; remove competing old span animations. |
| `Hero.tsx`: intro badge y −20→0, .8s, delay .45s; support/actions y32→0, .9s, delay .7s | Badge/support static; action CSS entrance starts .18s | ADAPT the source sequence to the LOADOUT badge/support/action containers. |
| `Hero.tsx`: bottom scroll text fades in after 1.4s (.8s); arrow y[0,7,0], 1.4s easeInOut loop; pointer-events disabled | No continue cue | REIMPLEMENT as an accessible `#about` link with **Continue scrolling** and an authored double downward SVG chevron. Keep the source timing, static reduced-motion fallback, and a stable hit area. |
| `Hero.tsx`: hero links scale1.03 on hover/.97 on press plus hard border feedback | Buttons translate and change hard shadow, no scale | ADAPT bounded hover/press feedback. Transform a wrapper or unify one transform owner; avoid CSS and Framer overwriting one another. |
| `SmoothScroll.tsx`: Lenis default settings, RAF loop, ResizeObserver | Lenis1.1s duration, −90 anchor offset, RAF cleanup, live reduced-motion handling | ADAPT existing wrapper. Keep the cleanup/accessibility improvements. Check wheel/touch/anchors/back-forward; don't claim pixel-identical interpolation to Pixl defaults. |
| `Menu.tsx`: hide on down-scroll beyond120px, show on up-scroll, 4px deadzone, 300ms transition | Same principle, threshold160px, 240ms, preserves focused/open nav | ADAPT source120px/300ms when fitting the existing bar; retain focus/menu exceptions and Escape handling. |
| `Description.tsx`: once-only title/body entrances; cards y32/.6s with .1s child stagger | One `Reveal` per section, y22/.55s; card grids enter together | ADAPT item-level .1s stagger for overview/process/track cards, while text stays fail-open and reduced motion is static. |
| `Flow.tsx`: y20–24/.45s reveals, .45s card transitions, progress fill1.4s | Section reveals, CSS card hover; no source progress meter | ADAPT reveal/feedback language. REFERENCE ONLY for source-specific progress fills; no fake time or progress state. |
| `FAQ.tsx`: item entrance stagger .1s; open height/opacity .35s; chevron rotates90°/.25s; hover x/y−2 and shadow; press returns | Native buttons/ARIA, height .24s, chevron180ms, background-only hover | ADAPT .35s panel and .25s chevron; add restrained row feedback using muted tokens. Preserve keyboard controls/ARIA and independent answers. |
| `Marquee.tsx`: seamless duplicated row, accurate offset measurement, ResizeObserver, hover pause, pointer drag with >5px click suppression and touch-pan-y; Shop75s, Sidequests24s | Static outlined category/track grids | REFERENCE ONLY in this pass. A marquee is not missing scroll infrastructure; adding it changes the approved grid and needs real content/usefulness. Do not port empty reward motion merely to claim complete effect parity. |
| `Description.tsx`: hover-play instructional videos; touch playback | Static process cards | IGNORE media playback until owned instructional footage exists. |
| `Sidequests.tsx`: slide-up card details, hover/tap reveal | Track/project-fit summaries are always readable | REFERENCE ONLY; no essential information hidden behind hover. |
| `Story.tsx`: countdown digits, pulse, launch particle burst | No confirmed dates/countdown | IGNORE date/launch effects. |
| `MapPreview.tsx`: clamped game-map dragging; `EasterEgg.tsx`: Konami-code modal/third-party iframe; `Crew.tsx`: source crew reveal | No game map, secret iframe, or contributor avatars | IGNORE source-specific features and identity. |
| LOADOUT `PaperScenery.tsx`: own SVG clouds with X±24/Y±90 parallax and inner36s stepped drift | Present, but motion is diagonal and size caps at330px/180px mobile | REIMPLEMENT requested larger horizontal-only parallax; this is LOADOUT-owned behavior, not a claim that Pixl has cloud parallax. |

Conclusion: the essential scroll experience is present. Fullscreen behavior is already correct. The source's entrance choreography, continue cue, grid stagger, and some interaction timings are incomplete; several game/media/gallery effects are deliberately excluded. “All Pixl effects copied” would be inaccurate.

## Content coverage against canonical plans/01 and plans/06

| Canonical requirement | Current evidence | Planning treatment |
|---|---|---|
| Clear technical-capability identity and distinct hero slogan | `LoadoutHero.tsx` generic rewards title, canonical tagline underneath | Promote canonical identity to the headline; explain capability and equipment in supporting copy. |
| Join/RSVP action | `site-config.ts` has no default destination; hero/nav use section fallbacks | Add user-confirmed RSVP default and a closing CTA. Keep Login absent without an owned login URL. |
| Four tracks + separate Research Mode | `site-content.ts` / `HomepageSections.tsx` | Preserve. Expand Research Mode with experiment/benchmark/reproduce outputs and reproducible artifacts, not a fifth track. |
| Eligibility/project-fit contrasts | Four fit cards | Add explicit capability-gap statement and concrete conceptual renderer/inference/sync-engine examples from plans/01; no fake shipped projects. |
| Digital vs Physical Loadout / permanent artifacts | Brief overview card and progression note | Add a compact labeled two-part explanation, no fake participant profile/level stats. |
| Work tracking and journals | Short process line; no tracking FAQ | Add planned Hackatime/software, Lapse/hardware/non-code, attributable journals, and evidence explanation. No integration wiring. |
| Global Bolts vs non-spendable lifetime Track XP | Mentioned, but distinction brief | Strengthen the two-concept explanation; include multi-track reviewer allocation in FAQ. No numeric payout formula. |
| Requisition milestones and limitations | Combined general panel/FAQ | Add canonical LV.3/6/9/12/15 as a concise text line and non-expiry/one-per-order/no-mastery-bypass summary. Keep fulfillment conditional. |
| AI policy / multi-track FAQ / how to join | Missing specific answers | Add plain-language FAQ. AI disclosure/authorship is canonical; the draft40% ceiling is tunable before launch and must not become a live public promise without confirmation. |
| Final CTA after FAQ | Missing | Add concise “Equip your next build” closing RSVP block before footer. |
| Real project proof | No published verified LOADOUT examples | Keep deferred; conceptual examples explicitly describe eligible project types. No invented builders/testimonials/metrics. |
| Privacy, terms/eligibility, public rules, contact | No owned destinations; source audit/license documents exist locally | Document owner-provided destinations as setup items. Do not link to uncreated pages or unpublished GitHub paths. Add neutral Pixl engineering attribution using its upstream URL. |
| Program dates/status, live reward inventory, Login | Unconfirmed | Remain absent; RSVP availability doesn't establish them. |

This pass is public marketing only. Account, tracker, review, reward shop, economy, and fulfillment systems remain outside it.

## Implemented result — 2026-10-05

All ADAPT/REIMPLEMENT items in this scope are now present: source-derived hero entrance timing, accessible continue cue, 120px/4px/300ms scroll-direction nav, item-level 0.1s stagger, 0.35s FAQ panel and 0.25s chevron, bounded tactile buttons, and retained Lenis cleanup/focus/reduced-motion handling. The fullscreen hero remains in ordinary document flow; it is not pinned or scroll-zoomed.

The selected headline is BUILD YOUR OWN / TECHNICAL STACK. The desktop frame is 900px wide above 1100px, with two explicit no-wrap title lines; four desktop sizes from 1280 to 1920px pass geometry assertions. Muted grey paper, subdued yellow accents, larger horizontal-only clouds (±72px desktop/±36px mobile), and reduced-motion/no-JS fallbacks implement the user's refinements.

The confirmed RSVP default appears in nav, hero, and closing CTA, with safe explicit disable/override handling. Digital/Physical Loadout, global Bolts/non-spendable Track XP, conceptual project-fit examples, planned tracking/journals, AI disclosure, team/multi-track review, reproducible research and requisition constraints are explained. Unknown owner-provided policy/contact/dates/catalogue inputs remain deferred.

Build, lint, TypeScript, four unit tests and 24 production-browser cases pass. Desktop/mobile axe checks report no serious or critical issues. The intentional paper grid is the Impeccable detector's only advisory. REFERENCE ONLY/IGNORE effects remain excluded as recorded above; this is source-informed motion, not a claim of copying every Pixl effect. All three source checkouts remain clean at their documented pins. See landing-port-and-assets.md for evidence and local capture paths.


## Plan 12 motion amendment — 2026-10-05

The baseline evidence above belongs to the earlier revision. The current local refinement preserves hero/Lenis/nav/FAQ behavior and adds individually revealed vertical process nodes, with a 180ms, 1px hover offset and crisp 4px→5px shadow. Decorative connectors are static. This ADAPT comes from pinned Pixl Flow.tsx's Node/Down/Fork topology; no source-specific progress meter or media was added.

LOADOUT-owned clouds now render up to 560px desktop/260px mobile, using ±112px/±48px viewport-relative X parallax and smooth 48s ±12px inner drift. There is still no vertical parallax and no added cloud count. Reduced motion disables the layers. New rendered evidence is pending the reopened local preview; prior automated test results do not validate this new diff. Automated tests and CI were not touched.
