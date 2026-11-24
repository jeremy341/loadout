import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { notBlockedWith } from "@/lib/platform/blocks-data";
import { db } from "@/lib/platform/db";
import { deleteJournalMedia, mediaWriteDeps } from "@/lib/platform/media-data";
import { readImage } from "@/lib/platform/media-store";
import { sameOrigin } from "@/lib/platform/same-origin";
import { createRateLimiter } from "@/lib/platform/rate-limit";
import { readViewer } from "@/lib/platform/session";
import { IMAGE_MIME, type ImageType } from "@/lib/platform/uploads";

// GET /api/journal-media/[id]     the image, for any signed in builder who is not blocked either way with the owner. A deleted file
//                                  is a 404. A photo that is not on an entry yet is the owner's alone and is never cached. The type
//                                  comes from the stored extension, which the server chose.
// DELETE /api/journal-media/[id]   owner only: marks the record deleted and removes the file. A cover and a photo both follow the
//                                  journal's lock, and a photo on an entry a reviewer decided stays. The final gates and the update
//                                  are re-checked in media-data's project-locked transaction before the file is removed.
const EXT_TYPE: Record<string, ImageType> = { jpg: "jpeg", png: "png", webp: "webp" };
const notFound = () => new NextResponse("Not found", { status: 404 });

// A journal page loads its photos together, so the room is generous. The cap stops one signed-in account from driving disk
// reads and database reads without limit (L2).
const mediaReads = createRateLimiter({ limit: 300, windowMs: 60_000 });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await readViewer();
  if (!viewer) return notFound();
  if (!mediaReads.check(`viewer:${viewer.id}`).ok) {
    return new NextResponse("Too many requests", { status: 429, headers: { "Retry-After": "60" } });
  }
  const { id } = await params;
  const row = await db().journalMedia.findFirst({
    where: { id, deletedAt: null, project: { status: { not: "banned" }, owner: { bannedAt: null, ...notBlockedWith(viewer.id) } } },
    select: { path: true, entryId: true, kind: true, project: { select: { ownerId: true } } },
  });
  if (!row) return notFound();
  const staged = row.kind === "photo" && row.entryId === null;
  if (staged && row.project.ownerId !== viewer.id) return notFound();
  const bytes = await readImage(row.path);
  const type = EXT_TYPE[row.path.split(".").pop() ?? ""];
  if (!bytes || !type) return notFound();
  // A staged photo is never cached. Every response varies by cookie, because who may see the file depends on who asks.
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": IMAGE_MIME[type],
      "Content-Length": String(bytes.length),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": staged ? "private, no-store" : "private, max-age=3600",
      Vary: "Cookie",
      "Cross-Origin-Resource-Policy": "same-origin",
      "Content-Disposition": "inline",
    },
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "That request did not come from this site." }, { status: 403 });
  const viewer = await readViewer();
  if (!viewer) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await params;
  const result = await deleteJournalMedia({ id, viewerId: viewer.id }, mediaWriteDeps());
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.status });
  revalidatePath(`/dashboard/projects/${result.projectId}`);
  return NextResponse.json({ ok: true });
}
