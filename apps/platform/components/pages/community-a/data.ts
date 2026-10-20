import type {
  ActivityEvent,
  CommunityComment,
  Idea,
  IdeaStatus,
  ModerationState,
  ReactionMap,
  SampleProject,
  ShowPost,
  SocialState,
} from "./logic/types";

// Storage keys, empty/initial values and SAMPLE seed data for Explore, Ideas, Show & Tell and Friends.
// Everything below is invented for the preview: no real builder, project, idea or number. Sample content is
// placeholder data only and the pages say so. Keep every export a module-level constant (usePreviewState
// needs a stable `initial`).

export * from "./logic/types";
export { DRAFT_RULES, COMMUNITY_CONDUCT } from "./logic/rules";

export const KEYS = {
  /** Ideas created in this browser. */
  ideas: "comm.ideas",
  /** Show & Tell posts created in this browser. */
  posts: "comm.posts",
  /** Comments written in this browser (sample comments are in code). */
  comments: "comm.comments",
  /** Item reference -> handles that liked or upvoted it. */
  reactions: "comm.reactions",
  social: "comm.social",
  moderation: "comm.moderation",
  /** Sample ideas whose status a preview tool changed: idea id -> status. */
  ideaStatus: "comm.ideaStatus",
  /** Events created by the preview tools. */
  activity: "comm.activity",
} as const;

