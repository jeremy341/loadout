import { cache } from "react";
import { PREVIEW_COOKIE, readViewer, type Viewer } from "@/lib/platform/session";
import { localTestAccountsEnabled } from "@/lib/platform/local-accounts";
import { databaseConfigured } from "@/lib/platform/db";
import { cookies } from "next/headers";

// The signed-in participant reading the docs, or null for a visitor. Once per request, so the layout and the page agree.
// Never throws: when the database or the session cannot be read, the docs fall back to the public layout.
// In local development the preview cookie "visitor" shows the public layout, so both can be checked with the test accounts on.
export const docsViewer = cache(async (): Promise<Viewer | null> => {
  try {
    if (!databaseConfigured()) return null;
    if (localTestAccountsEnabled() && (await cookies()).get(PREVIEW_COOKIE)?.value === "visitor") return null;
    return await readViewer();
  } catch (error) {
    // A signed-in builder who lands here sees the public docs, with the wrong back link. Log why, so the cause is visible.
    console.error("docs viewer unreadable; showing the public layout", error instanceof Error ? error.name : "unknown");
    return null;
  }
});
