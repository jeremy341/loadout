// Assignment window. The reviewer who first asks for changes is assigned to the ship. When the builder re-ships, that reviewer
// has ASSIGNMENT_WINDOW_MS to review it again. After the window, the ship returns to the common queue (a daily job applies it;
// this function gives the same answer whenever it is asked).
//
// API:
//   ASSIGNMENT_WINDOW_MS = 3 days
//   assignmentState({ assignedReviewerId, reshippedAt, now }) -> { holderId, returnsAt, returned }
//     holderId null means the ship is in the common queue
//   canReviewAssigned({ reviewerId, assignedReviewerId, reshippedAt, now }) -> { ok: true } | { ok: false, code, message }

export const ASSIGNMENT_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export type AssignmentState = { holderId: string | null; returnsAt: number | null; returned: boolean };

export function assignmentState(input: { assignedReviewerId: string | null; reshippedAt: number | null; now: number }): AssignmentState {
  if (input.assignedReviewerId === null) return { holderId: null, returnsAt: null, returned: false };
  // Before the re-ship the assignment holds without a clock: the builder has not answered the request yet.
  if (input.reshippedAt === null) return { holderId: input.assignedReviewerId, returnsAt: null, returned: false };
  const returnsAt = input.reshippedAt + ASSIGNMENT_WINDOW_MS;
  if (input.now < returnsAt) return { holderId: input.assignedReviewerId, returnsAt, returned: false };
  return { holderId: null, returnsAt, returned: true };
}

export type AssignmentCheck = { ok: true } | { ok: false; code: "assigned-to-other"; message: string };

export function canReviewAssigned(input: {
  reviewerId: string;
  assignedReviewerId: string | null;
  reshippedAt: number | null;
  now: number;
}): AssignmentCheck {
  const state = assignmentState(input);
  if (state.holderId === null || state.holderId === input.reviewerId) return { ok: true };
  return { ok: false, code: "assigned-to-other", message: "This ship is assigned to the reviewer who asked for changes." };
}
