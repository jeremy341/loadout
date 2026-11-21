import { describe, expect, test } from "bun:test";
import { deleteJournalMedia, MediaConflict, storeJournalMedia, type MediaWriteDeps } from "./media-data";
import type { ImageType } from "./uploads";

const IMAGE = { bytes: Buffer.from([1, 2, 3]), type: "png" as ImageType, width: 8, height: 6 };
const LOCK = 'lock:["journal-media:p1"]';

type Recorder = { events: string[]; removed: string[] };

function recorder(): Recorder {
  return { events: [], removed: [] };
}

function depsFor(rec: Recorder, client: unknown): MediaWriteDeps {
  return {
    client: client as MediaWriteDeps["client"],
    save: async (projectId: string) => {
      rec.events.push("save");
      return `${projectId}/new.jpg`;
    },
    remove: async (stored: string) => {
      rec.events.push(`remove:${stored}`);
      rec.removed.push(stored);
    },
  };
}

function transaction(rec: Recorder, makeTx: () => unknown, client: Record<string, unknown>): unknown {
  return {
    ...client,
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      rec.events.push("tx-start");
      try {
        const out = await fn(makeTx());
        rec.events.push("commit");
        return out;
      } catch (error) {
        rec.events.push("rollback");
        throw error;
      }
    },
  };
}

function storeHarness(options: { statusAtWrite?: string; live?: number; held?: number; oldCovers?: { id: string; path: string }[]; failCreate?: boolean } = {}) {
  const rec = recorder();
  const tx = () => ({
    $executeRaw: async (_sql: TemplateStringsArray, ...args: unknown[]) => {
      rec.events.push(`lock:${JSON.stringify(args)}`);
    },
    project: { findFirst: async () => ({ status: options.statusAtWrite ?? "draft" }) },
    journalMedia: {
      count: async (args: { where: { kind?: string } }) => {
        rec.events.push("count");
        return args.where.kind === "photo" ? (options.held ?? 0) : (options.live ?? 0);
      },
      create: async () => {
        rec.events.push("create");
        if (options.failCreate) throw new Error("db unavailable");
        return { id: "new", width: IMAGE.width, height: IMAGE.height };
      },
      findMany: async () => {
        rec.events.push("find-old");
        return (options.oldCovers ?? []).map((item) => ({ ...item }));
      },
      update: async () => {
        rec.events.push("update");
      },
    },
  });
  const client = transaction(rec, () => tx(), {});
  return { rec, deps: depsFor(rec, client) };
}

function deleteHarness(options: { found?: boolean; statusAtWrite?: string; entryId?: string | null; entryUndecidedAtWrite?: boolean } = {}) {
  const rec = recorder();
  const tx = {
    $executeRaw: async (_sql: TemplateStringsArray, ...args: unknown[]) => {
      rec.events.push(`lock:${JSON.stringify(args)}`);
    },
    project: { findFirst: async () => ({ status: options.statusAtWrite ?? "draft" }) },
    journalEntry: { findFirst: async () => (options.entryUndecidedAtWrite === false ? null : { id: "e1" }) },
    journalMedia: {
      update: async () => {
        rec.events.push("update");
      },
    },
  };
  const client = transaction(rec, () => tx, {
    journalMedia: {
      findFirst: async () => {
        rec.events.push("find-row");
        return options.found === false
          ? null
          : { id: "m1", path: "p1/m1.jpg", projectId: "p1", entryId: options.entryId ?? null, project: { status: "draft" } };
      },
    },
    journalEntry: { findFirst: async () => ({ id: "e1" }) },
  });
  return { rec, deps: depsFor(rec, client) };
}

