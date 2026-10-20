"use client";

import { Panel, Tag } from "../../ui/ui";
import { usePreviewState } from "../../../lib/preview-store";
import { DRAFT_RULES, PLAN_RULES, TRACKS, type GeneralTier } from "./data";
import { GEAR_KEYS, NO_ORDERS, useGearProfile, useTickets } from "./gear-store";
import { PreviewTools, Sprite, formatOre } from "./gear-ui";
import type { Order } from "./logic/orders";

// Requisition inventory. Requisitions are awarded, not sold: Field Requisitions by track level, General
// Requisitions for community actions (plans/02 sections 26.8, 26.11 and 26.12).

const TIER_SPRITE: Record<GeneralTier, string> = { I: "requisition-i", II: "requisition-ii", Master: "requisition-master" };

export function RequisitionsTab({ announce }: { announce: (message: string) => void }) {
  const { levels } = useGearProfile();
  const { used, general, grantGeneral } = useTickets();
  const [orders] = usePreviewState<Order[]>(GEAR_KEYS.orders, NO_ORDERS);

  const orderFor = (ticketId: string) => orders.find((order) => order.status !== "cancelled" && order.ticket?.id === ticketId);

  return (
    <div className="gr-stack">
      <p className="gr-note">
        Requisitions are awarded, not sold. One Requisition can lower the price of one eligible order. You choose it on an item&apos;s page, and nothing is consumed until you confirm the order.
      </p>

      <Panel title="Field Requisitions">
        <div className="gr-stack">
          <p>
            Each track awards five identical Field Requisitions, at levels {PLAN_RULES.fieldTicketLevels.join(", ")}. Each one takes an extra {PLAN_RULES.fieldTicketPercent}% of an item&apos;s base price off, on an item of at least {PLAN_RULES.fieldTicketMinBase} Ore in the same track. It adds to your permanent track discount, the two together never pass {PLAN_RULES.maxCombinedPercent}%, and it never unlocks a level requirement.
          </p>
          <div className="tbl-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="tbl">
              <caption className="sr-only">Field Requisitions by track and level</caption>
              <thead>
                <tr>
                  <th scope="col">Track</th>
                  <th scope="col" className="num">Your level</th>
                  {PLAN_RULES.fieldTicketLevels.map((level) => (
                    <th key={level} scope="col">
                      Level {level}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRACKS.map((track) => (
                  <tr key={track}>
                    <th scope="row">{track}</th>
                    <td className="num">{levels[track]}</td>
                    {PLAN_RULES.fieldTicketLevels.map((level) => {
                      const id = `field:${track}:${level}`;
                      const earned = levels[track] >= level;
                      const order = orderFor(id);
                      return (
                        <td key={level}>
                          {!earned ? <Tag>Not earned</Tag> : used.has(id) ? <Tag tone="warn">Used{order ? `, ${order.number}` : ""}</Tag> : <Tag tone="ok">Available</Tag>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mut">Levels here are the sample levels from your preview profile. A buyer-cancelled order gives the Requisition back in this preview; real cancellation terms are not decided.</p>
        </div>
      </Panel>

      <Panel title="General Requisitions">
        <div className="gr-stack">
          <p>
            General Requisitions are rare, one-use discounts for community actions or achievements. They work on any eligible field, never together with a Field Requisition, and never as a permanent discount.
          </p>
          <p className="gr-note">
            <strong>Draft preview rule.</strong> The plans give these as working defaults and leave open what earns one. The values below are for trying the flow, not program facts.
          </p>
          <div className="tbl-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="tbl">
              <caption className="sr-only">Draft General Requisition values</caption>
              <thead>
                <tr>
                  <th scope="col">Tier</th>
                  <th scope="col" className="num">Minimum item</th>
                  <th scope="col" className="num">Discount</th>
                  <th scope="col" className="num">Largest saving</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(DRAFT_RULES.generalRequisitions) as GeneralTier[]).map((tier) => {
                  const rule = DRAFT_RULES.generalRequisitions[tier];
                  return (
                    <tr key={tier}>
                      <th scope="row">
                        <span className="gr-row">
                          <Sprite name={TIER_SPRITE[tier]} size={24} />
                          <span>{tier === "Master" ? "General Master Requisition" : `General Requisition ${tier}`}</span>
                        </span>
                      </th>
                      <td className="num">{formatOre(rule.minBase)}</td>
                      <td className="num">{rule.percent}%</td>
                      <td className="num">{formatOre(rule.maxSaving)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <h3>Yours</h3>
          {general.length === 0 ? (
            <p className="mut">You hold no General Requisitions. Nothing awards them in the preview yet; Preview tools below can add a sample one.</p>
          ) : (
            <ul className="row-list" aria-label="Your General Requisitions">
              {general.map((ticket) => {
                const order = orderFor(ticket.id);
                return (
                  <li key={ticket.id} className="row-item">
                    <span className="gr-row">
                      <Sprite name={TIER_SPRITE[ticket.tier]} size={24} />
                      <span>{ticket.tier === "Master" ? "General Master Requisition" : `General Requisition ${ticket.tier}`}</span>
                    </span>
                    {used.has(ticket.id) ? <Tag tone="warn">Used{order ? `, ${order.number}` : ""}</Tag> : <Tag tone="ok">Available</Tag>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Panel>

      <PreviewTools level={2} hint="No community action awards a General Requisition yet, so add a sample to try the checkout flow.">
        {(Object.keys(DRAFT_RULES.generalRequisitions) as GeneralTier[]).map((tier) => (
          <button
            key={tier}
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={() => {
              grantGeneral(tier);
              announce(`Sample General Requisition ${tier} added.`);
            }}
          >
            Add sample General {tier === "Master" ? "Master" : tier}
          </button>
        ))}
      </PreviewTools>
    </div>
  );
}
