// AI pre-check rules, pure: what is checked on a freshly shipped project before a human reviewer sees it. Ported from Pixl's
// apps/server/src/precheck/rules.ts at upstream 1468ba6942b13add1ac50e1319541a033ee1df38 (parseGithubRepo, scopeFiles, findReadme,
// readmeImages, requirementsFor, parseAiAnswer, evaluate). No database, no network: precheck-sources.ts feeds these the repo and the
// model's answer, precheck-data.ts stores the result.
//
// Only clear-cut misses are "blocking" (here: flag the row for the reviewer). Anything that is a judgment call, such as messy code
// or thin docs, is a note. The text on the row is always built from the FIXED labels below, never from model output, so a README
// cannot make the desk say something odd. The model's own evidence and notes are kept in the row's detail, shortened, for the
// reviewer to read as plain text.
//
// Not carried over from Pixl, because they act on the project or on the builder rather than inform the reviewer: the send-back to
// needs_changes, the review note and Slack DM wording (reviewNoteFor, dmFor), and the 100-word README length gate (LOADOUT's own
// README gate is lib/platform/readme.ts). Hardware file rules (BOM csv, .step, CAD source) are Pixl's own hardware requirements;
// LOADOUT asks hardware ships for design files and a bill of materials but names no formats (plans/01, plans/02), so those three
// checks produce NOTES for the reviewer here and never a flag. Two Pixl hardware questions without a LOADOUT counterpart
// (why_made, build_media) are not asked.

export type ProjectKind = "software" | "hardware";

export type RepoRef = {
  owner: string;
  repo: string;
  ref: string; // "HEAD" when the URL names no branch
  path: string; // subdirectory the project lives in, "" for the repo root
};

const SEGMENT = /^[A-Za-z0-9_.-]{1,100}$/;

// github.com/<owner>/<repo>[.git][/tree/<ref>[/<path>]]. Anything else (GitLab, a gist, a profile) returns null and the project
// skips the check. (readme-source.ts has a parseGithubRepo that drops the branch and folder; this one keeps them.)
export function parseGithubRef(url: string): RepoRef | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.hostname.toLowerCase() !== "github.com" && u.hostname.toLowerCase() !== "www.github.com") return null;
  const parts = u.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, "");
  if (!SEGMENT.test(owner) || !SEGMENT.test(repo)) return null;
  let ref = "HEAD";
  let path = "";
  if (parts[2] === "tree" && parts[3]) {
    if (!SEGMENT.test(parts[3])) return null;
    ref = parts[3];
    const rest = parts.slice(4);
    if (rest.some((p) => !SEGMENT.test(p))) return null;
    path = rest.join("/");
  }
  // Anything else after the repo (/blob/..., /issues) still means the repo.
  return { owner, repo, ref, path };
}

// Repo files relative to the project's folder (the URL's subdirectory).
export function scopeFiles(paths: string[], dir: string): string[] {
  if (!dir) return paths;
  const prefix = `${dir.replace(/\/+$/, "")}/`;
  return paths.filter((p) => p.startsWith(prefix)).map((p) => p.slice(prefix.length));
}

// The README at the top of the project folder, if any.
export function findReadme(files: string[]): string | null {
  const top = files.filter((f) => !f.includes("/") && /^readme(\.(md|markdown|mdx|txt|rst))?$/i.test(f));
  return top.find((f) => /\.md$/i.test(f)) ?? top[0] ?? null;
}

const BADGE_HOSTS = ["img.shields.io", "shields.io", "badgen.net", "badge.fury.io", "forthebadge.com", "codecov.io", "travis-ci.org", "travis-ci.com", "circleci.com", "wakatime.com", "hackatime-badge.hackclub.com"];

function isBadge(src: string): boolean {
  const s = src.trim().toLowerCase();
  if (/\/badge(\.svg)?(\?|$)/.test(s) || /badge\.svg/.test(s)) return true;
  try {
    const host = new URL(s).hostname;
    return BADGE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false; // relative path: a real image in the repo
  }
}

// Images in a README that actually show something: markdown ![..](src), reference-style ![..][id], and <img src>. Status badges
// don't count.
export function readmeImages(md: string): string[] {
  const out: string[] = [];
  for (const m of md.matchAll(/!\[[^\]]*\]\(\s*<?([^)\s>]+)>?[^)]*\)/g)) out.push(m[1]);
  for (const m of md.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) out.push(m[1]);
  const refs = new Map<string, string>();
  for (const m of md.matchAll(/^\s*\[([^\]]+)\]:\s*<?(\S+?)>?(\s|$)/gm)) refs.set(m[1].toLowerCase(), m[2]);
  for (const m of md.matchAll(/!\[([^\]]*)\]\[([^\]]*)\]/g)) {
    const src = refs.get((m[2] || m[1]).toLowerCase());
    if (src) out.push(src);
  }
  return out.filter((src) => !isBadge(src));
}

const has = (files: string[], re: RegExp) => files.some((f) => re.test(f));

// Hardware file observations a file listing can settle without any judgment (Pixl's hardwareFileMisses). Here they are notes, not
// misses: see the header.
export function hardwareFileNotes(files: string[], readme: string): string[] {
  const notes: string[] = [];
  if (!has(files, /\.csv$/i)) notes.push("No .csv bill of materials found in the repo (it may be linked elsewhere).");
  if (!has(files, /\.(step|stp)$/i)) notes.push("No .step 3D model found in the repo.");
  const cadSource = /\.(f3d|f3z|fcstd|sldprt|sldasm|blend|scad|ipt|iam|skp|3dm|catpart|prt)$/i;
  if (!has(files, cadSource) && !/onshape\.com/i.test(readme)) notes.push("No CAD source file or Onshape link found.");
  return notes;
}

