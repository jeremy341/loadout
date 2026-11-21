"use server";
// Server actions for the People pages: team (reviewers, integrity reviewers, helpers, fulfillers), projects (archive, reject, ban
// lifts, send back, hours correction) and mass builder actions. Same names and call shapes as Pixl's where the page is Pixl's. They
// check the owner role and run Pixl's input rules. Builder bans, lifts and warnings for a real builder are written to the database
// (proposeBan, liftBans and recordViolation in lib/platform/moderation-data.ts). Team changes and project changes are still kept in the
// in-memory sample store (lib/sample/people-data.ts and lib/sample/store.ts), empty again after a restart, and so are sample builders
// (u-<handle>) in development. No message is sent. A handle stands in for a Slack id. LOADOUT rule for bans: a person only PROPOSES a
// ban (proposeBan); a different owner confirms it on the Bans page (actions-moderation.ts).
import { redirect } from "next/navigation";
import { checkReason } from "@/lib/platform/audit";
import { databaseConfigured, db } from "@/lib/platform/db";
import * as live from "@/lib/platform/moderation-data";
import { ownerEmails, readViewer } from "@/lib/platform/session";
import type { ReviewerAccess } from "@/lib/reviewer/access";
import { requirePage } from "../lib/guard";
import {
  AI_DRAFT,
  EDIT_SUBMISSION,
  FRAUD_REVIEW,
  NO_REVIEW,
  REVIEW,
  REVIEW_HARDWARE_ONLY,
  REVIEW_SOFTWARE_ONLY,
  SECOND_PASS,
  type AdminAccess,
  type ReviewQueueScope,
} from "../lib/roles";
import { iso, PROJECTS } from "../lib/sample/index";
import { patchProject, store } from "../lib/sample/store";
import { OWNER_IDS, peopleStore, persistTeamRoleChange, playerEdits } from "../lib/sample/people-data";
import { personKeyFor } from "../lib/sample/role-grants";
import { refererClean, refererPath, withNotice } from "../lib/sample/referer";
import { safeRedirectPath } from "../lib/safeUrl";
import { allBans, allProposals, banLength, changes, nextModerationId } from "../lib/sample/moderation-data";
import { content } from "../lib/sample/content-data";

const NOT_SAVED = "Sample data. Nothing was saved.";
const HANDLE_RE = /^[a-z0-9_.-]{2,40}$/;

const actor = (access: AdminAccess): string => access.session.name;

async function fail(message: string, fallback = "/admins"): Promise<never> {
  return redirect(withNotice(await refererPath(fallback), "error", message));
}

async function stay(fallback: string): Promise<never> {
  return redirect(await refererClean(fallback));
}

async function recordTeamChange(
  access: AdminAccess,
  slackId: string,
  name: string,
  change: string,
  before: string[],
  after: string[],
  reason = "",
): Promise<void> {
  // A per-write stamp, not the sample module's single NOW: two writes in the same process must be orderable so a revocation
  // newer than a grant wins. The overlay is keyed by the person's stable email, never by a display-name slug. When a database is
  // configured the persistence lookup resolves the actual Person, so a real handle resolves to that person's email; the local
  // test-account map is the fallback for sample-only development.
  const fallbackKey = personKeyFor(slackId);
  // The persisted grant and its audit row must carry a written reason of at least ten characters, like every other staff write.
  // Several buttons pass a short label or nothing, so those fall back to the standing team-change reason.
  const checked = checkReason(reason);
  const auditReason = checked.ok ? checked.reason : "Team role change from the Admins page.";
  const person = await persistTeamRoleChange({ personKey: fallbackKey, before, after, actorId: actor(access), reason: auditReason, action: "team.role.change" });
  // Log the stable Person id where there is one. The overlay is keyed by it; the email remains the fallback in sample-only
  // development, where no Person row exists. A display name or handle is never the key.
  const personKey = person?.id ?? fallbackKey;
  peopleStore.nextLogId += 1;
  peopleStore.log.unshift({
    id: peopleStore.nextLogId,
    source: "audit",
    slack_id: slackId,
    person_key: personKey,
    name,
    action: change,
    before,
    after,
    actor: actor(access),
    reason: auditReason,
    created_at: new Date().toISOString(),
  });
}

