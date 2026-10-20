import type { ComponentType } from "react";
import { buildPages } from "./build";
import { communityAPages } from "./community-a";
import { communityBPages } from "./community-b";
import { gearPages } from "./gear";
import { hubPages } from "./hub";

/** Every platform section's page, keyed by nav slug. registry.test.ts fails if a routed slug has no page. */
export const PAGES: Record<string, ComponentType> = {
  ...buildPages,
  ...communityAPages,
  ...communityBPages,
  ...gearPages,
  ...hubPages,
};
