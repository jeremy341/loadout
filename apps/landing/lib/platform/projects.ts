import { TRACKS, type Track } from "./progress";

export const PROJECT_TITLE_MAX = 80;
export const PROJECT_DESCRIPTION_MAX = 500;

export type ProjectField = "title" | "description" | "track";

export type ProjectInput = {
  title: string;
  description: string | null;
  track: Track | null;
};

export type ProjectInputResult =
  | { ok: true; input: ProjectInput }
  | { ok: false; field: ProjectField; message: string };

// Checks a new project from the form. Trimmed first; an empty description and an unpicked track are both allowed.
export function checkProjectInput(raw: { title: unknown; description: unknown; track: unknown }): ProjectInputResult {
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (title.length === 0) {
    return { ok: false, field: "title", message: "Give the project a name." };
  }
  if (title.length > PROJECT_TITLE_MAX) {
    return { ok: false, field: "title", message: `Keep the name under ${PROJECT_TITLE_MAX} characters.` };
  }

  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  if (description.length > PROJECT_DESCRIPTION_MAX) {
    return { ok: false, field: "description", message: `Keep the description under ${PROJECT_DESCRIPTION_MAX} characters.` };
  }

  const track = typeof raw.track === "string" ? raw.track : "";
  if (track !== "" && !(TRACKS as readonly string[]).includes(track)) {
    return { ok: false, field: "track", message: "Pick one of the four tracks, or leave it for later." };
  }

  return {
    ok: true,
    input: {
      title,
      description: description.length > 0 ? description : null,
      track: track === "" ? null : (track as Track),
    },
  };
}

// Deleting a project needs its name typed back. Trimmed and case-insensitive, as Stasis does it.
export function deleteConfirmed(typed: unknown, title: string): boolean {
  const name = title.trim().toLowerCase();
  return name.length > 0 && typeof typed === "string" && typed.trim().toLowerCase() === name;
}

// A project's track locks when it is submitted. It stays open while the project is a draft, being logged, or sent back for changes.
export function trackLocked(status: string): boolean {
  return status !== "draft" && status !== "logging" && status !== "needs-changes";
}

// The status a project has. Only drafts exist in M1; submission stages arrive with the ship flow.
export function projectStatusLabel(status: string): string {
  if (status === "draft") return "Draft";
  // "in-review" and "needs-changes" read as words ("In review"), as the profile tabs write them.
  const words = status.replace(/[-_]/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
