import type { ReactNode } from "react";
import { STAFF_PROJECTS } from "@/lib/reviewer/people";
import type { Track } from "@/lib/platform/progress";
import { Badge as KitBadge, StatusBadge as KitStatusBadge, type Tone as KitTone } from "@/reviewer-dash/app/_ui/ui";

// Project badges shared by the review, project and player pages.

type Tone = "gray" | "green" | "amber" | "rose" | "blue" | "violet";

const TONE: Record<Tone, KitTone> = {
  gray: "neutral",
  green: "success",
  amber: "warning",
  rose: "danger",
  blue: "info",
  violet: "purple",
};

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return <KitBadge tone={TONE[tone]}>{children}</KitBadge>;
}

export const StatusBadge = KitStatusBadge;

// LOADOUT has one track per project (Tools, Systems, Compute, Hardware), not Pixl's tiers. The chip reads the project's track from the
// staff project list by its number. `level` is kept in the signature so the pages that still pass it keep compiling; it is not shown.
export function trackOfProject(projectId: number): Track | null {
  return STAFF_PROJECTS.find((p) => p.number === projectId)?.track ?? null;
}

export function TrackBadge({ projectId, track }: { projectId?: number; track?: Track | null }) {
  const name = track ?? (projectId === undefined ? null : trackOfProject(projectId));
  return name ? <KitBadge tone="info">{name}</KitBadge> : null;
}

export function LevelBadge({ projectId }: { level?: number; projectId?: number }) {
  return projectId === undefined ? null : <TrackBadge projectId={projectId} />;
}

const TYPE_LABELS: Record<string, string> = {
  web: "Web playable",
  windows: "Windows",
  mac: "Mac",
  linux: "Linux",
  cross_platform: "Cross-platform",
  python: "Python",
  android: "Android",
  ios: "iOS",
  hardware: "Hardware",
  cad: "CAD models",
  other: "Other / not sure",
};

// The kind of thing the maker shipped, so a reviewer knows how to run/judge it.
export function TypeBadge({ type }: { type?: string | null }) {
  if (!type) return null;
  return <KitBadge>{TYPE_LABELS[type] ?? type}</KitBadge>;
}

// Reviewer-nominated Flagship award mark (Pixl's Beacon). Cosmetic only, see toggleProjectPeak.
export function BeaconBadge() {
  return (
    <KitBadge tone="yellow" icon="rep">
      Flagship
    </KitBadge>
  );
}

// Hardware-only funding ask, set by the player via needs_funding. See the
// funding panel in review/[id]/page.tsx for the BOM / cart screenshot detail.
export function FundingBadge({ needsFunding, fundingUsd }: { needsFunding: boolean; fundingUsd?: number | null }) {
  if (!needsFunding) return null;
  return (
    <KitBadge tone="success">Funding: {fundingUsd ? `$${Number(fundingUsd).toFixed(2)}` : "requested"}</KitBadge>
  );
}

export function ShipBadges({ project }: { project: { is_update: boolean; used_ai: boolean; other_ysws: boolean } }) {
  return (
    <>
      {project.is_update && <KitBadge tone="info">Update</KitBadge>}
      {project.used_ai && <KitBadge tone="purple">AI used</KitBadge>}
      {project.other_ysws && <KitBadge tone="warning">Other YSWS disclosed</KitBadge>}
    </>
  );
}
