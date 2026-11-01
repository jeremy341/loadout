"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkReason, recordAudit } from "./audit";
import { db } from "./db";
import { forgetFlag, KNOWN_FLAGS, writeFlag, type FlagName } from "./flags";
import { checkProjectInput, deleteConfirmed } from "./projects";
import { updatePersonAccess } from "./staff";
import { requireStaff, requireViewer } from "./session";

export type FormState =
  | { status: "idle" }
  | { status: "error"; message: string; field?: string }
  | { status: "saved"; message: string };

export async function updateAccess(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireStaff();
  const personId = String(formData.get("personId") ?? "");
  const reason = checkReason(formData.get("reason"));
  if (!reason.ok) return { status: "error", field: "reason", message: reason.message };

  const result = await updatePersonAccess(
    actor.id,
    {
      personId,
      staff: formData.get("staff") === "on",
      banned: formData.get("banned") === "on",
    },
    reason,
  );
  if (!result.ok) return { status: "error", message: result.message };
  revalidatePath("/dashboard/staff/users");
  revalidatePath("/dashboard/staff/audit");
  return { status: "saved", message: result.changed.join(". ") + "." };
}

// A builder starts a project. Any signed-in, active builder can do this; it is not a staff write, so no audit row.
export async function createProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const checked = checkProjectInput({
    title: formData.get("title"),
    description: formData.get("description"),
    track: formData.get("track"),
  });
  if (!checked.ok) return { status: "error", field: checked.field, message: checked.message };

  await db().project.create({
    data: {
      ownerId: viewer.id,
      title: checked.input.title,
      description: checked.input.description,
      track: checked.input.track,
    },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  return { status: "saved", message: `${checked.input.title} is in your projects.` };
}

// A builder edits their own project. The owner check is part of the query, so another builder's id changes nothing.
export async function updateProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const id = String(formData.get("id") ?? "");
  const checked = checkProjectInput({
    title: formData.get("title"),
    description: formData.get("description"),
    track: formData.get("track"),
  });
  if (!checked.ok) return { status: "error", field: checked.field, message: checked.message };

  const result = await db().project.updateMany({
    where: { id, ownerId: viewer.id },
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
  const project = await db().project.findFirst({ where: { id, ownerId: viewer.id }, select: { id: true, title: true } });
  if (!project) return { status: "error", message: "That project was not found." };
  if (!deleteConfirmed(formData.get("confirm"), project.title)) {
    return { status: "error", field: "confirm", message: "Type the project name exactly to confirm." };
  }

  await db().project.delete({ where: { id: project.id } });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  redirect("/dashboard/projects");
}

export async function setFlagState(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireStaff();
  const name = String(formData.get("name") ?? "") as FlagName;
  if (!(name in KNOWN_FLAGS)) return { status: "error", message: "That flag is not known." };
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
  revalidatePath("/dashboard/staff/flags");
  revalidatePath("/dashboard/staff/audit");
  return { status: "saved", message: `${KNOWN_FLAGS[name]} is ${enabled ? "on" : "off"}.` };
}
