import {
  createPersonalShopItem,
  setPersonalShopItemActive,
  deletePersonalShopItem,
} from "@/reviewer-dash/app/actions";
import type { PersonalShopItem } from "@/reviewer-dash/lib/db";
import {
  ActionButton,
  Badge,
  Callout,
  Card,
  CardHeader,
  Checkbox,
  Details,
  EmptyRow,
  Field,
  Icon,
  Input,
  Mono,
  Muted,
  Table,
  Textarea,
} from "@/reviewer-dash/app/_ui/ui";

function StatusBadge({ item }: { item: PersonalShopItem }) {
  if (item.purchase) return <Badge tone="info">Bought, order #{item.purchase.order_id} ({item.purchase.status})</Badge>;
  return item.active ? <Badge tone="success">Live in their shop</Badge> : <Badge>Hidden</Badge>;
}

// Items made for one specific builder: they only ever appear in that builder's
// own shop, can be bought once, and stay hidden until activated.
export function PersonalShopItems({ items, error }: { items: PersonalShopItem[]; error?: string }) {
  return (
    <Card padding="flush">
      <CardHeader title="Personal items" icon="person" count={items.length} />
      <div className="flex flex-col gap-4 px-4 py-4">
        <p className="hc-caption max-w-3xl text-sm">
          An item made for one builder, for an item that is not in the catalogue. It shows up in their normal shop once
          you activate it, they can buy it once, and it leaves their shop after. It is priced in Ore like any other
          item. Nobody else ever sees it and nothing is announced.
        </p>

        {error && (
          <Callout tone="danger" icon="important">
            {error}
          </Callout>
        )}

        <Details summary="Create a personal item">
          <form action={createPersonalShopItem} className="grid max-w-xl gap-3">
            <Field label="Builder">
              <Input name="builder" required placeholder="Builder handle" />
            </Field>
            <Field label="Item name">
              <Input name="name" required maxLength={60} />
            </Field>
            <Field label="Description">
              <Textarea name="description" rows={3} maxLength={300} />
            </Field>
            <Field label="Price (Ore)">
              <Input name="price" type="number" min={1} step={1} required className="w-40" />
            </Field>
            <Field label="Options" hint="Optional. Same format as the other items: a name, a colon, then comma-separated choices.">
              <Input name="options" placeholder="Color: Black, White" />
            </Field>
                        <Checkbox
              name="activate"
              value="1"
              label="Activate right away (otherwise it stays hidden until you press Activate)"
            />
            <div>
              <ActionButton pendingLabel="Creating..." icon="plus">
                Create item
              </ActionButton>
            </div>
          </form>
        </Details>
      </div>

      <Table headers={["Item", "For", "Status", ""]}>
        {items.length === 0 && <EmptyRow colSpan={4} title="No personal items yet" icon="bag" />}
        {items.map((item) => (
          <tr key={item.id} className={item.active || item.purchase ? "" : "opacity-70"}>
            <td>
              <div className="flex items-center gap-3">
                <span className="hc-muted grid h-10 w-10 shrink-0 place-items-center rounded-md border border-[var(--border)]">
                  <Icon glyph="bag" size={22} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{item.name}</span>
                    <Badge tone="success">{item.price} Ore</Badge>
                  </div>
                  {item.description && <Muted className="text-xs">{item.description}</Muted>}
                </div>
              </div>
            </td>
            <td>
              {item.owner?.display_name ?? <Muted>Unknown builder</Muted>}
              {item.owner?.slack_id && (
                <div>
                  <Mono>{item.owner.slack_id}</Mono>
                </div>
              )}
            </td>
            <td>
              <StatusBadge item={item} />
            </td>
            <td className="text-right">
              {!item.purchase && (
                <div className="inline-flex items-center gap-2">
                  <form action={setPersonalShopItemActive}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="active" value={item.active ? "0" : "1"} />
                    <ActionButton variant="outline" size="sm" pendingLabel={item.active ? "Hiding..." : "Activating..."}>
                      {item.active ? "Hide" : "Activate"}
                    </ActionButton>
                  </form>
                  <form action={deletePersonalShopItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <ActionButton variant="danger" size="sm" pendingLabel="Deleting..." confirm={`Delete "${item.name}"?`}>
                      Delete
                    </ActionButton>
                  </form>
                </div>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}
