// Sample data and the in-memory store for the Content pages of the reviewer site (shop, item details, events, forms,
// Show & Tell, community goals, referrals, ideas). Rows keep Pixl's shapes (snake_case, numeric ids). The content comes from
// LOADOUT's own fixtures: lib/platform/shop.ts (the proposed catalogue at draft Ore prices, the same everywhere), community.ts
// (ideas, sessions, goals, eras) and the review ships' builders. Every price is in Ore. Nothing here is a real person, address or
// product listing. Handles stand in for account ids.
// Changes made by actions live in this server process only (see `content` below) and are gone after a restart.
import { BUILDERS, COMMUNITY_ERAS, GOALS, IDEAS, SESSIONS } from "@/lib/platform/community";
import { REVIEW_SHIPS, REVIEWERS } from "@/lib/platform/review";
import { REQUISITION_MIN_ORE, SHOP_ITEMS } from "@/lib/platform/shop";
import { SHOP_CATEGORIES, SHOP_CATEGORY_LABELS, shopCategoryOf, type ShopCategory } from "../shopCategories";
import { SHOP_REGIONS, SHOP_REGION_LABELS, type ShopRegion } from "../shopRegions";

export { SHOP_CATEGORIES, SHOP_CATEGORY_LABELS, SHOP_REGIONS, SHOP_REGION_LABELS };
export type { ShopCategory, ShopRegion };

const HOUR = 3_600_000;
const NOW = Date.now();
const at = (hoursAgo: number): string => new Date(NOW - hoursAgo * HOUR).toISOString();

// ---- Types (copied from Pixl's lib/db.ts) ----

export interface ShopItemRow {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  options: string[];
  active: boolean;
  position: number;
  created_by: string;
  created_at: string;
  region: ShopRegion;
  unlock_xp: number;
  category: ShopCategory;
  // The tracks the item relates to; empty means General (open to everyone, no Field Requisition).
  tracks: string[];
  unlock_trial_ids: (number | string)[];
  manual_locked: boolean;
  lock_note: string;
  beacon_locked: boolean;
  discount_percent: number;
  reserved_user_id?: string | null;
  price_source_url: string;
  alt_source_url?: string | null;
  config_options: {
    base_price?: number;
    reference_url?: string;
    groups?: { name: string; type: string; choices: { label: string; price: number }[] }[];
  } | null;
}

export interface ShopOptionStockRow {
  choice: string;
  total: number;
  remaining: number;
}

export interface PersonalShopItem extends ShopItemRow {
  owner: { id: string; display_name: string | null; slack_id: string | null } | null;
  purchase: { order_id: number; status: string; created_at: string } | null;
}

export interface DashEventRow {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  starts_at: string;
  ends_at: string;
  created_by: string;
  stopped_at: string | null;
  created_at: string;
}

// Only Show and Tell exists on the participant side (lib/platform/events.ts), so it is the only event type an owner can plan here.
export const EVENT_TYPES: Record<string, string> = {
  show_and_tell: "Show and Tell",
};

export interface FormSubmissionRow {
  id: string;
  form_key: string;
  slack_id: string;
  name: string;
  answers: Record<string, string>;
  status: "pending" | "accepted" | "rejected";
  decided_by: string;
  decided_at: string | null;
  decision_note: string;
  created_at: string;
  interesting_at: string | null;
  interesting_by: string;
}

export interface FormQuestion {
  key: string;
  label: string;
}

export interface FormConfigRow {
  form_key: string;
  title: string;
  description: string;
  questions: FormQuestion[];
  close_at: string | null;
  updated_by: string;
  updated_at: string;
}

export interface ShowNTellRound {
  id: number;
  title: string;
  is_open: boolean;
  opened_at: string | null;
  closed_at: string | null;
  created_by: string;
  created_at: string;
}

export interface ShowNTellEntry {
  id: number;
  round_id: number;
  project_id: number | null;
  added_by: string;
  project_name: string;
  project_owner: string;
  vote_count: number;
  voters: { id: string; name: string; voted_at: string }[];
}

export interface ReferralRow {
  id: number;
  referrer_id: string;
  referred_id: string;
  created_at: string;
  // When the referred builder first got a project approved (the qualification point, plans/02 section 16). Null until then.
  qualified_at: string | null;
  referrer_name: string;
  referred_name: string;
}

export interface ReferrerLeaderboardRow {
  referrerId: string;
  name: string;
  total: number;
  qualified: number;
}

export interface VaultReward {
  label?: string;
}

