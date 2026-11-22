# Participant platform roadmap — proposal

> Status: **working draft, 15 Nov 2026.** Written after the one-track decision. Nothing here changes a policy owner; Ore values, hours and dates stay with [Plan 02](../02-economy-and-rewards.md). Draft values are provisional.

## 1. Decisions this plan rests on

| Decision | Source |
|---|---|
| A project has **one track**. It is picked at creation, can be changed while the project is a draft or in "needs changes", and is locked on submit. **All** Track XP from that ship goes to that track. No split, no percentages. | Owner, 15 Nov 2026 |
| A team ship has one track, shared by all members. | Owner, 15 Nov 2026 |
| Track fit is a needs-changes reason, not a new verdict and not an allocation. If the work does not fit the track, the reviewer **requests changes** with the reason "Does not fit the track". The builder then adds more work in that track or changes the track, and ships again. | Owner, 15 Nov 2026 |
| Ore stays global. Levels come from approved hours in one track. Depth is approved hours (1 M each). | Plans 02, owner 31 Oct |
| The profile is designed by the team, modelled on Stasis and Stardance. | Owner, 15 Nov 2026 |

Assumption to confirm: to qualify, a Toolbelt tool/project must be an accepted, open-source ship (the proposal says so). The *equipping* project needs 25 approved hours and a public repo to ship anyway.

## 2. P0 — Align everything with one track

Small, and first, because the reviewer desk is built on the wrong model.

- **Docs** (`content/docs`): `progress.md`, `tracks.md`, `projects.md`, `ai-teams.md`, `team.md`, `faq.md`. Replace the split wording with "one track per project, locked on submit".
- **Plans:** 01 §4.7, 02 (the Track XP row, the §"divided" paragraph, the summary line), 11 line 76. Note it in the DECISIONS log.
- **Reviewer code:** remove `TrackShare`, `Allocation`, `ALLOCATION_*`, `checkAllocation`, `allocationFromProposal`, `allocationLine`, `formatProposal` and the `proposal` field in `lib/platform/review.ts`. Replace with `track: Track` on the ship. Update `TrackChips`, `ReviewForm`, `ActionsTab`, `guidelines-pages.tsx`, the fixtures and the tests.
- **New needs-changes reason** in the review form: "Does not fit the track", with a short note to the builder. It comes as a macro `/track` and a preset reason chip.
- **Platform:** the edit dialog warns that the track locks on submit; the project page shows a locked track after submit.
- **Check:** `grep -ri "split\|allocation\|percent"` across docs, plans and code returns only unrelated hits.

## 3. P1 — Foundation: real identity and the hours ledger

1. **Hack Club Auth** sign-in, keeping the local test accounts for dev. Handle, avatar and age-confirmation come from here.
2. **Schema:** `TimeSegment` (project, source, minutes, day), `JournalEntry` (project, day, markdown, assigned minutes, media), `HoursLedger` (project, approved minutes, reviewer, ship).
3. **Replace the sample:** `projectHours()`, `trackProgress()` and `oreBalance()` read the ledger. The sample hours stay only behind a dev flag.
4. **Rule:** each tracked minute is assigned to one journal entry only.

## 4. P2 — The project loop

1. **Hackatime link** (Hardware: Lapse link) and the eligible-time rules from Plan 01.
2. **Journal:** new-entry form, an entry due for every 8 hours of work, a public timeline on the project page.
3. **Project record:** repo URL, demo URL, README check (200 words), project type, AI disclosure, hardware bill of materials, cover image.
4. **Ship flow and status machine:** draft → logging → submitted → in review → approved / needs changes / rejected. The track locks on submit. Re-ship after changes keeps the first submitted date.
5. **Connect the reviewer desk to real ships:** the queue, claim, journal-by-journal approval and verdict write to the ledger. The fixtures remain for tests only.
6. **Ore ledger:** an approved hour pays 10 Ore and 10 Track XP, written once, never re-credited (the Pixl fix `fix/update-hours-no-recredit-of-deflated-time` is the model).

## 5. P3 — Profile and Toolbelt

### Profile (`/dashboard/profile` for you, `/u/<handle>` public)

Modelled on Stasis (identity card, then badges, then projects) and Stardance (activity, follow). Kept to LOADOUT's own parts; no follower graph in v1.

- **Identity card:** handle, avatar, short bio (160 characters, as Stasis), join date, and the highest track.
- **Loadout:** the four track levels as the level strip (LV.0 to LV.20), total depth, total approved hours.
- **Projects (all of them):** a tabbed list, not only shipped work.
  - **Your own view:** every project you own or belong to, in every state (draft, logging, submitted, in review, needs changes, rejected, approved). Filter by status and track, sort by recent activity, with a count per status. Each row shows cover, track, status, approved and pending hours, and the last journal date. It is the same list as `/dashboard/projects`, embedded in the profile so there is one place to look.
  - **Public view:** approved projects, plus logging projects the builder chose to show as "currently building". Drafts, in-review and rejected work are never public. The owner can hide any single project.
  - **Pins:** up to 3 approved projects shown first as a featured strip above the list.
