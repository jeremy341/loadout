// Pure rules for the New project wizard: the five steps, what makes each one valid, and which step a server error belongs to.
// No framework here, so every rule has a bun test.
import { checkLinkUrl } from "./profile";
import { descriptionProblem, kindOfTrack, titleProblem, type ProjectField } from "./projects";

export const WIZARD_STEPS = [
  { key: "kind", label: "Kind", heading: "What kind of project is it?" },
  { key: "idea", label: "Idea", heading: "What's your idea?" },
  { key: "name", label: "Name", heading: "What's it called?" },
  { key: "links", label: "Links", heading: "Link it up" },
  { key: "review", label: "Review", heading: "Ready to start?" },
] as const;

export type WizardDraft = {
  track: string;
  description: string;
  title: string;
  repoUrl: string;
  demoUrl: string;
};

export const EMPTY_DRAFT: WizardDraft = { track: "", description: "", title: "", repoUrl: "", demoUrl: "" };

// The message that stops a step, or null when the step is fine. Step numbers are 0 to 4.
export function stepProblem(step: number, draft: WizardDraft): { field: ProjectField; message: string } | null {
  if (step === 0) return kindOfTrack(draft.track) ? null : { field: "track", message: "Pick a kind, and a track if it is software." };
  if (step === 1) {
    const message = descriptionProblem(draft.description);
    return message ? { field: "description", message } : null;
  }
  if (step === 2) {
    const message = titleProblem(draft.title);
    return message ? { field: "title", message } : null;
  }
  if (step === 3) {
    const repo = checkLinkUrl(draft.repoUrl, "source link");
    if (!repo.ok) return { field: "repoUrl", message: repo.message };
    const demo = checkLinkUrl(draft.demoUrl, "demo link");
    if (!demo.ok) return { field: "demoUrl", message: demo.message };
  }
  return null;
}

export function stepValid(step: number, draft: WizardDraft): boolean {
  return stepProblem(step, draft) === null;
}

// The last step a builder may open: every step before it is valid. Steps 1 to 4 are the only ones that can stop the way.
export function reachableStep(draft: WizardDraft): number {
  for (let step = 0; step < WIZARD_STEPS.length - 1; step += 1) {
    if (!stepValid(step, draft)) return step;
  }
  return WIZARD_STEPS.length - 1;
}

// The step that owns a field, so a server error can send the builder back to it.
export function stepOfField(field: string | undefined): number {
  if (field === "track") return 0;
  if (field === "description") return 1;
  if (field === "title") return 2;
  if (field === "repoUrl" || field === "demoUrl") return 3;
  return 4;
}

// Has anything been typed or chosen? Used by the Close button to decide whether to ask.
export function draftDirty(draft: WizardDraft): boolean {
  return Object.values(draft).some((value) => value.trim().length > 0);
}

// Read a saved draft back from sessionStorage text. Anything unexpected gives an empty draft, never an error.
export function parseDraft(text: string | null): WizardDraft {
  if (!text) return EMPTY_DRAFT;
  try {
    const raw = JSON.parse(text) as Partial<Record<keyof WizardDraft, unknown>>;
    const pick = (key: keyof WizardDraft) => (typeof raw[key] === "string" ? (raw[key] as string).slice(0, 600) : "");
    return { track: pick("track"), description: pick("description"), title: pick("title"), repoUrl: pick("repoUrl"), demoUrl: pick("demoUrl") };
  } catch {
    return EMPTY_DRAFT;
  }
}

// The step a saved draft was on, kept in the same saved text. It never goes past the last step the draft allows.
export function parseSavedStep(text: string | null, draft: WizardDraft): number {
  const reachable = reachableStep(draft);
  if (!text) return reachable;
  try {
    const raw = JSON.parse(text) as { step?: unknown };
    const step = typeof raw.step === "number" && Number.isInteger(raw.step) ? raw.step : reachable;
    return Math.min(Math.max(step, 0), reachable);
  } catch {
    return reachable;
  }
}