// ---------------------------------------------------------------------------------------------------------
// Sample public projects (Explore)

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: "p-quickshell",
    title: "Quickshell",
    summary: "A command-line tool that sets up a development environment from a single file, so a new laptop is ready in one command.",
    handle: "ada-cuts",
    track: "Tools",
    tags: ["cli", "devtools", "rust"],
    repoText: "github.com/ada-cuts/quickshell",
    at: "2026-10-16T09:00:00.000Z",
    baseLikes: 41,
    journals: [
      { id: "j-qs-1", title: "Parsing the setup file", at: "2026-10-04T18:00:00.000Z", excerpt: "Chose a flat key-value format over YAML after the third indentation bug. Errors now point at the exact line." },
      { id: "j-qs-2", title: "Dry runs first", at: "2026-10-10T17:30:00.000Z", excerpt: "Every step can print what it would do. Added a diff view so you see changes before anything is installed." },
      { id: "j-qs-3", title: "Windows paths, again", at: "2026-10-15T20:10:00.000Z", excerpt: "Spent two hours on a trailing backslash. Wrote a test table of awkward paths so it stays fixed." },
    ],
  },
  {
    id: "p-pocketlint",
    title: "Pocketlint",
    summary: "A small linter for tiny configuration languages, with rules you can write in ten lines.",
    handle: "gus-parse",
    track: "Tools",
    tags: ["linter", "parser"],
    repoText: "github.com/gus-parse/pocketlint",
    at: "2026-10-14T12:00:00.000Z",
    baseLikes: 27,
    journals: [
      { id: "j-pl-1", title: "A rule is a function", at: "2026-10-06T16:00:00.000Z", excerpt: "Rules take a syntax node and return messages. No plugin API, just functions in a folder." },
      { id: "j-pl-2", title: "Fixing what it finds", at: "2026-10-13T19:00:00.000Z", excerpt: "Autofix works for four rules. The hard part is keeping comments in place." },
    ],
  },
  {
    id: "p-tinyvm",
    title: "Tinyvm",
    summary: "A stack virtual machine with an assembler and a step debugger that runs in a browser tab.",
    handle: "gus-parse",
    track: "Tools",
    tags: ["vm", "parser", "debugger"],
    repoText: "github.com/gus-parse/tinyvm",
    at: "2026-09-29T10:00:00.000Z",
    baseLikes: 19,
    journals: [
      { id: "j-tv-1", title: "Twelve opcodes", at: "2026-09-22T15:00:00.000Z", excerpt: "Started with twelve opcodes and wrote a Fibonacci program to find the missing ones." },
      { id: "j-tv-2", title: "Stepping backwards", at: "2026-09-28T21:00:00.000Z", excerpt: "Recording each step makes reverse stepping free. Memory use is the cost." },
    ],
  },
  {
    id: "p-ferry",
    title: "Ferry",
    summary: "A cooperative task scheduler that records every decision so a failing run can be replayed exactly.",
    handle: "bit-ferry",
    track: "Systems",
    tags: ["scheduler", "testing", "rust"],
    repoText: "github.com/bit-ferry/ferry",
    at: "2026-10-18T14:00:00.000Z",
    baseLikes: 33,
    journals: [
      { id: "j-fe-1", title: "Deterministic by design", at: "2026-10-08T17:00:00.000Z", excerpt: "All randomness comes from one seeded source, so the same seed replays the same schedule." },
      { id: "j-fe-2", title: "Breaking it on purpose", at: "2026-10-17T20:00:00.000Z", excerpt: "A fuzz loop found a starvation bug in 40 seconds. The fix was a one-line change to the run queue." },
    ],
  },
  {
    id: "p-shelf",
    title: "Shelf",
    summary: "A three-node home cluster on a bookshelf, with notes on cooling, networking and what broke first.",
    handle: "fern-ops",
    track: "Systems",
    tags: ["self-hosting", "networking"],
    repoText: "github.com/fern-ops/shelf",
    at: "2026-10-11T08:00:00.000Z",
    baseLikes: 24,
    journals: [
      { id: "j-sh-1", title: "Power first", at: "2026-10-02T19:00:00.000Z", excerpt: "One supply for all three nodes. Measured idle draw before adding anything else." },
      { id: "j-sh-2", title: "The switch was the bottleneck", at: "2026-10-09T18:00:00.000Z", excerpt: "Moved storage traffic to its own cable and throughput doubled." },
    ],
  },
  {
    id: "p-rotator",
    title: "Backup rotator",
    summary: "A tiny daemon that keeps daily, weekly and monthly backups and verifies each one by restoring a sample file.",
    handle: "fern-ops",
    track: "Systems",
    tags: ["self-hosting", "backup"],
    repoText: "github.com/fern-ops/backup-rotator",
    at: "2026-09-20T11:00:00.000Z",
    baseLikes: 12,
    journals: [{ id: "j-br-1", title: "A backup you never restored is a guess", at: "2026-09-19T20:00:00.000Z", excerpt: "Added the restore check after the first test failed silently." }],
  },
  {
    id: "p-flamelite",
    title: "Flamelite",
    summary: "A sampling profiler that writes a self-contained HTML flame graph you can send to a friend.",
    handle: "ivo-trace",
    track: "Systems",
    tags: ["profiling", "visualisation"],
    repoText: "github.com/ivo-trace/flamelite",
    at: "2026-10-13T16:00:00.000Z",
    baseLikes: 38,
    journals: [
      { id: "j-fl-1", title: "Sampling at 99 Hz", at: "2026-10-05T17:00:00.000Z", excerpt: "A prime-ish rate avoids lining up with timers. Overhead stayed under three percent." },
      { id: "j-fl-2", title: "One file output", at: "2026-10-12T18:30:00.000Z", excerpt: "The graph, its data and the viewer are in one HTML file, no server needed." },
    ],
  },
  {
    id: "p-shaderlab",
    title: "Shader lab",
    summary: "A browser playground for GPU shaders with live reload and a frame-time graph.",
    handle: "dee-gpu",
    track: "Compute",
    tags: ["gpu", "shaders", "web"],
    repoText: "github.com/dee-gpu/shader-lab",
    at: "2026-10-17T13:00:00.000Z",
    baseLikes: 46,
    journals: [
      { id: "j-sl-1", title: "Hot reload without a flash", at: "2026-10-07T20:00:00.000Z", excerpt: "Compile in the background and swap only when it succeeds, so a typo never blanks the canvas." },
      { id: "j-sl-2", title: "Reading the frame graph", at: "2026-10-16T19:00:00.000Z", excerpt: "Timestamp queries show which pass costs the most. It was never the pass I guessed." },
    ],
  },
  {
    id: "p-matmul",
    title: "Matmul notes",
    summary: "Benchmarks of five matrix multiplication kernels, from naive loops to tiled code, with the numbers and the mistakes.",
    handle: "dee-gpu",
    track: "Compute",
    tags: ["gpu", "benchmarks"],
    repoText: "github.com/dee-gpu/matmul-notes",
    at: "2026-09-25T09:00:00.000Z",
    baseLikes: 15,
    journals: [{ id: "j-mm-1", title: "Tiling helps, then it does not", at: "2026-09-24T20:00:00.000Z", excerpt: "Tile size 16 beat 32 on my card. Wrote down the register counts so I can explain why." }],
  },
  {
    id: "p-cloth",
    title: "Cloth in a tab",
    summary: "A real-time cloth simulation that runs in a browser tab at 60 frames per second on a laptop.",
    handle: "hana-sim",
    track: "Compute",
    tags: ["physics", "web", "simulation"],
    repoText: "github.com/hana-sim/cloth",
    at: "2026-10-15T15:00:00.000Z",
    baseLikes: 52,
    journals: [
      { id: "j-cl-1", title: "Springs explode", at: "2026-10-03T18:00:00.000Z", excerpt: "Switched from explicit springs to position-based constraints. The cloth stopped exploding." },
      { id: "j-cl-2", title: "Wind and tears", at: "2026-10-14T21:00:00.000Z", excerpt: "Constraints that stretch past a limit are removed, so the cloth can rip." },
    ],
  },
  {
    id: "p-fluid",
    title: "Fluid grid",
    summary: "A grid-based fluid solver with a dye you can drag through the water, written to teach the maths step by step.",
    handle: "hana-sim",
    track: "Compute",
    tags: ["physics", "simulation", "teaching"],
    repoText: "github.com/hana-sim/fluid-grid",
    at: "2026-09-18T10:00:00.000Z",
    baseLikes: 22,
    journals: [{ id: "j-fg-1", title: "Making it incompressible", at: "2026-09-17T17:00:00.000Z", excerpt: "The pressure solve is the slow part. Ten iterations looked right, five did not." }],
  },
  {
    id: "p-enclosure",
    title: "Enclosure generator",
    summary: "Generates a printable case for any board from its outline file, with screw posts and cable slots.",
    handle: "coil-kit",
    track: "Hardware",
    tags: ["3d-printing", "enclosure"],
    repoText: "github.com/coil-kit/enclosure-gen",
    at: "2026-10-19T10:00:00.000Z",
    baseLikes: 29,
    journals: [
      { id: "j-en-1", title: "Tolerances", at: "2026-10-10T18:00:00.000Z", excerpt: "Printed the same case at three clearances. 0.25 mm was the one that snapped shut." },
      { id: "j-en-2", title: "Slots for cables", at: "2026-10-18T19:00:00.000Z", excerpt: "Cable slots are placed from the connector list, so you do not measure anything by hand." },
    ],
  },
  {
    id: "p-slider",
    title: "Belt-driven camera slider",
    summary: "A 60 cm motorised camera slider with smooth start and stop, built from printed parts and a stepper.",
    handle: "eli-lathe",
    track: "Hardware",
    tags: ["motion", "stepper", "3d-printing"],
    repoText: "github.com/eli-lathe/slider",
    at: "2026-10-09T12:00:00.000Z",
    baseLikes: 31,
    journals: [
      { id: "j-sd-1", title: "Belt tension", at: "2026-10-01T17:00:00.000Z", excerpt: "A spring tensioner fixed the skipped steps at low speed." },
      { id: "j-sd-2", title: "Acceleration ramps", at: "2026-10-08T20:00:00.000Z", excerpt: "S-curve ramps removed the visible jerk at the start of every move." },
    ],
  },
  {
    id: "p-sensorboard",
    title: "Two-layer sensor board",
    summary: "A small temperature and humidity board with careful footprints and a full bill of materials.",
    handle: "jo-pcb",
    track: "Hardware",
    tags: ["pcb", "sensors"],
    repoText: "github.com/jo-pcb/sensor-board",
    at: "2026-10-06T09:00:00.000Z",
    baseLikes: 17,
    journals: [
      { id: "j-sb-1", title: "Footprints I checked twice", at: "2026-09-30T19:00:00.000Z", excerpt: "Printed the layout 1:1 and held the parts on top of it before ordering anything." },
      { id: "j-sb-2", title: "Keeping the sensor cool", at: "2026-10-05T18:00:00.000Z", excerpt: "A slot in the board isolates the sensor from the regulator's heat." },
    ],
  },
];

