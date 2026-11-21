import { describe, expect, test } from "bun:test";
import { createMuteStore, MUTE_TTL_MS } from "./mute";
import {
  eligible,
  escapeMrkdwn,
  isOnlyEmoji,
  looksNonEnglish,
  parseMacro,
  parseMuteCommand,
  shouldAutoClose,
} from "./rules";

const human = { user: "U0000000001", ts: "1700000000.000100" };

describe("eligible", () => {
  test("a top level human question of 8 or more characters qualifies", () => {
    expect(eligible({ ...human, text: "How do I set up the bench?" })).toBe(true);
  });

  test("short, emoji-only, bot, edited and thread messages do not qualify", () => {
    expect(eligible({ ...human, text: "help me" })).toBe(false); // 7 characters
    expect(eligible({ ...human, text: "   hi   " })).toBe(false);
    expect(eligible({ ...human, text: ":eyes: :rocket: :tada: :eyes:" })).toBe(false);
    expect(eligible({ ...human, text: "🚀🚀🚀🚀🚀🚀🚀🚀🚀" })).toBe(false);
    expect(eligible({ ...human, text: "a real question", bot_id: "B0000000001" })).toBe(false);
    expect(eligible({ ...human, text: "a real question", subtype: "message_changed" })).toBe(false);
    expect(eligible({ ...human, text: "a real question", thread_ts: "1700000000.000001" })).toBe(false);
    expect(eligible({ ts: "1.1", text: "a real question" })).toBe(false); // no user
  });

  test("a thread parent that is the message itself is still top level", () => {
    expect(eligible({ ...human, text: "a real question", thread_ts: human.ts })).toBe(true);
  });
});

describe("isOnlyEmoji", () => {
  test("ignores shortcodes, pictographs and joiners", () => {
    expect(isOnlyEmoji(":wave: 👍🏽 ❤️")).toBe(true);
    expect(isOnlyEmoji("ok :wave:")).toBe(false);
    expect(isOnlyEmoji("")).toBe(true);
  });
});

describe("parseMacro", () => {
  test("helpers get the four macros, first word only", () => {
    expect(parseMacro("?resolve", true)).toBe("resolve");
    expect(parseMacro("?close thanks all", true)).toBe("resolve");
    expect(parseMacro("  ?REOPEN", true)).toBe("reopen");
    expect(parseMacro("?faq here you go", true)).toBe("faq");
    expect(parseMacro("thanks ?resolve", true)).toBeNull();
    expect(parseMacro("?unknown", true)).toBeNull();
  });

  test("non helpers never get a macro", () => {
    expect(parseMacro("?resolve", false)).toBeNull();
  });
});

describe("shouldAutoClose", () => {
  const created = Date.parse("2026-11-01T00:00:00.000Z");
  const day = 24 * 60 * 60 * 1000;
  const base = {
    status: "open" as const,
    keepOpen: false,
    createdAt: new Date(created).toISOString(),
    lastMessageAt: new Date(created).toISOString(),
  };

  test("closes after 5 idle days from open and last message", () => {
    expect(shouldAutoClose(base, created + 5 * day)).toBe(true);
    expect(shouldAutoClose(base, created + 5 * day - 1)).toBe(false);
  });

  test("a recent thread message keeps it open even when the ticket is old", () => {
    const active = { ...base, lastMessageAt: new Date(created + 4 * day).toISOString() };
    expect(shouldAutoClose(active, created + 6 * day)).toBe(false);
    expect(shouldAutoClose(active, created + 9 * day)).toBe(true);
  });

  test("keep open, closed and young tickets are never auto closed", () => {
    expect(shouldAutoClose({ ...base, keepOpen: true }, created + 30 * day)).toBe(false);
    expect(shouldAutoClose({ ...base, status: "closed" }, created + 30 * day)).toBe(false);
    expect(shouldAutoClose({ ...base, createdAt: "not a date" }, created + 30 * day)).toBe(false);
  });
});

describe("looksNonEnglish", () => {
  test("flags questions written mostly in other scripts", () => {
    expect(looksNonEnglish("こんにちは、質問があります")).toBe(true);
    expect(looksNonEnglish("Как подключить модуль к плате?")).toBe(true);
  });

  test("leaves English and short text alone", () => {
    expect(looksNonEnglish("How do I wire the sensor?")).toBe(false);
    expect(looksNonEnglish("ok?")).toBe(false);
  });
});

describe("parseMuteCommand", () => {
  test("matches the exact name plus STOP or START", () => {
    expect(parseMuteCommand("RigSTOP", "Rig")).toBe("stop");
    expect(parseMuteCommand(" rigstart ", "Rig")).toBe("start");
    expect(parseMuteCommand("RigSTOP please", "Rig")).toBeNull();
    expect(parseMuteCommand("STOP", "Rig")).toBeNull();
  });
});

describe("escapeMrkdwn", () => {
  test("escapes the three mrkdwn control characters", () => {
    expect(escapeMrkdwn("a < b & c > d")).toBe("a &lt; b &amp; c &gt; d");
  });
});

describe("createMuteStore", () => {
  test("mutes a thread until the expiry and forgets it after", () => {
    let t = 0;
    const store = createMuteStore(() => t);
    store.mute("C0000000001", "1.1");
    expect(store.isMuted("C0000000001", "1.1")).toBe(true);
    expect(store.isMuted("C0000000001", "2.2")).toBe(false);
    t = MUTE_TTL_MS - 1;
    expect(store.isMuted("C0000000001", "1.1")).toBe(true);
    t = MUTE_TTL_MS;
    expect(store.isMuted("C0000000001", "1.1")).toBe(false);
    expect(store.size()).toBe(0);
  });

  test("unmute clears a thread early", () => {
    const store = createMuteStore(() => 0);
    store.mute("C0000000001", "1.1");
    store.unmute("C0000000001", "1.1");
    expect(store.isMuted("C0000000001", "1.1")).toBe(false);
  });
});
