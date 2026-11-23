# Buyer tracking line on an order

Status: written 22 Nov 2026, not reviewed by the owner. Staging only; no live fulfilment claim.

The buyer's order detail page already shows Status, Placed, Items and Total in its metadata box. When a shipped order has tracking, add one more entry to the same box:

- Label: `Tracking`.
- Value: `order.tracking.number`, with `order.tracking.carrier` as a quiet suffix when present.
- For a grant, the stored number is the grant reference; label it `Grant reference` instead.
- If `order.tracking` is null, render nothing. Do not show "Not provided" while the order is still placed or packed.

Use the existing `pf-meta-box` markup and `ex-num` monospace treatment. No new colour, icon, font or component. The number is text, not a link: there is no confirmed carrier URL on staging and inventing one would be a false service claim.

The data comes from `OrderRow.tracking` in `lib/platform/shop-rules.ts`, written by the shipped-order transaction. No client-side value is accepted.
