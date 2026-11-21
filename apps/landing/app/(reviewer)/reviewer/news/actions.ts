"use server";

// The one staff write of the News section: an owner publishes a note on the reviewer site (requirePage's gate, the same
// matrix as every other reviewer page). The row and its audit trail are written by lib/platform/content-data.ts
// (createNews: News row plus an AuditEvent "news.publish"), so this action only reads the form and guards the write.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePage } from "@/reviewer-dash/lib/guard";
import { createNews, NEWS_BODY_MAX, NEWS_TITLE_MAX } from "@/lib/platform/content-data";
import { readViewer } from "@/lib/platform/session";

const post = (data: FormData, key: string, max: number): string => String(data.get(key) ?? "").trim().slice(0, max);

export async function publishNews(formData: FormData): Promise<void> {
  await requirePage("owner");
  const fail = (msg: string): never => redirect(`/news?error=${encodeURIComponent(msg)}`);

  const title = post(formData, "title", NEWS_TITLE_MAX);
  const body = post(formData, "body", NEWS_BODY_MAX);
  if (title === "") fail("Give the news a title.");
  if (body === "") fail("Write the news.");

  const viewer = await readViewer();
  if (!viewer) redirect("/news?error=Sign%20in%20again%20to%20publish.");

  let error = "";
  try {
    await createNews({ title, body }, viewer.id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not publish the news.";
  }
  if (error) fail(error);

  // The builders' pages read these rows per request; the revalidate keeps any cached copy honest too.
  revalidatePath("/dashboard/community/news");
  revalidatePath("/dashboard/community");
  redirect("/news?created=1");
}
