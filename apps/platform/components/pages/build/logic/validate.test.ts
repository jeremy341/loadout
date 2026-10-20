import { describe, expect, test } from "bun:test";
import {
  OPEN_LICENSES,
  bomIsComplete,
  bomRowErrors,
  bomTotals,
  entryToPlainText,
  isOpenLicense,
  isPublicUrl,
  parseTags,
  publicProjectFields,
  slugify,
  toParagraphs,
  validateJournal,
  validateProject,
  validateVersion,
} from "./validate";
import type { Project } from "./types";

describe("licences and links", () => {
  test("only open-source licences are accepted", () => {
    expect(isOpenLicense("MIT")).toBe(true);
    expect(isOpenLicense("CERN-OHL-S-2.0")).toBe(true);
    expect(isOpenLicense("")).toBe(false);
    expect(isOpenLicense("Proprietary")).toBe(false);
    expect(isOpenLicense("All rights reserved")).toBe(false);
  });
  test("every listed licence has a unique id", () => {
    expect(new Set(OPEN_LICENSES.map((l) => l.id)).size).toBe(OPEN_LICENSES.length);
  });
  test("public URL check", () => {
    expect(isPublicUrl("https://github.com/you/project")).toBe(true);
    expect(isPublicUrl("http://example.org/x")).toBe(true);
    expect(isPublicUrl("ftp://example.org")).toBe(false);
    expect(isPublicUrl("javascript:alert(1)")).toBe(false);
    expect(isPublicUrl("not a url")).toBe(false);
    expect(isPublicUrl("http://localhost:3000")).toBe(false);
    expect(isPublicUrl("http://192.168.1.4/x")).toBe(false);
    expect(isPublicUrl("http://10.0.0.1/x")).toBe(false);
    expect(isPublicUrl("https://intranet/x")).toBe(false);
  });
});

describe("project validation", () => {
  const ok = { name: "Tiny tool", summary: "Does a thing.", capability: "", repoUrl: "", license: "", collaborators: "" };
  test("accepts a minimal project", () => {
    expect(validateProject(ok)).toEqual({});
  });
  test("requires a name and a summary", () => {
    const errors = validateProject({ ...ok, name: "  ", summary: "" });
    expect(errors.name).toBeDefined();
    expect(errors.summary).toBeDefined();
  });
  test("rejects a closed licence and a bad link", () => {
    const errors = validateProject({ ...ok, license: "Proprietary", repoUrl: "nope" });
    expect(errors.license).toBeDefined();
    expect(errors.repoUrl).toBeDefined();
  });
  test("version labels must be new", () => {
    expect(validateVersion("v0.1", "", ["V0.1"]).label).toBeDefined();
    expect(validateVersion("v0.2", "", ["v0.1"])).toEqual({});
    expect(validateVersion("", "", []).label).toBeDefined();
  });
});

describe("bill of materials", () => {
  const row = { id: "1", part: "ESP32 module", qty: 2, unitCost: 4.5, link: "vendor" };
  test("a row needs part, whole quantity, cost and source", () => {
    expect(bomRowErrors(row)).toEqual([]);
    expect(bomRowErrors({ ...row, part: "" })).toHaveLength(1);
    expect(bomRowErrors({ ...row, qty: 0 })).toHaveLength(1);
    expect(bomRowErrors({ ...row, qty: 1.5 })).toHaveLength(1);
    expect(bomRowErrors({ ...row, unitCost: -1 })).toHaveLength(1);
    expect(bomRowErrors({ ...row, link: " " })).toHaveLength(1);
  });
  test("totals", () => {
    expect(bomTotals([row, { ...row, id: "2", qty: 3, unitCost: 0.1 }])).toEqual({ lines: 2, quantity: 5, total: 9.3 });
  });
  test("an empty bill is not complete", () => {
    expect(bomIsComplete([])).toBe(false);
    expect(bomIsComplete([row])).toBe(true);
    expect(bomIsComplete([row, { ...row, id: "2", link: "" }])).toBe(false);
  });
});

describe("journal validation", () => {
  const ok = { title: "Day one", body: "Did a thing.", hours: 2, tagsText: "rust, perf" };
  test("accepts a valid entry", () => {
    expect(validateJournal(ok, 5)).toEqual({});
  });
  test("hours cannot exceed what is uncovered", () => {
    expect(validateJournal({ ...ok, hours: 6 }, 5).hours).toBeDefined();
    expect(validateJournal({ ...ok, hours: 1 }, 0).hours).toBeDefined();
    expect(validateJournal({ ...ok, hours: 0 }, 0)).toEqual({});
  });
  test("title and body are required", () => {
    const errors = validateJournal({ ...ok, title: "", body: "   " }, 5);
    expect(errors.title).toBeDefined();
    expect(errors.body).toBeDefined();
  });
  test("tags are normalised and limited", () => {
    expect(parseTags("Rust,  GPU, rust\nhello world")).toEqual(["rust", "gpu", "hello-world"]);
    expect(validateJournal({ ...ok, tagsText: "a,b,c,d,e,f,g,h,i" }, 5).tags).toBeDefined();
    expect(validateJournal({ ...ok, tagsText: "<script>" }, 5).tags).toBeDefined();
  });
});

describe("plain text rendering helpers", () => {
  test("paragraphs split on blank lines and keep single line breaks", () => {
    expect(toParagraphs("one\ntwo\n\n\nthree")).toEqual([["one", "two"], ["three"]]);
    expect(toParagraphs("  \n\n")).toEqual([]);
    expect(toParagraphs("a\r\nb")).toEqual([["a", "b"]]);
  });
  test("markup stays as text", () => {
    expect(toParagraphs("<b>x</b>")).toEqual([["<b>x</b>"]]);
  });
  test("slug and export text", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
    expect(slugify("???")).toBe("entry");
    const text = entryToPlainText({ title: "Day one", body: "Did a thing.\r\nTwice.", hours: 2, tags: ["a"], isPublic: false, at: 0 }, "Proj");
    expect(text).toContain("Project: Proj");
    expect(text).toContain("Visibility: private");
    expect(text).toContain("Did a thing.\nTwice.");
  });
});

describe("public project page", () => {
  const base: Project = {
    id: "p",
    name: "N",
    summary: "S",
    capability: "",
    track: "Hardware",
    researchMode: false,
    repoUrl: "https://example.org/x",
    license: "MIT",
    visibility: "public",
    collaborators: "",
    createdAt: 0,
    trackerConnected: true,
    trackerHours: 9,
    allocatedHours: 9,
    bom: [],
    versions: [],
  };
  test("never exposes tracker or hours fields", () => {
    const fields = publicProjectFields(base) as Record<string, unknown>;
    expect("trackerConnected" in fields).toBe(false);
    expect("trackerHours" in fields).toBe(false);
    expect("allocatedHours" in fields).toBe(false);
  });
});
