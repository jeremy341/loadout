// Pure rules for kudos on projects. No database; tests in kudos.test.ts.
//
// API:
//   canGiveKudos({ viewer, project }) -> { ok: true } | { ok: false, code, reason }
//       "one per person" is the unique row (ProjectKudos personId + projectId), not a rule here. Every project is public, drafts
//       included (owner, 16 Nov 2026), so kudos go to any project whose owner is not banned, and never to your own project.
//       code: "own-project" | "not-visible". Taking your kudos back always works.
//   kudosLabel(count) -> "No kudos yet" | "1 kudo" | "N kudos"
import { isPublicProject } from "./profile";

export type KudosCode = "own-project" | "not-visible";
export type KudosResult = { ok: true } | { ok: false; code: KudosCode; reason: string };

export type KudosInput = {
  viewer: { id: string };
  project: { ownerId: string; status: string; ownerBanned?: boolean };
};

export function canGiveKudos({ viewer, project }: KudosInput): KudosResult {
  if (project.ownerId === viewer.id) return { ok: false, code: "own-project", reason: "You cannot give kudos to your own project." };
  if (project.ownerBanned || !isPublicProject(project)) {
    return { ok: false, code: "not-visible", reason: "That project was not found." };
  }
  return { ok: true };
}

export function kudosLabel(count: number): string {
  const n = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  if (n === 0) return "No kudos yet";
  return n === 1 ? "1 kudo" : `${n} kudos`;
}
