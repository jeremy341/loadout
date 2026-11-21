import { orderStatusLabel, type OrderStatus } from "@/lib/platform/orders";
import "@/app/_components/platform/orders-live.css";

// The order's status as one small square tag. The word is the signal; the colour only repeats it. A cancelled order says
// "Cancelled" whatever step it had reached.
export function StatusChip({ status, cancelled = false }: Readonly<{ status: OrderStatus; cancelled?: boolean }>) {
  return (
    <span className="pf-chip" data-status={cancelled ? "cancelled" : status}>
      {cancelled ? "Cancelled" : orderStatusLabel(status)}
    </span>
  );
}
