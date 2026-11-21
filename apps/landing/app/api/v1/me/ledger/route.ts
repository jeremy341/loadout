import { apiError, apiRoute, personOf } from "@/lib/platform/api-v1/guard";
import { ledgerBalances } from "@/lib/platform/ledger-data";
import { pageOf, pagingFrom } from "@/lib/platform/api-v1/query";
import { ownLedger } from "@/lib/platform/api-v1/queries-data";
import { iso, serializeLedgerEntry } from "@/lib/platform/api-v1/serializers";

// The signed-in person's own Ore entries, newest first, with their balances. Other people's Ore is never here.
export const GET = apiRoute({ scope: "ledger" }, async (call) => {
  const paging = pagingFrom(call.url);
  if (!paging.ok) return apiError(400, "bad_request", paging.message);
  const personId = personOf(call);
  const [rows, balance] = await Promise.all([ownLedger(personId, paging.cursor, paging.limit), ledgerBalances(personId)]);
  const page = pageOf(rows, paging.limit, (r) => ({ k: iso(r.createdAt) ?? "", id: r.id }));
  return Response.json({
    balance: { confirmedOre: balance.confirmed, pendingOre: balance.pending, availableOre: balance.available },
    items: page.items.map(serializeLedgerEntry),
    nextCursor: page.nextCursor,
  });
});