// ---------------------------------------------------------------------------------------------------------
// Sample ideas (Ideas)

export const SAMPLE_IDEAS: Idea[] = [
  {
    id: "i-case-templates",
    title: "Printable case templates in the docs",
    body: "A shared folder of parametric case designs for common boards, so Hardware builders start from a tested enclosure.",
    track: "Hardware",
    status: "Planned",
    handle: "coil-kit",
    at: "2026-10-02T10:00:00.000Z",
    baseVotes: 31,
  },
  {
    id: "i-journal-prompts",
    title: "Journal prompts for each track",
    body: "Three short prompts per track that help when you do not know what to write after a long session: what broke, what you measured, what you will try next.",
    track: "Any",
    status: "Open",
    handle: "ada-cuts",
    at: "2026-10-09T12:00:00.000Z",
    baseVotes: 24,
  },
  {
    id: "i-replay-reviews",
    title: "Show how a bug was found",
    body: "A post type for debugging stories: the symptom, the wrong guesses, and the fix. Systems builders would learn a lot from reading them.",
    track: "Systems",
    status: "Open",
    handle: "ivo-trace",
    at: "2026-10-12T15:00:00.000Z",
    baseVotes: 18,
  },
  {
    id: "i-gpu-help",
    title: "A help thread for GPU questions",
    body: "A standing thread where Compute builders ask about drivers, profilers and why a kernel is slow. Answers get saved for the next person.",
    track: "Compute",
    status: "Done",
    handle: "dee-gpu",
    at: "2026-09-24T09:00:00.000Z",
    baseVotes: 14,
  },
  {
    id: "i-bom-template",
    title: "A bill of materials template",
    body: "A spreadsheet with columns for part, quantity, supplier and cost that Hardware builders can copy instead of making their own.",
    track: "Hardware",
    status: "Open",
    handle: "jo-pcb",
    at: "2026-10-14T18:00:00.000Z",
    baseVotes: 12,
  },
  {
    id: "i-reading-list",
    title: "A reading list from finished projects",
    body: "Each builder can add one write-up that helped them. The list stays short and sorted by track.",
    track: "Any",
    status: "Open",
    handle: "gus-parse",
    at: "2026-10-16T11:00:00.000Z",
    baseVotes: 9,
  },
  {
    id: "i-demo-hours",
    title: "Weekly demo hours in a voice channel",
    body: "A fixed hour each week where builders show a work in progress and get quick questions. Recorded notes, not recordings.",
    track: "Any",
    status: "Planned",
    handle: "fern-ops",
    at: "2026-09-30T14:00:00.000Z",
    baseVotes: 21,
  },
  {
    id: "i-sim-examples",
    title: "Open-source simulation starter kits",
    body: "Two or three tiny physics starter projects with tests, so new Compute builders can see what a clean repository looks like.",
    track: "Compute",
    status: "Open",
    handle: "hana-sim",
    at: "2026-10-18T09:00:00.000Z",
    baseVotes: 6,
  },
];

