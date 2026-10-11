import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const publicRoot = resolve(import.meta.dir, "../public");
const workshopFiles = [
  "bottom-platform.png",
  ...Array.from({ length: 12 }, (_, index) => `cloud-${String(index + 1).padStart(2, "0")}.png`),
  "grey-pixels-large.png",
  "grey-pixels-medium.png",
  "grey-pixels-small.png",
  "left-structure.png",
  "left-workbench.png",
  "plus-large.png",
  "plus-medium.png",
  "plus-small.png",
  "plus-tiny.png",
  "right-structure.png",
  "right-workstation.png",
  "skyline.png",
  "slashes-large.png",
  "slashes-medium.png",
  "slashes-small.png",
  "yellow-pixels-large.png",
  "yellow-pixels-medium.png",
  "yellow-pixels-small.png",
];
const sceneryFiles = [
  "cloud-01.svg",
  "cloud-02.svg",
  "cloud-03.svg",
  "scroll-cue.svg",
  "industrial-skyline.svg",
  "hazard-stripes.svg",
];
const iconSources = [
  ["bolt-source.png", "bolt.png"],
  ["layers-source.png", "layers.png"],
  ["code-source.png", "code.png"],
  ["gift-source.png", "gift.png"],
  ["builder-source.png", "builder.png"],
  ["list-source.png", "list.png"],
  ["document-source.png", "document.png"],
  ["wrench-source.png", "wrench.png"],
  ["gear-source.png", "gear.png"],
  ["cpu-source.png", "cpu.png"],
  ["board-source.png", "board.png"],
  ["flask-source.png", "flask.png"],
  ["globe-source.png", "globe.png"],
  ["arrow-right-source.png", "arrow-right.png"],
  ["xp-star-source.png", "xp-star.png"],
  ["laptop-source.png", "laptop.png"],
  ["cloud-source.png", "cloud.png"],
  ["equipment-box-source.png", "equipment-box.png"],
  ["worker-team-source.png", "people.png"],
  ["graduation-cap-source.png", "cap.png"],
  ["hoodie-source.png", "hoodie.png"],
  ["terminal-source.png", "terminal.png"],
  ["dev-badge-source.png", "domain.png"],
  ["ticket-source.png", "ticket.png"],
  ["storage-drive-source.png", "storage.png"],
  ["checkmark-source.png", "check.png"],
  ["cross-source.png", "cross.png"],
  ["double-down-chevrons-source.png", "down.png"],
  ["right-chevron-source.png", "faq-chevron.png"],
  ["badge-level-one-source.png", "requisition-i.png"],
  ["badge-level-two-source.png", "requisition-ii.png"],
  ["badge-crown-source.png", "requisition-master.png"],
] as const;
const retainedSourceOnly = [
  "octagon-source.png",
  "double-slashes-source.png",
  "house-source.png",
  "building-source.png",
  "warehouse-source.png",
  "layout-source.png",
  "queue-source.png",
  "hex-nut-source.png",
  "hardhats-source.png",
  "wrench-variant-source.png",
];

describe("canonical LOADOUT asset paths", () => {
  test("the current scenery CSS resolves to its organized SVG files", () => {
    const css = readFileSync(resolve(import.meta.dir, "loadout.css"), "utf8");
    const scenery = [
      "loadout/hero/scenery/industrial-skyline.svg",
      "loadout/hero/scenery/hazard-stripes.svg",
    ];

    for (const asset of scenery) {
      expect(css).toContain(`/${asset}`);
      expect(existsSync(resolve(publicRoot, asset))).toBe(true);
    }
  });

  test("the standalone scenery SVGs have descriptive grouped paths", () => {
    for (const file of sceneryFiles) {
      expect(existsSync(resolve(publicRoot, "loadout/hero/scenery", file))).toBe(true);
    }
  });

  test("the workshop source artwork has one semantic public-asset home", () => {
    for (const file of workshopFiles) {
      expect(existsSync(resolve(publicRoot, "loadout/hero-workshop", file))).toBe(true);
    }
  });

  test("the owner-supplied custom Bolt SVG remains available unchanged", () => {
    expect(existsSync(resolve(publicRoot, "loadout/bolt.svg"))).toBe(true);
  });

  test("all pixel icon source files have semantic filenames and their mapped sprites exist", () => {
    const sourceRoot = resolve(import.meta.dir, "../../../docs/design/references/2026-10-06/final-pixel-icons/source");
    for (const [source, sprite] of iconSources) {
      expect(existsSync(resolve(sourceRoot, source))).toBe(true);
      expect(existsSync(resolve(publicRoot, "loadout/sprites", sprite))).toBe(true);
    }
    for (const source of retainedSourceOnly) {
      expect(existsSync(resolve(sourceRoot, source))).toBe(true);
    }
  });

  test("the asset catalog documents every active pixel icon mapping", () => {
    const catalogPath = resolve(import.meta.dir, "../../../docs/design/asset-catalog.md");
    expect(existsSync(catalogPath)).toBe(true);
    const catalog = readFileSync(catalogPath, "utf8");
    for (const [source, sprite] of iconSources) {
      expect(catalog).toContain(`| \`${source}\` | \`${sprite}\` |`);
    }
  });
});