export interface VaultLevelRow {
  id: number;
  level: number;
  energy_required: number;
  title: string;
  blurb: string;
  rewards: VaultReward[];
  position: number;
  active: boolean;
  unlocked_at: string | null;
}

export interface ShopCsvRow {
  key: string;
  name: string;
  price: number;
  description: string;
  options: string;
}

// ---- People ----
// The same handles the rest of the site uses: the community leaderboard's builders and the builders of the review ships.
export const HANDLES: string[] = [...new Set([...BUILDERS.map((b) => b.handle), ...REVIEW_SHIPS.map((s) => s.builder)])];
const STAFF: string[] = REVIEWERS.map((r) => r.handle);
const handle = (i: number): string => HANDLES[((i % HANDLES.length) + HANDLES.length) % HANDLES.length];
const staff = (i: number): string => STAFF[((i % STAFF.length) + STAFF.length) % STAFF.length] ?? "owner";

// ---- Shop ----
// One row for every item in LOADOUT's proposed catalogue (lib/platform/shop.ts). The price is the item's base Ore price, the same
// everywhere (plans/02 section 26); the tracks and the requisition rule are read from the catalogue, never typed in a second place.
const OPTIONS: Record<string, string[]> = {
  "api-credits": ["Provider: Provider A, Provider B"],
  "mechanical-keyboard": ["Layout: ANSI, ISO", "Switch: Linear, Tactile, Clicky"],
  "raspberry-pi-5": ["RAM: 4 GB, 8 GB"],
  "macropad-kit": ["Switches: Red, Brown, Blue"],
};

// Whether an item can take a Requisition: a matching track and a base price of at least 400 Ore (plans/02). Shown as a note only.
export function requisitionNote(row: Pick<ShopItemRow, "price" | "tracks">): string {
  if (row.price < REQUISITION_MIN_ORE) return `Below ${REQUISITION_MIN_ORE} Ore: no Requisition applies.`;
  return row.tracks.length > 0 ? `Field Requisition eligible (${row.tracks.join(", ")}). General Requisition eligible.` : "General Requisition eligible. No Field Requisition: the item has no track.";
}

function buildShop(): ShopItemRow[] {
  return SHOP_ITEMS.map((item, index) => ({
    id: 101 + index,
    name: item.name,
    description: item.blurb,
    price: item.baseOre,
    image_url: "",
    options: OPTIONS[item.id] ?? [],
    active: item.id !== "pico-8",
    position: index,
    created_by: staff(index),
    created_at: at(24 * (60 - (index % 40))),
    region: "ALL" as const,
    unlock_xp: 0,
    category: shopCategoryOf(item.kind),
    tracks: [...item.tracks],
    unlock_trial_ids: [],
    manual_locked: !!item.need,
    lock_note: item.need ? `Needs ${item.need.track} level ${item.need.level} (proposed).` : "",
    beacon_locked: false,
    discount_percent: 0,
    reserved_user_id: null,
    price_source_url: item.kind === "Travel" || item.kind === "Learning" || item.name.includes("grant") ? "" : `https://shop-source.invalid/${item.id}`,
    alt_source_url: index % 4 === 0 && !item.name.includes("grant") ? `https://alt-source.invalid/${item.id}` : null,
    config_options: null,
  }));
}

const PERSONAL_NAMES = [
  { name: "Replacement microscope camera", ore: 95, handle: "nullwisp", active: true },
  { name: "Replacement power adapter set", ore: 40, handle: "brasskettle", active: false },
];

function buildPersonal(startId: number): PersonalShopItem[] {
  return PERSONAL_NAMES.map((entry, i) => ({
    id: startId + i,
    name: entry.name,
    description: "Quoted for one builder: the item is not in the catalogue. Priced in Ore like any other.",
    price: entry.ore,
    image_url: "",
    options: [],
    active: entry.active,
    position: 0,
    created_by: staff(i),
    created_at: at(48 + i * 30),
    region: "ALL",
    unlock_xp: 0,
    category: "other",
    tracks: [],
    unlock_trial_ids: [],
    manual_locked: false,
    lock_note: "",
    beacon_locked: false,
    discount_percent: 0,
    reserved_user_id: `u-${entry.handle}`,
    price_source_url: "",
    alt_source_url: null,
    config_options: null,
    owner: { id: `u-${entry.handle}`, display_name: entry.handle, slack_id: entry.handle },
    purchase: i === 1 ? { order_id: 4120, status: "pending", created_at: at(10) } : null,
  }));
}

