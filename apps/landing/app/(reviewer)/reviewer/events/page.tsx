import { requirePage } from "@/reviewer-dash/lib/guard";
import { listEvents, EVENT_TYPES, type DashEventRow } from "@/reviewer-dash/lib/db";
import { createEvent, stopEvent, deleteEvent } from "@/reviewer-dash/app/actions";
import { CreateEventForm } from "@/reviewer-dash/app/_components/CreateEventForm";
import {
  ActionButton,
  Badge,
  Card,
  CardHeader,
  EmptyRow,
  Flash,
  Muted,
  PageHeader,
  Table,
  type Tone,
} from "@/reviewer-dash/app/_ui/ui";

export const dynamic = "force-dynamic";

type EventStatus = "live" | "upcoming" | "ended" | "stopped";

function status(ev: DashEventRow): EventStatus {
  const now = new Date().toISOString();
  if (ev.stopped_at) return "stopped";
  if (ev.starts_at > now) return "upcoming";
  if (ev.ends_at <= now) return "ended";
  return "live";
}

const STATUS_TONE: Record<EventStatus, Tone> = {
  live: "success",
  upcoming: "info",
  ended: "neutral",
  stopped: "danger",
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  await requirePage("owner");
  const { error, created } = await searchParams;
  const events = await listEvents();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Events"
        count={events.length}
        description="Events builders see on the platform. Only Show and Tell is planned, so that is the only type. All times are UTC. An event gives no Ore or Track XP."
      />
      <Flash error={error} ok={created ? "Event created." : null} />

      <Card>
        <CardHeader title="Plan an event" icon="plus" />
        <p className="hc-caption -mt-2 mb-4 text-sm">The dates and format are still open on the participant side, so nothing here is announced.</p>
        <CreateEventForm action={createEvent} types={EVENT_TYPES} />
      </Card>

      <Card padding="flush">
        <CardHeader title="All events" icon="event-code" count={events.length} />
        <Table headers={["Event", "Status", "Window (UTC)", ""]}>
          {events.map((ev) => {
            const st = status(ev);
            const note = typeof ev.config.note === "string" ? ev.config.note : "";
            return (
              <tr key={ev.id}>
                <td>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{ev.name}</span>
                    <Badge tone="neutral" outline>
                      {EVENT_TYPES[ev.type] ?? ev.type}
                    </Badge>
                  </div>
                  {note && (
                    <div className="mt-1 text-sm">
                      <Muted>{note}</Muted>
                    </div>
                  )}
                </td>
                <td>
                  <Badge tone={STATUS_TONE[st]}>{st}</Badge>
                </td>
                <td className="text-sm">
                  <div>
                    {fmt(ev.starts_at)} to {fmt(ev.ends_at)}
                  </div>
                  {ev.created_by && (
                    <div className="text-xs">
                      <Muted>by {ev.created_by.replace(/\s*\([^)]*\)\s*$/, "")}</Muted>
                    </div>
                  )}
                </td>
                <td>
                  <div className="flex items-center justify-end gap-2">
                    {(st === "live" || st === "upcoming") && (
                      <form action={stopEvent}>
                        <input type="hidden" name="id" value={ev.id} />
                        <ActionButton
                          variant="danger"
                          size="sm"
                          pendingLabel="Stopping..."
                          confirm={`Stop "${ev.name}" now? Builders stop seeing it immediately.`}
                        >
                          Stop
                        </ActionButton>
                      </form>
                    )}
                    {st !== "live" && (
                      <form action={deleteEvent}>
                        <input type="hidden" name="id" value={ev.id} />
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          icon="delete"
                          pendingLabel="Deleting..."
                          confirm={`Delete "${ev.name}"? This can't be undone.`}
                        >
                          Delete
                        </ActionButton>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {events.length === 0 && (
            <EmptyRow colSpan={4} title="No events yet" icon="event-code">
              Plan one above.
            </EmptyRow>
          )}
        </Table>
      </Card>
    </div>
  );
}
