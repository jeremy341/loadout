"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { EmptyState, Field, Panel, Tag, formatDate } from "../../ui/ui";
import { useOre } from "../../../lib/ore-ledger";
import { uid, usePreviewState } from "../../../lib/preview-store";
import { AVAILABILITY_NOTE, TRACKS } from "./data";
import {
  GEAR_KEYS,
  NO_CUSTOM,
  acceptQuoteNow,
  approveQuoteNow,
  createCustomRequestNow,
  declineRequestNow,
  startReviewNow,
  useGearProfile,
  useTickets,
  withdrawRequestNow,
} from "./gear-store";
import { PreviewTools, formatOre } from "./gear-ui";
import {
  CURRENCIES,
  CUSTOM_STATUS_LABELS,
  WHY_MAX,
  WHY_MIN,
  isActive,
  quoteItem,
  type CustomErrors,
  type CustomRequest,
} from "./logic/custom-orders";
import { checkTicket, priceItem, priceOrder, shortfall, ticketLabel, type Ticket } from "./logic/pricing";

// Custom Orders (plans/02 section 28): ask for equipment that is not in the normal shop. The request, review and
// quote mechanism is agreed; tiers, limits and the sourcing formula are not. The team's review is simulated with
// Preview tools, and the quote is typed in by hand.

