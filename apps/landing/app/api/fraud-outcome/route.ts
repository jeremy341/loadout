// Signed inbound webhook for fraud outcomes (Telescreen's "outcome.set" and "ping"). The signature is verified first. A payload that
// carries our external id (loadout-<seq>-<seconds>) is recorded as an append-only FraudCheck row and advances a parked ship, using the
// same rule as the poll in robert-sync.ts. A payload without a match is read and answered honestly; nothing is invented.
//
// Secret: LOADOUT_FRAUD_WEBHOOK_SECRET (at least 16 characters, set locally only). Unset: 503, so the sender sees "not connected".
// Scheme: header x-loadout-signature = "sha256=" + hex HMAC-SHA256 of "<x-loadout-timestamp>.<raw body>". See
// lib/platform/integrations/webhook-signature.ts. Timestamps more than five minutes out are refused.
import { NextResponse } from "next/server";
import { databaseConfigured, db } from "@/lib/platform/db";
import { recordCheck } from "@/lib/platform/fraud/checks";
import { verdictFor } from "@/lib/platform/fraud/robert-outcome";
import { advanceIfScored } from "@/lib/platform/fraud/robert-sync";
import {
  WEBHOOK_MAX_BODY_BYTES,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
  verifyWebhook,
} from "@/lib/platform/integrations/webhook-signature";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rawBody = await req.text();
  if (new TextEncoder().encode(rawBody).byteLength > WEBHOOK_MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "Body too large." }, { status: 413 });
  }

  const verdict = verifyWebhook({
    secret: process.env.LOADOUT_FRAUD_WEBHOOK_SECRET,
    timestamp: req.headers.get(WEBHOOK_TIMESTAMP_HEADER),
    signature: req.headers.get(WEBHOOK_SIGNATURE_HEADER),
    rawBody,
  });
  if (!verdict.ok) {
    if (verdict.reason === "not_configured") {
      return NextResponse.json({ ok: false, state: "not_connected", error: "The fraud webhook is not configured in this environment." }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: "Signature check failed." }, { status: 401 });
  }

  let body: {
    event?: unknown;
    externalId?: unknown;
    projectSeq?: unknown;
    outcome?: { trustScore?: unknown; reviewedAt?: unknown; reason?: unknown; externalId?: unknown; projectSeq?: unknown };
    project?: { externalId?: unknown; projectSeq?: unknown };
  };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Body is not valid JSON." }, { status: 400 });
  }

  if (body.event === "ping") return NextResponse.json({ ok: true });
  if (body.event !== "outcome.set") return NextResponse.json({ ok: true, ignored: true });

  const score = Number(body.outcome?.trustScore);
  const reviewedAt = typeof body.outcome?.reviewedAt === "string" ? body.outcome.reviewedAt : new Date().toISOString();
  const reading = verdictFor({ trustScore: score, note: "", reviewedAt, robertState: "decided" });
  if (!reading) return NextResponse.json({ ok: false, error: "No usable score in the outcome." }, { status: 400 });

  // Our external id is loadout-<seq>-<seconds>; a payload without one is read but cannot be matched to a ship.
  const ids = [body.externalId, body.outcome?.externalId, body.project?.externalId];
  let seq: number | null = null;
  for (const value of ids) {
    if (typeof value !== "string") continue;
    const match = /^loadout-(\d+)-\d+$/.exec(value);
    if (match) {
      seq = Number(match[1]);
      break;
    }
  }
  if (seq === null) {
    for (const value of [body.projectSeq, body.outcome?.projectSeq, body.project?.projectSeq]) {
      if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
        seq = value;
        break;
      }
    }
  }

  let recorded = false;
  let advanced = false;
  let state = seq === null ? "unmatched" : "pending";
  if (seq !== null && databaseConfigured()) {
    const project = await db().project.findFirst({ where: { seq }, select: { id: true } });
    if (project) {
      const written = await recordCheck(
        {
          projectId: project.id,
          kind: "robert",
          status: reading.status,
          score: reading.score,
          summary: reading.summary,
          detail: { source: "webhook", reviewedAt },
        },
        db(),
      );
      recorded = written.ok;
      advanced = await advanceIfScored(db(), project.id, new Date());
      state = "applied";
    } else {
      state = "unmatched_project";
    }
  } else if (seq !== null) {
    state = "no_database";
  }

  // 202: the signature was verified. "applied" says whether a row or a status move actually happened; a staging reply never claims more.
  return NextResponse.json(
    {
      ok: true,
      applied: recorded || advanced,
      state,
      recorded,
      advanced,
      score: reading.score,
      fraudStatus: reading.status,
    },
    { status: 202 },
  );
}
