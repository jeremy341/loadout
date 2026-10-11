import { siteConfig } from "../../site-config";

// Same RSVP destination as the reference button, read from site config.
export const RSVP_URL = siteConfig.joinUrl ?? "#tracks";
