"use client";

import { useRouter } from "next/navigation";

export type LedgerKindOption = { value: string; label: string };

// The one filter of the Ledger: a plain select that keeps the ?kind= address. It also works without scripts: the form is a GET
// and its Show button is only rendered when scripts are off.
export function LedgerKindSelect({ value, options }: Readonly<{ value: string; options: LedgerKindOption[] }>) {
  const router = useRouter();
  return (
    <form className="pf-ledger-filter" method="get" action="/dashboard/ledger">
      <label htmlFor="ledger-kind">Show</label>
      <select
        id="ledger-kind"
        name="kind"
        className="pf-input"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          router.push(next ? `/dashboard/ledger?kind=${encodeURIComponent(next)}` : "/dashboard/ledger");
        }}
      >
        <option value="">All entries</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="pf-btn">Show</button>
      </noscript>
    </form>
  );
}
