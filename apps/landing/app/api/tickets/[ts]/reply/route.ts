import { NextResponse } from "next/server";
import { guardedRoute } from "@/reviewer-dash/lib/ticketsApi";
import { isValidTicketTs, ticketReply } from "@/reviewer-dash/lib/tickets";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ ts: string }> };

// Adds a reply to a sample ticket's thread in the in-memory store. Nothing is posted anywhere.
export const POST = guardedRoute<Ctx>("api.tickets.reply", "helper", async (access, req, { params }) => {
  const { ts } = await params;
  if (!isValidTicketTs(ts)) return NextResponse.json({ error: "invalid ticket id" }, { status: 400 });
  const body = (await req.json().catch(() => ({}))) as { text?: string };
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 4000) : "";
  if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });
  try {
    const reply = await ticketReply(ts, text, { slackId: access.session.slackId, username: access.session.name });
    return NextResponse.json({ ok: true, saved: reply.saved, notice: reply.notice });
  } catch {
    // An upstream error can contain internal addresses or tokens. Never echo it to the browser.
    return NextResponse.json({ error: "Could not post the reply. Try again shortly." }, { status: 502 });
  }
});
