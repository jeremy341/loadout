import type { CSSProperties } from "react";
import type { GlyphName } from "@hackclub/icons";

// A few glyphs in @hackclub/icons aren't drawn in the middle of their 32x32
// box. It doesn't show at 16px, but it does once the icon sits inside a circle
// (EmptyState). These shifts move the drawn shape's center back onto the box's
// center; the numbers come from each path's bounding box.
const NUDGE: Partial<Record<GlyphName, string>> = {
  // Drawn across x 10.4-28.6, y 6.7-20.6: center (19.5, 13.6), not (16, 16).
  checkmark: "translate(-11%, 7.5%)",
};

export function glyphStyle(glyph: GlyphName): CSSProperties | undefined {
  const transform = NUDGE[glyph];
  return transform ? { transform } : undefined;
}
