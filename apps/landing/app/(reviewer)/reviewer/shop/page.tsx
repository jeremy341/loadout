import { requirePage } from "@/reviewer-dash/lib/guard";
import {
  listShopItems,
  listPersonalShopItems,
  listShopOptionStock,
  requisitionNote,
  SHOP_CATEGORIES,
  SHOP_CATEGORY_LABELS,
  type ShopItemRow,
} from "@/reviewer-dash/lib/db";
import { addShopItem, toggleShopItem, deleteShopItem, updateShopItem } from "@/reviewer-dash/app/actions";
import { OptionsEditor } from "@/reviewer-dash/app/_components/OptionsEditor";
import { AddShopItemForm } from "@/reviewer-dash/app/_components/AddShopItemForm";
import { PersonalShopItems } from "@/reviewer-dash/app/_components/PersonalShopItems";
import { BulkUploadShopItemsForm } from "@/reviewer-dash/app/_components/BulkUploadShopItemsForm";
import { parseOptionGroups } from "@/reviewer-dash/lib/shopOptions";
import { config } from "@/reviewer-dash/app/_generated/config";
import { TRACKS } from "@/lib/platform/progress";
import {
  ActionButton,
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  Checkbox,
  Details,
  EmptyState,
  Field,
  Flash,
  Icon,
  Input,
  LinkTabs,
  Muted,
  NativeSelect,
  PageHeader,
  Pagination,
} from "@/reviewer-dash/app/_ui/ui";

export const dynamic = "force-dynamic";

const PER = 8;
const GENERAL = "General";

// Items have no photo here: LOADOUT carries no shop imagery on the reviewer site, so every item shows the same plain tile.
function ItemThumb() {
  return (
    <span className="hc-muted grid h-20 w-20 shrink-0 place-items-center rounded-md border border-[var(--border)] bg-[var(--sunken)]">
      <Icon glyph="bag" size={32} />
    </span>
  );
}

