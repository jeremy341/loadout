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

## Content coverage against canonical PLAN/01 and PLAN/06

| Canonical requirement | Current evidence | Planning treatment |
|---|---|---|
| Clear technical-capability identity and distinct hero slogan | `LoadoutHero.tsx` generic rewards title, canonical tagline underneath | Promote canonical identity to the headline; explain capability and equipment in supporting copy. |
| Join/RSVP action | `site-config.ts` has no default destination; hero/nav use section fallbacks | Add user-confirmed RSVP default and a closing CTA. Keep Login absent without an owned login URL. |
| Four tracks + separate Research Mode | `site-content.ts` / `HomepageSections.tsx` | Preserve. Expand Research Mode with experiment/benchmark/reproduce outputs and reproducible artifacts, not a fifth track. |
| Eligibility/project-fit contrasts | Four fit cards | Add explicit capability-gap statement and concrete conceptual renderer/inference/sync-engine examples from PLAN/01; no fake shipped projects. |
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

Build, lint, TypeScript, four unit tests and 24 production-browser cases pass. Desktop/mobile axe checks report no serious or critical issues. The intentional paper grid is the Impeccable detector's only advisory. REFERENCE ONLY/IGNORE effects remain excluded as recorded above; this is source-informed motion, not a claim of copying every Pixl effect. All three source checkouts remain clean at their documented pins. See PUBLIC_SITE_PORT.md for evidence and local capture paths.
