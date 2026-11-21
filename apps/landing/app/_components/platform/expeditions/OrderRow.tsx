import Link from "next/link";
import { ShopPhoto } from "@/app/_components/platform/ShopCard";
import { ORDER_STATUSES, statusDay, statusIndex } from "@/lib/platform/orders";
import { viewLines, viewSummary, viewTotal, type ViewOrder } from "@/lib/platform/orders-view";
import type { TrackHours } from "@/lib/platform/shop";
import { StatusChip } from "./StatusChip";
import { StepMeter } from "./StepMeter";

// One order in the history: a picture of the first item, the number and what is in it, how far along it is and the Ore it
// came to. The number is the one link and covers the row. A real order shows what was paid; a cancelled one shows a Cancelled
// chip and no progress meter.
export function OrderRow({ order, approved }: Readonly<{ order: ViewOrder; approved: TrackHours }>) {
  const first = viewLines(order, approved)[0];
  const cancelled = order.cancelled === true;
  const placed = statusDay(order, "placed");
  return (
    <li className="ex-row ex-order">
      <span className="ex-thumb">{first ? <ShopPhoto item={first.item} /> : null}</span>
      <div className="ex-main">
        <h3 className="ex-name">
          <Link className="ex-stretch" href={`/dashboard/orders/${order.id}`}>
            Order {order.number}
          </Link>
        </h3>
        <p className="ex-summary">{viewSummary(order, approved)}</p>
        {placed ? <p className="ex-order-date">Placed {placed}</p> : null}
      </div>
      <div className="ex-order-side">
        <div className="ex-progress">
          {cancelled ? null : <StepMeter done={statusIndex(order.status) + 1} total={ORDER_STATUSES.length} />}
          <StatusChip status={order.status} cancelled={cancelled} />
        </div>
        <p className="ex-total">
          {viewTotal(order, approved).toLocaleString("en-GB")} <small>Ore</small>
        </p>
      </div>
    </li>
  );
}
