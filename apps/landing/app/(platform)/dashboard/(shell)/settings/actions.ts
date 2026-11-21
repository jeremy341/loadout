"use server";

// Server actions for the Settings page: API keys and privacy. Each one re-checks the signed-in viewer (requireViewer) and
// never takes a person id from the client. The rules live in lib/platform/api-keys.ts and privacy.ts.
//
//   createKey({ name, scopes, expiry })  expiry is "never" | "30" | "90" | "365"; returns the plaintext key ONCE
//   revokeKey(id)
//   setVisibility(on)
//   requestDeletion(typedHandle)         the typed handle must match the person's own handle
//   cancelDeletion()
import { revalidatePath } from "next/cache";
import { checkExpiry } from "@/lib/platform/api-keys";
import { createApiKey, revokeApiKey } from "@/lib/platform/api-keys-data";
import { db } from "@/lib/platform/db";
import { cancelErasure, requestErasure, setStatsVisible } from "@/lib/platform/privacy-data";
import { requireViewer } from "@/lib/platform/session";

const PATH = "/dashboard/settings";
const DAY_MS = 86_400_000;
const EXPIRY_DAYS: Record<string, number> = { "30": 30, "90": 90, "365": 365 };

export type KeyResult =
  | { ok: true; plaintext: string }
  | { ok: false; message: string };
export type Result = { ok: true } | { ok: false; message: string };
export type DeleteResult = { ok: true; scheduledFor: string } | { ok: false; message: string };

export async function createKey(input: { name: unknown; scopes: unknown; expiry: unknown }): Promise<KeyResult> {
  const viewer = await requireViewer();
  const days = typeof input.expiry === "string" ? EXPIRY_DAYS[input.expiry] : undefined;
  if (input.expiry !== "never" && days === undefined) return { ok: false, message: "Choose when the key expires." };
  const now = new Date();
  const expiresAt = days === undefined ? null : new Date(now.getTime() + days * DAY_MS);
  const checked = checkExpiry(expiresAt, now);
  if (!checked.ok) return { ok: false, message: checked.message };
  const made = await createApiKey(viewer.id, input.name, input.scopes, expiresAt, now);
  revalidatePath(PATH);
  if (!made.ok) return { ok: false, message: made.message };
  return { ok: true, plaintext: made.plaintext };
}

export async function revokeKey(id: unknown): Promise<Result> {
  const viewer = await requireViewer();
  if (typeof id !== "string" || id.length === 0 || id.length > 64) return { ok: false, message: "That key was not found or is already revoked." };
  const done = await revokeApiKey(viewer.id, id);
  revalidatePath(PATH);
  return done.ok ? { ok: true } : { ok: false, message: done.message };
}

export async function setVisibility(on: unknown): Promise<Result> {
  const viewer = await requireViewer();
  if (typeof on !== "boolean") return { ok: false, message: "That choice was not understood." };
  const done = await setStatsVisible(viewer.id, on);
  revalidatePath(PATH);
  return done.ok ? { ok: true } : { ok: false, message: done.message };
}

export async function requestDeletion(typedHandle: unknown): Promise<DeleteResult> {
  const viewer = await requireViewer();
  const person = await db().person.findUnique({ where: { id: viewer.id }, select: { handle: true, email: true } });
  // A person with no handle yet types their email address instead.
  const expected = person?.handle ?? person?.email ?? "";
  const typed = typeof typedHandle === "string" ? typedHandle.trim().replace(/^@/, "") : "";
  if (expected === "" || typed.toLowerCase() !== expected.toLowerCase()) {
    return { ok: false, message: `Type ${expected ? `“${expected}”` : "your handle"} exactly to confirm.` };
  }
  const done = await requestErasure(viewer.id);
  revalidatePath(PATH);
  return done.ok ? { ok: true, scheduledFor: done.scheduledFor.toISOString() } : { ok: false, message: done.message };
}

export async function cancelDeletion(): Promise<Result> {
  const viewer = await requireViewer();
  const done = await cancelErasure(viewer.id);
  revalidatePath(PATH);
  return done.ok ? { ok: true } : { ok: false, message: done.message };
}
