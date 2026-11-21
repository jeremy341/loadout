import { request, type APIRequestContext, type BrowserContext } from "@playwright/test";

// The reviewer site answers on review.<host>. Chromium resolves *.localhost itself; Node's own requests do not, so API-level checks go to
// 127.0.0.1 with a Host header instead.
const main = new URL(process.env.LOADOUT_TEST_BASE_URL ?? `http://localhost:${process.env.LOADOUT_TEST_PORT ?? "3001"}`);
export const REVIEW_HOST = `review.localhost${main.port ? `:${main.port}` : ""}`;
export const REVIEW_BASE = `${main.protocol}//${REVIEW_HOST}`;

export type PreviewRole =
  | "owner"
  | "reviewer"
  | "final-reviewer"
  | "hardware-reviewer"
  | "software-reviewer"
  | "integrity-reviewer"
  | "helper"
  | "fulfiller"
  | "builder"
  | "none";

/** Signs the browser context in as one of the local preview accounts (the cookie works only while local test accounts are on). */
export async function actAs(context: BrowserContext, role: PreviewRole) {
  await context.addCookies([{ name: "loadout_preview_role", value: role, url: REVIEW_BASE }]);
}

/** A plain HTTP client for the review host that never follows redirects, so a redirect can be asserted as one. */
export function reviewClient(role: PreviewRole): Promise<APIRequestContext> {
  return request.newContext({
    baseURL: `${main.protocol}//127.0.0.1:${main.port || "80"}`,
    extraHTTPHeaders: { Host: REVIEW_HOST, Cookie: `loadout_preview_role=${role}` },
    maxRedirects: 0,
  });
}
