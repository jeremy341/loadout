# UI audit matrix

Source paths below are relative to the source named in each column. Local roots are `references/pixl/`, `references/ysws-template/`, and `references/stardance/`. This matrix is design evidence, not a directive to restore the removed landing page.

The LOADOUT visual owner is PLAN/03; the public homepage follows PLAN/06. Pixl structure is useful evidence, but its identity and lore are not retained.

| Screen | Pixl evidence | YSWS Template evidence | Stardance evidence | LOADOUT decision |
|---|---|---|---|---|
| Public landing | apps/landing/app/[lang]/page.tsx; apps/landing/app/_components/Hero.tsx, Menu.tsx, Description.tsx, FAQ.tsx, Footer.tsx | frontend/src/routes/+page.svelte and +layout.svelte | app/views/home/** and app/views/layouts/** (review-related details only) | REIMPLEMENT as an English LOADOUT page in Next. Preserve semantic sections, SEO capability, and responsive patterns; remove Pixl game/lore, color identity, and proxy routes. |
| Login / auth | apps/server/src/routes/auth.ts; apps/server/src/auth/session.ts; dashboard auth routes | backend/src/auth/auth.service.ts; frontend/src/routes/auth/** | app/controllers/sessions_controller.rb | REFERENCE ONLY in this slice. Future LOADOUT auth requires its own approved flow. |
| Account/settings | apps/server/src/routes/profile.ts; apps/dashboard/app/** profile/account routes | frontend/src/routes/account/** where present | app/views/users/**; app/controllers/users_controller.rb | Defer; no copied settings UI. |
| Participant dashboard | apps/dashboard/app/**; dashboard review/project components | frontend/src/routes/dashboard/** | app/views/my/** and project cards | Defer full dashboard. Preserve small data-led status and empty-state patterns for later. |
| Project creation | apps/dashboard project forms; apps/server/src/routes/projects.ts | frontend/src/routes/projects/** and backend project DTOs | app/views/projects/** | Defer. LOADOUT must add Capability Statement and canonical track/mode selection. |
| Project detail | apps/dashboard project detail components; apps/server/src/routes/projects.ts | frontend/src/routes/projects/** | app/views/projects/_ship_card.html.erb | Defer; LOADOUT owns artifact/version and track-allocation presentation. |
| Journals / devlogs | apps/server/src/routes/journalsPublic.ts and dashboard journal components | frontend/src/routes/devlogs/**; backend/src/devlogs/** | app/models/post/devlog.rb | Defer; retain privacy and evidence-access review. |
| Submission / ship flow | apps/dashboard/app/review/**; apps/server/src/routes/projects.ts | frontend project submission and backend/src/reviews/** where available | app/models/post/ship_event.rb and ship-event tests | Defer; fit, reviewer allocation, rubric, and appeal behavior remain LOADOUT policy. |
| Reviewer / admin dashboard | apps/dashboard/app/review/** and app/_components/ReviewForm.tsx, ReviewTable.tsx, ReviewPipelineSteps.tsx | frontend/src/routes/**/admin and backend review modules | app/controllers/admin/payout_reviews_controller.rb, app/views/admin/payout_reviews/** | Defer. Adapt clear queues and audit trails, not source-specific review policy. |
| Shop | apps/landing/app/_components/Shop.tsx; dashboard shop configurators | frontend/src/routes/shop/** | Stardance shop is outside this narrow audit | Defer. Later explain Bolts and field pricing from LOADOUT config. |
| Orders / fulfillment | Pixl dashboard order/shop routes and server shop integrations | backend/src/shop/shop.service.ts and order entities | Not audited as a Stardance specialist capability | Defer. Avoid displaying item availability or fulfillment promises now. |
| FAQ / docs | apps/landing/app/_components/FAQ.tsx; docs routes | frontend/src/routes/FAQ/** | public guide pages, outside the review-specific scope | ADAPT concise FAQ structure. Use LOADOUT wording and avoid unconfirmed rules/dates. |
| Mobile behavior | apps/landing/app/globals.css, apps/dashboard/hooks/use-mobile.ts | Svelte responsive route/component styles | Rails views and shared responsive layout | REIMPLEMENT responsive collapse with normal CSS; test navigation, grids, heading wrapping, and no horizontal overflow. |
| Empty / loading / error states | dashboard queue, reviews, and shop components | Svelte route loading/error boundaries | review and payout queue states | REFERENCE ONLY; show no fake projects or loading placeholders on the static homepage. |

## Homepage redesign handoff

The initial LOADOUT prototype was removed at the user’s direction before publication. apps/landing is back on the Pixl reference UI while a full redesign is pending. Use PLAN/03 and PLAN/06 when building the replacement; do not treat the restored Pixl routes or identity as LOADOUT product design.

The removed prototype used the planned graphite/orange/steel palette, grid-paper background, pixel headings, index labels, flat borders, and native details/summary controls. It was local and unpublished. The new LOADOUT design should follow PLAN/03 and PLAN/06; no prototype markup or styling remains in the restored landing app.
