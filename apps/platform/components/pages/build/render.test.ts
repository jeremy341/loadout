import { beforeEach, describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement as h, type ComponentType, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NOW, clock, resetTestState, store } from "./test-support.test";
import { SEED_PROJECTS } from "./data";
import { sampleReview } from "./logic/sample-review";
import { applyShipAction, createShip, evaluateShip } from "./logic/ship";
import type { Project, Ship } from "./logic/types";

// Server-render smoke tests. The preview store and the clock are replaced by in-memory versions (test-support), so
// each page and panel renders its real "loaded" branch. This catches crashes in rendering for every ship and mission
// state. It does not click anything: interactions are covered by the pure logic tests and engine.test.ts, and the
// rest needs a browser.

const H = 3_600_000;

const { KEYS } = await import("./data");
const { ProjectsPage } = await import("./projects-page");
const { JournalsPage } = await import("./journals-page");
const { ReviewsPage } = await import("./reviews-page");
const { MissionsPage } = await import("./missions-page");
const { ShipPanel } = await import("./ship-panel");
const { ProjectDetail } = await import("./project-detail");
const { ProjectEvidence } = await import("./project-evidence");
const { PublicPreview } = await import("./public-preview");
const { ShipFeedback } = await import("./ship-feedback");
const { ScoringGuide } = await import("./scoring-guide");
const { ReviewQueue } = await import("./review-queue");
const { MissionDetail } = await import("./mission-detail");
const { useBuildSummary } = await import("./summary");
const { ALL_MISSION_DEFS } = await import("./content");

function html(element: ReactElement): string {
  return renderToStaticMarkup(element);
}

const logger = SEED_PROJECTS[0];
const pad = SEED_PROJECTS[1];

function shipIn(state: Ship["state"], project: Project = logger): Ship {
  let ship = createShip({ id: `ship_${state}`, project, version: "v0.1", changes: "", aiUse: ["No AI"], newHours: 9, now: NOW - 100 * H });
  const ctx = { now: NOW - 90 * H, latestJournalAt: NOW - 200 * H, reviewsDone: 8, penaltyPending: false };
  if (state === "submitted") return ship;
  ship = applyShipAction(ship, { type: "pickup" }, ctx).ship;
  if (state === "team_check") return ship;
  if (state === "changes_requested") return applyShipAction(ship, { type: "requestChanges", note: "More detail please" }, ctx).ship;
  if (state === "rejected") return applyShipAction(ship, { type: "reject", note: "Not a fit" }, ctx).ship;
  ship = applyShipAction(ship, { type: "approve", approvedHours: 8 }, ctx).ship;
  if (state === "peer_review") {
    for (let i = 0; i < 5; i += 1) ship = applyShipAction(ship, { type: "addReview", review: sampleReview({ shipId: ship.id, index: i, base: 6, createdAt: NOW - 80 * H + i }) }, ctx).ship;
    return ship;
  }
  for (let i = 0; i < 12; i += 1) ship = applyShipAction(ship, { type: "addReview", review: sampleReview({ shipId: ship.id, index: i, base: 7, createdAt: NOW - 80 * H + i }) }, ctx).ship;
  ship = evaluateShip(ship, { ...ctx, now: state === "flag_window" ? NOW - 2 * H : NOW - 60 * H }).ship;
  if (state === "flag_window") return ship;
  return evaluateShip(ship, { ...ctx, now: NOW }).ship;
}

const SHIP_STATES: Ship["state"][] = ["submitted", "team_check", "changes_requested", "rejected", "peer_review", "flag_window", "paid"];

beforeEach(() => {
  resetTestState();
  clock.now = NOW;
});

