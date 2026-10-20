import { describe, expect, test } from "bun:test";
import {
  INITIAL_CONNECTIONS,
  INITIAL_VERIFICATION,
  MAX_HISTORY,
  connect,
  connectedCount,
  disconnect,
  normalizeConnections,
  normalizeVerification,
  transition,
  type VerificationState,
} from "./account";

const T = (n: number) => `2026-10-20T10:${String(n).padStart(2, "0")}:00.000Z`;

function must(result: ReturnType<typeof transition>): VerificationState {
  if (!result.ok) throw new Error(result.error);
  return result.state;
}

describe("verification", () => {
  test("the happy path: not started, pending, verified", () => {
    const pending = must(transition(INITIAL_VERIFICATION, "start", T(1)));
    expect(pending.status).toBe("pending");
    const verified = must(transition(pending, "verify", T(2)));
    expect(verified).toMatchObject({ status: "verified", updatedAt: T(2) });
    expect(verified.history.map((h) => h.status)).toEqual(["pending", "verified"]);
  });

  test("needs attention can be retried", () => {
    const pending = must(transition(INITIAL_VERIFICATION, "start", T(1)));
    const flagged = must(transition(pending, "flag", T(2)));
    expect(flagged.status).toBe("needs_attention");
    expect(must(transition(flagged, "retry", T(3))).status).toBe("pending");
  });

  test("steps that do not fit the current state are refused", () => {
    expect(transition(INITIAL_VERIFICATION, "verify", T(1)).ok).toBe(false);
    expect(transition(INITIAL_VERIFICATION, "flag", T(1)).ok).toBe(false);
    expect(transition(INITIAL_VERIFICATION, "retry", T(1)).ok).toBe(false);
    expect(transition(INITIAL_VERIFICATION, "reset", T(1)).ok).toBe(false);
    const verified = must(transition(must(transition(INITIAL_VERIFICATION, "start", T(1))), "verify", T(2)));
    expect(transition(verified, "start", T(3)).ok).toBe(false);
    expect(transition(verified, "retry", T(3)).ok).toBe(false);
  });

  test("reset returns to the start with no history", () => {
    const verified = must(transition(must(transition(INITIAL_VERIFICATION, "start", T(1))), "verify", T(2)));
    expect(must(transition(verified, "reset", T(3)))).toEqual(INITIAL_VERIFICATION);
  });

  test("history is capped", () => {
    let state = INITIAL_VERIFICATION;
    state = must(transition(state, "start", T(0)));
    for (let i = 1; i <= 12; i += 1) state = must(transition(state, i % 2 ? "flag" : "retry", T(i)));
    expect(state.history).toHaveLength(MAX_HISTORY);
  });

  test("normalizeVerification repairs bad data", () => {
    expect(normalizeVerification(null)).toEqual(INITIAL_VERIFICATION);
    expect(normalizeVerification({ status: "approved" })).toEqual(INITIAL_VERIFICATION);
    expect(normalizeVerification({ status: "verified", updatedAt: T(1), history: [{ status: "pending", at: T(0) }, { status: "bogus", at: T(0) }] })).toEqual({
      status: "verified",
      updatedAt: T(1),
      history: [{ status: "pending", at: T(0) }],
    });
  });
});

describe("connections", () => {
  test("connecting needs consent and records the time", () => {
    expect(connect(INITIAL_CONNECTIONS, "slack", false, T(1)).ok).toBe(false);
    const result = connect(INITIAL_CONNECTIONS, "slack", true, T(1));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.slack).toBe(T(1));
    expect(connectedCount(result.state)).toBe(1);
  });

  test("connecting twice is refused and disconnecting clears one service only", () => {
    const both = { ...INITIAL_CONNECTIONS, slack: T(1), lapse: T(2) };
    expect(connect(both, "slack", true, T(3)).ok).toBe(false);
    const after = disconnect(both, "slack");
    expect(after).toEqual({ ...INITIAL_CONNECTIONS, lapse: T(2) });
    expect(disconnect(after, "slack")).toBe(after);
  });

  test("normalizeConnections ignores unknown ids and non-string values", () => {
    expect(normalizeConnections({ slack: T(1), lapse: 5, other: T(2) })).toEqual({ ...INITIAL_CONNECTIONS, slack: T(1) });
    expect(normalizeConnections("x")).toEqual(INITIAL_CONNECTIONS);
  });
});
