"use server";

// Server action for kudos on a project. Takes (previous state, FormData) like lib/platform/actions.ts, so a form can use it with
// useActionState, and returns a FormState.
//   toggleKudos   form field: projectId. Gives kudos if the viewer has not, takes them back if they have. One row per person and
//                 project (unique personId + projectId), so calling it twice flips twice. Giving needs an approved, visible project
//                 that is not the viewer's own (canGiveKudos); taking back always works.
//   The state is in the message: "Kudos given." or "Kudos taken back." (status "saved" in both cases).
// Revalidates /dashboard/explore and the project's Explore page.
import { revalidatePath } from "next/cache";
import { Prisma } from "../generated/prisma/client";
import type { FormState } from "./actions";
import { db } from "./db";
import { canGiveKudos } from "./kudos";
import { requireViewer } from "./session";

const NOT_FOUND: FormState = { status: "error", message: "That project was not found." };

export async function toggleKudos(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const raw = formData.get("projectId");
  const projectId = typeof raw === "string" ? raw : "";
  if (projectId === "") return NOT_FOUND;

  const existing = await db().projectKudos.findUnique({ where: { personId_projectId: { personId: viewer.id, projectId } }, select: { id: true } });
  let message: string;
  if (existing) {
    await db().projectKudos.deleteMany({ where: { personId: viewer.id, projectId } });
    message = "Kudos taken back.";
  } else {
    const project = await db().project.findUnique({
      where: { id: projectId },
      select: { ownerId: true, status: true, owner: { select: { bannedAt: true } } },
    });
    if (!project) return NOT_FOUND;
    const verdict = canGiveKudos({
      viewer: { id: viewer.id },
      project: { ownerId: project.ownerId, status: project.status, ownerBanned: project.owner.bannedAt !== null },
    });
    if (!verdict.ok) return { status: "error", message: verdict.reason };
    try {
      await db().projectKudos.create({ data: { personId: viewer.id, projectId } });
    } catch (e) {
      // A second click racing the first: the row exists, which is the state the person asked for.
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    }
    message = "Kudos given.";
  }
  revalidatePath("/dashboard/explore");
  revalidatePath(`/dashboard/explore/${projectId}`);
  return { status: "saved", message };
}
