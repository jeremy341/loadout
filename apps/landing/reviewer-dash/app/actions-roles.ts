"use server";
// Team controls the Pixl port lacks a button for (R roles): the full-queue marker. Same shape as the other team actions in
// actions-people.ts: owner only, written to the in-memory team roster and its log, nothing real. getAccess (lib/guard.ts) reads that
// log, so the change takes effect for that person on their next request.
import { redirect } from "next/navigation";
import { requirePage } from "../lib/guard";
import { FULL_QUEUE } from "../lib/roles";
import { iso } from "../lib/sample/index";
import { peopleStore } from "../lib/sample/people-data";

export async function setFullQueue(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const slackId = String(formData.get("slackId") ?? "").trim();
  const enable = formData.get("enable") === "1";
  const existing = peopleStore.admins.get(slackId);
  if (!slackId || !existing) return;
  if (enable !== existing.permissions.includes(FULL_QUEUE)) {
    const before = existing.permissions;
    const after = enable ? [...before, FULL_QUEUE] : before.filter((permission) => permission !== FULL_QUEUE);
    peopleStore.admins.set(slackId, { ...existing, permissions: after });
    peopleStore.nextLogId += 1;
    peopleStore.log.unshift({
      id: peopleStore.nextLogId,
      source: "audit",
      slack_id: slackId,
      name: existing.name,
      action: enable ? "full queue access granted" : "full queue access removed",
      before,
      after,
      actor: access.session.name,
      reason: "",
      created_at: iso(0),
    });
  }
  redirect(`/reviewers/${slackId}`);
}
