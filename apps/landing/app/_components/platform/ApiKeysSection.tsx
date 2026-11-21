"use client";

import { useCallback, useId, useState } from "react";
import { createKey, revokeKey, type KeyResult } from "@/app/(platform)/dashboard/(shell)/settings/actions";
import type { FormState } from "@/lib/platform/actions";
import { ConfirmDialog } from "./ConfirmDialog";
import "./settings-api.css";

export type KeyRowView = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  created: string;
  lastUsed: string;
  expires: string;
  state: "active" | "revoked" | "expired";
};

export type ScopeInfo = { scope: string; label: string; meaning: string };

const EXPIRY: { value: string; label: string }[] = [
  { value: "never", label: "Never" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
];

function RevokeLink({ row }: { row: KeyRowView }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const action = useCallback(async (_prev: FormState, formData: FormData): Promise<FormState> => {
    const done = await revokeKey(formData.get("id"));
    return done.ok ? { status: "saved", message: "Key revoked." } : { status: "error", message: done.message };
  }, []);
  return (
    <>
      <button type="button" className="sa-link sa-danger" onClick={() => setOpen(true)} aria-label={`Revoke the key ${row.name}`}>
        Revoke
      </button>
      <ConfirmDialog
        open={open}
        onClose={close}
        onDone={close}
        title="Revoke this key?"
        body={
          <p>
            <strong>{row.name}</strong> ({row.prefix}…) stops working straight away. Anything that uses it will get a 401 error. This cannot be undone, but you can make a new key.
          </p>
        }
        confirmLabel="Revoke key"
        action={action}
        fields={{ id: row.id }}
      />
    </>
  );
}

function Reveal({ plaintext, onDone }: { plaintext: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plaintext);
      setCopied(true);
    } catch {
      const field = document.getElementById("sa-reveal-key") as HTMLInputElement | null;
      field?.select();
      setCopied(false);
    }
  };
  return (
    <div className="sa-reveal" role="group" aria-labelledby="sa-reveal-title">
      <p className="sa-reveal-title" id="sa-reveal-title">Your new key</p>
      <input id="sa-reveal-key" className="sa-reveal-key" readOnly value={plaintext} onFocus={(event) => event.currentTarget.select()} aria-label="Your new API key" spellCheck={false} autoComplete="off" />
      <p className="sa-reveal-note">This is the only time the key is shown.</p>
      <div className="sa-row">
        <button type="button" className="sa-link" onClick={copy}>Copy</button>
        <span className="sa-status" role="status">{copied ? "Copied" : ""}</span>
        <button type="button" className="sa-link" onClick={onDone}>I have saved it</button>
      </div>
    </div>
  );
}

function CreateForm({ scopes, full, onCreated }: { scopes: ScopeInfo[]; full: boolean; onCreated: (plaintext: string) => void }) {
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [expiry, setExpiry] = useState("never");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const nameId = useId();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setMessage("");
    let result: KeyResult;
    try {
      result = await createKey({ name, scopes: picked, expiry });
    } catch {
      result = { ok: false, message: "Something went wrong. Try again." };
    }
    setPending(false);
    if (result.ok) {
      setName("");
      setPicked([]);
      setExpiry("never");
      onCreated(result.plaintext);
    } else {
      setMessage(result.message);
    }
  };

  return (
    <form className="sa-form" onSubmit={submit} noValidate>
      <h3 className="sa-sub">Create a key</h3>
      <div className="pf-field">
        <label htmlFor={nameId}>Name</label>
        <input id={nameId} className="pf-input" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="Laptop script" autoComplete="off" />
      </div>
      <fieldset className="sa-fieldset">
        <legend>What it can read</legend>
        {scopes.map((s) => (
          <label className="sa-check" key={s.scope}>
            <input
              type="checkbox"
              checked={picked.includes(s.scope)}
              onChange={(event) => setPicked((now) => (event.target.checked ? [...now, s.scope] : now.filter((x) => x !== s.scope)))}
            />
            <span><strong>{s.label}</strong> <span className="sa-meaning">{s.meaning}</span></span>
          </label>
        ))}
      </fieldset>
      <fieldset className="sa-fieldset sa-inline">
        <legend>Expires</legend>
        {EXPIRY.map((e) => (
          <label className="sa-radio" key={e.value}>
            <input type="radio" name="expiry" value={e.value} checked={expiry === e.value} onChange={() => setExpiry(e.value)} />
            <span>{e.label}</span>
          </label>
        ))}
      </fieldset>
      <div aria-live="polite">{message ? <p className="pf-error" role="alert">{message}</p> : null}</div>
      <div className="sa-row">
        <button type="submit" className="pf-btn pri" disabled={pending || full}>{pending ? "Creating" : "Create key"}</button>
        {full ? <span className="sa-status">You have five active keys. Revoke one to make another.</span> : null}
      </div>
    </form>
  );
}

export function ApiKeysSection({ keys, scopes, activeCount, max }: Readonly<{ keys: KeyRowView[]; scopes: ScopeInfo[]; activeCount: number; max: number }>) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const label = useCallback((scope: string) => scopes.find((s) => s.scope === scope)?.label ?? scope, [scopes]);
  return (
    <>
      <p className="pf-lead">Keys can only read. They can never change anything.</p>
      <p className="sa-limits">
        Up to {max} active keys. Each key gets 60 requests a minute and 5,000 a day. <a href="/api/v1/docs">Read the API docs</a>.
      </p>

      {revealed ? <Reveal plaintext={revealed} onDone={() => setRevealed(null)} /> : null}

      {keys.length === 0 ? (
        <p className="sa-empty">You have no keys yet.</p>
      ) : (
        <ul className="sa-keys" aria-label="Your API keys">
          {keys.map((k) => (
            <li key={k.id} className="sa-key" data-state={k.state}>
              <div className="sa-key-head">
                <span className="sa-key-name">{k.name}</span>
                <code className="sa-key-prefix">{k.prefix}…</code>
                {k.state !== "active" ? <span className="sa-key-tag">{k.state === "revoked" ? "Revoked" : "Expired"}</span> : null}
                {k.state === "active" ? <RevokeLink row={k} /> : null}
              </div>
              <p className="sa-key-scopes">{k.scopes.map(label).join(", ")}</p>
              <dl className="sa-key-dates">
                <div><dt>Created</dt><dd>{k.created}</dd></div>
                <div><dt>Last used</dt><dd>{k.lastUsed}</dd></div>
                <div><dt>Expires</dt><dd>{k.expires}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
      )}

      <CreateForm scopes={scopes} full={activeCount >= max} onCreated={setRevealed} />
    </>
  );
}
