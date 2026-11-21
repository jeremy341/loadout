import { isRealId } from "@/reviewer-dash/lib/real";
import { doubleDipView } from "@/reviewer-dash/lib/doubleDip";
import { latestChecksForSeq, type CheckRow } from "@/lib/platform/fraud/checks";
import { Badge, Card, CardHeader, Muted, formatDateTime, type Tone } from "@/reviewer-dash/app/_ui/ui";

// The automated fraud and verification checks for one ship, newest result per check (lib/platform/fraud/checks.ts). Read-only: the
// desk's verdict is still the reviewer's, and nothing here writes to the project. Every line is fixed text built by the check itself;
// the model's and Telescreen's own words sit under "note" and are rendered as plain text, never as markup.
//
// Robert and Fraudy rows carry scores that bear on the second-pass fraud decision, so they are shown only when `showScores` is true
// (the page passes the same gate as the final-review stages); the pre-check and double-dip rows go to every reviewer.
// A sample ship (id below 100000) has no rows and renders nothing, as does a desk with no database.
const KIND_LABEL: Record<string, string> = {
  precheck: "AI pre-check",
  robert: "Telescreen (Robert)",
  fraudy: "Fraudy time split",
  "double-dip": "Double dip",
};

const STATUS_TONE: Record<string, Tone> = { cleared: "success", flagged: "danger", pending: "neutral", error: "warning", dismissed: "neutral" };
const STATUS_LABEL: Record<string, string> = { cleared: "Clear", flagged: "Flagged", pending: "Waiting", error: "Could not run", dismissed: "Dismissed" };

const asRecord = (value: unknown): Record<string, unknown> => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {});

// The extra lines a row can carry in its detail. Text only, shortened again here as a second line of defense.
function extras(row: CheckRow): string[] {
  const d = asRecord(row.detail);
  const out: string[] = [];
  if (row.kind === "double-dip") {
    const view = doubleDipView(String(d.systemNote ?? ""));
    if (view) out.push(view.text);
  }
  if (row.kind === "robert" && typeof d.note === "string" && d.note) out.push(`Telescreen note: ${d.note}`);
  if (row.kind === "precheck") {
    const findings = Array.isArray(d.findings) ? d.findings : [];
    for (const f of findings) {
      const e = asRecord(f).evidence;
      if (typeof e === "string" && e) out.push(`Evidence: ${e}`);
    }
    for (const n of Array.isArray(d.notes) ? d.notes : []) out.push(`Note: ${String(n)}`);
    for (const n of Array.isArray(d.fileNotes) ? d.fileNotes : []) out.push(String(n));
  }
  return out.map((line) => line.slice(0, 600)).slice(0, 8);
}

export async function FraudChecksPanel({ projectId, showScores }: { projectId: number; showScores: boolean }) {
  if (!isRealId(projectId)) return null;
  const rows = (await latestChecksForSeq(projectId)).filter((row) => showScores || (row.kind !== "robert" && row.kind !== "fraudy"));
  if (rows.length === 0) return null;
  return (
    <Card>
      <CardHeader title="Automated checks" icon="info" count={rows.length} />
      <ul className="flex flex-col gap-4">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <strong>{KIND_LABEL[row.kind] ?? row.kind}</strong>
              <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>{STATUS_LABEL[row.status] ?? row.status}</Badge>
              {row.score !== null && <Badge outline>{row.kind === "fraudy" ? `${row.score}% by a person` : `Score ${row.score}`}</Badge>}
              <Muted className="ml-auto text-sm">{formatDateTime(row.checkedAt)} UTC</Muted>
            </div>
            {row.summary && <span className="break-words text-sm">{row.summary}</span>}
            {extras(row).map((line, i) => (
              <span key={i} className="hc-caption whitespace-pre-wrap break-words">
                {line}
              </span>
            ))}
          </li>
        ))}
      </ul>
    </Card>
  );
}
