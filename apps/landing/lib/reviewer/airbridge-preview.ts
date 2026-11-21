import { db } from "@/lib/platform/db";
import { getApprovalsIsolated, githubRepo } from "@/reviewer-dash/lib/eligibility/airbridgeApi";

const freshMs = 24 * 60 * 60 * 1000;

export function airbridgeMappings(value: string | undefined): Map<number, string> {
  const mappings = new Map<number, string>();
  if (!value?.trim()) return mappings;
  const used = new Set<string>();
  for (const entry of value.split(",")) {
    const match = /^([1-9]\d{0,9}):(rec[A-Za-z0-9]{14})$/.exec(entry.trim());
    if (!match) throw new Error("Invalid Airbridge mapping");
    const number = Number(match[1]);
    const id = match[2];
    if (number > 2_147_483_647 || mappings.has(number) || used.has(id)) {
      throw new Error("Duplicate or invalid Airbridge mapping");
    }
    mappings.set(number, id);
    used.add(id);
  }
  return mappings;
}

function configuredProgram() {
  return process.env.LOADOUT_AIRBRIDGE_PROGRAM?.trim().toLowerCase() || "loadout";
}

async function mappedRows(mappings: Map<number, string>, program: string) {
  const numbers = [...mappings.keys()];
  const [projects, checks] = await Promise.all([
    db().project.findMany({
      where: { seq: { in: numbers }, bannedAt: null, owner: { bannedAt: null }, status: "approved" },
      select: { seq: true, repoUrl: true },
    }),
    db().airbridgePreviewCheck.findMany({ where: { projectNumber: { in: numbers } } }),
  ]);
  const projectsByNumber = new Map(projects.map((project) => [project.seq, project]));
  const checksByNumber = new Map(checks.map((check) => [check.projectNumber, check]));
  return [...mappings].map(([projectNumber, unifiedId]) => {
    const project = projectsByNumber.get(projectNumber);
    const check = checksByNumber.get(projectNumber);
    const repository = githubRepo(project?.repoUrl ?? null);
    const valid = check?.unifiedId === unifiedId && check.program === program && check.repository === repository;
    return { projectNumber, unifiedId, project, repository, check: valid ? check : undefined };
  });
}

// How many approved projects without a mapping the preview lists by name. The count is always the full number.
export const UNMAPPED_LIST_LIMIT = 100;

// "none": LOADOUT_AIRBRIDGE_MAPPINGS is empty, so nothing is checked. "invalid": it is set but does not parse (bad record id, duplicate
// project or record), so nothing is checked either, and the page says that instead of showing an empty preview. "ok": mappings are loaded.
export type AirbridgeConfig = "none" | "invalid" | "ok";

// A database failure is a different state from "no mappings configured": the first means we have no evidence at all,
// the second is a valid empty preview. The page shows a distinct warning for each and never presents a failed read as empty.
export type AirbridgePreviewState = "ready" | "db_error";

export interface AirbridgePreview {
  state: AirbridgePreviewState;
  config: AirbridgeConfig;
  preview: { projectNumber: number; unifiedId: string; state: string; hours: number | null; attemptedAt: Date | null }[];
  unmapped: number;
  unmappedProjects: { projectNumber: number }[];
}

