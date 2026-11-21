// Pure rules for blocks. No database; every function has a bun test (blocks.test.ts).
// A block hides two builders from each other in every list (follows, collaborators, ideas, referrals). blocks-data.ts applies
// it; this file only says what is allowed.
//
// API:
//   BLOCK_REASON = "Blocked by the builder from their own account."   audit reason for a block
//   canBlock({ blockerId, target }) -> { ok: true } | { ok: false, code, reason }
//       target: { id, banned }. code: "self" | "not-found". A banned builder is reported as not found.
//   blockedPairs(a, b) -> the two (blockerId, blockedId) orders, for queries that match either direction
export const BLOCK_REASON = "Blocked by the builder from their own account.";

export type BlockCode = "self" | "not-found";
export type BlockResult = { ok: true } | { ok: false; code: BlockCode; reason: string };

export function canBlock({ blockerId, target }: { blockerId: string; target: { id: string; banned: boolean } }): BlockResult {
  if (target.id === blockerId) return { ok: false, code: "self", reason: "You cannot block yourself." };
  if (target.banned) return { ok: false, code: "not-found", reason: "That builder was not found." };
  return { ok: true };
}

export function blockedPairs(a: string, b: string): { blockerId: string; blockedId: string }[] {
  return [
    { blockerId: a, blockedId: b },
    { blockerId: b, blockedId: a },
  ];
}
