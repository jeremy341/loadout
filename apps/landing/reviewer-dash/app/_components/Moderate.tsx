"use client";

import {
  banIdea,
  deletePlayerAccount,
  liftBan,
  proposeBan,
  sendNotification,
  unbanIdea,
  updatePlayerInfo,
  warnPlayer,
} from "@/reviewer-dash/app/actions";
import { ActionButton, Field, Input, NativeSelect } from "@/reviewer-dash/app/_ui/ui";

// Builder and idea moderation forms, shared by the builder (/players), violations, bans,
// reports and ideas pages. A ban is only ever proposed here; a different owner confirms it on Bans.

export function WarnForm({ userId, compact = false }: { userId: string; compact?: boolean }) {
  return (
    <form action={warnPlayer} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      {!compact && <Input name="message" placeholder="Note to the builder (optional)" className="min-w-0 flex-1" />}
      <ActionButton variant="outline" size="sm" icon="important" pendingLabel="Warning...">
        Warn
      </ActionButton>
    </form>
  );
}

export function BanForm({
  userId,
  compact = false,
  isBanned = false,
  isProposed = false,
}: {
  userId: string;
  compact?: boolean;
  isBanned?: boolean;
  isProposed?: boolean;
}) {
  const blocked = isBanned || isProposed;
  return (
    <form action={proposeBan} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <Input
        name="reason"
        placeholder="Reason"
        maxLength={1000}
        className={compact ? "w-32" : "min-w-32 flex-1"}
        required
        disabled={blocked}
      />
      <NativeSelect name="days" defaultValue="7" disabled={blocked} className="w-auto" aria-label="Ban length">
        <option value="1">1 day</option>
        <option value="7">7 days</option>
        <option value="30">30 days</option>
        <option value="0">Permanent</option>
      </NativeSelect>
      <ActionButton variant="danger" size="sm" icon="private" pendingLabel="Proposing..." disabled={blocked}>
        {isBanned ? "Already banned" : isProposed ? "Ban proposed" : "Propose ban"}
      </ActionButton>
    </form>
  );
}

export function NotifyForm({ userId }: { userId: string }) {
  return (
    <form action={sendNotification} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <Input name="title" placeholder="Title" maxLength={100} className="w-40" required />
      <Input name="body" placeholder="Message" maxLength={500} className="min-w-40 flex-1" required />
      <ActionButton variant="outline" size="sm" icon="send" pendingLabel="Sending...">
        Notify
      </ActionButton>
    </form>
  );
}

export function LiftBanForm({ userId }: { userId: string }) {
  return (
    <form action={liftBan}>
      <input type="hidden" name="userId" value={userId} />
      <ActionButton variant="success" size="sm" pendingLabel="Lifting...">
        Lift ban
      </ActionButton>
    </form>
  );
}

export function IdeaBanForm({ ideaId }: { ideaId: number }) {
  return (
    <form action={banIdea} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="ideaId" value={ideaId} />
      <input type="hidden" name="returnTo" value="/ideas" />
      <Input name="reason" placeholder="Reason" maxLength={1000} className="w-40" required />
      <ActionButton variant="danger" size="sm" pendingLabel="Removing...">
        Remove
      </ActionButton>
    </form>
  );
}

export function IdeaUnbanForm({ ideaId }: { ideaId: number }) {
  return (
    <form action={unbanIdea}>
      <input type="hidden" name="ideaId" value={ideaId} />
      <ActionButton variant="success" size="sm" pendingLabel="Restoring...">
        Restore
      </ActionButton>
    </form>
  );
}

export function EditInfoForm({
  userId,
  displayName,
  email,
}: {
  userId: string;
  displayName: string;
  email: string;
}) {
  return (
    <form action={updatePlayerInfo} className="flex flex-col gap-4">
      <input type="hidden" name="userId" value={userId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Display name">
          <Input name="displayName" defaultValue={displayName} maxLength={60} required />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" defaultValue={email} maxLength={200} />
        </Field>
      </div>
      <div>
        <ActionButton size="sm" pendingLabel="Saving...">
          Save info
        </ActionButton>
      </div>
    </form>
  );
}

// Owners only. A full erasure (lib/erasure.ts): the account, everything tied
// to it, and the copies the cascade misses are gone for good once this submits.
export function DeleteAccountForm({ userId }: { userId: string }) {
  return (
    <form action={deletePlayerAccount} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <Input
        name="reason"
        placeholder="Reason, e.g. data removal request (they are told first)"
        maxLength={1000}
        className="min-w-48 flex-1"
        required
      />
      <ActionButton
        variant="danger"
        size="sm"
        icon="delete"
        pendingLabel="Erasing..."
        confirm="Erase this builder's account and all their data? This can't be undone. Projects, journals, orders, Ore, notifications and tickets all go."
      >
        Erase all data
      </ActionButton>
    </form>
  );
}
