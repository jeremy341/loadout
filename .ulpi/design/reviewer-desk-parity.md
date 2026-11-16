# Reviewer desk parity (one track per project, and the Pixl review features we lacked)

**Status:** brief written 15 Nov 2026 on `feature/participant-platform-m1`, before implementation. Sample data only: no review tables, no network calls, no keys. Not reviewed by the owner yet.
**Owner of the rules:** `plans/proposals/platform-roadmap.md` sections 2 (P0) and 5a (P2b); `plans/01-product-and-program.md` sections 4.7, 6.4 and 8; `plans/02-economy-and-rewards.md`.
**Structural reference:** `references/pixl/apps/internal-dashboard` at `1468ba69` (MIT, see `docs/source-audit/DECISIONS.md`). Pixl's look, wording, sounds and art are not used. Rules are rewritten for LOADOUT.
**Binds to:** `.ulpi/design/DESIGN.md`, `docs/design/system/design-system.md`, and the review area in `reviewer-site.md`. This brief supersedes the "drop" rows of `reviewer-site.md` for heartbeat, celebration, AI draft, AI time, other-YSWS check and reviewer perks, as the roadmap's section 5a asks. The shell, the nav model and the tab row are not redesigned.

## Design read

A reviewer's bench in the field manual: ruled rows, square corners, pixel headings, one accent. Evidence on the left, the decision on the right. New parts look like they were always there: they use the existing `rv-` blocks, `rv-callout`, `rv-d-fold`, `rv-kv`, `rv-chip`, `rv-flag`, `rv-quiet`, `rv-lock` and the `--pf-*` tokens. Direction stays "industrial and signage". Counterfactual test: a generic admin table with coloured pills and rounded cards would fail; a ruled inspection sheet with plain words beside every colour passes.

Dials: variance 3, motion 2, density 7. No new colours, fonts, radii or shadows. No gradients, glass, glow, nested cards or equal-card grids.

## What is live and what is a stub

Two honest states, each with one fixed sentence. Never invent a third.

| State | Meaning | Sentence shown once per block (class `rv-lock`) |
| --- | --- | --- |
| **Local** | Works in the page on sample data. State is kept in memory or in this browser's `localStorage`. | "Sample data. Changes stay in this browser and are not sent anywhere." |
| **Stub** | Laid out, control disabled (native `disabled`), no behaviour. | "Opens with the review service. Nothing here is saved." |

No control may look live while doing nothing. No page may say or imply that a ship, hour, Ore, message or deletion is real. Amounts that the owner has not set read "Not set" or carry the word "provisional".

## P0: one track per project

Rule text (use these words): a project has exactly one track. It is picked when the project is created, can be changed while the project is a draft or in "needs changes", and locks on submit. All Track XP from a ship goes to that track. A team ship shares one track. If the work does not fit the track, the reviewer sends it back with the reason "Does not fit the track"; the builder adds more work in that track or changes the track, and ships again.

- **No new verdict.** Verdicts stay approved, needs changes, banned. "Does not fit the track" is a needs-changes reason: the macro `/track` in `REVIEW_MACROS` plus a preset reason chip above the note. A needs-changes decision carrying that reason is what unlocks the track.
- **Model.** `ReviewShip.track: Track` replaces `proposal`. `track` is the first entry of the old proposal. Ship ids are not renumbered. `TrackShare`, `Allocation`, `ALLOCATION_*`, `allocationFromProposal`, `allocationTotal`, `checkAllocation`, `allocationLine`, `formatProposal` and `ReviewDecision.allocation` are removed.
- **Reviewer UI.** `TrackChips` shows one chip (`track` prop). The allocation table in `ReviewForm` is replaced by one read-only line: "Track: Systems. All Track XP from this ship goes to this track. If the work does not fit it, request changes with the reason Does not fit the track." The "Final track allocation" line in a decided ship becomes "Track". Queue rows show one chip, no percent.
- **Platform.** `EditProjectDialog`: under the track select, "The track locks when you submit. You can change it while the project is a draft or after a reviewer asks for changes." On the project page, when the status is past draft, logging and needs-changes, the track shows a `Locked` tag with the title "Locked on submit".
- **States.** Draft or logging: select enabled. Needs changes: select enabled; if the reason was the track, a line says "A reviewer said the work does not fit this track. Add work in this track or pick another." Submitted, in review, approved: select disabled with the locked line.
- **Accept.** No percent of XP, "split", "mix" or "allocation" about tracks remains in `content/docs`, the plans named in the roadmap, or the code. Legitimate percent hits stay: `SplitBar`, `hoursSplit`, `trackedPercent`, `ai.percent`, language percents, `acceptShare`, discount percentages, the Era bonus.

## P2b parity table

