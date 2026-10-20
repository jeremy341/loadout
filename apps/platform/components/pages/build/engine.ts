"use client";

import { addOreEntry } from "../../../lib/ore-ledger";
import { pushNotification } from "../../../lib/notifications";
import { getPreview, setPreview, uid } from "../../../lib/preview-store";
import { previewNow } from "./clock";
import {
  KEYS,
  SEED_JOURNALS,
  SEED_KEYS,
  SEED_MISSION_PROGRESS,
  SEED_PENALTY,
  SEED_PROJECTS,
  SEED_REVIEWS,
  SEED_SHIPS,
} from "./data";
import { cadence, latestEntryAt } from "./logic/cadence";
import { RULES } from "./logic/constants";
import { missionAwardKey, transitionMission, type MissionAction, type MissionDef, type MissionProgress } from "./logic/missions";
import { sampleReview } from "./logic/sample-review";
import { countableReviews } from "./logic/scoring";
import {
  applyShipAction,
  createShip,
  effectiveHours,
  evaluateShip,
  registerRejectedFlag,
  shipChecklist,
  shouldCredit,
  type ShipAction,
  type ShipCtx,
  type ShipEvent,
} from "./logic/ship";
import type { FlagPenaltyState, JournalEntry, Project, ReviewsState, Ship } from "./logic/types";

// Imperative side of the Build tabs. These functions read and write the preview store and call the shared Ore ledger
// and notification inbox. They run from event handlers and effects only, never during render. The rules themselves
// live in ./logic and are pure.

const read = {
  projects: () => getPreview<Project[]>(KEYS.projects, SEED_PROJECTS),
  journals: () => getPreview<JournalEntry[]>(KEYS.journals, SEED_JOURNALS),
  ships: () => getPreview<Ship[]>(KEYS.ships, SEED_SHIPS),
  reviews: () => getPreview<ReviewsState>(KEYS.reviews, SEED_REVIEWS),
  missions: () => getPreview<MissionProgress[]>(KEYS.missions, SEED_MISSION_PROGRESS),
  penalty: () => getPreview<FlagPenaltyState>(KEYS.penalty, SEED_PENALTY),
  awards: () => getPreview<string[]>(KEYS.awards, SEED_KEYS),
  notified: () => getPreview<string[]>(KEYS.notified, SEED_KEYS),
};

export function reviewsDoneCount(state: ReviewsState): number {
  return state.done.length + state.dutyShortcut;
}

function buildCtx(ship: Ship): ShipCtx {
  const entries = read.journals().filter((entry) => entry.projectId === ship.projectId);
  return {
    now: previewNow(),
    latestJournalAt: latestEntryAt(entries),
    reviewsDone: reviewsDoneCount(read.reviews()),
    penaltyPending: read.penalty().pending,
  };
}

/** Notifies once per key. */
function notifyOnce(key: string, input: Parameters<typeof pushNotification>[0]) {
  const sent = read.notified();
  if (sent.includes(key)) return;
  setPreview(KEYS.notified, [...sent, key]);
  pushNotification(input);
}

/**
 * Credits Ore at most once per key. The key is recorded before the ledger is touched, so a repeat call (a double
 * click, a second tab, React running an effect twice) finds the key and does nothing.
 */
export function creditOnce(key: string, amount: number, reason: string, source: string): boolean {
  const credited = read.awards();
  if (!shouldCredit(credited, key)) return false;
  setPreview(KEYS.awards, [...credited, key]);
  if (amount > 0) addOreEntry(amount, reason, source);
  return true;
}

type EventOf<T extends ShipEvent["type"]> = Extract<ShipEvent, { type: T }>;

function notifyLocked(ship: Ship) {
  pushNotification({
    kind: "review",
    title: `Award locked for ${ship.projectName}`,
    body: `The ${RULES.flagWindowHours}-hour flag window is open. Read your reviews and flag any that are unfair.`,
    href: "/reviews",
  });
}

