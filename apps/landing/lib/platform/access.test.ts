import { describe, expect, test } from "bun:test";
import { isLoopbackHost, localTestAccountsEnabled, LOCAL_TEST_ACCOUNTS } from "./local-accounts";

describe("local test accounts", () => {
  test("are off unless the flag is set outside production", () => {
    expect(localTestAccountsEnabled({ LOADOUT_LOCAL_TEST_ACCOUNTS: "true", NODE_ENV: "development" })).toBe(true);
    expect(localTestAccountsEnabled({ NODE_ENV: "development" })).toBe(false);
    expect(localTestAccountsEnabled({ LOADOUT_LOCAL_TEST_ACCOUNTS: "true", NODE_ENV: "production" })).toBe(false);
  });

  test("need NODE_ENV development or test, so an unset or production environment never qualifies", () => {
    expect(localTestAccountsEnabled({ LOADOUT_LOCAL_TEST_ACCOUNTS: "true", NODE_ENV: "test" })).toBe(true);
    expect(localTestAccountsEnabled({ LOADOUT_LOCAL_TEST_ACCOUNTS: "true" })).toBe(false);
    expect(localTestAccountsEnabled({ LOADOUT_LOCAL_TEST_ACCOUNTS: "true", NODE_ENV: "staging" })).toBe(false);
  });

  test("answer only on a local host when the request's host is known", () => {
    const env = { LOADOUT_LOCAL_TEST_ACCOUNTS: "true", NODE_ENV: "development" };
    expect(localTestAccountsEnabled(env, "localhost:3000")).toBe(true);
    expect(localTestAccountsEnabled(env, "review.localhost:3011")).toBe(true);
    expect(localTestAccountsEnabled(env, "192.168.1.20:3000")).toBe(true);
    expect(localTestAccountsEnabled(env, "staging.example.com")).toBe(false);
    expect(localTestAccountsEnabled(env, "review.example.com")).toBe(false);
    expect(localTestAccountsEnabled(env, "")).toBe(false);
    expect(localTestAccountsEnabled(env, undefined)).toBe(true);
    expect(localTestAccountsEnabled(env, null)).toBe(true);
  });

  test("use only reserved .test addresses", () => {
    for (const account of LOCAL_TEST_ACCOUNTS) {
      expect(account.email.endsWith(".test")).toBe(true);
    }
  });
});

describe("isLoopbackHost", () => {
  test("accepts loopback, .localhost and private LAN hosts, with or without a port", () => {
    for (const host of ["localhost", "localhost:3000", "LOCALHOST:3000", "127.0.0.1:3011", "[::1]:3000", "::1", "review.localhost:3011", "10.0.0.5", "192.168.0.9:3000", "172.16.4.4", "172.31.255.1"]) {
      expect(isLoopbackHost(host)).toBe(true);
    }
  });

  test("rejects public names and addresses, lookalikes and an empty host", () => {
    for (const host of ["example.com", "localhost.evil.com", "evil-localhost", "8.8.8.8", "172.32.0.1", "172.15.0.1", "192.169.0.1", "300.1.1.1", "127.0.0.1.evil.com", "", null, undefined]) {
      expect(isLoopbackHost(host)).toBe(false);
    }
  });
});
