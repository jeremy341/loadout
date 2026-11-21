// The Integrity reviews tab's rows (Pixl's Fraud reviews tab, with Robert's scores removed): ships carrying an AI-usage flag or a
// double-dip flag in the sample. Nothing is checked live; the flags come from the desk's cached sample checks.
import { REVIEW_SHIPS, undisclosedAiCommits } from "@/lib/platform/review";
import { AI_CHECKS, doubleDipFor } from "@/lib/reviewer/desk/evidence-fixtures";
import { compareAi } from "@/lib/reviewer/desk/evidence-ai";
import { shipNumber } from "./index";

export type IntegrityFlag = {
  projectId: number;
  title: string;
  builder: string;
  status: string;
  kind: "ai" | "double-dip";
  headline: string;
  detail: string;
};

export function listIntegrityFlags(): IntegrityFlag[] {
  const rows: IntegrityFlag[] = [];
  for (const ship of REVIEW_SHIPS) {
    const base = { projectId: shipNumber(ship.id), title: ship.title, builder: ship.builder, status: ship.status };
    const ai = AI_CHECKS[ship.id];
    if (ai && ai.state === "ok") {
      const comparison = compareAi(ship.ai.percent, ai.estimatedPercent);
      if (comparison.state === "higher") {
        rows.push({ ...base, kind: "ai", headline: `AI usage estimate ${ai.estimatedPercent}%`, detail: `${comparison.sentence} ${ai.signals[0] ?? ""}`.trim() });
      }
    }
    const undisclosed = undisclosedAiCommits(ship);
    if (undisclosed > 0) {
      rows.push({ ...base, kind: "ai", headline: "AI use not declared", detail: `${undisclosed} ${undisclosed === 1 ? "commit is" : "commits are"} signed by an AI tool and the builder declared none.` });
    }
    const dip = doubleDipFor(ship.id);
    if (dip && dip.matches.length > 0) {
      const first = dip.matches[0];
      rows.push({ ...base, kind: "double-dip", headline: dip.program === "another-ysws" ? "Possible double dip with another YSWS" : "Matches another LOADOUT ship", detail: `${first.other.label}: ${first.detail}.` });
    }
  }
  return rows;
}
