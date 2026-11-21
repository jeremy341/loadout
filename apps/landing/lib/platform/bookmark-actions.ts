"use server";

// Server action for "Saved" projects. Takes (previous state, FormData) like lib/platform/actions.ts, so a form can use it with
// useActionState, and returns a FormState.
//   toggleBookmark   form field: projectId. Saves the project if it is not saved, removes it if it is. Saving needs a project the
//                    viewer may see (canBookmark), and stops at MAX_BOOKMARKS. Removing always works, even for a project that has
//                    since been hidden. Calling it twice flips twice; the unique (personId, projectId) row keeps it from doubling.
//   The saved state is in the message: "Saved." or "Removed from Saved." (status "saved" in both cases).
// Revalidates /dashboard/explore, the project's Explore page and /dashboard/profile.
import { revalidatePath } from "next/cache";
import { Prisma } from "../generated/prisma/client";
import type { FormState } from "./actions";
import { bookmarkVerdict } from "./discover-data";
import { checkBookmarkLimit } from "./bookmarks";
import { db } from "./db";
import { requireViewer } from "./session";

const NOT_FOUND: FormState = { status: "error", message: "That project was not found." };

export async function toggleBookmark(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const raw = formData.get("projectId");
  const projectId = typeof raw === "string" ? raw : "";
  if (projectId === "") return NOT_FOUND;
  const key = { personId_projectId: { personId: viewer.id, projectId } };

  const existing = await db().projectBookmark.findUnique({ where: key, select: { id: true } });
  let message: string;
  if (existing) {
    await db().projectBookmark.deleteMany({ where: { personId: viewer.id, projectId } });
    message = "Removed from Saved.";
  } else {
    const verdict = await bookmarkVerdict(viewer.id, projectId);
    if (!verdict || !verdict.ok) return NOT_FOUND;
    const limit = checkBookmarkLimit(await db().projectBookmark.count({ where: { personId: viewer.id } }));
    if (!limit.ok) return { status: "error", message: limit.reason };
    try {
      await db().projectBookmark.create({ data: { personId: viewer.id, projectId } });
    } catch (e) {
      // A second click racing the first: the row exists, which is the state the person asked for.
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    }
    message = "Saved.";
  }
  revalidatePath("/dashboard/explore");
  revalidatePath(`/dashboard/explore/${projectId}`);
  revalidatePath("/dashboard/profile");
  return { status: "saved", message };
}
