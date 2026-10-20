"use client";

// Stored preview state for Leaderboards, Seasons and Events. All keys start with `commb.` and live in this
// browser only (lib/preview-store.ts). Values read back from storage are validated, because a person can edit
// localStorage and a stale shape from an older build must not crash a page.

import { useCallback, useMemo } from "react";
import { setPreview, uid, usePreviewState } from "../../../lib/preview-store";
import { ME } from "../../../lib/sample/builders";
import { PREVIEW_ANCHOR_ISO } from "./data";
import { MS_DAY, parseMs } from "./logic/dates";
import { NO_RSVP, type RsvpRecord } from "./logic/events";
import type { IssuedCertificate } from "./logic/certificate";
import { MAX_HOURS, MAX_QTY, type ActionType, type Contribution } from "./logic/quests";
import { TRACKS } from "./logic/standings";

export const KEYS = {
  clock: "commb.clock",
  activity: "commb.activity",
  privacy: "commb.privacy",
  quests: "commb.quests",
  events: "commb.events",
  certs: "commb.certs",
  certName: "commb.certName",
} as const;

// ---- Preview clock -------------------------------------------------------------------------------------

export interface ClockState {
  nowIso: string;
}
export const INITIAL_CLOCK: ClockState = { nowIso: PREVIEW_ANCHOR_ISO };

/** The Preview "now". Moves only when the Preview tools say so, never with the real clock. */
export function usePreviewClock() {
  const [clock, setClock, hydrated] = usePreviewState<ClockState>(KEYS.clock, INITIAL_CLOCK);
  const parsed = typeof clock?.nowIso === "string" ? parseMs(clock.nowIso) : NaN;
  const nowMs = Number.isNaN(parsed) ? parseMs(PREVIEW_ANCHOR_ISO) : parsed;
  const advanceDays = useCallback(
    (days: number) => setClock((prev) => {
      const base = typeof prev?.nowIso === "string" ? parseMs(prev.nowIso) : NaN;
      const from = Number.isNaN(base) ? parseMs(PREVIEW_ANCHOR_ISO) : base;
      return { nowIso: new Date(from + days * MS_DAY).toISOString() };
    }),
    [setClock],
  );
  const resetClock = useCallback(() => setClock(INITIAL_CLOCK), [setClock]);
  return { nowMs, nowIso: new Date(nowMs).toISOString(), advanceDays, resetClock, hydrated };
}

// ---- Contribution log ----------------------------------------------------------------------------------

export const INITIAL_ACTIVITY: Contribution[] = [];

const ACTIONS: readonly ActionType[] = ["ship", "review", "journal"];

const MAX_STORED_NOTE = 140;

function isValidQty(qty: unknown): qty is number {
  return typeof qty === "number" && Number.isInteger(qty) && qty >= 1 && qty <= MAX_QTY;
}

function isValidAt(at: unknown): at is string {
  return typeof at === "string" && !Number.isNaN(parseMs(at));
}

/** Whether a stored value has every field a Contribution needs (hours and note are optional and cleaned later). */
function isStoredContribution(c: Partial<Contribution>): c is Contribution {
  return (
    typeof c.id === "string" &&
    ACTIONS.includes(c.type as ActionType) &&
    isValidQty(c.qty) &&
    isValidAt(c.at) &&
    TRACKS.includes(c.track as (typeof TRACKS)[number])
  );
}

function cleanHours(hours: unknown): number | undefined {
  return typeof hours === "number" && hours > 0 && hours <= MAX_HOURS ? hours : undefined;
}

function cleanContribution(c: Contribution): Contribution {
  return {
    id: c.id,
    type: c.type,
    qty: c.qty,
    hours: c.type === "journal" ? cleanHours(c.hours) : undefined,
    track: c.track,
    at: c.at,
    note: typeof c.note === "string" ? c.note.slice(0, MAX_STORED_NOTE) : undefined,
  };
}

function sanitizeContributions(raw: unknown): Contribution[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Partial<Contribution> => !!item && typeof item === "object")
    .filter(isStoredContribution)
    .map(cleanContribution);
}

export function useContributions() {
  const [raw, setRaw] = usePreviewState<Contribution[]>(KEYS.activity, INITIAL_ACTIVITY);
  const items = useMemo(() => sanitizeContributions(raw), [raw]);
  const add = useCallback(
    (entry: Omit<Contribution, "id">): Contribution => {
      const created: Contribution = { ...entry, id: uid("c") };
      setRaw((prev) => [...sanitizeContributions(prev), created]);
      return created;
    },
    [setRaw],
  );
  const remove = useCallback((id: string) => setRaw((prev) => sanitizeContributions(prev).filter((c) => c.id !== id)), [setRaw]);
  return { items, add, remove };
}

// ---- Privacy -------------------------------------------------------------------------------------------

export interface PrivacyState {
  hideFromBoards: boolean;
}
export const INITIAL_PRIVACY: PrivacyState = { hideFromBoards: false };

