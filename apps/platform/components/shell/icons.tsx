import type { JSX } from "react";

// Whole-pixel <rect>s on a 16x16 grid: one currentColor fill, no strokes, no
// gradients, no anti-aliasing, so each icon stays crisp at the 16px and 20px
// display sizes. Each entry is [x, y, width, height].
type Rect = readonly [x: number, y: number, w: number, h: number];

// Adapted from Pixl's participant shell icons (references/pixl/apps/web-shell, MIT, Copyright (c) 2026 Pixl). Notice kept in docs/source-audit/ATTRIBUTION.md.
const PIXL_ICONS: Record<string, ReadonlyArray<Rect>> = {
  overview: [[7, 1, 2, 2], [5, 3, 6, 2], [3, 5, 10, 2], [3, 7, 3, 7], [10, 7, 3, 7], [6, 7, 4, 2]],
  projects: [[2, 3, 12, 2], [2, 5, 2, 8], [12, 5, 2, 8], [2, 11, 12, 2]],
  shop: [[5, 1, 6, 2], [5, 3, 2, 2], [9, 3, 2, 2], [3, 5, 10, 9]],
  orders: [[3, 2, 10, 2], [3, 12, 10, 2], [3, 2, 2, 12], [11, 2, 2, 12], [6, 6, 4, 2], [6, 9, 4, 2]],
  referrals: [[3, 3, 4, 4], [1, 8, 8, 6], [9, 4, 6, 2], [11, 2, 2, 6]],
  collectibles: [[4, 3, 8, 2], [2, 5, 12, 2], [4, 7, 8, 2], [6, 9, 4, 2], [7, 11, 2, 2]],
  explore: [[5, 2, 6, 2], [3, 4, 2, 2], [11, 4, 2, 2], [2, 6, 2, 4], [12, 6, 2, 4], [3, 10, 2, 2], [11, 10, 2, 2], [5, 12, 6, 2], [7, 7, 2, 2]],
  ideas: [[5, 1, 6, 1], [4, 2, 8, 6], [5, 8, 6, 1], [6, 10, 4, 2], [6, 13, 4, 2]],
  wishlist: [[3, 2, 10, 2], [3, 12, 10, 2], [3, 4, 2, 8], [11, 4, 2, 8], [7, 5, 2, 6], [6, 7, 4, 2]],
  "ore-calculator": [[3, 1, 10, 2], [3, 13, 10, 2], [3, 1, 2, 14], [11, 1, 2, 14], [5, 3, 6, 3], [5, 8, 2, 2], [9, 8, 2, 2], [5, 11, 2, 2], [9, 11, 2, 2]],
  account: [[5, 2, 6, 5], [3, 9, 10, 5]],
  more: [[2, 2, 3, 3], [7, 2, 3, 3], [12, 2, 2, 3], [2, 7, 3, 3], [7, 7, 3, 3], [12, 7, 2, 3], [2, 12, 3, 2], [7, 12, 3, 2], [12, 12, 2, 2]],
  theme: [[4, 2, 8, 2], [2, 4, 2, 7], [12, 4, 2, 6], [4, 11, 7, 2], [10, 10, 2, 2], [5, 5, 2, 2], [9, 5, 2, 2], [5, 8, 2, 2]],
};

