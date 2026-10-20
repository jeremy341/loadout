"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Field, Tag } from "../../ui/ui";
import { uid } from "../../../lib/preview-store";
import { AVAILABILITY_NOTE, CATEGORY_LABELS, DRAFT_RULES, PLAN_RULES, type ShopItem } from "./data";
import { placeOrderNow, useGearProfile, useTickets, useWishlist } from "./gear-store";
import { Sprite, accessLabel, formatOre } from "./gear-ui";
import type { Order } from "./logic/orders";
import { checkTicket, meetsRequirement, priceOrder, shortfall, ticketLabel, priceItem, type Ticket } from "./logic/pricing";

// The product view and the Redeem flow. Redeeming is two steps on purpose: choose, then confirm. Nothing is spent
// and no Requisition is consumed until the participant presses the confirm button (plans/02 section 26.10).

export function ItemDetail({
  item,
  balance,
  onBack,
  announce,
}: {
  item: ShopItem;
  balance: number;
  onBack: () => void;
  announce: (message: string) => void;
}) {
  const { levels } = useGearProfile();
  const { available } = useTickets();
  const wishlist = useWishlist();

  const headingRef = useRef<HTMLHeadingElement>(null);
  const confirmRef = useRef<HTMLHeadingElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const redeemRef = useRef<HTMLButtonElement>(null);
  const qtyId = useId();

  const [quantityText, setQuantityText] = useState("1");
  const [ticketId, setTicketId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  useEffect(() => {
    if (placed) successRef.current?.focus();
  }, [placed]);

  const quantity = Number(quantityText);
  const quantityOk = Number.isInteger(quantity) && quantity >= 1 && quantity <= DRAFT_RULES.maxQuantity;
  const requirement = meetsRequirement(item.requires, levels);

  const usable = available.filter((ticket) => checkTicket(ticket, item).ok);
  const chosen: Ticket | null = usable.find((ticket) => ticket.id === ticketId) ?? null;
  const price = priceOrder(item, quantityOk ? quantity : 1, levels, chosen);
  const unit = priceItem(item, levels);
  const missing = shortfall(balance, price.total);

  const blocked = !requirement.ok || !quantityOk || missing > 0;
  const saved = wishlist.has(item.id);

  const fieldLeft = available.filter((t) => t.kind === "field" && checkTicket(t, item).ok).length;
  const generalLeft = available.filter((t) => t.kind === "general" && checkTicket(t, item).ok).length;

  function startRedeem() {
    if (blocked) return;
    setError(null);
    setPendingId(uid("ord"));
    setConfirming(true);
  }

  function cancelConfirm() {
    setConfirming(false);
    setPendingId(null);
    window.setTimeout(() => redeemRef.current?.focus(), 0);
  }

  function confirm() {
    if (!pendingId || !quantityOk) return;
    const result = placeOrderNow({ orderId: pendingId, line: { item, quantity }, ticket: chosen });
    if (!result.ok) {
      setError(result.message);
      announce(`Order not placed. ${result.message}`);
      setConfirming(false);
      setPendingId(null);
      return;
    }
    setPlaced(result.order);
    setConfirming(false);
    setPendingId(null);
    setTicketId("");
    announce(`Order ${result.order.number} placed. ${formatOre(result.order.oreSpent)} spent.`);
  }

  function toggleSave() {
    const nowSaved = wishlist.toggle(item.id);
    announce(nowSaved ? `${item.name} added to your wishlist.` : `${item.name} removed from your wishlist.`);
  }

  return (
    <div className="gr-stack">
      <div className="gr-row-between">
        <button type="button" className="btn btn-quiet btn-sm" onClick={onBack}>
          Back to catalog
        </button>
        <button type="button" className="gr-heart" aria-pressed={saved} aria-label={`Wishlist: ${item.name}`} onClick={toggleSave}>
          <span aria-hidden="true" className="gr-heart-mark">
            {saved ? "♥" : "♡"}
          </span>
          <span>Wishlist</span>
        </button>
      </div>

      <div className="gr-detail">
        <div className="gr-stack">
          <div className="gr-row">
            <span className="gr-sprite-box">
              <Sprite name={item.sprite} size={48} />
            </span>
            <div className="gr-tight">
              <h2 ref={headingRef} tabIndex={-1}>
                {item.name}
              </h2>
              <div className="gr-tags">
                <Tag>Sample item</Tag>
                <Tag>{CATEGORY_LABELS[item.category]}</Tag>
                <Tag tone={item.access === "open" ? "plain" : "warn"}>{accessLabel(item.access)}</Tag>
              </div>
            </div>
          </div>
          <p>{item.description}</p>
          <p className="gr-note">
            {item.priceSource === "plan"
              ? "This price is a working example from the economy plan, not a final price."
              : "This price is a draft made up for the preview. The plans set no Ore price for this item."}
          </p>
          <p className="gr-note">{AVAILABILITY_NOTE}</p>
          {item.tracks.length > 0 ? (
            <p className="mut">
              Related tracks: {item.tracks.join(", ")}. If more than one applies, the best discount is used, never the sum.
            </p>
          ) : (
            <p className="mut">Not tied to a track, so no track discount applies.</p>
          )}
          {item.requires ? (
            <p className={requirement.ok ? "mut" : "gr-warn"}>
              {requirement.ok
                ? `Level requirement met: ${item.requires.tracks.join(" or ")} level ${item.requires.level} (draft).`
                : `Locked. Needs ${item.requires.tracks.join(" or ")} level ${item.requires.level} (draft). You are ${requirement.levelsRemaining} ${requirement.levelsRemaining === 1 ? "level" : "levels"} away. A Requisition cannot unlock it.`}
            </p>
          ) : null}
        </div>

        <div className="gr-stack">
          {placed ? (
            <div className="gr-success" role="group" aria-labelledby={`${qtyId}-done`}>
              <h3 id={`${qtyId}-done`} ref={successRef} tabIndex={-1}>
                Order {placed.number} placed
              </h3>
              <p>
                {formatOre(placed.oreSpent)} was spent through the Ore ledger. This is a preview order: nothing was sent to LOADOUT.
              </p>
              <div className="gr-row">
                <Link href="/orders" className="btn btn-sm">
                  View your orders
                </Link>
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => setPlaced(null)}>
                  Order again
                </button>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="gr-warn" role="alert">
              {error}
            </p>
          ) : null}

          <section className="gr-stack" aria-label="Price and options">
            <div className="form-grid">
              <Field
                label="Quantity"
                hint={`1 to ${DRAFT_RULES.maxQuantity} per order (draft limit)`}
                error={quantityOk ? null : `Enter a whole number from 1 to ${DRAFT_RULES.maxQuantity}.`}
              >
                <input
                  id={qtyId}
                  className="gr-qty"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={DRAFT_RULES.maxQuantity}
                  step={1}
                  value={quantityText}
                  disabled={confirming}
                  onChange={(event) => setQuantityText(event.target.value)}
                />
              </Field>
              <Field
                label="Requisition"
                hint={
                  item.requisitionEligible
                    ? `Usable here: ${fieldLeft} Field and ${generalLeft} General. One per order, applied to one unit.`
                    : "This item does not accept Requisitions."
                }
              >
                <select value={chosen ? chosen.id : ""} disabled={confirming || usable.length === 0} onChange={(event) => setTicketId(event.target.value)}>
                  <option value="">None</option>
                  {usable.map((ticket) => (
                    <option key={ticket.id} value={ticket.id}>
                      {ticketLabel(ticket)}, saves {formatOre(priceItem(item, levels, ticket).ticket?.saving ?? 0)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <dl className="gr-dl">
              <dt>Base price{quantityOk && quantity > 1 ? ` x ${quantity}` : ""}</dt>
              <dd>{formatOre(unit.base * (quantityOk ? quantity : 1))}</dd>
              <dt>
                Track discount
                {unit.permanentPercent > 0 && unit.permanentTrack ? ` (${unit.permanentPercent}%, ${unit.permanentTrack})` : ""}
              </dt>
              <dd>{price.permanentSavingTotal > 0 ? `-${formatOre(price.permanentSavingTotal)}` : "None"}</dd>
              <dt>Requisition</dt>
              <dd>{price.ticketSaving > 0 ? `-${formatOre(price.ticketSaving)}` : "None"}</dd>
              <dt className="gr-total">Final price</dt>
              <dd className="gr-total">{formatOre(price.total)}</dd>
              <dt>Your Ore now</dt>
              <dd>{formatOre(balance)}</dd>
            </dl>
            {unit.permanentPercent === 0 && item.tracks.length > 0 ? (
              <p className="mut">
                You pay the base price because your best related level is too low for a discount (it starts at level 2 on the draft curve). Use the preview profile to try other levels.
              </p>
            ) : null}
            {price.saved > 0 ? (
              <p className="mut">
                You save {formatOre(price.saved)} ({Math.round((price.saved / (unit.base * price.quantity)) * 100)}% of the base price). The most any order can save is {PLAN_RULES.maxCombinedPercent}%.
              </p>
            ) : null}

            {confirming ? (
              <div className="gr-confirm" role="group" aria-labelledby={`${qtyId}-confirm`}>
                <h3 id={`${qtyId}-confirm`} ref={confirmRef} tabIndex={-1}>
                  Confirm preview order
                </h3>
                <dl className="gr-dl">
                  <dt>Item</dt>
                  <dd>
                    {price.quantity} x {item.name}
                  </dd>
                  <dt>Base price</dt>
                  <dd>{formatOre(unit.base * price.quantity)}</dd>
                  <dt>Track discount{unit.permanentTrack ? ` (${unit.permanentTrack})` : ""}</dt>
                  <dd>{price.permanentSavingTotal > 0 ? `-${formatOre(price.permanentSavingTotal)}` : "None"}</dd>
                  <dt>{chosen ? ticketLabel(chosen) : "Requisition"}</dt>
                  <dd>{price.ticketSaving > 0 ? `-${formatOre(price.ticketSaving)}` : "None"}</dd>
                  <dt className="gr-total">Final price</dt>
                  <dd className="gr-total">{formatOre(price.total)}</dd>
                  <dt>Ore after</dt>
                  <dd>{formatOre(balance - price.total)}</dd>
                </dl>
                {chosen ? <p>Using this Requisition consumes it. You can get it back by cancelling the order while it is Placed or Processing.</p> : null}
                <p className="gr-note">{AVAILABILITY_NOTE}</p>
                <div className="gr-row">
                  <button type="button" className="btn" onClick={confirm}>
                    Confirm and spend {formatOre(price.total)}
                  </button>
                  <button type="button" className="btn btn-quiet" onClick={cancelConfirm}>
                    Go back
                  </button>
                </div>
              </div>
            ) : (
              <div className="gr-stack">
                <div className="gr-row">
                  <button
                    ref={redeemRef}
                    type="button"
                    className="btn"
                    aria-disabled={blocked}
                    aria-describedby={blocked ? `${qtyId}-why` : undefined}
                    onClick={startRedeem}
                  >
                    Redeem with Ore
                  </button>
                </div>
                {blocked ? (
                  <div id={`${qtyId}-why`} className="gr-warn">
                    {!requirement.ok ? (
                      <p>This item is locked until you reach the level above.</p>
                    ) : !quantityOk ? (
                      <p>Fix the quantity to continue.</p>
                    ) : (
                      <>
                        <p>
                          You need {formatOre(missing)} more. Your balance is {formatOre(balance)} and this costs {formatOre(price.total)}.
                        </p>
                        <p>
                          <Link href="/ore-calculator">Estimate how much Ore a project could earn</Link>
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="mut">Nothing is spent until you confirm on the next step.</p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
