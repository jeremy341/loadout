#!/usr/bin/env node
// Copies the parts of Pixl's internal dashboard the reviewer site uses into apps/landing, rewriting the import aliases.
//
//   node reviewer-dash/scripts/copy-from-pixl.mjs            copy, then print a diff summary
//   node reviewer-dash/scripts/copy-from-pixl.mjs --list     print the file closure and what would happen, copy nothing
//
// Source: references/pixl/apps/internal-dashboard (read only). Nothing in it is ever written.
// The copy is a closure: it starts at ROOTS and ROUTE_DIRS and follows imports. A module in ADAPTED is never copied or followed: LOADOUT
// has its own hand-written version in reviewer-dash/ (the adapters). A file listed in reviewer-dash/ADJUSTED.txt (paths relative to
// apps/landing) is never overwritten, so a hand edit survives a re-run. Add a route directory to ROUTE_DIRS to bring in another page group.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const landing = path.resolve(here, "..", "..");
const src = path.resolve(landing, "..", "..", "references", "pixl", "apps", "internal-dashboard");
const list = process.argv.includes("--list");

// Route directories (relative to Pixl's app/) copied whole into app/(reviewer)/reviewer/<same path>.
const ROUTE_DIRS = ["review", "admins", "bans", "budget", "community-goals", "events", "forms", "fulfillers", "fulfillment", "ideas", "notify", "operations", "players", "projects", "referrals", "removed", "reports", "reviewers", "settings", "shop", "shop-detail", "show-n-tell", "stats", "tickets", "violations"];
// Single route files copied the same way. layout.tsx is hand-adapted (see ADJUSTED.txt), page.tsx is the overview.
const ROUTE_FILES = ["page.tsx"];
// Extra non-route roots to follow.
const ROOTS = ["app/_ui/ui.tsx", "app/_ui/Tabs.tsx", "app/_ui/Select.tsx", "app/_ui/PaginatedTable.tsx", "app/_ui/Progress.tsx", "app/_ui/SlackName.tsx", "app/_ui/SubmitButton.tsx", "app/_ui/CommandPalette.tsx", "app/_ui/TopNav.tsx", "app/_ui/Tooltips.tsx", "app/_ui/nav.ts", "app/_ui/glyphs.ts", "app/_ui/actionError.ts", "app/_ui/admin.css", "app/_ui/themes.css", "app/_ui/fonts.css"];
// Pure-module tests that run without a database, copied next to their module.
const TESTS = ["reviewMacros", "pagination", "queueWait", "reviewAssignment", "reviewAccess", "reviewClaimState", "reviewStats", "reviewReward", "doubleDip", "githubRepoOwner", "reviewTypeFilter", "reviewCycleDisplay", "auditReviewerView", "hours", "safeUrl", "unship"].map((n) => `lib/${n}.test.ts`).concat(["app/_ui/actionError.test.ts", "app/_ui/nav.test.ts"]);

// Pixl modules LOADOUT replaces with its own (hand-written, listed in ADJUSTED.txt). Imports of them are rewritten, the module is not copied.
const ADAPTED = new Set([
  "lib/db.ts", "lib/guard.ts", "lib/session.ts", "app/actions.ts", "app/_generated/config.ts", "lib/pgCompat.ts",
  // Network, secrets, game server and third-party services: LOADOUT has quiet stand-ins (same module name in reviewer-dash/lib) or sample data instead.
  "lib/slack.ts", "lib/hackatime.ts", "lib/commits.ts", "lib/bom.ts", "lib/fraudy.ts", "lib/crypto.ts", "lib/ysws.ts",
  "lib/operations.ts", "lib/operationsReview.ts", "lib/tickets.ts", "lib/reviewGrants.ts", "lib/robert.ts",
  "lib/notify.ts", "lib/airtable.ts", "lib/pixo.ts", "lib/gameServer.ts", "lib/aiReview.ts",
]);
// Pixl components out of scope for the review area (game, economy, shop, blackout, Robert). Imports are left in place; the adapter
// layer or the adjustment pass handles them, and the script reports them.
const SKIP = new Set(["app/_ui/fonts.css"]);

