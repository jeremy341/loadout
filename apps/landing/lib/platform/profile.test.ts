import { describe, expect, test } from "bun:test";
import {
  BIO_MAX,
  checkBio,
  checkHandle,
  checkLinkUrl,
  checkPin,
  isPublicProject,
  MAX_PINNED,
  normalizeStatus,
  pinnedFirst,
  pinnedProjects,
  publicProjects,
  statusTabs,
  type ProfileProject,
} from "./profile";

const project = (id: string, status: string, extra: Partial<ProfileProject> = {}): ProfileProject => ({
  id,
  status,
  pinned: false,
  ...extra,
});

describe("checkHandle", () => {
  test("accepts and case-folds", () => {
    expect(checkHandle("  Ada_Lovelace ")).toEqual({ ok: true, handle: "ada_lovelace" });
    expect(checkHandle("a-1")).toEqual({ ok: true, handle: "a-1" });
  });
  test("length", () => {
    expect(checkHandle("ab").ok).toBe(false);
    expect(checkHandle("abc").ok).toBe(true);
    expect(checkHandle("a".repeat(24)).ok).toBe(true);
    expect(checkHandle("a".repeat(25)).ok).toBe(false);
  });
  test("uses the spec's exact messages", () => {
    expect(checkHandle("")).toEqual({ ok: false, message: "Choose a handle." });
    expect(checkHandle("ab")).toEqual({ ok: false, message: "Use 3 to 24 characters." });
    expect(checkHandle("a".repeat(25))).toEqual({ ok: false, message: "Use 3 to 24 characters." });
    expect(checkHandle("ab cd")).toEqual({ ok: false, message: "Use a to z, 0 to 9, _ and - only. Start with a letter." });
    expect(checkBio("a".repeat(161))).toEqual({ ok: false, message: "Keep it to 160 characters." });
  });
  test("empty and non-strings", () => {
    for (const raw of ["", "   ", null, undefined, 5]) expect(checkHandle(raw).ok).toBe(false);
  });
  test("must start with a letter", () => {
    for (const raw of ["1abc", "_abc", "-abc"]) {
      const r = checkHandle(raw);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toContain("letter");
    }
  });
  test("character set", () => {
    for (const raw of ["ab cd", "ab.cd", "ab@cd", "abé", "ab/cd"]) expect(checkHandle(raw).ok).toBe(false);
  });
  test("reserved words in any case", () => {
    for (const raw of ["admin", "ADMIN", "Staff", "loadout", "review"]) {
      const r = checkHandle(raw);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toBe("That handle is not available.");
    }
    // "me" is reserved but also too short to pass; "mex" is fine.
    expect(checkHandle("mex").ok).toBe(true);
  });
});

describe("checkBio", () => {
  test("empty is no bio", () => {
    expect(checkBio("")).toEqual({ ok: true, bio: null });
    expect(checkBio(null)).toEqual({ ok: true, bio: null });
    expect(checkBio("  \n ")).toEqual({ ok: true, bio: null });
  });
  test("trims, flattens line breaks and collapses spaces", () => {
    expect(checkBio("  hi\nthere   you ")).toEqual({ ok: true, bio: "hi there you" });
  });
  test("strips control and bidi characters", () => {
    expect(checkBio("a\u0000b‮c​d")).toEqual({ ok: true, bio: "abcd" });
  });
  test("limit counts after cleaning", () => {
    expect(checkBio("a".repeat(BIO_MAX)).ok).toBe(true);
    expect(checkBio("a".repeat(BIO_MAX + 1)).ok).toBe(false);
    expect(checkBio("a".repeat(BIO_MAX) + "\u0000\u0000").ok).toBe(true);
  });
  test("plain text with a link is allowed", () => {
    expect(checkBio("I build things, see my site").ok).toBe(true);
  });
  test("non-text is refused", () => {
    expect(checkBio(5).ok).toBe(false);
  });
});

