import Image from "next/image";
import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "bolt" | "layers" | "code" | "gift" | "user" | "list" | "document" | "wrench"
  | "gear" | "chip" | "board" | "flask" | "globe" | "people" | "arrow" | "star"
  | "laptop" | "cloud" | "key" | "box" | "cap" | "stickers" | "hoodie" | "terminal"
  | "domain" | "ticket" | "storage" | "check" | "cross" | "brand" | "down";

type LoadoutIconProps = { name: IconName; className?: string } & Omit<SVGProps<SVGSVGElement>, "name">;

const ink = "var(--ink, #1D2021)";
const gold = "var(--yellow, #D9B64C)";
const icons: Record<Exclude<IconName, "bolt">, ReactNode> = {
  down: <><path d="M4 4h6v5h5v5h2v-5h5V4h6M4 15h6v5h5v5h2v-5h5v-5h6" fill="none" stroke={ink} strokeWidth="5"/><path d="M4 4h6v5h5v5h2v-5h5V4h6M4 15h6v5h5v5h2v-5h5v-5h6" fill="none" stroke={gold} strokeWidth="2"/></>,
  brand: <><path d="M12 3h8l9 9v8l-9 9h-8l-9-9v-8z" fill={gold}/><path d="m13 8 6 0 5 5v6l-5 5h-6l-5-5v-6z" fill={ink}/><path d="M13 11h6v2h3v6h-3v2h-6v-2h-3v-6h3z" fill={gold}/></>,
  layers: <><path d="m4 12 12-7 12 7-12 7z" fill={gold}/><path d="m4 12 12-7 12 7-12 7z"/><path d="m4 18 12 7 12-7M4 23l12 7 12-7" fill={gold}/><path d="m4 18 12 7 12-7M4 23l12 7 12-7"/></>,
  code: <><path d="M5 6h22v20H5z" fill={gold}/><path d="M5 6h22v20H5z"/><path d="M5 10h22M9 6V4h4v2m8 0V4h4v2"/><path d="m12 15-3 3 3 3m8-6 3 3-3 3m-2-7-3 8" fill="none"/><path d="m12 15-3 3 3 3m8-6 3 3-3 3m-2-7-3 8"/></>,
  gift: <><path d="M5 13h22v15H5z" fill={gold}/><path d="M5 13h22v15H5zM3 9h26v5H3z" fill={gold}/><path d="M3 9h26v5H3zM16 9v19M16 9c-7 0-9-7-5-7 4 0 5 7 5 7Zm0 0c7 0 9-7 5-7-4 0-5 7-5 7Z"/></>,
  user: <><path d="M12 5h8v3h3v7h-3v3h-8v-3H9V8h3z" fill={ink}/><path d="M7 27v-4l4-4h10l4 4v4z" fill={ink}/><path d="M12 5h8v3h3v7h-3v3h-8v-3H9V8h3zM7 27v-4l4-4h10l4 4v4z"/></>,
  list: <><path d="M6 5h5v5H6zM6 14h5v5H6zM6 23h5v5H6z" fill={gold}/><path d="M6 5h5v5H6zM6 14h5v5H6zM6 23h5v5H6zM15 6h12v3H15zM15 15h12v3H15zM15 24h12v3H15z"/></>,
  document: <><path d="M8 3h12l6 6v20H8z" fill="var(--surface, #F0F1ED)"/><path d="M8 3h12l6 6v20H8zM20 3v7h6M12 15h10M12 19h10M12 23h7"/><path d="M4 7v23h18" fill="none"/></>,
  wrench: <><path d="M22 4a8 8 0 0 0-9 10L4 23l5 5 9-9a8 8 0 0 0 10-9l-5 5-5-1-1-5z" fill={gold}/><path d="M22 4a8 8 0 0 0-9 10L4 23l5 5 9-9a8 8 0 0 0 10-9l-5 5-5-1-1-5z"/><path d="m7 22 4 4"/></>,
  gear: <><path d="M13 3h6v4l3 1 3-2 4 5-3 3v4l3 3-4 5-4-2-3 1v4h-6v-4l-3-1-3 2-4-5 3-3v-4l-3-3 4-5 4 2 3-1z" fill={gold}/><path d="M13 3h6v4l3 1 3-2 4 5-3 3v4l3 3-4 5-4-2-3 1v4h-6v-4l-3-1-3 2-4-5 3-3v-4l-3-3 4-5 4 2 3-1z"/><path d="M12 16a4 4 0 1 0 8 0 4 4 0 0 0-8 0z" fill="var(--surface, #F0F1ED)"/><path d="M12 16a4 4 0 1 0 8 0 4 4 0 0 0-8 0z"/></>,
  chip: <><path d="M9 8h14v16H9z" fill={gold}/><path d="M9 8h14v16H9zM13 12h6v8h-6z"/><path d="M13 12h6v8h-6z" fill={ink}/><path d="M12 3v5m8-5v5m-8 16v5m8-5v5M4 11h5m-5 8h5m14-8h5m-5 8h5"/></>,
  board: <><path d="M5 5h22v21H5z" fill={gold}/><path d="M5 5h22v21H5z"/><path d="M11 9h10v12H11z" fill={ink}/><path d="M11 9h10v12H11z"/><path d="M8 9h3m-3 4h3m-3 4h3m-3 3h3m10-11h3m-3 4h3m-3 4h3m-3 3h3M9 7v2m6-2v2m6-2v2M9 21v2m6-2v2m6-2v2" fill="none" stroke="var(--surface, #F0F1ED)" strokeWidth="1.5"/><path d="M13 12h6v6h-6z" fill="var(--surface, #F0F1ED)"/></>,
  flask: <><path d="M12 3h8M14 3v9L6 26v3h20v-3l-8-14V3" fill="var(--surface, #F0F1ED)"/><path d="M12 3h8M14 3v9L6 26v3h20v-3l-8-14V3M10 22h12"/><path d="m11 20 4-5 4 5z" fill={gold}/><path d="m11 20 4-5 4 5z"/></>,
  globe: <><circle cx="16" cy="16" r="12" fill="var(--surface, #F0F1ED)"/><circle cx="16" cy="16" r="12"/><path d="M4 16h24M16 4c4 4 5 8 5 12s-1 8-5 12m0-24c-4 4-5 8-5 12s1 8 5 12" fill="none"/></>,
  people: <><path d="M7 8h6v6H7zM21 8h6v6h-6z" fill={gold}/><path d="M7 8h6v6H7zM21 8h6v6h-6z"/><path d="M3 27v-5l4-4h7l4 4v5zm11 0v-5l4-4h7l4 4v5z" fill="var(--surface, #F0F1ED)"/><path d="M3 27v-5l4-4h7l4 4v5zm11 0v-5l4-4h7l4 4v5z"/></>,
  arrow: <><path d="M4 14h17l-6-6 4-4 11 12-11 12-4-4 6-6H4z" fill={gold}/><path d="M4 14h17l-6-6 4-4 11 12-11 12-4-4 6-6H4z"/></>,
  star: <><path d="m16 3 4 8 9 1-7 6 2 10-8-5-8 5 2-10-7-6 9-1z" fill={gold}/><path d="m16 3 4 8 9 1-7 6 2 10-8-5-8 5 2-10-7-6 9-1z"/></>,
  laptop: <><path d="M7 5h18v16H7z" fill="var(--surface, #F0F1ED)"/><path d="M7 5h18v16H7zM4 23h24l2 4H2z" fill={gold}/><path d="M4 23h24l2 4H2zM10 8h12v10H10z"/><path d="M12 11h8v4h-8z" fill={gold}/></>,
  cloud: <><path d="M8 24H6v-5h3v-5h4V9h10v5h4v5h2v5H8z" fill="var(--surface, #F0F1ED)"/><path d="M8 24H6v-5h3v-5h4V9h10v5h4v5h2v5H8z"/><path d="M13 14h10v5H13z" fill={gold}/></>,
  key: <><path d="M20 5a8 8 0 0 0-7 12L4 26l4 4 3-3-1-2 3-3 2 1 4-4a8 8 0 1 0 1-14zm2 5h3v3h-3z" fill={gold}/><path d="M20 5a8 8 0 0 0-7 12L4 26l4 4 3-3-1-2 3-3 2 1 4-4a8 8 0 1 0 1-14zm2 5h3v3h-3z"/></>,
  box: <><path d="m4 10 12-6 12 6v14l-12 6-12-6z" fill={gold}/><path d="m4 10 12-6 12 6v14l-12 6-12-6zM4 10l12 6 12-6M16 16v14"/><path d="M9 7l12 6v4l-12-6z" fill="var(--surface, #F0F1ED)"/><path d="M9 7l12 6v4l-12-6z"/></>,
  cap: <><path d="M3 13 16 6l13 7-13 7z" fill={gold}/><path d="M3 13 16 6l13 7-13 7zM8 17v6l8 4 8-4v-6M29 13v9h-3"/><path d="M11 13h10" stroke="var(--surface, #F0F1ED)" strokeWidth="2"/></>,
  stickers: <><circle cx="10" cy="12" r="6" fill="var(--danger, #A96F6C)"/><circle cx="22" cy="11" r="6" fill="var(--danger, #A96F6C)"/><circle cx="16" cy="23" r="6" fill="var(--danger, #A96F6C)"/><circle cx="10" cy="12" r="6"/><circle cx="22" cy="11" r="6"/><circle cx="16" cy="23" r="6"/><path d="M8 11h4m8-1h4m-6 12h4" stroke={ink} strokeWidth="2"/></>,
  hoodie: <><path d="M11 5 16 3l5 2 7 6-4 5-3-2v13H11V14l-3 2-4-5z" fill={gold}/><path d="M11 5 16 3l5 2 7 6-4 5-3-2v13H11V14l-3 2-4-5zM11 5c0 5 10 5 10 0M13 20h6"/><path d="M15 10h2v3h-2z" fill={ink}/></>,
  terminal: <><path d="M4 5h24v22H4z" fill="var(--graphite, #292C2D)"/><path d="M4 5h24v22H4zM4 10h24"/><path d="m9 15 4 3-4 3m8 0h6" fill="none" stroke={gold} strokeWidth="2"/></>,
  domain: <><path d="M4 8h24v17H4z" fill="var(--surface, #F0F1ED)"/><path d="M4 8h24v17H4zM8 12h16v9H8z"/><path d="M10 14h12v5H10z" fill={gold}/><path d="M11 17h4m2 0h4" stroke={ink} strokeWidth="2"/></>,
  ticket: <><path d="M4 8h24v5a3 3 0 0 0 0 6v5H4v-5a3 3 0 0 0 0-6z" fill={gold}/><path d="M4 8h24v5a3 3 0 0 0 0 6v5H4v-5a3 3 0 0 0 0-6zM17 9v3m0 3v3m0 3v2" strokeDasharray="2 2"/></>,
  storage: <><path d="M5 5h22v22H5z" fill="var(--surface, #F0F1ED)"/><path d="M5 5h22v22H5zM9 9h14v5H9zm0 9h14v5H9z"/><path d="M20 11h1m-1 9h1" stroke={gold} strokeWidth="2"/></>,
  check: <><circle cx="16" cy="16" r="12" fill="var(--success, #718C79)"/><circle cx="16" cy="16" r="12"/><path d="m10 16 4 4 8-9" fill="none" strokeWidth="3"/></>,
  cross: <><circle cx="16" cy="16" r="12" fill="var(--danger, #A96F6C)"/><circle cx="16" cy="16" r="12"/><path d="m11 11 10 10m0-10L11 21" fill="none" strokeWidth="3"/></>,
};

export function LoadoutIcon({ name, className, ...props }: LoadoutIconProps) {
  if (name === "bolt") {
    return <Image className={`loadout-vector ${className ?? ""}`.trim()} src="/loadout/bolt.svg" alt="" aria-hidden="true" draggable={false} width={32} height={32} unoptimized />;
  }

  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      stroke={ink}
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      shapeRendering="crispEdges"
      focusable="false"
      {...props}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}
