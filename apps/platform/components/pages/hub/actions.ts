"use client";

import { pushNotification } from "../../../lib/notifications";
import { ORE_LEDGER_KEY, SEED_ORE_LEDGER, addOreEntry, type OreEntry } from "../../../lib/ore-ledger";
import { PREVIEW_PREFIX, getPreview, resetPreviewData, setPreview } from "../../../lib/preview-store";
import { HUB_KEYS } from "./data";
import { CATALOG, CONTRIBUTOR_ID, NO_EARNED, applyEarned, earnedMessage, normalizeEarned } from "./logic/achievements";
import {
  CREDIT_REASON,
  CREDIT_SOURCE,
  NO_CLAIMS,
  approveClaim,
  normalizeClaims,
  recordCredit,
  rejectClaim,
  submitClaim,
  withdrawClaim,
  type ClaimInput,
  type ClaimsState,
} from "./logic/claims";
import { buildExport, exportFileName, type ImportResult } from "./logic/transfer";
import { HUB_RULES } from "./logic/rules";

// Imperative actions for event handlers. They read the clock and the browser's storage, so they never run during
// render. The pure rules they apply are in ./logic and are tested there.

export function nowIso(): string {
  return new Date().toISOString();
}

// ---- Achievements -----------------------------------------------------------------------------------------

/** Records ids as earned (once) and raises one notification for the batch. Returns the ids that were new. */
export function recordEarned(ids: readonly string[]): string[] {
  const stored = normalizeEarned(getPreview<unknown>(HUB_KEYS.earned, NO_EARNED));
  const fresh = ids.filter((id) => !Object.hasOwn(stored, id));
  if (fresh.length === 0) return [];
  setPreview(HUB_KEYS.earned, applyEarned(stored, fresh, nowIso()));
  const message = earnedMessage(fresh, CATALOG);
  if (message) pushNotification({ kind: "system", title: message.title, body: message.body, href: "/achievements" });
  return fresh;
}

// ---- External-contributor claim ---------------------------------------------------------------------------

function readClaims(): ClaimsState {
  return normalizeClaims(getPreview<unknown>(HUB_KEYS.claims, NO_CLAIMS));
}

export function submitContributorClaimNow(input: ClaimInput, projects: readonly { id: string; name: string }[]): { ok: true } | { ok: false; error: string } {
  const result = submitClaim(readClaims(), input, projects, nowIso());
  if (!result.ok) return result;
  setPreview(HUB_KEYS.claims, result.state);
  return { ok: true };
}

export function withdrawContributorClaimNow() {
  setPreview(HUB_KEYS.claims, withdrawClaim(readClaims()));
}

export function rejectContributorClaimNow() {
  setPreview(HUB_KEYS.claims, rejectClaim(readClaims(), nowIso()));
  pushNotification({ kind: "system", title: "Contribution claim not approved (preview)", body: "You can record a new claim.", href: "/achievements" });
}

export type ApproveOutcome = "credited" | "already-credited" | "nothing-to-approve";

/**
 * Preview tool: stands in for a reviewer approving the claim. Credits +50 Ore exactly once. The claims record
 * and the ledger are both checked, and the credit is recorded only after the ledger entry exists.
 */
export function approveContributorClaimNow(): ApproveOutcome {
  const ledger = getPreview<OreEntry[]>(ORE_LEDGER_KEY, SEED_ORE_LEDGER);
  const at = nowIso();
  const before = readClaims();
  if (before.contributor?.status !== "pending") return "nothing-to-approve";
  const plan = approveClaim(before, ledger, at);
  if (!plan.shouldCredit) {
    const existing = ledger.find((e) => e.source === CREDIT_SOURCE && e.reason === CREDIT_REASON);
    setPreview(HUB_KEYS.claims, existing ? recordCredit(plan.state, existing.id, at) : plan.state);
    recordEarned([CONTRIBUTOR_ID]);
    return "already-credited";
  }
  const entry = addOreEntry(HUB_RULES.contributorOre, CREDIT_REASON, CREDIT_SOURCE);
  if (!entry) return "nothing-to-approve";
  setPreview(HUB_KEYS.claims, recordCredit(plan.state, entry.id, at));
  const stored = normalizeEarned(getPreview<unknown>(HUB_KEYS.earned, NO_EARNED));
  if (!Object.hasOwn(stored, CONTRIBUTOR_ID)) setPreview(HUB_KEYS.earned, applyEarned(stored, [CONTRIBUTOR_ID], at));
  pushNotification({
    kind: "system",
    title: `Contribution approved: +${HUB_RULES.contributorOre} Ore (preview)`,
    body: "The first outside contribution achievement is yours. The Ore was added once.",
    href: "/achievements",
  });
  return "credited";
}

// ---- Export and import ------------------------------------------------------------------------------------

/** Every preview key as raw text, keyed without the storage prefix. */
export function readStoredEntries(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const store = window.localStorage;
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key && key.startsWith(PREVIEW_PREFIX)) {
        const value = store.getItem(key);
        if (value !== null) out[key.slice(PREVIEW_PREFIX.length)] = value;
      }
    }
  } catch {
    // Storage blocked: the export is empty and the page says so.
  }
  return out;
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportPreviewDataNow(): { filename: string; count: number; skipped: number; bytes: number } {
  const at = nowIso();
  const { text, count, skipped } = buildExport(readStoredEntries(), at);
  const filename = exportFileName(at);
  downloadText(filename, text);
  return { filename, count, skipped, bytes: text.length };
}

/** Replaces all preview data with the validated entries of an import. */
export function applyImportNow(result: Extract<ImportResult, { ok: true }>) {
  resetPreviewData();
  for (const [key, value] of Object.entries(result.entries)) setPreview(key, value);
}

export function resetAllPreviewDataNow() {
  resetPreviewData();
}
