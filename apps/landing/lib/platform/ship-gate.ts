// The ship gate: what a builder must have in place before a project can be submitted. Pure: no database, no clock of its own.
// The page draws the checklist from `items`; the server action refuses on `blockers`. Both come from this one function.
//
// API:
//   checkShip(project, journals, now, context?) -> { ok, blockers: [{ code, message }], items: [{ code, label, state, message }], readme }
//   SHIP_CODES                                   every code, in checklist order
//   BUILDER_CODES                                the codes only the dialog can clear (the attestation and the change note)
//   firstTriggerBlocker(result)                  -> the first blocker the dialog cannot clear, or null (disables the page button)
//   needsChangeNote(project)                     true when the ship must carry a change note
//   journalTextLength(body), journalTextNeeded(hours), DESCRIPTION_MIN
//
// Order: status, description, track, source, demo (optional), journal, journal text, 8 hour rule, update minimum (updates only), images (a blocker when uploads are on, else waiting), README,
// eligibility, attestation, change note. Hackatime, Lapse and the bill of materials are marked waiting and never block.
import { entriesOwed, formatHours, journalDue } from "./journal";
import { photosNeeded } from "./journal-writer";
import { checkLinkUrl } from "./profile";
import { TRACKS } from "./progress";
import { checkReadme, MIN_README_WORDS, type ReadmeGate } from "./readme";
import { visibleTextLength } from "./text-evidence";
import { checkChangeNote, updateMinimumMet } from "./review-rules";
import { canonicalStatus, isLocked } from "./ship";

export const DESCRIPTION_MIN = 40;

export type ShipProject = {
  status: string;
  description: string | null;
  track: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  // True while an approved project is open for an update ship.
  isUpdate?: boolean;
  resubmitCount?: number;
};
// photos: how many live photos the entry holds. photoRule: true when the photo rule covers this entry (it was created after uploads
// shipped, see photoRuleApplies in journal-writer.ts). Both are only read when the context says uploads are on.
export type ShipJournal = {
  hours: number;
  body: string;
  photos?: number;
  photoRule?: boolean;
  // Minutes a reviewer decided to keep for an already-reviewed entry. Unreviewed entries leave this undefined and still count
  // their claimed hours, which is what the builder can see and edit.
  keptMinutes?: number | null;
};
export type ShipContext = {
  // The plain refusal from eligibilityRefusal, or null when the builder is eligible. An omitted value fails closed: a caller
  // that forgets to pass the check must not silently mark the builder eligible.
  eligibilityRefusal?: string | null;
  // The "not school work, not paid Hack Club work" tick.
  attested?: boolean;
  // README text once the source link check has fetched it. null or undefined: not available yet.
  readmeText?: string | null;
  changeNote?: string | null;
  // Minutes already approved on this project (an update ship). Only read when project.isUpdate is true; undefined counts as 0.
  priorApprovedMinutes?: number;
  // True when the LOADOUT_UPLOADS flag is on. Off or undefined: the image check only waits and never blocks.
  uploadsOn?: boolean;
};

export const SHIP_CODES = [
  "status_locked",
  "description_required",
  "track_required",
  "source_required",
  "source_invalid",
  "demo_invalid",
  "journal_required",
  "journal_too_short",
  "journal_due",
  "update_minimum",
  "images_waiting",
  "journal_images",
  "readme_missing",
  "readme_too_short",
  "readme_waiting",
  "eligibility_blocked",
  "attestation_required",
  "change_note_required",
  "hackatime_waiting",
  "lapse_waiting",
  "bom_waiting",
] as const;
export type ShipCode = (typeof SHIP_CODES)[number];

// Only the dialog can clear these two (tick the box, write the note), so they must not disable the button that opens it.
export const BUILDER_CODES: readonly ShipCode[] = ["attestation_required", "change_note_required"];

