import { siteConfig } from "../../site-config";

// Same RSVP destination as the reference button, read from site config. When the join link is
// switched off, the buttons point at the tracks and say so instead of advertising an RSVP.
export const RSVP_URL = siteConfig.joinUrl ?? "#tracks";
export const RSVP_ENABLED = Boolean(siteConfig.joinUrl);
