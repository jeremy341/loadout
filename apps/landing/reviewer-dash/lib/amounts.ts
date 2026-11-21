// Parsing for the two kinds of amount a staff form can carry: an Ore price (a whole number) and a dollar cost (to the cent). Both
// reject instead of clamping: NaN, Infinity, "1e999", hex, a minus sign or an absurd size gives null, so the caller refuses the
// form rather than saving a number nobody typed. A blank field is null too (Number("") is 0, which would look like a real free price).

// The dearest thing in the shop is a few thousand Ore. A price past this is a typo or an attack, not an item.
export const MAX_ORE_PRICE = 100_000;
// The most one order can have cost to buy. Past this the fulfiller should flag it, not record it.
export const MAX_COST_USD = 50_000;

const PLAIN_NUMBER = /^\d{1,12}(\.\d{1,6})?$/;

function plainNumber(raw: unknown): number | null {
  const value = typeof raw === "number" ? raw : typeof raw === "string" && PLAIN_NUMBER.test(raw.trim()) ? Number(raw.trim()) : Number.NaN;
  return Number.isFinite(value) && value >= 0 ? value : null;
}

// An Ore price: whole Ore, 0 to MAX_ORE_PRICE.
export function parseOrePrice(raw: unknown): number | null {
  const value = plainNumber(raw);
  if (value === null) return null;
  const whole = Math.round(value);
  return whole <= MAX_ORE_PRICE ? whole : null;
}

// A dollar cost: 0 to MAX_COST_USD, rounded to the cent.
export function parseCostUsd(raw: unknown): number | null {
  const value = plainNumber(raw);
  if (value === null) return null;
  const cents = Math.round(value * 100) / 100;
  return cents <= MAX_COST_USD ? cents : null;
}
