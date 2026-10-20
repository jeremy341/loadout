import { ME, SAMPLE_BUILDERS, type TrackName } from "../../../../lib/sample/builders";
import { HUB_RULES } from "./rules";
import { charLength, hasControlChars, isRecord, tidy } from "./text";

// The builder profile: what is stored, how each field is validated, and exactly what other people see.
// Pure functions only; the page and the tests call these.

export const TRACKS: TrackName[] = ["Tools", "Systems", "Compute", "Hardware"];

/** Sprites from /loadout/sprites that a builder can wear as an avatar. */
export const AVATAR_SPRITES = ["builder", "cap", "code", "cpu", "flask", "gear", "laptop", "terminal", "wrench", "board", "globe", "layers"] as const;
export type AvatarSprite = (typeof AVATAR_SPRITES)[number];
export type AvatarChoice = "initials" | AvatarSprite;

export interface Visibility {
  projects: boolean;
  journals: boolean;
  achievements: boolean;
  stats: boolean;
}

export interface ProfileLink {
  label: string;
  url: string;
}

export interface Identity {
  displayName: string;
  handle: string;
  bio: string;
  pronouns: string;
  track: TrackName;
  links: ProfileLink[];
  avatar: AvatarChoice;
}

export interface Profile extends Identity {
  visibility: Visibility;
  /** Project ids the builder chose to show first. Only public projects ever appear. */
  pinned: string[];
}

/** Public by default (Plan 01 section 6.7: project pages and journals; the proposal: ships). */
export const PUBLIC_VISIBILITY: Visibility = { projects: true, journals: true, achievements: true, stats: true };

export const INITIAL_PROFILE: Profile = {
  displayName: ME.name,
  handle: ME.handle,
  bio: ME.bio,
  pronouns: "",
  track: ME.track,
  links: [],
  avatar: "initials",
  visibility: PUBLIC_VISIBILITY,
  pinned: [],
};

export const VISIBILITY_LABELS: Record<keyof Visibility, { label: string; help: string }> = {
  projects: { label: "Projects", help: "Your pinned public projects appear on your profile." },
  journals: { label: "Journals", help: "How many journal entries and build hours you have logged." },
  achievements: { label: "Achievements", help: "The names of the achievements you have earned." },
  stats: { label: "Stats", help: "Approved ships, reviews done, hours and follower counts." },
};

// ---------------------------------------------------------------------------------------------------------
// Validation

export type Check<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateDisplayName(raw: string): Check<string> {
  const value = tidy(raw);
  const { min, max } = HUB_RULES.displayName;
  if (hasControlChars(value)) return { ok: false, error: "Use plain text only." };
  const length = charLength(value);
  if (length < min) return { ok: false, error: `Enter at least ${min} characters.` };
  if (length > max) return { ok: false, error: `Keep it to ${max} characters or fewer (now ${length}).` };
  return { ok: true, value };
}

/** A handle is a lowercase slug. A leading @ is accepted and dropped. */
export function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

const HANDLE_SHAPE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateHandle(raw: string, own: string = ME.handle): Check<string> {
  const value = normalizeHandle(raw);
  const { min, max } = HUB_RULES.handle;
  if (value.length < min) return { ok: false, error: `Use at least ${min} characters.` };
  if (value.length > max) return { ok: false, error: `Use ${max} characters or fewer (now ${value.length}).` };
  if (!HANDLE_SHAPE.test(value)) {
    return { ok: false, error: "Use lowercase letters, numbers and single hyphens, starting and ending with a letter or number." };
  }
  if (value === own) return { ok: true, value };
  if ((HUB_RULES.reservedHandles as readonly string[]).includes(value)) return { ok: false, error: "That handle is reserved. Pick another." };
  if (SAMPLE_BUILDERS.some((b) => b.handle === value)) return { ok: false, error: "Another builder already uses that handle." };
  return { ok: true, value };
}

export function validateBio(raw: string): Check<string> {
  const value = raw.replace(/\r\n/g, "\n").trim();
  if (hasControlChars(value.replace(/\n/g, " "))) return { ok: false, error: "Use plain text only." };
  const length = charLength(value);
  if (length > HUB_RULES.bioMax) return { ok: false, error: `Keep your bio to ${HUB_RULES.bioMax} characters or fewer (now ${length}).` };
  return { ok: true, value };
}

export function validatePronouns(raw: string): Check<string> {
  const value = tidy(raw);
  if (hasControlChars(value)) return { ok: false, error: "Use plain text only." };
  if (charLength(value) > HUB_RULES.pronounsMax) return { ok: false, error: `Keep it to ${HUB_RULES.pronounsMax} characters or fewer.` };
  return { ok: true, value };
}

