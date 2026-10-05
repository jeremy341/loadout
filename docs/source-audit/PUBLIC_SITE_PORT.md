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
- references/pixl/apps/landing/app/icon.png and the assets enumerated in PUBLIC_SITE_ASSETS.md
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
