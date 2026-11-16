import { NextResponse } from "next/server";
import { guardedRoute } from "@/reviewer-dash/lib/ticketsApi";
import { isMissingThread, isValidTicketTs, ticketThread } from "@/reviewer-dash/lib/tickets";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ ts: string }> };

export const GET = guardedRoute<Ctx>("api.tickets.thread", "helper", async (_access, _req, { params }) => {
  const { ts } = await params;
  if (!isValidTicketTs(ts)) return NextResponse.json({ error: "invalid ticket id" }, { status: 400 });
  try {
    return NextResponse.json({ messages: await ticketThread(ts) });
  } catch (e) {
    if (isMissingThread(e)) return NextResponse.json({ error: "thread_not_found" }, { status: 404 });
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
});
