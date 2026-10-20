"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useOre } from "../../../lib/ore-ledger";
import { usePreviewState } from "../../../lib/preview-store";
import { EmptyState, Field, PageHeader, PreviewNote, Stat, StatGrid, Status, Tabs, Tag } from "../../ui/ui";
import { GEAR_KEYS, NO_ORDERS, advanceOrderNow, cancelOrderNow } from "./gear-store";
import { navLead } from "./gear-nav";
import { OreAmount, PreviewTools, formatOre, formatStamp, useAnnounce } from "./gear-ui";
import { ledgerToCsv, ledgerTotals, sourceLabel, withRunningBalance } from "./logic/ledger";
import {
  ORDER_FLOW,
  STATUS_LABELS,
  canCancel,
  filterOrders,
  isOpen,
  nextStatus,
  receiptText,
  sortNewestFirst,
  type Order,
  type OrderStatus,
} from "./logic/orders";

// Plans/02 sections 26 and 28: orders and their status. There is no fulfillment service in the preview, so the
// status only moves when the participant presses a Preview tools button. The Ore ledger tab shows every entry the
// shared ledger holds, with a running balance.

export function OrdersPage() {
  const [message, announce] = useAnnounce();
  const [orders] = usePreviewState<Order[]>(GEAR_KEYS.orders, NO_ORDERS);
  const { entries } = useOre();

  return (
    <>
      <PageHeader eyebrow="Gear" title="Orders" lead={navLead("orders")} />
      <PreviewNote>
        These are preview orders saved in this browser. Nothing is shipped, and there is no delivery address because nothing is delivered. Statuses move only with the Preview tools buttons.
      </PreviewNote>
      <Status message={message} />
      <Tabs
        label="Orders sections"
        tabs={[
          { id: "orders", label: "Orders", count: orders.length, panel: <OrdersTab orders={orders} announce={announce} /> },
          { id: "ledger", label: "Ore ledger", count: entries.length, panel: <LedgerTab announce={announce} /> },
        ]}
      />
    </>
  );
}

// --- Orders -----------------------------------------------------------------------------------------------------

