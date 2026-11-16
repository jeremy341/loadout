// Pure rules for builder profiles. No database, no framework; every function has a bun test.
//
// API (used by the profile screens and by lib/platform/profile-actions.ts):
//   checkHandle(raw)            -> { ok, handle } | { ok: false, message }     3 to 24 of a-z 0-9 _ -, starts with a letter, not reserved
//   checkBio(raw)               -> { ok, bio: string | null } | { ok: false, message }   max 160, control characters removed
//   checkLinkUrl(raw, label)    -> { ok, url: string | null } | { ok: false, message }   https only, no credentials, ports or private hosts
//   normalizeStatus(status)     -> project status with "_" turned into "-" (the app writes "needs-changes", some fixtures "needs_changes")
//   isPublicProject(p)          -> approved and not hidden, or logging, shown as building and not hidden
//   publicProjects(list)        -> the projects a visitor may see; drafts, in review, needs changes and hidden never
//   pinnedProjects(list)        -> up to MAX_PINNED pinned approved public projects
//   pinnedFirst(list)           -> the same list with pinned ones first; stable otherwise
//   statusTabs(list)            -> [{ key, label, count }] for All plus each status, counts over the list given
//   checkPin(project, pinnedElsewhere) -> { ok } | { ok: false, message }

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 24;
export const BIO_MAX = 160;
export const MAX_PINNED = 3;
export const LINK_MAX = 300;

// Words nobody may take as a handle, so a handle never looks like staff, a route or the program itself.
export const RESERVED_HANDLES: readonly string[] = [
  "admin", "administrator", "staff", "loadout", "review", "reviewer", "reviewers", "me", "you", "owner", "mod", "moderator",
  "support", "help", "helper", "root", "system", "official", "netic", "orry", "hackclub", "hack-club", "null", "undefined",
  "api", "app", "dashboard", "profile", "builders", "builder", "explore", "settings", "shop", "projects", "project",
  "tracks", "community", "expeditions", "login", "logout", "signin", "signup", "www", "mail", "security", "team",
];

export type HandleResult = { ok: true; handle: string } | { ok: false; message: string };

// The handle is trimmed and folded to lower case first, so "Ada_Lovelace " becomes "ada_lovelace".
export function checkHandle(raw: unknown): HandleResult {
  const handle = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (handle.length === 0) return { ok: false, message: "Choose a handle." };
  // The messages are the profile spec's exact copy (.ulpi/design/profile-and-toolbelt.md 3.8). Reserved and taken read alike on purpose.
  if (handle.length < HANDLE_MIN || handle.length > HANDLE_MAX) return { ok: false, message: `Use ${HANDLE_MIN} to ${HANDLE_MAX} characters.` };
  if (!/^[a-z][a-z0-9_-]*$/.test(handle)) return { ok: false, message: "Use a to z, 0 to 9, _ and - only. Start with a letter." };
  if (RESERVED_HANDLES.includes(handle)) return { ok: false, message: "That handle is not available." };
  return { ok: true, handle };
}

export type BioResult = { ok: true; bio: string | null } | { ok: false; message: string };

// A bio is plain text. Control characters go, line breaks become spaces, runs of spaces collapse. Empty means no bio.
export function checkBio(raw: unknown): BioResult {
  if (raw !== null && raw !== undefined && typeof raw !== "string") return { ok: false, message: "The bio has to be text." };
  const text = (typeof raw === "string" ? raw : "")
    .replace(/[\r\n\t]+/g, " ")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g, "")
    .replace(/ {2,}/g, " ")
    .trim();
  if (text.length > BIO_MAX) return { ok: false, message: `Keep it to ${BIO_MAX} characters.` };
  return { ok: true, bio: text.length > 0 ? text : null };
}

// ---- Links ----

export type LinkResult = { ok: true; url: string | null } | { ok: false; message: string };

function privateIpv4(host: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return (
    a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) || a >= 224
  );
}

