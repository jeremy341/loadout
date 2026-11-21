// Pure rules for the project page: the journal hint and the visitor notice. No database.

// "5 hours not covered by a journal yet: about 1 entry." Null when the journal is up to date.
export function dueHint(due: number, owed: number): string | null {
  if (owed <= 0 || due <= 0) return null;
  const shown = Number.isInteger(due) ? due : Math.round(due * 100) / 100;
  return `${shown} ${shown === 1 ? "hour" : "hours"} not covered by a journal yet: about ${owed} ${owed === 1 ? "entry" : "entries"}.`;
}

// The plain line a visitor sees above a project that is not approved yet. Every project is public, drafts included, so the page
// says what stage it is at instead of hiding it. Approved projects (and unknown stages) have no notice.
export function visitorNotice(status: string): string | null {
  switch (status.trim().toLowerCase().replace(/_/g, "-")) {
    case "draft":
      return "This project is a draft. The builder is still setting it up.";
    case "logging":
      return "This project is in progress. The builder is logging work.";
    case "submitted":
    case "in-review":
    case "second-pass":
      return "This project is waiting for review.";
    case "needs-changes":
      return "A reviewer asked for changes. The builder is working on them.";
    default:
      return null;
  }
}
