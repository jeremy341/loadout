import { findItem } from "../../shell/nav-data";
import type { ConnectionId } from "./logic/account";

// Storage keys and fixed content for the Hub tabs (Overview, Profile, Achievements, Notifications, Account).
// Everything the pages store lives under "hub." through lib/preview-store.ts; the pure rules are in ./logic.

export { HUB_RULES, RESET_PHRASE } from "./logic/rules";

export const HUB_KEYS = {
  profile: "hub.profile",
  earned: "hub.earned",
  claims: "hub.claims",
  onboarding: "hub.onboarding",
  notifyPrefs: "hub.notify-prefs",
  verification: "hub.verification",
  connections: "hub.connections",
} as const;

/** The one-sentence purpose for a tab, straight from the navigation data so the page and the nav never disagree. */
export function navLead(slug: string): string {
  return findItem(slug)?.purpose ?? "";
}

export interface ConnectionInfo {
  id: ConnectionId;
  name: string;
  purpose: string;
  /** What LOADOUT would read. Draft: the real scopes need the service owner. */
  scopes: string[];
  consent: string;
  note: string;
}

export const CONNECTIONS: ConnectionInfo[] = [
  {
    id: "hackclub",
    name: "Hack Club identity",
    purpose: "Signs you in and confirms teen verification.",
    scopes: ["Your Hack Club account name and ID", "Your teen-verification status"],
    consent: "I agree that LOADOUT may read my Hack Club account name and verification status to let me join the program.",
    note: "Exact Hack Club sign-in and verification integration is not connected yet. The scopes shown are a draft to confirm with Hack Club.",
  },
  {
    id: "hackatime",
    name: "Hackatime",
    purpose: "Tracks your development time on software projects. Required for software projects.",
    scopes: ["Your tracked coding time for the projects you link (read only)"],
    consent: "I agree that LOADOUT may read my Hackatime tracked time for the projects I link.",
    note: "Draft scope. Hours in the Build tabs are sample numbers; nothing is read from Hackatime.",
  },
  {
    id: "lapse",
    name: "Lapse",
    purpose: "Records Hardware build time. Required for Hardware projects.",
    scopes: ["Your recordings and recorded time for the Hardware projects you link"],
    consent: "I agree that LOADOUT may read my Lapse recordings for the Hardware projects I link. Only reviewers can watch them.",
    note: "Lapse recordings are visible only to reviewers (Plan 01). Nothing is read from Lapse in the preview.",
  },
  {
    id: "slack",
    name: "Slack",
    purpose: "Optional. Lets the program reach you in its Slack.",
    scopes: ["Your Slack member ID, so a message can be sent to you"],
    consent: "I agree that LOADOUT may use my Slack member ID to message me about the program.",
    note: "Slack messages are not built. Connecting here only records the choice in this browser.",
  },
];
