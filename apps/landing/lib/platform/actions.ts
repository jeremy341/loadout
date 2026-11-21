"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkReason, recordAudit } from "./audit";
import { db } from "./db";
import { eligibilityRefusal } from "./eligibility-gate";
import { forgetFlag, isKnownFlag, KNOWN_FLAGS, writeFlag } from "./flags";
import { removeImage } from "./media-store";
import { checkProjectInput, deleteConfirmed } from "./projects";
import { checkLimit } from "./rate-limit-db";
import { requireAccess, requireViewer } from "./session";
import { isLocked, lockedReason, OPEN_STATUSES } from "./ship";

export type FormState =
  | { status: "idle" }
  | { status: "error"; message: string; field?: string }
  | { status: "saved"; message: string; href?: string };

const CREATE_RATE = { limit: 10, windowMs: 60_000 } as const;

// A builder starts a project. Any signed-in, active builder can do this; it is not a staff write, so no audit row.
export async function createProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const refusal = await eligibilityRefusal(viewer);
  if (refusal) return { status: "error", message: refusal };
  const checked = checkProjectInput({
    title: formData.get("title"),
    description: formData.get("description"),
    track: formData.get("track"),
    repoUrl: formData.get("repoUrl"),
    demoUrl: formData.get("demoUrl"),
  });
  if (!checked.ok) return { status: "error", field: checked.field, message: checked.message };

  // About ten new projects a minute per builder, counted in the database so every instance agrees.
  const limit = await checkLimit({ key: `project-create:${viewer.id}:minute`, ...CREATE_RATE });
  if (!limit.ok) return { status: "error", message: "You're creating projects very quickly. Wait a minute and try again." };

  const project = await db().project.create({
    data: {
      ownerId: viewer.id,
      title: checked.input.title,
      description: checked.input.description,
      track: checked.input.track,
      repoUrl: checked.input.repoUrl,
      demoUrl: checked.input.demoUrl,
    },
    select: { id: true },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  return { status: "saved", message: `${checked.input.title} is in your projects.`, href: `/dashboard/projects/${project.id}?created=1` };
}

// A builder edits their own project. The owner check is part of the query, so another builder's id changes nothing.
export async function updateProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const id = String(formData.get("id") ?? "");
  const checked = checkProjectInput({
    title: formData.get("title"),
    description: formData.get("description"),
    track: formData.get("track"),
  }, "edit");
  if (!checked.ok) return { status: "error", field: checked.field, message: checked.message };

  const current = await db().project.findFirst({ where: { id, ownerId: viewer.id }, select: { status: true } });
  if (current && isLocked(current.status)) return { status: "error", message: lockedReason(current.status) ?? "This project can't change right now." };
  const result = await db().project.updateMany({
    where: { id, ownerId: viewer.id, status: { in: [...OPEN_STATUSES] } },
    data: { title: checked.input.title, description: checked.input.description, track: checked.input.track },
  });
  if (result.count === 0) return { status: "error", message: "That project was not found." };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${id}`);
  return { status: "saved", message: "Project saved." };
}

// A builder deletes their own project. The name has to be typed back, and the project goes for good.
export async function deleteProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const id = String(formData.get("id") ?? "");
  const project = await db().project.findFirst({ where: { id, ownerId: viewer.id }, select: { id: true, title: true, status: true } });
  if (!project) return { status: "error", message: "That project was not found." };
  // Same lock as updateProject: a submitted, in-review, approved or banned project can't be deleted from here.
  if (isLocked(project.status)) return { status: "error", message: lockedReason(project.status) ?? "This project can't be deleted right now." };
  if (!deleteConfirmed(formData.get("confirm"), project.title)) {
    return { status: "error", field: "confirm", message: "Type the project name exactly to confirm." };
  }

  // The uploaded files go with the project. Their paths are read first, because the rows cascade away with the project.
  const files = await db().journalMedia.findMany({ where: { projectId: project.id }, select: { path: true } });
  // The status is part of the delete, so a project that was submitted a moment ago is not removed.
  const removed = await db().project.deleteMany({ where: { id: project.id, ownerId: viewer.id, status: { in: [...OPEN_STATUSES] } } });
  if (removed.count === 0) return { status: "error", message: "This project can't be deleted right now." };
  for (const file of files) await removeImage(file.path).catch(() => {});
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  redirect("/dashboard/projects");
}

export async function setFlagState(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireAccess("owner");
  const name = String(formData.get("name") ?? "");
  if (!isKnownFlag(name)) return { status: "error", message: "That flag is not known." };
  const reason = checkReason(formData.get("reason"));
  if (!reason.ok) return { status: "error", field: "reason", message: reason.message };
  const enabled = formData.get("target") === "on";

  await db().$transaction(async (tx) => {
    const before = await tx.featureFlag.findUnique({ where: { name } });
    await writeFlag(name, enabled, tx);
    await recordAudit(tx, {
      actorId: actor.id,
      action: "flag.set",
      targetType: "flag",
      targetId: name,
      reason: reason.reason,
      before: { enabled: before?.enabled ?? false },
      after: { enabled },
    });
  });
  forgetFlag(name);
  revalidatePath("/reviewer/flags");
  revalidatePath("/reviewer/audit");
  return { status: "saved", message: `${KNOWN_FLAGS[name]} is ${enabled ? "on" : "off"}.` };
}