export async function readAirbridgePreview(now: Date): Promise<AirbridgePreview> {
  let mappings = new Map<number, string>();
  let config: AirbridgeConfig = "none";
  try {
    mappings = airbridgeMappings(process.env.LOADOUT_AIRBRIDGE_MAPPINGS);
    if (mappings.size) config = "ok";
  } catch {
    config = "invalid";
  }
  const numbers = [...mappings.keys()];
  const approvedWhere = { status: "approved", bannedAt: null, owner: { bannedAt: null } } as const;
  // Approved projects with no mapping: the same rule as the count, so the rows listed below always add up to the number shown.
  const unmappedWhere = numbers.length ? { ...approvedWhere, seq: { notIn: numbers } } : approvedWhere;
  try {
    const [rows, unmapped, unmappedProjects] = await Promise.all([
      mappings.size ? mappedRows(mappings, configuredProgram()) : [],
      db().project.count({ where: unmappedWhere }),
      db().project.findMany({ where: unmappedWhere, select: { seq: true }, orderBy: { seq: "asc" }, take: UNMAPPED_LIST_LIMIT }),
    ]);
    const preview = rows.map(({ projectNumber, unifiedId, project, check }) => {
      const stale = check?.verifiedAt && now.getTime() - check.verifiedAt.getTime() >= freshMs;
      const state = !project ? "Project unavailable"
        : !check ? "Not synchronized"
        : check.state === "verified" && stale ? "Stale"
        : check.state === "verified" ? "Verified"
        : check.state === "missing" ? "Missing approval"
        : check.state === "repository-mismatch" ? "Repository mismatch" : "Upstream error";
      return { projectNumber, unifiedId, state, hours: state === "Verified" ? (check?.hours ?? null) : null, attemptedAt: check?.attemptedAt ?? null };
    });
    return {
      state: "ready",
      config,
      preview,
      unmapped,
      // Numbers only: fulfillers see no project titles or builders elsewhere, so this page adds none.
      unmappedProjects: unmappedProjects.map((project) => ({ projectNumber: project.seq })),
    };
  } catch (error) {
    console.error("[airbridge-preview] read failed", (error as Error).message);
    // Fail closed: no evidence and no counts are presented as if the read had succeeded.
    return { state: "db_error", config, preview: [], unmapped: 0, unmappedProjects: [] };
  }
}

// How many candidates one sync run refreshes. A bad or absurd setting falls back to 10 rather than checking nothing
// (0) or hammering the upstream service with the whole mapping list.
export function airbridgeBatchSize(raw: string | undefined = process.env.LOADOUT_AIRBRIDGE_BATCH_SIZE): number {
  const size = Number(raw);
  return Number.isSafeInteger(size) && size >= 1 ? Math.min(size, 100) : 10;
}

// Take a window of `size` candidates starting at `cursor`, wrapping around. Combined with a cursor that advances on
// every run, this rotates through all the mappings instead of refreshing the same first ten over and over.
export function rotatingBatch<T>(items: readonly T[], size: number, cursor: number): T[] {
  if (!items.length || size <= 0) return [];
  const count = Math.min(size, items.length);
  const start = ((Math.trunc(cursor) % items.length) + items.length) % items.length;
  return Array.from({ length: count }, (_, i) => items[(start + i) % items.length]);
}

// Per-process cursor: each sync run picks up where the last one stopped. It is deliberately not persisted; the
// ordering by last-attempt below already prefers never-checked and stale rows after a restart.
let batchCursor = 0;

export async function runAirbridgePreviewSync(now: Date) {
  const mappings = airbridgeMappings(process.env.LOADOUT_AIRBRIDGE_MAPPINGS);
  if (!mappings.size) return { checked: 0, errors: 0 };
  const program = configuredProgram();
  const candidates = (await mappedRows(mappings, program)).filter((row) => row.project);
  candidates.sort((a, b) => (a.check?.attemptedAt.getTime() ?? 0) - (b.check?.attemptedAt.getTime() ?? 0));
  const batch = rotatingBatch(candidates, airbridgeBatchSize(), batchCursor++);

  const { approvals, errors } = await getApprovalsIsolated(batch.map((row) => row.unifiedId), fetch, program);
  await db().$transaction(batch.map(({ projectNumber, unifiedId, repository }) => {
    const approval = approvals.get(unifiedId);
    const matchingRepo = approval && githubRepo(approval.repoUrl) === repository;
    const state = errors.has(unifiedId) ? "error" : !approval ? "missing" : matchingRepo ? "verified" : "repository-mismatch";
    const data = {
      unifiedId, program, repository, state, hours: matchingRepo ? approval.hours : null,
      attemptedAt: now, verifiedAt: matchingRepo ? now : null,
    };
    return db().airbridgePreviewCheck.upsert({
      where: { projectNumber },
      create: { projectNumber, ...data },
      update: data,
    });
  }));
  return { checked: batch.length, errors: errors.size };
}