function OrdersTab({ orders, announce }: { orders: Order[]; announce: (message: string) => void }) {
  const [filter, setFilter] = useState<OrderStatus | "all" | "open">("all");
  const shown = sortNewestFirst(filterOrders(orders, filter));
  const open = orders.filter(isOpen).length;
  const spent = orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.oreSpent, 0);

  return (
    <div className="gr-stack">
      <h2 className="sr-only">Orders</h2>
      <StatGrid>
        <Stat label="Orders" value={orders.length} hint="All time, including cancelled" />
        <Stat label="Open" value={open} hint="Not delivered or cancelled" />
        <Stat label="Ore on orders" value={spent.toLocaleString("en-GB")} hint="Excluding cancelled orders" />
      </StatGrid>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          action={
            <Link href="/shop" className="btn">
              Browse the Shop
            </Link>
          }
        >
          When you redeem Ore in the Shop, the preview order shows up here with its status and receipt.
        </EmptyState>
      ) : (
        <>
          <div className="toolbar">
            <Field label="Show orders">
              <select value={filter} onChange={(event) => setFilter(event.target.value as OrderStatus | "all" | "open")}>
                <option value="all">All orders</option>
                <option value="open">Open orders</option>
                {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <p className="mut" role="status" aria-live="polite">
            {shown.length} of {orders.length} {orders.length === 1 ? "order" : "orders"} shown.
          </p>
          {shown.length === 0 ? (
            <EmptyState title="No orders with that status">
              Pick another status, or choose All orders.
            </EmptyState>
          ) : (
            <ul className="gr-stack" aria-label="Orders">
              {shown.map((order) => (
                <li key={order.id}>
                  <OrderCard order={order} announce={announce} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function statusTone(status: OrderStatus): "plain" | "accent" | "ok" | "warn" | "bad" {
  if (status === "delivered") return "ok";
  if (status === "cancelled") return "bad";
  if (status === "shipped") return "accent";
  return "plain";
}

function OrderCard({ order, announce }: { order: Order; announce: (message: string) => void }) {
  const base = useId();
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const confirmRef = useRef<HTMLParagraphElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (cancelling) confirmRef.current?.focus();
  }, [cancelling]);

  const next = nextStatus(order.status);
  const summary = order.lines.map((line) => `${line.quantity} x ${line.name}`).join(", ");
  const receipt = receiptText(order);

  function doCancel() {
    const result = cancelOrderNow(order.id);
    setCancelling(false);
    if (!result.ok) {
      setError(result.message);
      announce(`Order not cancelled. ${result.message}`);
      return;
    }
    setError(null);
    announce(`Order ${order.number} cancelled. ${formatOre(order.oreSpent)} refunded to your ledger.`);
    window.setTimeout(() => headingRef.current?.focus(), 0);
  }

  async function copyReceipt() {
    try {
      await navigator.clipboard.writeText(receipt);
      announce(`Receipt for ${order.number} copied.`);
    } catch {
      announce("Could not copy automatically. Select the receipt text and copy it by hand.");
    }
  }

  function printReceipt() {
    const area = document.getElementById(`${base}-receipt`);
    if (!area) return;
    area.setAttribute("data-print", "true");
    document.body.classList.add("gr-printing");
    const done = () => {
      document.body.classList.remove("gr-printing");
      area.removeAttribute("data-print");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  }

  return (
    <article className="gr-order" aria-labelledby={`${base}-h`}>
      <div className="gr-row-between">
        <div className="gr-tight">
          <h3 id={`${base}-h`} ref={headingRef} tabIndex={-1} className="gr-focus-target">
            Order {order.number}
          </h3>
          <p className="mut">Placed {formatStamp(order.createdAt)}</p>
        </div>
        <Tag tone={statusTone(order.status)}>{STATUS_LABELS[order.status]}</Tag>
      </div>
      <p>{summary}</p>
      <div className="gr-row-between">
        <OreAmount amount={order.oreSpent} strong />
        {order.saved > 0 ? <span className="mut">Saved {formatOre(order.saved)}</span> : null}
      </div>

      <StatusTimeline order={order} />

      {error ? (
        <p className="gr-warn" role="alert">
          {error}
        </p>
      ) : null}

      {cancelling ? (
        <div className="gr-confirm" role="group" aria-labelledby={`${base}-cancel`}>
          <p id={`${base}-cancel`} ref={confirmRef} tabIndex={-1} className="gr-focus-target">
            <strong>
              Cancel order {order.number}? {formatOre(order.oreSpent)} goes back to your ledger, once.
            </strong>
          </p>
          {order.ticket ? <p>The Requisition on it becomes available again.</p> : null}
          <div className="gr-row">
            <button type="button" className="btn btn-danger btn-sm" onClick={doCancel}>
              Yes, cancel and refund
            </button>
            <button
              type="button"
              className="btn btn-quiet btn-sm"
              onClick={() => {
                setCancelling(false);
                window.setTimeout(() => cancelBtnRef.current?.focus(), 0);
              }}
            >
              Keep order
            </button>
          </div>
        </div>
      ) : (
        <div className="gr-row">
          <button type="button" className="btn btn-sm" aria-expanded={expanded} aria-controls={`${base}-detail`} onClick={() => setExpanded((open) => !open)}>
            {expanded ? "Hide details" : "View details"}
            <span className="sr-only"> for order {order.number}</span>
          </button>
          {canCancel(order) ? (
            <button ref={cancelBtnRef} type="button" className="btn btn-quiet btn-sm" onClick={() => setCancelling(true)}>
              Cancel order<span className="sr-only"> {order.number}</span>
            </button>
          ) : null}
        </div>
      )}

      <div id={`${base}-detail`} hidden={!expanded}>
        {expanded ? (
          <div className="gr-stack">
            <dl className="gr-dl">
              {order.lines.map((line, index) => (
                <FragmentRows key={`${line.itemId}-${index}`} line={line} />
              ))}
              {order.ticket ? (
                <>
                  <dt>{order.ticket.label}</dt>
                  <dd>-{formatOre(order.ticket.saving)}</dd>
                </>
              ) : null}
              <dt className="gr-total">Ore spent</dt>
              <dd className="gr-total">{formatOre(order.oreSpent)}</dd>
              <dt>Ledger entry</dt>
              <dd>
                <code>{order.spendEntryId}</code>
              </dd>
              {order.refundEntryId ? (
                <>
                  <dt>Refund ledger entry</dt>
                  <dd>
                    <code>{order.refundEntryId}</code>
                  </dd>
                </>
              ) : null}
            </dl>
            <p className="mut">No delivery address is collected in the preview. Availability, delivery, tax and shipping are confirmed once ordering opens.</p>
            <div className="gr-stack">
              <h4 className="gr-h4">Receipt</h4>
              <pre id={`${base}-receipt`} className="gr-pre gr-print-area">
                {receipt}
              </pre>
              <div className="gr-row">
                <button type="button" className="btn btn-quiet btn-sm" onClick={copyReceipt}>
                  Copy receipt
                </button>
                <button type="button" className="btn btn-quiet btn-sm" onClick={printReceipt}>
                  Print receipt
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {next ? (
        <PreviewTools level={4} hint="There is no fulfillment service yet. This button stands in for it.">
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={() => {
              const moved = advanceOrderNow(order.id);
              if (moved) announce(`Order ${moved.number} is now ${STATUS_LABELS[moved.status]} (simulated).`);
            }}
          >
            Simulate next status: {STATUS_LABELS[next]}
          </button>
        </PreviewTools>
      ) : null}
    </article>
  );
}

function FragmentRows({ line }: { line: Order["lines"][number] }) {
  return (
    <>
      <dt>
        {line.quantity} x {line.name}
      </dt>
      <dd>{formatOre(line.unitBase * line.quantity)}</dd>
      {line.permanentSaving > 0 ? (
        <>
          <dt>
            Track discount ({line.permanentPercent}%{line.permanentTrack ? `, ${line.permanentTrack}` : ""})
          </dt>
          <dd>-{formatOre(line.permanentSaving)}</dd>
        </>
      ) : null}
    </>
  );
}

function StatusTimeline({ order }: { order: Order }) {
  const cancelled = order.status === "cancelled";
  const reached = ORDER_FLOW.filter((status) => order.history.some((stamp) => stamp.status === status));
  const lastReached = reached[reached.length - 1];
  const cancelStamp = order.history.find((stamp) => stamp.status === "cancelled");

  return (
    <ol className="gr-timeline" aria-label={`Status of order ${order.number}`}>
      {ORDER_FLOW.map((status) => {
        const stamp = order.history.find((s) => s.status === status);
        const isCurrent = !cancelled && status === order.status;
        const state = isCurrent ? "current" : stamp ? "done" : "waiting";
        return (
          <li key={status} data-state={state} aria-current={isCurrent ? "step" : undefined}>
            <span className="gr-step-name">{STATUS_LABELS[status]}</span>
            <span className="gr-step-state">
              {isCurrent ? "Now" : stamp ? "Done" : "Waiting"}
              {stamp ? `, ${formatStamp(stamp.at)}` : ""}
              {cancelled && status === lastReached ? ", stopped here" : ""}
            </span>
          </li>
        );
      })}
      {cancelled ? (
        <li data-state="cancelled" aria-current="step">
          <span className="gr-step-name">Cancelled</span>
          <span className="gr-step-state">Refunded{cancelStamp ? `, ${formatStamp(cancelStamp.at)}` : ""}</span>
        </li>
      ) : null}
    </ol>
  );
}

// --- Ore ledger -------------------------------------------------------------------------------------------------

function LedgerTab({ announce }: { announce: (message: string) => void }) {
  const { entries } = useOre();
  const totals = ledgerTotals(entries);
  const rows = withRunningBalance(entries).reverse();

  function exportCsv() {
    const blob = new Blob([ledgerToCsv(entries)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "loadout-ore-ledger-preview.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce(`Exported ${entries.length} ledger ${entries.length === 1 ? "entry" : "entries"} as CSV.`);
  }

  return (
    <div className="gr-stack">
      <h2 className="sr-only">Ore ledger</h2>
      <StatGrid>
        <Stat label="Balance" value={totals.balance.toLocaleString("en-GB")} hint="The sum of every entry" />
        <Stat label="Earned" value={totals.earned.toLocaleString("en-GB")} hint="Sample and preview Ore in" />
        <Stat label="Spent in the Shop" value={totals.spent.toLocaleString("en-GB")} hint="After refunds" />
      </StatGrid>
      <p className="gr-note">
        The ledger only ever gets new entries. A refund is a new entry, never an edit. Every entry here is sample or preview data saved in this browser.
      </p>
      <div className="gr-row">
        <button type="button" className="btn btn-sm" onClick={exportCsv}>
          Export CSV
        </button>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="The ledger is empty">Entries appear here when Ore moves.</EmptyState>
      ) : (
        <div className="tbl-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="tbl">
            <caption className="sr-only">Ore ledger, newest first, with the balance after each entry</caption>
            <thead>
              <tr>
                <th scope="col">When (UTC)</th>
                <th scope="col">Source</th>
                <th scope="col">Reason</th>
                <th scope="col" className="num">
                  Amount
                </th>
                <th scope="col" className="num">
                  Balance after
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{formatStamp(row.at)}</td>
                  <td>
                    <Tag>{sourceLabel(row.source)}</Tag>
                  </td>
                  <td>{row.reason}</td>
                  <td className="num">
                    <span className={row.amount >= 0 ? "gr-amount-in" : "gr-amount-out"}>
                      {row.amount >= 0 ? "+" : "−"}
                      {Math.abs(row.amount).toLocaleString("en-GB")}
                    </span>
                    <span className="sr-only"> Ore, {row.amount >= 0 ? "in" : "out"}</span>
                  </td>
                  <td className="num">{row.balanceAfter.toLocaleString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
