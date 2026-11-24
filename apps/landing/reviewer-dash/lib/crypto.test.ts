import { describe, expect, test } from "bun:test";
import { decryptPII, encryptPII } from "./crypto";

const KEY_HEX = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";
const env = { LOADOUT_PII_KEY: KEY_HEX };

describe("PII encryption at rest", () => {
  test("round-trips a value and never stores it in plain text", () => {
    const sealed = encryptPII("Ada Lovelace", env);
    expect(sealed.startsWith("enc:v1:")).toBe(true);
    expect(sealed).not.toContain("Ada");
    expect(decryptPII(sealed, env)).toBe("Ada Lovelace");
  });

  test("uses a fresh nonce each time", () => {
    expect(encryptPII("same", env)).not.toBe(encryptPII("same", env));
  });

  test("refuses to encrypt without a valid key rather than store plain text", () => {
    expect(() => encryptPII("x", {})).toThrow("LOADOUT_PII_KEY is not set");
    expect(() => encryptPII("x", { LOADOUT_PII_KEY: "abcd" })).toThrow("32 bytes");
  });

  test("accepts a base64 key of 32 bytes", () => {
    const b64 = Buffer.from(KEY_HEX, "hex").toString("base64");
    const sealed = encryptPII("hello", { LOADOUT_PII_KEY: b64 });
    expect(decryptPII(sealed, env)).toBe("hello");
  });

  test("a tampered value fails authentication", () => {
    const sealed = encryptPII("secret", env);
    const bytes = Buffer.from(sealed.slice("enc:v1:".length), "base64");
    bytes[bytes.length - 1] ^= 0x01;
    expect(() => decryptPII(`enc:v1:${bytes.toString("base64")}`, env)).toThrow();
  });

  test("legacy plain text passes through unchanged, and empty input reads as empty", () => {
    expect(decryptPII("plain", env)).toBe("plain");
    expect(decryptPII(null, env)).toBe("");
    expect(decryptPII(undefined, env)).toBe("");
    expect(decryptPII("", env)).toBe("");
  });
});
