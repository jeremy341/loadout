import { USD_PER_TEN_ORE } from "./review";

// Hardware funding, in Pixl's form: the builder asks for a dollar amount for parts and shipping. If the ship is approved the
// amount is taken from that ship's Ore payout and sent as parts through a fulfilment order, so it cannot exceed what the
// ship earns (the cap parameter). Nothing is saved yet; these are the pure rules the card and the later action share.

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
