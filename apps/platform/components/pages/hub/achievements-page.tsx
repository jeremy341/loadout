"use client";

import { useState } from "react";
import { PageHeader, Panel, PreviewNote, Stat, StatGrid, Status, EmptyState, Tag } from "../../ui/ui";
import { approveContributorClaimNow, rejectContributorClaimNow } from "./actions";
import { AchievementCard, ContributorPanel } from "./achievements-parts";
import { navLead } from "./data";
import { REVIEW_AWARDED, filterRows, type StatusFilter, type TrackFilter } from "./logic/achievements";
import { TRACKS } from "./logic/profile";
import { PreviewTools, useAnnounce } from "./shared";
import { useClaims, useHub } from "./state";

// Achievements: the catalog, computed from what the other tabs hold. Earned dates are saved once so an achievement
// never un-earns. The only Ore here is the plan-defined +50 for the first outside contribution.

export function AchievementsPage() {
  const hub = useHub();
  const claims = useClaims();
  const [message, announce] = useAnnounce();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [track, setTrack] = useState<TrackFilter>("all");

  const shown = filterRows(hub.rows, status, track);
  const next = [...hub.rows]
    .filter((r) => !r.earned)
    .sort((a, b) => b.value / b.target - a.value / a.target || a.def.name.localeCompare(b.def.name))[0];
  const oreFromAchievements = hub.rows.filter((r) => r.earned).reduce((sum, r) => sum + r.def.oreReward, 0);
  const pending = claims.contributor?.status === "pending";

  function onApprove() {
    const outcome = approveContributorClaimNow();
    announce(
      outcome === "credited"
        ? "Claim approved (preview). +50 Ore was added to the ledger once."
        : outcome === "already-credited"
          ? "Claim approved (preview). The Ore was already credited, so none was added again."
          : "There is no pending claim to approve.",
    );
  }

  return (
    <>
      <PageHeader eyebrow="You" title="Achievements" lead={navLead("achievements")} />
      <PreviewNote>
        Criteria are worked out from the numbers on your other tabs, and the catalog is a draft: Plan 02 gives example achievements but no catalog. Earned
        dates are saved in this browser.
      </PreviewNote>
      <Status message={message} />

      <div className="pg-stack">
        <StatGrid>
          <Stat label="Earned" value={`${hub.earnedCount} of ${hub.rows.length}`} hint="They never un-earn" />
          <Stat label="Closest to earning" value={next ? next.def.name : "All earned"} hint={next ? `${next.value} of ${next.target}` : undefined} />
          <Stat label="Ore from achievements" value={oreFromAchievements} hint="Only the outside contribution carries Ore" />
        </StatGrid>

        <Panel title="Catalog">
          <div className="toolbar">
            <div className="fld">
              <label className="fld-label" htmlFor="hb-ach-status">
                Show
              </label>
              <select id="hb-ach-status" value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
                <option value="all">All achievements</option>
                <option value="earned">Earned</option>
                <option value="locked">Locked</option>
              </select>
            </div>
            <div className="fld">
              <label className="fld-label" htmlFor="hb-ach-track">
                Track
              </label>
              <select id="hb-ach-track" value={track} onChange={(event) => setTrack(event.target.value as TrackFilter)}>
                <option value="all">Any track</option>
                {TRACKS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="mut" role="status" aria-live="polite">
            Showing {shown.length} of {hub.rows.length} achievements.
          </p>
          {shown.length === 0 ? (
            <EmptyState title="Nothing matches">Try a different filter.</EmptyState>
          ) : (
            <ul className="card-grid hb-ach-grid">
              {shown.map((row) => (
                <AchievementCard key={row.def.id} row={row} />
              ))}
            </ul>
          )}
          <p className="mut hb-help">
            Rarity and the criteria are <Tag>Draft preview rule</Tag> labels. Badges, cosmetics and any other rewards are set by the program and are not shown.
          </p>
        </Panel>

        <ContributorPanel claims={claims} projects={hub.build.projects.map((p) => ({ id: p.id, name: p.name }))} announce={announce} />

        <Panel title="Awarded by review">
          <p className="mut">
            Plan 02 lists these example achievements. Reviewers judge them, so the preview cannot award them. Their rewards are set by the program.
          </p>
          <details className="hb-details">
            <summary>See the {REVIEW_AWARDED.length} examples</summary>
            <ul className="hb-plain">
              {REVIEW_AWARDED.map((item) => (
                <li key={item.name}>
                  <strong>{item.name}</strong> <span className="mut">{item.criteria}</span>
                </li>
              ))}
            </ul>
          </details>
        </Panel>

        <PreviewTools hint="Verification is not built, so these stand in for a reviewer deciding on your outside-contribution claim.">
          <div className="pg-actions">
            <button type="button" className="btn btn-sm" disabled={!pending} onClick={onApprove}>
              Approve (preview)
            </button>
            <button
              type="button"
              className="btn btn-quiet btn-sm"
              disabled={!pending}
              onClick={() => {
                rejectContributorClaimNow();
                announce("Claim not approved (preview). No Ore was added.");
              }}
            >
              Reject (preview)
            </button>
          </div>
          {!pending ? <p className="mut hb-help">Record a claim above to enable these.</p> : null}
        </PreviewTools>
      </div>
    </>
  );
}
