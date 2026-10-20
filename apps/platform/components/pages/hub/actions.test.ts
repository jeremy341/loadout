import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";

// These tests run the real preview store against an in-memory localStorage, so they cover the whole path a button
// takes: claim, approve, credit the ledger once, notify, export, import, reset.

class MemoryStorage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  key(index: number) {
    return Array.from(this.map.keys())[index] ?? null;
  }
  getItem(key: string) {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, String(value));
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
}

const storage = new MemoryStorage();
// Installed when this file's tests start, not when it loads: other test files (Gear) install their own fake window
// at load time, and bun loads every file before running any.
function installWindow() {
  Object.assign(globalThis, {
    window: { localStorage: storage, addEventListener() {}, removeEventListener() {} },
  });
}

const store = await import("../../../lib/preview-store");
const { ORE_LEDGER_KEY, SEED_ORE_LEDGER, oreBalance } = await import("../../../lib/ore-ledger");
const { NOTIFICATIONS_KEY, SEED_NOTIFICATIONS } = await import("../../../lib/notifications");
const actions = await import("./actions");
const { HUB_KEYS } = await import("./data");
const { CREDIT_KEY, CREDIT_REASON, CREDIT_SOURCE } = await import("./logic/claims");
const { parseImport } = await import("./logic/transfer");

type Ledger = { id: string; amount: number; reason: string; source: string }[];
const ledger = () => store.getPreview<Ledger>(ORE_LEDGER_KEY, SEED_ORE_LEDGER);
const notes = () => store.getPreview<{ title: string }[]>(NOTIFICATIONS_KEY, SEED_NOTIFICATIONS);
const credits = () => ledger().filter((e) => e.source === CREDIT_SOURCE && e.reason === CREDIT_REASON);

const projects = [{ id: "p1", name: "Quickshell" }];
const claim = { projectId: "p1", link: "https://example.org/pull/7", note: "", attested: true };

beforeAll(installWindow);

beforeEach(() => {
  installWindow();
  storage.clear();
  store.resetPreviewData();
});

// Do not leave a fake window behind for other test files in the same run.
afterAll(() => {
  store.resetPreviewData();
  Reflect.deleteProperty(globalThis, "window");
});

describe("external-contributor claim", () => {
  test("a pending claim credits nothing until it is approved", () => {
    expect(actions.submitContributorClaimNow(claim, projects)).toEqual({ ok: true });
    expect(credits()).toHaveLength(0);
    expect(oreBalance(ledger() as never)).toBe(120);
  });

  test("approval adds +50 Ore once, notifies, and marks the achievement earned", () => {
    actions.submitContributorClaimNow(claim, projects);
    const before = notes().length;
    expect(actions.approveContributorClaimNow()).toBe("credited");
    expect(credits()).toHaveLength(1);
    expect(credits()[0].amount).toBe(50);
    expect(oreBalance(ledger() as never)).toBe(170);
    expect(notes().length).toBe(before + 1);
    const earned = store.getPreview<Record<string, string>>(HUB_KEYS.earned, {});
    expect(Object.keys(earned)).toEqual(["outside-contribution"]);
    const claims = store.getPreview<{ credited: Record<string, { ledgerId: string }> }>(HUB_KEYS.claims, { credited: {} });
    expect(claims.credited[CREDIT_KEY].ledgerId).toBe(credits()[0].id);
  });

  test("approving again, many times, never adds more Ore", () => {
    actions.submitContributorClaimNow(claim, projects);
    actions.approveContributorClaimNow();
    for (let i = 0; i < 5; i += 1) expect(actions.approveContributorClaimNow()).toBe("nothing-to-approve");
    expect(credits()).toHaveLength(1);
    expect(oreBalance(ledger() as never)).toBe(170);
  });

  test("a second claim cannot be recorded after the credit", () => {
    actions.submitContributorClaimNow(claim, projects);
    actions.approveContributorClaimNow();
    expect(actions.submitContributorClaimNow(claim, projects).ok).toBe(false);
  });

  test("a rejected claim credits nothing, and a later one can still be approved once", () => {
    actions.submitContributorClaimNow(claim, projects);
    actions.rejectContributorClaimNow();
    expect(actions.approveContributorClaimNow()).toBe("nothing-to-approve");
    expect(credits()).toHaveLength(0);
    expect(actions.submitContributorClaimNow(claim, projects).ok).toBe(true);
    expect(actions.approveContributorClaimNow()).toBe("credited");
    expect(credits()).toHaveLength(1);
  });

  test("a ledger that already holds the credit blocks a second one even if the guard was lost", () => {
    actions.submitContributorClaimNow(claim, projects);
    actions.approveContributorClaimNow();
    store.setPreview(HUB_KEYS.claims, { contributor: null, credited: {} });
    actions.submitContributorClaimNow(claim, projects);
    expect(actions.approveContributorClaimNow()).toBe("already-credited");
    expect(credits()).toHaveLength(1);
  });

  test("withdrawing a pending claim leaves no claim and no Ore", () => {
    actions.submitContributorClaimNow(claim, projects);
    actions.withdrawContributorClaimNow();
    expect(store.getPreview<{ contributor: unknown }>(HUB_KEYS.claims, { contributor: 1 }).contributor).toBeNull();
    expect(credits()).toHaveLength(0);
  });
});

describe("recordEarned", () => {
  test("records new ids once, with one notification for a batch", () => {
    const before = notes().length;
    expect(actions.recordEarned(["first-project", "first-journal"])).toEqual(["first-project", "first-journal"]);
    expect(notes().length).toBe(before + 1);
    const first = store.getPreview<Record<string, string>>(HUB_KEYS.earned, {})["first-project"];
    expect(actions.recordEarned(["first-project", "first-journal"])).toEqual([]);
    expect(notes().length).toBe(before + 1);
    expect(store.getPreview<Record<string, string>>(HUB_KEYS.earned, {})["first-project"]).toBe(first);
  });
});

describe("export, import and reset against real storage", () => {
  test("export holds every preview key and not other storage", () => {
    // Written straight to storage under the active prefix, so this holds even when another test file has replaced
    // the preview store with a stand-in (bun's mock.module is process-wide).
    storage.setItem(`${store.PREVIEW_PREFIX}hub.profile`, JSON.stringify({ displayName: "Nova" }));
    storage.setItem(`${store.PREVIEW_PREFIX}gear.wishlist`, JSON.stringify([{ itemId: "x" }]));
    storage.setItem("loadout-theme", "light");
    const entries = actions.readStoredEntries();
    expect(Object.keys(entries).sort()).toEqual(["gear.wishlist", "hub.profile"]);
    storage.removeItem("loadout-theme");
  });

  test("import replaces everything, and reset clears it", () => {
    store.setPreview("hub.profile", { displayName: "Old" });
    store.setPreview("gear.wishlist", [{ itemId: "x" }]);
    const file = JSON.stringify({
      format: "loadout-platform-preview",
      version: 1,
      exportedAt: "2026-10-20T10:00:00.000Z",
      entries: { "hub.profile": { displayName: "New" } },
    });
    const parsed = parseImport(file);
    if (!parsed.ok) throw new Error(parsed.error);
    actions.applyImportNow(parsed);
    expect(store.getPreview("hub.profile", null)).toEqual({ displayName: "New" });
    expect(store.getPreview("gear.wishlist", "gone")).toBe("gone");
    actions.resetAllPreviewDataNow();
    expect(Object.keys(actions.readStoredEntries())).toEqual([]);
  });
});
