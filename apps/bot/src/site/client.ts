// The real SiteClient: service-key calls to the site's /api/internal/bot routes (spec section 9).
// API: createSiteClient({ baseUrl, serviceKey, fetch?, timeoutMs?, retryDelayMs? }) -> SiteClient.
// Every call sends x-loadout-service-key, has an 8 s timeout that covers reading the body, and sends JSON.
// A GET is retried once on a network error, a timeout or a 5xx. Writes are never retried.
// Lookups that can legitimately miss (404) resolve to null. Every other failure throws SiteError(code, status).
import {
  SiteError,
  type JobKind,
  type JobRow,
  type OutboxItem,
  type PersonView,
  type QaRow,
  type ShipView,
  type SiteClient,
  type TicketRow,
} from "../types";

export type SiteClientOptions = {
  baseUrl: string;
  serviceKey: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  retryDelayMs?: number;
};

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Sent = { status: number; text: string };

const SHORT_CODE = /^[a-z_]{2,40}$/;
const STATUS_CODES: Record<number, string> = {
  400: "bad_request",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  422: "invalid",
  429: "rate_limited",
};

export function createSiteClient(options: SiteClientOptions): SiteClient {
  const root = `${options.baseUrl.replace(/\/+$/, "")}/api/internal/bot/`;
  const doFetch = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? 8000;
  const retryDelayMs = options.retryDelayMs ?? 300;

  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  // One HTTP exchange with the timeout. Network failures and timeouts become SiteError codes.
  async function attemptOnce(method: Method, url: string, body: unknown): Promise<Sent> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const headers: Record<string, string> = {
        "x-loadout-service-key": options.serviceKey,
        accept: "application/json",
      };
      if (body !== undefined) headers["content-type"] = "application/json";
      const res = await doFetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      return { status: res.status, text: await res.text() };
    } catch {
      throw new SiteError(controller.signal.aborted ? "timeout" : "network", 0);
    } finally {
      clearTimeout(timer);
    }
  }

  // Applies the GET-only retry. Returns the last response even when it is a 5xx, so the caller maps it.
  async function send(method: Method, url: string, body: unknown): Promise<Sent> {
    const maxAttempts = method === "GET" ? 2 : 1;
    let lastError: SiteError | undefined;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) await sleep(retryDelayMs);
      try {
        const sent = await attemptOnce(method, url, body);
        if (sent.status >= 500 && attempt + 1 < maxAttempts) continue;
        return sent;
      } catch (err) {
        if (!(err instanceof SiteError)) throw err;
        lastError = err;
      }
    }
    throw lastError ?? new SiteError("network", 0);
  }

  function errorCode(status: number, text: string): string {
    try {
      const body = JSON.parse(text) as { error?: unknown };
      if (typeof body.error === "string" && SHORT_CODE.test(body.error)) return body.error;
    } catch {
      // Not JSON: fall through to the status mapping.
    }
    return STATUS_CODES[status] ?? (status >= 500 ? "server_error" : `http_${status}`);
  }

  function url(path: string, query?: Record<string, string | undefined>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) search.set(key, value);
    }
    const qs = search.toString();
    return `${root}${path}${qs ? `?${qs}` : ""}`;
  }

  // Runs a request and returns the parsed body. 404 throws unless the caller asks for a lookup (see lookup).
  async function call<T>(
    method: Method,
    path: string,
    opts: { query?: Record<string, string | undefined>; body?: unknown } = {},
  ): Promise<T> {
    const sent = await send(method, url(path, opts.query), opts.body);
    if (sent.status >= 400) throw new SiteError(errorCode(sent.status, sent.text), sent.status);
    if (sent.text.trim() === "") return undefined as T;
    try {
      // The site contract in types.ts defines the shape; this is the single cast at the boundary.
      return JSON.parse(sent.text) as T;
    } catch {
      throw new SiteError("bad_response", sent.status);
    }
  }

  // The site wraps every answer in one named field ({ ticket }, { ship }, { qa }); `key` names it. A 404 or null field is "not found".
  async function lookup<T>(path: string, query: Record<string, string | undefined> | undefined, key: string): Promise<T | null> {
    const sent = await send("GET", url(path, query), undefined);
    if (sent.status === 404) return null;
    if (sent.status >= 400) throw new SiteError(errorCode(sent.status, sent.text), sent.status);
    if (sent.text.trim() === "") return null;
    try {
      const body = JSON.parse(sent.text) as Record<string, unknown> | null;
      const value = body?.[key];
      return value === undefined || value === null ? null : (value as T);
    } catch {
      throw new SiteError("bad_response", sent.status);
    }
  }

  // Pulls one named field out of an answer, failing loudly when it is missing.
  function field<T>(value: unknown, key: string): T {
    const inner = (value as Record<string, unknown> | null | undefined)?.[key];
    if (inner === undefined) throw new SiteError("bad_response", 200);
    return inner as T;
  }

  // Lists must be arrays. A non-array reply is a contract break, so it fails loudly instead of looking empty.
  async function list<T>(path: string, key: string, query?: Record<string, string | undefined>): Promise<T[]> {
    const value = field<unknown>(await call<unknown>("GET", path, { query }), key);
    if (!Array.isArray(value)) throw new SiteError("bad_response", 200);
    return value as T[];
  }

  const enc = (id: string) => encodeURIComponent(id);

  return {
    createTicket: async (input) => {
      const body = await call<{ ticket: TicketRow; linked: boolean }>("POST", "tickets", { body: input });
      return { ticket: field<TicketRow>(body, "ticket"), linked: Boolean(body.linked) };
    },
    getTicket: (id) => lookup<TicketRow>(`tickets/${enc(id)}`, undefined, "ticket"),
    findTicketByMessage: (channelId, messageTs) => lookup<TicketRow>("tickets", { channelId, messageTs }, "ticket"),
    updateTicket: async (id, patch) => field<TicketRow>(await call<unknown>("PATCH", `tickets/${enc(id)}`, { body: patch }), "ticket"),
    addTicketMessage: async (id, input) => {
      await call<unknown>("POST", `tickets/${enc(id)}/messages`, { body: input });
    },
    listOpenTickets: () => list<TicketRow>("tickets/open", "tickets"),
    similarTicket: (text) =>
      lookup<{ id: string; title: string | null; url: string }>("tickets/similar", { text }, "ticket"),

    listHelpers: () => list<string>("helpers", "helpers"),
    addHelper: async (adminSlackId, slackId) => {
      await call<unknown>("POST", "helpers", { body: { slackId, adminSlackId } });
    },
    removeHelper: async (adminSlackId, slackId) => {
      await call<unknown>("DELETE", `helpers/${enc(slackId)}`, { body: { adminSlackId } });
    },

    person: (slackId) => call<PersonView>("GET", "person", { query: { slackId } }),
    lastShip: (slackId) => lookup<ShipView>("ships/last", { slackId }, "ship"),
    approvedShips: (slackId) => list<ShipView>("ships/approved", "ships", { slackId }),

    outbox: () => list<OutboxItem>("outbox", "items"),
    ackOutbox: async (id) => {
      await call<unknown>("POST", `outbox/${enc(id)}/ack`);
    },
    failOutbox: async (id, code, final) => {
      await call<unknown>("POST", `outbox/${enc(id)}/fail`, { body: { code, final } });
    },

    qaGet: (question) => lookup<QaRow>("qa", { q: question }, "qa"),
    qaPut: async (row) => {
      await call<unknown>("PUT", "qa", { body: row });
    },

    listJobs: () => list<JobRow>("jobs", "jobs"),
    createJob: async (input) => field<JobRow>(await call<unknown>("POST", "jobs", { body: input }), "job"),
    finishJob: async (id) => {
      await call<unknown>("DELETE", `jobs/${enc(id)}`);
    },
    // The site has no count route; the pending list is short (every job runs within 24 hours), so count it here.
    countJobs: async (ownerSlackId, kind: JobKind) => {
      const jobs = await list<JobRow>("jobs", "jobs");
      return jobs.filter((job) => job.ownerSlackId === ownerSlackId && job.kind === kind).length;
    },
  };
}
