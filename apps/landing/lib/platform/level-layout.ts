// Pure layout rules for the track page level strip. The coupon captions sit in a wrapping grid of equal tracks
// (platform.css: .pf-strip-rewards, repeat(auto-fit, minmax(150px, 1fr)) with a 16px gap), not under the cell they belong to.
// These helpers state that grid in numbers so a test can prove no two captions overlap at any width.
//
// API:
//   REWARD_MIN_ITEM, REWARD_GAP        the two numbers the CSS uses
//   rewardTrackCount(width)            -> how many captions fit in one row of the grid (at least 1)
//   captionBoxes(count, width)         -> { x, width, row }[] for each caption, in order
//   boxesOverlap(a, b)                 -> true when two boxes on the same row share any horizontal space
//   levelRows(viewportWidth)           -> 1 for 720px and wider, 2 below (cells per row 20 or 10)

export const REWARD_MIN_ITEM = 150;
export const REWARD_GAP = 16;
export const LEVEL_ROWS_BREAKPOINT = 720;

export type CaptionBox = { x: number; width: number; row: number };

export function rewardTrackCount(width: number, minItem = REWARD_MIN_ITEM, gap = REWARD_GAP): number {
  return Math.max(1, Math.floor((width + gap) / (minItem + gap)));
}

// auto-fit collapses empty tracks, so with fewer items than tracks the items share the whole width.
export function captionBoxes(count: number, width: number, minItem = REWARD_MIN_ITEM, gap = REWARD_GAP): CaptionBox[] {
  const columns = Math.min(Math.max(1, count), rewardTrackCount(width, minItem, gap));
  const itemWidth = (width - (columns - 1) * gap) / columns;
  return Array.from({ length: count }, (_, index) => ({
    x: (index % columns) * (itemWidth + gap),
    width: itemWidth,
    row: Math.floor(index / columns),
  }));
}

export function boxesOverlap(a: CaptionBox, b: CaptionBox): boolean {
  return a.row === b.row && a.x < b.x + b.width - 0.001 && b.x < a.x + a.width - 0.001;
}

export function levelRows(viewportWidth: number): 1 | 2 {
  return viewportWidth >= LEVEL_ROWS_BREAKPOINT ? 1 : 2;
}
