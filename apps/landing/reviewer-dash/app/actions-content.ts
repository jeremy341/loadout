"use server";
// The Content group's server actions (shop, item details, events, forms, Show & Tell, community goals). Same names and call
// shapes as Pixl's app/actions.ts. Each checks the owner role, runs Pixl's input rules, and changes only the in-memory sample
// store (../lib/sample/content-data.ts), which is empty again when the server restarts. No Slack, image upload or other service
// is called. The layout says "Sample data. Nothing was saved." once on every page. Re-exported from ./actions.ts.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePage } from "../lib/guard";
import { serializeGroups } from "../lib/shopOptions";
import {
  content,
  EVENT_TYPES,
  nextContentId,
  SAMPLE_ACTOR,
  SHOP_CATEGORIES,
  shippableProjects,
  type PersonalShopItem,
  type ShopCategory,
  type ShopCsvRow,
} from "../lib/sample/content-data";

export type { ShopCsvRow };

const refresh = (): void => revalidatePath("/", "layout");
const actor = (): string => SAMPLE_ACTOR;
const num = (data: FormData, key: string): number => Number(data.get(key) ?? 0);
const text = (data: FormData, key: string, max: number): string => String(data.get(key) ?? "").trim().slice(0, max);

const TRACKS = ["Tools", "Systems", "Compute", "Hardware"];
// The tracks an item relates to, from the form's ticked boxes. None ticked means General.
const readTracks = (data: FormData): string[] => [...new Set(data.getAll("tracks").map(String))].filter((track) => TRACKS.includes(track));

function readCategory(raw: string): ShopCategory {
  return (SHOP_CATEGORIES as readonly string[]).includes(raw) ? (raw as ShopCategory) : "other";
}

function readOptions(raw: string): string[] {
  const s = raw.trim();
  if (!s) return [];
  if (s.startsWith("[")) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return serializeGroups(
          parsed.map((g) => ({ name: String(g?.name ?? ""), choices: Array.isArray(g?.choices) ? g.choices.map(String) : [] })),
        );
      }
    } catch {
      /* fall through to the comma list */
    }
  }
  return serializeGroups([{ name: "", choices: s.split(",") }]);
}

function shopItemError(message: string): never {
  redirect(`/shop?shopError=${encodeURIComponent(message)}`);
}

// ---- Shop ----

export async function addShopItem(formData: FormData): Promise<void> {
  await requirePage("owner");
  const name = text(formData, "name", 60);
  const description = text(formData, "description", 300);
  const price = Math.max(0, Math.round(num(formData, "price")));
  const options = readOptions(String(formData.get("options") ?? ""));
  const category = readCategory(String(formData.get("category") ?? ""));
  if (!name) return;
  if (content.shop.some((r) => r.name === name)) shopItemError(`${name} is already in the shop.`);
  const position = content.shop.reduce((m, r) => Math.max(m, r.position), 0) + 1;
  content.shop.push({
    id: nextContentId(),
    name,
    description,
    price,
    image_url: "",
    options,
    active: true,
    position,
    created_by: actor(),
    created_at: new Date().toISOString(),
    region: "ALL",
    unlock_xp: 0,
    category,
    tracks: readTracks(formData),
    unlock_trial_ids: [],
    manual_locked: false,
    lock_note: "",
    beacon_locked: false,
    discount_percent: 0,
    reserved_user_id: null,
    price_source_url: "",
    alt_source_url: null,
    config_options: null,
  });
  refresh();
}

export async function updateShopItem(formData: FormData): Promise<void> {
  await requirePage("owner");
  const id = num(formData, "id");
  const row = content.shop.find((r) => r.id === id);
  if (!row) return;
  const name = text(formData, "name", 60);
  if (!name) shopItemError("An item needs a name.");
  if (content.shop.some((r) => r.id !== id && r.name === name)) shopItemError(`${name} is already in the shop.`);
  Object.assign(row, {
    name,
    description: text(formData, "description", 300),
    price: Math.max(0, Math.round(num(formData, "price"))),
    options: readOptions(String(formData.get("options") ?? "")),
    category: readCategory(String(formData.get("category") ?? "")),
    tracks: readTracks(formData),
    manual_locked: formData.get("manual_locked") === "1",
    lock_note: text(formData, "lock_note", 300),
  });
  refresh();
}

// The supplier reference for one item: the Ore price (one, the same everywhere) and the links the team priced it from.
export async function updateShopItemDetails(formData: FormData): Promise<void> {
  await requirePage("owner");
  const row = content.shop.find((r) => r.id === num(formData, "id"));
  if (!row) return;
  const price = formData.get("price");
  if (price != null) row.price = Math.max(0, Math.round(Number(price)));
  const source = formData.get("source");
  if (typeof source === "string") row.price_source_url = source.trim().slice(0, 500);
  const alt = formData.get("alt_source");
  if (typeof alt === "string") row.alt_source_url = alt.trim().slice(0, 500) || null;
  refresh();
}