/** Accepts https URLs only. Returns the address in its normal form. */
export function validateHttpsUrl(raw: string, max: number = HUB_RULES.linkMax): Check<string> {
  const text = raw.trim();
  if (!text) return { ok: false, error: "Enter a link that starts with https://." };
  if (text.length > max) return { ok: false, error: `Keep the link under ${max} characters.` };
  if (!/^https:\/\//i.test(text)) return { ok: false, error: "Links must start with https://." };
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { ok: false, error: "That is not a valid address." };
  }
  if (url.protocol !== "https:") return { ok: false, error: "Links must start with https://." };
  if (url.username || url.password) return { ok: false, error: "Remove the name and password from the link." };
  if (!url.hostname.includes(".")) return { ok: false, error: "Enter a full address such as https://example.org/page." };
  return { ok: true, value: url.href };
}

export function validateLink(link: ProfileLink): Check<ProfileLink> {
  const url = validateHttpsUrl(link.url);
  if (!url.ok) return url;
  const label = tidy(link.label);
  if (hasControlChars(label)) return { ok: false, error: "Use plain text only." };
  if (charLength(label) > HUB_RULES.linkLabelMax) return { ok: false, error: `Keep the label to ${HUB_RULES.linkLabelMax} characters or fewer.` };
  return { ok: true, value: { label: label || new URL(url.value).hostname, url: url.value } };
}

export interface IdentityErrors {
  displayName?: string;
  handle?: string;
  bio?: string;
  pronouns?: string;
  /** One entry per link row: an error message, or null when that row is fine. */
  links: (string | null)[];
  linksTotal?: string;
  track?: string;
  avatar?: string;
}

export type IdentityCheck = { ok: true; value: Identity; errors: IdentityErrors } | { ok: false; value: null; errors: IdentityErrors };

function isAvatar(value: unknown): value is AvatarChoice {
  return value === "initials" || (typeof value === "string" && (AVATAR_SPRITES as readonly string[]).includes(value));
}

/** Validates every link row; returns the cleaned links and fills one error slot (message or null) per row. */
function validateLinkRows(draftLinks: readonly ProfileLink[], rowErrors: (string | null)[]): ProfileLink[] {
  const links: ProfileLink[] = [];
  const seen = new Set<string>();
  draftLinks.forEach((link, index) => {
    const result = validateLink(link);
    if (!result.ok) {
      rowErrors[index] = result.error;
    } else if (seen.has(result.value.url)) {
      rowErrors[index] = "That link is already on your profile.";
    } else {
      seen.add(result.value.url);
      links.push(result.value);
      rowErrors[index] = null;
    }
  });
  return links;
}

/** Errors for the fields that are not text checks: track, avatar and the link count. */
function collectChoiceErrors(draft: Identity, errors: IdentityErrors): void {
  if (!TRACKS.includes(draft.track)) errors.track = "Choose one of the four tracks.";
  if (!isAvatar(draft.avatar)) errors.avatar = "Choose an avatar from the list.";
  if (draft.links.length > HUB_RULES.maxLinks) errors.linksTotal = `Add at most ${HUB_RULES.maxLinks} links.`;
}

function hasChoiceOrLinkErrors(errors: IdentityErrors): boolean {
  return Boolean(errors.track || errors.avatar || errors.linksTotal || errors.links.some((e) => typeof e === "string"));
}

export function validateIdentity(draft: Identity, own: string = ME.handle): IdentityCheck {
  const errors: IdentityErrors = { links: [] };
  const name = validateDisplayName(draft.displayName);
  const handle = validateHandle(draft.handle, own);
  const bio = validateBio(draft.bio);
  const pronouns = validatePronouns(draft.pronouns);
  if (!name.ok) errors.displayName = name.error;
  if (!handle.ok) errors.handle = handle.error;
  if (!bio.ok) errors.bio = bio.error;
  if (!pronouns.ok) errors.pronouns = pronouns.error;
  collectChoiceErrors(draft, errors);
  const links = validateLinkRows(draft.links, errors.links);

  if (!name.ok || !handle.ok || !bio.ok || !pronouns.ok) return { ok: false, value: null, errors };
  if (hasChoiceOrLinkErrors(errors)) return { ok: false, value: null, errors };
  return {
    ok: true,
    value: { displayName: name.value, handle: handle.value, bio: bio.value, pronouns: pronouns.value, track: draft.track, links, avatar: draft.avatar },
    errors,
  };
}

/**
 * The identity others would see if the draft were saved right now: each field that passes takes the draft's
 * value and each field that fails keeps the saved one. Drives the live preview card.
 */
export function resolveIdentity(saved: Identity, draft: Identity): Identity {
  const name = validateDisplayName(draft.displayName);
  const handle = validateHandle(draft.handle, saved.handle);
  const bio = validateBio(draft.bio);
  const pronouns = validatePronouns(draft.pronouns);
  const links = draft.links.flatMap((link) => {
    const result = validateLink(link);
    return result.ok ? [result.value] : [];
  });
  return {
    displayName: name.ok ? name.value : saved.displayName,
    handle: handle.ok ? handle.value : saved.handle,
    bio: bio.ok ? bio.value : saved.bio,
    pronouns: pronouns.ok ? pronouns.value : saved.pronouns,
    track: TRACKS.includes(draft.track) ? draft.track : saved.track,
    links: links.slice(0, HUB_RULES.maxLinks),
    avatar: isAvatar(draft.avatar) ? draft.avatar : saved.avatar,
  };
}

