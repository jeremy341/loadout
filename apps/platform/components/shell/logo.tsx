// LOADOUT logo, same structure as the public site (apps/landing/app/_components/home/Logo.tsx): a miner's
// helmet on an octagon plate, 24 pixels square, drawn as SVG paths so every pixel stays sharp. Colours come
// from --logo-bg (plate), --logo-fg (outline) and --logo-fill (helmet) in globals.css. The name is real text
// in Jersey 10 beside the mark.

const PLATE = "M6 1h11v1h-11zM5 2h13v1h-13zM4 3h15v1h-15zM3 4h6v1h-6zM15 4h5v1h-5zM2 5h5v1h-5zM17 5h4v1h-4zM1 6h6v1h-6zM17 6h5v1h-5zM1 7h5v1h-5zM18 7h5v1h-5zM1 8h5v1h-5zM18 8h5v1h-5zM1 9h5v1h-5zM18 9h5v1h-5zM1 10h5v1h-5zM18 10h5v1h-5zM1 11h4v1h-4zM19 11h4v1h-4zM1 12h3v1h-3zM20 12h3v1h-3zM1 13h3v1h-3zM20 13h3v1h-3zM1 14h3v1h-3zM20 14h3v1h-3zM1 15h3v1h-3zM20 15h3v1h-3zM1 16h4v1h-4zM19 16h4v1h-4zM1 17h5v1h-5zM18 17h4v1h-4zM2 18h6v1h-6zM16 18h5v1h-5zM3 19h17v1h-17zM4 20h15v1h-15zM5 21h13v1h-13zM6 22h11v1h-11z";
const OUTLINE = "M6 0h11v1h-11zM5 1h1v1h-1zM17 1h1v1h-1zM4 2h1v1h-1zM18 2h1v1h-1zM3 3h1v1h-1zM19 3h1v1h-1zM2 4h1v1h-1zM9 4h6v1h-6zM20 4h1v1h-1zM1 5h1v1h-1zM7 5h3v1h-3zM11 5h2v1h-2zM14 5h3v1h-3zM21 5h1v1h-1zM0 6h1v1h-1zM7 6h1v1h-1zM9 6h1v1h-1zM11 6h2v1h-2zM14 6h1v1h-1zM16 6h1v1h-1zM22 6h1v1h-1zM0 7h1v1h-1zM6 7h2v1h-2zM9 7h1v1h-1zM11 7h2v1h-2zM14 7h1v1h-1zM16 7h2v1h-2zM23 7h1v1h-1zM0 8h1v1h-1zM6 8h1v1h-1zM9 8h1v1h-1zM11 8h2v1h-2zM14 8h1v1h-1zM17 8h1v1h-1zM23 8h1v1h-1zM0 9h1v1h-1zM6 9h1v1h-1zM9 9h1v1h-1zM11 9h2v1h-2zM14 9h1v1h-1zM17 9h1v1h-1zM23 9h1v1h-1zM0 10h1v1h-1zM6 10h1v1h-1zM11 10h2v1h-2zM17 10h1v1h-1zM23 10h1v1h-1zM0 11h1v1h-1zM5 11h2v1h-2zM10 11h4v1h-4zM17 11h2v1h-2zM23 11h1v1h-1zM0 12h1v1h-1zM4 12h4v1h-4zM9 12h2v1h-2zM13 12h2v1h-2zM16 12h4v1h-4zM23 12h1v1h-1zM0 13h1v1h-1zM4 13h1v1h-1zM7 13h3v1h-3zM14 13h3v1h-3zM19 13h1v1h-1zM23 13h1v1h-1zM0 14h1v1h-1zM4 14h1v1h-1zM8 14h2v1h-2zM14 14h2v1h-2zM19 14h1v1h-1zM23 14h1v1h-1zM0 15h1v1h-1zM4 15h2v1h-2zM9 15h2v1h-2zM13 15h2v1h-2zM18 15h2v1h-2zM23 15h1v1h-1zM0 16h1v1h-1zM5 16h2v1h-2zM10 16h4v1h-4zM17 16h2v1h-2zM23 16h1v1h-1zM0 17h1v1h-1zM6 17h3v1h-3zM15 17h3v1h-3zM22 17h1v1h-1zM1 18h1v1h-1zM8 18h8v1h-8zM21 18h1v1h-1zM2 19h1v1h-1zM20 19h1v1h-1zM3 20h1v1h-1zM19 20h1v1h-1zM4 21h1v1h-1zM18 21h1v1h-1zM5 22h1v1h-1zM17 22h1v1h-1zM6 23h11v1h-11z";
const HELMET = "M10 5h1v1h-1zM13 5h1v1h-1zM8 6h1v1h-1zM10 6h1v1h-1zM13 6h1v1h-1zM15 6h1v1h-1zM8 7h1v1h-1zM10 7h1v1h-1zM13 7h1v1h-1zM15 7h1v1h-1zM7 8h2v1h-2zM10 8h1v1h-1zM13 8h1v1h-1zM15 8h2v1h-2zM7 9h2v1h-2zM10 9h1v1h-1zM13 9h1v1h-1zM15 9h2v1h-2zM7 10h4v1h-4zM13 10h4v1h-4zM7 11h3v1h-3zM14 11h3v1h-3zM8 12h1v1h-1zM15 12h1v1h-1zM5 13h2v1h-2zM17 13h2v1h-2zM5 14h3v1h-3zM16 14h3v1h-3zM6 15h3v1h-3zM15 15h3v1h-3zM7 16h3v1h-3zM14 16h3v1h-3zM9 17h6v1h-6z";
const LAMP = "M11 12h2v1h-2zM10 13h4v1h-4zM10 14h4v1h-4zM11 15h2v1h-2z";

export function LogoMark() {
  return (
    <span className="lg-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" shapeRendering="crispEdges" focusable="false">
        <path className="lg-a" d={PLATE} />
        <path className="lg-b" d={OUTLINE} />
        <path className="lg-c" d={HELMET} />
        <path className="lg-lamp" d={LAMP} />
      </svg>
    </span>
  );
}

/** Mark plus the name as real text, so a link around it is readable without extra markup. */
export function Logo() {
  return (
    <span className="lg">
      <LogoMark />
      <span className="lg-text">LOADOUT</span>
    </span>
  );
}
