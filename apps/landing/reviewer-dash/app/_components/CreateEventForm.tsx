"use client";

import { useState } from "react";
import { ActionButton, Field, Input, NativeSelect } from "@/reviewer-dash/app/_ui/ui";

// Adjusted from Pixl's form: only Show and Tell exists on the participant side, so the type list is that one type and there are no
// reward, bonus or shop-item settings. The type select stays so a second type can be added the way Pixl's list grows.
export function CreateEventForm({ action, types }: { action: (fd: FormData) => void; types: Record<string, string> }) {
  const keys = Object.keys(types);
  const [type, setType] = useState(keys[0]);

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Event type">
          <NativeSelect name="type" value={type} onChange={(e) => setType(e.target.value)}>
            {keys.map((k) => (
              <option key={k} value={k}>
                {types[k]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Name (builders see this)">
          <Input name="name" required maxLength={100} placeholder="Show and Tell 5: Things with wheels" />
        </Field>
        <Field label="Starts (UTC)" hint="Blank means now.">
          <Input name="startsAt" type="datetime-local" />
        </Field>
        <Field label="Ends (UTC)">
          <Input name="endsAt" type="datetime-local" required />
        </Field>
      </div>
      <Field label="Note" hint="Optional. One line on the theme or the format. No Ore or Track XP is attached to an event.">
        <Input name="note" maxLength={500} placeholder="Short demos, five minutes each." />
      </Field>
      <div>
        <ActionButton icon="plus" pendingLabel="Creating...">
          Create event
        </ActionButton>
      </div>
    </form>
  );
}