"Exists" names the code to extend. Workers build only the "Action" column.

### Queue and claims (area A, prefix `rv-q-`)

| Pixl feature | Exists in ours | Action |
| --- | --- | --- |
| Claim, heartbeat, auto-release (`reviewClaimState`, `ReviewHeartbeat`) | `claimedBy`, `claimedByOther`, status `claimed`, "is reviewing" row tag | Build the rule: opening never claims; a claim lasts 30 min; a heartbeat renews it; 5 min away releases it. `ClaimPanel` on the desk: Local, with a visible countdown. |
| Assignment window (`reviewAssignment`) | `reserved`, `lockFor`, `lockLabel` | Build the 3-day rule as a pure function (assigned on first needs-changes, window starts at re-ship, back to the common queue after 72 h) and the daily sweep as a pure function over fixtures. Row tag "Assigned, 1d 12h left". |
| Queue wait (`queueWait`) | `waitHours` (complete) | Extend only: a label that says why ("since first ship", "since this update"). |
| Queue health (`cron/queue-health`) | none | Pure summary: queue size, oldest wait, aged ships (over 7 days), stuck claims, ships in pre-check. `QueueHealth` strip, owner only. The cron itself is a stub. |
| Live queue (`LiveReview`) | none | `LiveToggle`: Local. On: re-reads the sample queue on a timer and shows "Checked 12s ago". States that no ship can arrive on sample data. Off by default under reduced motion? No: it moves nothing, so it follows only the user's toggle. |
| Keyboard shortcuts (`ReviewShortcuts`) | `DeskNav` prev/next links, tab keys 1 to 9 | `DeskShortcuts`: `[` previous, `]` next, `r` repo, `d` demo, `?` help. Local. Ignored while typing; can be switched off (WCAG 2.1.4); repo and demo are sample addresses, so those keys focus the address instead of opening it. |
| Review hold (migration 0151) | `hold`, hold callouts | Pure rules: who may hold and release, a reason is required. |
| Self-review block (migration 0166) | `isOwnShip`, `canReview` | Add owner-listed exceptions as a pure rule with a fixture list and a reason per exception. |
| Type filter, access | `filterReviewType`, `clampKind` (complete) | Nothing. |

### The verdict (area B, prefix `rv-v-`)

| Pixl feature | Exists in ours | Action |
| --- | --- | --- |
| Per-journal approval (`ReviewForm`) | `JournalAction`, `keptMinutes`, `approvedMinutes`, `JournalList` (read only) | `JournalApproval`: Local. One row per entry with the four actions, minutes kept for "part", a reason when less is kept; a running total that feeds hours to credit. |
| Hour correction (`hourCorrectionPayout`) | "Decrease only" field | Pure rule: a later correction pays or claws back only the difference, once, and never re-credits time that was lowered. `HourCorrection` shows the before, after and difference. |
| Unship and revert (`unship`) | `UNSHIP_WARNINGS`, disabled Actions | Pure rules for what an unship clears per stage and when a revert is allowed; stage-specific warning and a typed confirmation. Local preview of what would be cleared; the action itself is a stub. |
| Draft autosave (migration 0172) | none | `useReviewDraft`: Local, `localStorage` per ship, "Draft kept in this browser, 14:02", Discard draft. |
| Resubmit notice (migration 0207) | Settings checkbox (disabled) | Pure rule for who is told; a callout on a re-shipped ship: "Sent again after your request for changes". The message itself is a stub. |
| Project notes (`ProjectNotes`) | `NotesTab`, `ProjectNote` | `NotesThread`: Local. One accent-safe pattern per author (a letter mark, not only colour), a new note is added in memory, and an image slot that is a stub. |
| Pipeline strip (`ReviewPipelineSteps`) | `pipelineSteps`, `rv-steps` | Polish only: done, current, upcoming are words plus marks; the current step has `aria-current="step"`. |
| Verdict buttons, undo window | disabled buttons | Local: a verdict shows a sample result panel (verdict, hours, Ore, track, who is told) with a 10 s undo. Nothing is recorded. |

### Evidence (area C, prefix `rv-e-`)