export type ShipBlocker = { code: ShipCode; message: string };
export type ShipItemState = "pass" | "fail" | "waiting";
export type ShipItem = { code: ShipCode; label: string; state: ShipItemState; message: string };
export type ShipCheck = { ok: boolean; blockers: ShipBlocker[]; items: ShipItem[]; readme: ReadmeGate };

// Journal image markdown is evidence, not writing (Pixl journalRules.ts): it does not count toward the text rule.
// Invisible characters and emoji are not writing either, so they cannot pad an entry up to the required length.
export function journalTextLength(body: string): number {
  return visibleTextLength(body);
}
// 100 characters of text per logged hour, never fewer than 100 (Pixl: max(100, round(hours * 100))).
export function journalTextNeeded(hours: number): number {
  return Math.max(100, Math.round((Number.isFinite(hours) ? hours : 0) * 100));
}

// A note is needed when the ship follows a "needs changes", is an update of an approved project, or repeats an earlier resubmit.
export function needsChangeNote(project: Pick<ShipProject, "status" | "isUpdate" | "resubmitCount">): boolean {
  return canonicalStatus(project.status) === "needs-changes" || project.isUpdate === true || (project.resubmitCount ?? 0) > 0;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function checkShip(project: ShipProject, journals: readonly ShipJournal[], _now: Date, context: ShipContext = {}): ShipCheck {
  const items: ShipItem[] = [];
  const add = (code: ShipCode, label: string, state: ShipItemState, message: string) => items.push({ code, label, state, message });

  if (isLocked(project.status)) {
    add("status_locked", "Project can be submitted", "fail", "This project can't be submitted right now. It is already with a reviewer, approved or banned.");
  }

  const description = (project.description ?? "").trim();
  add(
    "description_required",
    "Description written",
    description.length >= DESCRIPTION_MIN ? "pass" : "fail",
    `Write a description of at least ${DESCRIPTION_MIN} characters, so a reviewer knows what the project is before they open it.`,
  );

  add(
    "track_required",
    "Track picked",
    project.track && (TRACKS as readonly string[]).includes(project.track) ? "pass" : "fail",
    "Pick one of the four tracks: Tools, Systems, Compute or Hardware.",
  );

  const repoText = (project.repoUrl ?? "").trim();
  if (repoText === "") {
    add("source_required", "Source code address is a public https address", "fail", "Add the public https address of your source code.");
  } else {
    const repo = checkLinkUrl(repoText, "source link");
    add("source_invalid", "Source code address is a public https address", repo.ok ? "pass" : "fail", repo.ok ? "" : repo.message);
  }

  const demoText = (project.demoUrl ?? "").trim();
  if (demoText !== "") {
    const demo = checkLinkUrl(demoText, "demo link");
    add("demo_invalid", "Demo address is a public https address", demo.ok ? "pass" : "fail", demo.ok ? "" : demo.message);
  }

  add("journal_required", "At least one journal entry", journals.length > 0 ? "pass" : "fail", "Write at least one journal entry about the work.");

  if (journals.length > 0) {
    const short = journals.filter((entry) => journalTextLength(entry.body) < journalTextNeeded(entry.hours));
    add(
      "journal_too_short",
      "Journal entries are long enough",
      short.length === 0 ? "pass" : "fail",
      `${plural(short.length, "journal entry is", "journal entries are")} too short. Each entry needs 100 characters of text for every hour it logs, and at least 100. Images don't count as text.`,
    );
  }

  const total = journals.reduce((sum, entry) => sum + (Number.isFinite(entry.hours) ? entry.hours : 0), 0);
  const owed = entriesOwed(total, journals.length);
  add(
    "journal_due",
    "Journal covers the hours logged",
    owed === 0 ? "pass" : "fail",
    `${formatHours(journalDue(total, journals.length))} are not covered by a journal yet. Write ${plural(owed, "more entry", "more entries")}: one entry covers up to 8 hours.`,
  );

  if (project.isUpdate === true) {
    // Compare what was actually credited on earlier entries with the approval already on the project. Raw claimed hours can
    // exceed kept minutes, which used to let an update pass with no new work.
    const updateTotalMinutes = journals.reduce((sum, entry) => {
      if (Number.isFinite(entry.keptMinutes)) return sum + Math.max(0, entry.keptMinutes as number);
      return sum + (Number.isFinite(entry.hours) ? Math.max(0, entry.hours) * 60 : 0);
    }, 0);
    const rule = updateMinimumMet({ priorApprovedMinutes: context.priorApprovedMinutes ?? 0, totalMinutes: Math.round(updateTotalMinutes) });
    add(
      "update_minimum",
      "At least 2.5 new hours",
      rule.met ? "pass" : "fail",
      `An update needs at least 2.5 new hours of work since the last approval. You have ${formatHours(rule.newMinutes / 60)} so far. Log ${formatHours(rule.missingMinutes / 60)} more and write them up in your journal.`,
    );
  }

  if (context.uploadsOn === true) {
    // One photo per 4 hours an entry logs, at least one, counted to 12 hours. Only entries created after uploads shipped.
    const lacking = journals.filter((entry) => entry.photoRule === true && (entry.photos ?? 0) < photosNeeded(entry.hours));
    add(
      "journal_images",
      "Journal entries have photos",
      lacking.length === 0 ? "pass" : "fail",
      `${plural(lacking.length, "journal entry needs", "journal entries need")} more photos. Add one photo for every 4 hours an entry logs, and at least one.`,
    );
  } else {
    add("images_waiting", "Journal images", "waiting", "Waiting for uploads. Image checks for journal entries start once uploads are connected. This does not block you yet.");
  }

  const readme = checkReadme(context.readmeText);
  if (readme.status === "waiting") {
    add("readme_waiting", "README has 100 words", "waiting", "The README can't be read from this source address yet. It does not block you.");
  } else if (readme.status === "missing") {
    add("readme_missing", "README has 100 words", "fail", "Your source has no README. Add one that explains the project in at least 100 words.");
  } else {
    add(
      "readme_too_short",
      "README has 100 words",
      readme.status === "passed" ? "pass" : "fail",
      `Your README has ${plural(readme.words, "word", "words")} of text. Add more so it reaches ${MIN_README_WORDS} words. Badges, links and code don't count.`,
    );
  }

  const refusal = context.eligibilityRefusal === undefined ? "Eligibility could not be confirmed." : context.eligibilityRefusal;
  add("eligibility_blocked", "Account is eligible", refusal === null ? "pass" : "fail", refusal ?? "");

  add(
    "attestation_required",
    "Not school work and not paid Hack Club work",
    context.attested === true ? "pass" : "fail",
    "Confirm this is not school work and not paid Hack Club work.",
  );

  if (needsChangeNote(project)) {
    const note = checkChangeNote(context.changeNote);
    add("change_note_required", "Change note written", note.ok ? "pass" : "fail", note.ok ? "" : note.message);
  }

  if (project.track === "Hardware") {
    add("lapse_waiting", "Lapse recording", "waiting", "Waiting for Lapse. It does not block you yet.");
    add("bom_waiting", "Bill of materials", "waiting", "Waiting for the bill of materials. It does not block you yet.");
  } else {
    add("hackatime_waiting", "Hackatime hours", "waiting", "Waiting for Hackatime. It does not block you yet.");
  }

  const blockers = items.filter((item) => item.state === "fail").map(({ code, message }) => ({ code, message }));
  return { ok: blockers.length === 0, blockers, items, readme };
}

// The first blocker that keeps the page's submit button off. The attestation and the change note are filled in inside the dialog,
// so they don't count here; the dialog's confirm button handles them and the server checks everything again.
export function firstTriggerBlocker(result: Pick<ShipCheck, "blockers">): ShipBlocker | null {
  return result.blockers.find((blocker) => !BUILDER_CODES.includes(blocker.code)) ?? null;
}