// A small local guard: it parses the address and refuses anything that is not a plain public https link. It resolves nothing.
// Empty input is allowed and means "no link". The host is lower-cased and the address is returned as the parser writes it.
export function checkLinkUrl(raw: unknown, label = "link"): LinkResult {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (text === "") return { ok: true, url: null };
  if (text.length > LINK_MAX) return { ok: false, message: `Keep the ${label} under ${LINK_MAX} characters.` };
  // eslint-disable-next-line no-control-regex
  if (/[\u0000- \u007f-\u009f\\]/.test(text)) return { ok: false, message: `The ${label} has a space or an unusual character.` };
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { ok: false, message: `Write the ${label} in full, starting with https://.` };
  }
  if (url.protocol !== "https:") return { ok: false, message: `The ${label} must start with https://.` };
  if (url.username !== "" || url.password !== "" || text.slice(8).split(/[/?#]/)[0].includes("@")) {
    return { ok: false, message: `Remove the user name or password from the ${label}.` };
  }
  if (url.port !== "") return { ok: false, message: `Leave the port out of the ${label}.` };
  const host = url.hostname.toLowerCase().replace(/\.+$/, "");
  if (host === "") return { ok: false, message: `The ${label} has no host name.` };
  const internal =
    host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") ||
    host.endsWith(".lan") || host.endsWith(".home.arpa") || host.startsWith("[") || /^[\d.]+$/.test(host) || /^0x[0-9a-f]+$/.test(host) ||
    privateIpv4(host) || !host.includes(".");
  if (internal) return { ok: false, message: `The ${label} has to point at a public website, not a local or numeric address.` };
  return { ok: true, url: url.toString() };
}

// ---- Project visibility ----

export type ProfileProject = {
  id: string;
  status: string;
  hidden: boolean;
  pinned: boolean;
  showBuilding: boolean;
};

export function normalizeStatus(status: string): string {
  return status.trim().toLowerCase().replace(/_/g, "-");
}

// What a visitor may see: an approved project, or a logging project its owner chose to show as "currently building". The owner
// hiding a project removes it either way. Drafts, submitted, in review and needs changes are never public.
export function isPublicProject(project: Pick<ProfileProject, "status" | "hidden" | "showBuilding">): boolean {
  if (project.hidden) return false;
  const status = normalizeStatus(project.status);
  return status === "approved" || (status === "logging" && project.showBuilding);
}

export function publicProjects<T extends Pick<ProfileProject, "status" | "hidden" | "showBuilding">>(projects: readonly T[]): T[] {
  return projects.filter(isPublicProject);
}

// The pinned strip: pinned, approved and public, at most MAX_PINNED, in the order given.
export function pinnedProjects<T extends ProfileProject>(projects: readonly T[]): T[] {
  return projects.filter((p) => p.pinned && normalizeStatus(p.status) === "approved" && isPublicProject(p)).slice(0, MAX_PINNED);
}

export function pinnedFirst<T extends Pick<ProfileProject, "pinned">>(projects: readonly T[]): T[] {
  return [...projects.filter((p) => p.pinned), ...projects.filter((p) => !p.pinned)];
}

export const STATUS_TABS: readonly { key: string; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "logging", label: "Logging" },
  { key: "submitted", label: "Submitted" },
  { key: "in-review", label: "In review" },
  { key: "needs-changes", label: "Needs changes" },
  { key: "approved", label: "Approved" },
];

export type StatusTab = { key: string; label: string; count: number };

// "All" first, then every status in the order the project moves, each with its count (zero kept so tabs do not jump).
export function statusTabs(projects: readonly Pick<ProfileProject, "status">[]): StatusTab[] {
  return [
    { key: "all", label: "All", count: projects.length },
    ...STATUS_TABS.map((tab) => ({ ...tab, count: projects.filter((p) => normalizeStatus(p.status) === tab.key).length })),
  ];
}

export type PinCheck = { ok: true } | { ok: false; message: string };

// Pinning wants an approved, visible project and a free slot. pinnedElsewhere is the number of OTHER projects the owner pinned.
export function checkPin(project: Pick<ProfileProject, "status" | "hidden">, pinnedElsewhere: number): PinCheck {
  if (normalizeStatus(project.status) !== "approved") return { ok: false, message: "Only an approved project can be pinned." };
  if (project.hidden) return { ok: false, message: "Show the project on your profile before pinning it." };
  if (pinnedElsewhere >= MAX_PINNED) return { ok: false, message: `You can pin up to ${MAX_PINNED} projects. Unpin one first.` };
  return { ok: true };
}

// The columns a visibility change writes. Hiding a project also unpins it, so a hidden project never holds a pin slot.
export function visibilityPatch(change: { hidden?: boolean; showBuilding?: boolean }): { hidden?: boolean; pinned?: false; showBuilding?: boolean } {
  const patch: { hidden?: boolean; pinned?: false; showBuilding?: boolean } = {};
  if (change.hidden !== undefined) {
    patch.hidden = change.hidden;
    if (change.hidden) patch.pinned = false;
  }
  if (change.showBuilding !== undefined) patch.showBuilding = change.showBuilding;
  return patch;
}
