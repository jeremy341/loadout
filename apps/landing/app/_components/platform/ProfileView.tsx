import Link from "next/link";
import { listProfileProjects, listToolsUsedBy, listUsersOfTool } from "@/lib/platform/profile-data";
import { MAX_PINNED, normalizeStatus, pinnedProjects, publicProjects } from "@/lib/platform/profile";
import { joinedLabel, PUBLIC_LEVELS_ENABLED, topTrack, type ProfileQuery } from "@/lib/platform/profile-view";
import { sampleTrackHours, sampleTrackProgress, sumHours, TRACKS } from "@/lib/platform/progress";
import { CoreGauge } from "./CoreGauge";
import { DepthValue } from "./DepthValue";
import { ChooseHandle, ProfileIdentity } from "./ProfileIdentity";
import { ProfileEditDialog, OpenProfileEditButton } from "./ProfileEditDialog";
import { ProfilePins } from "./ProfilePins";
import { ProfileProjects } from "./ProfileProjects";
import { ProfileToolbelt } from "./ProfileToolbelt";
import "./profile.css";

type Person = { id: string; handle: string | null; bio: string | null; joinedAt: Date };

// One profile page, own or public. The own view shows every project with controls, the Loadout block and the choose-a-handle
// prompt; the public view shows what the owner chose to show. Everything another builder sees is a handle, never a name.
export async function ProfileView({
  person,
  viewerId,
  query,
  own,
  base,
}: Readonly<{ person: Person; viewerId: string; query: ProfileQuery; own: boolean; base: string }>) {
  const rows = await listProfileProjects(person.id, own ? "own" : "public");
  const publicRows = publicProjects(rows);
  const pins = pinnedProjects(rows);
  const approvedUnpinned = rows.filter((row) => normalizeStatus(row.status) === "approved" && !row.hidden && !row.pinned).length;

  const [equipped, userLists] = await Promise.all([
    listToolsUsedBy(person.id),
    // Builders who use this builder's tools: confirmed uses of their public open-source projects, one entry per builder.
    Promise.all(publicRows.filter((row) => row.repoUrl && normalizeStatus(row.status) === "approved").map((row) => listUsersOfTool(row.id, viewerId))),
  ]);
  const users = new Map<string, { id: string; handle: string | null }>();
  for (const list of userLists) {
    for (const use of list) if (use.status === "confirmed" && use.userId !== person.id) users.set(use.userId, { id: use.userId, handle: use.userHandle });
  }

  const levels = sampleTrackProgress();
  const top = own || PUBLIC_LEVELS_ENABLED ? topTrack(levels) : null;
  const hours = sumHours(TRACKS.map((track) => sampleTrackHours(track)));
  const showLoadout = own || PUBLIC_LEVELS_ENABLED;

  return (
    <>
      <div className="pf-crumbs">
        {own ? (
          <>
            <ProfileEditDialog handle={person.handle} bio={person.bio} />
            {person.handle ? <OpenProfileEditButton>Edit profile</OpenProfileEditButton> : null}
          </>
        ) : (
          <Link className="pf-back" href="/dashboard/explore">
            <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
              <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
            </svg>
            Back to Explore
          </Link>
        )}
      </div>

      {person.handle ? (
        <ProfileIdentity
          handle={person.handle}
          bio={person.bio}
          joined={joinedLabel(person.joinedAt)}
          top={top}
          projectCount={publicRows.length}
          toolbeltCount={equipped.length}
          own={own}
        />
      ) : (
        <ChooseHandle />
      )}

      <ProfilePins
        pins={pins.map((row) => ({ id: row.id, title: row.title, track: row.track, usedBy: row.usedBy, openSource: Boolean(row.repoUrl) }))}
        freeSlots={own ? Math.min(MAX_PINNED - pins.length, approvedUnpinned) : 0}
      />

      {showLoadout ? (
        <div className="pf-prof-loadout">
          <CoreGauge title="Loadout" headingId="loadout-heading" />
          <div className="pf-stats">
            <dl className="pf-stat-list">
              <div>
                <dt>Depth</dt>
                <dd>
                  <DepthValue hours={hours} />
                </dd>
              </div>
              <div>
                <dt>Approved hours</dt>
                <dd>{hours.approved} H</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}

      <ProfileProjects rows={rows} query={query} base={base} own={own} />

      <div className="pf-split pf-prof-lower">
        <ProfileToolbelt equipped={equipped} users={[...users.values()]} own={own} />
        <section className="pf-plain-panel" aria-labelledby="activity-heading">
          <h2 id="activity-heading">Recent activity</h2>
          <p>No journal entries yet. Journals open in a later release.</p>
        </section>
      </div>
    </>
  );
}