| Pixl feature | Exists in ours | Action |
| --- | --- | --- |
| Commits across hosts (`commits`, `concurrency`) | `ReviewCommit`, `CommitTable`, `isCodeDump`, `codedLabel` | Pure parsers for GitHub, Codeberg and Forgejo response shapes, paging and a concurrency cap as pure planning; per-author counts, gaps, bulk dumps. `CommitHistory` over fixtures. No fetch. |
| Repo owner link (`githubRepoOwner`) | none | Strict host and name validator; the link is shown as text. |
| SSRF guard, safe URLs (`ssrfGuard`, `safeUrl`, `urlSafety`) | none | Pure functions with tests: schemes, ports, private and reserved IPs (v4 and v6), redirects, credentials in URLs. `LinkSafety` lists each builder link with its verdict. |
| README (`markdown`) | `Readme`, `ReadmeView` | Word count and the 200-word gate; a safe render plan (no scripts, no raw HTML). |
| Hackatime evidence | `HackatimeProject`, `hoursSplit`, `rv-hoursbar` | Tracked versus journaled bar with words, per-language and per-session lines. |
| Collaborator evidence | `ReviewCollaborator` | Per-member tracked and journaled minutes with the gap. |
| Lapse and BOM (`bom`) | `bomTotals`, `bomGaps`, `hardwareFacts`, `HardwareCard` | Add a BOM check result line per gap. Nothing else. |
| Double dip (`doubleDip`, `DoubleDipBanner`) | none | Pure matcher over fixtures (same repo, same demo, overlapping tracked time) and a loud `DoubleDipBanner` at the top of the desk naming the kind of match. |
| AI-usage check (`fraudy`) | `ai` declaration, `undisclosedAiCommits` | `AiUsagePanel`: cached sample numbers, a "checked 4 min ago" line, and a failure state that renders a quiet line instead of throwing. Stub for the check itself. |
| Pre-check (`precheck`) | none | Pure state machine (queued, running, passed, failed, timed out) with a timeout; a strip on the desk and a count in queue health. |
| Image safety (`imageSniff`) | none | Magic-byte check as a pure function (PNG, JPEG, GIF, WebP; SVG and others refused). |

### Macros and drafts (area D, prefix `rv-m-`)

| Pixl feature | Exists in ours | Action |
| --- | --- | --- |
| Macros (`reviewMacros`) | `REVIEW_MACROS` (3, plus `/track` from P0), listed as text | Pure expand rule with caret offset; `MacroNoteField`: Local, typing a trigger and a space expands it, a chip row inserts one, the preset reason chips set the reason. |
| Macro editor (`ReviewMacroEditor`) | none | `/review/macros`, owner only. Add, edit, delete, reorder, caret marker, preview. Local: kept in memory, reset on reload. |
| AI-drafted note (`aiReview`, `aiDraftBatch`) | none | `DraftNotePanel`: stub. Shows one prepared sample draft, labelled "Draft. Check every word." It never proposes a verdict or hours and never fills the note by itself: the reviewer presses "Use as a starting point". Batch drafting is a disabled control. |

### Records (area E, prefix `rv-r-`)

| Pixl feature | Exists in ours | Action |
| --- | --- | --- |
| Log and audit filters | `filterLog`, `filterAudits`, `parseLogQuery` (reviewer only) | Add verdict and time-window filters as pure functions and link-based filter rows. A reviewer's own audit view. |
| Stats | `VerdictCounts`, `VerdictChart`, `summarizeWindow` | Per-day series of the four counted outcomes; housekeeping rows (claimed, released, reverted) never count. A day chart with a data table. |
| Reviewer pay and perks | none | `/review/pay`, owner only: pay per review and milestone perks. Every amount reads "Not set" (owner decision pending). Progress toward milestones on Stats, counted in reviews. |
| Celebration (`ReviewCelebration`) | none | A short burst of square chips after a sample verdict. A setting turns it off; reduced motion always turns it off. No sound. |
| Guidelines gate | `GuidelinePages` (no timers) | Minimum read time scaled to page length, a version number, "Read again: the rules changed". Local. |
| Verdict announcement | none | Preview of the community post per verdict. Bans show "Sent privately. Not posted." Stub. |
| Erasure (`erasure`) | none | `/erasure`, owner only. Lists what would be removed for a handle, confirm by typing the handle. Stub. |
| Age exceptions (`ageOverrides`) | `turnedNineteen` | `/age-exceptions`, owner only: the list with a justification each. Adding is a stub. |

Not copied (Pixl-specific): tiers and pixel payouts, Trial and RE terms, blackout, Airtable, Slack-ID wiring, Pixo, Robert, the game server, sounds and art.

## Sample ships (assigned here so screens are not empty)

| Role in the screens | Ship |
| --- | --- |
| Double dip, another YSWS | `sh-2043` |
| Double dip, another LOADOUT ship | `sh-2056` |
| Held | `sh-2050` |
| Claimed by another reviewer | `sh-2045` (software), `sh-2044` (hardware) |
| Assigned, inside the 3-day window, re-shipped | `sh-2047` |
| Hardware | `sh-2042`, `sh-2044`, `sh-2048` |
| Commits from GitHub, Codeberg, a self-hosted Forgejo | `sh-2041`, `sh-2043`, `sh-2045` |
| Team ship with collaborator evidence | `sh-2048` |
| AI-usage numbers and a prepared draft | `sh-2041`, `sh-2049` |
| Does not fit the track (needs changes) | `sh-2054` |

