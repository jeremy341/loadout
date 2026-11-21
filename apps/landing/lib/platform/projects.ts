import { checkLinkUrl } from "./profile";
import { TRACKS, type Track } from "./progress";
import { isLocked } from "./ship";

export const PROJECT_TITLE_MAX = 80;
export const PROJECT_DESCRIPTION_MAX = 500;
// The wizard asks for at least this much. The ship gate still wants 40 characters later (DESCRIPTION_MIN in ship.ts).
export const PROJECT_DESCRIPTION_MIN = 10;

export type ProjectField = "title" | "description" | "track" | "repoUrl" | "demoUrl";

export type ProjectInput = {
  title: string;
  description: string | null;
  track: Track | null;
  repoUrl: string | null;
  demoUrl: string | null;
};

export type ProjectInputResult =
  | { ok: true; input: ProjectInput }
  | { ok: false; field: ProjectField; message: string };

// The kind is not stored. It follows from the track: Hardware is hardware, the other three are software.
export type ProjectKind = "software" | "hardware";
export const SOFTWARE_TRACKS = ["Tools", "Systems", "Compute"] as const satisfies readonly Track[];

export function kindOfTrack(track: string | null | undefined): ProjectKind | null {
  if (track === "Hardware") return "hardware";
  return (SOFTWARE_TRACKS as readonly string[]).includes(track ?? "") ? "software" : null;
}

export function descriptionProblem(raw: unknown): string | null {
  const description = typeof raw === "string" ? raw.trim() : "";
  if (description.length < PROJECT_DESCRIPTION_MIN) return `Write at least ${PROJECT_DESCRIPTION_MIN} characters.`;
  if (description.length > PROJECT_DESCRIPTION_MAX) return `Keep the idea under ${PROJECT_DESCRIPTION_MAX} characters.`;
  return null;
}

export function titleProblem(raw: unknown): string | null {
  const title = typeof raw === "string" ? raw.trim() : "";
  if (title.length === 0) return "Give the project a name.";
  if (title.length > PROJECT_TITLE_MAX) return `Keep the name under ${PROJECT_TITLE_MAX} characters.`;
  return null;
}

// The one validator for a project's fields. "create" is the wizard: a track is required, the idea is 10 to 500 characters, the
// title is 1 to 80, and the source and demo addresses are optional https links. "edit" keeps the old rules so a project made
// before the wizard (no track, no description) can still be saved: the track and description are optional there, and the
// addresses are not touched by the edit form (they have their own form).
export function checkProjectInput(
  raw: { title: unknown; description: unknown; track: unknown; repoUrl?: unknown; demoUrl?: unknown },
  mode: "create" | "edit" = "create",
): ProjectInputResult {
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const titleIssue = titleProblem(title);
  if (titleIssue) return { ok: false, field: "title", message: titleIssue };

  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  if (mode === "create") {
    const issue = descriptionProblem(description);
    if (issue) return { ok: false, field: "description", message: issue };
  } else if (description.length > PROJECT_DESCRIPTION_MAX) {
    return { ok: false, field: "description", message: `Keep the description under ${PROJECT_DESCRIPTION_MAX} characters.` };
  }

  const track = typeof raw.track === "string" ? raw.track : "";
  if (track !== "" && !(TRACKS as readonly string[]).includes(track)) {
    return { ok: false, field: "track", message: "Pick one of the four tracks." };
  }
  if (mode === "create" && track === "") return { ok: false, field: "track", message: "Pick a track to go on." };

  let repoUrl: string | null = null;
  let demoUrl: string | null = null;
  if (mode === "create") {
    const repo = checkLinkUrl(raw.repoUrl, "source link");
    if (!repo.ok) return { ok: false, field: "repoUrl", message: repo.message };
    const demo = checkLinkUrl(raw.demoUrl, "demo link");
    if (!demo.ok) return { ok: false, field: "demoUrl", message: demo.message };
    repoUrl = repo.url;
    demoUrl = demo.url;
  }

  return {
    ok: true,
    input: {
      title,
      description: description.length > 0 ? description : null,
      track: track === "" ? null : (track as Track),
      repoUrl,
      demoUrl,
    },
  };
}

// Deleting a project needs its name typed back. Trimmed and case-insensitive, as Stasis does it.
export function deleteConfirmed(typed: unknown, title: string): boolean {
  const name = title.trim().toLowerCase();
  return name.length > 0 && typeof typed === "string" && typed.trim().toLowerCase() === name;
}

// A project's track locks when it is submitted (the same rule as isLocked in ship.ts). It stays open while the project is a draft, being logged, or sent back for changes.
export function trackLocked(status: string): boolean {
  return isLocked(status);
}

// The status a project has. Only drafts exist in M1; submission stages arrive with the ship flow.
export function projectStatusLabel(status: string): string {
  if (status === "draft") return "Draft";
  // "in-review" and "needs-changes" read as words ("In review"), as the profile tabs write them.
  const words = status.replace(/[-_]/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
