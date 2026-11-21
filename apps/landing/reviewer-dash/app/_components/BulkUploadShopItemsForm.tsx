"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Callout, Muted } from "@/reviewer-dash/app/_ui/ui";
import {
  checkShopItemsConflicts,
  commitShopItemsCsv,
  type ShopCsvRow,
} from "@/reviewer-dash/app/actions";

// Minimal RFC4180-ish CSV parser: handles quoted fields, "" escapes, and
// commas/newlines inside quotes. No multiline-within-quote support needed
// for a flat items sheet.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function toRows(csv: string[][]): ShopCsvRow[] {
  if (csv.length === 0) return [];
  const header = csv[0].map((h) => h.trim().toLowerCase());
  const idx = (...names: string[]) => names.map((n) => header.indexOf(n)).find((i) => i >= 0) ?? -1;
  const nameIdx = idx("name");
  const priceIdx = idx("price");
  const descIdx = idx("description", "desc");
  const optionsIdx = idx("options");
  if (nameIdx < 0) return [];
  return csv.slice(1).map((cells, i) => {
    return {
      key: `row-${i}`,
      name: (cells[nameIdx] ?? "").trim(),
      price: Number(cells[priceIdx] ?? 0) || 0,
      description: (cells[descIdx] ?? "").trim(),
      options: (cells[optionsIdx] ?? "").trim(),
    };
  }).filter((r) => r.name);
}

type ConflictMap = Record<string, { id: number; price: number; description: string }>;

export function BulkUploadShopItemsForm() {
  const [rows, setRows] = useState<ShopCsvRow[]>([]);
  const [conflicts, setConflicts] = useState<ConflictMap>({});
  const [resolutions, setResolutions] = useState<Record<string, "replace" | "skip">>({});
  const [result, setResult] = useState<{ added: number; replaced: number; skipped: number; errors: string[] } | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function reset() {
    setRows([]);
    setConflicts({});
    setResolutions({});
    setResult(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setError("");
    const text = await file.text();
    const parsed = toRows(parseCsv(text));
    if (parsed.length === 0) {
      setError('Couldn\'t find any rows with a "name" column. Check the header row.');
      setRows([]);
      return;
    }
    setRows(parsed);
    startTransition(async () => {
      try {
        const hits = await checkShopItemsConflicts(parsed);
        setConflicts(hits);
        const defaults: Record<string, "replace" | "skip"> = {};
        for (const key of Object.keys(hits)) defaults[key] = "skip";
        setResolutions(defaults);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to check for existing items.");
      }
    });
  }

  function onImport() {
    startTransition(async () => {
      try {
        const conflictIds = Object.fromEntries(
          Object.entries(conflicts).map(([k, v]) => [k, v.id]),
        );
        const summary = await commitShopItemsCsv(rows, conflictIds, resolutions);
        setResult(summary);
        setRows([]);
        setConflicts({});
        setResolutions({});
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Import failed.");
      }
    });
  }

  const conflictCount = Object.keys(conflicts).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onFile}
          disabled={pending}
          className="hc-file"
        />
        <Muted className="text-xs">
          Columns: name (required), price (Ore), description, options. Extra columns are ignored.
        </Muted>
      </div>

      {error && (
        <Callout tone="danger" icon="important">
          {error}
        </Callout>
      )}

      {result && (
        <Callout tone={result.errors.length > 0 ? "warning" : "success"} icon="checkmark">
          Added {result.added}, replaced {result.replaced}, skipped {result.skipped}.
          {result.errors.length > 0 && (
            <ul className="mt-1.5 list-inside list-disc">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </Callout>
      )}

      {rows.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="hc-caption text-sm">
            {rows.length} row{rows.length === 1 ? "" : "s"} parsed
            {conflictCount > 0 && (
              <>
                {" "}
                · <strong>{conflictCount}</strong> already exist{conflictCount === 1 ? "s" : ""}, choose replace or
                skip below
              </>
            )}
          </p>
          <div className="hc-table-wrap rounded-[var(--radius-lg)] border border-[var(--border)]">
            <table className="hc-table">
              <tbody>
                {rows.map((r) => {
                  const hit = conflicts[r.key];
                  return (
                    <tr key={r.key}>
                      <td className="min-w-0">
                        <span className="font-bold">{r.name}</span>{" "}
                        <Muted>
                          {r.price} Ore
                        </Muted>
                      </td>
                      <td className="text-right">
                        {hit ? (
                          <div className="inline-flex items-center gap-2">
                            <Badge tone="warning">exists · {hit.price} Ore</Badge>
                            <div className="hc-segmented w-40" role="group" aria-label={`Resolution for ${r.key}`}>
                              <button
                                type="button"
                                aria-pressed={resolutions[r.key] === "replace"}
                                className="hc-segmented-item"
                                onClick={() => setResolutions((r0) => ({ ...r0, [r.key]: "replace" }))}
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                aria-pressed={resolutions[r.key] !== "replace"}
                                className="hc-segmented-item"
                                onClick={() => setResolutions((r0) => ({ ...r0, [r.key]: "skip" }))}
                              >
                                Skip
                              </button>
                            </div>
                          </div>
                        ) : (
                          <Badge tone="success">new</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" disabled={pending} onClick={onImport} icon="cloud-upload">
              {pending ? "Importing..." : `Import ${rows.length} item${rows.length === 1 ? "" : "s"}`}
            </Button>
            <Button type="button" variant="outline" disabled={pending} onClick={reset}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
