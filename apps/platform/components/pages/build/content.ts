import { DRAFT } from "./logic/constants";
import type { MissionDef } from "./logic/missions";
import type { TrackName } from "./logic/types";

// Sample content for the Build tabs. Everything here is invented for the preview: no real ship, builder or mission
// catalogue. A real service replaces these lists; the components only read the shapes.

function mission(
  def: Omit<MissionDef, "kind" | "rewardOre" | "rewardSource"> & Partial<Pick<MissionDef, "rewardOre" | "rewardSource">>,
): MissionDef {
  return {
    kind: "mission",
    rewardOre: DRAFT.missionRewardOre[def.difficulty],
    rewardSource: "draft",
    ...def,
  };
}

/** Curated missions. Draft preview content: the plans set the mission structure, not the catalogue or rewards. */
export const MISSIONS: MissionDef[] = [
  mission({
    id: "m-first-journal",
    title: "Your first journal entry",
    summary: "Set up a project, link a tracker and write one specific journal entry.",
    track: "Any",
    difficulty: "beginner",
    minutes: 30,
    hardware: false,
    prerequisites: [],
    steps: [
      { id: "s1", title: "Create a project", detail: "Add a project in Projects with a name, a summary and a track." },
      { id: "s2", title: "Connect the tracker", detail: "On the project's Evidence tab, connect Hackatime (software) or Lapse (hardware) and allocate some hours." },
      { id: "s3", title: "Write a journal entry", detail: "In Journals, say what you worked on, what changed, what went wrong and what comes next. Be specific enough for another builder to verify." },
      { id: "s4", title: "Read your cadence", detail: "Open the cadence panel and note how many hours remain before the next entry is due." },
    ],
    submissionGuide: "Give the title of your entry and one sentence on what a reviewer could verify from it.",
    needsUrl: false,
  }),
  mission({
    id: "m-open-source",
    title: "Make it open source",
    summary: "Publish the source under an open-source licence so the project can be accepted.",
    track: "Any",
    difficulty: "beginner",
    minutes: 40,
    hardware: false,
    prerequisites: ["m-first-journal"],
    steps: [
      { id: "s1", title: "Choose an open-source licence", detail: "Pick a licence from the list in the project form. Closed or missing licences cannot be accepted." },
      { id: "s2", title: "Publish a public repository", detail: "Push the source, and for hardware the design files, to a repository anyone can open." },
      { id: "s3", title: "Add the licence file and README", detail: "Include the licence text and a README that says what the project is." },
      { id: "s4", title: "Check it as a stranger", detail: "Open the link in a private window and confirm you can read the code without signing in." },
    ],
    submissionGuide: "Link the repository and name the licence you chose.",
    needsUrl: true,
  }),
  mission({
    id: "m-readme",
    title: "A README someone else can run",
    summary: "Write setup and usage steps, then prove a fresh checkout follows them.",
    track: "Any",
    difficulty: "intermediate",
    minutes: 60,
    hardware: false,
    prerequisites: ["m-open-source"],
    steps: [
      { id: "s1", title: "List prerequisites", detail: "Say which tools and versions are needed before the first command." },
      { id: "s2", title: "Write the setup commands", detail: "Give the exact commands to install, build and run." },
      { id: "s3", title: "Show one usage example", detail: "Include an example with its expected output." },
      { id: "s4", title: "State the known limits", detail: "Say what does not work yet, so reviewers do not have to guess." },
      { id: "s5", title: "Test it on a fresh checkout", detail: "Follow your own README from a clean clone, or ask someone else to, and fix what breaks." },
    ],
    submissionGuide: "Link the README and describe what you had to fix after the fresh-checkout test.",
    needsUrl: true,
  }),
  mission({
    id: "m-benchmark",
    title: "Measure a hot path",
    summary: "Record a repeatable baseline, change one thing and measure again.",
    track: "Systems",
    difficulty: "intermediate",
    minutes: 90,
    hardware: false,
    prerequisites: ["m-open-source"],
    steps: [
      { id: "s1", title: "Pick one workload", detail: "Choose a task in your project that you can run the same way every time." },
      { id: "s2", title: "Record a baseline", detail: "Run it several times and note the command, the machine and the numbers." },
      { id: "s3", title: "Change one thing", detail: "Make a single change you expect to affect the result." },
      { id: "s4", title: "Measure again", detail: "Use the same command and machine. Compare before and after." },
      { id: "s5", title: "Write up the result", detail: "State what changed, by how much, and what you would try next." },
    ],
    submissionGuide: "Link the write-up and give the before and after numbers.",
    needsUrl: true,
  }),
  mission({
    id: "m-bom",
    title: "A bill of materials for a build",
    summary: "List every part with a quantity, a cost and a source, as Hardware ships require.",
    track: "Hardware",
    difficulty: "intermediate",
    minutes: 60,
    hardware: true,
    prerequisites: ["m-first-journal"],
    steps: [
      { id: "s1", title: "List every part", detail: "Include the small things: connectors, fasteners, headers." },
      { id: "s2", title: "Add quantities and unit costs", detail: "Use one currency throughout." },
      { id: "s3", title: "Add a source for each part", detail: "A supplier link or vendor name for every row." },
      { id: "s4", title: "Check the total", detail: "Add the totals up by hand and compare with the editor on the Evidence tab." },
    ],
    submissionGuide: "Say how many parts you listed and what the total came to.",
    needsUrl: false,
  }),
  mission({
    id: "m-review-two",
    title: "Review two ships",
    summary: "Complete two peer reviews with scores and a written reason for each.",
    track: "Any",
    difficulty: "beginner",
    minutes: 45,
    hardware: false,
    prerequisites: ["m-first-journal"],
    steps: [
      { id: "s1", title: "Claim an assignment", detail: "In Reviews, claim the next ship in the queue." },
      { id: "s2", title: "Read the work", detail: "Read the summary, the evidence and the repository before scoring." },
      { id: "s3", title: "Score and explain", detail: "Score all four categories from 1 to 9 and write at least ten words of reasoning." },
      { id: "s4", title: "Do it a second time", detail: "Finish the first review, then claim and review a second ship." },
    ],
    submissionGuide: "Say what you looked at before scoring, and one thing that changed your mind.",
    needsUrl: false,
  }),
  mission({
    id: "m-ship-end-to-end",
    title: "Ship a project end to end",
    summary: "Pass the ship checklist and take a project through the full review pipeline.",
    track: "Any",
    difficulty: "advanced",
    minutes: 240,
    hardware: false,
    prerequisites: ["m-readme", "m-review-two"],
    steps: [
      { id: "s1", title: "Pass every ship check", detail: "Open source, tracker, journals, summary and AI declaration all pass on the project's Ship tab." },
      { id: "s2", title: "Submit the ship", detail: "Submit it and watch it move through the team check." },
      { id: "s3", title: "Collect twelve reviews", detail: "Reviews arrive from peers. Keep your own review duty moving meanwhile." },
      { id: "s4", title: "Wait out both clocks", detail: "The 24-hour journal-age gate and the 24-hour flag window both have to close." },
      { id: "s5", title: "Read your feedback", detail: "Read every score and written reason on My ship feedback." },
    ],
    submissionGuide: "Link the project and summarise the scores and reasons you received.",
    needsUrl: true,
  }),
];

