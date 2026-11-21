// How long ago something happened, in the short form the Recent list uses: "just now", "5m ago", "3h ago", "2d ago", then
// a date. A future time reads as "just now".
export function timeAgo(then: Date, now: Date = new Date()): string {
  const seconds = (now.getTime() - then.getTime()) / 1000;
  if (!Number.isFinite(seconds) || seconds < 90) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)}d ago`;
  return `${then.getUTCDate()} ${MONTHS[then.getUTCMonth()]} ${then.getUTCFullYear()}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
