// LOADOUT logo as on the first site: the yellow hexagon mark and the name in Jersey 10 at 36px.
// Colours come from CSS variables (--fg, --logo-bg, --logo-fg) so the logo follows the dark and light themes.

export function LogoMark({ className = "lg-mark" }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 32 32" shapeRendering="crispEdges" focusable="false">
        <path className="lg-a" d="M12 3h8l9 9v8l-9 9h-8l-9-9v-8z" />
        <path className="lg-b" d="m13 8 6 0 5 5v6l-5 5h-6l-5-5v-6z" />
        <path className="lg-a" d="M13 11h6v2h3v6h-3v2h-6v-2h-3v-6h3z" />
      </svg>
    </span>
  );
}

// Mark plus the name as real text, so the link is readable without extra markup.
export function Logo() {
  return (
    <span className="lg">
      <LogoMark />
      <span className="lg-text">LOADOUT</span>
    </span>
  );
}
