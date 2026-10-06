import Image from "next/image";

export type IconName =
  | "bolt" | "layers" | "code" | "gift" | "user" | "list" | "document" | "wrench"
  | "gear" | "chip" | "board" | "flask" | "globe" | "people" | "arrow" | "star"
  | "laptop" | "cloud" | "key" | "box" | "cap" | "stickers" | "hoodie" | "terminal"
  | "domain" | "ticket" | "storage" | "check" | "cross" | "brand" | "down" | "faq-chevron"
  | "requisition-i" | "requisition-ii" | "requisition-master";

type LoadoutIconProps = { name: IconName; className?: string };

const spriteNames: Record<Exclude<IconName, "bolt" | "brand">, string> = {
  layers: "layers",
  code: "code",
  gift: "gift",
  user: "builder",
  list: "list",
  document: "document",
  wrench: "wrench",
  gear: "gear",
  chip: "cpu",
  board: "board",
  flask: "flask",
  globe: "globe",
  people: "people",
  arrow: "arrow-right",
  star: "xp-star",
  laptop: "laptop",
  cloud: "cloud",
  key: "key",
  box: "equipment-box",
  cap: "cap",
  stickers: "stickers",
  hoodie: "hoodie",
  terminal: "terminal",
  domain: "domain",
  ticket: "ticket",
  storage: "storage",
  check: "check",
  cross: "cross",
  down: "down",
  "faq-chevron": "faq-chevron",
  "requisition-i": "requisition-i",
  "requisition-ii": "requisition-ii",
  "requisition-master": "requisition-master",
};

export function LoadoutIcon({ name, className }: LoadoutIconProps) {
  const classes = [name === "brand" ? "" : "loadout-vector", className].filter(Boolean).join(" ");

  if (name === "bolt") {
    return <Image className={classes} src="/loadout/bolt.svg" alt="" aria-hidden="true" draggable={false} width={32} height={32} unoptimized />;
  }

  if (name === "brand") {
    return (
      <svg
        className={classes}
        viewBox="0 0 32 32"
        fill="none"
        stroke="var(--ink, #1D2021)"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
        shapeRendering="crispEdges"
        focusable="false"
        aria-hidden="true"
      >
        <path d="M12 3h8l9 9v8l-9 9h-8l-9-9v-8z" fill="var(--yellow, #D9B64C)" />
        <path d="m13 8 6 0 5 5v6l-5 5h-6l-5-5v-6z" fill="var(--ink, #1D2021)" />
        <path d="M13 11h6v2h3v6h-3v2h-6v-2h-3v-6h3z" fill="var(--yellow, #D9B64C)" />
      </svg>
    );
  }

  return (
    <Image
      className={classes}
      src={`/loadout/sprites/${spriteNames[name]}.png`}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={32}
      height={32}
      unoptimized
    />
  );
}
