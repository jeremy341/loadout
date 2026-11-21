"use server";
// The reviewer site's server actions. Same exported names and call shapes as Pixl's app/actions.ts for what the review area
// calls. Each one checks the role, runs the same input rules Pixl runs (feedback required, hours a number, a reason when hours are
// lowered, the audit sections), and then writes NOTHING real: a change is kept in the in-memory sample store
// (reviewer-dash/lib/sample/store.ts), which is empty again when the server restarts. No Slack, Airtable, Pixo or other service
// is called. The layout says "Sample data" once on every page.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireGuidelinesAck, requirePage } from "../lib/guard";
import { MAX_CUSTOM_REVIEW_MACROS, parseCustomReviewMacros } from "../lib/reviewMacros";
import { ackGuidelines, firstPassAccess, getProject, listCollaboratorsForProject, nextReviewId, REVIEW_LOCK_MS, getStaffSettings, saveStaffSettingsRow } from "../lib/db";
import { activeReviewClaim } from "../lib/reviewClaimState";
import { buildAuditNote, TECHNICAL_FEATURES_MIN } from "../lib/auditNote";
import { GUIDELINES_SKIP_COOKIE, guidelinesSkipCookieOptions, guidelinesSkipValue, GUIDELINES_VERSION } from "../lib/guidelines";
import { audit } from "../lib/audit";
import { clampReviewPanelWidth } from "../lib/staffSettings";
import { baseProject, staffLabel, JOURNALS } from "../lib/sample/index";
import { patchProject, store, nextSampleId } from "../lib/sample/store";
import { type AdminAccess } from "../lib/roles";
import { queueAllows } from "../lib/reviewAccess";
import type { AiReviewDraft } from "../lib/aiReview";
import type { ProjectRow, ReviewAuditRow } from "../lib/db";
import { refererPath, withNotice } from "../lib/sample/referer";
import { safeRedirectPath } from "../lib/safeUrl";
import type { FormState } from "@/lib/platform/actions";
import {
  addReviewNote,
  claimShip,
  decideJournal,
  heartbeat,
  placeHold,
  recordTriage,
  releaseClaim,
  releaseHold,
  reviewVerdict,
  unshipProject as unshipRealProject,
} from "@/lib/platform/review-actions";
import { isRealId } from "../lib/real";

const back = (id: number): string => `/review/${id}`;
const bounce = (id: number, message: string): never => redirect(`${back(id)}?error=${encodeURIComponent(message)}`);

function current(id: number): ProjectRow | null {
  const base = baseProject(id);
  if (!base) return null;
  return { ...base, ...(store.overrides.get(id) ?? {}) };
}

const nameOf = (access: AdminAccess): string => staffLabel(access.session.slackId);

// ---- Real ships ----
// A ship with a real desk id (Project.seq, 100000 and up) is a database ship: the actions below hand the form to
// lib/platform/review-actions.ts, which checks the person, the stage and the rules again and writes in one transaction. A sample
// ship (a development fixture) keeps the in-memory path under each function.
const IDLE: FormState = { status: "idle" };
const NOT_FOR_REAL = "This isn't available for a real ship yet.";

// Forward the desk's form to a real action. An error bounces back to the ship's page with the message, as Pixl's actions do.
async function real(projectId: number, formData: FormData, action: (prev: FormState, fd: FormData) => Promise<FormState>): Promise<string> {
  const result = await action(IDLE, formData);
  if (result.status === "error") bounce(projectId, result.message);
  return result.status === "saved" ? result.message : "";
}

