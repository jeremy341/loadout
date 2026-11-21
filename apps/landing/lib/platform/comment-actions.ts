"use server";

// Server actions for builder comments on a project, in the shape of lib/platform/kudos-actions.ts: (previous state,
// FormData), a FormState out, revalidate after. The person acting is always the signed-in viewer (requireViewer), so a
// form field cannot make anyone write or delete for someone else. A banned viewer never reaches these (the session refuses
// them), and a banned project is refused by the write itself.
//   addCommentAction     form fields: projectId, body. Writes the comment (comments-data.ts rules: trimmed, not empty,
//                        at most 2000 characters, public projects only).
//   deleteCommentAction  form field: id. Removes the viewer's own comment; anyone else's id does nothing and answers the same.
// Revalidates Explore and the project's own page on the Explore address, where the comment section lives.
import { revalidatePath } from "next/cache";
import type { FormState } from "./actions";
import { addProjectComment, deleteProjectComment } from "./comments-data";
import { requireViewer } from "./session";

const NOT_FOUND: FormState = { status: "error", message: "That project was not found." };

function revalidateProject(projectId: string): void {
  revalidatePath("/dashboard/explore");
  // A delete form carries the project's id with it so its own page is refreshed too; without it the list alone is refreshed.
  if (projectId !== "") revalidatePath(`/dashboard/explore/${projectId}`);
}

export async function addCommentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const rawProjectId = formData.get("projectId");
  const projectId = typeof rawProjectId === "string" ? rawProjectId : "";
  if (projectId === "") return NOT_FOUND;
  const result = await addProjectComment(viewer.id, projectId, formData.get("body"));
  if (!result.ok) return { status: "error", message: result.message };
  revalidateProject(projectId);
  return { status: "saved", message: "Comment posted." };
}

export async function deleteCommentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const rawId = formData.get("id");
  const id = typeof rawId === "string" ? rawId : "";
  if (id === "") return { status: "error", message: "That comment is gone already." };
  const result = await deleteProjectComment(viewer.id, id);
  if (!result.ok) return { status: "error", message: result.message };
  const rawProjectId = formData.get("projectId");
  revalidateProject(typeof rawProjectId === "string" ? rawProjectId : "");
  return { status: "saved", message: "Comment removed." };
}
