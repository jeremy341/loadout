import { canonicalStatus } from "./ship";

export type StepProject = { id: string; title: string; status: string; track: string | null };

export type NextStep = { title: string; text: string; label: string; href: string };

const open = (project: StepProject) => `/dashboard/projects/${project.id}`;

// The one thing to do next, read top-down so the first match wins (the same idea as Pixl's Next up card). Projects come
// newest first. Only drafts exist in M1; the review states are here so the card is right once submitting opens.
export function nextStep(projects: StepProject[]): NextStep {
  const sentBack = projects.find((project) => canonicalStatus(project.status) === "needs-changes");
  if (sentBack) {
    return {
      title: `Fix up ${sentBack.title}`,
      text: "A reviewer sent this one back. Sort out what they flagged and ship it again.",
      label: "Open project",
      href: open(sentBack),
    };
  }

  const building = projects.filter((project) => project.status === "draft" || project.status === "logging");
  const untracked = building.find((project) => project.track === null);
  if (untracked) {
    return {
      title: `Pick a track for ${untracked.title}`,
      text: "Its hours only count toward a track once it has one.",
      label: "Open project",
      href: open(untracked),
    };
  }
  if (building[0]) {
    return {
      title: `Keep building ${building[0].title}`,
      text: "Every approved hour adds a metre of depth.",
      label: "Open project",
      href: open(building[0]),
    };
  }

  if (projects.some((project) => ["submitted", "in-review", "second-pass"].includes(canonicalStatus(project.status)))) {
    return {
      title: "You're in the review queue",
      text: "Nothing to do but wait. Start the next one while you're here.",
      label: "New project",
      href: "/dashboard/projects",
    };
  }

  if (projects.length === 0) {
    return {
      title: "Start your first project",
      text: "Pick something small and real. It takes a name and a track.",
      label: "New project",
      href: "/dashboard/projects",
    };
  }

  return {
    title: "Start your next project",
    text: "Everything is approved. Pick something new and real.",
    label: "New project",
    href: "/dashboard/projects",
  };
}
