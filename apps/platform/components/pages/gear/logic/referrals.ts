// Referrals and Usage Milestones (plans/02 sections 16 and 19, content/docs referrals page owns the public wording).
//
// A referral counts only after the invited builder: joins through the link, completes Hack Club teen verification,
// tracks and journals real work, and earns a first approved ship. The first approved ship is the qualification
// point. Reward amounts and the milestone ladder are OPEN, so nothing here computes or grants Ore.
//
// Usage Milestones count verified real users of a shipped project. Thresholds and rewards are OPEN.

export const REFERRAL_STAGES = [
  { id: "joined", label: "Joined through your code", detail: "They created a LOADOUT account using your code." },
  { id: "verified", label: "Verified with Hack Club", detail: "They completed Hack Club teen verification." },
  { id: "working", label: "Tracking and journaling real work", detail: "They track real build time and write journal entries." },
  { id: "shipped", label: "First approved ship", detail: "Their first ship passed review. This is the qualification point." },
] as const;

export const STAGE_COUNT = REFERRAL_STAGES.length;
export const MAX_INVITES = 50;
export const LABEL_MIN = 2;
export const LABEL_MAX = 24;

export interface Referral {
  id: string;
  /** A nickname chosen by the inviter. Never a real name or an email address. */
  label: string;
  createdAt: string;
  /** How many of the four stages are complete, 0 to 4. */
  completed: number;
  stamps: { stage: number; at: string }[];
}

export function isQualified(referral: Referral): boolean {
  return referral.completed >= STAGE_COUNT;
}

export function qualifiedCount(list: readonly Referral[]): number {
  return list.filter(isQualified).length;
}

// --- Code -----------------------------------------------------------------------------------------------------

const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const CODE_PATTERN = /^LO-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

/** A stable code for a handle (FNV-1a hash). The same handle always gives the same code. */
export function referralCode(handle: string): string {
  let hash = 0x811c9dc5;
  const text = `loadout-referral:${handle.trim().toLowerCase()}`;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  // xorshift32 spreads the hash over six characters.
  let state = hash || 1;
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    out += CODE_ALPHABET[state % CODE_ALPHABET.length];
  }
  return `LO-${out}`;
}

export type ApplyCodeResult = { ok: true; code: string } | { ok: false; error: string };

/**
 * Checks a code someone else shared with you. The preview has no account service, so it checks only the format and
 * that the code is not your own (self-referral is blocked).
 */
export function validateAppliedCode(input: string, ownCode: string): ApplyCodeResult {
  const code = input.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a code." };
  if (!CODE_PATTERN.test(code)) return { ok: false, error: "That is not a LOADOUT referral code. Codes look like LO-ABC234." };
  if (code === ownCode.toUpperCase()) return { ok: false, error: "You cannot use your own code. Self-referrals are blocked." };
  return { ok: true, code };
}

// --- Invites --------------------------------------------------------------------------------------------------

