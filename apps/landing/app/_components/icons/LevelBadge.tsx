import Image from "next/image";

type LevelBadgeProps = {
  variant: "one" | "two" | "master";
  className?: string;
};

const badgePaths = {
  one: "/loadout/icons/badge-one.svg",
  two: "/loadout/icons/badge-two.svg",
  master: "/loadout/icons/badge-master.svg",
} as const;

export function LevelBadge({ variant, className }: LevelBadgeProps) {
  return (
    <Image
      className={`loadout-vector ${className ?? ""}`.trim()}
      src={badgePaths[variant]}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={32}
      height={32}
      unoptimized
    />
  );
}
