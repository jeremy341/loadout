export type OperationWindow = {
  startsAt: Date;
  endsAt: Date;
  pausedAt: Date | null;
  endedAt: Date | null;
};

export function operationStatus(operation: OperationWindow, now: Date) {
  if (operation.endedAt || now >= operation.endsAt) return "Ended";
  if (operation.pausedAt) return "Paused";
  return now < operation.startsAt ? "Scheduled" : "Active";
}

export function parseOperationDate(value: FormDataEntryValue | null): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(value + ":00.000Z");
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value + ":") ? date : null;
}
