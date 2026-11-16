"use server";

// Server actions for profiles and the Toolbelt. Each takes (previous state, FormData) like lib/platform/actions.ts, so a form
// can use them with useActionState, and returns a FormState: { status: "saved", message } or { status: "error", message, field? }.
// A signed-in, active builder is required (a banned person has no viewer and gets the 404). Owner checks are part of every query.
// Form fields:
//   saveProfile         handle, bio
//   setProjectVisibility  id, hidden ("true"|"false", optional), showBuilding ("true"|"false", optional)
//   pinProject          id, pinned ("true"|"false")
//   setProjectLinks     id, repoUrl, demoUrl (empty clears)
//   equipTool           projectId, toolId, note
//   removeToolUse       useId
//   blockBuilder        blockedId   (the builder to block, from listUsersOfTool().userId)
//   unblockBuilder      blockedId
// These are not staff writes, so, like createProject, they do not write audit rows.
import { revalidatePath } from "next/cache";
import { Prisma } from "../generated/prisma/client";
import type { FormState } from "./actions";
import { db } from "./db";
import { checkBio, checkHandle, checkLinkUrl, checkPin, visibilityPatch } from "./profile";
import { requireViewer } from "./session";
import { canEquip, canRemoveUse, checkBlockTarget, checkUseNote, pendingToDecline } from "./toolbelt";

const text = (value: FormDataEntryValue | null): string => (typeof value === "string" ? value : "");
const error = (message: string, field?: string): FormState => ({ status: "error", message, field });
const NOT_FOUND = "That project was not found.";

function flag(value: FormDataEntryValue | null): boolean | undefined {
  if (value === "true" || value === "on") return true;
  if (value === "false") return false;
  return undefined;
}

function refresh(handle?: string | null, projectId?: string) {
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/explore");
  if (projectId) {
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath(`/dashboard/explore/${projectId}`);
  }
  if (handle) revalidatePath(`/dashboard/builders/${handle}`);
}

const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const handle = checkHandle(formData.get("handle"));
  if (!handle.ok) return error(handle.message, "handle");
  const bio = checkBio(formData.get("bio"));
  if (!bio.ok) return error(bio.message, "bio");

  const taken = await db().person.findUnique({ where: { handle: handle.handle }, select: { id: true } });
  if (taken && taken.id !== viewer.id) return error("That handle is taken. Try another.", "handle");
  try {
    await db().person.update({ where: { id: viewer.id }, data: { handle: handle.handle, bio: bio.bio } });
  } catch (e) {
    if (isUniqueViolation(e)) return error("That handle is taken. Try another.", "handle");
    throw e;
  }
  refresh(handle.handle);
  return { status: "saved", message: "Profile saved." };
}

export async function setProjectVisibility(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const id = text(formData.get("id"));
  const patch = visibilityPatch({ hidden: flag(formData.get("hidden")), showBuilding: flag(formData.get("showBuilding")) });
  if (Object.keys(patch).length === 0) return error("Nothing to change.");
  const result = await db().project.updateMany({ where: { id, ownerId: viewer.id }, data: patch });
  if (result.count === 0) return error(NOT_FOUND);
  refresh(null, id);
  return { status: "saved", message: patch.hidden ? "Hidden from your profile and Explore." : "Visibility saved." };
}

export async function pinProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const id = text(formData.get("id"));
  const pinned = flag(formData.get("pinned"));
  if (pinned === undefined) return error("Nothing to change.");
  const project = await db().project.findFirst({ where: { id, ownerId: viewer.id }, select: { status: true, hidden: true } });
  if (!project) return error(NOT_FOUND);
  if (pinned) {
    const elsewhere = await db().project.count({ where: { ownerId: viewer.id, pinned: true, id: { not: id } } });
    const check = checkPin(project, elsewhere);
    if (!check.ok) return error(check.message);
  }
  await db().project.update({ where: { id }, data: { pinned } });
  refresh(null, id);
  return { status: "saved", message: pinned ? "Pinned to your profile." : "Unpinned." };
}