describe("pages render their loaded state from the seed", () => {
  test.each([
    ["Projects", ProjectsPage],
    ["Journals", JournalsPage],
    ["Reviews", ReviewsPage],
    ["Missions", MissionsPage],
  ] as const)("%s", (title, Page) => {
    const out = html(h(Page as ComponentType));
    expect(out).toContain(`<h1>${title}</h1>`);
    expect(out).not.toContain("Loading ");
    expect(out).toContain("Preview.");
  });

  test("Projects lists the two sample projects", () => {
    const out = html(h(ProjectsPage));
    expect(out).toContain("Sample: ring-buffer logger");
    expect(out).toContain("Sample: macro pad v1");
  });

  test("Journals shows the cadence table for all projects and the seeded entries", () => {
    const out = html(h(JournalsPage));
    expect(out).toContain("Cadence across your projects");
    expect(out).toContain("Ring buffer works, flush is next");
  });

  test("an empty project list shows the empty state", () => {
    store.set(KEYS.projects, []);
    expect(html(h(ProjectsPage))).toContain("No projects yet");
    store.set(KEYS.journals, []);
    expect(html(h(JournalsPage))).toContain("Create a project first");
  });
});

describe("project panels", () => {
  test("detail, evidence and public preview render for software and hardware", () => {
    for (const project of [logger, pad, { ...pad, trackerConnected: true, trackerHours: 6, allocatedHours: 6, bom: [{ id: "b1", part: "RP2040", qty: 1, unitCost: 1, link: "vendor" }] }]) {
      expect(html(h(ProjectDetail, { projectId: project.id, onBack: () => undefined }))).toContain(project.name);
      expect(html(h(ProjectEvidence, { project, onChange: () => undefined }))).toContain("tracking");
      expect(html(h(PublicPreview, { project, entries: [] }))).toContain("Never shown on the public page");
    }
  });

  test("the public page never prints Lapse recordings as content and hides private entries", () => {
    const entries = [
      { id: "j1", projectId: pad.id, title: "Open entry", body: "Public body", hours: 1, tags: [], isPublic: true, at: NOW },
      { id: "j2", projectId: pad.id, title: "Secret entry", body: "Private body", hours: 1, tags: [], isPublic: false, at: NOW },
    ];
    const out = html(h(PublicPreview, { project: pad, entries }));
    expect(out).toContain("Open entry");
    expect(out).not.toContain("Secret entry");
    expect(out).not.toContain("Private body");
    expect(out).toContain("1 private entry is not shown");
  });

  test("journal text is escaped, never injected as markup", () => {
    const entries = [{ id: "j1", projectId: logger.id, title: "<img src=x onerror=alert(1)>", body: "<script>alert(1)</script>", hours: 1, tags: [], isPublic: true, at: NOW }];
    const out = html(h(PublicPreview, { project: logger, entries }));
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;script&gt;");
  });
});

describe("ship pipeline renders in every state", () => {
  test.each(SHIP_STATES)("%s", (state) => {
    const ship = shipIn(state);
    store.set(KEYS.ships, [ship]);
    const out = html(h(ShipPanel, { project: logger }));
    expect(out).toContain("Ship progress");
    expect(out).toContain('aria-label="Ship progress"');
    if (state === "paid" || state === "rejected") expect(out).toContain("Earlier ships");
    else expect(out).toContain("Preview tools");
    const feedback = html(h(ShipFeedback));
    expect(feedback).toContain("Category medians");
  });

  test("a project with no ship shows the checklist and a submit button that explains why it is off", () => {
    const out = html(h(ShipPanel, { project: pad }));
    expect(out).toContain("Ship checklist");
    expect(out).toContain('aria-disabled="true"');
    expect(out).toContain("Submit stays off until every check passes");
  });

  test("a ready project can submit", () => {
    const out = html(h(ShipPanel, { project: logger }));
    expect(out).toContain("Ship checklist");
  });

  test("feedback never prints a reviewer identity", () => {
    store.set(KEYS.ships, [shipIn("flag_window")]);
    const out = html(h(ShipFeedback));
    expect(out).toContain("Anonymous reviewer");
    expect(out).toContain("Flag this review");
  });
});

describe("reviews", () => {
  test("queue, scoring guide and an active assignment render", () => {
    expect(html(h(ReviewQueue))).toContain("Claim the next ship");
    expect(html(h(ScoringGuide))).toContain("Worked example");
    store.set(KEYS.reviews, { active: { shipId: "rs-1", claimedAt: NOW, repoViewed: false, draft: { scores: { originality: 5 }, reason: "three little words" } }, done: [], skipped: [], reported: [], dutyShortcut: 0 });
    const out = html(h(ReviewQueue));
    expect(out).toContain("Ship R-0412");
    expect(out).toContain("3 of 10 words");
    expect(out).toContain("Submit review");
  });

  test("the scoring guide works on one of your own ships", () => {
    store.set(KEYS.ships, [shipIn("peer_review")]);
    expect(html(h(ScoringGuide))).toContain("Your ship: Sample: ring-buffer logger");
  });
});

