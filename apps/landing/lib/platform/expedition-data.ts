// Server only. What a builder has equipped, read once and turned into the progress the expedition pages show.
import { db } from "./db";
import { progressWithEquips, SAMPLE_PROGRESS, type EquippedRow, type Progress } from "./expeditions";

export type EquippedView = {
  id: string;
  expeditionId: string;
  projectId: string;
  projectTitle: string;
  projectTrack: string | null;
  approvedMinutes: number;
  // True while it is on the project; false once it was taken off (history, kept so finished work stays finished).
  active: boolean;
};

type Client = Pick<ReturnType<typeof db>, "projectExpedition">;

// Every expedition row on the builder's projects, newest first.
export async function listEquipped(personId: string, client: Client = db()): Promise<EquippedView[]> {
  const rows = await client.projectExpedition.findMany({
    where: { project: { ownerId: personId } },
    orderBy: { equippedAt: "desc" },
    include: { project: { select: { id: true, title: true, track: true, approvedMinutes: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    expeditionId: row.expeditionId,
    projectId: row.project.id,
    projectTitle: row.project.title,
    projectTrack: row.project.track,
    approvedMinutes: row.project.approvedMinutes,
    active: row.unequippedAt === null,
  }));
}

export function progressFor(rows: readonly EquippedView[]): Progress {
  const counted: EquippedRow[] = rows.map((row) => ({ expeditionId: row.expeditionId, projectTrack: row.projectTrack, approvedMinutes: row.approvedMinutes }));
  return progressWithEquips(SAMPLE_PROGRESS, counted);
}

// The builder's progress and the rows that made it.
export async function viewerExpeditions(personId: string): Promise<{ progress: Progress; equipped: EquippedView[] }> {
  const equipped = await listEquipped(personId);
  return { progress: progressFor(equipped), equipped };
}
