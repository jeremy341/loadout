import type { SVGProps } from "react";
import Image from "next/image";

export type IconName =
  | "bolt" | "layers" | "code" | "gift" | "user" | "list" | "document" | "wrench"
  | "gear" | "chip" | "board" | "flask" | "globe" | "people" | "arrow" | "star"
  | "laptop" | "cloud" | "key" | "box" | "cap" | "stickers" | "hoodie" | "terminal"
  | "domain" | "ticket" | "storage" | "check" | "cross" | "brand" | "down";

type LoadoutIconProps = { name: IconName; className?: string } & Omit<SVGProps<SVGSVGElement>, "name">;

const spritePaths: Record<Exclude<IconName, "brand">, string> = {
  bolt: "/loadout/icons/bolt.svg",
  layers: "/loadout/icons/layers.svg",
  code: "/loadout/icons/code.svg",
  gift: "/loadout/icons/gift.svg",
  user: "/loadout/icons/user.svg",
  list: "/loadout/icons/list.svg",
  document: "/loadout/icons/document.svg",
  wrench: "/loadout/icons/wrench.svg",
  gear: "/loadout/icons/gear.svg",
  chip: "/loadout/icons/chip.svg",
  board: "/loadout/icons/board.svg",
  flask: "/loadout/icons/flask.svg",
  globe: "/loadout/icons/globe.svg",
  people: "/loadout/icons/people.svg",
  arrow: "/loadout/icons/arrow.svg",
  star: "/loadout/icons/star.svg",
  laptop: "/loadout/icons/laptop.svg",
  cloud: "/loadout/icons/cloud.svg",
  key: "/loadout/icons/key.svg",
  box: "/loadout/icons/box.svg",
  cap: "/loadout/icons/cap.svg",
  stickers: "/loadout/icons/stickers.svg",
  hoodie: "/loadout/icons/hoodie.svg",
  terminal: "/loadout/icons/terminal.svg",
  domain: "/loadout/icons/domain.svg",
  ticket: "/loadout/icons/ticket.svg",
  storage: "/loadout/icons/storage.svg",
  check: "/loadout/icons/check.svg",
  cross: "/loadout/icons/cross.svg",
  down: "/loadout/icons/down.svg",
};

const ink = "var(--ink, #1D2021)";
const gold = "var(--yellow, #D9B64C)";

export function LoadoutIcon({ name, className, ...props }: LoadoutIconProps) {
  if (name === "brand") {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" shapeRendering="crispEdges" focusable="false" {...props} aria-hidden="true">
        <path d="M12 3h8l9 9v8l-9 9h-8l-9-9v-8z" fill={gold} />
        <path d="m13 8 6 0 5 5v6l-5 5h-6l-5-5v-6z" fill={ink} />
        <path d="M13 11h6v2h3v6h-3v2h-6v-2h-3v-6h3z" fill={gold} />
      </svg>
    );
  }

  return (
    <Image
      className={`loadout-vector ${className ?? ""}`.trim()}
      src={spritePaths[name]}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={32}
      height={32}
      unoptimized
    />
  );
}