export function usePrivacy() {
  const [privacy, setPrivacy] = usePreviewState<PrivacyState>(KEYS.privacy, INITIAL_PRIVACY);
  const hideFromBoards = privacy?.hideFromBoards === true;
  const setHide = useCallback((hide: boolean) => setPrivacy({ hideFromBoards: hide }), [setPrivacy]);
  return { hideFromBoards, setHide };
}

// ---- Quest completions ---------------------------------------------------------------------------------

export const INITIAL_QUESTS: Record<string, string> = {};

export function useQuestCompletions() {
  const [raw, setRaw] = usePreviewState<Record<string, string>>(KEYS.quests, INITIAL_QUESTS);
  const done = useMemo(() => {
    const out: Record<string, string> = {};
    if (raw && typeof raw === "object") {
      for (const [key, value] of Object.entries(raw)) if (typeof value === "string") out[key] = value;
    }
    return out;
  }, [raw]);
  const record = useCallback(
    (keys: string[], atIso: string) =>
      setRaw((prev) => {
        const next = { ...(prev && typeof prev === "object" ? prev : {}) };
        for (const key of keys) if (!next[key]) next[key] = atIso;
        return next;
      }),
    [setRaw],
  );
  return { done, record };
}

// ---- Events --------------------------------------------------------------------------------------------

export interface EventsState {
  rsvps: Record<string, RsvpRecord>;
  /** Sample attendees who cancelled, per event (Preview tools). */
  drops: Record<string, number>;
  /** Event id to the Preview time attendance was recorded. */
  attended: Record<string, string>;
  /** "Get notified" toggle for LOADOUT IRL. Stored here only; nothing is sent. */
  irlNotify: boolean;
}
export const INITIAL_EVENTS: EventsState = { rsvps: {}, drops: {}, attended: {}, irlNotify: false };

export function useEventsState() {
  const [raw, setRaw] = usePreviewState<EventsState>(KEYS.events, INITIAL_EVENTS);
  const state = useMemo<EventsState>(() => {
    const rsvps: Record<string, RsvpRecord> = {};
    const drops: Record<string, number> = {};
    const attended: Record<string, string> = {};
    if (raw && typeof raw === "object") {
      for (const [id, rec] of Object.entries(raw.rsvps ?? {})) {
        if (rec && typeof rec === "object" && rec.wants === true) rsvps[id] = { wants: true, held: rec.held === true };
      }
      for (const [id, n] of Object.entries(raw.drops ?? {})) if (typeof n === "number" && n >= 0) drops[id] = Math.floor(n);
      for (const [id, at] of Object.entries(raw.attended ?? {})) if (typeof at === "string") attended[id] = at;
    }
    return { rsvps, drops, attended, irlNotify: raw?.irlNotify === true };
  }, [raw]);

  const update = useCallback(
    (fn: (prev: EventsState) => EventsState) =>
      setRaw((prev) => fn({ ...INITIAL_EVENTS, ...(prev && typeof prev === "object" ? prev : {}) } as EventsState)),
    [setRaw],
  );
  const rsvpOf = useCallback((id: string): RsvpRecord => state.rsvps[id] ?? NO_RSVP, [state]);
  return { state, update, rsvpOf };
}

// ---- Certificates --------------------------------------------------------------------------------------

export const INITIAL_CERTS: IssuedCertificate[] = [];

function sanitizeCerts(raw: unknown): IssuedCertificate[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (c): c is IssuedCertificate =>
      !!c &&
      typeof c === "object" &&
      typeof (c as IssuedCertificate).code === "string" &&
      typeof (c as IssuedCertificate).eventId === "string" &&
      typeof (c as IssuedCertificate).eventTitle === "string" &&
      typeof (c as IssuedCertificate).builderName === "string" &&
      typeof (c as IssuedCertificate).handle === "string" &&
      typeof (c as IssuedCertificate).issuedAt === "string",
  );
}

export function useCertificates() {
  const [raw, setRaw] = usePreviewState<IssuedCertificate[]>(KEYS.certs, INITIAL_CERTS);
  const items = useMemo(() => sanitizeCerts(raw), [raw]);
  const set = useCallback((fn: (prev: IssuedCertificate[]) => IssuedCertificate[]) => setRaw((prev) => fn(sanitizeCerts(prev))), [setRaw]);
  return { items, set };
}

export const INITIAL_CERT_NAME: string = ME.name;

export function useCertificateName() {
  const [raw, setRaw] = usePreviewState<string>(KEYS.certName, INITIAL_CERT_NAME);
  const name = typeof raw === "string" && raw.trim() ? raw : INITIAL_CERT_NAME;
  return { name, setName: setRaw };
}

// ---- Reset ---------------------------------------------------------------------------------------------

/** Puts every Leaderboards, Seasons and Events key back to its starting value. */
export function resetCommunityB() {
  setPreview(KEYS.clock, INITIAL_CLOCK);
  setPreview(KEYS.activity, INITIAL_ACTIVITY);
  setPreview(KEYS.privacy, INITIAL_PRIVACY);
  setPreview(KEYS.quests, INITIAL_QUESTS);
  setPreview(KEYS.events, INITIAL_EVENTS);
  setPreview(KEYS.certs, INITIAL_CERTS);
  setPreview(KEYS.certName, INITIAL_CERT_NAME);
}