// ---- What the model is asked ----

export type AiRequirementId = "what_it_is" | "built_with" | "how_to_run" | "how_to_use" | "pcb_or_wiring" | "firmware";
export type Requirement = { id: AiRequirementId; question: string };

export function requirementsFor(kind: ProjectKind): Requirement[] {
  if (kind === "software")
    return [
      { id: "what_it_is", question: "Does the README explain what the project is and what it does?" },
      { id: "built_with", question: "Does the README say what it was built with (languages, frameworks or libraries)?" },
      { id: "how_to_run", question: "Does the README explain how to set it up and run it (install/build/run steps), or link to where it's hosted for a web app?" },
    ];
  return [
    { id: "what_it_is", question: "Does the README explain what the project is and what it does?" },
    { id: "how_to_use", question: "Does the README explain how to use it?" },
    { id: "pcb_or_wiring", question: "If the project has electronics: does the repo contain PCB source files (KiCad, EasyEDA, gerbers) or a wiring diagram? Answer met=true if it has no electronics." },
    { id: "firmware", question: "If the project has a microcontroller: does the repo contain its firmware source code? Answer met=true if it has no microcontroller." },
  ];
}

export type AiRequirementAnswer = { met: boolean; confident: boolean; evidence: string };
export type AiAnswer = { requirements: Partial<Record<AiRequirementId, AiRequirementAnswer>>; notes: string[]; summary: string };

// Loose parse of the model's JSON. Anything malformed becomes "no answer" for that item, which never flags a project.
export function parseAiAnswer(raw: string, asked: Requirement[]): AiAnswer | null {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(s.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
  const reqIn = (obj.requirements ?? {}) as Record<string, Record<string, unknown> | undefined>;
  const requirements: AiAnswer["requirements"] = {};
  for (const r of asked) {
    const a = reqIn[r.id];
    if (!a || typeof a.met !== "boolean") continue;
    requirements[r.id] = { met: a.met, confident: a.confident === true, evidence: String(a.evidence ?? "").slice(0, 300) };
  }
  const notes = Array.isArray(obj.notes) ? obj.notes.map((n) => String(n).slice(0, 300)).filter(Boolean).slice(0, 6) : [];
  return { requirements, notes, summary: String(obj.summary ?? "").slice(0, 600) };
}

// ---- Findings ----

export type BlockingId = "readme_missing" | "readme_no_image" | AiRequirementId;

// The one place the desk's wording lives. Fixed text; the reviewer sees these, never the model's sentences.
export const BLOCKING: Record<BlockingId, string> = {
  readme_missing: "The repo has no README.",
  readme_no_image: "The README has no screenshot or image of the project (status badges don't count).",
  what_it_is: "The README doesn't explain what the project is and what it does.",
  built_with: "The README doesn't say what it was built with.",
  how_to_run: "The README doesn't explain how to set it up and run it.",
  how_to_use: "The README doesn't explain how to use it.",
  pcb_or_wiring: "The repo has no PCB source files or wiring diagram.",
  firmware: "The repo doesn't include the firmware source code.",
};

export type PrecheckFindings = {
  blocking: BlockingId[];
  notes: string[]; // the model's observations, for reviewers, never decisive
  fileNotes: string[]; // fixed-rule observations that are not misses (hardware files)
  summary: string; // the model's one-line read of the project
  evidence: Partial<Record<AiRequirementId, string>>;
  skipped: string[]; // checks that couldn't run (shown to the reviewer)
};

export type PrecheckInputs = {
  kind: ProjectKind;
  readme: string | null; // null = no README file
  files: string[] | null; // null = file list unavailable or truncated
  ai: AiAnswer | null;
  asked: Requirement[];
};

export function evaluate(input: PrecheckInputs): PrecheckFindings {
  const blocking: BlockingId[] = [];
  const skipped: string[] = [];
  const evidence: PrecheckFindings["evidence"] = {};
  if (input.readme === null) {
    if (input.files) blocking.push("readme_missing");
    else skipped.push("README lookup");
  } else if (readmeImages(input.readme).length === 0) blocking.push("readme_no_image");

  let fileNotes: string[] = [];
  if (input.kind === "hardware") {
    if (input.files) fileNotes = hardwareFileNotes(input.files, input.readme ?? "");
    else skipped.push("hardware file checks (repo file list unavailable)");
  }

  if (input.ai && input.readme !== null) {
    for (const r of input.asked) {
      const a = input.ai.requirements[r.id];
      if (!a) continue;
      if (a.evidence) evidence[r.id] = a.evidence;
      // Only a confident miss is clear-cut enough to flag.
      if (!a.met && a.confident) blocking.push(r.id);
    }
  } else if (input.readme !== null) skipped.push("README content check (AI unavailable)");

  return { blocking: [...new Set(blocking)], notes: input.ai?.notes ?? [], fileNotes, summary: input.ai?.summary ?? "", evidence, skipped };
}

// The line on the desk: fixed labels only.
export function summaryLine(f: PrecheckFindings): string {
  const tail = f.skipped.length > 0 ? ` (skipped: ${f.skipped.join("; ")})` : "";
  if (f.blocking.length === 0) return `Pre-check: nothing required looks missing${tail}.`;
  return `Pre-check: ${f.blocking.map((id) => BLOCKING[id]).join(" ")}${tail}`;
}