Side tables are keyed by these ids, live in each area's own fixture file, and each has a test that every key is a real ship. Handles only. No real names, emails, addresses or repositories: hosts end in `.example` or `.invalid`.

## Flows

1. **Queue.** Open `/review`. The health strip (owner) reads the queue in one line. Rows show one track chip, claimed and assigned tags. Live is a labelled switch; its status line is `aria-live="polite"` and changes at most every 10 s.
2. **Desk.** Opening does not claim. A double-dip banner, if any, is the first thing under the back row. Claim starts the 30-minute countdown; the page says when it was last kept alive. Read evidence in the left tabs (Commits, README, Journals, Hackatime or Lapse, Evidence, Past reviews).
3. **Decide.** Set each journal entry; the total feeds hours to credit. Type the note; `/track` and a space expands. A draft is kept in this browser. Press a verdict: a sample result with undo. On "request changes" with the track reason, the result says the builder may change the track.
4. **Records.** Stats shows outcomes per day and perk progress. Log and audit filter by reviewer, verdict and window.
5. **Owner.** Macros, Pay and perks, Erasure, Age exceptions.

## States (every new block)

Empty ("No commits were found for this address."), partial (some hosts answered), error (a quiet line, never a thrown error), loading is not shown because nothing is fetched, success, disabled with the stub sentence, and own-submission or not-allowed where the existing page already decides it. Long text wraps (`rv-wrap`); long addresses break anywhere.

## Responsive

Checked at 390 and 1440 px. No horizontal page scroll. The desk split stacks under the existing breakpoint. Tables keep their semantics and scroll inside `rv-scroll`, or stack into labelled rows. Chips wrap. Touch targets for primary controls are at least 44 px. Use an existing breakpoint (see the design system) before adding one.

## Accessibility

Native controls and real labels. Colour is never the only signal: every state has a word. Focus is always visible and is not removed. Status messages use `role="status"`; the double-dip banner is a labelled `section` with a heading, not an alert that interrupts. Single-key shortcuts are ignored in fields and can be turned off. The countdown is not announced every second: it announces at 5 minutes left and at release. Motion: only the celebration and a 150 ms expand use motion, with `--ease`; both stop under `prefers-reduced-motion: reduce` and the site's Reduce motion preference. Charts have a text table. Both themes must hold contrast.

## Files and ownership

- Pure rules, fixtures and tests: `apps/landing/lib/reviewer/desk/` (the package `test` script runs `lib/reviewer`). Tests placed beside components do not run.
- Components: `apps/landing/app/_components/platform/review/{queue,verdict,evidence,macros,records}/`, each with its own CSS file that uses only its prefix and the `--pf-*` tokens.
- New routes: under `apps/landing/app/(reviewer)/reviewer/`. Every page calls `requireAccess(...)` (the nav test reads page files).
- One integrator edits the shared files: `lib/platform/review.ts`, `review-fixtures.ts`, `review/[id]/page.tsx`, `review.css`, `platform.css`, `lib/reviewer/nav.ts`, `ReviewTabs`, `ReviewQueue`, `DetailTabs`, `ReviewForm`, the stats, log, audit, guidelines and settings pages.

## Acceptance criteria

1. `bun run typecheck`, `bun run lint` and the package `bun test` script pass.
2. Every row of the parity table is Local, Stub or "nothing to do", and the page says which with the fixed sentence.
3. No network call, key, real name or real repository anywhere in the new code. No text credits a tool.
4. No track percent, split or allocation remains.
5. The screens listed in the job (queue with Live, desk overview, commits and evidence with the double-dip banner, the form with `/track` expanded, macro editor, log, stats with perks, guidelines gate, hardware queue, spot check, a one-track ship) render with sample data at 1440 px, and the desk and queue at 390 px, with no overflow, clipping or empty block.
6. Keyboard only: every new control is reachable, operable and shows focus.
7. Reduced motion: nothing moves.

## Pre-flight

Identity lock: tokens and classes reused, no new colour, type or radius. Anti-slop: no pills-only status, no card grids, no gradient. States, responsive and accessibility sections are complete. Cognitive load: the double-dip banner is the only loud element on the desk; everything else is a ruled row or a fold. Self-critique, 1 to 5: clarity 4, consistency 5, density 3 (the desk is long; folds keep the default view short), accessibility 4, honesty of states 5.

## Build handoff

Implement exactly this brief on the existing Next App Router code. Do not redesign the shell, the tab row or the existing blocks, and do not re-implement what the "Exists" column names. Skills to load before UI work: `frontend-design-ui-ux`, `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites`, `pixel-art-animator`; report only the ones that actually loaded.
