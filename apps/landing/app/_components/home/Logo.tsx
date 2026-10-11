// LOADOUT logo, styled like the buttons on main: a sand badge with a 2px border and a hard block
// shadow, a pixel bolt inside (the program's currency), and the name in Jersey 10 at 36px.
// Colours come from CSS variables (--fg, --logo-bg, --logo-fg, --logo-edge) so the logo follows
// the dark and light themes.

// The bolt on an 8x8 pixel grid: [row, first column, last column].
const BOLT: [number, number, number][] = [[0, 5, 8], [1, 4, 7], [2, 3, 6], [3, 2, 8], [4, 4, 7], [5, 3, 6], [6, 2, 5], [7, 1, 4]];

function boltPath() {
  return BOLT.map(([y, from, to]) => `M${from} ${y}h${to - from + 1}v1h-${to - from + 1}z`).join("");
}

export function LogoMark({ className = "lg-mark" }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 10 8" shapeRendering="crispEdges" focusable="false">
        <path d={boltPath()} />
      </svg>
    </span>
  );
}

// Badge plus the name as real text, so the link is readable without extra markup.
export function Logo() {
  return (
    <span className="lg">
      <LogoMark />
      <span className="lg-text">LOADOUT</span>
    </span>
  );
}