// Original LOADOUT icons drawn in the same visual language (chunky 2px strokes, solid
// silhouettes on the 16x16 grid). Holes are real gaps between rects, not painted detail.
const LOADOUT_ICONS: Record<string, ReadonlyArray<Rect>> = {
  // notebook with spine, ring tabs and page lines
  journals: [[3, 1, 11, 2], [1, 3, 5, 2], [3, 5, 3, 2], [7, 5, 4, 2], [1, 7, 5, 2], [3, 9, 3, 2], [7, 9, 4, 2], [12, 3, 2, 10], [1, 11, 5, 2], [3, 13, 11, 2]],
  // speech bubble with a check mark
  reviews: [[1, 2, 14, 2], [1, 4, 9, 1], [12, 4, 3, 1], [1, 5, 8, 1], [11, 5, 4, 1], [1, 6, 3, 1], [6, 6, 2, 1], [10, 6, 5, 1], [1, 7, 4, 1], [9, 7, 6, 1], [1, 8, 5, 1], [8, 8, 7, 1], [1, 9, 14, 3], [3, 12, 4, 1], [3, 13, 2, 1]],
  // pennant flag on a pole, climbing a step
  missions: [[3, 1, 2, 1], [3, 2, 11, 2], [3, 4, 9, 2], [3, 6, 7, 2], [3, 8, 5, 1], [3, 9, 2, 4], [9, 11, 6, 2], [1, 13, 14, 2]],
  // open book
  docs: [[2, 2, 5, 1], [9, 2, 5, 1], [1, 3, 6, 2], [9, 3, 6, 2], [1, 5, 2, 1], [6, 5, 1, 1], [9, 5, 1, 1], [13, 5, 2, 1], [1, 6, 6, 2], [9, 6, 6, 2], [1, 8, 2, 1], [6, 8, 1, 1], [9, 8, 1, 1], [13, 8, 2, 1], [1, 9, 6, 2], [9, 9, 6, 2], [1, 11, 14, 1], [2, 12, 12, 1]],
  // framed picture on an easel ledge
  "show-and-tell": [[2, 1, 12, 2], [9, 3, 2, 2], [6, 5, 2, 1], [2, 3, 2, 4], [12, 3, 2, 4], [5, 6, 4, 1], [2, 7, 12, 3], [1, 11, 14, 2], [3, 13, 2, 2], [11, 13, 2, 2]],
  // podium with a star
  leaderboards: [[7, 1, 2, 1], [5, 2, 6, 1], [6, 3, 4, 1], [5, 4, 2, 1], [9, 4, 2, 1], [6, 6, 4, 9], [1, 9, 4, 6], [11, 11, 4, 4]],
  // sun rising over the horizon
  seasons: [[7, 1, 2, 2], [3, 3, 2, 2], [11, 3, 2, 2], [6, 5, 4, 1], [4, 6, 8, 1], [0, 7, 2, 2], [14, 7, 2, 2], [3, 7, 10, 3], [1, 11, 14, 2], [4, 14, 8, 1]],
  // calendar with date cells
  events: [[4, 1, 2, 2], [10, 1, 2, 2], [1, 3, 14, 3], [4, 7, 2, 2], [7, 7, 2, 2], [10, 7, 2, 2], [4, 10, 2, 2], [7, 10, 2, 2], [10, 10, 2, 2], [1, 6, 2, 7], [13, 6, 2, 7], [1, 13, 14, 2]],
  // two people side by side
  friends: [[3, 3, 2, 1], [11, 3, 2, 1], [2, 4, 4, 2], [10, 4, 4, 2], [3, 6, 2, 1], [11, 6, 2, 1], [2, 8, 4, 1], [10, 8, 4, 1], [1, 9, 6, 5], [9, 9, 6, 5]],
  // ID badge with a head and text lines
  profile: [[6, 1, 4, 1], [6, 2, 1, 1], [9, 2, 1, 1], [1, 3, 14, 2], [13, 5, 2, 1], [10, 6, 5, 2], [5, 6, 3, 3], [13, 8, 2, 1], [10, 9, 5, 2], [4, 9, 5, 3], [1, 5, 2, 8], [13, 11, 2, 2], [1, 13, 14, 2]],
  // trophy cup
  achievements: [[4, 2, 8, 1], [1, 3, 14, 1], [1, 4, 2, 2], [4, 4, 3, 2], [9, 4, 3, 2], [13, 4, 2, 2], [2, 6, 12, 1], [5, 7, 6, 1], [6, 8, 4, 1], [7, 9, 2, 2], [5, 11, 6, 1], [4, 12, 8, 2]],
  // bell
  notifications: [[7, 1, 2, 2], [6, 3, 4, 1], [5, 4, 6, 1], [4, 5, 8, 4], [3, 9, 10, 1], [2, 10, 12, 2], [6, 13, 4, 2]],
  // arrow leaving a box
  external: [[9, 1, 6, 2], [11, 3, 4, 1], [1, 3, 6, 2], [10, 4, 2, 1], [9, 5, 2, 1], [13, 4, 2, 3], [8, 6, 2, 1], [7, 7, 2, 1], [6, 8, 2, 1], [1, 5, 2, 8], [12, 9, 2, 4], [1, 13, 12, 2]],
  // faceted gem (the Ore currency)
  ore: [[4, 1, 8, 1], [2, 2, 4, 1], [10, 2, 4, 1], [7, 2, 2, 2], [1, 3, 5, 1], [10, 3, 5, 1], [1, 4, 14, 1], [2, 5, 3, 1], [6, 5, 4, 1], [11, 5, 3, 1], [3, 6, 3, 1], [7, 6, 2, 1], [10, 6, 3, 1], [4, 7, 8, 1], [5, 8, 6, 1], [6, 9, 4, 1], [7, 10, 2, 1]],
  // person inside a circle
  accessibility: [[5, 1, 6, 1], [3, 2, 10, 1], [2, 3, 3, 1], [11, 3, 3, 1], [7, 4, 2, 2], [4, 7, 8, 2], [6, 9, 4, 1], [1, 4, 2, 8], [13, 4, 2, 8], [5, 10, 2, 2], [9, 10, 2, 2], [2, 12, 3, 1], [11, 12, 3, 1], [3, 13, 10, 1], [5, 14, 6, 1]],
};

export const ICON_RECTS: Record<string, ReadonlyArray<Rect>> = { ...PIXL_ICONS, ...LOADOUT_ICONS };

export const ICON_NAMES: string[] = Object.keys(ICON_RECTS);

// Neutral outlined square, shown for a name that has no artwork.
const FALLBACK_RECTS: ReadonlyArray<Rect> = [
  [4, 4, 8, 2],
  [4, 10, 8, 2],
  [4, 6, 2, 4],
  [10, 6, 2, 4],
];

export function PixelIcon({ name, className }: { name: string; className?: string }): JSX.Element {
  const rects = Object.hasOwn(ICON_RECTS, name) ? ICON_RECTS[name] : FALLBACK_RECTS;
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
      className={className}
    >
      {rects.map(([x, y, w, h]) => (
        <rect key={`${x}-${y}-${w}-${h}`} x={x} y={y} width={w} height={h} />
      ))}
    </svg>
  );
}
