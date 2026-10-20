import type { BomRow, Project } from "./types";

// Field validation for the Build forms. The plans fix a few of these (open-source licence, public source link,
// bill of materials with quantities and sources). Length limits are preview choices so a form cannot overflow storage.

export interface LicenseOption {
  id: string;
  label: string;
  group: "Software" | "Hardware design files";
}

/**
 * Plan 01 section 3.1 requires an open-source licence and does not list which count. The preview accepts widely used
 * OSI-approved licences for code and the CERN Open Hardware Licence family for hardware design files.
 * The program team still has to confirm the list (see SOURCES.md, Unsettled by the plans).
 */
export const OPEN_LICENSES: LicenseOption[] = [
  { id: "MIT", label: "MIT", group: "Software" },
  { id: "Apache-2.0", label: "Apache License 2.0", group: "Software" },
  { id: "BSD-2-Clause", label: "BSD 2-Clause", group: "Software" },
  { id: "BSD-3-Clause", label: "BSD 3-Clause", group: "Software" },
  { id: "ISC", label: "ISC", group: "Software" },
  { id: "MPL-2.0", label: "Mozilla Public License 2.0", group: "Software" },
  { id: "LGPL-3.0-only", label: "GNU LGPL v3", group: "Software" },
  { id: "GPL-3.0-only", label: "GNU GPL v3", group: "Software" },
  { id: "GPL-2.0-only", label: "GNU GPL v2", group: "Software" },
  { id: "AGPL-3.0-only", label: "GNU AGPL v3", group: "Software" },
  { id: "CERN-OHL-P-2.0", label: "CERN OHL v2 Permissive", group: "Hardware design files" },
  { id: "CERN-OHL-W-2.0", label: "CERN OHL v2 Weakly Reciprocal", group: "Hardware design files" },
  { id: "CERN-OHL-S-2.0", label: "CERN OHL v2 Strongly Reciprocal", group: "Hardware design files" },
];

export function isOpenLicense(id: string): boolean {
  return OPEN_LICENSES.some((license) => license.id === id);
}

export function licenseLabel(id: string): string {
  return OPEN_LICENSES.find((license) => license.id === id)?.label ?? "";
}

/** Accepts http(s) URLs with a real-looking public host. Rejects localhost and private address ranges. */
export function isPublicUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  const host = url.hostname.toLowerCase();
  if (!host.includes(".")) return false;
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (/^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return false;
  return true;
}

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export interface ProjectInput {
  name: string;
  summary: string;
  capability: string;
  repoUrl: string;
  license: string;
  collaborators: string;
}

export function validateProject(input: ProjectInput): FieldErrors<keyof ProjectInput> {
  const errors: FieldErrors<keyof ProjectInput> = {};
  const name = input.name.trim();
  if (!name) errors.name = "Give the project a name.";
  else if (name.length > 80) errors.name = "Keep the name to 80 characters or fewer.";
  const summary = input.summary.trim();
  if (!summary) errors.summary = "Write a short summary of what the project does.";
  else if (summary.length > 400) errors.summary = "Keep the summary to 400 characters or fewer.";
  if (input.capability.trim().length > 400) errors.capability = "Keep the capability statement to 400 characters or fewer.";
  const repo = input.repoUrl.trim();
  if (repo && !isPublicUrl(repo)) errors.repoUrl = "Enter a public http or https link, for example https://github.com/you/project.";
  if (input.license && !isOpenLicense(input.license)) errors.license = "Choose an open-source licence from the list. Closed licences are not accepted.";
  if (input.collaborators.trim().length > 200) errors.collaborators = "Keep collaborators to 200 characters or fewer.";
  return errors;
}

export function validateVersion(label: string, notes: string, existing: readonly string[]): FieldErrors<"label" | "notes"> {
  const errors: FieldErrors<"label" | "notes"> = {};
  const trimmed = label.trim();
  if (!trimmed) errors.label = "Give the version a label, for example v0.2.";
  else if (trimmed.length > 24) errors.label = "Keep the label to 24 characters or fewer.";
  else if (existing.some((e) => e.toLowerCase() === trimmed.toLowerCase())) errors.label = "That version label already exists.";
  if (notes.trim().length > 500) errors.notes = "Keep the notes to 500 characters or fewer.";
  return errors;
}

