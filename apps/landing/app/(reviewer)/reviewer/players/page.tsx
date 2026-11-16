import { requirePage } from "@/reviewer-dash/lib/guard";
import { listPlayers } from "@/reviewer-dash/lib/db";
import { massPlayerAction } from "@/reviewer-dash/app/actions";
import { SelectAllBox, RowSelect } from "@/reviewer-dash/app/_components/MassSelect";
import {
  ActionButton,
  Badge,
  Card,
  CardHeader,
  EmptyRow,
  FilterBar,
  Field,
  Flash,
  Input,
  Mono,
  Muted,
  NativeSelect,
  PageHeader,
  Pagination,
  Table,
  TextLink,
  formatDate,
} from "@/reviewer-dash/app/_ui/ui";

export const dynamic = "force-dynamic";

const PER = 25;

// The route is /players (the sample keeps Pixl's path); the page says builders.
export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; done?: string; error?: string }>;
}) {
  const access = await requirePage("owner");
  const { q, page, done, error } = await searchParams;
  const all = await listPlayers(q);

  const total = all.length;
  const pages = Math.max(1, Math.ceil(total / PER));
  const cur = Math.min(Math.max(parseInt(page ?? "1", 10) || 1, 1), pages);
  const start = (cur - 1) * PER;
  const players = all.slice(start, start + PER);
  const qp = (n: number) => `/players?page=${n}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  const canWarn = access.isOwner;
  const canNotify = access.isOwner;
  const canBan = access.isOwner;
  const defaultAction = canWarn ? "warn" : canNotify ? "notify" : "ban";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PageHeader title="Builders" count={total} />
        <Flash error={error} ok={done} />
        <FilterBar q={q} placeholder="Search handles" />
      </div>

      <form action={massPlayerAction} className="flex flex-col gap-6">
        <input type="hidden" name="back" value={qp(cur)} />

        <Card>
          <CardHeader title="Mass action" icon="people-3" />
          <p className="hc-caption mb-4 text-sm">Tick builders below, then apply the action to all of them at once.</p>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Action">
              <NativeSelect name="massAction" defaultValue={defaultAction}>
                {canWarn && <option value="warn">Warn</option>}
                {canNotify && <option value="notify">Notify</option>}
                {canBan && <option value="ban">Propose ban</option>}
                {canBan && <option value="unban">Lift bans</option>}
              </NativeSelect>
            </Field>
            <Field label="Message / reason" hint="Required for ban and notify" className="min-w-56 flex-1">
              <Input name="message" maxLength={1000} placeholder="Sent to every selected builder" />
            </Field>
            <Field label="Title" hint="Notify only" className="w-44">
              <Input name="title" maxLength={100} placeholder="Message from the LOADOUT team" />
            </Field>
            <Field label="Ban length" hint="Proposals only" className="w-36">
              <NativeSelect name="days" defaultValue="7">
                <option value="1">1 day</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="0">Permanent</option>
              </NativeSelect>
            </Field>
            <ActionButton
              variant="danger"
              pendingLabel="Applying..."
              confirm="Apply this action to every selected builder?"
            >
              Apply to selected
            </ActionButton>
          </div>
        </Card>

        <div>
          <Card padding="flush">
            <Table headers={[<SelectAllBox key="all" />, "Builder", "Projects", "Violations", "Status", "Joined"]}>
              {players.map((p) => (
                <tr key={p.id}>
                  <td className="w-8">
                    <RowSelect id={p.id} label={`Select ${p.display_name || p.id}`} />
                  </td>
                  <td>
                    <TextLink href={`/players/${p.id}`} className="font-bold">
                      {p.display_name || "Unknown"}
                    </TextLink>
                    <div className="text-xs hc-muted">
                      <Mono>{p.id.replace(/^u-/, "")}</Mono>
                    </div>
                  </td>
                  <td className="tabular-nums">{p.projectCount}</td>
                  <td className="tabular-nums">
                    {p.violationCount > 0 ? <Badge tone="warning">{p.violationCount}</Badge> : <Muted>0</Muted>}
                  </td>
                  <td>{p.activeBan ? <Badge tone="danger">Banned</Badge> : <Badge tone="success">OK</Badge>}</td>
                  <td>
                    <Muted>
                      <Mono>{formatDate(p.created_at)}</Mono>
                    </Muted>
                  </td>
                </tr>
              ))}
              {players.length === 0 && (
                <EmptyRow colSpan={6} title="No builders found" icon="search">
                  Try a different handle.
                </EmptyRow>
              )}
            </Table>
          </Card>
          {total > 0 && (
            <p className="hc-caption mt-3 text-sm">
              Showing {start + 1} to {Math.min(start + PER, total)} of {total}
            </p>
          )}
        </div>
      </form>

      <Pagination page={cur} totalPages={pages} hrefFor={qp} />
    </div>
  );
}
