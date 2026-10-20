import type { TrackName } from "../../../lib/sample/builders";

// Everything the Gear tabs treat as a rule or as sample content lives in this file, so it can be replaced by one
// real configuration source later (plans/02 section "Store eventual configuration in one authority").
//
//   PLAN_RULES  - values the plans have settled. Each line names its owner.
//   DRAFT_RULES - values the plans leave open. They are working choices for this preview and are shown to the
//                 participant as "Draft preview rule". Never present them as program facts.
//   SHOP_ITEMS, COLLECTIBLES - sample content. Every item is labelled "Sample item" in the UI.

export const TRACKS: readonly TrackName[] = ["Tools", "Systems", "Compute", "Hardware"];

export type Levels = Record<TrackName, number>;

export const PLAN_RULES = {
  /** plans/02 section 26.5: the permanent discount reaches 20% at LV.15. */
  maxPermanentPercent: 20,
  maxLevel: 15,
  /** plans/02 section 26.8: five identical Field Requisitions per track at these levels. */
  fieldTicketLevels: [3, 6, 9, 12, 15] as readonly number[],
  /** plans/02 sections 26.8 and 26.9. */
  fieldTicketPercent: 20,
  fieldTicketMinBase: 400,
  /** plans/02 section 26.6: no Ore savings cap, but at most 40% in total. */
  maxCombinedPercent: 40,
  /** plans/02 section 10 and plans/22 section 1. */
  scoreMin: 1,
  scoreMax: 9,
  minMultiplier: 1,
  normalCapMultiplier: 20,
  meanMultiplier: 10,
  /** plans/02 section 17: Great Signal raises the hourly cap, it does not add 30x on top. */
  greatCapMultiplier: 30,
  /** plans/02 section 17. */
  goodSignalOre: 50,
  signalCapOre: 5000,
  /** plans/02 section 11 and 22: a qualifying Era adds 10% of the approved base Ore. */
  eraBonusPercent: 10,
  /** plans/02 section 20: one-time achievement for the first meaningful external contribution. */
  externalContributorOre: 50,
} as const;

export type GeneralTier = "I" | "II" | "Master";

export const DRAFT_RULES = {
  /** plans/proposals/economy-calibration.md section 3.1: candidate curve. plans/02 says the curve is open. */
  discountCurveExponent: 1.2,
  /** plans/02 section 26.11 "Working defaults". Triggers and amounts for awarding them are open. */
  generalRequisitions: {
    I: { minBase: 1000, percent: 10, maxSaving: 300 },
    II: { minBase: 2000, percent: 15, maxSaving: 600 },
    Master: { minBase: 4000, percent: 15, maxSaving: 1000 },
  } as Record<GeneralTier, { minBase: number; percent: number; maxSaving: number }>,
  /**
   * No plan defines the percentile payout curve or the ship population it is measured against. The preview treats
   * a score's position between 1 and 9 as its percentile and bends it so a uniform population averages 10x:
   * multiplier = 1 + 19 * p^(10/9). With p uniform on 0..1 the mean is 1 + 19 / (10/9 + 1) = 10.
   */
  scoreCurveExponent: 10 / 9,
  /** Largest quantity of one item per preview order. Real limits are not decided. */
  maxQuantity: 5,
  /** Hours field limit. plans/02 sets no total limit on legitimate hours; this only keeps the input sane. */
  maxHours: 10000,
  /** Longest wishlist note, referral label and similar text fields. */
  maxNote: 140,
  /** Default preview levels for the four tracks. Replaced by real progression when the Hub exists. */
  defaultLevels: { Tools: 6, Systems: 1, Compute: 1, Hardware: 3 } as Levels,
} as const;

// --- Shop sample catalog -------------------------------------------------------------------------------------

export type ShopCategory = "tools" | "compute" | "systems" | "hardware" | "lab" | "maker" | "major" | "merch";

export const CATEGORY_LABELS: Record<ShopCategory, string> = {
  tools: "Tools",
  compute: "Compute",
  systems: "Systems",
  hardware: "Hardware",
  lab: "Lab",
  maker: "Maker",
  major: "Major upgrades",
  merch: "Merch",
};

/** plans/02 section 26.3: Open, Specialist and Mastery equipment. */
export type AccessClass = "open" | "specialist" | "mastery";

export interface ItemRequirement {
  /** Any one of these tracks at or above `level` unlocks the item. A Requisition never bypasses it. */
  tracks: readonly TrackName[];
  level: number;
}

export interface ShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  blurb: string;
  description: string;
  /** Base Ore price. The same in every region (plans/02 section 26). */
  basePrice: number;
  /** Where the number comes from. "plan" prices are the working examples in plans/02 section 67. */
  priceSource: "plan" | "draft";
  tracks: readonly TrackName[];
  access: AccessClass;
  requires?: ItemRequirement;
  requisitionEligible: boolean;
  sprite: string;
}

