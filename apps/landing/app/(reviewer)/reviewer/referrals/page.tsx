import { requirePage } from "@/reviewer-dash/lib/guard";
import { listReferrals, referrerLeaderboard } from "@/reviewer-dash/lib/db";
import { NO_REWARD_SENTENCE } from "@/lib/platform/referrals";
import {
  Badge,
  Card,
  CardHeader,
  EmptyRow,
  PageHeader,
  Stat,
  StatGrid,
  Table,
  formatDate,
} from "@/reviewer-dash/app/_ui/ui";
import PaginatedTable from "@/reviewer-dash/app/_ui/PaginatedTable";

export const dynamic = "force-dynamic";

// A read-only list. LOADOUT has no referral reward (plans/02 section 16), so there are no amounts, tiers, milestones or boosts
// here: a referral counts when the invited builder has a first approved ship, and nothing is paid for it.
export default async function ReferralsPage() {
  await requirePage("owner");

  const referrals = await listReferrals();
  const leaderboard = await referrerLeaderboard(referrals);
  const qualified = referrals.filter((r) => r.qualified_at);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Referrals"
        count={referrals.length}
        description={`${NO_REWARD_SENTENCE} A referral counts once the invited builder has a first approved ship. This list only shows who invited whom.`}
      />

      <StatGrid>
        <Stat label="Total referrals" value={referrals.length} icon="friend" />
        <Stat label="Qualified" value={qualified.length} icon="checkmark" tone="success" />
        <Stat label="Waiting" value={referrals.length - qualified.length} icon="clock" />
      </StatGrid>

      <Card padding="flush">
        <CardHeader title="Top referrers" icon="leader" count={Math.min(25, leaderboard.length)} />
        <Table headers={["Referrer", "Qualified / Total"]}>
          {leaderboard.slice(0, 25).map((r) => (
            <tr key={r.referrerId}>
              <td className="font-bold">{r.name}</td>
              <td>
                {r.qualified} / {r.total}
              </td>
            </tr>
          ))}
          {leaderboard.length === 0 && <EmptyRow colSpan={2} title="No referrals yet" icon="friend" />}
        </Table>
      </Card>

      <Card padding="flush">
        <CardHeader title="All referrals" icon="list" count={referrals.length} />
        {referrals.length === 0 ? (
          <Table headers={["Referrer", "Referred", "Created", "Status"]}>
            <EmptyRow colSpan={4} title="No referrals yet" icon="friend" />
          </Table>
        ) : (
          <PaginatedTable
            pageSize={25}
            headers={["Referrer", "Referred", "Created", "Status"]}
            rows={referrals.map((r) => (
              <tr key={r.id}>
                <td className="font-bold">{r.referrer_name}</td>
                <td>{r.referred_name}</td>
                <td className="text-sm">{formatDate(r.created_at)}</td>
                <td>
                  {r.qualified_at ? (
                    <Badge tone="success">qualified {formatDate(r.qualified_at)}</Badge>
                  ) : (
                    <Badge tone="neutral" outline>
                      waiting
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          />
        )}
      </Card>
    </div>
  );
}
