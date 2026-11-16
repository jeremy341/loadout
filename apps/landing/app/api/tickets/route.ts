import { NextResponse } from "next/server";
import { guardedRoute } from "@/reviewer-dash/lib/ticketsApi";
import { listTickets } from "@/reviewer-dash/lib/tickets";

export const dynamic = "force-dynamic";

// The tickets list for the Tickets page, from the sample tickets.
export const GET = guardedRoute("api.tickets.list", "helper", async (_access, req) => {
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const status = statusParam === "closed" || statusParam === "all" ? statusParam : "open";
  const tickets = await listTickets(status, searchParams.get("search") ?? "");
  return NextResponse.json({ tickets });
});
