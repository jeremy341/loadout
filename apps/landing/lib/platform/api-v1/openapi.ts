// The OpenAPI 3.1 document for /api/v1, written by hand here and served as YAML at /api/v1/openapi.yaml (and shown at /api/v1/docs).
// Every route file under app/api/v1 has one path entry. openapi.test.ts checks that, and that every operation documents its
// security and a 429. The API is read only: there are no write operations in this document, by design.
//
// API:
//   OPENAPI_DOCUMENT    the document as a plain object
//   OPENAPI_YAML        the same document serialized as YAML (stringify is deterministic for one build)
//   API_LIMITS          the rate limits as text for the docs page, taken from RATE_LIMIT_PRESETS so they cannot drift
import { stringify } from "yaml";
import { API_SCOPES } from "../api-keys";
import { LEADERBOARD_SIZE } from "../stats";
import { RATE_LIMIT_PRESETS } from "../rate-limit-db";
import { DEFAULT_LIMIT, MAX_LIMIT } from "./query";

const minutes = (ms: number) => Math.round(ms / 60_000);

// The leaderboard size in the text; the route serves the same LEADERBOARD_SIZE from stats.ts.
const LEADERBOARD_ROWS = LEADERBOARD_SIZE;

export const API_LIMITS = {
  keyPerMinute: RATE_LIMIT_PRESETS.API_KEY_MINUTE.limit,
  keyPerDay: RATE_LIMIT_PRESETS.API_KEY_DAY.limit,
  ipPerMinute: RATE_LIMIT_PRESETS.API_IP_MINUTE.limit,
  ipWindowMinutes: minutes(RATE_LIMIT_PRESETS.API_IP_MINUTE.windowMs),
  exportPerDay: RATE_LIMIT_PRESETS.EXPORT_DAY.limit,
  defaultLimit: DEFAULT_LIMIT,
  maxLimit: MAX_LIMIT,
} as const;

type Param = { name: string; in: "query" | "path"; required?: boolean; description: string; schema: Record<string, unknown> };

const LIMIT_PARAM: Param = {
  name: "limit",
  in: "query",
  description: `How many items to return. Default ${DEFAULT_LIMIT}, at most ${MAX_LIMIT}.`,
  schema: { type: "integer", minimum: 1, maximum: MAX_LIMIT, default: DEFAULT_LIMIT },
};

const CURSOR_PARAM: Param = {
  name: "cursor",
  in: "query",
  description: "The nextCursor from the previous page. Leave out for the first page.",
  schema: { type: "string" },
};

const DAY = (name: string, description: string): Param => ({ name, in: "query", description, schema: { type: "string", format: "date", example: "2026-11-01" } });

const ERROR_RESPONSES = {
  "400": { $ref: "#/components/responses/BadRequest" },
  "401": { $ref: "#/components/responses/Unauthorized" },
  "403": { $ref: "#/components/responses/Forbidden" },
  "404": { $ref: "#/components/responses/NotFound" },
  "429": { $ref: "#/components/responses/RateLimited" },
};

type OperationInput = {
  operationId: string;
  summary: string;
  description: string;
  tag: string;
  scope?: (typeof API_SCOPES)[number];
  anonymous?: boolean;
  params?: Param[];
  responseDescription: string;
  responseSchema?: Record<string, unknown>;
  badRequest?: boolean;
  notFound?: boolean;
};

function operation(input: OperationInput) {
  const responses: Record<string, unknown> = {
    "200": {
      description: input.responseDescription,
      content: { "application/json": { schema: input.responseSchema ?? { type: "object" } } },
    },
    "429": ERROR_RESPONSES["429"],
  };
  if (input.badRequest) responses["400"] = ERROR_RESPONSES["400"];
  if (input.notFound) responses["404"] = ERROR_RESPONSES["404"];
  if (!input.anonymous) {
    responses["401"] = ERROR_RESPONSES["401"];
    responses["403"] = ERROR_RESPONSES["403"];
  }
  return {
    operationId: input.operationId,
    summary: input.summary,
    description: input.description,
    tags: [input.tag],
    // Anonymous routes accept no key at all (the empty requirement); a bearer key is accepted too.
    security: input.anonymous ? [{}, { bearerAuth: [] }] : [{ bearerAuth: [] }],
    parameters: input.params ?? [],
    responses,
    ...(input.scope ? { "x-required-scope": input.scope } : {}),
  };
}

