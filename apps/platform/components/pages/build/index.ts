import type { ComponentType } from "react";
import { JournalsPage } from "./journals-page";
import { MissionsPage } from "./missions-page";
import { ProjectsPage } from "./projects-page";
import { ReviewsPage } from "./reviews-page";

// Slug -> page component for the Build group. Overview is built by the hub group, and Docs is an external link.
export const buildPages: Record<string, ComponentType> = {
  projects: ProjectsPage,
  journals: JournalsPage,
  reviews: ReviewsPage,
  missions: MissionsPage,
};