// Pixl's authorizeProjectAction, for every action that touches one project (R roles). The role gate of the action says who may
// try; this says whether they may do it to THIS ship, again on the server, whatever the page showed:
// - an owner set to not review (no_review) gives no verdicts and takes no claims;
// - a reviewer limited to one queue (reviewQueues) only touches ships of that kind;
// - nobody, owners included, acts on a ship they own or collaborate on (a pending invite counts), unless allowOwn.
async function authorize(access: AdminAccess, projectId: number, opts: { allowOwn?: boolean; ownMessage?: string; needsReviewer?: boolean } = {}): Promise<ProjectRow> {
  const project = current(projectId);
  if (!project) return bounce(projectId, "Project not found.");
  if (opts.needsReviewer !== false && !access.isReviewer) bounce(projectId, "Your account is set to not review.");
  if (!queueAllows(access.reviewQueues, project.kind)) bounce(projectId, "This project isn't in your review queue.");
  if (!opts.allowOwn) {
    const handle = access.session.slackId;
    const data = await getProject(projectId);
    const owns = !!data?.project.users?.slack_id && data.project.users.slack_id === handle;
    const collaborates = (await listCollaboratorsForProject(projectId)).some(
      (c) => (c.status === "accepted" || c.status === "pending") && !!c.users?.slack_id && c.users.slack_id === handle,
    );
    if (owns || collaborates) bounce(projectId, opts.ownMessage ?? "You can't review a project you own or collaborate on.");
  }
  return project;
}

// Every desk action re-checks the guidelines acknowledgement. A page check alone is not enough: a verdict form can be
// invoked without opening the page. The two acknowledgement actions below are the exception, or they could never be reached.
async function requireReviewAction(req: Parameters<typeof requirePage>[0] = "reviewer") {
  const access = await requirePage(req);
  await requireGuidelinesAck(access);
  return access;
}

// ---- Guidelines ----

export async function acknowledgeGuidelines(): Promise<void> {
  const access = await requirePage("reviewer");
  await ackGuidelines(access.session.slackId, GUIDELINES_VERSION);
  redirect("/review");
}

export async function skipGuidelines(): Promise<void> {
  const access = await requirePage("reviewer");
  // A skip is not an acknowledgement: record it, then hand out one short-lived pass that requireGuidelinesAck consumes.
  await audit({
    action: "review.guidelines.skipped",
    result: "ok",
    actorType: "staff",
    actorId: access.session.slackId,
    slackId: access.session.slackId,
    target: "review/guidelines",
    meta: { version: GUIDELINES_VERSION },
  });
  (await cookies()).set(GUIDELINES_SKIP_COOKIE, guidelinesSkipValue(), guidelinesSkipCookieOptions());
  redirect("/review");
}

// ---- Claims ----

export async function beginReviewClaim(formData: FormData): Promise<void> {
  const access = await requireReviewAction("reviewer");
  const id = Number(formData.get("projectId"));
  if (!Number.isSafeInteger(id) || id <= 0) return;
  if (isRealId(id)) {
    await real(id, formData, claimShip);
    redirect(back(id));
  }
  const project = await authorize(access, id);
  if (project.hold_at || project.banned_at) bounce(id, "This project is on hold or banned, so it can't be claimed.");
  const holder = activeReviewClaim(project, Date.now(), REVIEW_LOCK_MS);
  if (holder && holder !== access.session.slackId) bounce(id, `${holder} is already reviewing this.`);
  patchProject(id, { reviewing_by: access.session.slackId, reviewing_at: new Date().toISOString() });
  redirect(back(id));
}

export async function endReviewClaim(formData: FormData): Promise<void> {
  const access = await requireReviewAction("reviewer");
  const id = Number(formData.get("projectId"));
  if (!Number.isSafeInteger(id) || id <= 0) return;
  if (isRealId(id)) {
    await real(id, formData, releaseClaim);
    redirect("/review");
  }
  const project = current(id);
  if (project && project.reviewing_by === access.session.slackId) patchProject(id, { reviewing_by: "", reviewing_at: null });
  redirect("/review");
}

export async function heartbeatReview(projectId: number): Promise<void> {
  const access = await requireReviewAction("reviewer");
  if (isRealId(projectId)) {
    const fd = new FormData();
    fd.set("ship", String(projectId));
    await heartbeat(IDLE, fd);
    return;
  }
  const project = current(projectId);
  if (project && project.reviewing_by === access.session.slackId) patchProject(projectId, { reviewing_at: new Date().toISOString() });
}

