import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/app/_components/platform/expeditions.css";
import { ExFlow } from "@/app/_components/platform/expeditions/Flow";
import { ShopPhoto } from "@/app/_components/platform/ShopCard";
import { itemCount, nextStepText, ORDER_STATUSES, orderById, orderLines, orderStatusLabel, orderTotal, statusIndex } from "@/lib/platform/orders";
import { requireViewer } from "@/lib/platform/session";
import { sampleApprovedHours } from "@/lib/platform/shop";

export const metadata: Metadata = { title: "Order - LOADOUT" };

const ore = (value: number) => `${value.toLocaleString("en-GB")} Ore`;

// One sample order: where it is on the Placed, Packed, Shipped, Delivered strip, what happens next, and its lines at the
// shop's prices. Nothing can be cancelled or changed. An unknown id is a plain 404.
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireViewer();
  const { id } = await params;
  const order = orderById(id);
  if (!order) notFound();

  const approved = sampleApprovedHours();
  const lines = orderLines(order, approved);
  const delivered = order.status === "delivered";

  return (
    <>
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
              <dd>{orderStatusLabel(order.status)}</dd>
            </div>
            <div>
              <dt>Items</dt>
              <dd className="ex-num">{itemCount(order, approved)}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd className="ex-num">{ore(orderTotal(order, approved))}</dd>
            </div>
          </dl>
        </div>
      </div>

      <section className="pf-box" aria-labelledby="progress-heading">
        <h2 id="progress-heading">Progress</h2>
        <ExFlow steps={ORDER_STATUSES.map((status) => ({ label: orderStatusLabel(status) }))} current={statusIndex(order.status)} complete={delivered} label="Order progress" />
        <p className="ex-closed">{nextStepText(order.status)}</p>
      </section>

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
        <p className="ex-closed">This is a sample order over the proposed catalog. Prices follow the shop&apos;s rules at your level. Nothing was bought and nothing here can be changed.</p>
      </section>
    </>
  );
}