export function bomRowErrors(row: BomRow): string[] {
  const out: string[] = [];
  if (!row.part.trim()) out.push("needs a part name");
  if (!Number.isFinite(row.qty) || row.qty < 1 || !Number.isInteger(row.qty)) out.push("needs a whole quantity of 1 or more");
  if (!Number.isFinite(row.unitCost) || row.unitCost < 0) out.push("needs a unit cost of 0 or more");
  if (!row.link.trim()) out.push("needs a source (a supplier link or vendor name)");
  return out;
}

export function bomLineTotal(row: Pick<BomRow, "qty" | "unitCost">): number {
  const qty = Number.isFinite(row.qty) ? row.qty : 0;
  const cost = Number.isFinite(row.unitCost) ? row.unitCost : 0;
  return Math.round(qty * cost * 100) / 100;
}

export function bomTotals(rows: readonly BomRow[]): { lines: number; quantity: number; total: number } {
  return {
    lines: rows.length,
    quantity: rows.reduce((sum, row) => sum + (Number.isFinite(row.qty) ? row.qty : 0), 0),
    total: Math.round(rows.reduce((sum, row) => sum + bomLineTotal(row), 0) * 100) / 100,
  };
}

/** Plan 01 section 5 and 6.5: a Hardware ship needs a bill of materials with quantities and sources. */
export function bomIsComplete(rows: readonly BomRow[]): boolean {
  return rows.length > 0 && rows.every((row) => bomRowErrors(row).length === 0);
}

export interface JournalInput {
  title: string;
  body: string;
  hours: number;
  tagsText: string;
}

export function parseTags(text: string): string[] {
  const seen = new Set<string>();
  for (const raw of text.split(/[,\n]/)) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag) seen.add(tag);
  }
  return [...seen];
}

export function validateJournal(input: JournalInput, maxHours: number): FieldErrors<"title" | "body" | "hours" | "tags"> {
  const errors: FieldErrors<"title" | "body" | "hours" | "tags"> = {};
  const title = input.title.trim();
  if (!title) errors.title = "Give the entry a title.";
  else if (title.length > 100) errors.title = "Keep the title to 100 characters or fewer.";
  const body = input.body.trim();
  if (!body) errors.body = "Say what you worked on, what changed and what is next.";
  else if (body.length > 5000) errors.body = "Keep the entry to 5,000 characters or fewer.";
  if (!Number.isFinite(input.hours) || input.hours < 0) errors.hours = "Hours must be 0 or more.";
  else if (input.hours > maxHours + 1e-9) {
    errors.hours =
      maxHours <= 0
        ? "No uncovered hours are left on this project. Each tracked hour can be covered by one entry only."
        : `This project only has ${maxHours} uncovered hours. Each tracked hour can be covered by one entry only.`;
  }
  const tags = parseTags(input.tagsText);
  if (tags.length > 8) errors.tags = "Use at most 8 tags.";
  else if (tags.some((tag) => tag.length > 24 || !/^[\p{L}\p{N}._-]+$/u.test(tag))) {
    errors.tags = "Tags use letters, numbers, dots, dashes or underscores, up to 24 characters each.";
  }
  return errors;
}

/** Splits plain text into paragraphs (blank line) and lines. Rendered as text, never as HTML. */
export function toParagraphs(text: string): string[][] {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.split("\n").map((line) => line.trimEnd()))
    .filter((lines) => lines.some((line) => line.trim() !== ""));
}

export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "entry";
}

export function entryToPlainText(entry: {
  title: string;
  body: string;
  hours: number;
  tags: string[];
  isPublic: boolean;
  at: number;
}, projectName: string): string {
  const when = new Date(entry.at).toISOString();
  const lines = [
    entry.title,
    "=".repeat(Math.min(Math.max(entry.title.length, 3), 72)),
    `Project: ${projectName}`,
    `Date: ${when}`,
    `Development hours covered: ${entry.hours}`,
    `Tags: ${entry.tags.length ? entry.tags.join(", ") : "none"}`,
    `Visibility: ${entry.isPublic ? "public" : "private"}`,
    "",
    entry.body.replace(/\r\n?/g, "\n").trim(),
    "",
  ];
  return lines.join("\n");
}

/** The fields of a project that the public page shows. Nothing from Lapse is ever included. */
export function publicProjectFields(project: Project) {
  return {
    name: project.name,
    summary: project.summary,
    capability: project.capability,
    track: project.track,
    researchMode: project.researchMode,
    repoUrl: project.repoUrl,
    license: project.license,
    collaborators: project.collaborators,
    versions: project.versions,
    // Plan 01 section 6.7: Lapse recordings are reviewer-only, so the tracker itself is never listed here.
    bom: project.track === "Hardware" ? project.bom : [],
  };
}
