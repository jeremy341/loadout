import type { ReactNode } from "react";
import type { BuyerDetails, OrderStatus, ShopOrderRow } from "@/reviewer-dash/lib/db";
import { ORDER_STAGES } from "@/reviewer-dash/lib/db";
import { visibleOrderActions } from "@/reviewer-dash/lib/fulfillmentAccess";
import { GRANT_STAGES, GRANT_STAGE_HINT, GRANT_STAGE_LABEL, isGrantOrder, usesGrantFlow } from "@/reviewer-dash/lib/fulfillmentGrant";
import {
  Badge,
  ButtonLink,
  Callout,
  DescriptionList,
  Icon,
  Mono,
  Muted,
  TextLink,
  formatDate,
  formatDateTime,
} from "@/reviewer-dash/app/_ui/ui";
import type { EligibilityResult } from "@/reviewer-dash/lib/eligibility/engine";
import { ELIGIBILITY_HINT } from "@/reviewer-dash/lib/eligibility/format";
import { EditFulfillmentInfo, FlagControls, OrderActions } from "./OrderActions";
import { ItemThumb, TypeBadge } from "./OrderList";
import { STAGE_HINT, STAGE_LABEL, STAGE_TONE, SafeLink, usdBudget } from "./shared";

function stageStamp(o: ShopOrderRow, s: OrderStatus): string | null {
  const v = { pending: o.created_at, claimed: o.claimed_at, ordered: o.ordered_at, credited: o.credited_at, shipped: o.shipped_at, done: o.done_at, cancelled: null }[s];
  return v ? formatDate(v) : null;
}

function Stepper({ order: o }: { order: ShopOrderRow }) {
  if (o.status === "cancelled") {
    return (
      <Callout tone="danger" icon="important">
        <strong>Cancelled.</strong> {o.note || "This order was cancelled and the Ore refunded."}
      </Callout>
    );
  }
  // Grants: New -> Claimed -> Grant sent (no packed/shipped steps).
  if (usesGrantFlow(o)) {
    const gIdx = GRANT_STAGES.indexOf(o.status as (typeof GRANT_STAGES)[number]);
    return (
      <ol className="fw-steps" aria-label="Grant progress">
        {GRANT_STAGES.map((s, i) => (
          <li
            key={s}
            className="fw-step"
            data-state={i < gIdx ? "done" : i === gIdx ? "current" : "todo"}
            aria-current={i === gIdx ? "step" : undefined}
          >
            <span className="fw-step-dot">{i + 1}</span>
            <span className="fw-step-label">{GRANT_STAGE_LABEL[s]}</span>
            <span className="fw-step-hint">{GRANT_STAGE_HINT[s]}</span>
            {i <= gIdx && stageStamp(o, s) && <span className="fw-step-hint">{stageStamp(o, s)}</span>}
          </li>
        ))}
      </ol>
    );
  }
  const idx = ORDER_STAGES.indexOf(o.status);
  return (
    <ol className="fw-steps" aria-label="Order progress">
      {ORDER_STAGES.map((s, i) => (
        <li
          key={s}
          className="fw-step"
          data-state={i < idx ? "done" : i === idx ? "current" : "todo"}
          aria-current={i === idx ? "step" : undefined}
        >
          <span className="fw-step-dot">{i + 1}</span>
          <span className="fw-step-label">{STAGE_LABEL[s]}</span>
          <span className="fw-step-hint">{STAGE_HINT[s]}</span>
          {i <= idx && stageStamp(o, s) && <span className="fw-step-hint">{stageStamp(o, s)}</span>}
        </li>
      ))}
    </ol>
  );
}

function Panel({ title, icon, children, aside }: { title: string; icon: "message" | "pin" | "person" | "link" | "bolt"; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="fw-panel">
      <header className="fw-panel-head">
        <h3 className="hc-heading">
          <Icon glyph={icon} size={20} className="hc-muted" />
          {title}
        </h3>
        {aside}
      </header>
      {children}
    </section>
  );
}

function OnFile({ value }: { value: ReactNode }) {
  return value ? <>{value}</> : <Muted>Not available</Muted>;
}