// ---------------------------------------------------------------------------------------------------------
// Sample Show & Tell posts

export const SAMPLE_POSTS: ShowPost[] = [
  {
    id: "s-cloth",
    title: "Cloth in a tab, finished",
    built: "A cloth simulation with wind, tearing and a draggable pin, running at 60 frames per second in a browser tab. The whole thing is 900 lines and has a test for the constraint solver.",
    learned: "Position-based constraints are much kinder than springs. I would start there next time.",
    link: "https://example.org/sample/cloth",
    track: "Compute",
    handle: "hana-sim",
    at: "2026-10-17T10:00:00.000Z",
    baseLikes: 34,
    featured: true,
  },
  {
    id: "s-enclosure",
    title: "A printable case for any board",
    built: "The enclosure generator is done: give it a board outline and it makes a case with screw posts and cable slots. Tested on six boards and printed three of them.",
    learned: "Print a tolerance test first. It saved me four failed prints.",
    link: "https://example.org/sample/enclosure",
    track: "Hardware",
    handle: "coil-kit",
    at: "2026-10-19T12:00:00.000Z",
    baseLikes: 22,
    featured: true,
  },
  {
    id: "s-ferry",
    title: "Ferry replays any failed run",
    built: "A scheduler that records every decision. A failing test prints one seed and that seed replays the exact failure on any machine.",
    learned: "Make the one random source obvious. Everything else became easy to debug.",
    link: "https://example.org/sample/ferry",
    track: "Systems",
    handle: "bit-ferry",
    at: "2026-10-18T16:00:00.000Z",
    baseLikes: 27,
    featured: true,
  },
  {
    id: "s-quickshell",
    title: "Quickshell: laptop ready in one command",
    built: "A command-line tool that reads one setup file and installs everything on a new machine. It has dry runs, a diff view and clear errors that point at the line.",
    link: "https://example.org/sample/quickshell",
    track: "Tools",
    handle: "ada-cuts",
    at: "2026-10-16T14:00:00.000Z",
    baseLikes: 19,
  },
  {
    id: "s-sensor",
    title: "Sensor board, rev B",
    built: "A two-layer temperature and humidity board. Revision B fixes the thermal coupling with a slot in the board and moves the connector to the edge.",
    learned: "Order two copies. The second one is for the mistake you make while soldering the first.",
    link: "https://example.org/sample/sensor-board",
    track: "Hardware",
    handle: "jo-pcb",
    at: "2026-10-12T09:00:00.000Z",
    baseLikes: 11,
  },
  {
    id: "s-shelf",
    title: "The bookshelf cluster",
    built: "Three small computers on a shelf, one power supply and one switch. It hosts my notes, a git server and a backup target, and uses less power than a desk lamp.",
    learned: "The network switch limited everything. Separate storage traffic first.",
    link: "https://example.org/sample/shelf",
    track: "Systems",
    handle: "fern-ops",
    at: "2026-10-08T17:00:00.000Z",
    baseLikes: 15,
  },
];