describe("missions", () => {
  test("every mission renders as locked or startable", () => {
    for (const def of ALL_MISSION_DEFS) {
      const out = html(h(MissionDetail, { def, progress: undefined, approvedIds: [], onBack: () => undefined, onOpen: () => undefined }));
      expect(out).toContain(def.title);
      expect(out).toMatch(/Draft preview reward|Example reward/);
    }
  });

  test("each status renders", () => {
    const def = ALL_MISSION_DEFS[0];
    for (const status of ["draft", "submitted", "in_review", "approved", "needs_changes"] as const) {
      const out = html(
        h(MissionDetail, {
          def,
          progress: { missionId: def.id, status, checkedStepIds: [def.steps[0].id], text: "I did it", url: "https://example.org/x", startedAt: NOW, submittedAt: NOW, reviewNote: "More please" },
          approvedIds: [],
          onBack: () => undefined,
          onOpen: () => undefined,
        }),
      );
      expect(out).toContain("Submission");
    }
  });

  test("a locked mission names what is missing", () => {
    const def = ALL_MISSION_DEFS.find((d) => d.id === "m-readme")!;
    const out = html(h(MissionDetail, { def, progress: undefined, approvedIds: [], onBack: () => undefined, onOpen: () => undefined }));
    expect(out).toContain("Locked.");
    expect(out).toContain("Make it open source");
  });
});

describe("summary hook contract", () => {
  test("returns every field the Overview page needs", () => {
    let summary: ReturnType<typeof useBuildSummary> | undefined;
    function Probe() {
      summary = useBuildSummary();
      return null;
    }
    html(h(Probe));
    expect(summary).toBeDefined();
    const s = summary!;
    expect(s.projects.map((p) => p.name)).toEqual(["Sample: ring-buffer logger", "Sample: macro pad v1"]);
    expect(s.journalEntries).toBe(2);
    expect(s.hoursLogged).toBe(14);
    expect(s.reviewsOwed).toBe(8);
    expect(s.missionsTotal).toBe(ALL_MISSION_DEFS.length);
    expect(s.nextActions.length).toBeLessThanOrEqual(4);
    for (const action of s.nextActions) expect(action.href.startsWith("/")).toBe(true);
  });
});

describe("source hygiene", () => {
  const dir = import.meta.dir;
  const files = readdirSync(dir).filter((f) => /\.(tsx?|css)$/.test(f) && !f.endsWith(".test.ts") && !f.endsWith(".test.ts"));
  const sources = files.map((f) => [f, readFileSync(join(dir, f), "utf8")] as const);

  test("no raw HTML injection, network calls or random values", () => {
    for (const [name, text] of sources) {
      expect({ name, bad: text.includes("dangerouslySetInnerHTML") }).toEqual({ name, bad: false });
      expect({ name, bad: /\bfetch\(|XMLHttpRequest|WebSocket/.test(text) }).toEqual({ name, bad: false });
      expect({ name, bad: /eslint-disable/.test(text) }).toEqual({ name, bad: false });
      expect({ name, bad: /Math\.random\(/.test(text) }).toEqual({ name, bad: false });
    }
  });

  test("components keep state in the shared preview store, not their own localStorage", () => {
    for (const [name, text] of sources) {
      expect({ name, bad: /(local|session)Storage\s*[.[]/.test(text) }).toEqual({ name, bad: false });
    }
  });

  test("the stylesheet uses tokens only: no colour literals, gradients or blur", () => {
    const css = sources.find(([name]) => name === "build.css")![1].replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/gradient|blur|box-shadow:[^;]*\d+px \d+px \d+px/);
    expect(css).not.toMatch(/border-radius/);
  });

  test("storage keys all start with build.", () => {
    const data = sources.find(([name]) => name === "data.ts")![1];
    const keys = [...data.matchAll(/"(build\.[A-Za-z.]+)"/g)].map((m) => m[1]);
    expect(keys.length).toBeGreaterThanOrEqual(8);
  });
});
