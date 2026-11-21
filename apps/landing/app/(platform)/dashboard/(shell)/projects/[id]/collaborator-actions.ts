"use server";

// Server actions for project collaborators. The person acting is always the signed-in viewer; the owner and invite rules are in
// lib/platform/collaborators-data.ts. Hours stay per person, so none of this moves hours.
//   inviteAction    fields: projectId, handle.
//   removeAction    fields: projectId, handle.            The owner removes anyone; a collaborator may remove themself.
//   respondAction   fields: projectId, decision ("accept" | "decline").   The invited builder only.
import { revalidatePath } from "next/cache";
import type { FormState } from "@/lib/platform/actions";
import { inviteCollaborator, removeCollaborator, respondToInvite } from "@/lib/platform/collaborators-data";
import { requireViewer } from "@/lib/platform/session";

function text(formData: FormData, name: string): string {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw : "";
}

function refresh(projectId: string) {
  revalidatePath("/dashboard/projects");
  if (/^[A-Za-z0-9_-]{1,64}$/.test(projectId)) revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function inviteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const projectId = text(formData, "projectId");
  const result = await inviteCollaborator(viewer.id, projectId, formData.get("handle"));
  if (!result.ok) return { status: "error", message: result.message };
  refresh(projectId);
  return { status: "saved", message: "Invite sent." };
}

export async function removeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const projectId = text(formData, "projectId");
  const result = await removeCollaborator(viewer.id, projectId, formData.get("handle"));
  if (!result.ok) return { status: "error", message: result.message };
  refresh(projectId);
  return { status: "saved", message: "Removed." };
}

export async function respondAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const projectId = text(formData, "projectId");
  const decision = text(formData, "decision");
  const result = await respondToInvite(viewer.id, projectId, decision);
  if (!result.ok) return { status: "error", message: result.message };
  refresh(projectId);
  return { status: "saved", message: decision === "accept" ? "You joined the project." : "Declined." };
}