export function identityOf(profile: Profile): Identity {
  const { displayName, handle, bio, pronouns, track, links, avatar } = profile;
  return { displayName, handle, bio, pronouns, track, links, avatar };
}

export function sameIdentity(a: Identity, b: Identity): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ---------------------------------------------------------------------------------------------------------
// Stored data is untrusted (an import or an old version can leave anything behind), so read it defensively.

function str(value: unknown, fallback: string, max = 2000): string {
  return typeof value === "string" ? value.slice(0, max) : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeProfile(raw: unknown): Profile {
  if (!isRecord(raw)) return INITIAL_PROFILE;
  const vis = isRecord(raw.visibility) ? raw.visibility : {};
  const links: ProfileLink[] = Array.isArray(raw.links)
    ? raw.links.flatMap((item: unknown) => {
        if (!isRecord(item)) return [];
        const result = validateLink({ label: str(item.label, "", 100), url: str(item.url, "", 400) });
        return result.ok ? [result.value] : [];
      })
    : [];
  const track = TRACKS.find((t) => t === raw.track) ?? INITIAL_PROFILE.track;
  return {
    displayName: str(raw.displayName, INITIAL_PROFILE.displayName, 120),
    handle: str(raw.handle, INITIAL_PROFILE.handle, 60),
    bio: str(raw.bio, INITIAL_PROFILE.bio, 2000),
    pronouns: str(raw.pronouns, "", 100),
    track,
    links: links.slice(0, HUB_RULES.maxLinks),
    avatar: isAvatar(raw.avatar) ? raw.avatar : "initials",
    visibility: {
      projects: bool(vis.projects, true),
      journals: bool(vis.journals, true),
      achievements: bool(vis.achievements, true),
      stats: bool(vis.stats, true),
    },
    pinned: Array.isArray(raw.pinned) ? raw.pinned.filter((id: unknown): id is string => typeof id === "string").slice(0, HUB_RULES.maxPinned) : [],
  };
}

// ---------------------------------------------------------------------------------------------------------
// The public view

export function initialsOf(displayName: string): string {
  const words = tidy(displayName.replace(/[()]/g, " ")).split(" ").filter(Boolean);
  const letters = words.slice(0, 2).map((w) => Array.from(w)[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

export interface PublicSource {
  projects: readonly { id: string; name: string; track: TrackName; visibility: "public" | "private"; status: string }[];
  journalEntries: number;
  hoursLogged: number;
  approvedShips: number;
  reviewsDone: number;
  followers: number;
  following: number;
  earnedNames: readonly string[];
}

export interface PublicProfile {
  displayName: string;
  handle: string;
  pronouns: string | null;
  bio: string;
  track: TrackName;
  avatar: AvatarChoice;
  initials: string;
  links: ProfileLink[];
  /** null when the builder hides the section. */
  projects: { id: string; name: string; track: TrackName; status: string }[] | null;
  journals: { entries: number; hours: number } | null;
  achievements: string[] | null;
  stats: { approvedShips: number; reviewsDone: number; hoursLogged: number; followers: number; following: number } | null;
}

/**
 * Builds the public profile from public fields only. A private project is never listed, even if it was pinned
 * earlier, and nothing here reads evidence, Lapse recordings, orders, the Ore balance or notifications.
 */
export function buildPublicProfile(identity: Identity, visibility: Visibility, pinned: readonly string[], source: PublicSource): PublicProfile {
  const publicProjects = source.projects.filter((p) => p.visibility === "public");
  const pinnedProjects = pinned.flatMap((id) => publicProjects.filter((p) => p.id === id)).slice(0, HUB_RULES.maxPinned);
  const shown = pinnedProjects.length > 0 ? pinnedProjects : publicProjects.slice(0, HUB_RULES.maxPinned);
  return {
    displayName: identity.displayName,
    handle: identity.handle,
    pronouns: identity.pronouns ? identity.pronouns : null,
    bio: identity.bio,
    track: identity.track,
    avatar: identity.avatar,
    initials: initialsOf(identity.displayName),
    links: identity.links,
    projects: visibility.projects ? shown.map(({ id, name, track, status }) => ({ id, name, track, status })) : null,
    journals: visibility.journals ? { entries: source.journalEntries, hours: source.hoursLogged } : null,
    achievements: visibility.achievements ? [...source.earnedNames] : null,
    stats: visibility.stats
      ? { approvedShips: source.approvedShips, reviewsDone: source.reviewsDone, hoursLogged: source.hoursLogged, followers: source.followers, following: source.following }
      : null,
  };
}

/** Toggles a pinned id. Refuses a fourth pin and says why. */
export function togglePinned(pinned: readonly string[], id: string): { pinned: string[]; changed: boolean; reason?: string } {
  if (pinned.includes(id)) return { pinned: pinned.filter((p) => p !== id), changed: true };
  if (pinned.length >= HUB_RULES.maxPinned) return { pinned: [...pinned], changed: false, reason: `You can pin up to ${HUB_RULES.maxPinned} projects.` };
  return { pinned: [...pinned, id], changed: true };
}
