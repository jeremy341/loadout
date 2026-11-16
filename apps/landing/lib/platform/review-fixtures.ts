import type {
  AuditSections,
  AuditVerdict,
  BomLine,
  HackatimeProject,
  JournalAction,
  LogAction,
  LogEntry,
  ProjectNote,
  Readme,
  ReviewAudit,
  ReviewCommit,
  ReviewEvidence,
  ReviewJournal,
  ReviewShip,
  Reviewer,
  TrustLevel,
  VerdictCounts,
} from "./review";
import { BULK_AUDITS, BULK_SHIPS } from "./review-fixtures-bulk";

// The sample data behind the reviewer site: 17 ships, 6 reviewers, a verdict history (audits) and a log. Everything here is
// invented: handles, repositories on git.example, countries and ages. Nothing is saved and no number is a live count.

const entry = (day: string, minutes: number, text: string, action?: JournalAction, keptMinutes?: number, reason?: string): ReviewJournal => ({ day, minutes, text, action, keptMinutes, reason });
const ALL: JournalAction = "approve-all";

// Hackatime projects get their session count and first and last day from the journal entries, so the two never disagree.
const hackatime = (languages: [string, number][], trust: TrustLevel, ...projects: [string, number][]): ReviewEvidence => ({
  source: "hackatime",
  projects: projects.map(([name, minutes]): HackatimeProject => ({ name, minutes, sessions: Math.max(1, Math.round(minutes / 55)), first: "", last: "" })),
  languages: languages.map(([name, percent]) => ({ name, percent })),
  trust,
});
const lapse = (recordings: [string, number][], bom: BomLine[], photos: [string, string][], designFiles: string[]): ReviewEvidence => ({
  source: "lapse",
  recordings: recordings.map(([day, minutes]) => ({ day, minutes })),
  bom,
  photos: photos.map(([day, caption]) => ({ day, caption })),
  designFiles,
});