export const SHOP_ITEMS: readonly ShopItem[] = [
  {
    id: "esp32-kit",
    name: "ESP32 starter kit",
    category: "hardware",
    blurb: "A microcontroller board, jumper wires and a breadboard.",
    description:
      "A first microcontroller kit for wireless and sensor projects. Sample item: the contents shown here are an example, not a listing.",
    basePrice: 50,
    priceSource: "plan",
    tracks: ["Hardware"],
    access: "open",
    requisitionEligible: true,
    sprite: "board",
  },
  {
    id: "solder-kit",
    name: "Soldering iron kit",
    category: "maker",
    blurb: "An iron, stand, solder and a few spare tips.",
    description: "Enough to assemble your first board. Sample item: the contents shown here are an example, not a listing.",
    basePrice: 60,
    priceSource: "plan",
    tracks: ["Hardware"],
    access: "open",
    requisitionEligible: true,
    sprite: "wrench",
  },
  {
    id: "rpi-5",
    name: "Raspberry Pi 5",
    category: "hardware",
    blurb: "A single-board computer for servers, robots and prototypes.",
    description:
      "Relevant to Hardware and Systems, so the better of your two track discounts applies, never both. Sample item: the model and memory size would be fixed by the real catalog.",
    basePrice: 200,
    priceSource: "plan",
    tracks: ["Hardware", "Systems"],
    access: "open",
    requisitionEligible: true,
    sprite: "cpu",
  },
  {
    id: "t7-ssd",
    name: "Samsung T7 SSD",
    category: "systems",
    blurb: "A portable solid-state drive for builds, images and backups.",
    description: "Relevant to Systems and Compute. Sample item: the capacity would be fixed by the real catalog.",
    basePrice: 160,
    priceSource: "plan",
    tracks: ["Systems", "Compute"],
    access: "open",
    requisitionEligible: true,
    sprite: "storage",
  },
  {
    id: "domain",
    name: "Domain, one year",
    category: "tools",
    blurb: "A domain name for a project site or a hosted tool.",
    description: "A low-cost item. It is under the 400 Ore minimum, so a Field Requisition cannot be used on it. Sample item.",
    basePrice: 24,
    priceSource: "plan",
    tracks: ["Tools", "Systems"],
    access: "open",
    requisitionEligible: true,
    sprite: "domain",
  },
  {
    id: "a1-mini",
    name: "A1 Mini 3D printer",
    category: "maker",
    blurb: "A compact printer for cases, brackets and test fixtures.",
    description:
      "A working-example price from the economy plan. Sample item: the exact model and what ships with it would come from the real catalog.",
    basePrice: 500,
    priceSource: "plan",
    tracks: ["Hardware"],
    access: "open",
    requisitionEligible: true,
    sprite: "equipment-box",
  },
  {
    id: "enclosed-printer",
    name: "Enclosed 3D printer",
    category: "maker",
    blurb: "An enclosed printer for stronger materials and cleaner prints.",
    description:
      "The economy plan's working catalog sets no level requirement for this item. Sample item: the model would come from the real catalog.",
    basePrice: 1000,
    priceSource: "plan",
    tracks: ["Hardware"],
    access: "open",
    requisitionEligible: true,
    sprite: "gear",
  },
  {
    id: "framework-16",
    name: "Framework 16 laptop",
    category: "major",
    blurb: "A modular laptop for development on the move.",
    description:
      "Relevant to Tools, Systems and Compute. The economy plan's working catalog sets no level requirement for it. Sample item: configuration and options would come from the real catalog.",
    basePrice: 5000,
    priceSource: "plan",
    tracks: ["Tools", "Systems", "Compute"],
    access: "open",
    requisitionEligible: true,
    sprite: "laptop",
  },
  {
    id: "logic-analyzer",
    name: "Logic analyzer",
    category: "lab",
    blurb: "Capture and decode digital signals on a bench.",
    description: "Sample item with a draft price: the plans name a logic analyzer as Lab gear but set no Ore price for it.",
    basePrice: 180,
    priceSource: "draft",
    tracks: ["Hardware", "Tools"],
    access: "open",
    requisitionEligible: true,
    sprite: "flask",
  },
  {
    id: "portable-display",
    name: "Portable display",
    category: "tools",
    blurb: "A thin second screen for a laptop or a Pi.",
    description: "Sample item with a draft price: the plans name portable displays as Tools gear but set no Ore price for them.",
    basePrice: 420,
    priceSource: "draft",
    tracks: ["Tools", "Hardware"],
    access: "open",
    requisitionEligible: true,
    sprite: "layers",
  },
  {
    id: "vps-credit",
    name: "VPS credit, three months",
    category: "systems",
    blurb: "A small virtual server for hosting a project.",
    description: "Sample item with a draft price: the plans name VPS hosting under Systems but set no Ore price for it.",
    basePrice: 90,
    priceSource: "draft",
    tracks: ["Systems"],
    access: "open",
    requisitionEligible: true,
    sprite: "cloud",
  },
  {
    id: "gpu-credit",
    name: "GPU compute credit",
    category: "compute",
    blurb: "Hours on a rented GPU for training or rendering.",
    description: "Sample item with a draft price: the plans name GPU cloud under Compute but set no Ore price for it.",
    basePrice: 300,
    priceSource: "draft",
    tracks: ["Compute"],
    access: "open",
    requisitionEligible: true,
    sprite: "code",
  },
  {
    id: "fpga-board",
    name: "FPGA starter board",
    category: "hardware",
    blurb: "Programmable logic for hardware design projects.",
    description:
      "A Specialist item. The plans say FPGA boards carry a level requirement but do not set the level; the level shown here is a draft. A Requisition never unlocks it.",
    basePrice: 650,
    priceSource: "draft",
    tracks: ["Hardware", "Compute"],
    access: "specialist",
    requires: { tracks: ["Hardware", "Compute"], level: 5 },
    requisitionEligible: true,
    sprite: "board",
  },
  {
    id: "gpu-grant",
    name: "High-end GPU grant",
    category: "major",
    blurb: "A graphics card for serious compute work.",
    description:
      "A Mastery item. The plans say Mastery items need a high level in a related track but do not fix the number; the level and price shown here are drafts. A Requisition never unlocks it.",
    basePrice: 6500,
    priceSource: "draft",
    tracks: ["Compute"],
    access: "mastery",
    requires: { tracks: ["Compute"], level: 9 },
    requisitionEligible: true,
    sprite: "cpu",
  },
  {
    id: "sticker-pack",
    name: "LOADOUT sticker pack",
    category: "merch",
    blurb: "A few vinyl stickers for a laptop or a toolbox.",
    description: "Merch is not tied to a track, so no track discount applies. Sample item with a draft price.",
    basePrice: 8,
    priceSource: "draft",
    tracks: [],
    access: "open",
    requisitionEligible: false,
    sprite: "gift",
  },
  {
    id: "hoodie",
    name: "LOADOUT hoodie",
    category: "merch",
    blurb: "A hooded sweatshirt for long build nights.",
    description: "Merch is not tied to a track, so no track discount applies. Sample item with a draft price.",
    basePrice: 150,
    priceSource: "draft",
    tracks: [],
    access: "open",
    requisitionEligible: false,
    sprite: "hoodie",
  },
];

