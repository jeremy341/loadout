import { requirePage } from "@/reviewer-dash/lib/guard";
import { ticketStats, ticketActivity, resolverLeaderboard } from "@/reviewer-dash/lib/tickets";
import { listHelpers } from "@/reviewer-dash/lib/db";
import { addHelperAction, removeHelperAction } from "@/reviewer-dash/app/actions";
import SlackName from "@/reviewer-dash/app/_ui/SlackName";
import {
  ActionButton,
  Card,
  CardHeader,
  EmptyRow,
  Input,
  Mono,
  Muted,
  PageHeader,
  Stat,
  StatGrid,
  Table,
} from "@/reviewer-dash/app/_ui/ui";
import { TicketsClient } from "./TicketsClient";
import { TicketsActivityChart } from "./TicketsActivityChart";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tickets" };

async function HelperManager() {
  const helpers = await listHelpers();
  return (
    <Card padding="flush">
      <CardHeader title="Helpers" icon="support-fill" count={helpers.length} />
      <div className="flex flex-col gap-3 p-4">
        <p className="hc-caption text-sm">
          Only helpers (and owners) can see and work tickets. Adding or removing a helper here changes this list only.
        </p>
        <form action={addHelperAction} className="flex flex-wrap gap-2">
          <Input name="slackId" placeholder="Handle" className="hc-mono max-w-56" required />
          <ActionButton icon="member-add" pendingLabel="Adding...">
            Add helper
          </ActionButton>
        </form>
      </div>
      <Table headers={["Helper", "Handle", ""]}>
        {helpers.map((h) => (
          <tr key={h.slack_user_id}>
            <td className="font-bold">
              <SlackName id={h.slack_user_id} fallback={`@${h.slack_user_id}`} />
            </td>
            <td>
              <Mono>{h.slack_user_id}</Mono>
            </td>
            <td className="text-right">
              <form action={removeHelperAction}>
                <input type="hidden" name="slackId" value={h.slack_user_id} />
                <ActionButton variant="ghost" size="sm" pendingLabel="Removing...">
                  Remove
                </ActionButton>
              </form>
            </td>
          </tr>
        ))}
        {helpers.length === 0 && <EmptyRow colSpan={3} title="No helpers yet" icon="support-fill" />}
      </Table>
    </Card>
  );
}

async function ResolverLeaderboard() {
  const rows = (await resolverLeaderboard()).slice(0, 15);
  return (
    <Card padding="flush">
      <CardHeader title="Top resolvers" icon="trophy-fill" />
      <Table headers={["#", "Helper", "Last 7 days", "Last 30 days", "All time"]}>
        {rows.map((r, i) => (
          <tr key={r.slackId}>
            <td>
              <Muted>{i + 1}</Muted>
            </td>
            <td className="font-bold">
              <SlackName id={r.slackId} fallback={`@${r.slackId}`} />
            </td>
            <td className="tabular-nums">{r.last7d}</td>
            <td className="tabular-nums">{r.last30d}</td>
            <td className="font-bold tabular-nums">{r.total}</td>
          </tr>
        ))}
        {rows.length === 0 && <EmptyRow colSpan={5} title="No resolved tickets yet" icon="trophy-fill" />}
      </Table>
    </Card>
  );
}

export default async function TicketsPage() {
  const access = await requirePage("helper");
  const [stats, activity] = await Promise.all([ticketStats(), ticketActivity()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tickets"
        count={stats.open}
        description="Support requests from builders. Reply in the thread or resolve from here."
      />

      <StatGrid>
        <Stat label="Total" value={stats.total} icon="list-bulleted" />
        <Stat label="Open" value={stats.open} icon="message-exclamation" tone="warning" />
        <Stat label="Resolved" value={stats.resolved} icon="checkmark" tone="success" />
      </StatGrid>

      <Card>
        <CardHeader title="Tickets, last 30 days" icon="easel-analytics" action={<Muted className="text-xs">Created vs resolved per day</Muted>} />
        <TicketsActivityChart points={activity} />
      </Card>

      <TicketsClient />

      <div className={`grid gap-6 ${access.isOwner ? "lg:grid-cols-2" : ""}`}>
        <ResolverLeaderboard />
        {access.isOwner && <HelperManager />}
      </div>
    </div>
  );
}