export async function setProjectLinks(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const id = text(formData.get("id"));
  const repo = checkLinkUrl(formData.get("repoUrl"), "source link");
  if (!repo.ok) return error(repo.message, "repoUrl");
  const demo = checkLinkUrl(formData.get("demoUrl"), "demo link");
  if (!demo.ok) return error(demo.message, "demoUrl");
  const result = await db().project.updateMany({ where: { id, ownerId: viewer.id }, data: { repoUrl: repo.url, demoUrl: demo.url } });
  if (result.count === 0) return error(NOT_FOUND);
  refresh(null, id);
  return { status: "saved", message: "Links saved." };
}

export async function equipTool(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const projectId = text(formData.get("projectId"));
  const toolId = text(formData.get("toolId"));
  const note = checkUseNote(formData.get("note"));
  if (!note.ok) return error(note.message, "note");

  const prisma = db();
  try {
    return await prisma.$transaction(
      async (tx): Promise<FormState> => {
        const project = await tx.project.findFirst({ where: { id: projectId, ownerId: viewer.id }, select: { id: true, ownerId: true, status: true } });
        if (!project) return error(NOT_FOUND);
        const tool = await tx.project.findUnique({
          where: { id: toolId },
          select: { id: true, ownerId: true, status: true, hidden: true, repoUrl: true, owner: { select: { bannedAt: true } } },
        });
        if (!tool || tool.owner.bannedAt) return error("That tool was not found.", "toolId");
        const [existingUses, blocks] = await Promise.all([
          tx.toolbeltUse.findMany({ where: { projectId }, select: { projectId: true, toolId: true, status: true } }),
          tx.toolbeltBlock.findMany({ where: { makerId: tool.ownerId, blockedId: viewer.id }, select: { makerId: true, blockedId: true } }),
        ]);
        const verdict = canEquip({ equipper: { id: viewer.id }, project, tool, existingUses, blocks });
        if (!verdict.ok) return error(verdict.reason, "toolId");
        // A declined row for the same pair is reused (the pair is unique); the use goes back to pending with the new note.
        await tx.toolbeltUse.upsert({
          where: { projectId_toolId: { projectId, toolId } },
          create: { projectId, toolId, note: note.note },
          update: { note: note.note, status: "pending", decidedAt: null, createdAt: new Date() },
        });
        return { status: "saved", message: "Tool equipped. A reviewer confirms it when the project is reviewed." };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    ).then((result) => {
      if (result.status === "saved") refresh(null, projectId);
      return result;
    });
  } catch (e) {
    if (isUniqueViolation(e)) return error("That tool is already equipped in this project.", "toolId");
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034") return error("That changed while you were saving. Try again.");
    throw e;
  }
}

export async function removeToolUse(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const useId = text(formData.get("useId"));
  const use = await db().toolbeltUse.findFirst({ where: { id: useId, project: { ownerId: viewer.id } }, select: { id: true, status: true, projectId: true } });
  if (!use) return error("That tool use was not found.");
  const can = canRemoveUse(use.status);
  if (!can.ok) return error(can.reason);
  await db().toolbeltUse.delete({ where: { id: use.id } });
  refresh(null, use.projectId);
  return { status: "saved", message: "Tool removed." };
}

export async function blockBuilder(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const blockedId = text(formData.get("blockedId"));
  const check = checkBlockTarget(viewer.id, blockedId);
  if (!check.ok) return error(check.reason);
  const target = await db().person.findUnique({ where: { id: blockedId }, select: { id: true } });
  if (!target) return error("That builder was not found.");

  await db().$transaction(async (tx) => {
    await tx.toolbeltBlock.upsert({
      where: { makerId_blockedId: { makerId: viewer.id, blockedId } },
      create: { makerId: viewer.id, blockedId },
      update: {},
    });
    const pending = await tx.toolbeltUse.findMany({
      where: { status: "pending", tool: { ownerId: viewer.id }, project: { ownerId: blockedId } },
      select: { id: true, status: true },
    });
    const ids = pendingToDecline(pending);
    if (ids.length > 0) await tx.toolbeltUse.updateMany({ where: { id: { in: ids } }, data: { status: "declined", decidedAt: new Date() } });
  });
  refresh();
  return { status: "saved", message: "Builder blocked. They can't equip your projects." };
}

export async function unblockBuilder(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const blockedId = text(formData.get("blockedId"));
  if (!blockedId) return error("Choose a builder to unblock.");
  await db().toolbeltBlock.deleteMany({ where: { makerId: viewer.id, blockedId } });
  refresh();
  return { status: "saved", message: "Builder unblocked." };
}
