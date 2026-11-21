import { listTeamLog, type TeamLogRow } from "@/reviewer-dash/lib/db";
import { undoTeamChange } from "@/reviewer-dash/app/actions";
import { ActionButton, Badge, Card, CardHeader, Muted, Table, formatDateTime, type Tone } from "@/reviewer-dash/app/_ui/ui";

// The stored grants in words (Pixl's fraud_review is the integrity reviewer here).
const PERM_WORDS: Record<string, string> = {
  review: "reviewer",
  second_pass: "final reviewer",
  edit_submission: "edit submission",
  ai_draft: "prepared draft note",
  fraud_review: "integrity reviewer",
  review_hardware_only: "hardware queue only",
  review_software_only: "software queue only",
  full_queue: "full queue",
};

function describe(row: TeamLogRow): string {
  const before = row.before ?? [];
  const after = row.after ?? [];
  const fmt = (p: string[]) => {
    const shown = p.filter((x) => x !== "no_review").map((x) => PERM_WORDS[x] ?? x);
    const base = shown.length > 0 ? shown.join(", ") : "nothing";
    return p.includes("no_review") ? `${base} (review blocked)` : base;
  };
  switch (row.action) {
    case "added":
      return `added to the team with ${fmt(after)}`;
    case "removed":
      return after.length > 0 ? `removed (kept ${fmt(after)})` : `removed from the team (had ${fmt(before)})`;
    case "updated":
      return `permissions changed: ${fmt(before)} to ${fmt(after)}`;
    case "undo":
      return `change undone: ${fmt(before)} to ${fmt(after)}`;
    case "super added":
      return "made an owner, full access";
    case "super removed":
      return "owner access removed";
    default:
      return `${row.action}: ${fmt(before)} to ${fmt(after)}`;
  }
}

const ACTION_TONE: Record<string, Tone> = {
  added: "success",
  removed: "danger",
  updated: "neutral",
  undo: "warning",
  "super added": "success",
  "super removed": "danger",
};

// The last 20 team changes (reviewers page and admins page), each undoable.
export async function TeamLog() {
  const rows = await listTeamLog(20);
  if (rows.length === 0) return null;
  return (
    <Card padding="flush">
      <CardHeader title="Team log" icon="history" />
      <Table headers={["Change", "By", ""]}>
        {rows.map((row) => (
          <tr key={`${row.source}-${row.id}`} className="align-top">
            <td className="whitespace-normal">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold">{row.name || row.slack_id}</span>
                <Badge tone={ACTION_TONE[row.action] ?? "neutral"}>{row.action}</Badge>
                <span>{describe(row)}</span>
              </div>
              {row.reason && <Muted className="mt-1 block text-xs">Reason: {row.reason}</Muted>}
            </td>
            <td className="whitespace-nowrap">
              <div>{row.actor || "unknown"}</div>
              <Muted className="text-xs">{formatDateTime(row.created_at)}</Muted>
            </td>
            <td className="w-px">
              {row.source === "audit" && row.action !== "undo" && (
                <form action={undoTeamChange}>
                  <input type="hidden" name="id" value={row.id} />
                  <ActionButton
                    variant="outline"
                    size="sm"
                    pendingLabel="Undoing..."
                    confirm="Undo this team change?"
                  >
                    Undo
                  </ActionButton>
                </form>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}