function notifyPaid(ship: Ship, event: EventOf<"paid">) {
  const reason = `Ship award: ${ship.projectName} ${ship.version} (draft preview rule)`;
  if (!creditOnce(event.key, event.net, reason, "award")) return;
  if (event.penaltyApplied) setPreview(KEYS.penalty, { ...read.penalty(), pending: false });
  pushNotification({
    kind: "project",
    title: `${ship.projectName} was paid`,
    body: `${event.net} Ore credited${event.penaltyApplied ? ` after a ${RULES.penaltyPercent}% deduction` : ""}. This is a draft preview award.`,
    href: "/projects",
  });
}

function notifyFlagRejected(event: EventOf<"flag_rejected">) {
  const result = registerRejectedFlag(read.penalty().rejectedAt, event.at);
  setPreview(KEYS.penalty, { rejectedAt: result.log, pending: read.penalty().pending || result.triggered });
  if (!result.triggered) return;
  pushNotification({
    kind: "review",
    title: "Penalty on your next payout",
    body: `Three flags were rejected within ${RULES.penaltyWindowHours} hours, so your next final payout loses ${RULES.penaltyPercent}%.`,
    href: "/reviews",
  });
}

function notifyFlagUpheld(ship: Ship) {
  pushNotification({
    kind: "review",
    title: `A flag on ${ship.projectName} was upheld`,
    body: "That review was removed. Another peer review is needed before the award locks again.",
    href: "/reviews",
  });
}

const EVENT_HANDLERS: { [T in ShipEvent["type"]]: (ship: Ship, event: EventOf<T>) => void } = {
  locked: (ship) => notifyLocked(ship),
  paid: notifyPaid,
  flag_rejected: (_ship, event) => notifyFlagRejected(event),
  flag_upheld: (ship) => notifyFlagUpheld(ship),
};

function handleEvents(ship: Ship, events: ShipEvent[]) {
  for (const event of events) {
    (EVENT_HANDLERS[event.type] as (ship: Ship, event: ShipEvent) => void)(ship, event);
  }
}

function writeShip(next: Ship) {
  setPreview(
    KEYS.ships,
    read.ships().map((ship) => (ship.id === next.id ? next : ship)),
  );
}

/** Runs every automatic transition each ship's inputs allow, one ship at a time. Safe to call repeatedly. */
export function settleShips(): void {
  for (const ship of read.ships()) {
    if (ship.state !== "peer_review" && ship.state !== "flag_window") continue;
    const result = evaluateShip(ship, buildCtx(ship));
    if (result.ship === ship) continue;
    writeShip(result.ship);
    handleEvents(result.ship, result.events);
  }
}

/** Applies one action to a ship and settles. Returns an error message, or null on success. */
export function dispatchShip(shipId: string, action: ShipAction): string | null {
  const ship = read.ships().find((s) => s.id === shipId);
  if (!ship) return "That ship no longer exists.";
  const result = applyShipAction(ship, action, buildCtx(ship));
  if (result.error) return result.error;
  writeShip(result.ship);
  handleEvents(result.ship, result.events);
  settleShips();
  return null;
}

export interface SubmitShipInput {
  projectId: string;
  version: string;
  changes: string;
  aiUse: string[];
}