function squash(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

export interface SelfContext {
  /** Your own handle, display name and anything else that identifies you. */
  aliases: readonly string[];
  code: string;
}

export function isSelfReference(label: string, self: SelfContext): boolean {
  const flat = squash(label);
  if (!flat) return false;
  if (flat.includes(squash(self.code))) return true;
  return self.aliases.some((alias) => {
    const own = squash(alias);
    return own.length > 0 && flat === own;
  });
}

export type InviteResult = { ok: true; list: Referral[]; referral: Referral } | { ok: false; error: string };

export function addReferral(list: readonly Referral[], rawLabel: string, self: SelfContext, id: string, now: string): InviteResult {
  const label = rawLabel.trim().replace(/\s+/g, " ");
  if (label.length < LABEL_MIN || label.length > LABEL_MAX) {
    return { ok: false, error: `Use a nickname of ${LABEL_MIN} to ${LABEL_MAX} characters.` };
  }
  if (/@|:\/\/|www\./i.test(label) || !/^[\p{L}\p{N} _.-]+$/u.test(label)) {
    return { ok: false, error: "Use a nickname only: letters, numbers, spaces, dots, dashes or underscores. No emails, links or real names." };
  }
  if (isSelfReference(label, self)) return { ok: false, error: "You cannot refer yourself. Self-referrals are blocked." };
  if (list.some((referral) => squash(referral.label) === squash(label))) {
    return { ok: false, error: "You already have an invite with that nickname." };
  }
  if (list.length >= MAX_INVITES) return { ok: false, error: `The preview keeps up to ${MAX_INVITES} invites.` };
  const referral: Referral = { id, label, createdAt: now, completed: 0, stamps: [] };
  return { ok: true, list: [...list, referral], referral };
}

export function removeReferral(list: readonly Referral[], id: string): Referral[] {
  return list.filter((referral) => referral.id !== id);
}

export interface AdvanceResult {
  list: Referral[];
  referral: Referral | null;
  /** True when this step completed the last stage and the referral just qualified. */
  qualifiedNow: boolean;
}

/** Completes the next stage. Stages go in order and cannot be skipped. A qualified referral cannot advance. */
export function advanceReferral(list: readonly Referral[], id: string, now: string): AdvanceResult {
  const current = list.find((referral) => referral.id === id);
  if (!current || current.completed >= STAGE_COUNT) return { list: [...list], referral: null, qualifiedNow: false };
  const completed = current.completed + 1;
  const updated: Referral = { ...current, completed, stamps: [...current.stamps, { stage: completed, at: now }] };
  return {
    list: list.map((referral) => (referral.id === id ? updated : referral)),
    referral: updated,
    qualifiedNow: completed === STAGE_COUNT,
  };
}

/** Steps back one stage. Preview tools only; it lets the funnel be replayed. */
export function rewindReferral(list: readonly Referral[], id: string): Referral[] {
  return list.map((referral) =>
    referral.id === id && referral.completed > 0
      ? { ...referral, completed: referral.completed - 1, stamps: referral.stamps.slice(0, -1) }
      : referral,
  );
}

export function stageLabel(referral: Referral): string {
  if (isQualified(referral)) return "Qualified";
  if (referral.completed === 0) return "Invite sent";
  return `Stage ${referral.completed} of ${STAGE_COUNT}: ${REFERRAL_STAGES[referral.completed - 1].label}`;
}

export function inviteMessage(code: string): string {
  return [
    "Join me on LOADOUT, a program where teen builders earn Ore for real technical projects.",
    `My referral code is ${code}.`,
    "Sign-up opens with the program. Use the code when you join.",
  ].join("\n");
}

// --- Usage Milestones -----------------------------------------------------------------------------------------

export interface UsageEntry {
  id: string;
  project: string;
  /** Verified real users, as entered. In the preview nobody verifies this number. */
  users: number;
  note: string;
  updatedAt: string;
}

export const MAX_USERS = 10_000_000;

export type UsageResult = { ok: true; list: UsageEntry[]; entry: UsageEntry } | { ok: false; error: string };

export function saveUsage(
  list: readonly UsageEntry[],
  input: { project: string; users: string | number; note: string },
  id: string,
  now: string,
): UsageResult {
  const project = input.project.trim().replace(/\s+/g, " ");
  if (project.length < 2 || project.length > 60) return { ok: false, error: "Enter a project name of 2 to 60 characters." };
  const rawUsers = typeof input.users === "number" ? String(input.users) : input.users.trim();
  const users = rawUsers === "" ? Number.NaN : Number(rawUsers);
  if (!Number.isInteger(users) || users < 0 || users > MAX_USERS) {
    return { ok: false, error: `Enter a whole number of users from 0 to ${MAX_USERS.toLocaleString("en-GB")}.` };
  }
  const note = input.note.trim().slice(0, 200);
  const existing = list.find((entry) => squash(entry.project) === squash(project));
  if (existing) {
    const entry: UsageEntry = { ...existing, project, users, note, updatedAt: now };
    return { ok: true, list: list.map((candidate) => (candidate.id === existing.id ? entry : candidate)), entry };
  }
  const entry: UsageEntry = { id, project, users, note, updatedAt: now };
  return { ok: true, list: [...list, entry], entry };
}

export function removeUsage(list: readonly UsageEntry[], id: string): UsageEntry[] {
  return list.filter((entry) => entry.id !== id);
}
