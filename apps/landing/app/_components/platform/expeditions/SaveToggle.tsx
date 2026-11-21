"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/platform/actions";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

// Save or Saved, as plain text. A save reserves no stock and locks no price. The result is announced under it.
export function SaveToggle({ itemId, saved, action }: Readonly<{ itemId: string; saved: boolean; action: Action }>) {
  const [state, run, pending] = useActionState<FormState, FormData>(action, { status: "idle" });
  const isSaved = state.status === "saved" ? state.message.startsWith("Saved") : saved;
  return (
    <form action={run} className="ol-save">
      <input type="hidden" name="itemId" value={itemId} />
      <button type="submit" className="ol-act" aria-pressed={isSaved} disabled={pending}>
        {isSaved ? "Saved" : "Save"}
      </button>
      <span className="ol-live" aria-live="polite">
        {state.status === "error" ? <span className="pf-error">{state.message}</span> : state.status === "saved" ? state.message : ""}
      </span>
    </form>
  );
}
