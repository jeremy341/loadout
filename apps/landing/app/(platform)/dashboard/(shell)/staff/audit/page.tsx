import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/app/_components/platform/PlatformNotice";
import { db } from "@/lib/platform/db";
import { requireStaff } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Audit log - LOADOUT" };

const PAGE_SIZE = 50;
const timeFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

type SearchParams = Promise<{ page?: string }>;

export default async function AuditPage({ searchParams }: { searchParams: SearchParams }) {
  await requireStaff();
  const { page: pageParam } = await searchParams;
  const parsed = Number.parseInt(pageParam ?? "1", 10);
  const total = await db().auditEvent.count();
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number.isFinite(parsed) ? parsed : 1), lastPage);

  const events = await db().auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });
  const actorIds = [...new Set(events.map((event) => event.actorId))];
  const actors = await db().person.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, displayName: true },
  });
  const names = new Map(actors.map((actor) => [actor.id, actor.displayName]));

  return (
    <>
      <h1>Audit log</h1>
      <p className="pf-lead">Every staff change, newest first. Rows are never edited or removed.</p>
      {events.length === 0 ? (
        <EmptyState title="No staff actions yet">Changes to people, roles and flags will be listed here.</EmptyState>
      ) : (
        <>
          <div className="pf-table-wrap">
            <table className="pf-table">
              <caption className="pf-hint">Page {page} of {lastPage}, {total} events in total</caption>
              <thead>
                <tr>
                  <th scope="col">Time (UTC)</th>
                  <th scope="col">Actor</th>
                  <th scope="col">Action</th>
                  <th scope="col">Target</th>
                  <th scope="col">Reason</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{timeFormat.format(event.createdAt)}</td>
                    <td>{names.get(event.actorId) ?? "Removed account"}</td>
                    <td className="pf-break">{event.action}</td>
                    <td className="pf-break">
                      {event.targetType} {event.targetId}
                    </td>
                    <td className="pf-break">{event.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav aria-label="Audit log pages" className="pf-pager">
            {page > 1 ? <Link href={`/dashboard/staff/audit?page=${page - 1}`}>Newer</Link> : <span className="pf-hint">Newer</span>}
            <span>Page {page} of {lastPage}</span>
            {page < lastPage ? <Link href={`/dashboard/staff/audit?page=${page + 1}`}>Older</Link> : <span className="pf-hint">Older</span>}
          </nav>
        </>
      )}
    </>
  );
}
