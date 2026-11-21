"use server";

// Follow, unfollow, block and unblock for a builder's profile. They take (previous state, FormData) like the other platform
// actions. The only field is "handle"; the person acting is always the signed-in viewer, so nobody can act for someone else.
// Blocking removes follows both ways and the pending invites and idea applications between the two (see blocks-data.ts).
import { revalidatePath } from "next/cache";
import type { FormState } from "@/lib/platform/actions";
import { blockBuilder, unblockBuilder } from "@/lib/platform/blocks-data";
import { followBuilder, unfollowBuilder } from "@/lib/platform/follows-data";
import { requireViewer } from "@/lib/platform/session";

type Result = { ok: true } | { ok: false; message: string };

async function run(formData: FormData, saved: string, act: (viewerId: string, handle: string) => Promise<Result>): Promise<FormState> {
  const viewer = await requireViewer();
  const raw = formData.get("handle");
  const handle = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (handle === "") return { status: "error", message: "That builder was not found." };
  const result = await act(viewer.id, handle);
  if (!result.ok) return { status: "error", message: result.message };
  revalidatePath(`/dashboard/builders/${handle}`);
  return { status: "saved", message: saved };
}

export async function followAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return run(formData, "Following.", followBuilder);
}

export async function unfollowAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return run(formData, "Unfollowed.", unfollowBuilder);
}

export async function blockAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return run(formData, "Blocked.", blockBuilder);
}

export async function unblockAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return run(formData, "Unblocked.", unblockBuilder);
}
