import { heroCopy } from "./site-content";

export const DEFAULT_RSVP_URL = "https://rsvp.soon.it/loadout";

type PublicSiteInputs = {
  siteUrl?: string;
  joinUrl?: string;
  loginUrl?: string;
  communityUrl?: string;
  showIrlConcept?: boolean;
  allowIndexing?: boolean;
};

function httpsUrl(value?: string) {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function createSiteConfig(inputs: PublicSiteInputs = {}) {
  const siteUrl = httpsUrl(inputs.siteUrl);
  return {
    name: "LOADOUT",
    title: `LOADOUT — ${heroCopy.tagline}`,
    description: "Build your own technical stack. Explore LOADOUT, a technical builder program for tools, systems, compute, and hardware.",
    origin: siteUrl ? new URL(siteUrl).origin : undefined,
    joinUrl: inputs.joinUrl === undefined ? DEFAULT_RSVP_URL : httpsUrl(inputs.joinUrl),
    loginUrl: httpsUrl(inputs.loginUrl),
    communityUrl: httpsUrl(inputs.communityUrl),
    showIrlConcept: inputs.showIrlConcept ?? true,
    githubUrl: "https://github.com/jeremy341/loadout",
    allowIndexing: Boolean(siteUrl && inputs.allowIndexing),
  };
}

export const siteConfig = createSiteConfig({
  siteUrl: process.env.NEXT_PUBLIC_LOADOUT_SITE_URL,
  joinUrl: process.env.NEXT_PUBLIC_LOADOUT_JOIN_URL,
  loginUrl: process.env.NEXT_PUBLIC_LOADOUT_LOGIN_URL,
  communityUrl: process.env.NEXT_PUBLIC_LOADOUT_COMMUNITY_URL,
  showIrlConcept: process.env.NEXT_PUBLIC_LOADOUT_IRL_CONCEPT === undefined
    ? undefined
    : process.env.NEXT_PUBLIC_LOADOUT_IRL_CONCEPT === "true",
  allowIndexing: process.env.LOADOUT_ALLOW_INDEXING === "true" && process.env.VERCEL_ENV !== "preview",
});
