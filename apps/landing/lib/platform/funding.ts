// Hardware funding, in Pixl's form: the builder asks for a dollar amount for parts and shipping. If the ship is approved the
// amount is taken from that ship's Ore payout and sent as parts through a fulfilment order, so it cannot exceed what the
// ship earns (the cap parameter).
//   parseFundingAmount(input, capUsd?)          pure: reads the typed dollar amount
//   usdToOre(usd)                               pure: the Ore for an amount at the internal rate, rounded up
//   fundingCapUsd(payoutOre)                    pure: what a ship's payout is worth in dollars at the internal rate
//   checkFundingRequest({ amount, payoutOre })  pure: the whole rule, used by saveFunding and its tests
//   saveFunding({ personId, projectId, amount, payoutOre }) -> FundingSaveResult
//       server only: writes one PENDING "funding_deduction" ledger entry for the project. Pending Ore is not spendable, and the review
//       approval of the ship is what confirms it. One saved request per project; the ledger is append-only.
import type { Prisma } from "../generated/prisma/client";
import { recordAudit } from "./audit";
import { db } from "./db";
import { checkLedgerEntry } from "./ledger";
import { USD_PER_TEN_ORE } from "./review";

export type FundingParse = { ok: true; usd: number; cents: number } | { ok: false; error: string };

/** Reads a dollar amount typed into the field. Cents are whole numbers, so 0.1 + 0.2 never drifts. */
export function parseFundingAmount(input: string, capUsd?: number): FundingParse {
  const text = input.trim();
  if (text === "") return { ok: false, error: "Enter an amount in dollars." };
  if (!/^-?\d+(\.\d*)?$/.test(text)) return { ok: false, error: "Use numbers only, like 24.50." };
  if (text.startsWith("-")) return { ok: false, error: "The amount cannot be negative." };
  const decimals = text.split(".")[1] ?? "";
  if (decimals.length > 2) return { ok: false, error: "Use at most two decimal places." };
  const cents = Math.round(Number(text) * 100);
  if (!Number.isSafeInteger(cents)) return { ok: false, error: "That amount is too large." };
  if (capUsd !== undefined && cents > Math.round(capUsd * 100)) {
    return { ok: false, error: `It cannot be more than this ship earns ($${(Math.round(capUsd * 100) / 100).toFixed(2)}).` };
  }
  return { ok: true, usd: cents / 100, cents };
}

/** Ore for an amount at the internal rate, rounded up: Ore = ceil(usd * 10 / USD_PER_TEN_ORE). */
export function usdToOre(usd: number): number {
  const cents = Math.round(Math.max(0, usd) * 100);
  const rateCents = Math.round(USD_PER_TEN_ORE * 100);
  return Math.ceil((cents * 10) / rateCents);
}

/** What a ship's Ore payout is worth in dollars at the internal rate (10 Ore = USD_PER_TEN_ORE). The most funding can ask for. */
export function fundingCapUsd(payoutOre: number): number {
  const ore = Number.isFinite(payoutOre) && payoutOre > 0 ? Math.floor(payoutOre) : 0;
  return (ore * USD_PER_TEN_ORE) / 10;
}

export type FundingRequest = { ok: true; usd: number; cents: number; ore: number } | { ok: false; code: string; message: string };

// The whole rule for a funding request: a dollar amount above zero, at most the ship's payout, and whole Ore that the payout covers.
export function checkFundingRequest(input: { amount: string; payoutOre: number }): FundingRequest {
  const parsed = parseFundingAmount(input.amount, fundingCapUsd(input.payoutOre));
  if (!parsed.ok) return { ok: false, code: "bad_amount", message: parsed.error };
  if (parsed.cents === 0) return { ok: false, code: "bad_amount", message: "Enter an amount above zero." };
  const ore = usdToOre(parsed.usd);
  if (ore > input.payoutOre) return { ok: false, code: "over_payout", message: "This is more than the ship's Ore payout covers." };
  return { ok: true, usd: parsed.usd, cents: parsed.cents, ore };
}

export type FundingSaveResult = { ok: true; usd: number; ore: number } | { ok: false; code: string; message: string };

const FUNDING_REASON_MAX = 200;

export async function saveFunding(input: { personId: string; projectId: string; amount: string; payoutOre: number }): Promise<FundingSaveResult> {
  const checked = checkFundingRequest({ amount: input.amount, payoutOre: input.payoutOre });
  if (!checked.ok) return checked;

  return db().$transaction(async (tx: Prisma.TransactionClient): Promise<FundingSaveResult> => {
    await tx.$queryRaw`SELECT "id" FROM "Person" WHERE "id" = ${input.personId} FOR UPDATE`;
    const person = await tx.person.findUnique({ where: { id: input.personId }, select: { bannedAt: true } });
    if (!person || person.bannedAt) return { ok: false, code: "person_unavailable", message: "This account cannot ask for funding right now." };

    const project = await tx.project.findFirst({ where: { id: input.projectId, ownerId: input.personId }, select: { id: true, title: true } });
    if (!project) return { ok: false, code: "not_found", message: "That project is not yours." };

    const saved = await tx.ledgerEntry.count({ where: { personId: input.personId, projectId: project.id, kind: "funding_deduction" } });
    if (saved > 0) return { ok: false, code: "already_saved", message: "Hardware funding is already saved for this project." };

    const reason = `Hardware funding $${checked.usd.toFixed(2)} for ${project.title}`.slice(0, FUNDING_REASON_MAX);
    const entry = checkLedgerEntry({ amountOre: -checked.ore, status: "pending", kind: "funding_deduction", reason });
    if (!entry.ok) return { ok: false, code: "bad_entry", message: entry.message };
    await tx.ledgerEntry.create({
      data: {
        personId: input.personId,
        projectId: project.id,
        amountOre: entry.entry.amountOre,
        status: entry.entry.status,
        kind: entry.entry.kind,
        reason: entry.entry.reason,
      },
    });

    await recordAudit(tx, {
      actorId: input.personId,
      action: "funding.requested",
      targetType: "Project",
      targetId: project.id,
      reason: "Builder asked for hardware funding, taken from the ship payout on approval.",
      after: { usdCents: checked.cents, ore: checked.ore, payoutOre: input.payoutOre },
    });
    return { ok: true, usd: checked.usd, ore: checked.ore };
  });
}
