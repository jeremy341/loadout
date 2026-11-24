import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/app/_components/platform/EmptyState";
import { LedgerKindSelect } from "@/app/_components/platform/LedgerKindSelect";
import { PageHead } from "@/app/_components/platform/PageHead";
import { confirmedNewerThan, ledgerEarnedSpent } from "@/lib/platform/ledger-totals-data";
import { ledgerBalances, ledgerCount, listLedger } from "@/lib/platform/ledger-data";
import { formatOre, groupByDay, kindLabel, runningBalance } from "@/lib/platform/ledger";
import { clampPage, LEDGER_PAGE_SIZE, ledgerHref, ledgerKindOptions, ledgerRowView, pageCount, parseLedgerQuery } from "@/lib/platform/ledger-view";
import { requireViewer } from "@/lib/platform/session";
import "@/app/_components/platform/ledger.css";

export const metadata: Metadata = { title: "Ledger - LOADOUT" };

const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fullTime = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" });

function OreIcon() {
  return <Image className="pf-ore-icon" src="/loadout/sprites/ore.png" alt="" width={32} height={32} unoptimized />;
}

export default async function LedgerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Not signed in, or banned: requireViewer gives the platform's plain 404.
  const viewer = await requireViewer();
  const query = parseLedgerQuery(await searchParams);

  const [balances, totals, everything, filteredTotal] = await Promise.all([
    ledgerBalances(viewer.id),
    ledgerEarnedSpent(viewer.id),
    ledgerCount(viewer.id),
    query.kind ? ledgerCount(viewer.id, query.kind) : null,
  ]);
  const total = filteredTotal ?? everything;
  const page = clampPage(query.page, total);
  const pages = pageCount(total);
  const rows = await listLedger(viewer.id, { limit: LEDGER_PAGE_SIZE, offset: (page - 1) * LEDGER_PAGE_SIZE, kind: query.kind ?? undefined });

  // The balance after each row only means something against the whole history, so it is shown when no kind filter is on.
  const showBalance = !query.kind;
  const balanceAfter = new Map<string, number>();
  if (showBalance && rows.length > 0) {
    const newer = await confirmedNewerThan(viewer.id, rows[0]);
    const pageConfirmed = rows.reduce((sum, row) => sum + (row.status === "confirmed" ? row.amountOre : 0), 0);
    const opening = balances.confirmed - newer - pageConfirmed;
    for (const row of runningBalance([...rows].reverse())) balanceAfter.set(row.id, opening + row.balanceAfter);
  }
  const days = groupByDay(rows);
  const options = ledgerKindOptions({ development: process.env.NODE_ENV === "development", current: query.kind }).map((kind) => ({ value: kind, label: kindLabel(kind) }));

  return (
    <>
      <PageHead title="Ledger">Every Ore you have earned or spent, newest first.</PageHead>

      <section className="pf-ledger-balance" aria-label="Balance">
        <div className="pf-ledger-card">
          <p className="pf-ledger-label">You can spend</p>
          <p className="pf-ledger-hero">
            <OreIcon />
            <span data-testid="ledger-available">{formatOre(balances.available)}</span>
          </p>
          <div className="pf-ledger-pending">
            <p>
              <span className="pf-ledger-label">Pending</span>
              <span className="pf-ledger-pending-amount" data-testid="ledger-pending">{formatOre(balances.pending)}</span>
            </p>
            <p className="pf-hint">Pending Ore is waiting for a reviewer to approve your hours. It becomes spendable when they do.</p>
          </div>
          <p className="pf-hint pf-ledger-history">
            <span>Earned <b data-testid="ledger-earned">{formatOre(totals.earned)}</b></span>
            <span>Spent <b data-testid="ledger-spent">{formatOre(totals.spent)}</b></span>
          </p>
        </div>
      </section>

      <section className="pf-section pf-section-plain pf-ledger-entries" aria-labelledby="ledger-entries-heading">
        <div className="pf-ledger-bar">
          <h2 id="ledger-entries-heading">Entries</h2>
          <LedgerKindSelect value={query.kind ?? ""} options={options} />
        </div>
        {!showBalance && total > 0 ? <p className="pf-hint pf-ledger-note">Balances show when you view all entries.</p> : null}

        {total === 0 ? (
          query.kind ? (
            <EmptyState title="No entries of this kind" action={<Link href={ledgerHref({})}>Show all entries</Link>}>
              You have no {kindLabel(query.kind)} entries yet.
            </EmptyState>
          ) : (
            <EmptyState
              title="No Ore yet"
              action={
                <>
                  <Link href="/dashboard">Go to Projects</Link> or <Link href="/dashboard/explore">explore what others build</Link>
                </>
              }
            >
              Log hours on a project. Ore arrives once a reviewer approves them.
            </EmptyState>
          )
        ) : (
          <div className="pf-ledger-list" data-testid="ledger-list">
            {days.map((group) => {
              const heading = dayFormat.format(new Date(`${group.day}T00:00:00Z`));
              return (
                <section key={group.day} className="pf-ledger-day" aria-label={heading}>
                  <h3>{heading}</h3>
                  <ul>
                    {group.entries.map((row) => {
                      const view = ledgerRowView(row, showBalance ? (balanceAfter.get(row.id) ?? 0) : null);
                      return (
                        <li key={row.id} className="pf-ledger-row" data-status={view.status} data-kind={row.kind}>
                          <div className="pf-ledger-main">
                            <span className="pf-ledger-kind">{view.kind}</span>
                            <span className="pf-ledger-amount" data-sign={view.sign}>{view.amountText}</span>
                          </div>
                          <div className="pf-ledger-meta">
                            <time dateTime={row.createdAt.toISOString()} title={`${fullTime.format(row.createdAt)} UTC`}>{view.dateText}</time>
                            <span className="pf-ledger-status" data-status={view.status}>{view.statusText}</span>
                            {row.projectId && row.projectTitle ? <Link href={`/dashboard/projects/${row.projectId}`}>{row.projectTitle}</Link> : null}
                            {view.balanceText ? <span className="pf-ledger-after">Balance {view.balanceText}</span> : null}
                          </div>
                          <p className="pf-ledger-reason">{view.reason}</p>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}

        {pages > 1 ? (
          <nav className="pf-pager pf-ledger-pager" aria-label="Ledger pages">
            {page > 1 ? <Link href={ledgerHref({ kind: query.kind, page: page - 1 })} rel="prev">Previous</Link> : <span className="pf-ledger-pager-off" aria-hidden="true">Previous</span>}
            <span>Page {page} of {pages}</span>
            {page < pages ? <Link href={ledgerHref({ kind: query.kind, page: page + 1 })} rel="next">Next</Link> : <span className="pf-ledger-pager-off" aria-hidden="true">Next</span>}
          </nav>
        ) : null}
      </section>
    </>
  );
}