// A short, stable commit id from the ship and the position, so the fixtures never change between loads.
function sha(seed: string, index: number): string {
  let hash = 2166136261;
  for (const char of `${seed}:${index}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return hash.toString(16).padStart(8, "0").slice(0, 7);
}
type CommitRow = [day: string, message: string, additions: number, deletions: number, codedMinutes: number | null, ai?: boolean, author?: string];
const commitsFor = (seed: string, author: string, rows: CommitRow[]): ReviewCommit[] =>
  rows.map(([day, message, additions, deletions, codedMinutes, ai, by], index) => ({ sha: sha(seed, index), day, message, author: by ?? author, additions, deletions, codedMinutes, ai }));

const readme = (title: string, ...sections: [string, string][]): Readme => ({ title, sections: sections.map(([heading, text]) => ({ heading, text })) });
const note = (id: string, author: string, hoursAgo: number, body: string): ProjectNote => ({ id, author, hoursAgo, body });

type ShipSeed = Omit<ReviewShip, "projectType" | "isGame" | "researchMode" | "claimedBy" | "demo" | "notes" | "builderAge" | "builderCountry"> &
  Partial<Pick<ReviewShip, "projectType" | "isGame" | "researchMode" | "claimedBy" | "demo" | "notes" | "builderAge" | "builderCountry">>;

function ship(seed: ShipSeed): ReviewShip {
  const first = seed.journals[0]?.day ?? "";
  const last = seed.journals.at(-1)?.day ?? "";
  const evidence: ReviewEvidence =
    seed.evidence.source === "hackatime"
      ? { ...seed.evidence, projects: seed.evidence.projects.map((item) => ({ ...item, first: item.first || first, last: item.last || last })) }
      : seed.evidence;
  return {
    projectType: seed.kind === "hardware" ? "hardware" : "other",
    isGame: false,
    researchMode: false,
    claimedBy: null,
    demo: null,
    notes: [],
    builderAge: 16,
    builderCountry: "United Kingdom",
    ...seed,
    evidence,
  };
}

const HAND_SHIPS: readonly ReviewShip[] = [
  ship({
    id: "sh-2041",
    title: "Rollback netcode library",
    builder: "kestrel42",
    kind: "software",
    projectType: "cross_platform",
    isGame: true,
    track: "Systems",
    status: "waiting",
    submittedHoursAgo: 120,
    capability: "A deterministic rollback layer for 2D games: save and restore state, replay late inputs, and a tester that finds desyncs.",
    evidence: hackatime([["Rust", 84], ["TOML", 9], ["Markdown", 7]], "green", ["netcode-lib", 1380], ["desync-tester", 600]),
    journals: [
      entry("14 Oct", 540, "Wrote the snapshot ring buffer and a test that restores 8 frames and replays them."),
      entry("18 Oct", 480, "Added input prediction. A mismatch now rewinds to the first wrong frame instead of the start."),
      entry("23 Oct", 540, "Found a float drift desync in the sample game and moved the physics to fixed point."),
      entry("29 Oct", 360, "Built the desync tester that runs two peers with random packet loss and compares hashes."),
    ],
    ai: { percent: 10, uses: ["Debugging"], note: "Asked a model to explain two linker errors." },
    source: "git.example/kestrel42/rollback-netcode",
    demo: "kestrel42.example/rollback-demo",
    commits: commitsFor("sh-2041", "kestrel42", [
      ["14 Oct", "Add snapshot ring buffer", 212, 0, 96],
      ["14 Oct", "Restore and replay 8 frames in a test", 148, 12, 71],
      ["18 Oct", "Predict remote input and rewind on mismatch", 264, 40, 118],
      ["23 Oct", "Move physics to fixed point to stop float drift", 331, 187, 142],
      ["29 Oct", "Add the desync tester with packet loss", 396, 22, 133],
      ["29 Oct", "Write the README with the measured rewind cost", 74, 3, 18],
    ]),
    readme: readme(
      "rollback-netcode",
      ["What it is", "A small rollback layer for 2D games. It keeps a ring of snapshots, replays late inputs and tells you the first frame where two peers disagree."],
      ["Build and run", "cargo build, then cargo run --example pong. The example plays two peers in one window with 5 percent packet loss."],
      ["Limits", "Fixed point maths only. No floats in simulated state. Tested to 8 frames of rollback."],
    ),
    builderAge: 16,
    builderCountry: "United Kingdom",
    notes: [],
  }),
  ship({
    id: "sh-2042",
    title: "FPGA logic analyser",
    builder: "dovetail",
    kind: "hardware",
    track: "Hardware",
    status: "waiting",
    submittedHoursAgo: 98,
    capability: "A 16-channel logic analyser on a small FPGA board that streams captures to a laptop over USB serial.",
    evidence: lapse(
      [["17 Oct", 600], ["21 Oct", 660], ["25 Oct", 720], ["30 Oct", 540]],
      [
        { part: "iCE40 FPGA breakout board", qty: 1, source: "Online electronics distributor" },
        { part: "8-channel level shifter", qty: 2, source: "Online electronics distributor" },
        { part: "Jumper wires", qty: 40, source: "Local hardware shop" },
        { part: "Breadboard, 830 points", qty: 1, source: "Salvaged from an old kit" },
      ],
      [
        ["17 Oct", "The FPGA breakout wired to both level shifters on the breadboard"],
        ["25 Oct", "Oscilloscope trace of the trigger input before and after the synchroniser"],
        ["30 Oct", "An I2C capture in the laptop viewer beside the reference trace"],
      ],
      ["rtl/ (Verilog sources)", "constraints/pins.pcf", "docs/wiring.md"],
    ),
    journals: [
      entry("17 Oct", 600, "Wrote the sampling core in Verilog and checked it in simulation at 50 MHz."),
      entry("21 Oct", 660, "Added a FIFO and the UART sender. First real capture of an I2C bus matched a reference."),
      entry("25 Oct", 720, "Fixed metastability on the trigger input with a two-stage synchroniser, then measured jitter."),
      entry("30 Oct", 480, "Wrote the laptop viewer and a short guide to wiring and reading a capture."),
    ],
    ai: { percent: 5, uses: ["Research / explanation"], note: "Asked for an explanation of clock domain crossing." },
    source: "git.example/dovetail/fpga-logic-analyser",
    commits: commitsFor("sh-2042", "dovetail", [
      ["17 Oct", "Sampling core and a simulation testbench", 244, 0, null],
      ["21 Oct", "FIFO and UART sender", 188, 31, null],
      ["25 Oct", "Two-stage synchroniser on the trigger input", 57, 18, null],
      ["30 Oct", "Laptop viewer and wiring guide", 301, 9, null],
    ]),
    readme: readme(
      "fpga-logic-analyser",
      ["What it is", "A 16-channel logic analyser that runs on an iCE40 board and streams captures to a laptop over USB serial."],
      ["Wiring", "docs/wiring.md has the pin table and a photo of the level shifters. Inputs are 3.3 V only."],
      ["Reading a capture", "The viewer decodes I2C and UART and lines the traces up on one time axis."],
    ),
    builderAge: 17,
    builderCountry: "Germany",
  }),
  ship({
    id: "sh-2043",
    title: "Tiny bytecode VM in Rust",
    builder: "ploughshare",
    kind: "software",
    projectType: "cross_platform",
    track: "Tools",
    status: "waiting",
    submittedHoursAgo: 70,
    capability: "A register-based bytecode VM with its own assembler, a disassembler and a fuzzer that checks the interpreter never panics.",
    evidence: hackatime([["Rust", 91], ["Markdown", 9]], "green", ["bytecode-vm", 1140], ["vm-fuzz", 180]),
    journals: [
      entry("20 Oct", 480, "Designed the instruction set and wrote the assembler. Programs now round-trip through the disassembler."),
      entry("26 Oct", 420, "Implemented the interpreter loop and measured it against a naive match. The jump table version is 1.4x faster."),
      entry("1 Nov", 360, "Added the fuzzer. It found an out-of-range register read, now fixed with a test."),
    ],
    ai: { percent: 15, uses: ["Autocomplete", "Debugging"], note: "Autocomplete for boilerplate, and a model for two borrow checker errors." },
    source: "git.example/ploughshare/tinyvm",
    demo: "ploughshare.example/tinyvm",
    commits: commitsFor("sh-2043", "ploughshare", [
      ["20 Oct", "Define the instruction set", 118, 0, 64],
      ["20 Oct", "Assembler with labels", 233, 6, 101],
      ["26 Oct", "Interpreter loop with a jump table", 276, 54, 147],
      ["1 Nov", "Fuzz the interpreter for panics", 161, 8, 88],
      ["1 Nov", "Fix an out-of-range register read", 29, 4, 22],
    ]),
    readme: readme(
      "tinyvm",
      ["What it is", "A register VM in about 1,500 lines, with an assembler, a disassembler and a fuzzer."],
      ["Run a program", "cargo run -- examples/fib.asm runs the Fibonacci example and prints the result."],
      ["Speed", "The jump table loop is 1.4x faster than a match on the opcode, measured on the three benchmark programs."],
    ),
    builderAge: 15,
    builderCountry: "Canada",
  }),
  ship({
    id: "sh-2044",
    title: "Pico thermal data logger",
    builder: "halyard",
    kind: "hardware",
    track: "Hardware",
    status: "claimed",
    submittedHoursAgo: 52,
    claimedBy: "fenwick",
    capability: "A battery logger on a Pico that records temperature from four probes to flash and exports CSV over USB.",
    evidence: lapse(
      [["24 Oct", 300], ["27 Oct", 360], ["30 Oct", 240]],
      [
        { part: "Raspberry Pi Pico", qty: 1, source: "Online electronics distributor" },
        { part: "Thermistor, 10k", qty: 4, source: "Online electronics distributor" },
        { part: "Li-ion cell and charger board", qty: 1, source: "Local hardware shop" },
        { part: "3D-printed case", qty: 1, source: "Printed at home" },
      ],
      [
        ["24 Oct", "Probe inputs soldered to the Pico, next to the ice-bath calibration cup"],
        ["30 Oct", "The finished logger in its printed case with the battery fitted"],
      ],
      ["hardware/schematic.pdf", "firmware/", "case/logger-case.step"],
    ),
    journals: [
      entry("24 Oct", 300, "Soldered the probe inputs and calibrated the ADC against an ice bath and boiling water."),
      entry("27 Oct", 360, "Wrote the flash log with wear levelling and a CSV export that survives a power cut."),
      entry("30 Oct", 180, "Measured sleep current at 190 microamps and tuned the sample interval for a month of battery."),
    ],
    ai: { percent: 0, uses: [], note: "No AI used." },
    source: "git.example/halyard/pico-thermal-logger",
    expeditionId: "first-circuit",
    commits: commitsFor("sh-2044", "halyard", [
      ["24 Oct", "ADC read and calibration table", 96, 4, null],
      ["27 Oct", "Flash log with wear levelling", 214, 20, null],
      ["27 Oct", "CSV export over USB", 88, 5, null],
      ["30 Oct", "Sleep mode and sample interval", 61, 17, null],
    ]),
    readme: readme(
      "pico-thermal-logger",
      ["What it is", "A battery logger for four thermistors. It writes to flash and exports CSV when plugged in."],
      ["Calibration", "Each probe is calibrated at 0 C and 100 C. The table is in firmware/calibration.h."],
      ["Battery life", "190 microamps asleep. At one sample a minute the cell lasts about a month."],
    ),
    builderAge: 14,
    builderCountry: "Ireland",
  }),
  ship({
    id: "sh-2045",
    title: "Memory profiler for embedded Linux",
    builder: "tessel",
    kind: "software",
    projectType: "linux",
    track: "Systems",
    status: "claimed",
    submittedHoursAgo: 40,
    claimedBy: "tamsin",
    capability: "A small allocation profiler that hooks malloc on boards with 64 MB of RAM and prints a live heap map over serial.",
    evidence: hackatime([["C", 72], ["Shell", 14], ["Markdown", 14]], "green", ["memprof", 1560]),
    journals: [
      entry("19 Oct", 480, "Wrote the LD_PRELOAD shim and a lock-free ring buffer so hooking adds little overhead."),
      entry("25 Oct", 540, "Built the heap map renderer and checked it against a known leak in a sample daemon."),
      entry("2 Nov", 420, "Cut the overhead from 18 to 6 percent by batching events. Added a README with measured numbers."),
    ],
    ai: { percent: 20, uses: ["Debugging", "Autocomplete"], note: "Autocomplete in the editor and a model for explaining a segfault." },
    source: "git.example/tessel/embedded-memprof",
    commits: commitsFor("sh-2045", "tessel", [
      ["19 Oct", "LD_PRELOAD shim for malloc and free", 142, 0, 83],
      ["19 Oct", "Lock-free ring buffer for events", 187, 11, 97],
      ["25 Oct", "Heap map renderer over serial", 276, 30, 160],
      ["2 Nov", "Batch events to cut overhead", 94, 61, 112],
      ["2 Nov", "README with measured overhead", 58, 0, 21],
    ]),
    readme: readme(
      "embedded-memprof",
      ["What it is", "A malloc profiler for boards with 64 MB of RAM. It prints a live heap map over the serial console."],
      ["Use", "LD_PRELOAD=./libmemprof.so ./your-daemon, then read the map on the serial port at 115200 baud."],
      ["Overhead", "6 percent on the sample daemon after batching, down from 18 percent."],
    ),
    builderAge: 17,
    builderCountry: "Netherlands",
  }),
  ship({
    id: "sh-2046",
    title: "Cross-compiling build cache",
    builder: "nib",
    kind: "software",
    projectType: "cross_platform",
    track: "Tools",
    status: "waiting",
    submittedHoursAgo: 30,
    capability: "A content-addressed build cache that is keyed on the target triple, so one cache serves several cross-compile setups.",
    evidence: hackatime([["Go", 88], ["Markdown", 12]], "green", ["xcache", 840]),
    journals: [
      entry("27 Oct", 420, "Designed the cache key from source hashes, flags and the toolchain version. Wrote the store."),
      entry("3 Nov", 360, "Added remote sharing over HTTP and a benchmark: a clean build drops from 9 minutes to 70 seconds."),
    ],
    ai: { percent: 0, uses: [], note: "No AI used." },
    source: "git.example/nib/xcache",
    update: {
      priorApprovedMinutes: 420,
      notes: "Added remote sharing over HTTP so a team can use one cache, and a benchmark against a clean build.",
    },
    shipNote: "This is the second ship of xcache. The first one covered the local store only. The new work is the HTTP server and the benchmark.",
    commits: commitsFor("sh-2046", "nib", [
      ["27 Oct", "Cache key from sources, flags and toolchain", 158, 0, 77],
      ["27 Oct", "Content-addressed store on disk", 209, 14, 104],
      ["3 Nov", "HTTP server for a shared cache", 244, 19, 116],
      ["3 Nov", "Benchmark against a clean build", 88, 2, 41],
      ["3 Nov", "Tidy handlers (generated with an assistant)", 312, 280, 3, true],
    ]),
    readme: readme(
      "xcache",
      ["What it is", "A build cache keyed on the target triple, so one cache serves several cross-compile setups."],
      ["Use", "xcache wrap -- make runs the build through the cache. xcache serve starts a shared one."],
      ["Numbers", "A clean build of the sample project takes 9 minutes. With a warm shared cache it takes 70 seconds."],
    ),
    builderAge: 16,
    builderCountry: "United States",
  }),
  ship({
    id: "sh-2047",
    title: "Quantised inference benchmark suite",
    builder: "marlin_k",
    kind: "software",
    projectType: "python",
    track: "Compute",
    researchMode: true,
    status: "waiting",
    submittedHoursAgo: 36,
    firstShippedHoursAgo: 310,
    reserved: { reviewer: "saltmarsh", hoursLeft: 36 },
    capability: "Does INT8 quantisation change latency or accuracy on small CPUs? A reproducible benchmark across four models and three devices, with a write-up.",
    evidence: hackatime([["Python", 78], ["Shell", 10], ["Markdown", 12]], "green", ["quant-bench", 2160]),
    journals: [
      entry("15 Oct", 540, "Wrote the harness and pinned model versions so any run can be repeated."),
      entry("21 Oct", 600, "Ran 3,600 timed passes per model. Latency fell 38 to 52 percent; one model lost 2.1 points of accuracy."),
      entry("28 Oct", 540, "Found that the memory-bound model gained nothing, and measured cache misses to explain why."),
      entry("4 Nov", 420, "Wrote the public write-up with the method, raw numbers and what did not work."),
    ],
    ai: { percent: 25, uses: ["Research / explanation", "Debugging"], note: "Asked a model to explain quantisation schemes. Wrote the harness and analysis myself." },
    source: "git.example/marlin_k/quant-bench",
    shipNote: "Shipped again after the first review: the write-up now lists the exact commands and the raw numbers.",
    commits: commitsFor("sh-2047", "marlin_k", [
      ["15 Oct", "Benchmark harness with pinned model versions", 341, 0, 168],
      ["21 Oct", "Timed passes and a latency table", 203, 22, 144],
      ["28 Oct", "Cache miss measurements for the memory-bound model", 117, 9, 96],
      ["4 Nov", "Write-up with the method and raw numbers", 262, 41, 118],
    ]),
    readme: readme(
      "quant-bench",
      ["Question", "Does INT8 quantisation change latency or accuracy on small CPUs?"],
      ["Method", "Four models, three devices, 3,600 timed passes each. Model versions and seeds are pinned in config.toml."],
      ["Result", "Latency fell 38 to 52 percent. One model lost 2.1 points of accuracy. The memory-bound model gained nothing."],
    ),
    builderAge: 17,
    builderCountry: "India",
  }),
  ship({
    id: "sh-2048",
    title: "USB macropad firmware and PCB",
    builder: "quill",
    kind: "hardware",
    projectType: "cad",
    track: "Hardware",
    status: "claimed",
    submittedHoursAgo: 12,
    claimedBy: "lintel",
    capability: "A 12-key macropad with a custom PCB and firmware that sends layered key maps, written from the USB HID spec.",
    evidence: lapse(
      [["26 Oct", 420], ["29 Oct", 480], ["1 Nov", 420]],
      [
        { part: "Custom PCB, 2 layer", qty: 5, source: "Board house, ordered from my design files" },
        { part: "RP2040 module", qty: 1, source: "Online electronics distributor" },
        { part: "Hot-swap sockets", qty: 12, source: "Online electronics distributor" },
        { part: "Key switches", qty: 12, source: "Local hardware shop" },
      ],
      [
        ["26 Oct", "The bare board from the board house, front and back"],
        ["1 Nov", "The reflowed board with the corrected diode and the module fitted"],
        ["1 Nov", "The macropad with all twelve switches, running the layer map"],
      ],
      ["pcb/macropad.kicad_sch", "pcb/macropad.kicad_pcb", "pcb/gerbers/", "firmware/"],
    ),
    journals: [
      entry("26 Oct", 420, "Drew the schematic and routed the board. Ran the design rule check with no errors."),
      entry("29 Oct", 480, "Hand-wrote the HID report descriptor and debounce. Enumerates on Linux, macOS and Windows."),
      entry("1 Nov", 360, "Reflowed the first board, fixed a swapped diode and added layer switching to the firmware."),
    ],
    ai: { percent: 5, uses: ["Research / explanation"], note: "Asked for an explanation of HID report descriptors." },
    source: "git.example/quill/macropad-12",
    collaborators: [{ handle: "tinwren", trackedMinutes: 240, journalMinutes: 180 }],
    commits: commitsFor("sh-2048", "quill", [
      ["26 Oct", "Schematic and board layout", 402, 0, null],
      ["29 Oct", "HID report descriptor and debounce", 188, 12, null],
      ["29 Oct", "Layer map in firmware", 96, 7, null, false, "tinwren"],
      ["1 Nov", "Swap the diode footprint and re-spin the layout", 44, 38, null],
      ["1 Nov", "Layer switching key", 71, 6, null],
    ]),
    readme: readme(
      "macropad-12",
      ["What it is", "A 12-key macropad with a custom two-layer board and firmware written from the USB HID spec."],
      ["Order the board", "pcb/gerbers/ has the files for any board house. The bill of materials is in docs/bom.csv."],
      ["Layers", "Hold the corner key to switch layers. The map is in firmware/layers.h."],
    ),
    builderAge: 15,
    builderCountry: "Australia",
  }),
  ship({
    id: "sh-2049",
    title: "Packet capture dashboard",
    builder: "ostler",
    kind: "software",
    projectType: "web",
    track: "Systems",
    status: "spot-check",
    submittedHoursAgo: 150,
    capability: "A live dashboard that reads a network capture, groups flows and flags slow handshakes.",
    evidence: hackatime([["TypeScript", 71], ["CSS", 17], ["Rust", 12]], "yellow", ["pcap-dash", 1200]),
    journals: [
      entry("16 Oct", 480, "Wrote the capture reader and the flow table.", ALL),
      entry("22 Oct", 420, "Built the dashboard charts and the handshake timing view.", ALL),
      entry("29 Oct", 240, "Fixed filtering bugs and cleaned up the layout.", "partial", 120, "Layout tidying, mostly styling the generated chart components."),
    ],
    ai: { percent: 35, uses: ["Code generation", "Autocomplete"], note: "A model wrote most of the chart components. I wrote the capture reader." },
    source: "git.example/ostler/pcap-dash",
    demo: "ostler.example/pcap-dash",
    turnedNineteen: true,
    firstPass: {
      by: "tamsin",
      hoursAgo: 52,
      verdict: "approved",
      minutes: 1020,
      note: "Hours look believable. The AI declaration is 35 percent and the chart code reads as generated, so I cut two hours from the styling entry. A final reviewer should judge the builder's own share.",
    },
    finalChecks: [true, true, false],
    commits: commitsFor("sh-2049", "ostler", [
      ["16 Oct", "Read pcap files and build a flow table", 266, 0, 201],
      ["16 Oct", "Group packets into flows by 5-tuple", 143, 18, 94],
      ["22 Oct", "Add chart components for the dashboard", 3140, 12, 2, true],
      ["22 Oct", "Handshake timing view", 188, 26, 133],
      ["29 Oct", "Fix filters and tidy the layout", 211, 167, 78],
    ]),
    readme: readme(
      "pcap-dash",
      ["What it is", "A dashboard that reads a network capture, groups the packets into flows and flags slow TCP handshakes."],
      ["Run it", "bun run dev, then open a .pcap file from the page. A sample capture is in examples/."],
      ["Limits", "IPv4 only. Captures over 200 MB load slowly."],
    ),
    notes: [
      note("n-2049-1", "tamsin", 50, "The capture reader is the builder's own. The chart commit is one 3,000 line file with almost no tracked time, and the declaration says 35 percent AI. I cut two hours from the styling entry."),
      note("n-2049-2", "lintel", 6, "Taking this for the spot check. Will compare the chart commit with the declaration before I decide."),
    ],
    builderAge: 18,
    builderCountry: "Germany",
  }),
  ship({
    id: "sh-2050",
    title: "Motor driver board with current sensing",
    builder: "brindle",
    kind: "hardware",
    track: "Hardware",
    status: "spot-check",
    submittedHoursAgo: 170,
    capability: "A dual H-bridge motor driver with shunt-based current sensing and a stall detector, on a board the builder laid out.",
    evidence: lapse(
      [["21 Oct", 360], ["24 Oct", 480], ["27 Oct", 420], ["29 Oct", 240]],
      [
        { part: "Custom PCB, 2 layer", qty: 3, source: "Board house, ordered from my design files" },
        { part: "H-bridge driver IC", qty: 2, source: "Online electronics distributor" },
        { part: "Shunt resistor, 0.05 ohm", qty: 4, source: "Online electronics distributor" },
        { part: "Small DC motor", qty: 1, source: "Salvaged from a toy" },
      ],
      [
        ["27 Oct", "The assembled driver board with the motor connected"],
        ["29 Oct", "Oscilloscope capture of the shunt voltage during a stall"],
      ],
      ["pcb/", "firmware/stall-detector/", "docs/measurements.md"],
    ),
    journals: [
      entry("21 Oct", 360, "Chose the driver IC and drew the schematic with the shunt amplifier.", ALL),
      entry("24 Oct", 480, "Routed and ordered the board. Wrote a stall detector in firmware.", "partial", 360, "The recording is mostly a static bench for the last two hours."),
      entry("27 Oct", 420, "Assembled the board and measured the current waveform on a scope.", "partial", 360, "Soldering shown at double speed; counted at the filmed length."),
      entry("29 Oct", 180, "Tuned the stall threshold and wrote up the measurements.", ALL),
    ],
    ai: { percent: 0, uses: [], note: "No AI used." },
    source: "git.example/brindle/motor-driver",
    firstPass: {
      by: "orrery",
      hoursAgo: 26,
      verdict: "approved",
      minutes: 1260,
      note: "Good board and real measurements. Two recordings are mostly a static bench, so I credited 21 hours of the 24. A final reviewer should check the 24 Oct and 27 Oct footage.",
    },
    hold: { by: "orrery", hoursAgo: 20, reason: "Waiting for the builder to upload the oscilloscope files they mention in the 29 Oct entry." },
    commits: commitsFor("sh-2050", "brindle", [
      ["21 Oct", "Schematic with the shunt amplifier", 318, 0, null],
      ["24 Oct", "Board layout and gerbers", 226, 41, null],
      ["24 Oct", "Stall detector in firmware", 134, 9, null],
      ["29 Oct", "Measurements write-up", 92, 4, null],
    ]),
    readme: readme(
      "motor-driver",
      ["What it is", "A dual H-bridge driver with shunt current sensing and a stall detector."],
      ["Measurements", "docs/measurements.md has the shunt voltage during a stall and how the threshold was chosen."],
      ["Build", "Order pcb/gerbers/ from any board house. The firmware builds with the pico-sdk."],
    ),
    notes: [
      note("n-2050-1", "orrery", 24, "The 24 Oct and 27 Oct recordings sit still for long stretches. Credited the filmed work only."),
      note("n-2050-2", "orrery", 20, "On hold until the scope files arrive. Released when they are in the repo."),
    ],
    builderAge: 16,
    builderCountry: "United States",
  }),
  ship({
    id: "sh-2051",
    title: "Shader hot-reload toolchain",
    builder: "cairn",
    kind: "software",
    projectType: "cross_platform",
    track: "Tools",
    status: "approved",
    submittedHoursAgo: 440,
    capability: "A tool that recompiles shaders on save and swaps them into a running renderer without a restart, with a diff of the compiled output.",
    evidence: hackatime([["Rust", 66], ["GLSL", 24], ["Markdown", 10]], "green", ["shader-reload", 1740]),
    journals: [
      entry("1 Oct", 600, "Built the file watcher and the SPIR-V compile step with readable errors.", ALL),
      entry("5 Oct", 540, "Implemented the live swap and handled pipeline recreation without a frame drop.", ALL),
      entry("9 Oct", 540, "Added the compiled-output diff view and wrote the usage guide.", "partial", 480, "The diff view was mostly styling."),
    ],
    ai: { percent: 10, uses: ["Debugging"], note: "Asked a model about a validation layer message." },
    source: "git.example/cairn/shader-reload",
    demo: "cairn.example/shader-reload",
    firstPass: {
      by: "saltmarsh",
      hoursAgo: 430,
      verdict: "approved",
      minutes: 1620,
      note: "Original idea for a real pain point. The swap works. Cut one hour from the diff view.",
    },
    decision: {
      outcome: "approved",
      by: "bellwether",
      hoursAgo: 410,
      reason: "Original idea for a real pain point. The swap is the hard part and it works. Documentation is clear. Hours cut by one hour for the diff view, which was mostly styling.",
    },
    commits: commitsFor("sh-2051", "cairn", [
      ["1 Oct", "File watcher with debounce", 121, 0, 84],
      ["1 Oct", "Compile GLSL to SPIR-V with readable errors", 244, 9, 131],
      ["5 Oct", "Swap pipelines at runtime without a frame drop", 311, 47, 176],
      ["9 Oct", "Diff view for compiled output", 267, 22, 139],
      ["9 Oct", "Usage guide", 83, 0, 31],
    ]),
    readme: readme(
      "shader-reload",
      ["What it is", "Recompiles shaders on save and swaps them into a running renderer. Shows a diff of the compiled output."],
      ["Use", "shader-reload watch ./shaders --attach <pid> connects to the renderer's debug socket."],
      ["Limits", "Vulkan only. The renderer must expose the debug socket described in docs/attach.md."],
    ),
    builderAge: 17,
    builderCountry: "Sweden",
  }),
  ship({
    id: "sh-2052",
    title: "LoRa mesh weather node",
    builder: "fathom",
    kind: "hardware",
    track: "Hardware",
    status: "approved",
    submittedHoursAgo: 420,
    capability: "A solar weather node that joins a LoRa mesh and relays readings between nodes up to 3 km apart.",
    evidence: lapse(
      [["14 Oct", 420], ["17 Oct", 480], ["19 Oct", 360]],
      [
        { part: "LoRa radio module", qty: 2, source: "Online electronics distributor" },
        { part: "Temperature and pressure sensor", qty: 2, source: "Online electronics distributor" },
        { part: "Small solar panel", qty: 2, source: "Local hardware shop" },
        { part: "Weatherproof enclosure", qty: 2, source: "Printed at home" },
      ],
      [
        ["14 Oct", "The first node on the bench with the radio and sensor wired"],
        ["17 Oct", "A node on a fence post at the far end of the range test"],
        ["19 Oct", "The solar panel and enclosure on the shaded test site"],
      ],
      ["hardware/node-schematic.pdf", "firmware/", "enclosure/node-box.stl", "docs/range-tests.md"],
    ),
    journals: [
      entry("14 Oct", 420, "Wired the radio and sensor and got the first packet across the garden.", ALL),
      entry("17 Oct", 480, "Wrote the relay logic and tested range with a 2.4 km line-of-sight run.", ALL),
      entry("19 Oct", 300, "Added sleep scheduling. The node runs 9 days on the panel in shade.", ALL),
    ],
    ai: { percent: 0, uses: [], note: "No AI used." },
    source: "git.example/fathom/lora-weather-node",
    firstPass: { by: "tamsin", hoursAgo: 395, verdict: "approved", minutes: 1200, note: "A complete build with range numbers. Passing it on." },
    decision: {
      outcome: "approved",
      by: "orrery",
      hoursAgo: 380,
      reason: "A complete build with real range tests. Technical depth is in the relay and the sleep scheduling. The build log and range numbers make the documentation strong.",
    },
    commits: commitsFor("sh-2052", "fathom", [
      ["14 Oct", "Radio and sensor bring-up", 132, 0, null],
      ["17 Oct", "Relay logic between nodes", 247, 28, null],
      ["19 Oct", "Sleep scheduling", 88, 19, null],
      ["19 Oct", "Range test notes", 64, 0, null],
    ]),
    readme: readme(
      "lora-weather-node",
      ["What it is", "A solar weather node that joins a LoRa mesh and relays readings. Range tested to 2.4 km line of sight."],
      ["Build one", "hardware/node-schematic.pdf, enclosure/node-box.stl and the bill of materials in docs/."],
      ["Power", "9 days on a small panel in shade, measured. See docs/range-tests.md."],
    ),
    builderAge: 16,
    builderCountry: "New Zealand",
  }),
  ship({
    id: "sh-2053",
    title: "Static config linter",
    builder: "pennant",
    kind: "software",
    projectType: "cross_platform",
    track: "Tools",
    status: "approved",
    submittedHoursAgo: 330,
    capability: "A linter for a small config language, with its own parser, an error recovery pass and a rule engine.",
    evidence: hackatime([["Go", 90], ["Markdown", 10]], "green", ["conflint", 960]),
    journals: [
      entry("6 Oct", 480, "Wrote the lexer and parser with error recovery, so one typo does not hide the next ten.", ALL),
      entry("12 Oct", 420, "Built the rule engine and eight rules, each with a test and a fix hint.", "partial", 360, "One rule was copied from an existing linter's docs."),
    ],
    ai: { percent: 5, uses: ["Autocomplete"], note: "Editor autocomplete only." },
    source: "git.example/pennant/conflint",
    firstPass: { by: "saltmarsh", hoursAgo: 290, verdict: "approved", minutes: 840, note: "Own parser and a tested rule engine. Cut one hour from the rule engine entry." },
    decision: {
      outcome: "approved",
      by: "bellwether",
      hoursAgo: 280,
      reason: "Parses its own grammar instead of wrapping an existing linter, which is the original part. Rules are tested and the README explains each one. Documentation could say more about limits.",
    },
    commits: commitsFor("sh-2053", "pennant", [
      ["6 Oct", "Lexer and parser with error recovery", 402, 0, 188],
      ["12 Oct", "Rule engine and eight rules", 355, 31, 171],
      ["12 Oct", "Fix hints for each rule", 98, 12, 44],
    ]),
    readme: readme(
      "conflint",
      ["What it is", "A linter for a small config language. It has its own parser, so one typo does not hide the next ten."],
      ["Rules", "Eight rules, each with a test and a fix hint. The list is in docs/rules.md."],
    ),
    builderAge: 15,
    builderCountry: "Canada",
  }),
  ship({
    id: "sh-2054",
    title: "Sorting visualiser website",
    builder: "wick",
    kind: "software",
    projectType: "web",
    track: "Tools",
    status: "needs-changes",
    submittedHoursAgo: 250,
    capability: "A website that animates common sorting algorithms.",
    evidence: hackatime([["JavaScript", 62], ["CSS", 28], ["HTML", 10]], "green", ["sort-viz", 600]),
    journals: [
      entry("8 Oct", 360, "Made the page layout and the bar animations.", "reject"),
      entry("10 Oct", 180, "Added bubble, merge and quick sort and a speed slider.", "reject"),
    ],
    ai: { percent: 20, uses: ["Code generation"], note: "A model wrote the animation loop." },
    source: "git.example/wick/sort-viz",
    demo: "wick.example/sort-viz",
    decision: {
      outcome: "needs-changes",
      by: "lintel",
      hoursAgo: 200,
      reasonCode: "track",
      reason: "The work does not fit the Tools track: this is mostly page layout around textbook algorithms, so the technical core is thin. Add more tooling work, such as measuring the algorithms or building the animation engine yourself, or change the project's track, then ship again.",
    },
    commits: commitsFor("sh-2054", "wick", [
      ["8 Oct", "Page layout and bar animations", 288, 0, 93],
      ["10 Oct", "Bubble, merge and quick sort", 142, 11, 71],
      ["10 Oct", "Speed slider", 36, 4, 17],
    ]),
    readme: readme("sort-viz", ["What it is", "A website that animates bubble, merge and quick sort."]),
    builderAge: 13,
    builderCountry: "United Kingdom",
  }),
  ship({
    id: "sh-2055",
    title: "Soil moisture sensor board",
    builder: "cobble",
    kind: "hardware",
    track: "Hardware",
    status: "approved",
    submittedHoursAgo: 260,
    capability: "A capacitive soil sensor board with a custom oscillator front end and a calibration routine for three soil types.",
    evidence: lapse(
      [["9 Oct", 360], ["12 Oct", 420]],
      [
        { part: "Custom PCB, 2 layer", qty: 3, source: "Board house, ordered from my design files" },
        { part: "555 timer IC", qty: 3, source: "Online electronics distributor" },
        { part: "Pin headers", qty: 6, source: "Local hardware shop" },
      ],
      [
        ["9 Oct", "The probe traces on the board beside the oscillator circuit"],
        ["12 Oct", "Calibration readings written up from the oven-dried soil sample"],
      ],
      ["pcb/soil-probe.kicad_pcb", "pcb/soil-probe.kicad_sch", "docs/calibration.csv"],
    ),
    journals: [
      entry("9 Oct", 360, "Designed the capacitive probe as a PCB trace and simulated the oscillator.", ALL),
      entry("12 Oct", 360, "Calibrated against oven-dried soil and wrote the three-point routine.", ALL),
    ],
    ai: { percent: 0, uses: [], note: "No AI used." },
    source: "git.example/cobble/soil-sensor",
    firstPass: { by: "fenwick", hoursAgo: 230, verdict: "approved", minutes: 720, note: "Clean, measured sensor front end. Passing it on." },
    decision: {
      outcome: "approved",
      by: "orrery",
      hoursAgo: 220,
      reason: "A clean, original sensor front end that is measured, not guessed. Execution is good and the calibration data is published. All the work is Hardware, which is the project's track.",
    },
    commits: commitsFor("sh-2055", "cobble", [
      ["9 Oct", "Probe traces and oscillator", 154, 0, null],
      ["12 Oct", "Three-point calibration routine", 121, 14, null],
      ["12 Oct", "Calibration data", 48, 0, null],
    ]),
    readme: readme("soil-sensor", ["What it is", "A capacitive soil sensor with a 555 oscillator front end."], ["Calibration", "Three-point routine for three soil types. The data is in docs/calibration.csv."]),
    builderAge: 14,
    builderCountry: "Spain",
  }),
  ship({
    id: "sh-2056",
    title: "Retro terminal emulator",
    builder: "nullwisp",
    kind: "software",
    projectType: "linux",
    track: "Tools",
    status: "proposed-ban",
    submittedHoursAgo: 60,
    capability: "A terminal emulator with a retro CRT shader, tabs and a scrollback search.",
    evidence: hackatime([["C++", 80], ["GLSL", 12], ["Markdown", 8]], "red", ["retro-term", 1500]),
    journals: [
      entry("12 Oct", 480, "Wrote the escape sequence parser and the screen buffer."),
      entry("18 Oct", 540, "Added tabs, scrollback search and the CRT shader."),
      entry("26 Oct", 480, "Fixed rendering bugs and wrote the settings screen."),
    ],
    ai: { percent: 0, uses: [], note: "No AI used." },
    source: "git.example/nullwisp/retro-term",
    firstPass: {
      by: "lintel",
      hoursAgo: 40,
      verdict: "banned",
      minutes: null,
      note: "The first commit is a 9,000 line import with almost no tracked coding time, and the journal entries describe work that is not in the history. I am proposing a ban for hours the history does not support. A final reviewer should confirm or overturn it.",
    },
    commits: commitsFor("sh-2056", "nullwisp", [
      ["12 Oct", "Initial commit", 9120, 0, 4],
      ["18 Oct", "Add tabs", 214, 31, 58],
      ["26 Oct", "Settings screen", 187, 40, 63],
    ]),
    readme: null,
    notes: [note("n-2056-1", "lintel", 41, "Compared the first commit with two public terminal emulators. Large parts match line for line. Details are in the audit note on the first-pass verdict.")],
    builderAge: 17,
    builderCountry: "United States",
  }),
  ship({
    id: "sh-2057",
    title: "Motor controller board",
    builder: "gantry9",
    kind: "hardware",
    track: "Hardware",
    status: "banned",
    submittedHoursAgo: 190,
    capability: "A brushed motor controller board with a current limit.",
    evidence: lapse(
      [["2 Oct", 240], ["6 Oct", 300]],
      [
        { part: "Custom PCB, 2 layer", qty: 2, source: "Board house, ordered from my design files" },
        { part: "MOSFET, N-channel", qty: 4, source: "Online electronics distributor" },
      ],
      [["6 Oct", "The assembled controller on the bench"]],
      ["pcb/controller.kicad_pcb"],
    ),
    journals: [entry("2 Oct", 240, "Drew the schematic and routed the board."), entry("6 Oct", 300, "Assembled the board and tested the current limit.")],
    ai: { percent: 0, uses: [], note: "No AI used." },
    source: "git.example/gantry9/motor-controller",
    firstPass: { by: "fenwick", hoursAgo: 170, verdict: "banned", minutes: null, note: "The design files match another builder's public repository, and the commit history was removed. Proposing a ban." },
    ban: { by: "bellwether", hoursAgo: 150, reason: "The design and firmware match another public project and the history was removed before shipping. Confirmed by an owner after the first-pass proposal." },
    commits: commitsFor("sh-2057", "gantry9", [["6 Oct", "Add project files", 1480, 0, null]]),
    readme: null,
    builderAge: 17,
    builderCountry: "Poland",
  }),
];

// ---- Verdict history ----

const audit = (
  id: string,
  hoursAgo: number,
  reviewer: string,
  shipId: string,
  verdict: AuditVerdict,
  claimedMinutes: number,
  approvedMinutes: number | null,
  seconds: number,
  repoSeconds: number | null,
  demoSeconds: number | null,
  note: string,
  sections?: AuditSections,
): ReviewAudit => ({ id, ship: shipId, reviewer, verdict, hoursAgo, claimedMinutes, approvedMinutes, seconds, repoSeconds, demoSeconds, note, sections });

// Newest first.
const HAND_AUDITS: readonly ReviewAudit[] = [
  // The two newest rows are a revert and a fresh approval on the same ship: the owner took the verdict back to correct the hours, then
  // approved it again. They give the Reverted filter, the last-24-hours window and the day chart something to show.
  audit("au-20", 2, "bellwether", "sh-2053", "approved", 900, 840, 420, 150, null, "Approved again after the hours were corrected. Nothing else changed.", {
    notes: "Re-approved after the revert below. The credited hours are the same as before; the correction was to the record, not to the work.",
  }),
  audit("au-19", 7, "bellwether", "sh-2053", "reverted", 900, null, 240, null, null, "Reverted so the hours could be corrected. The ship returns to Spot check.", {
    notes: "Owner revert. The audit log keeps the original verdict.",
  }),
  audit("au-18", 26, "orrery", "sh-2050", "first_pass_approved", 1440, 1260, 1320, 540, null, "Good board and real measurements. I credited 21 of the 24 hours because two recordings are mostly a static bench. A final reviewer will look at the footage.", {
    technical: "A dual H-bridge board with shunt current sensing, a firmware stall detector and a measured stall waveform. The repository has schematic and gerbers, firmware and a write-up of the measurements. Board hardware is the Hardware track.",
    deflation: "The 24 Oct and 27 Oct recordings sit still for long stretches, about an hour each. Credited 21 hours of 24.",
    notes: "The builder is new to board design and the measurements are their own. The bill of materials names a source for every part.",
  }),
  audit("au-17", 40, "lintel", "sh-2056", "first_pass_banned", 1500, null, 1500, 780, 0, "Proposing a ban. The first commit is a 9,000 line import with almost no tracked coding time, and the journals describe work that is not in the history. A final reviewer should confirm or overturn it.", {
    technical: "A terminal emulator in C++ with a CRT shader. The first commit adds 9,120 lines in one go, and large parts match two public emulators line for line. The later commits are small and consistent with the tracked time.",
    notes: "I did not credit any hours. The proposal is about the first commit and the journal entries that describe it, not about the later work.",
  }),
  audit("au-16", 52, "tamsin", "sh-2049", "first_pass_approved", 1140, 1020, 960, 240, 120, "Thanks for shipping this. The capture reader and the flow table are clearly yours. I cut two hours from the styling entry because the chart components look generated.", {
    technical: "A web dashboard that reads a pcap file, groups packets into flows by 5-tuple and flags slow TCP handshakes. The capture reader is original code with tests. The chart components are one large generated file.",
    deflation: "The 29 Oct entry is mostly styling the generated chart components. Credited 2 of the 4 hours.",
    age: "The builder turned 19 after shipping. Their age at shipping is recorded in the profile.",
    notes: "AI declared at 35 percent. The declaration matches what the history shows, so this is not undisclosed. The builder's own share is the reader and the flow logic.",
  }),
  audit("au-15", 150, "bellwether", "sh-2057", "banned", 540, null, 600, 180, null, "This project was banned. The design files match another builder's public repository and the history was removed before shipping.", {
    technical: "A motor controller board whose files match another public project. The history has a single commit.",
    notes: "Confirmed as the final reviewer after the first-pass proposal. Both repositories were compared.",
  }),
  audit("au-14", 170, "fenwick", "sh-2057", "first_pass_banned", 540, null, 780, 300, null, "Proposing a ban. The design files match another builder's public repository, and the commit history was removed.", {
    technical: "A brushed motor controller board. One commit adds every file. The gerbers and the schematic match another public repository.",
  }),
  audit("au-13", 200, "lintel", "sh-2054", "needs_changes", 540, 0, 540, 150, 90, "Mostly page layout around textbook algorithms, so the technical core is thin. Try measuring the algorithms or building the animation engine yourself, then ship again.", {
    technical: "A website that animates three sorting algorithms. The sorts are textbook, and the animation loop is generated. The layout work is the bulk of the commits.",
    notes: "Credited no hours because the project is being sent back. The time is judged again when it ships again.",
  }),
  audit("au-12", 220, "orrery", "sh-2055", "approved", 720, 720, 1260, 420, null, "A clean, original sensor front end that is measured, not guessed. All the work is Hardware.", {
    technical: "A capacitive soil sensor on a PCB with a 555 oscillator front end and a three-point calibration routine. The calibration data is published as a CSV.",
    notes: "The bill of materials names a source for every part and the photos match the journal entries.",
  }),
  audit("au-11", 230, "fenwick", "sh-2055", "first_pass_approved", 720, 720, 840, 300, null, "Clean, measured sensor front end. Passing it on to a final reviewer.", {
    technical: "A capacitive soil sensor board with an oscillator front end and a calibration routine for three soil types.",
  }),
  audit("au-10", 280, "bellwether", "sh-2053", "approved", 900, 840, 900, 330, 60, "Parses its own grammar instead of wrapping an existing linter, which is the original part. Rules are tested and the README explains each one.", {
    technical: "A linter for a small config language with its own lexer, parser with error recovery and a rule engine. Eight rules, each with a test and a fix hint.",
    deflation: "One rule was copied from another linter's documentation. Credited 14 of the 15 hours.",
    notes: "Documentation could say more about limits. The builder is new to parsers, so the hours were not cut further.",
  }),
  audit("au-09", 290, "saltmarsh", "sh-2053", "first_pass_approved", 900, 840, 840, 300, 45, "Own parser and a tested rule engine. Cut one hour from the rule engine entry."),
  audit("au-08", 300, "saltmarsh", "sh-2047", "needs_changes", 2160, 0, 1080, 420, null, "Good question and a careful method. The write-up does not yet list the exact commands or the raw numbers, so nobody else could repeat it. Add them and ship again.", {
    technical: "A benchmark of INT8 quantisation across four models and three devices. The harness is original and the model versions are pinned.",
    notes: "Research Mode: the question and the method are strong. Reserved for me to re-review on the next ship.",
  }),
  audit("au-07", 380, "orrery", "sh-2052", "approved", 1200, 1200, 1140, 600, null, "A complete build with real range tests. The build log and range numbers make the documentation strong.", {
    technical: "A solar LoRa weather node that relays readings between nodes. Range tested to 2.4 km line of sight, 9 days on a small panel in shade.",
    notes: "All Hardware. The enclosure files and the schematic are in the repository.",
  }),
  audit("au-06", 395, "tamsin", "sh-2052", "first_pass_approved", 1200, 1200, 960, 420, null, "A complete build with range numbers. Passing it on."),
  audit("au-05", 410, "bellwether", "sh-2051", "approved", 1680, 1620, 780, 360, 90, "Original idea for a real pain point. The swap is the hard part and it works. Hours cut by one hour for the diff view, which was mostly styling.", {
    technical: "A tool that recompiles shaders on save and swaps them into a running renderer without a restart. Includes a diff of the compiled output.",
    deflation: "The diff view was mostly styling. Credited 8 of the 9 hours on that entry.",
    notes: "Documentation is clear. The builder has several earlier ships, so the hours were not cut beyond the diff view.",
  }),
  audit("au-04", 430, "saltmarsh", "sh-2051", "first_pass_approved", 1680, 1620, 840, 300, 60, "Original idea for a real pain point. The swap works. Cut one hour from the diff view."),
  audit("au-03", 800, "bellwether", "sh-2046", "approved", 420, 420, 480, 180, null, "A solid first version of the local store.", {
    technical: "A content-addressed build cache keyed on the target triple. Local store only in this version.",
  }),
  audit("au-02", 810, "saltmarsh", "sh-2046", "first_pass_approved", 420, 420, 600, 210, null, "A solid first version of the local store. Passing it on."),
];

// The hand-written ships and audits first, then the generated ones (review-fixtures-bulk.ts) that give the lists more than a page.
export const REVIEW_SHIPS: readonly ReviewShip[] = [...HAND_SHIPS, ...BULK_SHIPS];
export const REVIEW_AUDITS: readonly ReviewAudit[] = [...HAND_AUDITS, ...BULK_AUDITS];

// ---- Reviewers ----

const verdicts = (approved: number, firstPass: number, changes: number, rejected: number): VerdictCounts => ({ approved, firstPass, changes, rejected });

function reviewer(
  id: string,
  access: Reviewer["access"],
  secondPass: boolean,
  avgSeconds: number,
  all: VerdictCounts,
  month: VerdictCounts,
  week: VerdictCounts,
  day: VerdictCounts,
  hoursCredited: number,
  lastActiveHoursAgo: number,
): Reviewer {
  const total = (counts: VerdictCounts) => counts.approved + counts.firstPass + counts.changes + counts.rejected;
  return {
    id,
    handle: id,
    access,
    secondPass,
    thisWeek: total(week),
    allTime: total(all),
    accepted: all.approved + all.firstPass,
    rejected: all.changes + all.rejected,
    avgSeconds,
    verdicts: { all, month, week, day },
    hoursCredited,
    lastActiveHoursAgo,
  };
}

// Final approvals are given only by owners and final reviewers (bellwether and orrery). The windows nest: day is inside week,
// week inside month, month inside all time.
export const REVIEWERS: readonly Reviewer[] = [
  reviewer("bellwether", "both", true, 842, verdicts(70, 48, 21, 3), verdicts(14, 9, 4, 1), verdicts(3, 4, 2, 0), verdicts(1, 1, 0, 0), 912, 3),
  reviewer("fenwick", "hardware", false, 960, verdicts(0, 21, 7, 0), verdicts(0, 6, 2, 0), verdicts(0, 2, 0, 0), verdicts(0, 0, 0, 0), 0, 26),
  reviewer("lintel", "both", false, 523, verdicts(0, 55, 18, 0), verdicts(0, 17, 5, 0), verdicts(0, 5, 2, 0), verdicts(0, 1, 0, 0), 0, 6),
  reviewer("orrery", "hardware", true, 1130, verdicts(22, 27, 10, 2), verdicts(6, 7, 2, 0), verdicts(1, 2, 1, 0), verdicts(0, 1, 0, 0), 326, 4),
  reviewer("saltmarsh", "software", false, 702, verdicts(0, 29, 5, 0), verdicts(0, 8, 1, 0), verdicts(0, 3, 0, 0), verdicts(0, 0, 0, 0), 0, 20),
  reviewer("tamsin", "software", false, 611, verdicts(0, 70, 17, 0), verdicts(0, 21, 4, 0), verdicts(0, 5, 1, 0), verdicts(0, 2, 0, 0), 0, 2),
];

// ---- The log (what P-facing pages read) ----

const claim = (id: string, hoursAgo: number, reviewerId: string, shipId: string, action: LogAction, text: string, seconds = 0): LogEntry => ({
  id,
  hoursAgo,
  reviewer: reviewerId,
  ship: shipId,
  action,
  note: text,
  seconds,
});

const AUDIT_ACTION: Record<AuditVerdict, LogAction> = {
  approved: "approved",
  first_pass_approved: "first-pass-approved",
  needs_changes: "needs-changes",
  banned: "banned",
  first_pass_banned: "ban-proposed",
  reverted: "released",
};

// Claims and releases sit beside the verdicts. Each verdict row is the audit it comes from, so the two lists never disagree.
// Newest first.
export const REVIEW_LOG: readonly LogEntry[] = [
  claim("cl-04", 2, "tamsin", "sh-2045", "claimed", "Took it from the queue."),
  claim("cl-03", 5, "fenwick", "sh-2044", "claimed", "Took it from the queue."),
  claim("cl-02", 12, "lintel", "sh-2048", "claimed", "Took it from the queue."),
  claim("cl-01", 20, "saltmarsh", "sh-2046", "released", "Handing it back. I will not get to it today.", 240),
  ...REVIEW_AUDITS.map(
    (item): LogEntry => ({
      id: item.id,
      hoursAgo: item.hoursAgo,
      reviewer: item.reviewer,
      ship: item.ship,
      action: AUDIT_ACTION[item.verdict],
      note: item.note,
      seconds: item.seconds,
      claimedMinutes: item.claimedMinutes,
      approvedMinutes: item.approvedMinutes ?? undefined,
    }),
  ),
].sort((a, b) => a.hoursAgo - b.hoursAgo || a.id.localeCompare(b.id));
