// A small pixel pin, drawn on a 12 by 12 grid with crisp edges. Decoration only: the text beside it says "Pinned".
export function PinGlyph({ size = 14 }: Readonly<{ size?: number }>) {
  return (
    <svg className="pf-pin-glyph" viewBox="0 0 12 12" width={size} height={size} shapeRendering="crispEdges" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M4 1h5v1H8v3l2 2v1H7v3H6V8H3V7l2-2V2H4z" />
    </svg>
  );
}