// ---------------------------------------------------------------------------------------------------------
// Sample comments. Written by sample builders; the participant's own comments are stored under KEYS.comments.

export const SAMPLE_COMMENTS: CommunityComment[] = [
  { id: "c-1", ref: "project:p-quickshell", handle: "gus-parse", body: "The dry-run diff is the best part. Does it handle a step that fails halfway?", at: "2026-10-17T10:00:00.000Z" },
  { id: "c-2", ref: "project:p-quickshell", handle: "fern-ops", body: "Used the setup file on my cluster nodes. The errors saved me an hour.", at: "2026-10-18T08:00:00.000Z" },
  { id: "c-3", ref: "project:p-cloth", handle: "dee-gpu", body: "Would a GPU version of the constraint solver be worth it? The CPU one already looks smooth.", at: "2026-10-16T09:00:00.000Z" },
  { id: "c-4", ref: "project:p-enclosure", handle: "jo-pcb", body: "Tried it on my sensor board outline and the cable slots landed in the right place.", at: "2026-10-19T14:00:00.000Z" },
  { id: "c-5", ref: "idea:i-case-templates", handle: "eli-lathe", body: "Strong yes. A tested enclosure would have saved me three prints.", at: "2026-10-03T09:00:00.000Z" },
  { id: "c-6", ref: "idea:i-journal-prompts", handle: "bit-ferry", body: "What I measured is a good prompt. It stops entries turning into diaries.", at: "2026-10-10T10:00:00.000Z" },
  { id: "c-7", ref: "post:s-cloth", handle: "ivo-trace", body: "The tearing is great. How many constraints does it run before it slows down?", at: "2026-10-17T15:00:00.000Z" },
  { id: "c-8", ref: "post:s-ferry", handle: "ada-cuts", body: "Replaying from a seed is such a clean idea. I want this for my CLI tests.", at: "2026-10-18T20:00:00.000Z" },
];

// ---------------------------------------------------------------------------------------------------------
// Friends

