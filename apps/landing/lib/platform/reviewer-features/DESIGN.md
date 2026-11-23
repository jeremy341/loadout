# Reviewer features: rules and table shapes

Status: pure rules are built and tested (`bun test lib/platform/reviewer-features`). The schema is **not** changed. The shapes
below are proposals for the platform owner to approve before any migration (`prisma/schema.prisma` and `prisma/migrations` are
out of this task's scope). Each rule module lists its API in its header.

## What is built (pure, no database)

| Roadmap item | Module | Notes |
| --- | --- | --- |
| Macros and expansion | `macros.ts` | Built-in set includes `/track` ("does not fit the track"). Owner editor UI and saved macros need the table below. |
| Draft autosave | `drafts.ts` | localStorage only; restored only for the same ship version; 7-day expiry. |
| Per-journal approval, hour correction | `journal-verdict.ts` | Approval needs every entry decided and within its logged minutes. |
| Claim, heartbeat, auto-release | `claim.ts` | Lease 30 min from last heartbeat; a tab reported hidden for 5 min releases. |
| Assignment window | `assignment.ts` | 3 days after re-ship, then back to the common queue. |
| Queue wait, health, type filter | `queue.ts` | Wait from first ship; an update to an approved project restarts it; aged after 7 days. A reviewer limited to one queue is forced to it. |
| Holds | `queue.ts` (`checkHoldReason`) | Needs a reason, 3–280 characters. |
| Project notes | `notes.ts` | 2000 characters, 4 images, PNG/JPEG/WebP up to 5 MB, stable author colour. |
| Pipeline strip | `pipeline.ts` | Four stages derived from facts. |
| Resubmit notice | `resubmit.ts` | Sent once, to the reviewer who asked for changes. |
| Proposed bans | `proposed-bans.ts` | Reviewer proposes, owner decides, never the proposer. Builder is told privately only on approval. |
| Guidelines gate | `guidelines.ts` | Read time scales with length (200 words/min, 15 s–5 min); a version change forces a re-read. |
| Announcements | `records.ts` | Only approved, needs-changes and rejected are posted. Bans never. |
| Reviewer stats and pay | `records.ts` | Four counted outcomes; pay 2 Ore approval or ban, 1 Ore needs-changes, rejected unsettled. |
| Erasure, age exceptions | `admin-rules.ts` | Owner only; erasure needs typed confirmation. Ledger and audit handling is an open owner decision. |

## Proposed table shapes (not built)

- **ReviewMacro** `{ id, trigger (unique, lowercase), body (<= 1000), updatedById, updatedAt }`
- **ShipClaim** `{ shipId (unique), reviewerId, claimedAt, lastHeartbeatAt, hiddenSince? }`. Could sit on the ship row instead.
- **JournalDecision** `{ id, shipId, entryId (unique with shipId), approvedMinutes, decidedById, decidedAt }`
- **HourCorrection** (append-only) `{ id, shipId, entryId, assignedMinutes, correctedMinutes, reason, actorId, createdAt }`
- **Ship** new columns: `assignedReviewerId?`, `firstShippedAt`, `reshippedAt?`, `requestedChangesById?`, `requestedChangesAt?`, `resubmitNoticeAt?`, `approvedAt?`, `updatedAt`.
- **ShipHold** `{ id, shipId, reason, placedById, placedAt, releasedAt? }`
- **ProjectNote** `{ id, projectId, authorId, body, createdAt }` and **ProjectNoteImage** `{ id, noteId, mediaId }`
- **BanProposal** `{ id, builderId, proposerId, reason, status (pending|approved|declined), decidedById?, decidedAt? }`
- **GuidelineAck** `{ reviewerId, pageKey, version, ackedAt }` with a `Guideline` record giving the current version per page.
- **AgeException** `{ id, builderId, justification, grantedById, grantedAt, revokedAt? }`
- **ErasureLog** `{ id, requestedById, completedAt, scope[] }`. Stores no builder id or content after completion.

Outcome counts can be derived from the existing review log, so no separate stats table is needed.

## Open questions for the owner

1. Is a claim the ship row or its own table? (Only matters for the migration.)
2. Is a rejected verdict paid? The settled rates cover approval, ban and needs-changes only.
3. Do ledger and audit rows get removed or anonymised on erasure?
4. Should a hidden-tab claim release at 5 minutes from when the tab was hidden (as built) or from the last heartbeat?
5. Research Mode as a ship modifier has no spec beyond the roadmap line; nothing is built.