function buildStock(items: ShopItemRow[]): Map<number, ShopOptionStockRow[]> {
  const map = new Map<number, ShopOptionStockRow[]>();
  for (const row of items) {
    if (row.name === "Hot-swap mechanical keyboard") {
      map.set(row.id, [
        { choice: "Linear", total: 20, remaining: 11 },
        { choice: "Tactile", total: 20, remaining: 0 },
        { choice: "Clicky", total: 10, remaining: 6 },
      ]);
    }
    if (row.name === "DIY macropad kit") map.set(row.id, [{ choice: "Red", total: 15, remaining: 4 }]);
  }
  return map;
}

// ---- Events ----
// Only Show and Tell is planned (lib/platform/events.ts), so every event is a Show and Tell session. The config holds a plain note.
function buildEvents(): DashEventRow[] {
  const ev = (id: number, name: string, note: string, startH: number, endH: number, stopped = false): DashEventRow => ({
    id: String(id),
    type: "show_and_tell",
    name,
    config: { note },
    starts_at: at(startH),
    ends_at: at(endH),
    created_by: staff(id),
    stopped_at: stopped ? at(startH - 20) : null,
    created_at: at(startH + 72),
  });
  const past = [...SESSIONS].filter((session) => session.status === "past").sort((a, b) => a.number - b.number);
  const rows = past.map((session, i) => ev(i + 1, `Show and Tell ${session.number}: ${session.title}`, session.summary, 600 - i * 220, 560 - i * 220));
  return [
    ev(past.length + 2, "Show and Tell 4 (draft)", "Draft window. The date is not confirmed.", -24 * 12, -24 * 12 - 2),
    ev(past.length + 1, "Show and Tell, cancelled slot", "A session that was planned and called off.", 80, 76, true),
    ...rows,
  ];
}

// ---- Forms ----
const Q = (key: string, label: string): FormQuestion => ({ key, label });
function buildForms(): { configs: FormConfigRow[]; submissions: FormSubmissionRow[] } {
  const configs: FormConfigRow[] = [
    {
      form_key: "reviewer",
      title: "Become a reviewer",
      description: "A short application to join the review team. Sample form: the wording is a placeholder.",
      questions: [Q("experience", "What have you built that you could review fairly?"), Q("hours", "How many hours a week could you review?"), Q("why", "Why do you want to review?")],
      close_at: at(-24 * 20),
      updated_by: staff(0),
      updated_at: at(60),
    },
    {
      form_key: "custom-order",
      title: "Custom Order request",
      description: "Ask the team to source an item that is not in the catalogue. Draft questions, not open yet.",
      questions: [Q("item", "What would you like the team to source?"), Q("where", "Where can the team see it for sale?"), Q("help", "How would it help the work you are building?")],
      close_at: null,
      updated_by: staff(1),
      updated_at: at(120),
    },
    {
      form_key: "event-registration",
      title: "Event registration",
      description: "Registers a builder for an in-person event once dates are confirmed. Closed in this sample.",
      questions: [Q("name", "Name on the badge"), Q("diet", "Anything we should know about food?"), Q("travel", "Travelling from where?")],
      close_at: at(24),
      updated_by: staff(2),
      updated_at: at(300),
    },
    {
      form_key: "guardian-consent",
      title: "Guardian consent",
      description: "A guardian confirms a builder may attend. Draft.",
      questions: [Q("guardian", "Guardian name"), Q("contact", "Contact handle"), Q("agree", "Do you agree to the event terms?")],
      close_at: null,
      updated_by: staff(0),
      updated_at: at(500),
    },
  ];
  const answers: Record<string, string[][]> = {
    reviewer: [
      ["Built a CI bot and two small CLIs, and reviewed a friend's keyboard firmware.", "6", "I like reading other people's code and explaining what is unclear."],
      ["A weather station and a Rust log parser.", "4", "Reviews helped me get better, I want to give that back."],
      ["Mostly web tools. I have shipped three projects here.", "8", "I can cover Tools reviews at weekends."],
    ],
    "custom-order": [
      ["A thermal paste syringe set", "A parts shop listing, link in the project README.", "I am building a heat sink test rig."],
      ["A used oscilloscope probe", "A second-hand listing.", "My current probe has a broken ground clip."],
    ],
    "event-registration": [
      ["tinwren", "Vegetarian.", "By train from the north."],
      ["quartzfox", "No restrictions.", "By car."],
      ["solderbee", "Nut allergy.", "By train."],
    ],
    "guardian-consent": [["A guardian (sample)", "guardian-handle", "Yes"], ["A guardian (sample)", "guardian-handle-2", "Yes"]],
  };
  const submissions: FormSubmissionRow[] = [];
  let id = 0;
  for (const config of configs) {
    (answers[config.form_key] ?? []).forEach((vals, i) => {
      id += 1;
      const rowId = String(id);
      const status: FormSubmissionRow["status"] = i === 0 && config.form_key !== "custom-order" ? "accepted" : i === 1 && config.form_key === "event-registration" ? "rejected" : "pending";
      const h = handle(id + 2);
      submissions.push({
        id: rowId,
        form_key: config.form_key,
        slack_id: h,
        name: h,
        answers: Object.fromEntries(config.questions.map((q, qi) => [q.key, vals[qi] ?? ""])),
        status,
        decided_by: status === "pending" ? "" : staff(id),
        decided_at: status === "pending" ? null : at(20 + id),
        decision_note: status === "rejected" ? "Not enough detail yet. Try again with an example." : "",
        created_at: at(30 + id * 7),
        interesting_at: status === "pending" && i === 0 && config.form_key === "reviewer" ? at(12) : null,
        interesting_by: status === "pending" && i === 0 && config.form_key === "reviewer" ? staff(1) : "",
      });
    });
  }
  return { configs, submissions };
}