export function submitShip(input: SubmitShipInput): { ok: true; ship: Ship } | { ok: false; errors: string[] } {
  const project = read.projects().find((p) => p.id === input.projectId);
  if (!project) return { ok: false, errors: ["That project no longer exists."] };
  const ships = read.ships().filter((s) => s.projectId === project.id);
  if (ships.some((s) => s.state !== "paid" && s.state !== "rejected")) {
    return { ok: false, errors: ["This project already has a ship in progress."] };
  }
  const entries = read.journals().filter((e) => e.projectId === project.id);
  const checklist = shipChecklist({ project, entries, priorShips: ships, aiUse: input.aiUse });
  if (!checklist.canSubmit) return { ok: false, errors: checklist.items.filter((i) => !i.pass).map((i) => i.detail) };
  const ship = createShip({
    id: uid("ship"),
    project,
    version: input.version.trim() || "Initial",
    changes: input.changes,
    aiUse: input.aiUse,
    newHours: checklist.newHours,
    now: previewNow(),
  });
  setPreview(KEYS.ships, [...read.ships(), ship]);
  pushNotification({
    kind: "project",
    title: `Ship submitted: ${project.name}`,
    body: "It is waiting for the team check. In the preview, use Preview tools on the Ship tab to move it along.",
    href: "/projects",
  });
  return { ok: true, ship };
}

/** Preview tool: adds sample anonymous peer reviews around a typical score. Returns how many were added. */
export function addSampleReviews(shipId: string, count: number, base: number): { added: number; error: string | null } {
  const ship = read.ships().find((s) => s.id === shipId);
  if (!ship) return { added: 0, error: "That ship no longer exists." };
  let current = ship;
  let added = 0;
  const start = previewNow();
  for (let i = 0; i < count; i += 1) {
    const review = sampleReview({ shipId: ship.id, index: current.reviews.length, base, createdAt: start + added });
    const result = applyShipAction(current, { type: "addReview", review }, { now: start });
    if (result.error) return { added, error: added === 0 ? result.error : null };
    current = result.ship;
    added += 1;
  }
  if (added > 0) {
    writeShip(current);
    const countable = countableReviews(current.reviews).length;
    pushNotification({
      kind: "review",
      title: `${added} anonymous review${added === 1 ? "" : "s"} received`,
      body: `${current.projectName} now has ${Math.min(countable, RULES.reviewsPerShip)} of ${RULES.reviewsPerShip} countable reviews.`,
      href: "/reviews",
    });
    settleShips();
  }
  return { added, error: null };
}

/** Preview tool: counts the remaining owed reviews without doing them. */
export function applyDutyShortcut(): void {
  const state = read.reviews();
  const owed = Math.max(0, RULES.reviewsOwed - state.done.length);
  setPreview(KEYS.reviews, { ...state, dutyShortcut: owed });
  settleShips();
}

/**
 * Preview tool: simulates the tracker reporting more hours on a project, as if you had worked them.
 * Both the reported and the allocated hours move, because a real tracker would report them and the builder would assign them.
 */
export function logTrackerHours(projectId: string, hours: number): string | null {
  if (!Number.isFinite(hours) || hours <= 0 || hours > 100) return "Enter between 0 and 100 hours.";
  const project = read.projects().find((p) => p.id === projectId);
  if (!project) return "That project no longer exists.";
  if (!project.trackerConnected) return `Connect ${project.track === "Hardware" ? "Lapse" : "Hackatime"} on the project's Evidence tab first.`;
  const rounded = Math.round(hours * 100) / 100;
  setPreview(
    KEYS.projects,
    read.projects().map((p) => (p.id === projectId ? { ...p, trackerHours: p.trackerHours + rounded, allocatedHours: p.allocatedHours + rounded } : p)),
  );
  checkJournalDue(projectId);
  return null;
}

/** Sends a "journal due" notification the first time a project crosses the eight hour line since its last entry. */
export function checkJournalDue(projectId: string): void {
  const project = read.projects().find((p) => p.id === projectId);
  if (!project) return;
  const entries = read.journals().filter((e) => e.projectId === projectId);
  const state = cadence(effectiveHours(project), entries);
  if (!state.due) return;
  notifyOnce(`due:${projectId}:${entries.length}`, {
    kind: "journal",
    title: `Journal entry due for ${project.name}`,
    body: `${state.uncovered} h of development are not covered by an entry. Each project needs one at least every ${RULES.journalEveryHours} h.`,
    href: "/journals",
  });
}

