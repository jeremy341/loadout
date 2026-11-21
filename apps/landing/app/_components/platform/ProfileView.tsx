import Link from "next/link";
import type { Avatar } from "@/lib/platform/avatar";
import { dayTotals } from "@/lib/platform/activity";
import { listActivity } from "@/lib/platform/activity-data";
import { db } from "@/lib/platform/db";
import { followCounts } from "@/lib/platform/follows-data";
import { ledgerBalances } from "@/lib/platform/ledger-data";
import { listProfileProjects } from "@/lib/platform/profile-data";
import { PUBLIC_LEVELS_ENABLED, topTrack } from "@/lib/platform/profile-view";
import { readViewer } from "@/lib/platform/session";
import { sampleTrackProgress } from "@/lib/platform/progress";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { BuilderRelation } from "./BuilderRelation";
import { ChooseHandle, ProfileIdentity } from "./ProfileIdentity";
import { ProfileEditDialog } from "./ProfileEditDialog";
import { ProfileBadges } from "./ProfileBadges";
import { ProfileProjects } from "./ProfileProjects";
import "./profile.css";

type Person = { id: string; handle: string | null; bio: string | null; joinedAt: Date; avatar?: Avatar | null };

// One profile page, own or public, copied from Stasis's profile: a back link, then two columns. The left column has the profile
// card and the Activity heatmap card; the right column has the Track levels card (in the place of Stasis's Badges) and the Projects card. There are no tabs. Every
// project is public, so a visitor sees the same cards except banned projects; the own view adds Edit profile and the pending Ore line;
// the Ore balance is public.
// Journals and the Toolbelt live on each project's page. Everything another builder sees is a handle, never a name.
export async function ProfileView({ person, own }: Readonly<{ person: Person; own: boolean }>) {
  const now = new Date();
  const [rows, activity, balance, counts] = await Promise.all([
    listProfileProjects(person.id, own ? "all" : "public"),
    listActivity(person.id, now, "all"),
    ledgerBalances(person.id),
    followCounts(person.id),
  ]);

  // The follow and block controls are for a visitor only: whether they follow this builder and whether they have blocked them.
  let relation: React.ReactNode = null;
  if (!own && person.handle) {
    const viewer = await readViewer();
    if (viewer) {
      const [follow, block] = await Promise.all([
        db().follow.findUnique({ where: { followerId_followeeId: { followerId: viewer.id, followeeId: person.id } }, select: { followerId: true } }),
        db().block.findUnique({ where: { blockerId_blockedId: { blockerId: viewer.id, blockedId: person.id } }, select: { blockerId: true } }),
      ]);
      relation = <BuilderRelation handle={person.handle} following={follow !== null} blocked={block !== null} />;
    }
  }

  const levels = sampleTrackProgress();
  const top = own || PUBLIC_LEVELS_ENABLED ? topTrack(levels) : null;
  const totals = dayTotals(activity.entries);

  return (
    <>
      {own ? <ProfileEditDialog handle={person.handle} bio={person.bio} /> : null}
      <div className="pf-crumbs">
        <Link className="pf-back" href={own ? "/dashboard/projects" : "/dashboard/explore"}>
          <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
            <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
          </svg>
          {own ? "Back to Projects" : "Back to Explore"}
        </Link>
      </div>

      {person.handle ? (
        <div className="pf-sp">
          <div className="pf-sp-left">
            <ProfileIdentity
              handle={person.handle}
              bio={person.bio}
              top={top}
              own={own}
              balance={balance}
              avatar={person.avatar ?? null}
              counts={counts}
              relation={relation}
            />
            <ActivityHeatmap totals={totals} now={now} own={own} />
          </div>
          <div className="pf-sp-right">
            <ProfileBadges />
            <ProfileProjects rows={rows} own={own} />
          </div>
        </div>
      ) : (
        <ChooseHandle />
      )}
    </>
  );
}