// ---- Show & Tell ----
function buildShow(): { rounds: ShowNTellRound[]; entries: ShowNTellEntry[] } {
  const rounds: ShowNTellRound[] = [];
  const entries: ShowNTellEntry[] = [];
  let entryId = 0;
  const sessions = [...SESSIONS].filter((s) => s.status === "past").sort((a, b) => a.number - b.number);
  sessions.forEach((session, i) => {
    const open = i === sessions.length - 1;
    rounds.push({
      id: i + 1,
      title: `Session ${session.number}: ${session.title}`,
      is_open: open,
      opened_at: at(24 * (30 - i * 9)),
      closed_at: open ? null : at(24 * (28 - i * 9)),
      created_by: staff(i),
      created_at: at(24 * (32 - i * 9)),
    });
    session.showcases.forEach((showcase, j) => {
      entryId += 1;
      const voters = HANDLES.filter((_, k) => (k + j + i) % 3 !== 0).slice(0, 2 + ((i + j) % 4));
      entries.push({
        id: entryId,
        round_id: i + 1,
        project_id: j === 2 && i === 0 ? null : 2040 + entryId,
        added_by: staff(j),
        project_name: showcase.title,
        project_owner: showcase.handle,
        vote_count: voters.length,
        voters: voters.map((v, k) => ({ id: `u-${v}`, name: v, voted_at: at(24 * (28 - i * 9) + k) })),
      });
    });
  });
  return { rounds, entries };
}

// ---- Referrals ----
// A referral is a builder who joined through another builder's link. It qualifies at the invited builder's first approved ship
// (plans/02 section 16). No reward is set, so there is no reward in the rows.
function buildReferrals(): ReferralRow[] {
  const pool = [...HANDLES];
  const referred = ["emberlark", "cobaltmoth", "fennelbyte", "gridsparrow", "hexwillow", "ironpetal", "juniperbit", "kelpvolt", "lumenfox", "marlpine", "nickelwren", "oakcircuit", "pewterlynx", "quillbolt", "rustfinch", "sablegear", "tarnhare", "umberbyte", "violetpin", "wickerlamp", "yarrowcpu", "zincmoth", "alderwatt", "birchsolder", "cedarflux", "duskresistor", "elmtrace", "flintping", "gorsebit", "hazelcore", "indigovia", "jasperlink", "knotweed", "larchbyte", "mossdiode", "nettlefan", "olivetick", "pineslot", "quartzbit", "reedpulse"];
  const rows: ReferralRow[] = [];
  for (let i = 0; i < 40; i += 1) {
    const referrer = i < 16 ? pool[0] : i < 23 ? pool[1 % pool.length] : pool[(i * 3) % pool.length];
    const qualified = i % 3 !== 2;
    rows.push({
      id: 40 - i,
      referrer_id: `u-${referrer}`,
      referred_id: `u-${referred[i]}`,
      created_at: at(8 + i * 17),
      qualified_at: qualified ? at(2 + i * 15) : null,
      referrer_name: referrer,
      referred_name: referred[i],
    });
  }
  return rows;
}