/** Removes a project with its journals and ships. Ore already credited stays in the ledger. */
export function deleteProject(projectId: string): void {
  setPreview(KEYS.projects, read.projects().filter((p) => p.id !== projectId));
  setPreview(KEYS.journals, read.journals().filter((e) => e.projectId !== projectId));
  setPreview(KEYS.ships, read.ships().filter((s) => s.projectId !== projectId));
}

// ---------------------------------------------------------------------------------------------------------------
// Missions

function writeMission(next: MissionProgress) {
  const list = read.missions();
  const exists = list.some((p) => p.missionId === next.missionId);
  setPreview(KEYS.missions, exists ? list.map((p) => (p.missionId === next.missionId ? next : p)) : [...list, next]);
}

/** The review note after an action: a change request records it, a submit or approval clears it, anything else keeps it. */
function nextReviewNote(action: MissionAction, current: string | undefined, note: string): string | undefined {
  if (action === "requestChanges") return note;
  return action === "submit" || action === "approve" ? "" : current;
}

function approvalReason(def: MissionDef): string {
  const kind = def.kind === "quest" ? "Quest" : "Mission";
  return `${kind} reward: ${def.title} (${def.rewardSource === "draft" ? "draft preview reward" : "example value from Plan 02"})`;
}

function notifyApproved(def: MissionDef, label: string) {
  const credited = creditOnce(missionAwardKey(def.id), def.rewardOre, approvalReason(def), "mission");
  pushNotification({
    kind: "mission",
    title: `Approved: ${def.title}`,
    body: credited ? `${def.rewardOre} Ore added. This is a draft preview reward, not a final value.` : `Your ${label} was approved.`,
    href: "/missions",
  });
}

/** Notifies for the actions that have a message; a pickup stays silent. */
function notifyMissionAction(def: MissionDef, action: MissionAction, note: string) {
  const label = def.kind === "quest" ? "quest" : "mission";
  if (action === "submit") {
    pushNotification({ kind: "mission", title: `Submitted: ${def.title}`, body: `Your ${label} is waiting for review.`, href: "/missions" });
  } else if (action === "approve") {
    notifyApproved(def, label);
  } else if (action === "requestChanges") {
    pushNotification({ kind: "mission", title: `Changes needed: ${def.title}`, body: note || "The reviewer asked for changes.", href: "/missions" });
  }
}

/** Moves a mission through its status machine. Approval credits the draft preview reward once. */
export function moveMission(def: MissionDef, action: MissionAction, note = ""): string | null {
  const current = read.missions().find((p) => p.missionId === def.id);
  if (!current) return "Start the mission first.";
  const next = transitionMission(current.status, action);
  if (!next) return "That step is not available from the mission's current status.";
  writeMission({
    ...current,
    status: next,
    submittedAt: action === "submit" ? previewNow() : current.submittedAt,
    reviewNote: nextReviewNote(action, current.reviewNote, note),
  });
  notifyMissionAction(def, action, note);
  return null;
}

/** Starts a mission as a draft. Refuses while a prerequisite is not approved. */
export function startMission(def: MissionDef): string | null {
  const list = read.missions();
  if (list.some((p) => p.missionId === def.id)) return null;
  const approved = list.filter((p) => p.status === "approved").map((p) => p.missionId);
  const missing = def.prerequisites.filter((id) => !approved.includes(id));
  if (missing.length > 0) return "Finish the prerequisite missions first.";
  writeMission({ missionId: def.id, status: "draft", checkedStepIds: [], text: "", url: "", startedAt: previewNow() });
  return null;
}

/** Saves edits to a mission's ticked steps or submission text. Ignored once the mission is out for review. */
export function updateMissionDraft(missionId: string, patch: Partial<Pick<MissionProgress, "checkedStepIds" | "text" | "url">>): void {
  const current = read.missions().find((p) => p.missionId === missionId);
  if (!current || (current.status !== "draft" && current.status !== "needs_changes")) return;
  writeMission({ ...current, ...patch });
}