function quest(
  id: string,
  title: string,
  summary: string,
  track: TrackName | "Any",
  rewardOre: number,
  steps: [string, string][],
  submissionGuide: string,
): MissionDef {
  return {
    id,
    kind: "quest",
    title,
    summary,
    track,
    difficulty: "intermediate",
    minutes: 120,
    hardware: track === "Hardware",
    prerequisites: [],
    steps: steps.map(([stepTitle, detail], index) => ({ id: `s${index + 1}`, title: stepTitle, detail })),
    submissionGuide,
    needsUrl: true,
    rewardOre,
    rewardSource: "plan-example",
  };
}

/**
 * Seasonal quests. The titles and example Ore values come from Plan 02 section 23 ("Examples"); the plan does not
 * make them final and Plan 11 says live values must come from configured server state. Shown as examples.
 */
export const QUESTS: MissionDef[] = [
  quest("q-2x", "2X", "Improve a measured workload by 2x.", "Compute", 50,
    [["Measure the starting point", "Record the workload, the command and the baseline numbers."], ["Make it faster", "Change the code, not the test."], ["Show the 2x", "Measure again the same way and show both results."]],
    "Link the before and after results."),
  quest("q-local", "LOCAL", "Run something normally cloud-hosted on hardware you control.", "Systems", 40,
    [["Pick the service", "Choose something you would usually rent from a cloud provider."], ["Run it yourself", "Set it up on a machine you control."], ["Prove it works", "Show it handling a real request and say what it cost to run."]],
    "Link your write-up and name the hardware you used."),
  quest("q-first-pcb", "FIRST PCB", "Design or order your first PCB.", "Hardware", 50,
    [["Design the board", "Capture the schematic and lay out the board."], ["Check it", "Run the design rule checks and fix what they find."], ["Order or fabricate it", "Send it to a fab or make it yourself."]],
    "Link the design files and a photo of the board."),
  quest("q-ship-to-someone", "SHIP TO SOMEONE", "Get another person to actually use or install your project.", "Any", 30,
    [["Find a user", "Ask someone outside your team to try it."], ["Watch them use it", "Note where they got stuck."], ["Record the result", "Write down what they did and what you changed after."]],
    "Link to the project and describe who used it, without naming anyone who has not agreed."),
  quest("q-100-users", "100 USERS", "Reach 100 genuine users.", "Any", 100,
    [["Count real users", "Use a measure that counts people, not page loads."], ["Check for fakes", "Remove bots, duplicates and your own team."], ["Show the count", "Explain how you counted and what the number covers."]],
    "Link the evidence and explain how the count was made."),
  quest("q-smaller", "SMALLER", "Reduce a build, model or storage footprint significantly.", "Any", 40,
    [["Measure the size", "Record the starting size and how you measured it."], ["Shrink it", "Make a change that reduces it."], ["Show the saving", "Measure the same way and report the difference."]],
    "Link the before and after sizes."),
];

