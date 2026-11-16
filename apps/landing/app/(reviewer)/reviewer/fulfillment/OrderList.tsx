import Link from "next/link";
import type { ShopOrderRow } from "@/reviewer-dash/lib/db";
import { SHOP_CATEGORY_LABELS } from "@/reviewer-dash/lib/shopCategories";
import { Badge, Icon, type Tone } from "@/reviewer-dash/app/_ui/ui";
import type { EligibilityResult } from "@/reviewer-dash/lib/eligibility/engine";
import { ELIGIBILITY_HINT, ELIGIBILITY_SHORT } from "@/reviewer-dash/lib/eligibility/format";
import { STAGE_LABEL, STAGE_TONE, ageLabel, lastUpdated, usdBudget } from "./shared";

// Items have no photo on the reviewer site: every order shows the same plain package tile.
export function ItemThumb({ size = 40 }: { src?: string | null; size?: number }) {
  const style = { width: size, height: size };
  return (
    <span style={style} className="fw-thumb fw-thumb-empty hc-muted" aria-hidden>
      <Icon glyph="package" size={Math.round(size * 0.5)} />
    </span>
  );
}

export function typeTone(category: ShopOrderRow["item_category"]): Tone {
  if (category === "software" || category === "cloud") return "purple";
  return "info";
}

export function TypeBadge({ category }: { category: ShopOrderRow["item_category"] }) {
  if (!category) return null;
  return <Badge tone={typeTone(category)} outline>{SHOP_CATEGORY_LABELS[category] ?? SHOP_CATEGORY_LABELS.other}</Badge>;
}

export function OrderList({
  orders,
  selectedId,
  hrefFor,
  nameFor,
  now,
  eligibility,
}: {
  orders: ShopOrderRow[];
  selectedId: number | null;
  hrefFor: (id: number) => string;
  nameFor: (o: ShopOrderRow) => string;
  now: number;
  eligibility: Map<number, EligibilityResult>;
}) {
  return (
    <div className="fw-request-list" role="list" aria-label="Fulfilment requests">
      {orders.map((o) => {
        const selected = o.id === selectedId;
        const funding = eligibility.get(Number(o.id)) ?? null;
        const age = ageLabel(lastUpdated(o), now);
        const fundingStatus = funding?.status ?? "unverified";
        const fundingLabel = funding ? ELIGIBILITY_SHORT[funding.status] : "Not loaded";
        const fundingHint = funding
          ? `${ELIGIBILITY_HINT[funding.status]}. ${funding.verificationSummary}`
          : "The Ore check is unavailable. Review it before acting.";
        return (
          <Link
            key={o.id}
            href={hrefFor(o.id)}
            scroll={false}
            role="listitem"
            aria-current={selected ? "true" : undefined}
            className="fw-request-row"
            data-selected={selected ? "true" : undefined}
          >
            <span className="fw-request-primary">
              <ItemThumb size={48} />
              <span className="fw-request-description">
                <span className="fw-request-name">
                  {o.quantity > 1 ? `${o.quantity}x ` : ""}
                  {o.item_name || "(item removed)"}
                </span>
                <span className="fw-request-byline">
                  {nameFor(o)}
                  {age && <span> · {age}</span>}
                </span>
                {o.option && <span className="fw-request-option">{o.option}</span>}
              </span>
            </span>
            <span className="fw-request-amount">
              <strong className="tabular-nums">${usdBudget(o.price)}</strong>
              <span className="tabular-nums">{o.price.toLocaleString("en-GB")} Ore</span>
            </span>
            <span className="fw-request-meta">
              <span className="fw-request-stage" data-tone={STAGE_TONE[o.status] ?? "neutral"}>
                <span className="fw-request-dot" aria-hidden="true" />
                {STAGE_LABEL[o.status] ?? o.status}
              </span>
              <span className="fw-request-meta-separator" aria-hidden="true" />
              <span className="fw-request-check" data-status={fundingStatus} title={fundingHint}>
                <span className="fw-request-check-dot" aria-hidden="true" />
                Ore: {fundingLabel}
              </span>
              {o.flagged_at && <span className="fw-request-flag">Over budget</span>}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
