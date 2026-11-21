// The tag model of a project card (profile grid and own project grid). One tag per fact, no repeats:
//   track tag    the track, only when the project has one
//   status tag   the stage, only when the project is not approved (approved shows through the hours line)
//   foot         one line, "N H approved, N H pending" (visitor safe: hours only, never Ore)
//   href         the owner opens the workspace page, anyone else opens the public page
// Pure rules, no database. Tests are in project-card.test.ts.
import { normalizeStatus } from "./profile";
import { profileProjectHref } from "./profile-view";
import type { Hours } from "./progress";
import { projectStatusLabel } from "./projects";

export type ProjectCardModel = {
  href: string;
  tags: string[];
  foot: string;
};

const hoursText = (hours: number): string => `${Math.round(hours * 100) / 100}`;

export function cardFoot(hours: Hours): string {
  return `${hoursText(hours.approved)} H approved, ${hoursText(hours.pending)} H pending`;
}

export function projectCardModel(input: { id: string; track: string | null; status: string; hours: Hours; own: boolean }): ProjectCardModel {
  const status = normalizeStatus(input.status);
  const tags: string[] = [];
  if (input.track) tags.push(input.track);
  if (status !== "approved") tags.push(projectStatusLabel(status));
  // A status word that is the same as the track would be a repeat; it cannot happen with the real names, but the rule is cheap.
  const unique = tags.filter((tag, index) => tags.findIndex((other) => other.toLowerCase() === tag.toLowerCase()) === index);
  return { href: profileProjectHref(input.own, input.id), tags: unique, foot: cardFoot(input.hours) };
}