function ToggleForm({ item }: { item: ShopItemRow }) {
  return (
    <form action={toggleShopItem}>
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="active" value={item.active ? "0" : "1"} />
      <ActionButton
        variant="outline"
        size="sm"
        icon={item.active ? "private" : "view"}
        pendingLabel={item.active ? "Hiding..." : "Showing..."}
      >
        {item.active ? "Hide" : "Show"}
      </ActionButton>
    </form>
  );
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; track?: string; q?: string; personalError?: string; shopError?: string }>;
}) {
  await requirePage("owner");
  const { page, track: rawTrack, q, personalError, shopError } = await searchParams;
  const tab = rawTrack === GENERAL || (TRACKS as readonly string[]).includes(rawTrack ?? "") ? (rawTrack as string) : "all";
  const query = (q ?? "").trim().toLowerCase();
  const [everyItem, personalItems] = await Promise.all([listShopItems(), listPersonalShopItems()]);
  let allItems = everyItem.filter((i) => (tab === "all" ? true : tab === GENERAL ? i.tracks.length === 0 : i.tracks.includes(tab)));
  if (query) {
    allItems = allItems.filter((i) => i.name.toLowerCase().includes(query) || i.description?.toLowerCase().includes(query));
  }
  const pages = Math.max(1, Math.ceil(allItems.length / PER));
  const cur = Math.min(Math.max(parseInt(page ?? "1", 10) || 1, 1), pages);
  const start = (cur - 1) * PER;
  const items = allItems.slice(start, start + PER);
  const stockByItem = await listShopOptionStock(items.map((i) => i.id));
  const qParam = q ? `&q=${encodeURIComponent(q)}` : "";
  const tabLabel = tab === "all" ? "the shop" : tab;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Shop"
        description="Items in the LOADOUT shop. Each has one base Ore price, the same everywhere, and names the tracks it relates to. Level discounts and Requisitions are rules, shown here only as notes."
        actions={
          <ButtonLink href="/shop-detail" variant="outline" size="sm" icon="list">
            Item details
          </ButtonLink>
        }
      />

      <Flash error={shopError} />

      <PersonalShopItems items={personalItems} error={personalError} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <LinkTabs
            active={tab}
            tabs={[
              { key: "all", href: `/shop${q ? `?q=${encodeURIComponent(q)}` : ""}`, label: "All" },
              ...[...TRACKS, GENERAL].map((t) => ({ key: t, href: `/shop?track=${t}${qParam}`, label: t })),
            ]}
          />
          <form className="flex items-center gap-2">
            {tab !== "all" && <input type="hidden" name="track" value={tab} />}
            <div className="relative w-64">
              <Icon
                glyph="search"
                size={20}
                className="hc-muted pointer-events-none absolute top-1/2 left-2 -translate-y-1/2"
              />
              <Input name="q" type="search" defaultValue={q ?? ""} placeholder="Search items..." className="hc-input-search" />
            </div>
            {q && (
              <ButtonLink href={tab === "all" ? "/shop" : `/shop?track=${tab}`} variant="ghost" size="sm">
                Clear
              </ButtonLink>
            )}
          </form>
        </div>

        <Card>
          <CardHeader title="Add an item" icon="plus" />
          <AddShopItemForm action={addShopItem} />
          <div className="mt-5">
            <Details summary="Bulk upload from CSV">
              <BulkUploadShopItemsForm />
            </Details>
          </div>
        </Card>

        <h2 className="hc-heading flex items-center gap-2 text-base">
          {allItems.length} item{allItems.length === 1 ? "" : "s"} in {tabLabel}
          {query && <Muted className="text-sm font-normal">matching &quot;{q}&quot;</Muted>}
        </h2>

        {allItems.length === 0 ? (
          <Card>
            <EmptyState title="Empty shelves" icon="bag">
              {query ? "Nothing matches that search." : "Add the first item above."}
            </EmptyState>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => {
              const stock = stockByItem.get(item.id) ?? [];
              return (
                <Card key={item.id} className={item.active ? "" : "opacity-60"}>
                  <div className="flex gap-4">
                    <ItemThumb />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="hc-heading text-lg">{item.name}</span>
                        <Badge tone="success">{item.price.toLocaleString("en-GB")} Ore</Badge>
                        <Badge outline>${(item.price * config.economy.oreValueUsd).toFixed(2)} budget</Badge>
                        <Badge>{SHOP_CATEGORY_LABELS[item.category] ?? SHOP_CATEGORY_LABELS.other}</Badge>
                        {item.tracks.length === 0 ? (
                          <Badge outline>{GENERAL}</Badge>
                        ) : (
                          item.tracks.map((t) => (
                            <Badge key={t} tone="info" outline>
                              {t}
                            </Badge>
                          ))
                        )}
                        {item.manual_locked && <Badge tone="warning">Locked</Badge>}
                        {!item.active && <Badge>Hidden</Badge>}
                      </div>
                      {item.description && <p className="hc-caption mt-1 text-sm">{item.description}</p>}
                      <p className="hc-caption mt-1 text-xs">{requisitionNote(item)}</p>
                      {item.lock_note && <p className="hc-caption mt-1 text-xs">{item.lock_note}</p>}
                      {item.options.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1.5">
                          {parseOptionGroups(item.options).map((g, gi) => (
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
                      {stock.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Muted className="text-xs font-bold">Stock:</Muted>
                          {stock.map((s) => (
                            <Badge key={s.choice} tone={s.remaining <= 0 ? "danger" : "neutral"}>
                              {s.choice} {s.remaining}/{s.total}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <ToggleForm item={item} />
                        <form action={deleteShopItem}>
                          <input type="hidden" name="id" value={item.id} />
                          <ActionButton
                            variant="danger"
                            size="sm"
                            icon="delete"
                            pendingLabel="Deleting..."
                            confirm={`Delete "${item.name}" from the shop? This can't be undone.`}
                          >
                            Delete
                          </ActionButton>
                        </form>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <Details summary="Edit item">
                      <EditItemForm item={item} />
                    </Details>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {allItems.length > PER && (
          <div className="flex flex-col gap-1">
            <Muted className="text-sm">
              Showing {start + 1}-{Math.min(start + PER, allItems.length)} of {allItems.length}
            </Muted>
            <Pagination
              page={cur}
              totalPages={pages}
              hrefFor={(p) => `/shop?${tab === "all" ? "" : `track=${tab}&`}page=${p}${qParam}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function EditItemForm({ item }: { item: ShopItemRow }) {
  return (
    <form action={updateShopItem} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={item.id} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8rem]">
        <Field label="Name">
          <Input name="name" required maxLength={60} defaultValue={item.name} />
        </Field>
        <Field label="Base price (Ore)" hint="The same everywhere">
          <Input name="price" type="number" min={0} required defaultValue={item.price} />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Category">
          <NativeSelect name="category" defaultValue={item.category}>
            {SHOP_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {SHOP_CATEGORY_LABELS[c]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="hc-label">
            Tracks
            <span className="hc-label-hint">None ticked means General.</span>
          </span>
          <div className="hc-panel grid grid-cols-2 gap-x-4 gap-y-2">
            {TRACKS.map((t) => (
              <Checkbox key={t} name="tracks" value={t} label={t} defaultChecked={item.tracks.includes(t)} />
            ))}
          </div>
        </div>
      </div>
      <Field label="Description">
        <Input name="description" maxLength={300} defaultValue={item.description} />
      </Field>
      <div className="flex flex-col gap-1.5">
        <span className="hc-label">Options</span>
        <OptionsEditor name="options" initial={item.options} />
      </div>
      <div className="hc-panel flex flex-col gap-3">
        <Checkbox
          name="manual_locked"
          value="1"
          defaultChecked={item.manual_locked}
          label={
            <>
              <strong>Locked</strong>: blocks purchase, for example until the builder reaches the level the item needs.
            </>
          }
        />
        <Field label="Lock note" hint="Shown to builders instead of the buy button">
          <Input name="lock_note" maxLength={300} defaultValue={item.lock_note} placeholder="e.g. needs Hardware level 8" />
        </Field>
      </div>
      <div>
        <ActionButton pendingLabel="Saving...">Save changes</ActionButton>
      </div>
    </form>
  );
}
