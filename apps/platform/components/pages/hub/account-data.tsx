"use client";

import { useId, useRef, useState } from "react";
import { Panel } from "../../ui/ui";
import { applyImportNow, exportPreviewDataNow, resetAllPreviewDataNow } from "./actions";
import { HUB_RULES, RESET_PHRASE } from "./data";
import { parseImport, type ImportResult } from "./logic/transfer";
import { formatDayUtc } from "./logic/text";
import { InlineConfirm, TextField } from "./shared";

// Data: export everything this preview holds as a JSON file, restore from such a file, reset it all, and what
// deleting an account will mean (not decided yet).

type Parsed = Extract<ImportResult, { ok: true }>;

export function DataTab({ announce }: { announce: (message: string) => void }) {
  return (
    <div className="pg-stack">
      <ExportPanel announce={announce} />
      <ImportPanel announce={announce} />
      <ResetPanel announce={announce} />
      <Panel title="Deleting your account">
        <p>
          Deleting an account, and what LOADOUT keeps afterwards, is <strong>to be defined</strong>. No retention or deletion policy has been decided, so none is
          described here and nothing in this preview deletes an account.
        </p>
        <p className="mut">The buttons on this tab only touch the sample data saved in this browser.</p>
      </Panel>
    </div>
  );
}

function ExportPanel({ announce }: { announce: (message: string) => void }) {
  const [result, setResult] = useState("");
  return (
    <Panel title="Export your preview data">
      <p>
        Download everything this preview has saved in this browser (projects, journals, wishlist, profile, Ore ledger and the rest) as one JSON file. It holds sample
        data only and is never sent anywhere.
      </p>
      <button
        type="button"
        className="btn btn-sm"
        onClick={() => {
          const out = exportPreviewDataNow();
          const text = `Exported ${out.count} saved ${out.count === 1 ? "item" : "items"} to ${out.filename} (${Math.max(1, Math.round(out.bytes / 1024))} KB).${out.skipped ? ` ${out.skipped} could not be read and were left out.` : ""}`;
          setResult(text);
          announce(text);
        }}
      >
        Export all preview data
      </button>
      {result ? <p className="mut hb-help">{result}</p> : null}
    </Panel>
  );
}

function ImportPanel({ announce }: { announce: (message: string) => void }) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  async function onFile(file: File | undefined) {
    setParsed(null);
    setError("");
    if (!file) return;
    setFileName(file.name);
    if (file.size > HUB_RULES.importMaxChars * 2) {
      setError("That file is too large to be a preview export.");
      announce("Import failed: that file is too large.");
      return;
    }
    let text = "";
    try {
      text = await file.text();
    } catch {
      setError("That file could not be read.");
      announce("Import failed: the file could not be read.");
      return;
    }
    const result = parseImport(text);
    if (!result.ok) {
      setError(result.error);
      announce(`Import failed: ${result.error}`);
      return;
    }
    setParsed(result);
    announce(`File checked: ${result.count} saved items found. Confirm to replace your data.`);
  }

  function clearFile() {
    if (fileRef.current) fileRef.current.value = "";
    setParsed(null);
    setFileName("");
  }

  return (
    <Panel title="Restore from a file">
      <p>Choose a file you exported earlier. It is checked before anything changes. Restoring replaces all preview data in this browser.</p>
      <div className="fld">
        <label className="fld-label" htmlFor={inputId}>
          Preview export file (.json)
        </label>
        <input id={inputId} ref={fileRef} type="file" accept="application/json,.json" onChange={(event) => void onFile(event.target.files?.[0])} />
      </div>
      {error ? (
        <p className="fld-error" role="alert">
          {error}
        </p>
      ) : null}
      {parsed ? (
        <div className="hb-import">
          <p>
            <strong>{fileName || "This file"}</strong> holds {parsed.count} saved {parsed.count === 1 ? "item" : "items"}
            {parsed.exportedAt ? <> exported {formatDayUtc(parsed.exportedAt)} (UTC)</> : null}. Areas: {parsed.areas.join(", ")}.
          </p>
          <InlineConfirm
            message="Replace everything in this browser's preview with this file? Your current preview data will be lost."
            confirmLabel="Yes, replace my data"
            cancelLabel="Cancel"
            onConfirm={() => {
              applyImportNow(parsed);
              announce(`Restored ${parsed.count} saved items from the file.`);
              clearFile();
              fileRef.current?.focus();
            }}
            onCancel={() => {
              clearFile();
              announce("Restore cancelled. Nothing changed.");
              fileRef.current?.focus();
            }}
          />
        </div>
      ) : null}
    </Panel>
  );
}

function ResetPanel({ announce }: { announce: (message: string) => void }) {
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState("");
  const ready = typed === RESET_PHRASE;
  return (
    <Panel title="Reset all preview data">
      <p>
        This removes everything saved by every tab in this browser: projects, journals, reviews, wishlist, orders, Ore ledger, notifications, profile and the rest.
        Each tab goes back to its starting sample data. It cannot be undone, so export first if you want a copy.
      </p>
      <TextField label={`Type ${RESET_PHRASE} to confirm`} value={typed} onChange={setTyped} hint={`Capital letters, exactly ${RESET_PHRASE}.`} autoComplete="off" />
      <div className="pg-actions">
        <button
          type="button"
          className="btn btn-danger btn-sm"
          disabled={!ready}
          onClick={() => {
            resetAllPreviewDataNow();
            setTyped("");
            const text = "All preview data was reset. Every tab now shows its starting sample data.";
            setDone(text);
            announce(text);
          }}
        >
          Reset all preview data
        </button>
      </div>
      {done ? <p className="hb-help">{done}</p> : null}
    </Panel>
  );
}
