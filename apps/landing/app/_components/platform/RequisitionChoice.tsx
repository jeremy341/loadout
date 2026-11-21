"use client";

import { useId } from "react";
import { usePathname, useRouter } from "next/navigation";

// The price choice on an item page. The choice lives in the address (?requisition=1), so the page works without script: the
// form is a plain GET and a Show price button appears when script is off. With script, picking an option changes the address
// at once. Nothing is ordered; the choice only changes the price shown.
// When it cannot be used, the reason shows as plain text beside the control (a disabled checkbox cannot take focus, so the words
// carry it) and the checkbox points at them. `unlock` is an optional second line saying how one is earned.
export function RequisitionChoice({ useRequisition, available, reason = null, unlock = null, ordering = false }: Readonly<{ useRequisition: boolean; available: number; reason?: string | null; unlock?: string | null; ordering?: boolean }>) {
  const blocked = reason !== null;
  const hintId = useId();
  const router = useRouter();
  const pathname = usePathname();
  const pick = (value: boolean) => router.replace(value ? `${pathname}?requisition=1` : pathname, { scroll: false });

  return (
    <form method="get" action={pathname} className="pf-shop-choice">
      <label className="pf-shop-option" data-disabled={blocked ? "true" : undefined}>
        <input
          type="checkbox"
          name="requisition"
          value="1"
          checked={useRequisition && !blocked}
          disabled={blocked}
          aria-describedby={hintId}
          onChange={(event) => pick(event.target.checked)}
        />
        <span>Field Requisition ({available})</span>
        {blocked ? <span className="pf-shop-option-state">Not available for this item</span> : null}
      </label>
      <noscript>
        <button type="submit" className="pf-btn">
          Show price
        </button>
      </noscript>
      <p className="pf-hint" id={hintId}>
        {blocked ? reason : ordering ? "Your choice is used when you order." : "Nothing is ordered yet. Your choice is shown only."}
        {blocked && unlock ? ` ${unlock}` : ""}
      </p>
    </form>
  );
}