// ---- Vault levels ----
// A community goal here is an Era: the whole community's approved hours (not Ore, and nothing a builder spends) have to reach the
// Era's threshold for the next Era to begin at an eligible weekly reset (lib/platform/community.ts). The field names stay Pixl's
// (energy_required, level) so the copied types line up; the page calls them what they are.
function buildVault(): VaultLevelRow[] {
  const rewards: VaultReward[][] = [
    [{ label: "Era badge" }],
    [{ label: "Era badge" }, { label: "One General Requisition each (proposed)" }],
    [{ label: "Era badge" }, { label: "Shared collectible (proposed)" }],
    [{ label: "Era badge" }],
    [{ label: "Era badge" }, { label: "Community build night" }],
  ];
  const blurbs = [
    "The first Era. Every approved hour counts toward the next one.",
    "Approved work from every track moves the community on.",
    GOALS[0].text,
    "Tools, Systems, Compute and Hardware each need an approved project in the Era.",
    "The last Era in this sample ladder.",
  ];
  return [...COMMUNITY_ERAS].map((era, i) => ({
    id: i + 1,
    level: i + 1,
    energy_required: [400, 1000, 2000, 3200, 4800][i],
    title: era,
    blurb: blurbs[i] ?? "",
    rewards: rewards[i] ?? [],
    position: i + 1,
    active: i !== 4,
    unlocked_at: i < 2 ? at(24 * (50 - i * 20)) : null,
  }));
}

// ---- Ideas ----
export interface IdeaSeed {
  id: number;
  user_id: string;
  title: string;
  body: string;
  created_at: string;
  banned_at: string | null;
  ban_reason: string;
  ban_by: string;
  users: { id: string; display_name: string; real_name: string };
}

function buildIdeas(): IdeaSeed[] {
  const extra = [
    "Dark mode for the journal editor", "Export a project as a printable one-pager", "A parts list that totals the cost", "Reminders when a journal is 8 hours behind",
    "A tag for projects that need a second pair of eyes", "Show build time per track on the profile", "A glossary for review words", "Keyboard shortcuts for the desk",
    "A weekly digest of approved projects", "Mark a project as a collaboration", "Photo galleries for hardware projects", "A checklist before shipping",
    "Compare two journals side by side", "A template for write-ups", "Save a search on Explore", "A way to thank a reviewer", "Filter Explore by licence", "Offline draft for journals",
    "Project timeline view",
  ];
  const seeds = [
    ...IDEAS.map((idea) => ({ title: idea.title, body: idea.body, handle: idea.handle })),
    ...extra.map((title, i) => ({ title, body: `Sample idea: ${title.toLowerCase()}. Posted to the ideas board by a builder.`, handle: handle(i + 3) })),
  ].slice(0, 25);
  return seeds.map((seed, i) => ({
    id: 25 - i,
    user_id: `u-${seed.handle}`,
    title: seed.title,
    body: seed.body,
    created_at: at(6 + i * 19),
    banned_at: i === 4 || i === 13 ? at(3 + i) : null,
    ban_reason: i === 4 ? "Duplicate of an existing idea." : i === 13 ? "Off topic." : "",
    ban_by: i === 4 || i === 13 ? staff(i) : "",
    users: { id: `u-${seed.handle}`, display_name: seed.handle, real_name: "" },
  }));
}

// ---- The store ----
type Store = {
  shop: ShopItemRow[];
  personal: PersonalShopItem[];
  stock: Map<number, ShopOptionStockRow[]>;
  events: DashEventRow[];
  configs: FormConfigRow[];
  submissions: FormSubmissionRow[];
  rounds: ShowNTellRound[];
  entries: ShowNTellEntry[];
  referrals: ReferralRow[];
  vault: VaultLevelRow[];
  ideas: IdeaSeed[];
  nextId: number;
};

const KEY = "__loadoutReviewerContentStoreV3";
const root = globalThis as unknown as Record<string, Store | undefined>;

function seed(): Store {
  const shop = buildShop();
  const forms = buildForms();
  const show = buildShow();
  const maxId = shop.reduce((m, r) => Math.max(m, r.id), 0);
  return {
    shop,
    personal: buildPersonal(maxId + 1),
    stock: buildStock(shop),
    events: buildEvents(),
    configs: forms.configs,
    submissions: forms.submissions,
    rounds: show.rounds,
    entries: show.entries,
    referrals: buildReferrals(),
    vault: buildVault(),
    ideas: buildIdeas(),
    nextId: 10_000,
  };
}

export const content: Store = (root[KEY] ??= seed());

export function nextContentId(): number {
  content.nextId += 1;
  return content.nextId;
}

// The account name Pixl stores in `created_by`: here, the handle.
export const SAMPLE_ACTOR = "owner";

// Projects a Show & Tell entry can be picked from: the review ships.
export function shippableProjects(): { id: number; name: string; owner: string }[] {
  return REVIEW_SHIPS.map((ship) => ({ id: Number(ship.id.replace(/\D/g, "")), name: ship.title, owner: ship.builder }));
}