export function findShopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id);
}

/** Shown wherever availability could be mistaken for a promise. */
export const AVAILABILITY_NOTE =
  "Ore prices are the same in every region. Availability, delivery, tax and shipping can differ by region and are confirmed at checkout once ordering opens.";

// --- Collectibles ---------------------------------------------------------------------------------------------

export type Rarity = "common" | "uncommon" | "rare" | "epic";

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
};

/** Facts about this participant's Gear tabs that a collectible can be checked against. */
export interface GearStats {
  ordersPlaced: number;
  ordersDelivered: number;
  wishlistCount: number;
  oreSpent: number;
  requisitionsUsed: number;
  customRequests: number;
  scenariosSaved: number;
  referralsInvited: number;
  referralsQualified: number;
  maxLevel: number;
}

export type CollectibleCondition =
  | { type: "stat"; stat: keyof GearStats; atLeast: number; label: string }
  | { type: "manual"; hint: string };

export interface Collectible {
  id: string;
  name: string;
  rarity: Rarity;
  sprite: string;
  blurb: string;
  condition: CollectibleCondition;
}

// plans/proposals/future-platform-ui.md names collectibles but no plan defines a catalog, conditions or rarities.
// Every entry here is a Draft preview rule.
export const COLLECTIBLES: readonly Collectible[] = [
  { id: "first-order", name: "First Redemption", rarity: "common", sprite: "gift", blurb: "You placed your first preview order.", condition: { type: "stat", stat: "ordersPlaced", atLeast: 1, label: "Place an order" } },
  { id: "wish-maker", name: "Wish Maker", rarity: "common", sprite: "list", blurb: "Three items on your wishlist.", condition: { type: "stat", stat: "wishlistCount", atLeast: 3, label: "Save 3 items to your wishlist" } },
  { id: "estimator", name: "Back Of The Envelope", rarity: "common", sprite: "terminal", blurb: "You saved an Ore estimate.", condition: { type: "stat", stat: "scenariosSaved", atLeast: 1, label: "Save a calculator scenario" } },
  { id: "recruiter", name: "Recruiter", rarity: "common", sprite: "people", blurb: "You invited your first builder.", condition: { type: "stat", stat: "referralsInvited", atLeast: 1, label: "Add a referral invite" } },
  { id: "ore-spender", name: "Ore Spender", rarity: "uncommon", sprite: "ore", blurb: "You have spent 200 Ore or more on gear.", condition: { type: "stat", stat: "oreSpent", atLeast: 200, label: "Spend 200 Ore" } },
  { id: "gear-in-hand", name: "Gear In Hand", rarity: "uncommon", sprite: "equipment-box", blurb: "An order reached Delivered.", condition: { type: "stat", stat: "ordersDelivered", atLeast: 1, label: "Have an order delivered" } },
  { id: "ticket-holder", name: "Ticket Holder", rarity: "uncommon", sprite: "ticket", blurb: "You used a Requisition on an order.", condition: { type: "stat", stat: "requisitionsUsed", atLeast: 1, label: "Use a Requisition" } },
  { id: "number-cruncher", name: "Number Cruncher", rarity: "uncommon", sprite: "flask", blurb: "Three saved calculator scenarios.", condition: { type: "stat", stat: "scenariosSaved", atLeast: 3, label: "Save 3 calculator scenarios" } },
  { id: "special-request", name: "Special Request", rarity: "rare", sprite: "wrench", blurb: "You sent a Custom Order request.", condition: { type: "stat", stat: "customRequests", atLeast: 1, label: "Request a Custom Order" } },
  { id: "verified-referral", name: "Verified Referral", rarity: "rare", sprite: "check", blurb: "A builder you invited earned a first approved ship.", condition: { type: "stat", stat: "referralsQualified", atLeast: 1, label: "Qualify a referral" } },
  { id: "specialist", name: "Specialist", rarity: "rare", sprite: "xp-star", blurb: "Level 9 in a track.", condition: { type: "stat", stat: "maxLevel", atLeast: 9, label: "Reach level 9 in a track" } },
  { id: "mastery", name: "Mastery", rarity: "epic", sprite: "cap", blurb: "Level 15 in a track.", condition: { type: "stat", stat: "maxLevel", atLeast: 15, label: "Reach level 15 in a track" } },
  { id: "first-ship", name: "First Ship", rarity: "common", sprite: "document", blurb: "Your first approved ship.", condition: { type: "manual", hint: "Approved ships are tracked in Projects, which this preview cannot read." } },
  { id: "reviewer", name: "Eight Reviews", rarity: "uncommon", sprite: "builder", blurb: "You completed the eight reviews owed before a payout.", condition: { type: "manual", hint: "Reviews are tracked in Reviews, which this preview cannot read." } },
  { id: "great-signal", name: "Great Signal", rarity: "epic", sprite: "globe", blurb: "A reviewer verified Great-tier outside traction.", condition: { type: "manual", hint: "Signal claims are verified by a reviewer, which this preview cannot do." } },
];

