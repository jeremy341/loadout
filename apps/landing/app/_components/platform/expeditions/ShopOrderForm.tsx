"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/platform/actions";

const idle: FormState = { status: "idle" };
const QUANTITIES = Array.from({ length: 10 }, (_, index) => index + 1);

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

// The real Order control on a Shop item page (shown only while the shop-ordering flag is on). A quantity from 1 to 10 and the
// one filled button. The refusal from the shop rules appears under it and is announced. The server checks the flag, the
// viewer, the price and the stock again; nothing here is trusted.
export function ShopOrderForm({ itemId, requisition, action }: Readonly<{ itemId: string; requisition: boolean; action: Action }>) {
  const [state, run, pending] = useActionState(action, idle);
  return (
    <form action={run} className="ol-order">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="requisition" value={requisition ? "1" : "0"} />
      <label className="ol-qty">
        <span>Quantity</span>
        <select name="quantity" defaultValue="1">
          {QUANTITIES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="pf-btn pri pf-shop-order" disabled={pending}>
        {pending ? "Ordering" : "Order"}
      </button>
      <div aria-live="polite" className="ol-live">
        {state.status === "error" ? (
          <p className="pf-error" data-refusal>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
