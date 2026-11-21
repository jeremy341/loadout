"use client";

import { useState } from "react";
import { Button, Input, Muted } from "@/reviewer-dash/app/_ui/ui";
import { parseOptionGroups } from "@/reviewer-dash/lib/shopOptions";

type Row = { name: string; choices: string };

// Dynamic editor for shop-item option groups. Serializes to a hidden field as
// JSON ([{ name, choices: [] }]); the server (readOptions) encodes it back into
// the stored string[] format.
export function OptionsEditor({
  name = "options",
  initial = [],
}: {
  name?: string;
  initial?: string[];
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    parseOptionGroups(initial).map((g) => ({ name: g.name, choices: g.choices.join(", ") })),
  );

  const serialized = JSON.stringify(
    rows
      .map((r) => ({
        name: r.name.trim(),
        choices: r.choices
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }))
      .filter((g) => g.choices.length > 0),
  );

  const update = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const add = () => setRows((rs) => [...rs, { name: "", choices: "" }]);
  const remove = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={serialized} />
      {rows.length === 0 && (
        <Muted className="text-sm">No options yet. Add a group like Color, Storage or RAM.</Muted>
      )}
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            placeholder="Group (e.g. Color)"
            value={r.name}
            onChange={(e) => update(i, { name: e.target.value })}
            maxLength={40}
            className="w-40 shrink-0"
          />
          <Input
            placeholder="Choices, comma-separated (e.g. 256GB, 512GB, 1TB)"
            value={r.choices}
            onChange={(e) => update(i, { choices: e.target.value })}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon="delete"
            onClick={() => remove(i)}
            aria-label="Remove option group"
          />
        </div>
      ))}
      <div>
        <Button type="button" variant="outline" size="sm" icon="plus" onClick={add}>
          Add option group
        </Button>
      </div>
    </div>
  );
}
