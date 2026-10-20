import { describe, expect, test } from "bun:test";
import {
  CODE_ALPHABET,
  certificateCode,
  checkChar,
  codeBody,
  formatCode,
  issueCertificate,
  normalizeCode,
  validateCertificateName,
  verifyCode,
  type IssuedCertificate,
} from "./certificate";

const seed = { eventId: "sample-build-night", handle: "you", issueDay: "2026-10-22" };
const issued = (code: string): IssuedCertificate => ({
  code,
  eventId: seed.eventId,
  eventTitle: "Build night",
  builderName: "You (preview)",
  handle: "you",
  issuedAt: "2026-10-22T12:00:00.000Z",
  sample: true,
});

/** Every body that differs from the given one by exactly one character from the alphabet. */
function singleCharMutations(body: string): string[] {
  const mutations: string[] = [];
  for (let pos = 0; pos < body.length; pos += 1) {
    const others = [...CODE_ALPHABET].filter((ch) => ch !== body[pos]);
    for (const ch of others) mutations.push(body.slice(0, pos) + ch + body.slice(pos + 1));
  }
  return mutations;
}

describe("certificate codes", () => {
  test("have the LDT-XXXX-XXXX-C shape using only the safe alphabet", () => {
    const code = certificateCode(seed);
    expect(code).toMatch(/^LDT-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]$/);
    for (const ch of code.slice(4).replace(/-/g, "")) expect(CODE_ALPHABET.includes(ch)).toBe(true);
  });

  test("are deterministic and differ with each input", () => {
    expect(certificateCode(seed)).toBe(certificateCode({ ...seed }));
    expect(certificateCode(seed)).not.toBe(certificateCode({ ...seed, eventId: "other" }));
    expect(certificateCode(seed)).not.toBe(certificateCode({ ...seed, handle: "ada-cuts" }));
    expect(certificateCode(seed)).not.toBe(certificateCode({ ...seed, issueDay: "2026-10-23" }));
  });

  test("do not collide across many inputs", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 2000; i += 1) codes.add(certificateCode({ eventId: `event-${i}`, handle: `h${i % 37}`, issueDay: "2026-10-22" }));
    expect(codes.size).toBe(2000);
  });
});

describe("check character", () => {
  test("any single wrong character in the body is detected", () => {
    for (let n = 0; n < 40; n += 1) {
      const body = codeBody({ eventId: `e${n}`, handle: "you", issueDay: "2026-10-22" });
      const check = checkChar(body);
      for (const mutated of singleCharMutations(body)) expect(checkChar(mutated)).not.toBe(check);
    }
  });

  test("a wrong check character is not the right one", () => {
    const body = codeBody(seed);
    const right = checkChar(body);
    expect([...CODE_ALPHABET].filter((ch) => ch !== right)).toHaveLength(31);
  });

  test("swapping two neighbouring characters is almost always detected", () => {
    let missed = 0;
    let total = 0;
    for (let n = 0; n < 200; n += 1) {
      const body = codeBody({ eventId: `swap-${n}`, handle: "you", issueDay: "2026-10-22" });
      const check = checkChar(body);
      for (let pos = 0; pos < body.length - 1; pos += 1) {
        if (body[pos] === body[pos + 1]) continue;
        const swapped = body.slice(0, pos) + body[pos + 1] + body[pos] + body.slice(pos + 2);
        total += 1;
        if (checkChar(swapped) === check) missed += 1;
      }
    }
    expect(missed / total).toBeLessThan(0.1);
  });
});

describe("normalising what a person types", () => {
  const code = certificateCode(seed);
  const symbols = code.replace(/^LDT-/, "").replace(/-/g, "");

  test("accepts any casing and separators", () => {
    expect(normalizeCode(code)).toBe(symbols);
    expect(normalizeCode(code.toLowerCase())).toBe(symbols);
    expect(normalizeCode(code.replace(/-/g, " "))).toBe(symbols);
    expect(normalizeCode(symbols)).toBe(symbols);
    expect(normalizeCode(`  ${code}  `)).toBe(symbols);
  });

  test("reads look-alike characters the Crockford way", () => {
    expect(normalizeCode("LDT-O1IO-L0L0-0")).toBe("011010100");
  });

  test("builds the display format", () => {
    expect(formatCode("ABCD1234", "Z")).toBe("LDT-ABCD-1234-Z");
  });
});

describe("verifying", () => {
  const code = certificateCode(seed);
  const list = [issued(code)];

  test("a real code verifies, in any casing and with or without the prefix", () => {
    expect(verifyCode(code, list).status).toBe("valid");
    expect(verifyCode(code.toLowerCase(), list).status).toBe("valid");
    expect(verifyCode(code.replace(/-/g, "").slice(3), list).status).toBe("valid");
    const hit = verifyCode(code, list);
    if (hit.status === "valid") expect(hit.certificate.eventTitle).toBe("Build night");
  });

  test("empty and malformed input", () => {
    expect(verifyCode("", list).status).toBe("empty");
    expect(verifyCode("   ", list).status).toBe("empty");
    expect(verifyCode("LDT-1234", list).status).toBe("malformed");
    expect(verifyCode("hello world this is long", list).status).toBe("malformed");
    expect(verifyCode("LDT-UUUU-UUUU-U", list).status).toBe("malformed");
  });

  test("a mistyped code fails the check character", () => {
    const symbols = code.replace(/^LDT-/, "").replace(/-/g, "");
    const wrong = symbols[0] === "A" ? "B" : "A";
    expect(verifyCode(wrong + symbols.slice(1), list).status).toBe("checksum");
  });

  test("a well formed code that was never issued is reported as not issued", () => {
    const other = certificateCode({ ...seed, eventId: "another-event" });
    expect(verifyCode(other, list).status).toBe("not-issued");
    expect(verifyCode(code, []).status).toBe("not-issued");
  });
});

describe("issuing", () => {
  const input = { eventId: "e1", eventTitle: "Demo hour", builderName: "Ada", handle: "ada", issuedAtIso: "2026-10-29T12:00:00.000Z", sample: true };

  test("creates one certificate whose code verifies", () => {
    const { certificate, created } = issueCertificate([], input);
    expect(created).toBe(true);
    expect(certificate).toMatchObject({ eventId: "e1", builderName: "Ada", sample: true, issuedAt: input.issuedAtIso });
    expect(verifyCode(certificate.code, [certificate]).status).toBe("valid");
  });

  test("is idempotent per builder and event", () => {
    const first = issueCertificate([], input);
    const second = issueCertificate([first.certificate], { ...input, builderName: "Changed", issuedAtIso: "2026-11-05T12:00:00.000Z" });
    expect(second.created).toBe(false);
    expect(second.certificate).toBe(first.certificate);
    expect(second.certificate.builderName).toBe("Ada");
  });

  test("different events give different codes", () => {
    const a = issueCertificate([], input).certificate;
    const b = issueCertificate([a], { ...input, eventId: "e2", eventTitle: "Other" }).certificate;
    expect(a.code).not.toBe(b.code);
  });
});

describe("name on the certificate", () => {
  test("accepts and tidies a normal name", () => {
    expect(validateCertificateName("  Ada   Lovelace ")).toEqual({ ok: true, name: "Ada Lovelace" });
  });

  test("rejects empty, long and unsafe names", () => {
    expect(validateCertificateName("   ").ok).toBe(false);
    expect(validateCertificateName("x".repeat(61)).ok).toBe(false);
    expect(validateCertificateName("<b>Ada</b>").ok).toBe(false);
    expect(validateCertificateName("Ada\u0007").ok).toBe(false);
  });
});
