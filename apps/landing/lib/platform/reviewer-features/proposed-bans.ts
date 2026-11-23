// Proposed bans: a reviewer proposes a ban, and only an owner decides. The builder is told privately, and only when it is approved.
// Pure rules. No ban is applied here; the owner decision is recorded and the caller applies it through its own (out of scope) path.
//
// API:
//   BAN_REASON_MIN = 20, BAN_REASON_MAX = 1000
//   checkBanProposal({ reason, proposerRole, proposerId, builderId }) -> { ok: true, reason } | { ok: false, message }
//   canDecideBanProposal({ actorId, actorRole, proposal }) -> { ok: true } | { ok: false, code, message }
//   decideBanProposal({ actorId, actorRole, proposal, decision, now }) -> { ok: true, proposal, builderNotice } | { ok: false, ... }
import { cleanPlainText } from "./text";

export const BAN_REASON_MIN = 20;
export const BAN_REASON_MAX = 1000;

export const PROPOSAL_ROLES = ["reviewer", "owner"] as const;
export type ProposalRole = (typeof PROPOSAL_ROLES)[number];

export type BanProposal = {
  id: string;
  builderId: string;
  proposerId: string;
  reason: string;
  status: "pending" | "approved" | "declined";
  decidedBy: string | null;
  decidedAt: number | null;
};

export type ProposalCheck = { ok: true; reason: string } | { ok: false; message: string };

export function checkBanProposal(input: { reason: unknown; proposerRole: string; proposerId: string; builderId: string }): ProposalCheck {
  if (!(PROPOSAL_ROLES as readonly string[]).includes(input.proposerRole)) return { ok: false, message: "Only reviewers can propose a ban." };
  if (input.proposerId === input.builderId) return { ok: false, message: "You cannot propose a ban on yourself." };
  const reason = cleanPlainText(input.reason, true);
  if (reason.length < BAN_REASON_MIN || reason.length > BAN_REASON_MAX) {
    return { ok: false, message: `Give a reason of ${BAN_REASON_MIN} to ${BAN_REASON_MAX} characters.` };
  }
  return { ok: true, reason };
}

export type DecideCode = "not-owner" | "self-decision" | "not-pending";
export type DecideCheck = { ok: true } | { ok: false; code: DecideCode; message: string };

export function canDecideBanProposal(input: { actorId: string; actorRole: string; proposal: BanProposal }): DecideCheck {
  if (input.actorRole !== "owner") return { ok: false, code: "not-owner", message: "Only an owner decides a proposed ban." };
  if (input.actorId === input.proposal.proposerId) {
    return { ok: false, code: "self-decision", message: "The reviewer who proposed a ban cannot decide it." };
  }
  if (input.proposal.status !== "pending") return { ok: false, code: "not-pending", message: "This proposal is already decided." };
  return { ok: true };
}

export type DecideResult =
  | { ok: true; proposal: BanProposal; builderNotice: boolean }
  | { ok: false; code: DecideCode; message: string };

export function decideBanProposal(input: {
  actorId: string;
  actorRole: string;
  proposal: BanProposal;
  decision: "approve" | "decline";
  now: number;
}): DecideResult {
  const check = canDecideBanProposal(input);
  if (!check.ok) return check;
  const status = input.decision === "approve" ? "approved" : "declined";
  return {
    ok: true,
    proposal: { ...input.proposal, status, decidedBy: input.actorId, decidedAt: input.now },
    // The builder hears about a ban privately, and only when one is approved.
    builderNotice: status === "approved",
  };
}
