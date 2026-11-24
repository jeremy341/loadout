import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import * as realSession from "@/lib/platform/session";
import * as realAudit from "./audit";

// The guards decide access through the session, and write an audit row named after the action/route they wrap. Those three
// edges are mocked so the tests can drive allow / wrong-role / no-session without a request or a database. The real exports
// are spread in so other modules loaded in the same bun test process still see exports (e.g. purgeExpiredSessions) that this
// file does not override; afterAll restores the modules for the files that run after this one.
let viewer: unknown = null;
let owners: string[] = ["owner@test.local"];

const audit = mock(async () => {});
const notFound = mock((): never => {
  throw new Error("NOT_FOUND");
});
const redirect = mock((): never => {
  throw new Error("REDIRECT");
});

mock.module("@/lib/platform/session", () => ({
  ...realSession,
  readViewer: async () => viewer,
  ownerEmails: () => owners,
}));
mock.module("./audit", () => ({ ...realAudit, audit }));
mock.module("next/navigation", () => ({ notFound, redirect }));

afterAll(() => mock.restore());

const { guardedAction, guardedRoute } = await import("./guard");

const person = (email: string, roles: string[] = []) => ({ id: "p1", email, displayName: "Test Person", roles, access: null });

beforeEach(() => {
  audit.mockClear();
  notFound.mockClear();
  redirect.mockClear();
  owners = ["owner@test.local"];
  viewer = person("owner@test.local");
});

describe("guardedAction audit", () => {
  test("writes the named action as an allowed audit row", async () => {
    const fn = mock(async (_access: unknown, n: number) => n + 1);
    const action = guardedAction("claimOrder", "owner", fn);

    expect(await action(2)).toBe(3);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit.mock.calls[0][0]).toMatchObject({ action: "claimOrder", result: "ok", actorType: "staff" });
  });

  test("writes a denied audit row and throws when the role is not enough", async () => {
    viewer = person("helper@test.local", ["helper"]);
    const fn = mock(async () => "should not run");
    const action = guardedAction("reassignOrder", "owner", fn);

    await expect(action()).rejects.toThrow("You need the owner role for that.");
    expect(fn).not.toHaveBeenCalled();
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit.mock.calls[0][0]).toMatchObject({ action: "reassignOrder", result: "denied" });
  });

  test("writes a denied audit row before answering 404 with no session", async () => {
    viewer = null;
    const action = guardedAction("secretAction", "owner", async () => "x");

    await expect(action()).rejects.toThrow("NOT_FOUND");
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit.mock.calls[0][0]).toMatchObject({ action: "secretAction", result: "denied", actorType: "anonymous" });
  });
});

describe("guardedRoute audit", () => {
  test("writes the named route as an allowed audit row and passes the request to the writer", async () => {
    const handler = mock(async () => new Response("ok"));
    const route = guardedRoute("api.tickets.list", "owner", handler);
    const request = new Request("https://x.test/api/tickets");

    expect((await route(request, undefined)).status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit.mock.calls[0][0]).toMatchObject({ action: "api.tickets.list", result: "ok" });
    expect(audit.mock.calls[0][1]).toBe(request);
  });

  test("writes a denied audit row and answers 403 for an insufficient role", async () => {
    viewer = person("helper@test.local", ["helper"]);
    const handler = mock(async () => new Response("ok"));
    const route = guardedRoute("api.ops", "owner", handler);

    expect((await route(new Request("https://x.test/api/ops"), undefined)).status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit.mock.calls[0][0]).toMatchObject({ action: "api.ops", result: "denied" });
  });

  test("writes a denied audit row and answers 404 with no session", async () => {
    viewer = null;
    const route = guardedRoute("api.secret", "owner", async () => new Response("ok"));

    expect((await route(new Request("https://x.test/api/secret"), undefined)).status).toBe(404);
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit.mock.calls[0][0]).toMatchObject({ action: "api.secret", result: "denied", actorType: "anonymous" });
  });
});
