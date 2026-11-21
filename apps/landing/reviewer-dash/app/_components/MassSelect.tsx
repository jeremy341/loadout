"use client";

// Native checkboxes for the players table's mass action form. RowSelect
// submits as userIds; SelectAllBox ticks every row on the current page.
// MassActionButton is the form's submit: it shows how many rows are ticked and says so in its confirm.

import { useEffect, useState } from "react";
import SubmitButton from "@/reviewer-dash/app/_ui/SubmitButton";
import { buttonClass, type ButtonVariant } from "@/reviewer-dash/app/_ui/ui";

const SYNC_EVENT = "mass-select-sync";

function checkedCount(): number {
  return document.querySelectorAll("input[data-row-select]:checked").length;
}

export function SelectAllBox() {
  return (
    <label className="hc-check">
      <input
        type="checkbox"
        aria-label="Select all on this page"
        onChange={(e) => {
          for (const el of document.querySelectorAll<HTMLInputElement>("input[data-row-select]")) {
            el.checked = e.currentTarget.checked;
          }
          // Setting .checked in code fires no change event, so tell the count.
          document.dispatchEvent(new Event(SYNC_EVENT));
        }}
      />
    </label>
  );
}

export function RowSelect({ id, label, name = "userIds" }: { id: string; label: string; name?: string }) {
  return (
    <label className="hc-check">
      <input type="checkbox" name={name} value={id} aria-label={label} data-row-select />
    </label>
  );
}

/** Submit for the mass-action form. Counts the ticked rows, names the count in its label and confirm, and stays off at zero. */
export function MassActionButton({
  noun = "builder",
  variant = "danger",
  pendingLabel = "Applying...",
}: {
  /** Singular noun for the rows, e.g. "builder". */
  noun?: string;
  variant?: ButtonVariant;
  pendingLabel?: string;
}) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const sync = () => setCount(checkedCount());
    sync();
    document.addEventListener("change", sync);
    document.addEventListener(SYNC_EVENT, sync);
    return () => {
      document.removeEventListener("change", sync);
      document.removeEventListener(SYNC_EVENT, sync);
    };
  }, []);
  const plural = count === 1 ? noun : `${noun}s`;
  return (
    <>
      <SubmitButton
        pendingLabel={pendingLabel}
        className={buttonClass(variant, "md")}
        disabled={count === 0}
        confirm={`Apply this action to ${count} selected ${plural}?`}
      >
        {count === 0 ? "Apply to selected" : `Apply to ${count} selected`}
      </SubmitButton>
      <span role="status" aria-live="polite" className="sr-only">
        {count} {plural} selected
      </span>
    </>
  );
}