export async function toggleShopItem(formData: FormData): Promise<void> {
  await requirePage("owner");
  const id = num(formData, "id");
  const active = String(formData.get("active") ?? "") === "1";
  const row = content.shop.find((r) => r.id === id);
  if (!row) return;
  row.active = active;
  refresh();
}

export async function deleteShopItem(formData: FormData): Promise<void> {
  await requirePage("owner");
  const id = num(formData, "id");
  if (!id) return;
  content.shop = content.shop.filter((r) => r.id !== id);
  content.stock.delete(id);
  refresh();
}

export async function checkShopItemsConflicts(rows: ShopCsvRow[]): Promise<Record<string, { id: number; price: number; description: string }>> {
  await requirePage("owner");
  const out: Record<string, { id: number; price: number; description: string }> = {};
  for (const r of rows) {
    const hit = content.shop.find((s) => s.name === r.name);
    if (hit) out[r.key] = { id: hit.id, price: hit.price, description: hit.description };
  }
  return out;
}

export async function commitShopItemsCsv(
  rows: ShopCsvRow[],
  conflicts: Record<string, number>,
  resolutions: Record<string, "replace" | "skip">,
): Promise<{ added: number; replaced: number; skipped: number; errors: string[] }> {
  await requirePage("owner");
  let added = 0;
  let replaced = 0;
  let skipped = 0;
  const errors: string[] = [];
  for (const r of rows) {
    const name = r.name.trim().slice(0, 60);
    if (!name) {
      errors.push(`Row ${r.key}: a name is required.`);
      continue;
    }
    const existingId = conflicts[r.key];
    if (existingId) {
      if (resolutions[r.key] !== "replace") {
        skipped += 1;
        continue;
      }
      const row = content.shop.find((s) => s.id === existingId);
      if (row) {
        Object.assign(row, { price: Math.max(0, Math.round(r.price)), description: r.description.slice(0, 300), options: readOptions(r.options) });
        replaced += 1;
        continue;
      }
    }
    content.shop.push({
      id: nextContentId(),
      name,
      description: r.description.slice(0, 300),
      price: Math.max(0, Math.round(r.price)),
      image_url: "",
      options: readOptions(r.options),
      active: true,
      position: content.shop.reduce((m, s) => Math.max(m, s.position), 0) + 1,
      created_by: actor(),
      created_at: new Date().toISOString(),
      region: "ALL",
      unlock_xp: 0,
      category: "other",
      tracks: [],
      unlock_trial_ids: [],
      manual_locked: false,
      lock_note: "",
      beacon_locked: false,
      discount_percent: 0,
      reserved_user_id: null,
      price_source_url: "",
      alt_source_url: null,
      config_options: null,
    });
    added += 1;
  }
  refresh();
  return { added, replaced, skipped, errors };
}

function personalItemError(message: string): never {
  redirect(`/shop?personalError=${encodeURIComponent(message)}`);
}

export async function createPersonalShopItem(formData: FormData): Promise<void> {
  await requirePage("owner");
  const name = text(formData, "name", 60);
  const builder = text(formData, "builder", 80);
  const price = Math.round(num(formData, "price"));
  if (!name) personalItemError("Give the item a name.");
  if (!builder) personalItemError("Name the builder this item is for.");
  if (!(price > 0)) personalItemError("Give the item a price above 0.");
  const item: PersonalShopItem = {
    id: nextContentId(),
    name,
    description: text(formData, "description", 300),
    price,
    image_url: "",
    options: readOptions(String(formData.get("options") ?? "")),
    active: formData.get("active") === "1",
    position: 0,
    created_by: actor(),
    created_at: new Date().toISOString(),
    region: "ALL",
    unlock_xp: 0,
    category: "other",
    tracks: [],
    unlock_trial_ids: [],
    manual_locked: false,
    lock_note: "",
    beacon_locked: false,
    discount_percent: 0,
    reserved_user_id: `u-${builder}`,
    price_source_url: "",
    alt_source_url: null,
    config_options: null,
    owner: { id: `u-${builder}`, display_name: builder, slack_id: builder },
    purchase: null,
  };
  content.personal.unshift(item);
  refresh();
}

export async function setPersonalShopItemActive(formData: FormData): Promise<void> {
  await requirePage("owner");
  const item = content.personal.find((i) => i.id === num(formData, "id"));
  if (!item) return;
  item.active = formData.get("active") === "1";
  refresh();
}