export function findCollectible(id: string): Collectible | undefined {
  return COLLECTIBLES.find((c) => c.id === id);
}

export const MAX_PINS = 3;

// --- Signal evidence thresholds -------------------------------------------------------------------------------

// plans/02 section 17: the current Stardance thresholds are the reference for both tiers. A reviewer verifies every
// claim, internal Hack Club channels, bot reposts, SEO mirrors and paid engagement do not count, and blog or news
// coverage qualifies at the reviewer's discretion.
export interface SignalPlatform {
  id: string;
  label: string;
  /** Minimum count for the Good tier, or null when the plan lists none for this measure. */
  good: number | null;
  great: number;
  /** Hacker News: Great also requires the front page. */
  greatNeedsFrontPage?: boolean;
}

export const SIGNAL_PLATFORMS: readonly SignalPlatform[] = [
  { id: "reddit", label: "Reddit upvotes", good: 25, great: 500 },
  { id: "hn", label: "Hacker News points", good: 10, great: 100, greatNeedsFrontPage: true },
  { id: "github", label: "GitHub stars", good: 25, great: 100 },
  { id: "youtube", label: "YouTube views", good: 250, great: 50000 },
  { id: "short-video", label: "TikTok, Reels or Shorts views", good: 5000, great: 100000 },
  { id: "social", label: "X, Bluesky or Threads likes", good: 50, great: 1500 },
  { id: "instagram-likes", label: "Instagram likes", good: 200, great: 10000 },
  { id: "instagram-views", label: "Instagram views", good: null, great: 100000 },
  { id: "app-store", label: "App store downloads", good: 100, great: 10000 },
  { id: "package", label: "Package manager downloads", good: 1000, great: 50000 },
  { id: "mods", label: "Modrinth or CurseForge downloads", good: 2500, great: 100000 },
];
