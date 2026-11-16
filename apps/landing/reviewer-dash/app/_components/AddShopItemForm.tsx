"use client";

import { useState } from "react";
import { OptionsEditor } from "@/reviewer-dash/app/_components/OptionsEditor";
import { ActionButton, Badge, Card, Checkbox, Field, Icon, Input, Muted, NativeSelect } from "@/reviewer-dash/app/_ui/ui";
import { SHOP_CATEGORIES, SHOP_CATEGORY_LABELS } from "@/reviewer-dash/lib/shopCategories";
import { TRACKS } from "@/lib/platform/progress";
import { config } from "@/reviewer-dash/app/_generated/config";

// Adjusted from Pixl's form: one Ore price for every builder (no regions, no price-changing options, no image), a category from
// LOADOUT's item kinds and the tracks the item relates to.
export function AddShopItemForm({ action }: { action: (fd: FormData) => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [tracks, setTracks] = useState<string[]>([]);

  const toggle = (track: string) => setTracks((prev) => (prev.includes(track) ? prev.filter((x) => x !== track) : [...prev, track]));
  const ore = Number(price) || 0;

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <div className="flex min-w-0 flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
          <Field label="Name">
            <Input
              name="name"
              required
              maxLength={60}
              placeholder="Digital calipers"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Base price (Ore)" hint={`The same everywhere. About $${(ore * config.economy.oreValueUsd).toFixed(2)} budget.`}>
            <Input
              name="price"
              type="number"
              min={0}
              required
              placeholder="50"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <NativeSelect name="category" defaultValue="other">
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
                <Checkbox key={t} name="tracks" value={t} label={t} checked={tracks.includes(t)} onChange={() => toggle(t)} />
              ))}
            </div>
          </div>
        </div>

        <Field label="Description">
          <Input
            name="description"
            maxLength={300}
            placeholder="Measure a part to a fraction of a millimetre."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <span className="hc-label">
            Options
            <span className="hc-label-hint">Optional. Groups like Layout or Switch, each with comma-separated choices. Options never change the price.</span>
          </span>
          <OptionsEditor name="options" />
        </div>

        <Muted className="text-xs">
          Level discounts and Requisitions are worked out from the price and the tracks. They are not set per item.
        </Muted>

        <div>
          <ActionButton pendingLabel="Adding..." icon="plus">
            Add item
          </ActionButton>
        </div>
      </div>

      {/* Live preview: roughly what the card looks like in the shop. */}
      <div className="self-start lg:sticky lg:top-20">
        <div className="hc-eyebrow mb-2">Preview</div>
        <Card padding="compact" sunken>
          <div className="mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)]">
            <Icon glyph="photo" size={40} className="hc-muted" />
          </div>
          <div className="truncate text-sm font-bold">{name || "Item name"}</div>
          <p className="hc-caption mt-0.5 line-clamp-2 min-h-8 text-xs">{description || "Description shows up here."}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge tone="success">{ore.toLocaleString("en-GB")} Ore</Badge>
            {tracks.length === 0 ? <Badge outline>General</Badge> : tracks.map((t) => <Badge key={t} outline>{t}</Badge>)}
          </div>
        </Card>
      </div>
    </form>
  );
}