export const INITIAL_SOCIAL: SocialState = {
  following: ["ada-cuts", "hana-sim", "ivo-trace"],
  followers: ["ada-cuts", "gus-parse", "fern-ops", "jo-pcb"],
  friends: ["fern-ops"],
  // Two sample incoming friend requests, as the brief asks.
  incoming: ["dee-gpu", "eli-lathe"],
  outgoing: [],
  notify: { "ada-cuts": true, "hana-sim": false, "ivo-trace": false },
};

/** Sample follower counts shown beside each builder. Your own follow adds one. */
export const SAMPLE_FOLLOWER_COUNTS: Record<string, number> = {
  "ada-cuts": 128,
  "bit-ferry": 74,
  "coil-kit": 56,
  "dee-gpu": 91,
  "eli-lathe": 38,
  "fern-ops": 63,
  "gus-parse": 82,
  "hana-sim": 117,
  "ivo-trace": 69,
  "jo-pcb": 44,
};

export const INITIAL_MODERATION: ModerationState = { reports: [], hidden: [], blocked: [] };
export const INITIAL_REACTIONS: ReactionMap = {};
export const EMPTY_IDEAS: Idea[] = [];
export const EMPTY_POSTS: ShowPost[] = [];
export const EMPTY_COMMENTS: CommunityComment[] = [];
export const EMPTY_ACTIVITY: ActivityEvent[] = [];

/** Sample events from builders. Filtered to the ones you follow and shown newest first, ten at most. */
export const SAMPLE_ACTIVITY: ActivityEvent[] = [
  { id: "a-1", handle: "coil-kit", kind: "showcase", text: "shared \"A printable case for any board\" in Show & Tell", at: "2026-10-19T12:00:00.000Z", href: "/show-and-tell" },
  { id: "a-2", handle: "coil-kit", kind: "project", text: "published the project Enclosure generator", at: "2026-10-19T10:00:00.000Z", href: "/explore" },
  { id: "a-3", handle: "bit-ferry", kind: "showcase", text: "shared \"Ferry replays any failed run\" in Show & Tell", at: "2026-10-18T16:00:00.000Z", href: "/show-and-tell" },
  { id: "a-4", handle: "ivo-trace", kind: "journal", text: "added a journal entry to Flamelite: One file output", at: "2026-10-12T18:30:00.000Z", href: "/explore" },
  { id: "a-5", handle: "hana-sim", kind: "idea", text: "posted the idea \"Open-source simulation starter kits\"", at: "2026-10-18T09:00:00.000Z", href: "/ideas" },
  { id: "a-6", handle: "ada-cuts", kind: "project", text: "published the project Quickshell", at: "2026-10-16T09:00:00.000Z", href: "/explore" },
  { id: "a-7", handle: "hana-sim", kind: "showcase", text: "shared \"Cloth in a tab, finished\" in Show & Tell", at: "2026-10-17T10:00:00.000Z", href: "/show-and-tell" },
  { id: "a-8", handle: "ada-cuts", kind: "journal", text: "added a journal entry to Quickshell: Windows paths, again", at: "2026-10-15T20:10:00.000Z", href: "/explore" },
  { id: "a-9", handle: "ivo-trace", kind: "idea", text: "posted the idea \"Show how a bug was found\"", at: "2026-10-12T15:00:00.000Z", href: "/ideas" },
  { id: "a-10", handle: "hana-sim", kind: "journal", text: "added a journal entry to Cloth in a tab: Wind and tears", at: "2026-10-14T21:00:00.000Z", href: "/explore" },
  { id: "a-11", handle: "ada-cuts", kind: "idea", text: "posted the idea \"Journal prompts for each track\"", at: "2026-10-09T12:00:00.000Z", href: "/ideas" },
  { id: "a-12", handle: "ivo-trace", kind: "project", text: "published the project Flamelite", at: "2026-10-13T16:00:00.000Z", href: "/explore" },
  { id: "a-13", handle: "jo-pcb", kind: "showcase", text: "shared \"Sensor board, rev B\" in Show & Tell", at: "2026-10-12T09:00:00.000Z", href: "/show-and-tell" },
  { id: "a-14", handle: "dee-gpu", kind: "project", text: "published the project Shader lab", at: "2026-10-17T13:00:00.000Z", href: "/explore" },
];

export const INITIAL_IDEA_STATUS: Record<string, IdeaStatus> = {};