- **Toolbelt:** tools others used from you, tools you equipped.
- **Recognition:** Keystone tiles (if kept) and Era contributions. No rank-based discounts (Plan 02).
- **Activity:** recent journal entries on public projects, newest first, not an endless feed.
- **Privacy (ages 13–18):** handle only, no real name, school or location. Owner can hide a project. A report button for everyone.
- **Own view extras:** edit bio and pins, an Ore balance, and a link to settings.

### Toolbelt

1. A project picks up to **two** approved, open-source tool/projects from Explore ("Equip" on the project page, with a use note naming the file or feature).
2. The equip is pending until the equipping project has **25 approved hours** and its journal shows real use.
3. The reviewer gets a gate checklist (still to be written, Toolbelt open item 1) and confirms or declines.
4. Payouts: 50 Ore once per tool to the user, 10 Ore per verified user to the maker (cap 500 per tool per season). No Track XP.
5. The maker can block a builder from equipping.
6. Shown on Explore cards ("used by N"), the project page and the profile.

## 5a. P2b — Reviewer desk parity with Pixl

Our reviewer desk (the separate reviewer site) already has the screens, built on fixtures. This phase makes them real and adds the Pixl features we lack. **Rule: take every Pixl review feature that is not 100% Pixl-specific, reworded for LOADOUT.** Not copied: Pixl's tiers (first pass and second pass, pixel payouts, Trial and RE terms), blackout, Airtable, Slack-ID wiring, Pixo and the game server. Everything else is below. Source files are under `references/pixl/apps/internal-dashboard`.

### Evidence and integrations
| Feature | What it does for LOADOUT | Pixl source |
|---|---|---|
| Commit history from any git host | Commits tab for GitHub, Codeberg and self-hosted forges; paged, with a concurrency cap; commits per author, gaps, bulk dumps | `lib/commits.ts`, `concurrency.ts` |
| GitHub repo owner link | Safe link from the repo to its owner, strict host and name check | `githubRepoOwner.ts` |
| README fetch and render | Fetch and render safely (no scripts), word count for the 200-word gate | `markdown.ts` |
| SSRF guard and safe URLs | Every fetch to a builder-supplied host goes through one guard (no private IPs, redirects checked, timeouts) | `ssrfGuard.ts`, `safeUrl.ts`, `urlSafety.ts` |
| Hackatime evidence | Tracked time, languages and sessions beside journal minutes; tracked-versus-journaled bar | `hackatime.ts`, `hackatimeEvidence.ts` |
| Collaborator evidence | Each team member's tracked and journaled minutes, separately | `claimedHours`, migration 0234 |
| Lapse and hardware evidence | Lapse viewer, bill of materials check, a hardware queue | `bom.ts`, `review/hardware` |
| Duplicate and double-dip check | Loud banner when a ship matches another Hack Club YSWS or another LOADOUT ship, with the kind of match | `doubleDip.ts`, `DoubleDipBanner` |
| AI-usage check | Human versus AI split of tracked time and the AI deduction; cached a few minutes; never throws into the page | `fraudy.ts` |
| Automated pre-check | A ship stays out of the queue while the pre-check runs, with a timeout | `precheck.ts` |
| AI-drafted review notes | Drafts the note text from commits, journals and time data. Never proposes a verdict or hours, never auto-submits; batch drafting | `aiReview.ts`, `aiReviewRun.ts`, `aiDraftBatch.ts` |
| Image safety | Magic-byte check on every upload; raster formats only | `imageSniff.ts` |