describe("checkLinkUrl", () => {
  test("empty means no link", () => {
    expect(checkLinkUrl("")).toEqual({ ok: true, url: null });
    expect(checkLinkUrl("   ")).toEqual({ ok: true, url: null });
    expect(checkLinkUrl(null)).toEqual({ ok: true, url: null });
  });
  test("accepts a public https address", () => {
    expect(checkLinkUrl("https://github.com/example-handle/robot")).toEqual({ ok: true, url: "https://github.com/example-handle/robot" });
    expect(checkLinkUrl(" https://Demo.Example/x?y=1 ")).toEqual({ ok: true, url: "https://demo.example/x?y=1" });
  });
  test("refuses other schemes and bare hosts", () => {
    for (const raw of ["http://example.com", "javascript:alert(1)", "ftp://example.com", "data:text/html,hi", "mailto:a@b.co", "example.com", "file:///etc/passwd"]) {
      expect(checkLinkUrl(raw).ok).toBe(false);
    }
  });
  test("refuses credentials", () => {
    expect(checkLinkUrl("https://user:pw@example.com").ok).toBe(false);
    expect(checkLinkUrl("https://user@example.com").ok).toBe(false);
  });
  test("refuses ports", () => {
    expect(checkLinkUrl("https://example.com:8443/x").ok).toBe(false);
  });
  test("refuses private, loopback and numeric hosts", () => {
    for (const raw of [
      "https://localhost/x", "https://app.localhost", "https://127.0.0.1", "https://10.0.0.5", "https://192.168.1.1", "https://172.16.0.1",
      "https://169.254.169.254/latest", "https://[::1]/", "https://2130706433", "https://0x7f000001", "https://printer.local", "https://intranet",
      "https://db.internal", "https://8.8.8.8",
    ]) {
      expect(checkLinkUrl(raw).ok).toBe(false);
    }
  });
  test("refuses wildcard DNS names that point at an address", () => {
    for (const raw of [
      "https://127.0.0.1.nip.io/x", "https://192.168.1.1.nip.io/x", "https://app.10.0.0.1.sslip.io", "https://8.8.8.8.nip.io",
      "https://127-0-0-1.nip.io", "https://a.xip.io", "https://app.traefik.me", "https://foo.localtest.me", "https://bar.lvh.me", "https://lvh.me",
      "https://1.2.3.4.example.com", "https://169.254.169.254.example.org/latest",
    ]) {
      expect(checkLinkUrl(raw).ok).toBe(false);
    }
  });
  test("refuses internal suffixes", () => {
    for (const raw of ["https://a.localhost", "https://printer.local", "https://db.internal", "https://site.test", "https://x.y.test/p"]) {
      expect(checkLinkUrl(raw).ok).toBe(false);
    }
  });
  test("a look-alike of a wildcard domain, or a short number run, is not refused", () => {
    expect(checkLinkUrl("https://notnip.io/x").ok).toBe(true);
    expect(checkLinkUrl("https://v1.2.3.example.com/x").ok).toBe(true);
    expect(checkLinkUrl("https://github.com/a/b").ok).toBe(true);
  });
  test("refuses spaces and over-long input", () => {
    expect(checkLinkUrl("https://example.com/a b").ok).toBe(false);
    expect(checkLinkUrl("https://example.com/" + "a".repeat(400)).ok).toBe(false);
  });
});

describe("visibility", () => {
  test("normalizeStatus", () => {
    expect(normalizeStatus("needs_changes")).toBe("needs-changes");
    expect(normalizeStatus(" Approved ")).toBe("approved");
  });
  test("every project is public, drafts included", () => {
    for (const status of ["draft", "logging", "submitted", "in-review", "needs-changes", "needs_changes", "approved", "rejected"]) {
      expect(isPublicProject(project("a", status))).toBe(true);
    }
  });
  test("a banned project is withheld", () => {
    expect(isPublicProject(project("a", "banned"))).toBe(false);
  });
  test("publicProjects keeps everything except banned ones", () => {
    const list = [project("1", "approved"), project("2", "draft"), project("3", "logging"), project("4", "banned"), project("5", "in-review")];
    expect(publicProjects(list).map((p) => p.id)).toEqual(["1", "2", "3", "5"]);
  });
});

describe("pins and tabs", () => {
  test("pinnedProjects: approved public pinned only, capped", () => {
    const list = [
      project("1", "approved", { pinned: true }),
      project("2", "draft", { pinned: true }),
      project("3", "logging", { pinned: true }),
      project("4", "approved", { pinned: true }),
      project("5", "approved", { pinned: true }),
      project("6", "approved", { pinned: true }),
      project("7", "approved"),
    ];
    expect(pinnedProjects(list).map((p) => p.id)).toEqual(["1", "4", "5"]);
    expect(pinnedProjects(list).length).toBe(MAX_PINNED);
  });
  test("pinnedFirst is stable", () => {
    const list = [project("1", "approved"), project("2", "approved", { pinned: true }), project("3", "approved"), project("4", "approved", { pinned: true })];
    expect(pinnedFirst(list).map((p) => p.id)).toEqual(["2", "4", "1", "3"]);
  });
  test("statusTabs counts every status and keeps zero tabs", () => {
    const tabs = statusTabs([project("1", "approved"), project("2", "approved"), project("3", "draft"), project("4", "needs_changes")]);
    expect(tabs[0]).toEqual({ key: "all", label: "All", count: 4 });
    const count = (key: string) => tabs.find((t) => t.key === key)?.count;
    expect(count("approved")).toBe(2);
    expect(count("draft")).toBe(1);
    expect(count("needs-changes")).toBe(1);
    expect(count("logging")).toBe(0);
    expect(tabs.length).toBe(7);
  });
  test("checkPin", () => {
    expect(checkPin({ status: "approved" }, 0).ok).toBe(true);
    expect(checkPin({ status: "approved" }, 2).ok).toBe(true);
    expect(checkPin({ status: "approved" }, 3).ok).toBe(false);
    expect(checkPin({ status: "draft" }, 0).ok).toBe(false);
    expect(checkPin({ status: "logging" }, 0).ok).toBe(false);
  });
});
