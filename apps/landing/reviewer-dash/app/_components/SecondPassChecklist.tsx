"use client";

import { useRef } from "react";
import { updateSecondPassChecklist } from "@/reviewer-dash/app/actions";

const ITEMS = [
  { field: "second_pass_telescreen_checked", label: "Checked the tracked time (Hackatime or Lapse)" },
  { field: "second_pass_hours_deflated", label: "Hours lowered (if needed)" },
  { field: "second_pass_heartbeats_added", label: "Evidence added to the justification" },
] as const;

export function SecondPassChecklist({
  projectId,
  values,
}: {
  projectId: number;
  values: { second_pass_telescreen_checked: boolean; second_pass_hours_deflated: boolean; second_pass_heartbeats_added: boolean };
}) {
  return (
    <div className="flex flex-col gap-2">
      {ITEMS.map((item) => (
        <ChecklistRow
          key={item.field}
          projectId={projectId}
          field={item.field}
          label={item.label}
          checked={values[item.field]}
        />
      ))}
    </div>
  );
}

// Each tick submits on its own; the page revalidates with the saved value.
function ChecklistRow({
  projectId,
  field,
  label,
  checked,
}: {
  projectId: number;
  field: string;
  label: string;
  checked: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={updateSecondPassChecklist}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="checked" value={(!checked).toString()} />
      <label className="hc-check">
        <input type="checkbox" checked={checked} onChange={() => formRef.current?.requestSubmit()} />
        <span>{label}</span>
      </label>
    </form>
  );
}