### The review itself
| Feature | What it does | Pixl source |
|---|---|---|
| **Macros** | Type `/trigger` in the note to the builder and it expands to canned text (README too short, AI use, track mismatch, missing journal, unverifiable time). An editor page for owners, with caret position. Add "does not fit the track" as a macro. | `reviewMacros.ts`, `ReviewMacroEditor` |
| Per-journal approval | Approve all, approve part, ask for clarification, or reject as unverifiable, per entry; approved minutes sum into the ledger | `ReviewForm` |
| Hour correction | A later correction pays or claws back only the difference, once; deflated time is never re-credited | `hourCorrectionPayout.ts` |
| Claim, heartbeat, auto-release | Opening a page never claims. A claim lasts 30 minutes, a heartbeat keeps it, leaving the tab for 5 minutes releases it. Claimed ships are tagged in the queue | `reviewClaimState.ts`, `ReviewHeartbeat` |
| Assignment window | The reviewer who first asks for changes is assigned; after the re-ship they have 3 days, then the ship returns to the common queue (daily cron) | `reviewAssignment.ts` |
| Queue wait rules | Wait counts from the first ship; an update to an approved project starts a new wait | `queueWait.ts` |
| Queue health | A cron flagging stuck or aged ships and queue size | `cron/queue-health` |
| Live queue | Refreshes itself when a ship arrives, with a Live toggle | `LiveReview` |
| Keyboard shortcuts | Previous and next ship, open repo, open demo | `ReviewShortcuts` |
| Queue type filter | Software, hardware or all; a reviewer limited to one queue is limited on the server too | `reviewTypeFilter.ts`, `reviewAccess.ts` |
| Unship and revert | A reviewer-level unship wipes every review field so no stale verdict survives a re-ship; revert a wrong approval | `unship.ts` |
| Review hold | Put a ship on hold with a reason | migration 0151 |
| Self-review block | A reviewer never reviews their own team's ship; owner-listed exceptions | migration 0166 |
| Project notes | Internal chat-style thread per project, one colour per author, image attachments | `ProjectNotes` |
| Draft autosave | The review form keeps an unsent draft | migration 0172 |
| Pipeline strip | Done, current, upcoming dots for the ship's stages | `ReviewPipelineSteps` |
| Resubmit notice | The reviewer who asked for changes is told when the builder re-ships | migration 0207 |
| Spot-check queue | A sample re-check by an owner or senior reviewer; any ship can be sampled, so it is not a tier | `spot-check` |
| Proposed bans | A reviewer proposes, an owner decides; the builder is told privately | `proposed-bans`, `banPayout.ts` |

### Reviewer-side records
- **Log and audit:** review log with a reviewer filter, audit view, a note on every action, and the reviewer's own audit view.
- **Review stats:** verdict counts per reviewer and day, with a chart. Only four outcomes count (approved, needs changes, rejected, banned), so housekeeping rows do not.
- **Reviewer pay and perks:** a settings page for pay per review, and milestone grants (Pixl's food grant, reworded as a reviewer perk) with progress on the stats page. The rates are settled in [platform parity](platform-parity-pixl.md): 2 Ore on approval or ban, 1 Ore on needs-changes. The settings page itself is still planned.
- **Celebration:** short confetti and sound on a verdict, with a setting to turn it off (accessibility).
- **Guidelines gate:** first-time reviewers read each page for a minimum time scaled to its length, then confirm; a version number forces a re-read when rules change.
- **Public announcement:** each verdict is posted to the community review channel with a project link. Bans go privately.
- **Erasure:** full removal of one builder's data on request, including rows with no foreign key.
- **Age exceptions:** an owner-managed list of builders allowed past the age limit, with the justification stored on the project.

### Order inside P2b
1. Evidence: commits, README, Hackatime, SSRF guard, image safety (needs P1 and P2 data).
2. Real queue: claim, heartbeat, assignment, wait rules, live refresh, filters.
3. Verdict: per-journal approval, hour correction, ledger write, unship, revert, hold.
4. Helpers: macros editor, AI drafts, notes, shortcuts, draft autosave.
5. Records: log, audit, stats, perks, announcements, guidelines gate, erasure.

Each item gets a check against Pixl's current code (`references/pixl` is at `1468ba69`) and a LOADOUT-worded spec before it is built.

## 6. P4 — Rest of the platform

- **Teams:** members, invite, one shared track, per-person tracked minutes and journals (the shared-track rule keeps it simple).
- **Real orders:** Ore spend, Field Requisitions, fulfilment hand-off to the reviewer site's fulfilment area.
- **Community storage:** Show & Tell, Ideas, goals and events move from fixtures to the database. Moderation hooks into the reviewer site.
- **Uploads:** covers and journal media, with size limits and a virus and EXIF check.
- **Notifications:** review results, orders, replies.
- **Research Mode** as a modifier on a ship.

## 7. Order and dependencies

P0 → P1 → P2 → P2b → P3 → P4. P2b can start in parts as soon as P2 data exists. The profile **layout** can be designed during P2 on sample data. Toolbelt needs P2's approved ships. Each phase is its own branch and PR batch, and each UI piece needs a scoped design brief ([UI skills](../../docs/development/ui-skills.md)).

## 8. Open items

1. Toolbelt reviewer checklist and the Keystone tile (from the proposal).
2. Whether a reviewer may change a project's track, or only request changes with the reason "Does not fit the track" (current answer: request changes only).
3. Journal media rules and storage provider.
4. Public handle rules and the profile URL shape.