function ShippingPanel({ order: o, buyer, country }: { order: ShopOrderRow; buyer?: BuyerDetails; country?: string }) {
  // A grant is sent by email: only the recipient's name and email matter, so no address, phone or shipping label.
  if (isGrantOrder(o)) {
    if (!buyer) {
      return (
        <p className="text-sm">
          <Muted>The buyer&apos;s email appears once you claim the grant.</Muted>
        </p>
      );
    }
    return (
      <DescriptionList
        items={[
          ["Name", <OnFile key="n" value={buyer.name} />],
          ["Email", <OnFile key="e" value={buyer.email && <TextLink href={`mailto:${buyer.email}`} external>{buyer.email}</TextLink>} />],
        ]}
      />
    );
  }
  if (!buyer) {
    return (
      <p className="text-sm">
        {country || <Muted>Country not on file</Muted>}{" "}
        <Muted>· full shipping info appears once you claim it</Muted>
      </p>
    );
  }
  return (
    <>
      <DescriptionList
        items={[
          ["Name", <OnFile key="n" value={buyer.name} />],
          ["Email", <OnFile key="e" value={buyer.email && <TextLink href={`mailto:${buyer.email}`} external>{buyer.email}</TextLink>} />],
          ["Phone", <OnFile key="p" value={buyer.phone} />],
          [
            "Address",
            <OnFile
              key="a"
              value={buyer.addressLines.length > 0 && <span className="whitespace-pre-line">{buyer.addressLines.join("\n")}</span>}
            />,
          ],
        ]}
      />
      {o.status !== "cancelled" && (
        <div className="mt-3">
          <ButtonLink href={`/fulfillment/label/${o.id}`} variant="outline" size="sm" icon="post">
            Print shipping label
          </ButtonLink>
        </div>
      )}
    </>
  );
}

