import { describe, expect, test } from "bun:test";
import { nextStep, type StepProject } from "./next-step";

const project = (id: string, status: string, track: string | null = "Tools"): StepProject => ({ id, title: `Project ${id}`, status, track });

describe("next step", () => {
  test("no projects: start the first one", () => {
    expect(nextStep([])).toMatchObject({ title: "Start your first project", label: "New project", href: "/dashboard/projects" });
  });

  test("a draft without a track asks for a track", () => {
    expect(nextStep([project("a", "draft", null)])).toMatchObject({
      title: "Pick a track for Project a",
      href: "/dashboard/projects/a",
    });
  });

  test("a draft with a track is kept building, newest first", () => {
    expect(nextStep([project("new", "draft"), project("old", "draft")])).toMatchObject({
      title: "Keep building Project new",
      href: "/dashboard/projects/new",
    });
  });

  test("an untracked draft comes before a tracked one", () => {
    expect(nextStep([project("tracked", "draft"), project("bare", "draft", null)]).title).toBe("Pick a track for Project bare");
  });

  test("a project sent back comes before everything else", () => {
    const step = nextStep([project("a", "draft", null), project("b", "needs_changes")]);
    expect(step).toMatchObject({ title: "Fix up Project b", href: "/dashboard/projects/b" });
  });

  test("only submitted work means wait and start another", () => {
    expect(nextStep([project("a", "submitted")])).toMatchObject({ title: "You're in the review queue", label: "New project" });
    expect(nextStep([project("a", "in_review")]).title).toBe("You're in the review queue");
  });

  test("a draft still comes before work in review", () => {
    expect(nextStep([project("a", "in_review"), project("b", "draft")]).title).toBe("Keep building Project b");
  });

  test("everything approved: start the next project", () => {
    expect(nextStep([project("a", "approved")])).toMatchObject({ title: "Start your next project", label: "New project" });
  });
});
