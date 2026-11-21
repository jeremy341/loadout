import Link from "next/link";
import { db } from "@/lib/platform/db";
import { operationStatus } from "@/lib/reviewer/program-operations";
import { requirePage } from "@/reviewer-dash/lib/guard";
import { ActionButton, Badge, Callout, Card, CardHeader, Details, EmptyRow, EmptyState, Field, Input, Mono, PageHeader, Table } from "@/reviewer-dash/app/_ui/ui";
import { controlOperation, createOperation } from "./actions";

const dateTime = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
const AUDIT_LIMIT = 12;
const tone = { Scheduled: "info", Active: "success", Paused: "warning", Ended: "neutral" } as const;

export default async function OperationsPage({ searchParams }: {
  searchParams: Promise<{ slug?: string; ok?: string; error?: string }>;
}) {
  await requirePage("owner");
  const query = await searchParams;
  const operations = await db().programOperation.findMany({ orderBy: [{ startsAt: "desc" }, { slug: "asc" }] });
  const now = new Date();
  // With no ?slug, open the one in progress (Active or Paused) rather than the latest to start, which may be a future one.
  const selected = operations.find((operation) => operation.slug === query.slug)
    ?? operations.find((operation) => ["Active", "Paused"].includes(operationStatus(operation, now)))
    ?? operations[0];
  const audit = selected ? await db().auditEvent.findMany({
    where: { targetType: "operation", targetId: selected.id },
    orderBy: { createdAt: "desc" },
    take: AUDIT_LIMIT,
  }) : [];
  const people = audit.length ? await db().person.findMany({
    where: { id: { in: [...new Set(audit.map((event) => event.actorId))] } },
    select: { id: true, displayName: true },
  }) : [];
  const names = new Map(people.map((person) => [person.id, person.displayName]));
  const status = selected ? operationStatus(selected, now) : null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Operations" description="Schedule and manage LOADOUT operations. Pick one to see its status and audit history. All times are UTC." />
      {query.error ? <Callout tone="danger">{query.error}</Callout> : null}
      {query.ok ? <Callout tone="success">{query.ok}</Callout> : null}
      {operations.length ? (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <Card padding="flush">
            <CardHeader title="Operations" count={operations.length} />
            <ul aria-label="Operations">
              {operations.map((operation) => {
                const state = operationStatus(operation, now);
                const current = operation.id === selected?.id;
                return (
                  <li key={operation.id} className="border-b border-[var(--border)] last:border-b-0">
                    <Link
                      href={`/operations?slug=${encodeURIComponent(operation.slug)}`}
                      aria-current={current ? "page" : undefined}
                      className="flex flex-col gap-1 px-4 py-3 hover:bg-[var(--surface-hover)] aria-[current=page]:bg-[var(--surface-hover)] aria-[current=page]:shadow-[inset_3px_0_0_var(--primary)]"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate font-bold">{operation.name}</span>
                        <Badge tone={tone[state]}>{state}</Badge>
                      </span>
                      <span className="hc-muted text-xs">{dateTime.format(operation.startsAt)} to {dateTime.format(operation.endedAt ?? operation.endsAt)} UTC</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
          {selected && status ? (
            <div className="flex min-w-0 flex-col gap-5">
              <Card>
                <CardHeader title={selected.name} />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={tone[status]}>{status}</Badge>
                  <Mono>{selected.slug}</Mono>
                </div>
                <p className="my-2">{dateTime.format(selected.startsAt)} to {dateTime.format(selected.endedAt ?? selected.endsAt)} UTC</p>
                {selected.pausedAt && status === "Paused" ? <p className="hc-muted mb-2 text-sm">Paused since {dateTime.format(selected.pausedAt)} UTC.</p> : null}
                {status !== "Ended" ? (
                  <div className="flex flex-col gap-3">
                    <form action={controlOperation}>
                      <OperationFields slug={selected.slug} version={selected.version} control={status === "Paused" ? "resume" : "pause"} />
                      <ReasonField />
                      <ActionButton variant="outline">{status === "Paused" ? "Resume operation" : "Pause operation"}</ActionButton>
                    </form>
                    <Details summary="Edit schedule or name">
                      <form action={controlOperation} className="flex flex-col gap-3">
                        <OperationFields slug={selected.slug} version={selected.version} control="edit" />
                        <Field label="Name"><Input name="name" defaultValue={selected.name} required maxLength={120} /></Field>
                        {now < selected.startsAt ? <Field label="Start (UTC)"><Input name="startsAt" type="datetime-local" defaultValue={selected.startsAt.toISOString().slice(0, 16)} required /></Field> : null}
                        <Field label="End (UTC)"><Input name="endsAt" type="datetime-local" defaultValue={selected.endsAt.toISOString().slice(0, 16)} required /></Field>
                        <ReasonField />
                        <ActionButton>Save settings</ActionButton>
                      </form>
                    </Details>
                    <Details summary="Extend operation">
                      <form action={controlOperation} className="flex flex-col gap-3">
                        <OperationFields slug={selected.slug} version={selected.version} control="extend" />
                        <Field label="New end (UTC)"><Input name="endsAt" type="datetime-local" required /></Field>
                        <ReasonField />
                        <ActionButton>Extend</ActionButton>
                      </form>
                    </Details>
                    {status !== "Scheduled" && (
                      <Details summary="End operation now">
                        <form action={controlOperation} className="flex flex-col gap-3">
                          <OperationFields slug={selected.slug} version={selected.version} control="end" />
                          <label><input type="checkbox" name="confirmEnd" value="yes" required /> Confirm early end</label>
                          <ReasonField />
                          <ActionButton variant="danger">End operation</ActionButton>
                        </form>
                      </Details>
                    )}
                  </div>
                ) : <p className="hc-muted text-sm">This operation has ended and can no longer be changed.</p>}
              </Card>
              <Card padding="flush">
                <CardHeader title="Audit history" count={audit.length} />
                <p className="hc-muted px-4 pt-3 text-sm">Changes to {selected.name}, newest first. The latest {AUDIT_LIMIT} are shown.</p>
                <Table headers={["Time (UTC)", "Action", "Changed by", "Reason"]}>
                  {!audit.length ? <EmptyRow colSpan={4} title="No changes recorded for this operation" /> : null}
                  {audit.map((event) => (
                    <tr key={event.id}>
                      <td className="whitespace-nowrap">{dateTime.format(event.createdAt)}</td>
                      <td>{event.action.replace("operation.", "")}</td>
                      <td>{names.get(event.actorId) ?? "Former staff member"}</td>
                      <td>{event.reason}</td>
                    </tr>
                  ))}
                </Table>
              </Card>
            </div>
          ) : null}
        </div>
      ) : (
        <Card>
          <CardHeader title="Operations" count={0} />
          <EmptyState title="No operations have been scheduled">Create the first one below. It starts as Scheduled and becomes Active at its start time.</EmptyState>
        </Card>
      )}
      {operations.length ? (
        <Card>
          <Details summary="Schedule a new operation" open={Boolean(query.error) && !query.slug}>
            <div className="pt-3">
              <form action={createOperation} className="flex flex-col gap-3">
                <Field label="Name"><Input name="name" required maxLength={120} /></Field>
                <Field label="Slug"><Input name="slug" required maxLength={64} pattern="[a-z0-9][a-z0-9\-]{0,63}" /></Field>
                <Field label="Start (UTC)"><Input name="startsAt" type="datetime-local" required /></Field>
                <Field label="End (UTC)"><Input name="endsAt" type="datetime-local" required /></Field>
                <ReasonField name="reason" />
                <ActionButton>Create operation</ActionButton>
              </form>
            </div>
          </Details>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Create operation" />
          <form action={createOperation} className="flex flex-col gap-3">
            <Field label="Name"><Input name="name" required maxLength={120} /></Field>
            <Field label="Slug"><Input name="slug" required maxLength={64} pattern="[a-z0-9][a-z0-9\-]{0,63}" /></Field>
            <Field label="Start (UTC)"><Input name="startsAt" type="datetime-local" required /></Field>
            <Field label="End (UTC)"><Input name="endsAt" type="datetime-local" required /></Field>
            <ReasonField name="reason" />
            <ActionButton>Create operation</ActionButton>
          </form>
        </Card>
      )}
    </div>
  );
}

function OperationFields({ slug, version, control }: { slug: string; version: number; control: string }) {
  return <>
    <input type="hidden" name="slug" value={slug} />
    <input type="hidden" name="version" value={version} />
    <input type="hidden" name="control" value={control} />
  </>;
}

// Every creation and control change is audited with a written reason. The server checks the same 10-character minimum.
function ReasonField({ name = "note" }: { name?: string }) {
  return (
    <Field label="Reason" hint="At least 10 characters. Saved in the audit history.">
      <Input name={name} required minLength={10} maxLength={500} />
    </Field>
  );
}