export async function releaseReviewClaim(projectId: number): Promise<void> {
  const access = await requireReviewAction("reviewer");
  if (isRealId(projectId)) {
    const fd = new FormData();
    fd.set("ship", String(projectId));
    await releaseClaim(IDLE, fd);
    return;
  }
  const project = current(projectId);
  if (project && project.reviewing_by === access.session.slackId) patchProject(projectId, { reviewing_by: "", reviewing_at: null });
}

// ---- The verdict ----

export async function reviewProject(formData: FormData): Promise<void> {
  const access = await requireReviewAction("reviewer");
  const by = nameOf(access);
  const projectId = Number(formData.get("projectId") ?? 0);
  const verdict = String(formData.get("verdict") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
  if (!projectId || !["approved", "needs_changes", "ban"].includes(verdict)) return;
  if (isRealId(projectId)) return reviewReal(access, projectId, verdict, note, formData);
  const project = await authorize(access, projectId);
  const stage = project.status;
  if (stage === "shipped") {
    const gate = await firstPassAccess(projectId, access.session.slackId, access.canOpenFullQueue);
    if (!gate.ok) bounce(projectId, gate.message);
  }
  if (stage !== "shipped" && stage !== "second_review") bounce(projectId, "This project isn't awaiting review anymore.");
  if (project.banned_at) bounce(projectId, "This project is already banned.");
  if (activeReviewClaim(project, Date.now(), REVIEW_LOCK_MS) !== access.session.slackId)
    bounce(projectId, "Start reviewing first, or reclaim this project if your lock expired.");
  if (stage === "second_review" && !access.isOwner && !access.canSecondPass)
    bounce(projectId, "Only an owner or a final reviewer gives the final verdict, in Second pass.");
  if (!note) bounce(projectId, "Feedback is required for every verdict.");

  const claimedHours = (project.hackatime_seconds ?? 0) / 3600 || JOURNALS.filter((j) => j.project_id === projectId).reduce((s, j) => s + j.hours, 0);
  const hoursRaw = String(formData.get("approvedHours") ?? "").trim();
  let approvedHours: number | null = null;
  if (hoursRaw !== "") {
    const n = Number(hoursRaw);
    if (!Number.isFinite(n) || n < 0) bounce(projectId, "Credited hours must be a number of 0 or more.");
    approvedHours = Math.min(Math.round(n * 10) / 10, Math.round(claimedHours * 10) / 10);
  }
  const auditSectionsRequired = verdict === "approved";
  const technicalFeatures = String(formData.get("technicalFeatures") ?? "").trim();
  if (auditSectionsRequired && technicalFeatures.length < TECHNICAL_FEATURES_MIN)
    bounce(projectId, `Describe concrete technical features you checked (min ${TECHNICAL_FEATURES_MIN} characters).`);
  const deflated = verdict === "approved" && approvedHours != null && approvedHours < Math.round(claimedHours * 10) / 10;
  const deflationReason = String(formData.get("deflationReason") ?? "").trim();
  if (deflated && !deflationReason) bounce(projectId, "Explain why the credited hours were lowered.");
  const notes = String(formData.get("notes") ?? "").trim();
  if (auditSectionsRequired && !notes) bounce(projectId, "Additional notes are required.");
  const auditNote = buildAuditNote({
    "TECHNICAL FEATURES": technicalFeatures,
    "DEFLATION REASON": deflationReason,
    "AGE JUSTIFICATION": String(formData.get("ageJustification") ?? "").trim(),
    NOTES: notes,
  });

  // What the verdict does to the sample row. At first pass an approval parks the ship for a final reviewer (second pass),
  // changes reserve it for this reviewer for three days, and a ban is only a proposal. At the final stage the verdict is final.
  const now = new Date().toISOString();
  const finalStage = stage === "second_review";
  let auditVerdict: ReviewAuditRow["verdict"];
  if (verdict === "approved") {
    auditVerdict = finalStage ? "approved" : "first_pass_approved";
    patchProject(
      projectId,
      finalStage
        ? { status: "approved", approved_hours: approvedHours, review_note: note, review_note_by: by, reviewing_by: "", reviewing_at: null }
        : { status: "second_review", second_pass_verdict: "not_fraud", first_pass_by: by, first_pass_at: now, first_pass_note: note, first_pass_hours: approvedHours, first_pass_verdict: "approved", reviewing_by: "", reviewing_at: null },
    );
  } else if (verdict === "needs_changes") {
    auditVerdict = "needs_changes";
    patchProject(projectId, { status: "needs_changes", review_note: note, review_note_by: by, assigned_reviewer_slack_id: access.session.slackId, assigned_at: now, reviewing_by: "", reviewing_at: null });
  } else if (finalStage && access.isOwner) {
    auditVerdict = "banned";
    patchProject(projectId, { status: "banned", banned_at: now, ban_reason: note, ban_by: by, reviewing_by: "", reviewing_at: null });
  } else {
    auditVerdict = "first_pass_banned";
    patchProject(projectId, { status: "second_review", first_pass_verdict: "banned", first_pass_by: by, first_pass_at: now, first_pass_note: note, reviewing_by: "", reviewing_at: null });
  }
  store.audits.unshift({
    id: nextSampleId(),
    project_id: projectId,
    user_id: project.user_id,
    reviewer: by,
    verdict: auditVerdict,
    note,
    audit_note: auditNote,
    claimed_hours: claimedHours,
    approved_hours: approvedHours,
    repo_opened: formData.get("repoOpened") === "1",
    demo_opened: formData.get("demoOpened") === "1",
    repo_seconds: Number(formData.get("repoSeconds") ?? 0) || 0,
    demo_seconds: Number(formData.get("demoSeconds") ?? 0) || 0,
    total_seconds: Number(formData.get("totalSeconds") ?? 0) || 0,
    created_at: now,
    player_name: "",
    project_name: project.name,
  });

  const next = await nextReviewId({
    viewer: access.session.slackId,
    by,
    canSecondPass: access.canSecondPass,
    isSuper: access.isOwner,
    fullQueue: access.canOpenFullQueue,
    excludeId: projectId,
    prefer: finalStage ? "second_review" : "shipped",
    reviewQueues: access.reviewQueues,
  });
  redirect(next ? back(next) : "/review");
}

// A real ship's verdict. The credited hours are not read from the form: they are what the per-journal decisions kept, which the
// server adds up. The audit sections are the same ones Pixl asks for, and they are saved with the verdict.
async function reviewReal(access: AdminAccess, projectId: number, verdict: string, note: string, formData: FormData): Promise<never> {
  // reviewProject already calls requireReviewAction. Check again here so this deciding path stays gated if it is ever called
  // directly: a verdict form posted without opening the page must not skip the guidelines acknowledgement.
  await requireGuidelinesAck(access);
  if (!note) bounce(projectId, "Feedback is required for every verdict.");
  const technicalFeatures = String(formData.get("technicalFeatures") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (verdict === "approved") {
    if (technicalFeatures.length < TECHNICAL_FEATURES_MIN) bounce(projectId, `Describe concrete technical features you checked (min ${TECHNICAL_FEATURES_MIN} characters).`);
    if (!notes) bounce(projectId, "Additional notes are required.");
  }
  const fd = new FormData();
  fd.set("ship", String(projectId));
  fd.set("verdict", verdict);
  fd.set("note", note);
  fd.set("reasonCode", String(formData.get("changeReason") ?? ""));
  fd.set(
    "auditNote",
    buildAuditNote({
      "TECHNICAL FEATURES": technicalFeatures,
      "DEFLATION REASON": String(formData.get("deflationReason") ?? "").trim(),
      "AGE JUSTIFICATION": String(formData.get("ageJustification") ?? "").trim(),
      NOTES: notes,
    }),
  );
  for (const key of ["repoOpened", "demoOpened", "repoSeconds", "demoSeconds", "totalSeconds"]) fd.set(key, String(formData.get(key) ?? ""));
  await real(projectId, fd, reviewVerdict);
  const next = await nextReviewId({
    viewer: access.session.slackId,
    by: nameOf(access),
    canSecondPass: access.canSecondPass,
    isSuper: access.isOwner,
    fullQueue: access.canOpenFullQueue,
    excludeId: projectId,
    prefer: "shipped",
    reviewQueues: access.reviewQueues,
  });
  redirect(next ? back(next) : "/review");
}

// The fraud triage of the second pass: Fraud or Not fraud, with a note, before any final verdict.
export async function recordSecondPassTriage(formData: FormData): Promise<void> {
  await requireReviewAction("reviewer");
  const projectId = Number(formData.get("projectId") ?? 0);
  if (!projectId) return;
  if (!isRealId(projectId)) bounce(projectId, "A sample ship has no triage to record.");
  await real(projectId, formData, recordTriage);
  redirect(back(projectId));
}

export async function setProjectLevel(formData: FormData): Promise<void> {
  const access = await requireReviewAction("reviewer");
  const projectId = Number(formData.get("projectId") ?? 0);
  const level = Number(formData.get("level") ?? 0);
  if (isRealId(projectId)) bounce(projectId, NOT_FOR_REAL);
  await authorize(access, projectId);
  if (!Number.isInteger(level) || level < 1 || level > 4) bounce(projectId, "Tier must be between 1 and 4.");
  patchProject(projectId, { level });
  redirect(back(projectId));
}

export async function applySubmissionEdits(formData: FormData): Promise<void> {
  const access = await requireReviewAction({ review: "edit_submission" });
  const projectId = Number(formData.get("projectId") ?? 0);
  if (!projectId) return;
  if (!access.canEditSubmission) bounce(projectId, "You can't edit this submission.");
  if (isRealId(projectId)) bounce(projectId, NOT_FOR_REAL);
  await authorize(access, projectId);
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const patch: Partial<ProjectRow> = {};
  if (text("editedName")) patch.name = text("editedName").slice(0, 200);
  if (text("editedRepoUrl")) patch.repo_url = text("editedRepoUrl");
  if (text("editedDemoUrl")) patch.demo_url = text("editedDemoUrl");
  if (text("editedDescription")) patch.description = text("editedDescription").slice(0, 5000);
  patchProject(projectId, patch);
  redirect(back(projectId));
}

export async function generateAiReviewDraftAction(
  projectId: number,
  reviewerHours?: number,
): Promise<{ ok: true; draft: AiReviewDraft } | { ok: false; error: string }> {
  void projectId;
  void reviewerHours;
  await requireReviewAction({ review: "ai_draft" });
  return { ok: false, error: "Sample data. There is no drafting service behind this button." };
}

export async function saveReviewDraft(projectId: number, draft: Record<string, string | number>): Promise<void> {
  const access = await requireReviewAction("reviewer");
  if (!Number.isSafeInteger(projectId) || projectId <= 0) return;
  // A real ship keeps no shared draft yet; the form keeps its own copy in the browser.
  if (isRealId(projectId)) return;
  patchProject(projectId, { review_draft: draft, review_draft_by: nameOf(access), review_draft_at: new Date().toISOString() });
}

export async function dismissReviewerMacroPrompt(): Promise<{ ok: boolean }> {
  const access = await requireReviewAction("reviewer");
  const settings = await getStaffSettings(access.session.slackId);
  return { ok: await saveStaffSettingsRow(access.session.slackId, settings) };
}

export async function saveReviewerMacros(input: unknown): Promise<{ ok: boolean }> {
  const access = await requireReviewAction("reviewer");
  if (!Array.isArray(input) || input.length > MAX_CUSTOM_REVIEW_MACROS) return { ok: false };
  const macros = parseCustomReviewMacros(input);
  if (macros.length !== input.length) return { ok: false };
  const settings = await getStaffSettings(access.session.slackId);
  return {
    ok: await saveStaffSettingsRow(access.session.slackId, {
      ...settings,
      reviewMacros: macros,
      reviewMacroPromptDismissed: settings.reviewMacroPromptDismissed || macros.length > 0,
    }),
  };
}

export async function saveReviewPanelWidth(width: number): Promise<{ ok: boolean }> {
  const access = await requireReviewAction("reviewer");
  const settings = await getStaffSettings(access.session.slackId);
  return { ok: await saveStaffSettingsRow(access.session.slackId, { ...settings, reviewPanelWidth: clampReviewPanelWidth(width) }) };
}

// ---- Journals and notes ----

export async function setJournalHours(formData: FormData): Promise<void> {
  const access = await requireReviewAction("reviewer");
  const journalId = Number(formData.get("journalId") ?? 0);
  const projectId = Number(formData.get("projectId") ?? 0);
  if (!journalId || !projectId) return;
  if (isRealId(projectId)) {
    const fd = new FormData();
    fd.set("ship", String(projectId));
    fd.set("journalSeq", String(journalId));
    fd.set("hours", String(formData.get("hours") ?? ""));
    fd.set("reason", String(formData.get("deflationReason") ?? ""));
    await real(projectId, fd, decideJournal);
    redirect(back(projectId));
  }
  await authorize(access, projectId);
  const entry = JOURNALS.find((j) => j.id === journalId && j.project_id === projectId);
  if (!entry) return;
  const hours = Number(formData.get("hours"));
  if (!Number.isFinite(hours) || hours < 0) bounce(projectId, "Hours must be a number of 0 or more.");
  const kept = Math.min(Math.round(hours * 100) / 100, entry.hours);
  const reason = String(formData.get("deflationReason") ?? "").trim();
  if (kept < entry.hours && !reason) bounce(projectId, "Explain why the hours were lowered.");
  store.journalApprovals.set(journalId, { approved_hours: kept < entry.hours ? kept : null, deflation_reason: kept < entry.hours ? reason : null });
  redirect(back(projectId));
}

export async function addProjectNote(formData: FormData): Promise<void> {
  const access = await requireReviewAction("reviewer");
  const projectId = Number(formData.get("projectId") ?? 0);
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  if (!projectId || !body) return;
  if (isRealId(projectId)) {
    const fd = new FormData();
    fd.set("ship", String(projectId));
    fd.set("body", body);
    await real(projectId, fd, addReviewNote);
    redirect(back(projectId));
  }
  await authorize(access, projectId);
  store.notes.unshift({ id: nextSampleId(), project_id: projectId, author: nameOf(access), body, image_url: null, created_at: new Date().toISOString() });
  redirect(back(projectId));
}

export async function updateSecondPassChecklist(formData: FormData): Promise<void> {
  const access = await requireReviewAction("reviewer");
  const projectId = Number(formData.get("projectId") ?? 0);
  if (!access.canSecondPass) redirect(`/review?error=${encodeURIComponent("Only a final reviewer can update this.")}`);
  if (isRealId(projectId)) bounce(projectId, NOT_FOR_REAL);
  await authorize(access, projectId);
  const field = String(formData.get("field") ?? "");
  const allowed = ["second_pass_telescreen_checked", "second_pass_hours_deflated", "second_pass_heartbeats_added"];
  if (!allowed.includes(field)) return;
  patchProject(projectId, { [field]: formData.get("checked") === "true" } as Partial<ProjectRow>);
  redirect(back(projectId));
}

// ---- Holds, peaks, funding, unship, ban ----

export async function holdReview(formData: FormData): Promise<void> {
  const access = await requireReviewAction("reviewer");
  const projectId = Number(formData.get("projectId") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (!projectId) return;
  if (isRealId(projectId)) {
    await real(projectId, formData, placeHold);
    redirect(back(projectId));
  }
  if (!access.canSecondPass && !access.isOwner) bounce(projectId, "Only a final reviewer can hold a review.");
  await authorize(access, projectId);
  if (!reason) bounce(projectId, "A hold needs a reason.");
  patchProject(projectId, { hold_at: new Date().toISOString(), hold_by: nameOf(access), hold_reason: reason, reviewing_by: "", reviewing_at: null });
  redirect(back(projectId));
}

export async function releaseReviewHold(formData: FormData): Promise<void> {
  const access = await requireReviewAction("reviewer");
  const projectId = Number(formData.get("projectId") ?? 0);
  if (!projectId) return;
  if (isRealId(projectId)) {
    await real(projectId, formData, releaseHold);
    redirect(back(projectId));
  }
  await authorize(access, projectId, { needsReviewer: false });
  patchProject(projectId, { hold_at: null, hold_by: "", hold_reason: "" });
  redirect(back(projectId));
}

export async function toggleProjectPeak(formData: FormData): Promise<void> {
  const access = await requireReviewAction("reviewer");
  const projectId = Number(formData.get("projectId") ?? 0);
  if (!projectId) return;
  if (isRealId(projectId)) bounce(projectId, NOT_FOR_REAL);
  await authorize(access, projectId, { ownMessage: "You can't mark a project you own or collaborate on." });
  patchProject(projectId, { is_peak: formData.get("isPeak") === "1" });
  redirect(await refererPath(back(projectId)));
}

export async function updateFundingAmount(formData: FormData): Promise<void> {
  const access = await requireReviewAction("reviewer");
  const projectId = Number(formData.get("projectId") ?? 0);
  if (!projectId) return;
  if (isRealId(projectId)) bounce(projectId, NOT_FOR_REAL);
  await authorize(access, projectId);
  const usd = Number(formData.get("fundingUsd"));
  if (!Number.isFinite(usd) || usd < 0) bounce(projectId, "Funding must be a number of 0 or more.");
  patchProject(projectId, { funding_usd: usd });
  redirect(back(projectId));
}

export async function unshipProject(formData: FormData): Promise<void> {
  await requireReviewAction("reviewer");
  const projectId = Number(formData.get("projectId") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000);
  if (!projectId) return;
  if (!reason) bounce(projectId, "Say why you are unshipping this.");
  if (isRealId(projectId)) {
    await real(projectId, formData, unshipRealProject);
    redirect("/review");
  }
  patchProject(projectId, { status: "draft", reviewing_by: "", reviewing_at: null });
  redirect("/review");
}

export async function sendBackToFirstPass(formData: FormData): Promise<void> {
  await requireReviewAction("reviewer");
  const projectId = Number(formData.get("projectId") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000);
  if (!projectId) return;
  if (!reason) bounce(projectId, "Say why you are sending this back.");
  if (isRealId(projectId)) bounce(projectId, NOT_FOR_REAL);
  patchProject(projectId, { status: "shipped", second_pass_verdict: null, first_pass_verdict: null, reviewing_by: "", reviewing_at: null });
  redirect("/review");
}

export async function banProject(formData: FormData): Promise<void> {
  const access = await requireReviewAction("owner");
  const projectId = Number(formData.get("projectId") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000);
  if (!projectId) return;
  const returnTo = safeRedirectPath(formData.get("returnTo"), `/projects/${projectId}`);
  if (!reason) redirect(withNotice(returnTo, "error", "A reason is required to ban a project."));
  if (isRealId(projectId)) redirect(withNotice(returnTo, "error", "A real ship is banned with the Ban verdict in its second pass."));
  patchProject(projectId, { banned_at: new Date().toISOString(), ban_reason: reason, ban_by: nameOf(access) });
  redirect(returnTo);
}

// ---- Things LOADOUT has no service for: they accept the form and do nothing ----

async function quiet(formData: FormData, fallback: string): Promise<void> {
  await requireReviewAction("reviewer");
  const projectId = Number(formData.get("projectId") ?? 0);
  redirect(await refererPath(projectId ? back(projectId) : fallback));
}

export async function extendHoursCutoff(formData: FormData): Promise<void> {
  await quiet(formData, "/review");
}

export async function skipRobertPass(formData: FormData): Promise<void> {
  await quiet(formData, "/review");
}

export async function submitHardwareToRobert(formData: FormData): Promise<void> {
  await quiet(formData, "/review");
}

export async function resendToRobert(formData: FormData): Promise<void> {
  await quiet(formData, "/review");
}

export async function bulkRobertAction(formData: FormData): Promise<void> {
  await quiet(formData, "/review/fraud-reviews");
}

export async function claimReviewerFoodGrant(): Promise<void> {
  await requireReviewAction("reviewer");
  redirect(`/review/stats?error=${encodeURIComponent("Sample data. There is no grant to claim.")}`);
}
