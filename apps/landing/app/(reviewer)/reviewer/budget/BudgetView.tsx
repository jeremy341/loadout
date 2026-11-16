import {
  BUDGET_SAMPLE_NOTE,
  formatOre,
  formatUsd,
  ordersByMonth,
  oreByTrack,
  PLATFORM_BUDGET_CENTS,
  platformCentsPerDay,
  reserves,
  RUN_DAYS,
  UNDECIDED,
} from "@/lib/reviewer/budget";
import { config } from "@/reviewer-dash/app/_generated/config";
import { Callout, Card, CardHeader, EmptyRow, PageHeader, Stat, StatGrid, Table } from "@/reviewer-dash/app/_ui/ui";
import { BudgetCharts } from "./BudgetCharts";

export function BudgetView() {
  const owed = reserves();
  const months = ordersByMonth();
  const tracks = oreByTrack();

  return (
    <div className="flex min-w-0 flex-col gap-6 [&>*]:min-w-0">
      <PageHeader title="Budget" description="The platform budget for the run, the Ore builders hold, and what open orders will cost. Dollar amounts are USD planning figures." />
      <p className="hc-caption text-sm">{BUDGET_SAMPLE_NOTE}</p>

      <StatGrid>
        <Stat icon="bank" label="Platform budget" value={formatUsd(PLATFORM_BUDGET_CENTS)} hint={`For the whole ${RUN_DAYS}-day run`} />
        <Stat icon="payment" label="Per day of the run" value={formatUsd(platformCentsPerDay())} hint={`${formatUsd(PLATFORM_BUDGET_CENTS)} over ${RUN_DAYS} days`} />
        <Stat icon="package" label="Owed to builders" value={formatUsd(owed.totalCents)} hint={`${formatOre(owed.totalOre)}, counted once`} />
        <Stat icon="payment" label="Remaining estimate" value="Not set" hint="There is no cash ledger to take it from" />
      </StatGrid>

      <Callout tone="info" icon="info">
        <strong>10 Ore = {formatUsd(config.economy.oreValueUsd * 1000)}.</strong> This is the internal rate for budgeting. It is never shown to builders as a cash value.
      </Callout>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader title="What we still need to cover" icon="bank" />
          <BudgetCharts kind="obligations" rows={owed.lines.map((line) => ({ label: line.label, value: line.cents }))} />
          <Table headers={["Reserve", "Ore", "USD equivalent"]}>
            {owed.lines.map((line) => (
              <tr key={line.id}>
                <td>{line.label}</td>
                <td className="tabular-nums">{formatOre(line.ore)}</td>
                <td className="tabular-nums">{formatUsd(line.cents)}</td>
              </tr>
            ))}
            <tr className="font-bold"><td>Total reserved</td><td>{formatOre(owed.totalOre)}</td><td>{formatUsd(owed.totalCents)}</td></tr>
          </Table>
          <ul className="hc-caption mt-3 list-disc pl-5 text-xs">
            {owed.lines.map((line) => <li key={line.id}><strong>{line.label}.</strong> {line.note}</li>)}
          </ul>
        </Card>
        <Card className="min-w-0">
          <CardHeader title="Not decided yet" icon="payment" />
          <dl className="flex flex-col gap-4 text-sm">
            {UNDECIDED.map((item) => (
              <div key={item.label}>
                <dt className="font-bold">{item.label}: <span className="hc-muted">{item.value}</span></dt>
                <dd className="hc-caption text-xs">{item.note}</dd>
              </div>
            ))}
          </dl>
          <p className="hc-caption mt-4 text-xs">The platform budget is the cost of running the platform, decided by the owner. It is not compared with the reserves, which are a different cost.</p>
        </Card>
      </div>

      <Card className="min-w-0">
        <CardHeader title="Orders over time" icon="analytics" />
        <BudgetCharts kind="months" rows={[...months].reverse().map((row) => ({ label: row.month, value: row.cents }))} />
        <Table headers={["Month", "Orders", "Ore", "USD equivalent"]}>
          {months.map((row) => (
            <tr key={row.month}><td>{row.month}</td><td>{row.orders}</td><td className="tabular-nums">{formatOre(row.ore)}</td><td className="tabular-nums">{formatUsd(row.cents)}</td></tr>
          ))}
          {months.length === 0 && <EmptyRow colSpan={4} title="No orders yet" />}
        </Table>
        <p className="hc-caption mt-3 text-xs">Prices are what builders paid in Ore at their own level. The team&apos;s supplier cost is not recorded yet, so no cash spend is shown.</p>
      </Card>

      <Card className="min-w-0">
        <CardHeader title="Ore earned by track" icon="checkmark" />
        <Table headers={["Track", "Builders", "Hours", "Ore", "USD equivalent"]}>
          {tracks.map((row) => (
            <tr key={row.track}><td className="font-bold">{row.track}</td><td>{row.builders}</td><td className="tabular-nums">{row.hours.toLocaleString("en-GB")}</td><td className="tabular-nums">{formatOre(row.ore)}</td><td className="tabular-nums">{formatUsd(row.cents)}</td></tr>
          ))}
        </Table>
        <p className="hc-caption mt-3 text-xs">Builders earn 10 Ore for each approved hour. Reviewers are not paid in Ore.</p>
      </Card>
    </div>
  );
}
