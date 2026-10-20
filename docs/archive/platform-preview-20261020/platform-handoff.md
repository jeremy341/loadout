> **Archived 2026-10-20:** the Pixl-derived participant platform preview was removed from the repository. This record is kept for provenance; current product scope is in [Plan 06](../../../plans/06-public-homepage.md) and [the future-platform proposal](../../../plans/proposals/future-platform-ui.md).

# Platform handoff: what we did and what comes next

**Written:** 2026-10-20, for the next developer (and their agent). **Owner:** jeremy341. **Status:** merged to `development` in PR #134 on 2026-10-20; not deployed.

Read this page first, then [the development workflow](../../development/WORKFLOW.md), [AGENTS.md](../../../AGENTS.md) and [the platform preview guide](platform-preview.md). Everything below is either a confirmed owner decision, a fact you can verify in the repo, or an open question. They are kept apart.

## 1. Where the project stands

- LOADOUT's public site is `apps/landing` (homepage and program-draft Docs). It has no accounts, backend or participant features.
- The platform PR (#134) added `apps/platform`: a Next 16 / React 19 app holding the participant platform shell and a working **preview** of every tab. It runs on sample data saved in the browser (`localStorage`). There is no sign-in, database or API.
- The shell is a port of Pixl's participant shell (MIT) restyled in the LOADOUT design system. The tab list has 23 entries (22 platform pages plus Docs, which links to the landing app).
- Nothing here is deployed. `apps/platform` is not wired to Vercel or a hostname.

## 2. What we were doing (history)

1. **Research and plan (2026-10-19/20).** Compared Pixl, Stardance and Stasis and produced a port/adapt/defer/exclude plan. The draft plans are [the spec](2026-10-19-pixl-shell-platform-design.md) and [the implementation plan](2026-10-19-pixl-shell-platform.md). Product scope is in [plans/proposals/future-platform-ui.md](../../../plans/proposals/future-platform-ui.md).
2. **Owner decisions (2026-10-20).** The owner said they have permission from all reference owners, and that the platform should copy Pixl's participant shell without the game. Recorded in [DECISIONS.md](../../source-audit/DECISIONS.md) and [ATTRIBUTION.md](../../source-audit/ATTRIBUTION.md). The written grants are **not in the repo yet**.
3. **Shell.** `apps/platform` with 23 tabs in four groups: Build, Community, Gear, You.
4. **Working preview.** The owner then asked to replace the "Not available yet" pages with real functions and placeholders. Every tab is now a working feature on labelled sample data. This deliberately overrides the draft plan's "no placeholder pages / no fake values" rule for the preview milestone. Safeguards and the retirement condition are in DECISIONS.md (decision 6).

## 3. What this PR contains

| Area | Where | Notes |
| --- | --- | --- |
| App | `apps/platform/` | Port 3100. `bun run dev:platform` from the repo root. |
| Shell | `apps/platform/components/shell/` | `nav-data.ts` (the 23-tab contract), `shell-nav.tsx` (sidebar, dock, MORE sheet), `top-rail.tsx`, `icons.tsx` (pixel icons), `theme-toggle.tsx`. Adapted from Pixl, notices kept. |
| Shared kit | `apps/platform/lib/`, `components/ui/` | `preview-store.ts` (localStorage state), `ore-ledger.ts`, `notifications.ts`, `sample/builders.ts`, UI primitives. |
| Pages | `apps/platform/components/pages/{build,community-a,community-b,gear,hub}/` | One folder per group, each with `logic/` (pure, unit-tested rules), `summary.ts` (hook other modules read), `SOURCES.md` (what was read, what the plans leave open). `registry.ts` maps slug to page. |
| Tests | `*.test.ts` beside the code | 706 tests (`bun run test:platform`). |
| CI | `.github/workflows/ci.yml` | Platform lint, typecheck, test and build run inside the existing "Landing quality" job. No required-check names changed. |
| Design brief | `.ulpi/design/participant-platform-shell.md` | The required scoped UI brief. |
| Source audit | `docs/source-audit/` | `pixl-platform-port-map.md`, `platform-preview-open-questions.md`, updated ATTRIBUTION and DECISIONS. |

Not in this change: the owner's other local checkouts and review evidence. Ask the owner before relying on those.

## 4. Next direction (owner instruction): redo the site from Pixl

The owner wants the next developer or agent to **redo the site fully**, in three ordered steps. Keep each step a separate, reviewable commit (or PR) so the diff between "faithful copy", "restyled" and "trimmed" is visible.

1. **Copy Pixl's site fully from the local reference code.** Take the whole participant site, not only the shell: `apps/web-shell` (the Next app: shell, dashboard, docs, form) and the participant pages in `apps/game/web/` (`explore`, `ideas`, `projects`, `shop`, `orders`, `collectibles`, `refers`, `calc`, `account`, `journals`, `show-n-tell`, `vault`, `trials`, `quests`, `report`, `timeline`, `hackatime`, plus `pixl.js` and `pixl.css`). Bring the matching `apps/server` capability areas as a reference or as code as needed. Copy first, unchanged, so a reviewer can diff it against the pinned source. Keep the MIT notice.
2. **Restyle it in the LOADOUT theme.** Apply the design system ([design-system.md](../../design/system/design-system.md)): dark graphite and stone-paper themes, Pixelify Sans / Jersey 10 / IBM Plex Mono, square corners, hard shadows, pixel icons, no gradients or glass, 44px targets, focus-visible, reduced motion. Replace Pixl's brand, copy, colours, fonts and images. Follow [ui-skills.md](../../development/ui-skills.md) and write or update the `.ulpi/design/` brief.
3. **Cut and keep features.** Remove everything LOADOUT does not want, keep what the plans want (matrix in section 5), and rebuild the rest on LOADOUT rules (Plans 01, 02, 11, 15, 22). The working preview in this PR is a reference for what the kept features should do, and its rule logic (`logic/` folders) can be reused.

Where the files go is your call. A recommended layout: put the verbatim copy in a new workspace such as `apps/pixl-baseline` that is not deployed, restyle it in place, then move the surviving features into `apps/platform` (or replace the preview pages). If you choose differently, record why in [DECISIONS.md](../../source-audit/DECISIONS.md).

## 5. Keep / cut guide for step 3 (from the plans; confirm with the owner)

| Pixl feature | Decision | Why |
| --- | --- | --- |
| Overview dashboard, Projects, Journals, Explore, Ideas, Show & Tell, Shop, Orders, Collectibles, Referrals, Calculator, Account | **Keep**, rebuild on LOADOUT rules | Selected in `future-platform-ui.md` |
| Open world, map, regions, NPCs, quests/trials as a game, Restoration Energy, Core Vault, back-to-game links, Pixl currencies, Pixels/hour formula | **Cut** | Excluded by the plans |
| `apps/pixorpheus` | **Cut** | AGPL-3.0, separate licence |
| Report | **Cut for now** | No job assigned yet |
| Pixl login/session, token-in-URL, CORS `*`, Pixl production URLs and secrets | **Cut / replace** | Security; LOADOUT needs its own Hack Club identity adapter |
| Staff dashboard (`apps/dashboard`) | **Defer** | Staff tool, not participant UI |
| Daily rolls, raffles, shop suggestions and voting, reposts, starter-project catalog | **Cut / never add** | Excluded by the plans |
| LOADOUT-only additions (Reviews, Missions, Leaderboards, Seasons, Events, Friends, Wishlist, Achievements, Notifications, Profile) | **Keep** from the preview | Not in Pixl; see the preview pages |

## 6. Where the reference code is

- It is a pinned git submodule: `references/pixl`, commit `8141b992e92e05583246fd914c63a101100f6fe4`. Fresh clones and new worktrees do **not** have it checked out. Run `git submodule update --init references/pixl`. Do **not** use `--recursive` (Stardance's nested `secrets` repository is unavailable).
- Stardance (`references/stardance`, missions, peer review) and Stasis (`references/stasis`, events, certificates) are also available for later steps. See [source-bases.md](../../source-audit/source-bases.md) for the pins.
- Never edit files under `references/`. Copy them out.

## 7. Rules that bind you

- **Workflow.** `git fetch origin`, branch from `origin/development` (`feature/...`), PR with squash merge into `development`; promotion to `testing` and `main` is the owner's. See [WORKFLOW.md](../../development/WORKFLOW.md). One branch, one change; fold tweaks into one commit before the first push ([agent-commits.md](../../development/agent-commits.md)).
- **No AI co-author lines** and no "Generated with" footer in commit messages, whatever your tool's default is. PR descriptions may keep a tool footer.
- **Scope post.** Post your scope in `#loadout-development` before starting. The PR author must ask a maintainer if no Slack tool is available; do not claim it was sent.
- **Licences.** Pixl is MIT, "Copyright (c) 2026 Pixl", **except** `apps/pixorpheus` (AGPL-3.0) and third-party or purchased art, product photos, brand assets and fonts (for example Phantom Sans). MIT does not cover those. Keep the notice and record every copied path in the [port map](pixl-platform-port-map.md) and [ATTRIBUTION.md](../../source-audit/ATTRIBUTION.md).
- **Secrets.** Never commit `.env` files, tokens, production URLs or credentials from any reference. Pixl's code points at its production services; none of that transfers.
- **Canonical plans win.** Where a copied Pixl behaviour conflicts with Plans 01, 02, 11, 15 or 22, the plan wins. Public-by-default ships and journals, reviewer-only Lapse recordings, Hackatime for software and Lapse for Hardware, 12 peer reviews on four 1-9 categories, one journal entry per 8 development hours, 1x-20x payout (10x mean, 30x Great Signal), no appeals.
- **Honesty.** Do not present sample or draft values as program facts. Keep "Draft preview rule" labels until a plan settles the rule.
- **UI changes** need the seven skills loaded and a scoped brief in `.ulpi/design/` ([ui-skills.md](../../development/ui-skills.md)). Record only the skills actually loaded.

## 8. Run and verify

```powershell
git fetch origin
git switch -c feature/your-task origin/development
git submodule update --init references/pixl
bun install --frozen-lockfile
bun run dev:platform          # http://localhost:3100
bun run lint:platform
bun run typecheck:platform
bun run test:platform
bun run build:platform
bun run lint; bun run typecheck; bun run test   # landing must stay green
```

Use Bun 1.3.14. Stop any dev server before a production build. For the Docs and Accessibility links set `NEXT_PUBLIC_LANDING_URL` (for example `http://localhost:3000`). Browser checks used so far were one-off Playwright and axe scripts; the repo has no Playwright suite for `apps/platform` yet.

## 9. Known gaps in this PR

- The full Accessibility preferences dialog (reading size, colour-vision palettes, Phantom Sans, grain) is not ported. The shell links to the landing page and shares only the `loadout-theme` key.
- Sample data counts as the user's: the Overview checklist starts at "2 of 4" and achievements show "8 of 22" before any action.
- `useBuildSummary()` settles ship timers whenever it is mounted, so opening Overview can pay out a ship whose time gates passed.
- Notification preferences hide kinds in the inbox only; the shared inbox still stores and counts everything.
- Two draft quest lists exist (Missions in Build, Seasons in Community B). Pick one source of truth.
- Plan 02 words the external-contributor achievement two ways (one-time vs once per project). The preview follows one-time.
- Plan 22 does not publish the percentile-to-multiplier curve. The draft is `1 + 19 x p^(10/9)` in `components/pages/build/logic/constants.ts`.
- Route-change focus management, forced-colours mode and layout at every text size were not checked.
- No browser test for the platform in CI. Browser behaviour was checked by hand-run scripts only.
- Full list of rules the plans leave open: [platform-preview-open-questions.md](platform-preview-open-questions.md).

## 10. Open questions for the owner

1. Where are the written reuse grants (who, when, where)? They must be linked in ATTRIBUTION.md.
2. Does the permission cover Pixl's non-MIT material (AGPL `pixorpheus`, art, photos, brand, fonts)? Until yes, exclude it.
3. What is the production hostname, and does the landing app rewrite to the platform?
4. Which Hack Club sign-in and verification integration will be used, and which database?
5. Does Wishlist stay a new tab (Pixl's Goals/vault is a community goal, not a wishlist)?
6. Has the scope been posted in `#loadout-development`?

## 11. Skills to install before any UI work

[ui-skills.md](../../development/ui-skills.md) requires seven skills for every UI change. The owner's local setup also uses the extras below. Install them on your machine (skill names are portable, absolute paths are not) and record in each PR only the skills you actually loaded. An earlier brief already notes that missing skills were "not installed and not used": do not claim a skill you did not load.

The skills CLI is `npx skills` (package `vercel-labs/skills`). Add `-g` for a global install and `-y` to skip prompts. If a command differs on your version, use the `find-skills` skill or `npx skills add --help`.

| Skill | Required? | Source and install |
| --- | --- | --- |
| `frontend-design-ui-ux` | Required (spec before code) | `npx skills add ulpi-io/skills --skill frontend-design-ui-ux` |
| `frontend-design` | Required | `npx skills add sickn33/antigravity-awesome-skills --skill frontend-design` |
| `design-taste-frontend` | Required | `npx skills add leonxlnx/taste-skill --skill taste-skill` (installed locally under the name `design-taste-frontend`) |
| `emilkowal-animations` | Required | `npx skills add pproenca/dot-skills --skill emilkowal-animations` |
| `svg-design` | Required | `npx skills add tryopendata/skills --skill svg-design` |
| `pixel-art-sprites` | Required | `npx skills add omer-metin/skills-for-antigravity --skill pixel-art-sprites` |
| `Pixel Art Animator` | Required | `npx skills add willibrandon/pixel-plugin --skill pixel-art-animator` |
| `impeccable` | Strongly recommended (design, audit, polish, critique, animate, harden) | `npx skills add devvgwardo/impeccable` |
| `accessibility` | Recommended (WCAG 2.2 audits) | `npx skills add addyosmani/web-quality-skills --skill accessibility` |
| `critique` | Recommended | `npx skills add educlopez/ui-craft --skill critique` |
| `web-design-guidelines` | Recommended | `npx skills add vercel-labs/agent-skills --skill web-design-guidelines` |
| `mobile-responsiveness` | Recommended | `npx skills add hoodini/ai-agents-skills --skill mobile-responsiveness` |
| `frontend-design-review` | Optional | `npx skills add microsoft/skills --skill frontend-design-review` |
| `install-anti-slop` | Optional (lint rules against generic UI) | `npx skills add dmmulroy/anti-slop --skill install-anti-slop` |
| `find-skills` | Optional (helps find or fix installs) | `npx skills add vercel-labs/skills --skill find-skills` |
| `project-frontend`, `project-code-quality` | Owner-local | Not from a public source. Ask the owner for the files, or skip. |

The repository's own design rules always win over any skill: [design-system.md](../../design/system/design-system.md), `.ulpi/design/DESIGN.md` and the plans. A skill improves craft; it never changes product policy.

## 12. Prompt for your agent

Paste everything in the block below into your AI agent.

```text
You are taking over the LOADOUT participant platform (repo jeremy341/loadout). Work in this order and do not skip ahead.

PHASE 0: GATHER CONTEXT (read before you write anything)
Read these completely, in this order, and summarise to me in 10 bullets what you understood:
1. docs/development/platform-handoff.md (this is your brief; section 4 is the instruction)
2. AGENTS.md, docs/development/WORKFLOW.md, docs/development/agent-commits.md, docs/development/ui-skills.md, docs/development/platform-preview.md
3. docs/design/system/design-system.md, LOADOUT_DESIGN_SYSTEM.md, .ulpi/design/DESIGN.md, .ulpi/design/README.md, .ulpi/design/participant-platform-shell.md, PRODUCT.md
4. plans/00-index.md, plans/01-product-and-program.md, plans/02-economy-and-rewards.md, plans/11-eras-and-community-progression.md, plans/15-loadout-irl-ruhr.md, plans/22-peer-review-and-multipliers.md, plans/proposals/future-platform-ui.md
5. docs/source-audit/: DECISIONS.md, ATTRIBUTION.md, source-bases.md, pixl-platform-port-map.md, platform-preview-open-questions.md, reference-architecture.md, reference-comparison.md
6. docs/superpowers/specs/2026-10-19-pixl-shell-platform-design.md and docs/superpowers/plans/2026-10-19-pixl-shell-platform.md
7. The code in apps/platform: components/shell/nav-data.ts, components/shell/*, lib/*, components/ui/*, components/pages/registry.ts, and each components/pages/<group>/SOURCES.md and summary.ts
8. The reference code: run `git submodule update --init references/pixl` (no --recursive), then read references/pixl/README.md, DEVELOPER.md, CLAUDE.md, LICENSE, apps/web-shell/**, apps/game/web/** (pixl.js, pixl.css and every participant page folder), apps/server/src/routes/**, apps/dashboard. Also skim references/stardance (missions, peer review) and references/stasis (events, certificates) only if you need them in step 3.

PHASE 1: INSTALL SKILLS
Install the skills in section 11 of the handoff (at least the seven required ones plus impeccable, accessibility, critique, web-design-guidelines and mobile-responsiveness). Verify each one loads. Tell me which ones failed to install. In every PR, list only the skills you actually loaded.

PHASE 2: ASK ME QUESTIONS BEFORE CODING
Ask me, in one batch, anything the handoff leaves open. At minimum ask:
- Should the verbatim Pixl copy live in a new workspace (for example apps/pixl-baseline, not deployed) and then be merged into apps/platform, or replace apps/platform directly?
- Does the owner's permission cover Pixl's non-MIT material (apps/pixorpheus, art, product photos, brand assets, fonts)? Default if I do not know: exclude all of it.
- Which tabs and features should survive step 3, and which should go? Show me the keep/cut table from section 5 of the handoff and ask me to confirm or change it, tab by tab.
- Hostname and deployment target for the platform, and which identity (Hack Club sign-in) and database to plan for.
- Whether the preview pages in apps/platform should be kept, reused as feature sources, or deleted after the Pixl copy lands.
- Whether the scope has been posted in #loadout-development, and the branch name to use.
Wait for my answers. Do not guess.

PHASE 3: DO THE WORK in three separate, reviewable commits (or PRs, as I decide)
1. COPY: Redo the site fully by copying the Pixl participant site from the local reference code unchanged (apps/web-shell, the participant pages and their code in apps/game/web, and the server areas we agreed on). Keep the MIT notice. Exclude apps/pixorpheus (AGPL), purchased or third-party art, product photos, brand assets, fonts, secrets and .env files unless I say otherwise. Make it build and run locally.
2. RESTYLE: Restyle the whole copy in the LOADOUT theme (docs/design/system/design-system.md): dark graphite and stone-paper themes, Pixelify Sans, Jersey 10, IBM Plex Mono, square corners, hard shadows, pixel icons, no gradients or glass, 44px targets, focus-visible, reduced motion, optional accessibility settings. Remove Pixl branding, copy, colours, fonts and images. Write or update the scoped brief in .ulpi/design/ first (use frontend-design-ui-ux), then implement, then audit with impeccable, accessibility and critique.
3. CUT AND KEEP: Remove the game and everything on the cut list. Keep the features we agreed, rebuilt on the canonical plans (Plans 01, 02, 11, 15, 22). Reuse the tested rule logic in apps/platform/components/pages/*/logic where it fits. Replace Pixl login/session (token in URL, CORS *) with a proper design for Hack Club sign-in; do not invent policy that the plans leave open, and keep "Draft preview rule" labels.

RULES THAT ALWAYS APPLY
- Branch from a fresh origin/development. One change per commit; no AI co-author lines and no "Generated with" footer in commit messages. PR descriptions may keep a footer.
- Record every copied path in docs/source-audit/pixl-platform-port-map.md and ATTRIBUTION.md.
- Never commit secrets, tokens, production URLs or credentials from the references. Never edit files under references/.
- Do not show sample or draft values as program facts. Keep internal docs out of content/docs/.
- Run lint, typecheck, tests and build for apps/platform and apps/landing before every PR, and stop dev servers before building.
- Do not push, open a PR or merge until I approve.
```