// Writes the admins row (a row with no permissions is no row), logs the change and persists it to RoleGrant with an audit row.
// Exported for actions-roles.ts, which uses the same path for the full-queue marker.
export async function setTeamPerms(
  access: AdminAccess,
  slackId: string,
  name: string,
  permissions: string[],
  change: string,
  reason = "",
): Promise<void> {
  const existing = peopleStore.admins.get(slackId);
  const before = existing?.permissions ?? [];
  const next = [...new Set(permissions)];
  if (next.length === 0) peopleStore.admins.delete(slackId);
  else
    peopleStore.admins.set(slackId, {
      slack_id: slackId,
      name: name || existing?.name || slackId,
      permissions: next,
      added_by: existing?.added_by || actor(access),
      created_at: existing?.created_at || new Date().toISOString(),
    });
  await recordTeamChange(access, slackId, name || existing?.name || slackId, change, before, next, reason);
}

const isImplicitReviewer = (slackId: string): boolean => OWNER_IDS.includes(slackId);

// ---- Reviewers ----

export async function setSecondPass(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const slackId = String(formData.get("slackId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const enable = formData.get("enable") === "1";
  if (!slackId) return;
  const existing = peopleStore.admins.get(slackId);
  if (enable && !existing?.permissions.includes(REVIEW) && !isImplicitReviewer(slackId)) await fail("Add them as a reviewer first.", `/reviewers/${slackId}`);
  const kept = (existing?.permissions ?? []).filter((p) => p !== SECOND_PASS);
  const already = existing?.permissions.includes(SECOND_PASS) ?? false;
  if (enable !== already)
    await setTeamPerms(access, slackId, name, enable ? [...kept, SECOND_PASS] : kept, enable ? "promoted to final reviewer" : "final reviewer removed");
  await stay(`/reviewers/${slackId}`);
}

export async function setEditSubmission(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const slackId = String(formData.get("slackId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const enable = formData.get("enable") === "1";
  const existing = peopleStore.admins.get(slackId);
  if (!slackId || !existing) return;
  if (enable !== existing.permissions.includes(EDIT_SUBMISSION)) {
    const kept = existing.permissions.filter((p) => p !== EDIT_SUBMISSION);
    await setTeamPerms(access, slackId, name, enable ? [...kept, EDIT_SUBMISSION] : kept, enable ? "edit submission access granted" : "edit submission access removed");
  }
  await stay(`/reviewers/${slackId}`);
}

export async function setAiDraft(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const slackId = String(formData.get("slackId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const enable = formData.get("enable") === "1";
  const existing = peopleStore.admins.get(slackId);
  if (!slackId || !existing) return;
  if (enable !== existing.permissions.includes(AI_DRAFT)) {
    const kept = existing.permissions.filter((p) => p !== AI_DRAFT);
    await setTeamPerms(access, slackId, name, enable ? [...kept, AI_DRAFT] : kept, enable ? "prepared draft note access granted" : "prepared draft note access removed");
  }
  await stay(`/reviewers/${slackId}`);
}

export async function setReviewQueueAccess(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const slackId = String(formData.get("slackId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const scope = String(formData.get("scope") ?? "both") as ReviewQueueScope;
  if (!slackId || !["software", "hardware", "both"].includes(scope)) return;
  const existing = peopleStore.admins.get(slackId);
  const kept = (existing?.permissions ?? []).filter((p) => p !== REVIEW_HARDWARE_ONLY && p !== REVIEW_SOFTWARE_ONLY);
  const marker = scope === "hardware" ? REVIEW_HARDWARE_ONLY : scope === "software" ? REVIEW_SOFTWARE_ONLY : null;
  await setTeamPerms(access, slackId, name, marker ? [...kept, marker] : kept, `review queue access set to ${scope}`);
  await stay(`/reviewers/${slackId}`);
}

export async function messageReviewer(formData: FormData): Promise<void> {
  await requirePage("owner");
  const slackId = String(formData.get("slackId") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim().slice(0, 1500);
  if (!slackId || !message) return;
  const back = `/reviewers/${encodeURIComponent(slackId)}`;
  if (!peopleStore.admins.get(slackId) && !isImplicitReviewer(slackId)) redirect(withNotice(back, "error", "That person isn't on the review team."));
  redirect(withNotice(back, "ok", "Sample data. Nothing was sent."));
}

export async function addReviewer(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const slackId = String(formData.get("slackId") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!HANDLE_RE.test(slackId)) await fail("Enter a valid handle (letters, numbers and underscores).");
  const existing = peopleStore.admins.get(slackId);
  const kept = (existing?.permissions ?? []).filter((p) => p !== NO_REVIEW);
  const implicit = isImplicitReviewer(slackId);
  await setTeamPerms(access, slackId, name, implicit ? kept : [...kept, REVIEW], existing ? "updated" : "added");
  await stay("/reviewers");
}

export async function removeReviewer(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const slackId = String(formData.get("slackId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (!slackId || !reason) return;
  const existing = peopleStore.admins.get(slackId);
  const implicit = isImplicitReviewer(slackId);
  if (!existing && !implicit) return;
  await setTeamPerms(access, slackId, existing?.name ?? "", implicit ? [NO_REVIEW] : [], "removed", reason);
  redirect("/reviewers");
}

// ---- Integrity reviewers (Pixl: fraud reviewers), helpers, fulfillers ----

export async function addFraudReviewer(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const slackId = String(formData.get("slackId") ?? "").trim().toLowerCase();
  if (!HANDLE_RE.test(slackId)) await fail("Enter a valid handle (letters, numbers and underscores).");
  const existing = peopleStore.admins.get(slackId);
  if (!existing?.permissions.includes(FRAUD_REVIEW)) await setTeamPerms(access, slackId, "", [...(existing?.permissions ?? []), FRAUD_REVIEW], "integrity reviewer added");
  await stay("/admins");
}

export async function removeFraudReviewer(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const slackId = String(formData.get("slackId") ?? "").trim();
  const existing = peopleStore.admins.get(slackId);
  if (slackId && existing?.permissions.includes(FRAUD_REVIEW))
    await setTeamPerms(access, slackId, existing.name, existing.permissions.filter((p) => p !== FRAUD_REVIEW), "integrity reviewer removed");
  await stay("/admins");
}

export async function addHelperAction(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const slackId = String(formData.get("slackId") ?? "").trim().toLowerCase();
  if (!HANDLE_RE.test(slackId)) await fail("Enter a valid handle (letters, numbers and underscores).");
  peopleStore.helpers.set(slackId, { slack_user_id: slackId, created_at: iso(0) });
  await recordTeamChange(access, slackId, slackId, "helper added", [], ["helper"]);
  await stay("/admins");
}

export async function removeHelperAction(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const slackId = String(formData.get("slackId") ?? "").trim();
  if (slackId && peopleStore.helpers.delete(slackId)) await recordTeamChange(access, slackId, slackId, "helper removed", ["helper"], []);
  await stay("/admins");
}

export async function addFulfillerAction(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const slackId = String(formData.get("slackId") ?? "").trim().toLowerCase();
  if (!HANDLE_RE.test(slackId)) await fail("Enter a valid handle (letters, numbers and underscores).");
  peopleStore.fulfillers.set(slackId, { slack_user_id: slackId, created_at: iso(0) });
  await recordTeamChange(access, slackId, slackId, "fulfiller added", [], ["fulfiller"]);
  await stay("/admins");
}

export async function removeFulfillerAction(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const slackId = String(formData.get("slackId") ?? "").trim();
  if (slackId && peopleStore.fulfillers.delete(slackId)) await recordTeamChange(access, slackId, slackId, "fulfiller removed", ["fulfiller"], []);
  redirect(await refererPath("/admins").then((path) => (path.startsWith("/fulfillers/") ? "/admins" : path)));
}

export async function undoTeamChange(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const id = Number(formData.get("id") ?? 0);
  const row = peopleStore.log.find((entry) => entry.id === id);
  if (!id || !row || !row.slack_id) return;
  const match = row.action.match(/^(helper|fulfiller) (added|removed)$/);
  if (match) {
    const list = match[1] === "helper" ? peopleStore.helpers : peopleStore.fulfillers;
    if (match[2] === "added") list.delete(row.slack_id);
    else list.set(row.slack_id, { slack_user_id: row.slack_id, created_at: iso(0) });
    await recordTeamChange(access, row.slack_id, row.name, "undo", row.after, row.before);
  } else {
    await setTeamPerms(access, row.slack_id, row.name, row.before, "undo");
  }
  await stay("/admins");
}

// ---- Projects ----

const projectId = (formData: FormData): number => Number(formData.get("projectId") ?? 0);
const projectPage = (id: number): string => `/projects/${id}`;
const known = (id: number): boolean => PROJECTS.some((row) => row.id === id);

export async function archiveProject(formData: FormData): Promise<void> {
  await requirePage("owner");
  const id = projectId(formData);
  if (!id || !known(id)) return;
  patchProject(id, { archived_at: formData.get("unarchive") === "1" ? null : iso(0) });
  redirect(projectPage(id));
}

export async function rejectProject(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const id = projectId(formData);
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000);
  if (!id || !known(id)) return;
  if (!reason) redirect(withNotice(projectPage(id), "error", "A reason is required to reject a project."));
  patchProject(id, { rejected_at: iso(0), reject_reason: reason, reject_by: actor(access) });
  redirect(projectPage(id));
}

export async function unrejectProject(formData: FormData): Promise<void> {
  await requirePage("owner");
  const id = projectId(formData);
  if (!id || !known(id)) return;
  patchProject(id, { rejected_at: null, reject_reason: "", reject_by: "" });
  redirect(projectPage(id));
}

export async function unbanProject(formData: FormData): Promise<void> {
  await requirePage("owner");
  const id = projectId(formData);
  if (!id || !known(id)) return;
  patchProject(id, { banned_at: null, ban_reason: "", ban_by: "" });
  redirect(projectPage(id));
}

export async function reReviewProject(formData: FormData): Promise<void> {
  await requirePage("owner");
  const id = projectId(formData);
  const row = PROJECTS.find((p) => p.id === id);
  if (!row) return;
  const status = store.overrides.get(id)?.status ?? row.status;
  if (status === "approved" || status === "needs_changes")
    patchProject(id, { status: "shipped", review_note: "", review_note_by: "", approved_hours: null, reviewing_by: "", reviewing_at: null });
  redirect(projectPage(id));
}

export async function deflateProjectHours(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const id = projectId(formData);
  if (!id || !known(id)) return;
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000);
  if (!reason) redirect(withNotice(projectPage(id), "error", "A reason is required to change hours."));
  const raw = String(formData.get("hours_owner") ?? "").trim();
  if (raw) {
    const hours = Math.round(Number(raw) * 10) / 10;
    if (!Number.isFinite(hours) || hours < 0) redirect(withNotice(projectPage(id), "error", "Hours must be a number of 0 or more."));
    patchProject(id, { approved_hours: hours, deflation_reason: reason, hours_deflated_at: iso(0), hours_deflated_by: actor(access) });
  }
  redirect(projectPage(id));
}

// ---- Builders (route /players) ----

const BAN_DAYS = [1, 7, 30, 0] as const;
const MASS_LIFT_REASON = "Lifted from the builders list.";
const PAGE_LIFT_REASON = "Lifted from the builder's page.";

// Where a builder action is written. A builder with a Person row is written to the database through the moderation data layer, which
// checks the rule and writes the audit row. A sample builder (u-<handle>) with no Person row stays in the sample store, in development
// only. Without a database in production, nothing is written and the action says so.
type BuilderTarget =
  | { kind: "db"; personId: string; access: ReviewerAccess; actorId: string }
  | { kind: "sample" }
  | { kind: "none"; message: string };

async function builderTarget(userId: string): Promise<BuilderTarget> {
  if (databaseConfigured()) {
    const handle = userId.replace(/^u-/, "");
    const person = await db().person.findFirst({ where: { OR: [{ id: userId }, { handle }] }, select: { id: true } });
    if (person) {
      const viewer = await readViewer();
      if (!viewer?.access) return { kind: "none", message: "Sign in again to make this change." };
      return { kind: "db", personId: person.id, access: viewer.access, actorId: viewer.id };
    }
  }
  if (process.env.NODE_ENV === "development") return { kind: "sample" };
  return { kind: "none", message: "That builder has no account here, so nothing was saved." };
}

// Proposes a ban for one builder. Returns an error text, or null when the proposal was made. Shared by the single form and the mass action.
// The sample branch (development, sample builders only) reads the sample store; the database branch checks the same rules in the data layer.
async function propose(access: AdminAccess, userId: string, reason: string, days: number): Promise<string | null> {
  if (!reason) return "A ban reason is required.";
  if (!(BAN_DAYS as readonly number[]).includes(days)) return "Pick 1 day, 7 days, 30 days or permanent.";
  const target = await builderTarget(userId);
  if (target.kind === "none") return target.message;
  if (target.kind === "db") {
    // Permanent is 0 here and null in the data layer. The owner check is made there too (ownerEmails()).
    const result = await live.proposeBan({
      access: target.access,
      actorId: target.actorId,
      subjectId: target.personId,
      ownerEmails: ownerEmails(),
      reason,
      days: days || null,
    });
    return result.ok ? null : result.message;
  }
  const now = Date.now();
  if (allBans().some((b) => b.user_id === userId && !b.lifted_at && (!b.expires_at || Date.parse(b.expires_at) > now))) return "This builder is already banned.";
  if (allProposals().some((p) => p.user_id === userId && p.status === "pending")) return "A ban for this builder is already waiting for an owner.";
  const id = nextModerationId();
  const handle = userId.replace(/^u-/, "");
  changes.proposed.unshift({
    id,
    user_id: userId,
    reason,
    days,
    proposed_by: access.session.slackId,
    status: "pending",
    decided_by: null,
    decided_at: null,
    ban_id: null,
    created_at: iso(0),
    users: { id: userId, display_name: handle, real_name: "" },
  });
  changes.log.unshift({
    id: id * 10 + 2,
    user_id: userId,
    action: "propose",
    detail: `${banLength(days)}, ${reason}`,
    actor: access.session.slackId,
    created_at: iso(0),
    player_name: handle,
  });
  return null;
}

// Lifts every open ban on one builder. Returns how many were lifted (0 when there were none), or an error text.
async function lift(access: AdminAccess, userId: string, reason: string): Promise<{ lifted: number; message?: string }> {
  const target = await builderTarget(userId);
  if (target.kind === "none") return { lifted: 0, message: target.message };
  if (target.kind === "db") {
    const result = await live.liftBans({ access: target.access, actorId: target.actorId, personId: target.personId, reason });
    return result.ok ? { lifted: result.lifted } : { lifted: 0, message: result.message };
  }
  const now = iso(0);
  let lifted = 0;
  for (const ban of allBans()) {
    if (ban.user_id !== userId || ban.lifted_at) continue;
    if (ban.expires_at && Date.parse(ban.expires_at) <= Date.now()) continue;
    changes.lifted.set(ban.id, now);
    lifted += 1;
  }
  if (lifted > 0)
    changes.log.unshift({
      id: nextModerationId() * 10 + 1,
      user_id: userId,
      action: "unban",
      detail: lifted === 1 ? "Ban lifted" : `${lifted} bans lifted`,
      actor: access.session.slackId,
      created_at: now,
      player_name: userId.replace(/^u-/, ""),
    });
  return { lifted };
}

// Records a warning on a builder's record (a violation in the database, under the Other rule). Returns an error text, or null.
async function warn(access: AdminAccess, userId: string, text: string): Promise<string | null> {
  const target = await builderTarget(userId);
  if (target.kind === "none") return target.message;
  if (target.kind === "db") {
    const result = await live.recordViolation({ access: target.access, actorId: target.actorId, personId: target.personId, kind: "Other", note: text });
    return result.ok ? null : result.message;
  }
  changes.log.unshift({
    id: nextModerationId() * 10 + 3,
    user_id: userId,
    action: "warn",
    detail: text,
    actor: access.session.slackId,
    created_at: iso(0),
    player_name: userId.replace(/^u-/, ""),
  });
  return null;
}

const WARN_DEFAULT = "A friendly heads-up: please keep to the LOADOUT community rules. Be kind, ship your own work, and keep it safe.";

export async function massPlayerAction(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const action = String(formData.get("massAction") ?? "");
  if (!["warn", "notify", "ban", "unban"].includes(action)) return;
  const back = safeRedirectPath(formData.get("back"), "/players");
  const ids = [...new Set(formData.getAll("userIds").map(String).filter(Boolean))];
  const message = String(formData.get("message") ?? "").trim().slice(0, 1000);
  const days = Number(formData.get("days") ?? 0);
  const bounce = (text: string): never => redirect(withNotice(back, "error", text));
  if (ids.length === 0) bounce("Select at least one builder first.");
  if (ids.length > 100) bounce("Mass actions are capped at 100 builders at a time.");
  if (action === "ban" && !message) bounce("A ban reason is required.");
  if (action === "notify" && !message) bounce("A message is required to notify builders.");
  const plural = (n: number) => `${n} builder${n === 1 ? "" : "s"}`;
  if (action === "ban") {
    // Proposals only: an owner other than you confirms each one on the Bans page.
    const skipped: string[] = [];
    let made = 0;
    for (const id of ids) {
      const problem = await propose(access, id, message, days);
      if (problem) skipped.push(id.replace(/^u-/, ""));
      else made += 1;
    }
    const tail = skipped.length > 0 ? ` Skipped ${skipped.length} (already banned or already proposed).` : "";
    redirect(withNotice(back, "done", `Proposed a ban for ${plural(made)}. A different owner confirms each one on Bans.${tail}`));
  }
  if (action === "unban") {
    let lifted = 0;
    for (const id of ids) if ((await lift(access, id, MASS_LIFT_REASON)).lifted > 0) lifted += 1;
    redirect(withNotice(back, "done", `Lifted bans for ${plural(lifted)}.`));
  }
  if (action === "warn") {
    let warned = 0;
    for (const id of ids) if (!(await warn(access, id, message || WARN_DEFAULT))) warned += 1;
    const failed = ids.length - warned;
    if (failed > 0) redirect(withNotice(back, "error", `Warned ${plural(warned)}. ${failed} could not be warned, so nothing was saved for them.`));
    redirect(withNotice(back, "done", `Warned ${plural(warned)}.`));
  }
  redirect(withNotice(back, "done", `Notified ${plural(ids.length)}. ${NOT_SAVED}`));
}

export async function updatePlayerInfo(formData: FormData): Promise<void> {
  await requirePage("owner");
  const userId = String(formData.get("userId") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim().slice(0, 60);
  if (!userId) return;
  if (!displayName) redirect(withNotice(`/players/${userId}`, "error", "The display name can't be empty."));
  playerEdits.set(userId, {
    display_name: displayName,
    email: String(formData.get("email") ?? "").trim().slice(0, 200) || null,
  });
  await stay(`/players/${userId}`);
}

// Nothing is erased: the account stays, and the page says so.
export async function deletePlayerAccount(formData: FormData): Promise<void> {
  await requirePage("owner");
  const userId = String(formData.get("userId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!userId) return;
  if (!reason) redirect(withNotice(`/players/${userId}`, "error", "A reason is required."));
  redirect(withNotice("/players", "done", `Sample data. Nothing was erased.`));
}

// ---- Player and idea moderation (the forms in app/_components/Moderate.tsx) ----
// They write into the moderation and content in-memory stores, so a ban shows on the Bans page and a removed idea on Ideas.

export async function warnPlayer(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const userId = String(formData.get("userId") ?? "");
  const text = String(formData.get("message") ?? "").trim().slice(0, 1000) || WARN_DEFAULT;
  if (!userId) return;
  const problem = await warn(access, userId, text);
  if (problem) await fail(problem, `/players/${userId}`);
  redirect(withNotice(await refererClean(`/players/${userId}`), "ok", "Warning recorded. It shows on the builder's page."));
}

// A ban is proposed here, never made: a different owner confirms it on the Bans page (Proposed).
export async function proposeBan(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const userId = String(formData.get("userId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000);
  const days = Number(formData.get("days") ?? 0);
  if (!userId) return;
  const problem = await propose(access, userId, reason, days);
  if (problem) await fail(problem, `/players/${userId}`);
  redirect(withNotice(await refererClean(`/players/${userId}`), "ok", "Ban proposed. A different owner confirms it on Bans, under Proposed."));
}

export async function liftBan(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;
  const result = await lift(access, userId, PAGE_LIFT_REASON);
  if (result.message) await fail(result.message, `/players/${userId}`);
  redirect(withNotice(await refererClean(`/players/${userId}`), "ok", "Ban lifted."));
}

export async function banIdea(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const ideaId = Number(formData.get("ideaId") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000);
  const returnTo = safeRedirectPath(formData.get("returnTo"), "/ideas");
  if (!ideaId) return;
  if (!reason) redirect(withNotice(returnTo, "error", "A reason is required to remove an idea."));
  const idea = content.ideas.find((row) => row.id === ideaId);
  if (idea) Object.assign(idea, { banned_at: iso(0), ban_reason: reason, ban_by: actor(access) });
  redirect(returnTo);
}

export async function unbanIdea(formData: FormData): Promise<void> {
  await requirePage("owner");
  const ideaId = Number(formData.get("ideaId") ?? 0);
  if (!ideaId) return;
  const idea = content.ideas.find((row) => row.id === ideaId);
  if (idea) Object.assign(idea, { banned_at: null, ban_reason: "", ban_by: "" });
  redirect(await refererClean("/ideas"));
}