export async function deletePersonalShopItem(formData: FormData): Promise<void> {
  await requirePage("owner");
  const id = num(formData, "id");
  const item = content.personal.find((i) => i.id === id);
  if (!item) return;
  if (item.purchase) personalItemError(`"${item.name}" has orders on it, hide it instead of deleting it.`);
  content.personal = content.personal.filter((i) => i.id !== id);
  refresh();
}

// ---- Events ----

export async function createEvent(formData: FormData): Promise<void> {
  await requirePage("owner");
  const type = String(formData.get("type") ?? "");
  const fail = (msg: string): never => redirect(`/events?error=${encodeURIComponent(msg)}`);
  if (!(type in EVENT_TYPES)) fail("Pick an event type.");
  const name = text(formData, "name", 100);
  if (!name) fail("Give the event a name builders will see.");
  const startsRaw = text(formData, "startsAt", 40);
  const endsRaw = text(formData, "endsAt", 40);
  const starts = startsRaw ? new Date(startsRaw + "Z") : new Date();
  const ends = new Date(endsRaw + "Z");
  if (!endsRaw || isNaN(ends.getTime())) fail("An end time is required.");
  if (isNaN(starts.getTime()) || ends <= starts) fail("The event must end after it starts.");
  content.events.push({
    id: nextContentId(),
    type,
    name,
    config: { note: text(formData, "note", 500) },
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    created_by: actor(),
    stopped_at: null,
    created_at: new Date().toISOString(),
  });
  refresh();
  redirect("/events?created=1");
}

export async function stopEvent(formData: FormData): Promise<void> {
  await requirePage("owner");
  const event = content.events.find((e) => e.id === num(formData, "id"));
  if (event && !event.stopped_at) event.stopped_at = new Date().toISOString();
  refresh();
}

export async function deleteEvent(formData: FormData): Promise<void> {
  await requirePage("owner");
  const id = num(formData, "id");
  content.events = content.events.filter((e) => e.id !== id);
  refresh();
}

// ---- Forms ----

export async function saveFormConfig(formData: FormData): Promise<void> {
  await requirePage("owner");
  const formKey = text(formData, "formKey", 50);
  if (!/^[a-z0-9_-]{1,50}$/.test(formKey)) return;
  const closeRaw = text(formData, "closeAt", 40);
  const close = closeRaw ? new Date(closeRaw) : null;
  let questions: { key: string; label: string }[] = [];
  try {
    const parsed: unknown = JSON.parse(String(formData.get("questionsJson") ?? "[]"));
    if (Array.isArray(parsed)) {
      questions = parsed
        .map((q) => ({ key: String(q?.key ?? "").trim().slice(0, 50), label: String(q?.label ?? "").trim().slice(0, 300) }))
        .filter((q) => q.key && q.label)
        .slice(0, 30);
    }
  } catch {
    /* keep no questions */
  }
  const next = {
    form_key: formKey,
    title: text(formData, "title", 200),
    description: text(formData, "description", 2000),
    questions,
    close_at: close && !isNaN(close.getTime()) ? close.toISOString() : null,
    updated_by: actor(),
    updated_at: new Date().toISOString(),
  };
  const at = content.configs.findIndex((c) => c.form_key === formKey);
  if (at >= 0) content.configs[at] = next;
  else content.configs.push(next);
  refresh();
}

export async function decideFormSubmission(formData: FormData): Promise<void> {
  await requirePage("owner");
  const decision = String(formData.get("decision") ?? "");
  const row = content.submissions.find((s) => s.id === num(formData, "id"));
  if (!row || (decision !== "accepted" && decision !== "rejected")) return;
  Object.assign(row, { status: decision, decided_by: actor(), decided_at: new Date().toISOString(), decision_note: text(formData, "note", 1000) });
  refresh();
}

export async function markFormSubmissionInteresting(formData: FormData): Promise<void> {
  await requirePage("owner");
  const row = content.submissions.find((s) => s.id === num(formData, "id"));
  if (!row || row.status !== "pending") return;
  Object.assign(row, { interesting_at: new Date().toISOString(), interesting_by: actor() });
  refresh();
}

export async function unmarkFormSubmissionInteresting(formData: FormData): Promise<void> {
  await requirePage("owner");
  const row = content.submissions.find((s) => s.id === num(formData, "id"));
  if (!row) return;
  Object.assign(row, { interesting_at: null, interesting_by: "" });
  refresh();
}

// ---- Show & Tell ----

export async function createShowNTellRound(formData: FormData): Promise<void> {
  await requirePage("owner");
  const title = text(formData, "title", 120);
  if (!title) return;
  content.rounds.push({ id: nextContentId(), title, is_open: false, opened_at: null, closed_at: null, created_by: actor(), created_at: new Date().toISOString() });
  refresh();
}