export const ALL_MISSION_DEFS: MissionDef[] = [...MISSIONS, ...QUESTS];

export function missionTitle(id: string): string {
  return ALL_MISSION_DEFS.find((def) => def.id === id)?.title ?? id;
}

export interface ReviewShip {
  id: string;
  /** Anonymised code name shown instead of any builder or project name. */
  codename: string;
  track: TrackName;
  researchMode: boolean;
  hours: number;
  license: string;
  summary: string;
  capability: string;
  journals: number;
  /** Sample repository label. Not a link: nothing here leaves the preview. */
  repoLabel: string;
}

/** Anonymised sample ships waiting for review. Invented; none of them is a real project. */
export const REVIEW_SHIPS: ReviewShip[] = [
  { id: "rs-1", codename: "Ship R-0412", track: "Tools", researchMode: false, hours: 18.5, license: "MIT", capability: "Makes it faster to find which commit introduced a slow test.", summary: "A command-line tool that bisects test timings across a git history and prints the first commit that slowed a test down. Includes a config file format and a CI example.", journals: 3, repoLabel: "git host / sample / test-bisect" },
  { id: "rs-2", codename: "Ship R-0413", track: "Systems", researchMode: false, hours: 31, license: "Apache-2.0", capability: "A small job scheduler other builders can embed.", summary: "A cooperative scheduler with priorities and a deterministic test mode. Written in a systems language with a thin binding layer for scripts.", journals: 5, repoLabel: "git host / sample / tiny-sched" },
  { id: "rs-3", codename: "Ship R-0414", track: "Hardware", researchMode: false, hours: 22, license: "CERN-OHL-P-2.0", capability: "A low-cost sensor board that logs to a card without a computer.", summary: "A two-layer board with a temperature sensor, a card slot and a coin cell. Firmware, schematic, layout and a bill of materials are in the repository.", journals: 4, repoLabel: "git host / sample / logger-board" },
  { id: "rs-4", codename: "Ship R-0415", track: "Compute", researchMode: true, hours: 27.5, license: "BSD-3-Clause", capability: "Shows how three matrix-multiply kernels compare on small GPUs.", summary: "A benchmark harness and write-up comparing three kernels across batch sizes, with the raw timings and the script that produced each chart.", journals: 4, repoLabel: "git host / sample / kernel-bench" },
  { id: "rs-5", codename: "Ship R-0416", track: "Tools", researchMode: false, hours: 12, license: "MIT", capability: "Lints configuration files for a common build tool.", summary: "A linter with twenty rules, a fix mode and editor integration notes. Rules are documented with examples of each failure.", journals: 2, repoLabel: "git host / sample / config-lint" },
  { id: "rs-6", codename: "Ship R-0417", track: "Systems", researchMode: false, hours: 40, license: "GPL-3.0-only", capability: "A tiny key-value store with a write-ahead log.", summary: "Single-file store with crash recovery tests that kill the process at random points. The journal records two redesigns of the log format.", journals: 6, repoLabel: "git host / sample / tiny-kv" },
  { id: "rs-7", codename: "Ship R-0418", track: "Hardware", researchMode: false, hours: 35, license: "CERN-OHL-S-2.0", capability: "A motor driver board that can be built from stock parts.", summary: "A stepper driver with current sensing. The bill of materials lists stock parts with two alternative suppliers for each, and the layout files are included.", journals: 5, repoLabel: "git host / sample / stepper-driver" },
  { id: "rs-8", codename: "Ship R-0419", track: "Compute", researchMode: false, hours: 20, license: "Apache-2.0", capability: "A small ray marcher that runs in a browser tab.", summary: "A shader-based renderer with three scenes and a frame-time overlay. The write-up explains the distance functions used.", journals: 3, repoLabel: "git host / sample / march-lite" },
  { id: "rs-9", codename: "Ship R-0420", track: "Tools", researchMode: true, hours: 16, license: "ISC", capability: "Measures how often a popular linter's rule fires on real projects.", summary: "A study of one linter rule across a few hundred open repositories, with the dataset and the scripts to rebuild it.", journals: 3, repoLabel: "git host / sample / rule-census" },
  { id: "rs-10", codename: "Ship R-0421", track: "Systems", researchMode: false, hours: 25, license: "MPL-2.0", capability: "Makes a home server easier to monitor with a single binary.", summary: "A status agent that exposes disk, memory and service health over a small HTTP page, with a short threat model.", journals: 4, repoLabel: "git host / sample / shelf-status" },
  { id: "rs-11", codename: "Ship R-0422", track: "Hardware", researchMode: false, hours: 14, license: "MIT", capability: "A macro pad with a documented firmware layer.", summary: "A nine-key pad with a custom firmware layer and a one-page assembly guide. Bill of materials and case files included.", journals: 3, repoLabel: "git host / sample / pad-nine" },
  { id: "rs-12", codename: "Ship R-0423", track: "Compute", researchMode: false, hours: 33, license: "MIT", capability: "A quantiser that shrinks a small model with a measured accuracy cost.", summary: "A tool that converts a model to 8-bit and reports the accuracy and speed change on a test set, with the exact commands used.", journals: 5, repoLabel: "git host / sample / quant-tiny" },
];
