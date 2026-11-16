import Link from "next/link";
import { ShopPhoto } from "@/app/_components/platform/ShopCard";
import { ORDER_STATUSES, orderLines, orderStatusLabel, orderSummary, orderTotal, statusIndex, type Order } from "@/lib/platform/orders";
import type { TrackHours } from "@/lib/platform/shop";
import { StepMeter } from "./StepMeter";

// One order in the history: a picture of the first item, the number and what is in it, how far along it is and the Ore it
// came to. The number is the one link and covers the row.
export function OrderRow({ order, approved }: Readonly<{ order: Order; approved: TrackHours }>) {
  const first = orderLines(order, approved)[0];
  return (
    <li className="ex-row ex-order">
      <span className="ex-thumb">{first ? <ShopPhoto item={first.item} /> : null}</span>
      <div className="ex-main">
        <h3 className="ex-name">
          <Link className="ex-stretch" href={`/dashboard/orders/${order.id}`}>
            Order {order.number}
          </Link>
        </h3>
        <p className="ex-summary">{orderSummary(order, approved)}</p>
      </div>
      <div className="ex-order-side">
        <div className="ex-progress">
          <StepMeter done={statusIndex(order.status) + 1} total={ORDER_STATUSES.length} />
          <span className="ex-progress-text">{orderStatusLabel(order.status)}</span>
        </div>
        <p className="ex-total">
          {orderTotal(order, approved).toLocaleString("en-GB")} <small>Ore</small>
        </p>
      </div>
    </li>
  );
}