describe("storeJournalMedia", () => {
  test("serialises on the project key and returns the new row", async () => {
    const { rec, deps } = storeHarness();
    const row = await storeJournalMedia(IMAGE, { projectId: "p1", entryId: null, kind: "photo" }, deps);
    expect(row).toEqual({ id: "new", width: 8, height: 6 });
    expect(rec.events[2]).toBe(LOCK);
    expect(rec.events.indexOf("create")).toBeGreaterThan(rec.events.indexOf(LOCK));
    expect(rec.removed).toEqual([]);
  });

  test("re-checks the cap inside the transaction and compensates the saved file", async () => {
    const { rec, deps } = storeHarness({ live: 150 });
    const error = await storeJournalMedia(IMAGE, { projectId: "p1", entryId: null, kind: "photo" }, deps).catch((cause) => cause);
    expect(error).toBeInstanceOf(MediaConflict);
    expect(error.status).toBe(409);
    expect(rec.events).toContain("rollback");
    expect(rec.events).not.toContain("create");
    expect(rec.removed).toEqual(["p1/new.jpg"]);
  });

  test("aborts 409 when the journal was locked before the row was written", async () => {
    const { rec, deps } = storeHarness({ statusAtWrite: "submitted" });
    const error = await storeJournalMedia(IMAGE, { projectId: "p1", entryId: null, kind: "cover" }, deps).catch((cause) => cause);
    expect(error).toBeInstanceOf(MediaConflict);
    expect(error.status).toBe(409);
    expect(error.message).toContain("submitted");
    expect(rec.events).not.toContain("create");
    expect(rec.removed).toEqual(["p1/new.jpg"]);
  });

  test("replaces a cover atomically and only deletes old files after commit", async () => {
    const { rec, deps } = storeHarness({ oldCovers: [{ id: "old1", path: "p1/old1.jpg" }, { id: "old2", path: "p1/old2.jpg" }] });
    await storeJournalMedia(IMAGE, { projectId: "p1", entryId: null, kind: "cover" }, deps);
    expect(rec.events).toEqual([
      "save",
      "tx-start",
      LOCK,
      "count",
      "count",
      "create",
      "find-old",
      "update",
      "update",
      "commit",
      "remove:p1/old1.jpg",
      "remove:p1/old2.jpg",
    ]);
  });

  test("compensates with removeImage when the database write fails after saveImage", async () => {
    const { rec, deps } = storeHarness({ failCreate: true });
    const error = await storeJournalMedia(IMAGE, { projectId: "p1", entryId: null, kind: "photo" }, deps).catch((cause) => cause);
    expect(error.message).toBe("db unavailable");
    expect(rec.events).toContain("rollback");
    expect(rec.events.indexOf("remove:p1/new.jpg")).toBeGreaterThan(rec.events.indexOf("rollback"));
    expect(rec.removed).toEqual(["p1/new.jpg"]);
  });
});

describe("deleteJournalMedia", () => {
  test("re-reads project status in the transaction and refuses when the journal is now locked", async () => {
    const { rec, deps } = deleteHarness({ statusAtWrite: "submitted" });
    const result = await deleteJournalMedia({ id: "m1", viewerId: "v1" }, deps);
    expect(result).toEqual({ ok: false, status: 409, message: "This project is submitted, so its journal and cover can't change." });
    expect(rec.events).not.toContain("update");
    expect(rec.removed).toEqual([]);
  });

  test("refuses when the entry was decided before the update", async () => {
    const { rec, deps } = deleteHarness({ entryId: "e1", entryUndecidedAtWrite: false });
    const result = await deleteJournalMedia({ id: "m1", viewerId: "v1" }, deps);
    expect(result).toEqual({ ok: false, status: 409, message: "A reviewer already decided this entry, so its photos can't change." });
    expect(rec.events).not.toContain("update");
    expect(rec.removed).toEqual([]);
  });

  test("updates under the project lock and removes the file only after commit", async () => {
    const { rec, deps } = deleteHarness();
    const result = await deleteJournalMedia({ id: "m1", viewerId: "v1" }, deps);
    expect(result).toEqual({ ok: true, projectId: "p1", path: "p1/m1.jpg" });
    expect(rec.events).toEqual(["find-row", "tx-start", LOCK, "update", "commit", "remove:p1/m1.jpg"]);
  });

  test("returns 404 when the row is missing", async () => {
    const { deps } = deleteHarness({ found: false });
    const result = await deleteJournalMedia({ id: "m1", viewerId: "v1" }, deps);
    expect(result).toEqual({ ok: false, status: 404, message: "That file was not found." });
  });
});
