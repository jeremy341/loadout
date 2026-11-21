import { NextResponse } from "next/server";
import { guardedRoute } from "@/reviewer-dash/lib/ticketsApi";
import { isValidTicketTs, resolveTicketFromDash } from "@/reviewer-dash/lib/tickets";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ ts: string }> };

// Resolves a sample ticket in the in-memory store. Nothing is posted anywhere.
export const POST = guardedRoute<Ctx>("api.tickets.resolve", "helper", async (access, _req, { params }) => {
  const { ts } = await params;
  if (!isValidTicketTs(ts)) return NextResponse.json({ error: "invalid ticket id" }, { status: 400 });
  const result = await resolveTicketFromDash(ts, { slackId: access.session.slackId, username: access.session.name });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ ok: true, alreadyClosed: result.alreadyClosed ?? false, notice: result.notice ?? null });
});
