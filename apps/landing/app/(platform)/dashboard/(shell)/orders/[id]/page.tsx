import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/app/_components/platform/expeditions.css";
import { ExFlow } from "@/app/_components/platform/expeditions/Flow";
import { StatusChip } from "@/app/_components/platform/expeditions/StatusChip";
import { ShopPhoto } from "@/app/_components/platform/ShopCard";
import "@/app/_components/platform/orders-live.css";
import { CancelOrder } from "@/app/_components/platform/expeditions/CancelOrder";
import { nextStepText, ORDER_STATUSES, orderStatusLabel, statusDay, statusIndex } from "@/lib/platform/orders";
import { viewCount, viewLines, viewTotal } from "@/lib/platform/orders-view";
import { requireViewer } from "@/lib/platform/session";
import { sampleApprovedHours } from "@/lib/platform/shop";
import { orderForViewer, shopOrderingOn } from "@/lib/platform/shop-ordering";
import { cancelOrderAction } from "../actions";

export const metadata: Metadata = { title: "Order - LOADOUT" };

const ore = (value: number) => `${value.toLocaleString("en-GB")} Ore`;

// One order of the signed-in person (the address is the order number in lower case, as in /dashboard/orders/lo-1101): where it
// is on the Placed, Packed, Shipped, Delivered strip, what happens next, and its lines as paid. A cancelled order shows a
// Cancelled chip and no strip. Cancel order is offered only while it is placed and the shop-ordering flag is on. An unknown id,
// or someone else's order, is a plain 404. Local development shows fixture orders for a person with no real ones.
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const { id } = await params;
  const order = await orderForViewer(viewer.id, id);
  if (!order) notFound();
  const cancelled = order.cancelled === true;
  const canCancel = !cancelled && order.status === "placed" && order.paid !== undefined && (await shopOrderingOn());

  const approved = sampleApprovedHours();
  const lines = viewLines(order, approved);
  const delivered = order.status === "delivered";

  return (
    <div className="pf-flat">
      <div className="pf-crumbs">
        <Link className="pf-back" href="/dashboard/orders">
          <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
            <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
          </svg>
          Back to Orders
        </Link>
      </div>

      <div className="pf-project-head">
        <div className="pf-project-head-main">
          <h1>Order {order.number}</h1>
          <dl className="pf-meta-box">
            <div>
              <dt>Status</dt>
              <dd>
                <StatusChip status={order.status} cancelled={cancelled} />
              </dd>
            </div>
            <div>
              <dt>Placed</dt>
              <dd className="ex-num">{statusDay(order, "placed") ?? "-"}</dd>
            </div>
            <div>
              <dt>Items</dt>
              <dd className="ex-num">{viewCount(order, approved)}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd className="ex-num">{ore(viewTotal(order, approved))}</dd>
            </div>
            {order.tracking && (
              <div>
                <dt>{order.tracking.carrier === "Grant" ? "Grant reference" : "Tracking"}</dt>
                <dd className="ex-num">
                  {order.tracking.number}
                  {order.tracking.carrier && order.tracking.carrier !== "Grant" && (
                    <span className="hc-caption"> · {order.tracking.carrier}</span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {cancelled ? (
        <p className="ol-cancelled-note">This order was cancelled. The Ore you paid went back to your balance.</p>
      ) : (
        <section className="pf-box" aria-labelledby="progress-heading">
          <h2 id="progress-heading">Progress</h2>
          <ExFlow steps={ORDER_STATUSES.map((status) => ({ label: orderStatusLabel(status), note: statusDay(order, status) ?? "Not yet" }))} current={statusIndex(order.status)} complete={delivered} label="Order progress" />
          <p className="ex-closed">{nextStepText(order.status)}</p>
          {canCancel ? (
            <div className="ol-meta-actions">
              <CancelOrder number={order.number} action={cancelOrderAction} />
            </div>
          ) : null}
        </section>
      )}

      <section className="pf-box" aria-labelledby="items-heading">
        <h2 id="items-heading">Items</h2>
        <table className="pf-table ex-lines">
          <caption className="pf-sr">Items in order {order.number}</caption>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col" className="ex-right">
                Qty
              </th>
              <th scope="col" className="ex-right">
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.item.id}>
                <th scope="row">
                  <span className="ex-line-item">
                    <span className="ex-thumb">
                      <ShopPhoto item={line.item} />
                    </span>
                    <Link href={`/dashboard/shop/${line.item.id}`}>{line.item.name}</Link>
                  </span>
                </th>
                <td className="ex-right">{line.quantity}</td>
                <td className="ex-right">{ore(line.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
