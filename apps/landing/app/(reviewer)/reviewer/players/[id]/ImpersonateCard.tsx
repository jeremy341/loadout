import { impersonatePlayer } from "./impersonate";
import { REASON_MAX, REASON_MIN } from "@/lib/platform/audit";
import { ActionButton, Card, CardHeader, Field, Input } from "@/reviewer-dash/app/_ui/ui";

// "Act as this builder": opens the participant dashboard as them for an hour, with a bar that says so and ends it.
// The reason is required and kept on the Impersonation row and in the audit log. The server action re-checks who may do this.
export function ImpersonateCard({ playerId, name }: { playerId: string; name: string }) {
  return (
    <Card>
      <CardHeader title="Act as this builder" icon="view" />
      <p className="hc-caption mb-3 text-sm">
        Opens the participant dashboard as {name} for one hour, to see what they see. You stay signed in as yourself on this site, a
        bar on every dashboard page says who you are acting as, and the builder is shown nothing. Owners and admins can&apos;t be
        acted as, and neither can you.
      </p>
      <form action={impersonatePlayer} className="flex flex-col gap-3">
        <input type="hidden" name="playerId" value={playerId} />
        <Field label="Reason" hint={`${REASON_MIN} to ${REASON_MAX} characters. Kept with the audit event.`}>
          <Input name="reason" required minLength={REASON_MIN} maxLength={REASON_MAX} placeholder="Why you need to see their dashboard" />
        </Field>
        <div>
          <ActionButton variant="outline" size="sm" icon="view" pendingLabel="Opening..." confirm={`Act as ${name}? This is recorded in the audit log.`}>
            Act as this builder
          </ActionButton>
        </div>
      </form>
    </Card>
  );
}
