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
import { readCappedBody } from "@/lib/platform/media-limits";
import {
  WEBHOOK_MAX_BODY_BYTES,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
  verifyWebhook,
} from "@/lib/platform/integrations/webhook-signature";

export const dynamic = "force-dynamic";

type OutcomeBody = {
  event?: unknown;
  externalId?: unknown;
  projectSeq?: unknown;
  outcome?: { trustScore?: unknown; reviewedAt?: unknown; reason?: unknown; externalId?: unknown; projectSeq?: unknown };
  project?: { externalId?: unknown; projectSeq?: unknown };
};

type Reading = NonNullable<ReturnType<typeof verdictFor>>;

const reply = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });

function isTooLarge(rawBody: string): boolean {
  return new TextEncoder().encode(rawBody).byteLength > WEBHOOK_MAX_BODY_BYTES;
}

// Null when the signature checks out; otherwise the refusal to send back.
function signatureRefusal(req: Request, rawBody: string): NextResponse | null {
  const verdict = verifyWebhook({
    secret: process.env.LOADOUT_FRAUD_WEBHOOK_SECRET,
    timestamp: req.headers.get(WEBHOOK_TIMESTAMP_HEADER),
    signature: req.headers.get(WEBHOOK_SIGNATURE_HEADER),
    rawBody,
  });
  if (verdict.ok) return null;
  if (verdict.reason === "not_configured") {
    return reply({ ok: false, state: "not_connected", error: "The fraud webhook is not configured in this environment." }, 503);
  }
  return reply({ ok: false, error: "Signature check failed." }, 401);
}

function parseBody(rawBody: string): OutcomeBody | null {
  try {
    const parsed: unknown = JSON.parse(rawBody);
    return parsed !== null && typeof parsed === "object" ? (parsed as OutcomeBody) : null;
  } catch {
    return null;
  }
}

// Our external id is loadout-<seq>-<seconds>.
function seqFromExternalId(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^loadout-(\d+)-\d+$/.exec(value);
  return match ? Number(match[1]) : null;
}

function seqFromProjectSeq(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

// A payload without one of our ids is read but cannot be matched to a ship.
function findSeq(body: OutcomeBody): number | null {
  const ids = [body.externalId, body.outcome?.externalId, body.project?.externalId];
  const seqs = [body.projectSeq, body.outcome?.projectSeq, body.project?.projectSeq];
  const fromId = ids.map(seqFromExternalId).find((seq) => seq !== null);
  if (fromId !== undefined) return fromId;
  return seqs.map(seqFromProjectSeq).find((seq) => seq !== null) ?? null;
}

type Applied = { recorded: boolean; advanced: boolean; state: string };

async function applyOutcome(seq: number, reading: Reading, reviewedAt: string): Promise<Applied> {
  const project = await db().project.findFirst({ where: { seq }, select: { id: true } });
  if (!project) return { recorded: false, advanced: false, state: "unmatched_project" };
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
  const advanced = await advanceIfScored(db(), project.id, new Date());
  return { recorded: written.ok, advanced, state: "applied" };
}

// True the first time a verified delivery signature is seen. A captured request that is replayed inside the timestamp tolerance
// finds its signature already stored and is not processed again (L3). Called only after the signature checks out.
async function firstDelivery(signature: string): Promise<boolean> {
  if (!databaseConfigured()) return true;
  try {
    await db().webhookReplay.create({ data: { signature } });
    return true;
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return false;
    throw error;
  }
}

async function applyIfMatched(seq: number | null, reading: Reading, reviewedAt: string): Promise<Applied> {
  if (seq === null) return { recorded: false, advanced: false, state: "unmatched" };
  if (!databaseConfigured()) return { recorded: false, advanced: false, state: "no_database" };
  return applyOutcome(seq, reading, reviewedAt);
}

function readOutcome(body: OutcomeBody): { reading: Reading; reviewedAt: string } | null {
  const reviewedAt = typeof body.outcome?.reviewedAt === "string" ? body.outcome.reviewedAt : new Date().toISOString();
  const reading = verdictFor({ trustScore: Number(body.outcome?.trustScore), note: "", reviewedAt, robertState: "decided" });
  return reading ? { reading, reviewedAt } : null;
}

// Events other than outcome.set are answered without touching anything.
function nonOutcomeReply(body: OutcomeBody): NextResponse | null {
  if (body.event === "ping") return reply({ ok: true });
  return body.event === "outcome.set" ? null : reply({ ok: true, ignored: true });
}

export async function POST(req: Request) {
  // Counted as it streams, so a huge body is refused without being buffered. The signature is checked over the exact bytes.
  const bytes = await readCappedBody(req, WEBHOOK_MAX_BODY_BYTES);
  if (bytes === null) return reply({ ok: false, error: "Body too large." }, 413);
  const rawBody = new TextDecoder().decode(bytes);
  if (isTooLarge(rawBody)) return reply({ ok: false, error: "Body too large." }, 413);

  const refusal = signatureRefusal(req, rawBody);
  if (refusal) return refusal;

  // Only a verified signature is recorded, so an attacker cannot fill the replay table without the secret.
  const signature = req.headers.get(WEBHOOK_SIGNATURE_HEADER) ?? "";
  if (!(await firstDelivery(signature))) return reply({ ok: true, duplicate: true }, 200);

  const body = parseBody(rawBody);
  if (!body) return reply({ ok: false, error: "Body is not valid JSON." }, 400);

  const early = nonOutcomeReply(body);
  if (early) return early;

  const outcome = readOutcome(body);
  if (!outcome) return reply({ ok: false, error: "No usable score in the outcome." }, 400);
  const { reading, reviewedAt } = outcome;

  const { recorded, advanced, state } = await applyIfMatched(findSeq(body), reading, reviewedAt);

  // 202: the signature was verified. "applied" says whether a row or a status move actually happened; a staging reply never claims more.
  return reply({ ok: true, applied: recorded || advanced, state, recorded, advanced, score: reading.score, fraudStatus: reading.status }, 202);
}