const ADJUSTED = new Set(
  fs.existsSync(path.join(landing, "reviewer-dash", "ADJUSTED.txt"))
    ? fs.readFileSync(path.join(landing, "reviewer-dash", "ADJUSTED.txt"), "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
    : [],
);

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(path.join(src, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
};

const exists = (rel) => fs.existsSync(path.join(src, rel)) && fs.statSync(path.join(src, rel)).isFile();
const resolveSpec = (spec, from) => {
  let base;
  if (spec.startsWith("@/")) base = spec.slice(2);
  else if (spec.startsWith(".")) base = path.posix.join(path.posix.dirname(from), spec);
  else return null;
  for (const c of [base, `${base}.ts`, `${base}.tsx`, `${base}.css`, `${base}/index.ts`, `${base}/index.tsx`]) if (exists(c)) return c;
  return null;
};

const isRoute = (rel) => ROUTE_FILES.includes(rel.replace(/^app\//, "")) || ROUTE_DIRS.some((d) => rel.startsWith(`app/${d}/`));
const isTest = (rel) => /\.test\.tsx?$/.test(rel);

// Output path, relative to apps/landing.
export function target(rel) {
  if (isRoute(rel)) return `app/(reviewer)/reviewer/${rel.slice("app/".length)}`;
  return `reviewer-dash/${rel}`;
}

// The mechanical rewrite: Pixl's aliases become reviewer-dash aliases. Route-local imports are relative and stay as they are.
export function rewrite(text) {
  return text
    // Pixl's checkout may carry CRLF line endings; the copy is LF (its tests and diffs expect that).
    .replaceAll("\r\n", "\n")
    // Two test-only fixes: the review desk page lives in the route tree here, and the generated config's site address is a LOADOUT placeholder.
    .replace(/new URL\("\.\.\/app\/review\/\[id\]\/page\.tsx", import\.meta\.url\)/g, 'new URL("../../app/(reviewer)/reviewer/review/[id]/page.tsx", import.meta.url)')
    .replace(/https:\/\/pixl\.hackclub\.com\/shop\/keyboard\.webp/g, "https://loadout.invalid/shop/keyboard.webp")
    // No network: the HURT fraud tool is a third-party page mounted in an iframe; here the frame is empty.
    .replace('const HURT_URL = "https://hurt-xi.vercel.app";', 'const HURT_URL = "about:blank#";')
    .replace(/(["'])@\/lib\//g, "$1@/reviewer-dash/lib/")
    .replace(/(["'])@\/components\//g, "$1@/reviewer-dash/components/")
    .replace(/(["'])@\/app\/_components\//g, "$1@/reviewer-dash/app/_components/")
    .replace(/(["'])@\/app\/_ui\//g, "$1@/reviewer-dash/app/_ui/")
    .replace(/(["'])@\/app\/_generated\//g, "$1@/reviewer-dash/app/_generated/")
    .replace(/(["'])@\/app\/actions(["'])/g, "$1@/reviewer-dash/app/actions$2")
    .replace(/(["'])@\/app\/(review|reviewers|players|projects)\//g, "$1@/app/(reviewer)/reviewer/$2/");
}

const closure = new Set();
const TESTROOTS = TESTS.filter((t) => exists(t));
const stack = [...ROOTS, ...TESTROOTS, ...walk("app").filter((f) => isRoute(f) && !isTest(f))];
while (stack.length) {
  const f = stack.pop();
  if (closure.has(f) || ADAPTED.has(f) || SKIP.has(f)) continue;
  if (!exists(f)) continue;
  closure.add(f);
  if (!/\.(tsx?|css)$/.test(f)) continue;
  const text = fs.readFileSync(path.join(src, f), "utf8");
  for (const m of text.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
    const r = resolveSpec(m[1], f);
    if (r) stack.push(r);
  }
}
// Layout and the overview are hand-adapted but stay in the closure so their imports are found.

const files = [...closure].sort();
if (list) {
  for (const f of files) console.log(`${ADJUSTED.has(target(f)) ? "ADJUSTED " : "copy     "}${f} -> ${target(f)}`);
  console.log(`\n${files.length} files in the closure`);
  process.exit(0);
}

let copied = 0, same = 0, skipped = 0, changed = 0;
const diffs = [];
for (const f of files) {
  const out = target(f);
  if (ADJUSTED.has(out)) { skipped++; continue; }
  const abs = path.join(landing, out);
  const raw = fs.readFileSync(path.join(src, f));
  const isText = /\.(tsx?|css|json|md)$/.test(f);
  let body = isText ? rewrite(raw.toString("utf8")) : raw;
  // Fonts: Phantom Sans is a brand font the MIT licence does not cover. Its @font-face rules are removed and the body stack is the system one.
  if (f === "app/_ui/admin.css") {
    body = body.replace(/@font-face\s*\{[^}]*Phantom Sans[^}]*\}\s*/g, "").replace(/"Phantom Sans",?\s*/g, "");
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (isText && Buffer.compare(Buffer.from(raw.toString("utf8").replaceAll("\r\n", "\n")), Buffer.from(body)) !== 0) {
    // A real diff against Pixl's file, so line shifts (the removed @font-face rules) are not counted as changes.
    const tmp = path.join(os.tmpdir(), "pixl-copy-diff.tmp");
    fs.writeFileSync(tmp, body);
    const r = spawnSync("git", ["diff", "--no-index", "--ignore-cr-at-eol", "--numstat", path.join(src, f), tmp], { encoding: "utf8" });
    const [add, del] = (r.stdout.split("\t") ?? []).map((n) => Number(n) || 0);
    changed++;
    diffs.push(`${f}: +${add} -${del} lines against Pixl (${f === "app/_ui/admin.css" ? "Phantom Sans removed" : "alias rewrite"})`);
  }
  if (fs.existsSync(abs) && Buffer.compare(fs.readFileSync(abs), Buffer.from(body)) === 0) { same++; continue; }
  fs.writeFileSync(abs, body);
  copied++;
}
console.log(`${files.length} files in the closure: ${copied} written, ${same} already identical, ${skipped} skipped (ADJUSTED.txt).`);
console.log(`${changed} files differ from Pixl, by the alias rewrite${files.includes("app/_ui/admin.css") ? " and the font removal" : ""} (line endings are normalised to LF and not counted):`);
for (const d of diffs) console.log(`  ${d}`);
