"use server";

// Server actions for the builder side of shipping. Same shape as journal-actions.ts: (previous state, FormData) -> FormState.
// A signed in, active builder is required and the owner check is part of every query. Nothing here approves anything, writes a
// ledger row or touches a reviewer field except to clear the note on an unsubmit: approval is the review desk's job.
// Each status change is one updateMany that also names the status it expects, so a reviewer picking the ship up at the same
// moment makes the change fail with "project state changed" instead of overwriting it.
// Form fields:
//   submitShip     projectId, attested ("on" when ticked), changeNote (a resubmit or an update ship)
//   unsubmitShip   projectId
//   requestUpdate  projectId
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import type { FormState } from "./actions";
import { runDoubleDipCheck } from "./fraud/double-dip-data";
import { db } from "./db";
import { eligibilityRefusal } from "./eligibility-gate";
import { listJournal } from "./journal-data";
import { shipJournals } from "./media-data";
import { uploadsEnabled } from "./uploads";
import { fetchGithubReadme } from "./readme-source";
import { checkShip, needsChangeNote } from "./ship-gate";
import { builderMove, canonicalStatus } from "./ship";
import { requireViewer } from "./session";

const text = (value: FormDataEntryValue | null): string => (typeof value === "string" ? value : "");
const error = (message: string, field?: string): FormState => ({ status: "error", message, field });
const NOT_FOUND = "That project was not found.";
const CHANGED = "This project changed while you were working. Reload the page and try again.";

function refresh(projectId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
}

const FIELD_FOR_CODE: Record<string, string> = { attestation_required: "attested", change_note_required: "changeNote" };

export async function submitShip(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const project = await db().project.findFirst({
    where: { id: text(formData.get("projectId")), ownerId: viewer.id },
    select: { id: true, status: true, description: true, track: true, repoUrl: true, demoUrl: true, isUpdate: true, resubmitCount: true, approvedMinutes: true, firstShippedAt: true },
  });
  if (!project) return error(NOT_FOUND);

  const move = builderMove(project.status, "submitted");
  if (!move) return error("This project can't be submitted right now. It is already with a reviewer, approved or banned.");

  const now = new Date();
  const journals = await listJournal(project.id);
  const changeNote = text(formData.get("changeNote"));
  const check = checkShip(project, await shipJournals(journals), now, {
    uploadsOn: uploadsEnabled(),
    eligibilityRefusal: await eligibilityRefusal(viewer),
    readmeText: await fetchGithubReadme(project.repoUrl),
    attested: text(formData.get("attested")) === "on",
    changeNote,
    priorApprovedMinutes: project.approvedMinutes,
  });
  if (!check.ok) {
    const first = check.blockers[0];
    const more = check.blockers.length - 1;
    const message = more > 0 ? `${first.message} ${more} more ${more === 1 ? "thing needs" : "things need"} fixing.` : first.message;
    return error(message, FIELD_FOR_CODE[first.code]);
  }

  const noted = needsChangeNote({ ...project, status: canonicalStatus(project.status) });
  const result = await db().project.updateMany({
    where: { id: project.id, ownerId: viewer.id, status: project.status },
    data: {
      status: "submitted",
      submittedAt: now,
      statusChangedAt: now,
      ...(move === "resubmit" ? { resubmitCount: { increment: 1 }, reshippedAt: now } : {}),
      ...(project.firstShippedAt ? {} : { firstShippedAt: now }),
      changeNote: noted ? changeNote.replace(/\s+/g, " ").trim() : null,
    },
  });
  if (result.count === 0) return error(CHANGED);
  // Double-dip evidence (lib/platform/fraud): compare the links with earlier credited work and leave a FraudCheck row for the desk.
  // It runs after the response so the archive lookup never makes the builder wait, and a failure here never fails the submit.
  try {
    after(() => runDoubleDipCheck(project.id));
  } catch {
    // after() outside a request scope throws; the check is evidence only, so the submit stands.
  }
  refresh(project.id);
  return { status: "saved", message: "Submitted. A reviewer will pick it up." };
}

// Take a ship back. Only while it is plain submitted: once a reviewer has it, it is theirs until they decide.
export async function unsubmitShip(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const projectId = text(formData.get("projectId"));
  const project = await db().project.findFirst({ where: { id: projectId, ownerId: viewer.id }, select: { id: true, status: true } });
  if (!project) return error(NOT_FOUND);
  if (builderMove(project.status, "draft") !== "unsubmit") return error("A reviewer already has this project, so it can't be taken back.");

  const result = await db().project.updateMany({
    where: { id: project.id, ownerId: viewer.id, status: "submitted" },
    data: { status: "draft", submittedAt: null, statusChangedAt: new Date(), reviewNote: null },
  });
  if (result.count === 0) return error("A reviewer already has this project, so it can't be taken back.");
  refresh(project.id);
  return { status: "saved", message: "Taken back. The project is a draft again." };
}

// An approved project opens again as a draft for an update ship. The earlier approval stays banked (review-rules.md section 6).
export async function requestUpdate(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const projectId = text(formData.get("projectId"));
  const project = await db().project.findFirst({ where: { id: projectId, ownerId: viewer.id }, select: { id: true, status: true } });
  if (!project) return error(NOT_FOUND);
  if (builderMove(project.status, "draft") !== "update") return error("Only an approved project can be opened for an update.");

  const result = await db().project.updateMany({
    where: { id: project.id, ownerId: viewer.id, status: "approved" },
    data: { status: "draft", isUpdate: true, statusChangedAt: new Date(), changeNote: null },
  });
  if (result.count === 0) return error(CHANGED);
  refresh(project.id);
  return { status: "saved", message: "Update opened. Make your changes, then ship again with a note on what changed." };
}