export function OrderDetail({
  order: o,
  buyer,
  country,
  requesterName,
  canSee,
  mine,
  ownOrder,
  canManage,
  eligibility,
}: {
  order: ShopOrderRow;
  buyer?: BuyerDetails;
  country?: string;
  requesterName: string;
  /** The viewer claimed this order or is an owner: only then may buyer identity, notes and supplier links appear. */
  canSee: boolean;
  mine: boolean;
  ownOrder: boolean;
  canManage: boolean;
  eligibility: EligibilityResult | null;
}) {
  const actionable = o.status !== "done" && o.status !== "cancelled";
  const budget = usdBudget(o.price);
  const visible = visibleOrderActions({
    status: o.status,
    flagged: Boolean(o.flagged_at),
    hasBuyerSlack: false,
    mine,
    ownOrder,
    canManage,
  });
  const overBudget = o.actual_cost_usd !== null && Number(o.actual_cost_usd) > Number(budget);

  const facts: [ReactNode, ReactNode][] = [];
  if (o.claimed_by && o.status !== "pending") {
    const verb = o.status === "cancelled" ? "Handled by" : o.status === "shipped" || o.status === "done" ? "Fulfilled by" : "Claimed by";
    facts.push([
      verb,
      <>
        {o.claimed_by}
        {mine && actionable ? " (you)" : ""}
        {o.shipped_at && <Muted> · shipped {formatDate(o.shipped_at)}</Muted>}
        {o.status === "done" && o.done_at && <Muted> · delivered {formatDate(o.done_at)}</Muted>}
      </>,
    ]);
  }
  if (o.actual_cost_usd !== null) {
    facts.push(["Actual cost", <Badge key="c" tone={overBudget ? "danger" : "success"} outline>${Number(o.actual_cost_usd).toFixed(2)}</Badge>]);
  }
  const grant = isGrantOrder(o);
  if (!grant && (o.status === "shipped" || o.status === "done") && o.tracking) {
    facts.push(["Tracking", <Mono key="t">{o.tracking}</Mono>]);
  }
  if (grant && o.status === "done" && o.grant_ref) {
    facts.push(["Grant reference", <Mono key="g">{o.grant_ref}</Mono>]);
  }
  if (o.status === "cancelled" && o.note) facts.push(["Note", o.note]);

  return (
    <article className="fw-detail" aria-label={`Order ${o.id}`}>
      <header className="fw-detail-head">
        <ItemThumb size={72} />
        <div className="min-w-0 flex-1">
          <h2 className="hc-heading fw-title">
            {o.quantity > 1 ? `${o.quantity}x ` : ""}
            {o.item_name || "(item removed)"}
          </h2>
          <p className="fw-meta">
            {canSee ? (
              <>
                <TextLink href={`/players/${o.user_id}`} className="font-bold">
                  {requesterName}
                </TextLink>
                {o.player_slack && <span className="hc-muted"> · @{o.player_slack}</span>}
              </>
            ) : (
              <span className="hc-muted">{country || "Country not on file"}</span>
            )}
            {" · "}
            <span className="hc-muted">{formatDateTime(o.created_at)}</span>
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge tone={STAGE_TONE[o.status] ?? "neutral"}>{STAGE_LABEL[o.status] ?? o.status}</Badge>
            {o.option && <Badge>{o.option}</Badge>}
            {o.is_grant && o.item_category !== "grants" && <Badge tone="cyan" outline>Converted to grant</Badge>}
          </div>
        </div>
        <dl className="fw-tiles">
          <div><dt>Budget</dt><dd>${budget}</dd></div>
          <div><dt>Ore price</dt><dd>{o.price.toLocaleString("en-GB")} Ore</dd></div>
          <div><dt>Type</dt><dd>{o.item_category ? <TypeBadge category={o.item_category} /> : <Muted>-</Muted>}</dd></div>
        </dl>
      </header>

      <Stepper order={o} />

      {grant && actionable && (
        <Callout tone="info" icon="send">
          <strong>Grant order.</strong> Nothing to pack or ship: claim it, send the grant to the builder, then
          record its reference and mark it sent.
        </Callout>
      )}

      {o.flagged_at && (
        <Callout tone="danger" icon="important">
          <strong>Over budget:</strong> {o.flag_note}{" "}
          <Muted>(flagged by {o.flagged_by || "a fulfiller"} on {formatDate(o.flagged_at)})</Muted>
        </Callout>
      )}

      {actionable && eligibility?.status !== "covered" && (
        <Callout tone={eligibility?.status === "restricted" ? "danger" : "warning"} icon="important">
          <strong>Review the Ore before packing.</strong>{" "}
          {eligibility ? ELIGIBILITY_HINT[eligibility.status] : "The Ore check could not be loaded."}
          {" "}Resolve this before going ahead with the order.
        </Callout>
      )}

      <div className="fw-cols">
        <div className="fw-col">
          <Panel title={grant ? "Grant recipient" : "Shipping info"} icon={grant ? "person" : "pin"}>
            <ShippingPanel order={o} buyer={buyer} country={country} />
          </Panel>
          {canSee && o.buyer_note && (
            <Panel title="Buyer note" icon="message">
              <p className="fw-note">{o.buyer_note}</p>
            </Panel>
          )}

        </div>
        <div className="fw-col">
          {canSee && (
            <Panel title="Requester" icon="person">
              <DescriptionList
                items={[
                  ["Builder", <TextLink key="p" href={`/players/${o.user_id}`} className="font-bold">{requesterName}</TextLink>],
                  ["Handle", o.player_slack ? <span key="s">@{o.player_slack}</span> : null],
                  ["Placed", formatDateTime(o.created_at)],
                ]}
              />
            </Panel>
          )}
          {canSee && !grant && <Panel title="Previous source" icon="link">
            {o.item_source_url ? (
              <>
                <p className="hc-caption text-xs">Last bought from</p>
                <p className="mt-1 text-sm">
                  <SafeLink url={o.item_source_url} />
                </p>
                <p className="hc-caption mt-2 text-xs">Use the same supplier as previous purchases when possible.</p>
              </>
            ) : (
              <Muted>No previous source on file for this item.</Muted>
            )}
            {o.item_alt_source_url && (
              <>
                <p className="hc-caption mt-3 text-xs">Alternate link</p>
                <p className="mt-1 text-sm">
                  <SafeLink url={o.item_alt_source_url} />
                </p>
              </>
            )}
          </Panel>}
          {facts.length > 0 && (
            <Panel title="Fulfillment" icon="bolt">
              <DescriptionList items={facts} />
            </Panel>
          )}
        </div>
      </div>

      {visible.any && (
        <Panel title="Actions" icon="bolt">
          <div className="flex flex-col gap-3">
            {visible.primary && <OrderActions order={o} mine={mine} ownOrder={ownOrder} canManage={canManage} />}
            {visible.flag && <FlagControls order={o} canManage={canManage} budget={budget} />}
            {visible.edit && <EditFulfillmentInfo order={o} />}
          </div>
        </Panel>
      )}

    </article>
  );
}