const PAGE_OF = (item: string) => ({
  type: "object",
  properties: {
    items: { type: "array", items: { $ref: `#/components/schemas/${item}` } },
    nextCursor: { type: ["string", "null"] },
  },
});

const ME_PROJECTS = "/api/v1/me/projects";

export const OPENAPI_DOCUMENT = {
  openapi: "3.1.0",
  info: {
    title: "LOADOUT public API",
    version: "1.0.0",
    summary: "Read only access to your own LOADOUT data and to the public parts of the program.",
    description:
      "Every route is GET. The API never accepts a write. Send a key you made in Settings as `Authorization: Bearer <key>`. " +
      `Keys can have these scopes: ${API_SCOPES.join(", ")}. ` +
      `Limits: ${API_LIMITS.keyPerMinute} requests a minute and ${API_LIMITS.keyPerDay} a day per key; ${API_LIMITS.ipPerMinute} a minute per address without a valid key; ` +
      `the export ${API_LIMITS.exportPerDay} a day. Every response has X-Request-Id and X-RateLimit-* headers; a 429 also has Retry-After. ` +
      "Errors are { error: { code, message } }.",
  },
  servers: [{ url: "/", description: "This site" }],
  tags: [
    { name: "me", description: "Your own data. Needs a key." },
    { name: "projects", description: "Public projects." },
    { name: "builders", description: "Public builder profiles." },
    { name: "stats", description: "Counts and leaderboards. Counts only, except a leaderboard row for a builder who turned it on." },
    { name: "docs", description: "This document and its reference page. No key needed." },
  ],
  paths: {
    "/api/v1/me": {
      get: operation({
        operationId: "getMe",
        summary: "Your profile",
        description: "Your own profile fields. Never your email, birthday, age or ids from other services.",
        tag: "me",
        scope: "profile",
        responseDescription: "The signed-in person.",
        responseSchema: { $ref: "#/components/schemas/Me" },
      }),
    },
    [ME_PROJECTS]: {
      get: operation({
        operationId: "listMyProjects",
        summary: "Your projects",
        description: "Your projects, newest first, with your own review reason if a reviewer wrote one.",
        tag: "me",
        scope: "projects",
        params: [LIMIT_PARAM, CURSOR_PARAM],
        badRequest: true,
        responseDescription: "A page of your projects.",
        responseSchema: PAGE_OF("OwnProject"),
      }),
    },
    "/api/v1/me/hours": {
      get: operation({
        operationId: "getMyHours",
        summary: "Your coded hours",
        description:
          "Hours coded in Hackatime, by day or week, with totals per project and per track. These are coded hours, not approved hours. " +
          "With no Hackatime link, source is none and the arrays are empty. The window can be 366 days at most.",
        tag: "me",
        scope: "hours",
        params: [DAY("from", "First day, inclusive. Default 30 days before to."), DAY("to", "Last day, inclusive. Default today (UTC)."), { name: "bucket", in: "query", description: "day or week (ISO weeks, Monday start).", schema: { type: "string", enum: ["day", "week"], default: "day" } }],
        badRequest: true,
        responseDescription: "The series and totals.",
      }),
    },
    "/api/v1/me/tracks": {
      get: operation({
        operationId: "getMyTracks",
        summary: "Your track levels",
        description: "Level and shop discount on each track, from approved hours. Needs the profile scope (coded hours are the hours scope).",
        tag: "me",
        scope: "profile",
        responseDescription: "One row per track.",
      }),
    },
    "/api/v1/me/ledger": {
      get: operation({
        operationId: "listMyLedger",
        summary: "Your Ore ledger",
        description: "Your own Ore entries, newest first, with your balances. Other people's Ore is never included.",
        tag: "me",
        scope: "ledger",
        params: [LIMIT_PARAM, CURSOR_PARAM],
        badRequest: true,
        responseDescription: "Balances and a page of entries.",
      }),
    },
    "/api/v1/me/activity": {
      get: operation({
        operationId: "getMyActivity",
        summary: "Your daily logged hours",
        description: "Self-reported journal hours per UTC day, zero where nothing was logged. Not approved hours. Window of 366 days at most.",
        tag: "me",
        scope: "activity",
        params: [DAY("from", "First day, inclusive. Default 90 days before to."), DAY("to", "Last day, inclusive. Default today (UTC).")],
        badRequest: true,
        responseDescription: "One row per day.",
      }),
    },
    "/api/v1/me/export": {
      get: operation({
        operationId: "exportMyData",
        summary: "Export everything we hold about you",
        description: `One JSON bundle of your profile, projects, journal, hours, ledger, orders, notifications, follows, blocks you made, and your keys without their secrets. Limited to ${API_LIMITS.exportPerDay} a day.`,
        tag: "me",
        scope: "export",
        responseDescription: "The export bundle, sent as an attachment.",
      }),
    },
    "/api/v1/projects": {
      get: operation({
        operationId: "listProjects",
        summary: "Public projects",
        description:
          "Public projects, newest first. q searches titles, descriptions and owner handles; words in q can also be track:tools or by:handle. " +
          "Banned projects are left out, and so is anyone blocked either way with you.",
        tag: "projects",
        scope: "projects",
        params: [
          { name: "q", in: "query", description: "Search words, up to 80 characters.", schema: { type: "string" } },
          { name: "track", in: "query", description: "One track.", schema: { type: "string", enum: ["Tools", "Systems", "Compute", "Hardware"] } },
          { name: "owner", in: "query", description: "One builder's handle.", schema: { type: "string" } },
          LIMIT_PARAM,
          CURSOR_PARAM,
        ],
        badRequest: true,
        responseDescription: "A page of projects.",
        responseSchema: PAGE_OF("PublicProject"),
      }),
    },
    "/api/v1/projects/{id}": {
      get: operation({
        operationId: "getProject",
        summary: "One public project",
        description: "A single public project. Anything you may not see is 404.",
        tag: "projects",
        scope: "projects",
        params: [{ name: "id", in: "path", required: true, description: "Project id.", schema: { type: "string" } }],
        notFound: true,
        responseDescription: "The project.",
        responseSchema: { $ref: "#/components/schemas/PublicProject" },
      }),
    },
    "/api/v1/projects/{id}/journal": {
      get: operation({
        operationId: "listProjectJournal",
        summary: "A project's journal",
        description: "Journal entries on one public project, newest first.",
        tag: "projects",
        scope: "journal",
        params: [{ name: "id", in: "path", required: true, description: "Project id.", schema: { type: "string" } }, LIMIT_PARAM, CURSOR_PARAM],
        badRequest: true,
        notFound: true,
        responseDescription: "A page of journal entries.",
      }),
    },
    "/api/v1/builders": {
      get: operation({
        operationId: "listBuilders",
        summary: "Builders",
        description: "Builders with a handle, sorted by handle. Banned builders and anyone blocked either way with you are left out.",
        tag: "builders",
        scope: "profile",
        params: [{ name: "q", in: "query", description: "Part of a handle.", schema: { type: "string" } }, LIMIT_PARAM, CURSOR_PARAM],
        badRequest: true,
        responseDescription: "A page of builders.",
        responseSchema: PAGE_OF("Builder"),
      }),
    },
    "/api/v1/builders/{handle}": {
      get: operation({
        operationId: "getBuilder",
        summary: "One builder",
        description: "A builder's public profile and how many public projects they have.",
        tag: "builders",
        scope: "profile",
        params: [{ name: "handle", in: "path", required: true, description: "The handle.", schema: { type: "string" } }],
        notFound: true,
        responseDescription: "The builder.",
        responseSchema: { $ref: "#/components/schemas/Builder" },
      }),
    },
    "/api/v1/stats/overview": {
      get: operation({
        operationId: "getStatsOverview",
        summary: "Latest overview counts",
        description: "Builders, active builders (last 7 days), hours logged and projects shipped, from the latest daily snapshot.",
        tag: "stats",
        scope: "stats",
        responseDescription: "The latest snapshot, or data null before the first snapshot runs.",
      }),
    },
    "/api/v1/stats/daily": {
      get: operation({
        operationId: "getStatsDaily",
        summary: "Daily history",
        description: "One row per written day for overview or tracks. Window of 366 days at most.",
        tag: "stats",
        scope: "stats",
        params: [
          { name: "kind", in: "query", description: "overview or tracks.", schema: { type: "string", enum: ["overview", "tracks"], default: "overview" } },
          DAY("from", "First day, inclusive. Default 30 days before to."),
          DAY("to", "Last day, inclusive. Default today (UTC)."),
        ],
        badRequest: true,
        responseDescription: "The days in the window.",
      }),
    },
    "/api/v1/stats/tracks": {
      get: operation({
        operationId: "getStatsTracks",
        summary: "Latest track counts",
        description: "Hours and builders per track, from the latest daily snapshot.",
        tag: "stats",
        scope: "stats",
        responseDescription: "The latest snapshot, or data null before the first snapshot runs.",
      }),
    },
    "/api/v1/leaderboards/hours": {
      get: operation({
        operationId: "getHoursLeaderboard",
        summary: "Hours leaderboard",
        description: `Handle and hours only, at most ${LEADERBOARD_ROWS} rows. Only builders who turned statsVisible on are listed.`,
        tag: "stats",
        scope: "stats",
        params: [{ name: "window", in: "query", description: "week (last 7 days) or all.", schema: { type: "string", enum: ["week", "all"], default: "week" } }],
        badRequest: true,
        responseDescription: "The ranked rows.",
      }),
    },
    "/api/v1/openapi.yaml": {
      get: operation({
        operationId: "getOpenApiDocument",
        summary: "This document",
        description: "The OpenAPI 3.1 document as YAML. No key needed.",
        tag: "docs",
        anonymous: true,
        responseDescription: "The document (text/yaml).",
      }),
    },
    "/api/v1/docs": {
      get: operation({
        operationId: "getApiDocs",
        summary: "Reference page",
        description: "A single HTML page: endpoints, scopes, limits and an example. No key needed and no scripts.",
        tag: "docs",
        anonymous: true,
        responseDescription: "The reference page (text/html).",
      }),
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "A key made in Settings, in the form ldk_ followed by 43 characters.",
      },
    },
    responses: {
      BadRequest: errorResponse("A query value is not valid. The message says which one."),
      Unauthorized: errorResponse("No key, or the key is unknown, revoked or expired."),
      Forbidden: errorResponse("The key does not have the scope this route needs, or the account cannot use the API."),
      NotFound: errorResponse("Nothing with that id or handle is visible to you."),
      RateLimited: {
        description: "Too many requests. Retry-After says how many seconds to wait.",
        headers: {
          "Retry-After": { schema: { type: "integer" } },
          "X-RateLimit-Limit": { schema: { type: "integer" } },
          "X-RateLimit-Remaining": { schema: { type: "integer" } },
          "X-RateLimit-Reset": { schema: { type: "integer" } },
        },
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
    schemas: {
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: { code: { type: "string" }, message: { type: "string" } },
          },
        },
      },
      Me: {
        type: "object",
        properties: {
          id: { type: "string" },
          handle: { type: ["string", "null"] },
          displayName: { type: "string" },
          bio: { type: ["string", "null"] },
          joinedAt: { type: "string", format: "date-time" },
          statsVisible: { type: "boolean" },
        },
      },
      OwnProject: { type: "object", description: "A project of yours, with status, approved hours and your review reason." },
      PublicProject: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: ["string", "null"] },
          track: { type: ["string", "null"] },
          status: { type: "string" },
          ownerHandle: { type: ["string", "null"] },
          approvedHours: { type: "number" },
          repoUrl: { type: ["string", "null"] },
          demoUrl: { type: ["string", "null"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Builder: {
        type: "object",
        properties: {
          handle: { type: "string" },
          bio: { type: ["string", "null"] },
          joinedAt: { type: "string", format: "date-time" },
          projectCount: { type: "integer" },
        },
      },
    },
  },
};

function errorResponse(description: string) {
  return {
    description,
    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
  };
}

export const OPENAPI_YAML = stringify(OPENAPI_DOCUMENT, { lineWidth: 0 });
