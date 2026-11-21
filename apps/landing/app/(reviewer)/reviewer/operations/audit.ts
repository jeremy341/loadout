import { operationStatus } from "@/lib/reviewer/program-operations";

type OperationLike = {
  name: string;
  startsAt: Date;
  endsAt: Date;
  pausedAt: Date | null;
  endedAt: Date | null;
  rateUsd?: number | null;
};

// A complete snapshot for an operation audit row: the status and every scheduling field a reviewer might need to
// compare, before and after a control action. rateUsd is included when the row carries it (the DB model does not yet).
export function operationAuditState(operation: OperationLike, now: Date) {
  return {
    status: operationStatus(operation, now),
    name: operation.name,
    startsAt: operation.startsAt.toISOString(),
    endsAt: operation.endsAt.toISOString(),
    pausedAt: operation.pausedAt?.toISOString() ?? null,
    endedAt: operation.endedAt?.toISOString() ?? null,
    rateUsd: operation.rateUsd ?? null,
  };
}
