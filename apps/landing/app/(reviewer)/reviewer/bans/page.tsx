import { canDecide } from "@/lib/reviewer/moderation";
import { requirePage, can } from "@/reviewer-dash/lib/guard";
import { listBans, listBanLog, listBanProposals, banIsActive } from "@/reviewer-dash/lib/db";
import { banLength } from "@/reviewer-dash/lib/sample/moderation-data";
import { LiftBanForm } from "@/reviewer-dash/app/_components/Moderate";
import { confirmBanProposal, rejectBanProposal } from "@/reviewer-dash/app/actions";
import {
  ActionButton,
  Badge,
  Card,
  EmptyRow,
  Flash,
  LinkTabs,
  Muted,
  PageHeader,
  Table,
  TextLink,
  formatDate,
  formatDateTime,
} from "@/reviewer-dash/app/_ui/ui";

export const dynamic = "force-dynamic";

const DESCRIPTIONS = {
  bans: "Every ban ever issued, newest first. Lifting removes all active bans for that builder.",
  proposed: "A ban is proposed by one person and confirmed by a different owner. Whoever proposed it cannot confirm it.",
  logs: "Every ban proposal, ban, lift and warning with who did it, newest first.",
};

const LOG_LABEL: Record<string, string> = { ban: "Banned", unban: "Lifted", propose: "Proposed", warn: "Warned", overturn: "Overturned", withdraw: "Withdrawn" };
const LOG_TONE: Record<string, "danger" | "success" | "warning"> = { ban: "danger", unban: "success", propose: "warning", warn: "warning", overturn: "success", withdraw: "success" };

export default async function BansPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; error?: string; ok?: string }>;
}) {
  const access = await requirePage("owner");
  const canConfirm = can(access, "owner");
  const { tab, error, ok } = await searchParams;
  const me = access.session.slackId;
  const active = tab === "logs" ? "logs" : tab === "proposed" ? "proposed" : "bans";
  const [bans, log, proposals] = await Promise.all([
    active === "bans" ? listBans() : Promise.resolve([]),
    active === "logs" ? listBanLog() : Promise.resolve([]),
    listBanProposals("pending"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Bans" description={DESCRIPTIONS[active]} />
      <Flash error={error} ok={ok} />

      <Card padding="flush">
        <LinkTabs
          active={active}
          tabs={[
            { key: "bans", href: "/bans", label: "Bans" },
            {
              key: "proposed",
              href: "/bans?tab=proposed",
              label: "Proposed",
              count: proposals.length || undefined,
            },
            { key: "logs", href: "/bans?tab=logs", label: "Ban log" },
          ]}
        />

        {active === "bans" && (
          <Table headers={["Builder", "Reason", "Banned by", "Ends", "Status", "Issued", ""]}>
            {bans.map((b) => {
              const isActive = banIsActive(b);
              return (
                <tr key={b.id}>
                  <td>
                    <TextLink href={`/players/${b.user_id}`} className="font-bold">
                      {b.users?.display_name || b.user_id}
                    </TextLink>
                  </td>
                  <td className="max-w-64">
                    <div className="truncate">{b.reason || <Muted>-</Muted>}</div>
                  </td>
                  <td>{b.banned_by}</td>
                  <td className="whitespace-nowrap">
                    <Muted>{b.expires_at ? formatDateTime(b.expires_at) : "Permanent"}</Muted>
                  </td>
                  <td>
                    {isActive ? (
                      <Badge tone="danger">Active</Badge>
                    ) : b.lifted_at ? (
                      <Badge tone="success">Lifted</Badge>
                    ) : (
                      <Badge>Expired</Badge>
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    <Muted>{formatDate(b.created_at)}</Muted>
                  </td>
                  <td>{isActive && <LiftBanForm userId={b.user_id} />}</td>
                </tr>
              );
            })}
            {bans.length === 0 && <EmptyRow colSpan={7} title="No bans issued yet" icon="checkmark-all" />}
          </Table>
        )}

        {active === "proposed" && (
          <Table headers={["Builder", "Reason", "Length", "Proposed", ""]}>
            {proposals.map((p) => {
              const name = p.users?.display_name || p.user_id;
              const own = !canDecide({ proposedBy: p.proposed_by }, me);
              return (
                <tr key={p.id}>
                  <td>
                    <TextLink href={`/players/${p.user_id}`} className="font-bold">
                      {name}
                    </TextLink>
                  </td>
                  <td className="max-w-md break-words">{p.reason}</td>
                  <td className="whitespace-nowrap">{banLength(p.days)}</td>
                  <td>
                    {p.proposed_by}
                    {own && <div className="text-xs">You proposed this</div>}
                    <div className="text-xs">
                      <Muted>{formatDateTime(p.created_at)}</Muted>
                    </div>
                  </td>
                  <td>
                    {canConfirm ? (
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex justify-end gap-2">
                          {!own && (
                            <form action={confirmBanProposal}>
                              <input type="hidden" name="id" value={p.id} />
                              <ActionButton
                                variant="danger"
                                size="sm"
                                pendingLabel="Confirming..."
                                confirm={`Confirm the ban on ${name}?`}
                              >
                                Confirm ban
                              </ActionButton>
                            </form>
                          )}
                          <form action={rejectBanProposal}>
                            <input type="hidden" name="id" value={p.id} />
                            <ActionButton variant="outline" size="sm" pendingLabel={own ? "Withdrawing..." : "Rejecting..."}>
                              {own ? "Withdraw" : "Reject"}
                            </ActionButton>
                          </form>
                        </div>
                        {own && <Muted className="text-xs">A different owner has to confirm it.</Muted>}
                      </div>
                    ) : (
                      <Muted className="text-xs">Only owners can decide</Muted>
                    )}
                  </td>
                </tr>
              );
            })}
            {proposals.length === 0 && (
              <EmptyRow colSpan={5} title="No bans waiting on confirmation" icon="checkmark-all" />
            )}
          </Table>
        )}

        {active === "logs" && (
          <Table headers={["Action", "Who", "Builder", "Detail", "When"]}>
            {log.map((r) => (
              <tr key={r.id}>
                <td>
                  <Badge tone={LOG_TONE[r.action] ?? "neutral"}>{LOG_LABEL[r.action] ?? r.action}</Badge>
                </td>
                <td className="font-bold">{r.actor}</td>
                <td>
                  <TextLink href={`/players/${r.user_id}`} className="font-bold">
                    {r.player_name}
                  </TextLink>
                </td>
                <td className="max-w-md break-words">{r.detail}</td>
                <td className="whitespace-nowrap">
                  <Muted>{formatDateTime(r.created_at)}</Muted>
                </td>
              </tr>
            ))}
            {log.length === 0 && <EmptyRow colSpan={5} title="No ban actions yet" icon="history" />}
          </Table>
        )}
      </Card>
    </div>
  );
}
