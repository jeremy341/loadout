"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useNotifications } from "../../../lib/notifications";
import { usePreviewState } from "../../../lib/preview-store";
import { useBuildSummary } from "../build/summary";
import { useCommunityASummary } from "../community-a/summary";
import { useCommunityBSummary } from "../community-b/summary";
import { useGearSummary } from "../gear/summary";
import { recordEarned } from "./actions";
import { HUB_KEYS } from "./data";
import { INITIAL_CONNECTIONS, INITIAL_VERIFICATION, normalizeConnections, normalizeVerification } from "./logic/account";
import {
  NO_EARNED,
  buildFacts,
  earnedNames,
  evaluate,
  newlyMet,
  normalizeEarned,
  type AchievementFacts,
  type AchievementRow,
} from "./logic/achievements";
import { NO_CLAIMS, isApproved, normalizeClaims } from "./logic/claims";
import { DEFAULT_PREFS, normalizePrefs, unreadCount } from "./logic/inbox";
import {
  INITIAL_PROFILE,
  normalizeProfile,
  type Identity,
  type Profile,
  type Visibility,
} from "./logic/profile";
import { INITIAL_ONBOARDING, normalizeOnboarding } from "./logic/overview";

// Hooks for the Hub's saved state. Stored data is untrusted (an import or an older version can leave anything), so
// every hook normalises what it reads. Writes go through the shared preview store.

export function useProfile() {
  const [raw, setRaw, hydrated] = usePreviewState<unknown>(HUB_KEYS.profile, INITIAL_PROFILE);
  const profile = useMemo(() => normalizeProfile(raw), [raw]);
  const update = useCallback((patch: (current: Profile) => Profile) => setRaw((prev: unknown) => patch(normalizeProfile(prev))), [setRaw]);
  return {
    profile,
    hydrated,
    saveIdentity: (identity: Identity) => update((p) => ({ ...p, ...identity })),
    setVisibility: (key: keyof Visibility, value: boolean) => update((p) => ({ ...p, visibility: { ...p.visibility, [key]: value } })),
    setPinned: (pinned: string[]) => update((p) => ({ ...p, pinned })),
  };
}

export function useClaims() {
  const [raw] = usePreviewState<unknown>(HUB_KEYS.claims, NO_CLAIMS);
  return useMemo(() => normalizeClaims(raw), [raw]);
}

export function useNotifyPrefs() {
  const [raw, setRaw] = usePreviewState<unknown>(HUB_KEYS.notifyPrefs, DEFAULT_PREFS);
  const prefs = useMemo(() => normalizePrefs(raw), [raw]);
  const update = useCallback((patch: (current: typeof DEFAULT_PREFS) => typeof DEFAULT_PREFS) => setRaw((prev: unknown) => patch(normalizePrefs(prev))), [setRaw]);
  return { prefs, update };
}

export function useOnboarding() {
  const [raw, setRaw] = usePreviewState<unknown>(HUB_KEYS.onboarding, INITIAL_ONBOARDING);
  const state = useMemo(() => normalizeOnboarding(raw), [raw]);
  return { dismissed: state.dismissed, setDismissed: (dismissed: boolean) => setRaw({ dismissed }) };
}

export function useVerification() {
  const [raw, setRaw] = usePreviewState<unknown>(HUB_KEYS.verification, INITIAL_VERIFICATION);
  const state = useMemo(() => normalizeVerification(raw), [raw]);
  return { state, set: setRaw };
}

export function useConnections() {
  const [raw, setRaw] = usePreviewState<unknown>(HUB_KEYS.connections, INITIAL_CONNECTIONS);
  const state = useMemo(() => normalizeConnections(raw), [raw]);
  return { state, set: setRaw };
}

/** The unread count the inbox shows: kinds turned off in Settings are not counted. */
export function useUnread() {
  const { items } = useNotifications();
  const { prefs } = useNotifyPrefs();
  return unreadCount(items, prefs);
}

export interface HubData {
  hydrated: boolean;
  build: ReturnType<typeof useBuildSummary>;
  community: ReturnType<typeof useCommunityASummary>;
  seasons: ReturnType<typeof useCommunityBSummary>;
  gear: ReturnType<typeof useGearSummary>;
  facts: AchievementFacts;
  rows: AchievementRow[];
  earnedCount: number;
  earnedNames: string[];
}

/**
 * Everything the Hub reads from the other tabs, through their summary hooks, plus the achievement catalog evaluated
 * against it. When a criterion becomes met it is written to `hub.earned` once (so it never un-earns) and one
 * notification is raised. Mount it from one page at a time.
 */
export function useHub(): HubData {
  const build = useBuildSummary();
  const community = useCommunityASummary();
  const seasons = useCommunityBSummary();
  const gear = useGearSummary();
  const claims = useClaims();
  const [rawEarned, , hydrated] = usePreviewState<unknown>(HUB_KEYS.earned, NO_EARNED);
  const earned = useMemo(() => normalizeEarned(rawEarned), [rawEarned]);

  const facts = useMemo(
    () => buildFacts({ build, community, seasons, gear, contributorApproved: isApproved(claims) }),
    [build, community, seasons, gear, claims],
  );
  const rows = useMemo(() => evaluate(facts, earned), [facts, earned]);
  const pending = newlyMet(rows).join(",");

  useEffect(() => {
    if (!hydrated || !pending) return;
    recordEarned(pending.split(","));
  }, [hydrated, pending]);

  return {
    hydrated,
    build,
    community,
    seasons,
    gear,
    facts,
    rows,
    earnedCount: rows.filter((r) => r.earned).length,
    earnedNames: earnedNames(rows),
  };
}
