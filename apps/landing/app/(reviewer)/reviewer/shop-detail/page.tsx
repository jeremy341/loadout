import { requirePage } from "@/reviewer-dash/lib/guard";
import { listShopItems, requisitionNote, SHOP_CATEGORY_LABELS } from "@/reviewer-dash/lib/db";
import { updateShopItemDetails } from "@/reviewer-dash/app/actions";
import { parseOptionGroups } from "@/reviewer-dash/lib/shopOptions";
import { config } from "@/reviewer-dash/app/_generated/config";
import {
  ActionButton,
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  Field,
  FilterBar,
  Icon,
  Input,
  Muted,
  PageHeader,
  Pagination,
} from "@/reviewer-dash/app/_ui/ui";

export const dynamic = "force-dynamic";

const PER = 10;

// One page for the supplier side of every item: its one Ore price (the same everywhere, plans/02), the link the team priced it from and
// an alternate. It replaces Pixl's regional pricing page: LOADOUT has no regional prices to audit. See updateShopItemDetails in
// app/actions-content.ts for the save side.
export default async function ShopDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requirePage("owner");
  const { q, page } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();

  let items = (await listShopItems()).sort((a, b) => a.name.localeCompare(b.name));
  if (query) items = items.filter((i) => i.name.toLowerCase().includes(query));
  const pages = Math.max(1, Math.ceil(items.length / PER));
  const cur = Math.min(Math.max(parseInt(page ?? "1", 10) || 1, 1), pages);
  const shown = items.slice((cur - 1) * PER, cur * PER);
  const qParam = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Item details"
        count={items.length}
        description="Every shop item with its one base Ore price and where that price came from, for checking the price against the real listing. The price is the same everywhere."
        actions={
          <ButtonLink href="/shop" variant="outline" size="sm" icon="view-back">
            Shop
          </ButtonLink>
        }
      />

      <FilterBar q={q} placeholder="Search item names..." />

      {shown.length === 0 && (
        <Card>
          <EmptyState title="No items" icon="bag">
            {query ? "Nothing matches that search." : "There are no shop items yet."}
          </EmptyState>
        </Card>
      )}

      {shown.map((item) => {
        const options = parseOptionGroups(item.options);
        return (
          <Card key={item.id}>
            <div className="flex gap-4">
              <span className="hc-muted grid h-16 w-16 shrink-0 place-items-center rounded-md border border-[var(--border)] bg-[var(--sunken)]">
                <Icon glyph="bag" size={28} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="hc-heading text-lg">{item.name}</span>
                  <Badge>{SHOP_CATEGORY_LABELS[item.category] ?? SHOP_CATEGORY_LABELS.other}</Badge>
                  {item.tracks.length === 0 ? (
                    <Badge outline>General</Badge>
                  ) : (
                    item.tracks.map((t) => (
                      <Badge key={t} tone="info" outline>
                        {t}
                      </Badge>
                    ))
                  )}
                  {!item.active && <Badge tone="warning">Hidden</Badge>}
                </div>
                <p className="hc-caption mt-1 text-xs">{requisitionNote(item)}</p>
                {options.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {options.map((g, gi) => (
                      <div key={gi} className="flex flex-wrap items-center gap-1.5">
                        {g.name && <Muted className="text-xs font-bold">{g.name}:</Muted>}
                        {g.choices.map((c) => (
                          <Badge key={c} outline>
                            {c}
                          </Badge>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <form action={updateShopItemDetails} className="mt-4 grid gap-3 sm:grid-cols-[8rem_1fr_1fr_auto] sm:items-end">
              <input type="hidden" name="id" value={item.id} />
              <Field label="Base price (Ore)" hint={`About $${(item.price * config.economy.oreValueUsd).toFixed(2)} budget`}>
                <Input name="price" type="number" min={0} defaultValue={item.price} />
              </Field>
              <Field label="Price source link">
                <Input name="source" type="url" defaultValue={item.price_source_url} placeholder="https://..." />
              </Field>
              <Field label="Alternate link">
                <Input name="alt_source" type="url" defaultValue={item.alt_source_url ?? ""} placeholder="https://..." />
              </Field>
              <ActionButton pendingLabel="Saving...">Save</ActionButton>
            </form>
          </Card>
        );
      })}

      {items.length > PER && <Pagination page={cur} totalPages={pages} hrefFor={(p) => `/shop-detail?page=${p}${qParam}`} />}
    </div>
  );
}
