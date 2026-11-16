import { requirePage } from "@/reviewer-dash/lib/guard";
import { listShowNTellRounds, listShowNTellEntries, searchShippableProjects } from "@/reviewer-dash/lib/db";
import {
  createShowNTellRound,
  openShowNTellRound,
  closeShowNTellRound,
  addShowNTellEntry,
  addCustomShowNTellEntry,
  removeShowNTellEntry,
} from "@/reviewer-dash/app/actions";
import {
  ActionButton,
  Badge,
  Button,
  Card,
  CardHeader,
  Details,
  EmptyRow,
  Field,
  Icon,
  Input,
  Muted,
  PageHeader,
  Table,
  TextLink,
  formatDate,
} from "@/reviewer-dash/app/_ui/ui";

export const dynamic = "force-dynamic";

export default async function ShowNTellPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; round?: string }>;
}) {
  await requirePage("owner");
  const { q, round: roundParam } = await searchParams;

  const rounds = await listShowNTellRounds();
  const openRound = rounds.find((r) => r.is_open) ?? null;
  const selectedRoundId = Number(roundParam) || openRound?.id || rounds[0]?.id || 0;
  const selectedRound = rounds.find((r) => r.id === selectedRoundId) ?? null;

  const [entries, searchResults] = await Promise.all([
    selectedRound ? listShowNTellEntries(selectedRound.id) : Promise.resolve([]),
    q ? searchShippableProjects(q) : Promise.resolve([]),
  ]);
  const existingProjectIds = new Set(entries.map((e) => e.project_id));
  const sortedEntries = entries.slice().sort((a, b) => b.vote_count - a.vote_count);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Show & Tell"
        description="One vote per builder per project. Builders sign in for real, so it's not a stuffable form. Open a round when a Show and Tell is happening, add the projects being shown, and close it when it wraps up. A round gives no Ore or Track XP."
      />

      <Card>
        <CardHeader title="New round" icon="plus" />
        <form action={createShowNTellRound} className="flex flex-wrap items-end gap-3">
          <Field label="Title" className="min-w-48 flex-1">
            <Input name="title" required maxLength={120} placeholder="e.g. Show and Tell 5: Things with wheels" />
          </Field>
          <ActionButton pendingLabel="Creating...">Create round</ActionButton>
        </form>
      </Card>

      <Card padding="flush">
        <CardHeader title="Rounds" icon="event-code" count={rounds.length} />
        <Table headers={["Round", "Status", "When", ""]}>
          {rounds.map((r) => (
            <tr key={r.id}>
              <td>
                <TextLink href={`/show-n-tell?round=${r.id}`} className="font-bold">
                  {r.title}
                </TextLink>
                {r.id === selectedRoundId && (
                  <span className="ml-2">
                    <Badge tone="info" outline>
                      viewing
                    </Badge>
                  </span>
                )}
              </td>
              <td>{r.is_open ? <Badge tone="success">Open</Badge> : <Badge tone="neutral">Closed</Badge>}</td>
              <td className="text-sm">
                <Muted>
                  {r.is_open
                    ? `opened ${formatDate(r.opened_at)}`
                    : r.closed_at
                      ? `closed ${formatDate(r.closed_at)}`
                      : `created ${formatDate(r.created_at)}`}
                </Muted>
              </td>
              <td>
                <div className="flex justify-end">
                  {r.is_open ? (
                    <form action={closeShowNTellRound}>
                      <input type="hidden" name="id" value={r.id} />
                      <ActionButton variant="outline" size="sm" pendingLabel="Closing...">
                        Close
                      </ActionButton>
                    </form>
                  ) : (
                    <form action={openShowNTellRound}>
                      <input type="hidden" name="id" value={r.id} />
                      <ActionButton variant="success" size="sm" pendingLabel="Opening...">
                        Open
                      </ActionButton>
                    </form>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {rounds.length === 0 && (
            <EmptyRow colSpan={4} title="No rounds yet" icon="event-code">
              Create one above.
            </EmptyRow>
          )}
        </Table>
      </Card>

      {selectedRound && (
        <>
          <Card>
            <CardHeader title={<>Add a project to &ldquo;{selectedRound.title}&rdquo;</>} icon="search" />
            <form className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="round" value={selectedRound.id} />
              <div className="relative min-w-60 flex-1">
                <Icon
                  glyph="search"
                  size={20}
                  className="hc-muted pointer-events-none absolute top-1/2 left-2 -translate-y-1/2"
                />
                <Input
                  name="q"
                  type="search"
                  defaultValue={q ?? ""}
                  placeholder="Search projects by name (shipped or still in progress)"
                  className="hc-input-search"
                />
              </div>
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>
            {q && (
              <div className="mt-3 flex flex-col gap-2">
                {searchResults.map((p) => (
                  <div key={p.id} className="hc-panel flex items-center gap-3 text-sm">
                    <span className="font-bold">{p.name}</span>
                    <Muted className="text-xs">{p.owner}</Muted>
                    <div className="ml-auto">
                      {existingProjectIds.has(p.id) ? (
                        <Badge tone="neutral">Already added</Badge>
                      ) : (
                        <form action={addShowNTellEntry}>
                          <input type="hidden" name="roundId" value={selectedRound.id} />
                          <input type="hidden" name="projectId" value={p.id} />
                          <ActionButton size="sm" icon="plus" pendingLabel="Adding...">
                            Add
                          </ActionButton>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
                {searchResults.length === 0 && <Muted className="text-sm">No projects match that search.</Muted>}
              </div>
            )}
            <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <form action={addCustomShowNTellEntry} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="roundId" value={selectedRound.id} />
                <Field
                  label="Not on the platform?"
                  hint="Add it by name instead, no project record needed."
                  className="min-w-60 flex-1"
                >
                  <Input name="customName" required maxLength={120} placeholder="e.g. a live demo shown at the event" />
                </Field>
                <ActionButton variant="outline" pendingLabel="Adding...">
                  Add
                </ActionButton>
              </form>
            </div>
          </Card>

          <Card padding="flush">
            <CardHeader
              title={<>Entries in &ldquo;{selectedRound.title}&rdquo;</>}
              icon="list"
              count={entries.length}
            />
            <Table headers={["Project", "Votes", "Added by", ""]}>
              {sortedEntries.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="font-bold">{e.project_name}</div>
                    <div className="text-xs">
                      <Muted>{e.project_owner}</Muted>
                    </div>
                    {e.voters.length > 0 && (
                      <div className="mt-2">
                        <Details summary={`${e.voters.length} voter${e.voters.length === 1 ? "" : "s"}`}>
                          <div className="flex flex-wrap gap-1.5">
                            {e.voters.map((v) => (
                              <Badge key={v.id} tone="neutral" outline>
                                {v.name || v.id.slice(0, 8)}
                                <Muted>
                                  {new Date(v.voted_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    timeZone: "UTC",
                                  })}
                                </Muted>
                              </Badge>
                            ))}
                          </div>
                        </Details>
                      </div>
                    )}
                  </td>
                  <td>
                    <Badge tone="info">
                      {e.vote_count} vote{e.vote_count === 1 ? "" : "s"}
                    </Badge>
                  </td>
                  <td className="text-sm">
                    <Muted>{e.added_by}</Muted>
                  </td>
                  <td>
                    <div className="flex justify-end">
                      <form action={removeShowNTellEntry}>
                        <input type="hidden" name="id" value={e.id} />
                        <ActionButton variant="ghost" size="sm" icon="delete" pendingLabel="Removing...">
                          Remove
                        </ActionButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <EmptyRow colSpan={4} title="No entries yet" icon="search">
                  Search above to add one.
                </EmptyRow>
              )}
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
