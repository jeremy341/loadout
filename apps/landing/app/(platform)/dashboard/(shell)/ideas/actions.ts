"use server";

// Server actions for Ideas. The person acting is always the signed-in viewer; every rule (limits, own idea, blocks, who may decide)
// lives in lib/platform/ideas-data.ts. Form-style actions return a FormState so a form can use them with useActionState.
//   createIdeaAction     fields: title, body.            Saved with href to the new idea.
//   voteAction           (ideaId, 1 | -1 | 0)             0 takes your vote back. Returns { ok } so a button can roll back.
//   applyAction          fields: ideaId, message.
//   decideAction         fields: applicationId, ideaId, decision ("accept" | "decline").
//   setStatusAction      fields: ideaId, status ("closed" | "open").
import { revalidatePath } from "next/cache";
import { db } from "@/lib/platform/db";
import type { FormState } from "@/lib/platform/actions";
import { applyToIdea, createIdea, decideApplication, setIdeaStatus, voteIdea } from "@/lib/platform/ideas-data";
import { requireViewer } from "@/lib/platform/session";

function text(formData: FormData, name: string): string {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw : "";
}

function refresh(ideaId?: string) {
  revalidatePath("/dashboard/ideas");
  if (ideaId && /^[A-Za-z0-9_-]{1,64}$/.test(ideaId)) revalidatePath(`/dashboard/ideas/${ideaId}`);
}

export async function createIdeaAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const result = await createIdea(viewer.id, { title: formData.get("title"), body: formData.get("body") });
  if (!result.ok) return { status: "error", message: result.message };
  refresh();
  return { status: "saved", message: "Idea shared.", href: `/dashboard/ideas/${result.id}` };
}

// 1 or -1 votes (changing a vote is allowed). 0 removes the vote, which the data layer has no call for, so the row goes here, in the
// viewer's own row only.
export async function voteAction(ideaId: string, value: number): Promise<{ ok: true } | { ok: false; message: string }> {
  const viewer = await requireViewer();
  if (value === 0) {
    if (typeof ideaId !== "string" || ideaId === "") return { ok: false, message: "That idea was not found." };
    await db().ideaVote.deleteMany({ where: { ideaId, personId: viewer.id } });
    refresh(ideaId);
    return { ok: true };
  }
  const result = await voteIdea(viewer.id, ideaId, value);
  if (result.ok) refresh(ideaId);
  return result;
}

export async function applyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const ideaId = text(formData, "ideaId");
  const result = await applyToIdea(viewer.id, ideaId, formData.get("message"));
  if (!result.ok) return { status: "error", message: result.message };
  refresh(ideaId);
  return { status: "saved", message: "Sent. The author will see your message." };
}

export async function decideAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const decision = text(formData, "decision");
  const result = await decideApplication(viewer.id, text(formData, "applicationId"), decision);
  if (!result.ok) return { status: "error", message: result.message };
  refresh(text(formData, "ideaId"));
  return { status: "saved", message: decision === "accept" ? "Accepted. The idea is taken." : "Declined." };
}

export async function setStatusAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const status = text(formData, "status");
  const result = await setIdeaStatus(viewer.id, text(formData, "ideaId"), status);
  if (!result.ok) return { status: "error", message: result.message };
  refresh(text(formData, "ideaId"));
  return { status: "saved", message: status === "closed" ? "Closed." : "Reopened." };
}
