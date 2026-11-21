// Robert (telescreen.hackclub.com) is Hack Club's fraud-review desk: a ship is submitted to it, a fraud reviewer there scores it 1 to
// 10 with a note, and the score comes back to us by polling. Every outbound call to Robert is in this file. Ported from Pixl's
// apps/internal-dashboard/lib/robert.ts at upstream 1468ba6942b13add1ac50e1319541a033ee1df38: buildSubmission, submitProject and
// fetchScoredProjects keep their shape. Not ported: recordOutcome (Pixl writes its own spot-check verdict back to Robert). That is
// an outward-facing write that carries the desk's decision, so it stays out until the desk is wired to do it deliberately.
//
// Differences from Pixl, all deliberate:
//   - The external id is loadout-<seq>-<submittedAt seconds>, not pixl-<id>-<shippedAt>: Robert is shared between programs, and
//     the prefix is what keeps our records from colliding with Pixl's. submittedAt is refreshed by every submit, so a re-ship gets a
//     fresh Robert record, while a retried POST inside one ship deduplicates to Robert's 200.
//   - The address and the key both come from the environment (config.ts). No key or no address: every function here answers
//     "not configured" without touching the network.
//   - Nothing throws. Failures come back as { ok: false, error } with the status and at most 300 characters of Robert's reply.
import type { RobertConfig } from "./config";

export type FetchImpl = (input: string, init?: RequestInit) => Promise<Response>;
export type RobertDeps = { fetch?: FetchImpl };

export function robertExternalId(seq: number, submittedAt: Date | null): string {
  const seconds = submittedAt && Number.isFinite(submittedAt.getTime()) ? Math.floor(submittedAt.getTime() / 1000) : 0;
  return `loadout-${seq}-${seconds}`;
}

const clean = (value: string | null | undefined): string => String(value ?? "").trim();

export type JournalEntryInput = { title: string; content: string; loggedAt: string; hours: number | null };

export type SubmittableProject = {
  seq: number;
  name: string;
  kind: "software" | "hardware";
  codeUrl: string | null;
  demoUrl: string | null;
  hackatimeProjects: string[];
  journal: JournalEntryInput[];
  submittedAt: Date | null;
};

export type RobertSubmission = {
  name: string;
  kind: "hackatime" | "hardware";
  codeUrl: string;
  demoUrl?: string;
  submitter: { slackId: string };
  hackatimeProjects?: string[];
  journal?: { title: string; content: string; loggedAt: string; hours?: number }[];
  externalId: string;
};

export type BuildResult = { ok: true; body: RobertSubmission } | { ok: false; error: string };

export function buildSubmission(project: SubmittableProject, owner: { slackId: string | null }): BuildResult {
  const codeUrl = clean(project.codeUrl);
  if (!codeUrl) return { ok: false, error: "project has no code link" };
  const slackId = clean(owner.slackId);
  if (!slackId) return { ok: false, error: "submitter has no slack id" };
  const demoUrl = clean(project.demoUrl);
  const externalId = robertExternalId(project.seq, project.submittedAt);

  if (project.kind === "hardware") {
    if (project.journal.length === 0) return { ok: false, error: "hardware project has no journal entries" };
    return {
      ok: true,
      body: {
        name: project.name,
        kind: "hardware",
        codeUrl,
        ...(demoUrl ? { demoUrl } : {}),
        submitter: { slackId },
        journal: project.journal.map((j) => ({ title: j.title, content: j.content, loggedAt: j.loggedAt, ...(j.hours != null ? { hours: j.hours } : {}) })),
        externalId,
      },
    };
  }
  if (project.hackatimeProjects.length === 0) return { ok: false, error: "project has no hackatime projects named" };
  return {
    ok: true,
    body: {
      name: project.name,
      kind: "hackatime",
      codeUrl,
      ...(demoUrl ? { demoUrl } : {}),
      submitter: { slackId },
      hackatimeProjects: project.hackatimeProjects,
      externalId,
    },
  };
}

export type RobertReview = { trustScore: number; note: string; at: string };
export type RobertProject = { id: string; externalId: string | null; state: string; review: RobertReview | null };

const send = (deps: RobertDeps): FetchImpl => deps.fetch ?? ((input, init) => fetch(input, init));

export async function submitProject(
  config: RobertConfig,
  project: SubmittableProject,
  owner: { slackId: string | null },
  deps: RobertDeps = {},
): Promise<{ ok: true; robertProjectId: string; externalId: string } | { ok: false; error: string }> {
  const built = buildSubmission(project, owner);
  if (!built.ok) return built;
  try {
    const response = await send(deps)(`${config.base}/projects`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(built.body),
      signal: AbortSignal.timeout(10_000),
    });
    const text = await response.text();
    if (!response.ok) return { ok: false, error: `robert ${response.status}: ${text.slice(0, 300)}` };
    const id = clean((JSON.parse(text) as { id?: string }).id);
    if (!id) return { ok: false, error: `robert ${response.status}: no id in response` };
    return { ok: true, robertProjectId: id, externalId: built.body.externalId };
  } catch (e) {
    return { ok: false, error: (e as Error).message.slice(0, 300) };
  }
}

// Every project Robert has scored. awaiting_outcome is a score above 4 sitting for an organizer decision that we never make on
// Robert's side; rejected_fraud is a score of 4 or less, already final there; "decided" is a score that a person already approved
// in Robert's own UI, and the webhook for that carries no review note, so the list is the only place the note is. The caller
// matches them back to its rows by externalId (that is what Robert's list carries per project). A state that fails to load is
// skipped, so one bad answer cannot hide the other two.
export async function fetchScoredProjects(config: RobertConfig, deps: RobertDeps = {}): Promise<RobertProject[]> {
  const out: RobertProject[] = [];
  for (const state of ["awaiting_outcome", "rejected_fraud", "decided"] as const) {
    try {
      const response = await send(deps)(`${config.base}/projects?state=${state}&limit=100`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) continue;
      const json = (await response.json()) as { projects?: RobertProject[] };
      if (Array.isArray(json.projects)) out.push(...json.projects);
    } catch {
      // Skipped: the next poll asks again.
    }
  }
  return out;
}
