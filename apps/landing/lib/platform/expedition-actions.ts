"use server";

// Server actions for equipping an expedition on a project (plans/proposals/trials-as-expeditions.md).
//   equipExpedition     projectId, expeditionId
//   unequipExpedition   projectId, expeditionId   (only while it is not finished)
//   loadExpeditionPanel projectId                 (read: what the project's Toolbelt tab shows)
// Only the project's owner can use them. The rules are canEquipExpedition in lib/platform/expeditions.ts; the checks and the
// write share one transaction, so two quick presses cannot put two expeditions on one project.
import { revalidatePath } from "next/cache";
import type { FormState } from "./actions";
import { db } from "./db";
import { listEquipped, progressFor } from "./expedition-data";
import { approvedHoursFromMinutes, canEquipExpedition, isDone, missionById, MISSIONS, stepsDone, type Mission } from "./expeditions";
import { requireViewer } from "./session";

const text = (value: FormDataEntryValue | null): string => (typeof value === "string" ? value : "");
const NOT_FOUND = "That project was not found.";

function refresh(projectId: string, expeditionId: string) {
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/shop/expeditions");
  revalidatePath(`/dashboard/shop/expeditions/${expeditionId}`);
}

export async function equipExpedition(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const projectId = text(formData.get("projectId"));
  const expeditionId = text(formData.get("expeditionId"));
  const mission = missionById(expeditionId);
  const result = await db().$transaction(async (tx): Promise<FormState> => {
    const project = await tx.project.findFirst({ where: { id: projectId, ownerId: viewer.id }, select: { id: true, ownerId: true, track: true } });
    if (!project) return { status: "error", message: NOT_FOUND, field: "projectId" };
    const rows = await listEquipped(viewer.id, tx);
    const verdict = canEquipExpedition({
      viewerId: viewer.id,
      project,
      mission,
      progress: progressFor(rows),
      onProject: rows.filter((row) => row.active && row.projectId === project.id).map((row) => row.expeditionId),
      elsewhere: rows.filter((row) => row.active && row.projectId !== project.id).map((row) => row.expeditionId),
    });
    if (!verdict.ok) return { status: "error", message: verdict.reason, field: verdict.code };
    await tx.projectExpedition.create({ data: { projectId: project.id, expeditionId } });
    return { status: "saved", message: `${(mission as Mission).name} is equipped.` };
  });
  if (result.status === "saved") refresh(projectId, expeditionId);
  return result;
}

export async function unequipExpedition(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const projectId = text(formData.get("projectId"));
  const expeditionId = text(formData.get("expeditionId"));
  const mission = missionById(expeditionId);
  const rows = await listEquipped(viewer.id);
  const row = rows.find((entry) => entry.active && entry.projectId === projectId && entry.expeditionId === expeditionId);
  if (!row || !mission) return { status: "error", message: NOT_FOUND };
  if (isDone(mission, progressFor(rows))) return { status: "error", message: "A finished expedition stays on the project." };
  await db().projectExpedition.update({ where: { id: row.id }, data: { unequippedAt: new Date() } });
  refresh(projectId, expeditionId);
  return { status: "saved", message: `${mission.name} is off this project.` };
}

export type PanelCurrent = { expeditionId: string; name: string; stepsDone: number; steps: number; hours: number; needed: number; finished: boolean };
export type PanelOption = { id: string; name: string; summary: string; hours: number; steps: number; ok: boolean; reason: string };
export type ExpeditionPanel = { track: string | null; current: PanelCurrent[]; options: PanelOption[] } | null;

// What the Toolbelt tab shows for one project: the expedition on it and the ones in its track that could be equipped.
export async function loadExpeditionPanel(projectId: string): Promise<ExpeditionPanel> {
  const viewer = await requireViewer();
  const project = await db().project.findFirst({ where: { id: projectId, ownerId: viewer.id }, select: { id: true, ownerId: true, track: true, approvedMinutes: true } });
  if (!project) return null;
  const rows = await listEquipped(viewer.id);
  const progress = progressFor(rows);
  const mine = rows.filter((row) => row.active && row.projectId === project.id);
  const hours = approvedHoursFromMinutes(project.approvedMinutes);
  const current = mine.flatMap((row): PanelCurrent[] => {
    const mission = missionById(row.expeditionId);
    return mission ? [{ expeditionId: mission.id, name: mission.name, stepsDone: stepsDone(mission, progress), steps: mission.steps.length, hours, needed: mission.hours, finished: isDone(mission, progress) }] : [];
  });
  const options = MISSIONS.filter((mission) => mission.track === project.track && !mine.some((row) => row.expeditionId === mission.id)).map((mission) => {
    const verdict = canEquipExpedition({
      viewerId: viewer.id,
      project,
      mission,
      progress,
      onProject: mine.map((row) => row.expeditionId),
      elsewhere: rows.filter((row) => row.active && row.projectId !== project.id).map((row) => row.expeditionId),
    });
    return { id: mission.id, name: mission.name, summary: mission.summary, hours: mission.hours, steps: mission.steps.length, ok: verdict.ok, reason: verdict.ok ? "" : verdict.reason };
  });
  return { track: project.track, current, options };
}
