"use server";
// Team controls the Pixl port lacks a button for (R roles): the full-queue marker. Same shape as the other team actions in
// actions-people.ts: owner only, written to the in-memory team roster and its log, and persisted to RoleGrant with an audit row
// through the same setTeamPerms path. getAccess (lib/guard.ts) lays that log over readViewer's grants, so the change takes effect
// for that person on their next request; the RoleGrant row is what the superadmin and impersonation gates read.
import { redirect } from "next/navigation";
import { requirePage } from "../lib/guard";
import { FULL_QUEUE } from "../lib/roles";
import { peopleStore } from "../lib/sample/people-data";
import { setTeamPerms } from "./actions-people";

export async function setFullQueue(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const slackId = String(formData.get("slackId") ?? "").trim();
  const enable = formData.get("enable") === "1";
  const existing = peopleStore.admins.get(slackId);
  if (!slackId || !existing) return;
  if (enable !== existing.permissions.includes(FULL_QUEUE)) {
    const before = existing.permissions;
    const after = enable ? [...before, FULL_QUEUE] : before.filter((permission) => permission !== FULL_QUEUE);
    await setTeamPerms(access, slackId, existing.name, after, enable ? "full queue access granted" : "full queue access removed");
  }
  redirect(`/reviewers/${slackId}`);
}
