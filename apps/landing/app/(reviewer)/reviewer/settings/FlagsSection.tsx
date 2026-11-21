"use client";

import { useActionState, useState } from "react";
import { setFlagState, type FormState } from "@/lib/platform/actions";
import { REASON_MAX, REASON_MIN } from "@/lib/platform/audit";
import { Badge, buttonClass, Card, Input, Mono } from "@/reviewer-dash/app/_ui/ui";
import type { FlagRow } from "./flag-rows";

// The Flags section of the settings page: every feature flag with its state, and a switch for owners. The write is the existing
// setFlagState server action (lib/platform/actions.ts): owner-only on the server whatever this page shows, a written reason of
// REASON_MIN+ characters, the change and its AuditEvent ("flag.set", with before and after) in one transaction, and then the
// flag cache forgotten (forgetFlag) so the next read in this process sees the new value. This component only collects the reason
// and shows the result. Stasis has no flag UI to port (its settings are edited in the database); the shape is LOADOUT's.
function FlagCard({ flag }: { flag: FlagRow }) {
  const [enabled, setEnabled] = useState(flag.enabled);
  const [state, formAction, pending] = useActionState(
    async (previous: FormState, formData: FormData): Promise<FormState> => {
      const result = await setFlagState(previous, formData);
      if (result.status === "saved") setEnabled(formData.get("target") === "on");
      return result;
    },
    { status: "idle" } as FormState,
  );

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="hc-heading text-base">
            <Mono>{flag.name}</Mono>
          </h3>
          <p className="hc-caption text-sm">{flag.description}</p>
        </div>
        <Badge tone={enabled ? "success" : "neutral"}>{enabled ? "On" : "Off"}</Badge>
      </div>
      <p className="hc-caption mt-1 text-xs">
        {flag.updatedAt ? `Last changed ${new Date(flag.updatedAt).toLocaleString()}` : "Never changed (off by default)"}
      </p>
      {flag.known ? (
        <form action={formAction} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="name" value={flag.name} />
          <input type="hidden" name="target" value={enabled ? "off" : "on"} />
          <label className="hc-label min-w-48 flex-1">
            Reason
            <Input name="reason" required minLength={REASON_MIN} maxLength={REASON_MAX} placeholder={`${REASON_MIN}+ characters, kept in the audit log`} />
          </label>
          <button type="submit" className={buttonClass(enabled ? "outline" : "primary", "sm")} disabled={pending} aria-busy={pending}>
            {pending ? "Saving..." : enabled ? "Turn off" : "Turn on"}
          </button>
        </form>
      ) : (
        <p className="hc-caption mt-3 text-sm">This flag is no longer in the code, so it can&apos;t be changed here.</p>
      )}
      {state.status === "error" && (
        <p className="mt-2 text-sm" role="alert" style={{ color: "var(--danger, #b3261e)" }}>
          {state.message}
        </p>
      )}
      {state.status === "saved" && (
        <p className="hc-caption mt-2 text-sm" role="status">
          {state.message}
        </p>
      )}
    </Card>
  );
}

export default function FlagsSection({ flags }: { flags: FlagRow[] }) {
  return (
    <>
      <Card>
        <h2 className="hc-heading text-base">Feature flags</h2>
        <p className="hc-caption mt-1 text-sm">
          Switches for features that are built but not open yet. Only owners can change one, a reason is required, and every change
          is written to the audit log with the old and new value. A change reaches this server at once and other servers within 30
          seconds.
        </p>
      </Card>
      {flags.map((flag) => (
        <FlagCard key={flag.name} flag={flag} />
      ))}
    </>
  );
}