export async function openShowNTellRound(formData: FormData): Promise<void> {
  await requirePage("owner");
  const id = num(formData, "id");
  const round = content.rounds.find((r) => r.id === id);
  if (!round) return;
  const now = new Date().toISOString();
  for (const r of content.rounds) if (r.is_open) Object.assign(r, { is_open: false, closed_at: now });
  Object.assign(round, { is_open: true, opened_at: now, closed_at: null });
  refresh();
}

export async function closeShowNTellRound(formData: FormData): Promise<void> {
  await requirePage("owner");
  const round = content.rounds.find((r) => r.id === num(formData, "id"));
  if (round) Object.assign(round, { is_open: false, closed_at: new Date().toISOString() });
  refresh();
}

export async function addShowNTellEntry(formData: FormData): Promise<void> {
  await requirePage("owner");
  const roundId = num(formData, "roundId");
  const projectId = num(formData, "projectId");
  if (!roundId || !projectId) return;
  if (content.entries.some((e) => e.round_id === roundId && e.project_id === projectId)) return;
  const project = shippableProjects().find((p) => p.id === projectId);
  content.entries.push({ id: nextContentId(), round_id: roundId, project_id: projectId, added_by: actor(), project_name: project?.name ?? `Project #${projectId}`, project_owner: project?.owner ?? "", vote_count: 0, voters: [] });
  refresh();
}

export async function addCustomShowNTellEntry(formData: FormData): Promise<void> {
  await requirePage("owner");
  const roundId = num(formData, "roundId");
  const customName = text(formData, "customName", 120);
  if (!roundId || !customName) return;
  content.entries.push({ id: nextContentId(), round_id: roundId, project_id: null, added_by: actor(), project_name: customName, project_owner: "", vote_count: 0, voters: [] });
  refresh();
}

export async function removeShowNTellEntry(formData: FormData): Promise<void> {
  await requirePage("owner");
  const id = num(formData, "id");
  content.entries = content.entries.filter((e) => e.id !== id);
  refresh();
}

// ---- Community goals (vault levels) ----

function parseRewards(raw: string): { label: string }[] {
  return String(raw ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((l) => ({ label: l.slice(0, 80) }));
}

const goalsError = (message: string): never => redirect(`/community-goals?error=${encodeURIComponent(message)}`);

export async function addVaultLevel(formData: FormData): Promise<void> {
  await requirePage("owner");
  const level = num(formData, "level");
  const title = text(formData, "title", 80);
  if (!level || !title) goalsError("A level needs a number and a title.");
  if (content.vault.some((l) => l.level === level)) goalsError("That level number is already used.");
  content.vault.push({
    id: nextContentId(),
    level,
    energy_required: num(formData, "energy_required"),
    title,
    blurb: text(formData, "blurb", 400),
    rewards: parseRewards(String(formData.get("rewards") ?? "")),
    position: Number(formData.get("position") ?? level) || level,
    active: true,
    unlocked_at: null,
  });
  refresh();
  redirect("/community-goals?saved=1");
}

export async function updateVaultLevel(formData: FormData): Promise<void> {
  await requirePage("owner");
  const row = content.vault.find((l) => l.id === num(formData, "id"));
  if (!row) return;
  Object.assign(row, {
    level: num(formData, "level"),
    energy_required: num(formData, "energy_required"),
    title: text(formData, "title", 80),
    blurb: text(formData, "blurb", 400),
    position: num(formData, "position"),
    rewards: parseRewards(String(formData.get("rewards") ?? "")),
  });
  refresh();
  redirect("/community-goals?saved=1");
}

export async function toggleVaultLevel(formData: FormData): Promise<void> {
  await requirePage("owner");
  const row = content.vault.find((l) => l.id === num(formData, "id"));
  if (row) row.active = formData.get("active") === "1";
  refresh();
}

export async function closeVaultLevel(formData: FormData): Promise<void> {
  await requirePage("owner");
  const row = content.vault.find((l) => l.id === num(formData, "id"));
  if (!row || row.unlocked_at) goalsError("That goal is already closed.");
  else row.unlocked_at = new Date().toISOString();
  refresh();
  redirect("/community-goals?saved=1");
}

export async function deleteVaultLevel(formData: FormData): Promise<void> {
  await requirePage("owner");
  const id = num(formData, "id");
  const row = content.vault.find((l) => l.id === id);
  if (row?.unlocked_at) goalsError("A closed chapter can't be deleted.");
  content.vault = content.vault.filter((l) => l.id !== id);
  refresh();
  redirect("/community-goals?saved=1");
}