export function CustomOrderTab({ announce }: { announce: (message: string) => void }) {
  const [requests] = usePreviewState<CustomRequest[]>(GEAR_KEYS.custom, NO_CUSTOM);

  return (
    <div className="gr-stack">
      <div className="gr-prose">
        <p>
          A Custom Order is a request for technical equipment that is not in the normal shop. It needs enough Ore, a relevant level, a fit with the program and fulfillment approval. A Requisition never bypasses a level requirement, and it applies only if the approved quote says so.
        </p>
        <p className="gr-note">
          <strong>Preview.</strong> Level tiers, limits, quote validity and the sourcing formula are not decided, so no level is checked here. Nobody at LOADOUT sees your request. A Preview tools step stands in for the team&apos;s review and you type the sample quote yourself.
        </p>
      </div>
      <RequestForm announce={announce} />
      <section aria-labelledby="gr-custom-list" className="gr-stack">
        <h2 id="gr-custom-list" className="gr-h2">
          Your requests
        </h2>
        {requests.length === 0 ? (
          <EmptyState title="No requests yet">Fill in the form above to make your first Custom Order request.</EmptyState>
        ) : (
          <ul className="gr-stack" aria-label="Custom Order requests">
            {requests.map((request) => (
              <li key={request.id} className="gr-order">
                <RequestCard request={request} announce={announce} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RequestForm({ announce }: { announce: (message: string) => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [item, setItem] = useState("");
  const [url, setUrl] = useState("");
  const [estimate, setEstimate] = useState("");
  const [currency, setCurrency] = useState<string>("EUR");
  const [why, setWhy] = useState("");
  const [tracks, setTracks] = useState<string[]>([]);
  const [errors, setErrors] = useState<CustomErrors>({});
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (attempt > 0) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [attempt]);

  function toggleTrack(name: string) {
    setTracks((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = createCustomRequestNow({ item, url, why, estimate, currency, tracks });
    if (!result.ok) {
      setErrors(result.errors);
      setAttempt((n) => n + 1);
      announce(`The request was not sent. ${Object.keys(result.errors).length} ${Object.keys(result.errors).length === 1 ? "field needs" : "fields need"} fixing.`);
      return;
    }
    setErrors({});
    setItem("");
    setUrl("");
    setEstimate("");
    setWhy("");
    setTracks([]);
    announce(`Custom Order request for ${result.request.item} saved with status Requested.`);
  }

  return (
    <Panel title="Request a Custom Order">
      <form ref={formRef} className="gr-stack" onSubmit={submit} noValidate>
        <div className="form-grid">
          <div className="wide">
            <Field label="Item" error={errors.item}>
              <input type="text" value={item} maxLength={80} aria-invalid={Boolean(errors.item)} placeholder="Framework Laptop 13" onChange={(event) => setItem(event.target.value)} />
            </Field>
          </div>
          <div className="wide">
            <Field label="Link to the item" hint="A page that shows exactly what you want. It must start with http:// or https://." error={errors.url}>
              <input type="url" inputMode="url" value={url} aria-invalid={Boolean(errors.url)} placeholder="https://" onChange={(event) => setUrl(event.target.value)} />
            </Field>
          </div>
          <Field label="Estimated real price" hint="Your estimate, before shipping and tax." error={errors.estimate}>
            <input type="text" inputMode="decimal" value={estimate} aria-invalid={Boolean(errors.estimate)} placeholder="1049" onChange={(event) => setEstimate(event.target.value)} />
          </Field>
          <Field label="Currency">
            <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </Field>
          <div className="wide">
            <Field
              label="What capability does it add?"
              hint={`${why.trim().length} of ${WHY_MAX} characters, at least ${WHY_MIN}. Say what you will build, test or learn with it.`}
              error={errors.why}
            >
              <textarea value={why} maxLength={WHY_MAX + 50} aria-invalid={Boolean(errors.why)} onChange={(event) => setWhy(event.target.value)} />
            </Field>
          </div>
        </div>
        <fieldset className="gr-fieldset" aria-describedby={errors.tracks ? "gr-custom-tracks-err" : undefined}>
          <legend>Track affinity</legend>
          <div className="gr-checks">
            {TRACKS.map((name, index) => (
              <label key={name} className="check">
                <input
                  type="checkbox"
                  checked={tracks.includes(name)}
                  aria-invalid={Boolean(errors.tracks) && index === 0}
                  onChange={() => toggleTrack(name)}
                />
                <span>{name}</span>
              </label>
            ))}
          </div>
          {errors.tracks ? (
            <p id="gr-custom-tracks-err" className="fld-error" role="alert">
              {errors.tracks}
            </p>
          ) : null}
        </fieldset>
        <div className="gr-row">
          <button type="submit" className="btn">
            Send request
          </button>
        </div>
      </form>
    </Panel>
  );
}

function RequestCard({ request, announce }: { request: CustomRequest; announce: (message: string) => void }) {
  const base = useId();
  const [withdrawing, setWithdrawing] = useState(false);

  return (
    <>
      <div className="gr-row-between">
        <h3>{request.item}</h3>
        <Tag tone={request.status === "approved" || request.status === "ordered" ? "ok" : request.status === "declined" ? "bad" : "plain"}>
          {CUSTOM_STATUS_LABELS[request.status]}
        </Tag>
      </div>
      <p className="mut">
        Sent {formatDate(request.createdAt)}. Estimated real price {request.estimate.toLocaleString("en-GB")} {request.currency}. Tracks: {request.tracks.join(", ")}.
      </p>
      <p>
        <a href={request.url} target="_blank" rel="noopener noreferrer">
          Item link<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
      <p>{request.why}</p>

      <ol className="gr-timeline" aria-label="Request history">
        {request.history.map((stamp, index) => (
          <li key={`${stamp.status}-${index}`} data-state={index === request.history.length - 1 ? "current" : "done"}>
            <span className="gr-step-name">{CUSTOM_STATUS_LABELS[stamp.status]}</span>
            <span className="gr-step-state">{formatDate(stamp.at)}</span>
          </li>
        ))}
      </ol>

      {request.status === "approved" ? <QuoteAccept request={request} announce={announce} /> : null}
      {request.status === "ordered" ? (
        <p>
          Ordered. <Link href="/orders">See it in Orders</Link>.
        </p>
      ) : null}

      {isActive(request) ? (
        <div className="gr-stack">
          {withdrawing ? (
            <div className="gr-confirm" role="group" aria-labelledby={`${base}-wd`}>
              <p id={`${base}-wd`}>
                <strong>Withdraw this request?</strong> It stays in your list as Withdrawn. No Ore is involved yet.
              </p>
              <div className="gr-row">
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    withdrawRequestNow(request.id);
                    announce(`Request for ${request.item} withdrawn.`);
                  }}
                >
                  Yes, withdraw
                </button>
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => setWithdrawing(false)}>
                  Keep it
                </button>
              </div>
            </div>
          ) : (
            <div className="gr-row">
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => setWithdrawing(true)}>
                Withdraw request
              </button>
            </div>
          )}
          <ReviewTools request={request} announce={announce} />
        </div>
      ) : null}
    </>
  );
}

function ReviewTools({ request, announce }: { request: CustomRequest; announce: (message: string) => void }) {
  const [quote, setQuote] = useState("");
  const [allows, setAllows] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (request.status === "approved") return null;

  return (
    <PreviewTools level={4} hint="The team's review is simulated. Nothing is sent and nobody reviews this request.">
      {request.status === "requested" ? (
        <button
          type="button"
          className="btn btn-quiet btn-sm"
          onClick={() => {
            startReviewNow(request.id);
            announce(`Request for ${request.item} is now In review (simulated).`);
          }}
        >
          Simulate: start review
        </button>
      ) : null}
      {request.status === "in-review" ? (
        <>
          <Field label="Sample quote (Ore)" error={error}>
            <input type="text" inputMode="numeric" value={quote} aria-invalid={Boolean(error)} onChange={(event) => setQuote(event.target.value)} />
          </Field>
          <label className="check">
            <input type="checkbox" checked={allows} onChange={(event) => setAllows(event.target.checked)} />
            <span>Quote allows Requisitions</span>
          </label>
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={() => {
              const result = approveQuoteNow(request.id, quote, allows);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setError(null);
              announce(`Quote ready for ${request.item} (simulated).`);
            }}
          >
            Simulate: approve with this quote
          </button>
        </>
      ) : null}
      <button
        type="button"
        className="btn btn-quiet btn-sm"
        onClick={() => {
          declineRequestNow(request.id);
          announce(`Request for ${request.item} declined (simulated).`);
        }}
      >
        Simulate: decline
      </button>
    </PreviewTools>
  );
}

function QuoteAccept({ request, announce }: { request: CustomRequest; announce: (message: string) => void }) {
  const base = useId();
  const { levels } = useGearProfile();
  const { available } = useTickets();
  const { balance } = useOre();
  const [ticketId, setTicketId] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const confirmRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (pendingId) confirmRef.current?.focus();
  }, [pendingId]);

  const item = quoteItem(request);
  if (!item) return null;
  const usable = available.filter((ticket) => checkTicket(ticket, item).ok);
  const chosen: Ticket | null = usable.find((ticket) => ticket.id === ticketId) ?? null;
  const price = priceOrder(item, 1, levels, chosen);
  const unit = priceItem(item, levels);
  const missing = shortfall(balance, price.total);

  function accept() {
    if (!pendingId) return;
    const result = acceptQuoteNow(request.id, pendingId, chosen);
    setPendingId(null);
    if (!result.ok) {
      setError(result.message);
      announce(`Order not placed. ${result.message}`);
      return;
    }
    setError(null);
    setTicketId("");
    announce(`Order ${result.order.number} placed from your Custom Order quote. ${formatOre(result.order.oreSpent)} spent.`);
  }

  return (
    <div className="gr-stack">
      <h4 className="gr-h4">Quote ready</h4>
      <p className="gr-note">This quote was typed in with Preview tools. A real quote would come from the team after a fulfillability review. {AVAILABILITY_NOTE}</p>
      {request.quoteAllowsRequisition ? (
        <Field label="Requisition" hint="This quote allows one Requisition.">
          <select value={chosen?.id ?? ""} onChange={(event) => setTicketId(event.target.value)} disabled={Boolean(pendingId)}>
            <option value="">None</option>
            {usable.map((ticket) => (
              <option key={ticket.id} value={ticket.id}>
                {ticketLabel(ticket)}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <p className="mut">This quote does not allow Requisitions.</p>
      )}
      <dl className="gr-dl">
        <dt>Approved quote</dt>
        <dd>{formatOre(request.quote ?? 0)}</dd>
        <dt>Track discount{unit.permanentPercent > 0 ? ` (${unit.permanentPercent}%, ${unit.permanentTrack})` : ""}</dt>
        <dd>{price.permanentSavingTotal > 0 ? `-${formatOre(price.permanentSavingTotal)}` : "None"}</dd>
        <dt>Requisition</dt>
        <dd>{price.ticketSaving > 0 ? `-${formatOre(price.ticketSaving)}` : "None"}</dd>
        <dt className="gr-total">Final price</dt>
        <dd className="gr-total">{formatOre(price.total)}</dd>
        <dt>Your Ore now</dt>
        <dd>{formatOre(balance)}</dd>
      </dl>
      {error ? (
        <p className="gr-warn" role="alert">
          {error}
        </p>
      ) : null}
      {pendingId ? (
        <div className="gr-confirm" role="group" aria-labelledby={`${base}-c`}>
          <p id={`${base}-c`} ref={confirmRef} tabIndex={-1} className="gr-focus-target">
            <strong>Confirm: spend {formatOre(price.total)} on this Custom Order?</strong>
          </p>
          {chosen ? <p>Using this Requisition consumes it.</p> : null}
          <div className="gr-row">
            <button type="button" className="btn" onClick={accept}>
              Confirm and spend {formatOre(price.total)}
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setPendingId(null)}>
              Go back
            </button>
          </div>
        </div>
      ) : (
        <div className="gr-stack">
          <div className="gr-row">
            <button
              type="button"
              className="btn"
              aria-disabled={missing > 0}
              aria-describedby={missing > 0 ? `${base}-short` : undefined}
              onClick={() => {
                if (missing === 0) setPendingId(uid("ord"));
              }}
            >
              Accept quote and redeem
            </button>
          </div>
          {missing > 0 ? (
            <p id={`${base}-short`} className="gr-warn">
              You need {formatOre(missing)} more. <Link href="/ore-calculator">Estimate how much Ore a project could earn</Link>.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
