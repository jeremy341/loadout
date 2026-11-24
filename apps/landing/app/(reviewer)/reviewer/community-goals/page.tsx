import { requirePage } from "@/reviewer-dash/lib/guard";
import { listVaultLevels, type VaultLevelRow } from "@/reviewer-dash/lib/db";
import { addVaultLevel, updateVaultLevel, toggleVaultLevel, closeVaultLevel, deleteVaultLevel } from "@/reviewer-dash/app/actions";
import {
  ActionButton,
  Badge,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Flash,
  Input,
  Muted,
  PageHeader,
  Textarea,
  formatDate,
} from "@/reviewer-dash/app/_ui/ui";

export const dynamic = "force-dynamic";

// Round-trips through parseRewards in app/actions-content.ts: one reward per line.
function rewardsText(level: VaultLevelRow): string {
  return (level.rewards ?? []).map((r) => r.label ?? "").filter(Boolean).join("\n");
}

const REWARDS_HINT = "One per line. Rewards marked proposed in the plan stay labelled proposed.";

export default async function CommunityGoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  await requirePage("owner");
  const { error, saved } = await searchParams;
  const levels = await listVaultLevels();
  // The Era in progress: the first active one that has not been closed.
  const openId = levels.find((l) => l.active && !l.unlocked_at)?.id ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Community Goals"
        count={levels.length}
        description="The Eras. A project adds Era Points equal to its approved hours at final approval, and they count toward the current Era only. When the threshold is met and the Era has been open 14 days, it is ready to advance and the owner confirms. Era Points are not Ore, and nothing here is spent."
      />
      <Flash error={error} ok={saved ? "Saved." : null} />

      <Card>
        <CardHeader title="Add an Era" icon="plus" />
        <form action={addVaultLevel} className="flex flex-col gap-3">
          <LevelFields />
          <div>
            <ActionButton pendingLabel="Adding...">Add Era</ActionButton>
          </div>
        </form>
      </Card>

      <div className="flex flex-col gap-4">
        {levels.map((l) => (
          <Card key={l.id} className={l.active ? "" : "opacity-60"}>
            <form action={updateVaultLevel} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={l.id} />
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info">Era {l.level}</Badge>
                <span className="font-bold">{l.title}</span>
                <Badge tone="warning" icon="bolt-circle">
                  {l.energy_required.toLocaleString("en-GB")} approved hours
                </Badge>
                {!l.active && <Badge tone="neutral">hidden</Badge>}
                {l.unlocked_at && <Badge tone="success">closed</Badge>}
                <div className="ml-auto">
                  <ActionButton variant="outline" size="sm" pendingLabel="Saving...">
                    Save
                  </ActionButton>
                </div>
              </div>
              <LevelFields level={l} />
              {l.unlocked_at && (
                <Muted className="text-xs">Era closed {formatDate(l.unlocked_at)}. Editing the numbers above does not reopen it.</Muted>
              )}
            </form>
            <div className="mt-4 flex items-center gap-2 border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <form action={toggleVaultLevel}>
                <input type="hidden" name="id" value={l.id} />
                <input type="hidden" name="active" value={l.active ? "0" : "1"} />
                <ActionButton
                  variant="outline"
                  size="sm"
                  icon={l.active ? "view-hide" : "view"}
                  pendingLabel={l.active ? "Hiding..." : "Showing..."}
                >
                  {l.active ? "Hide" : "Show"}
                </ActionButton>
              </form>
              {l.id === openId && (
                <form action={closeVaultLevel}>
                  <input type="hidden" name="id" value={l.id} />
                  <ActionButton
                    variant="outline"
                    size="sm"
                    icon="trophy"
                    pendingLabel="Closing..."
                    confirm={`Close "${l.title}" now? The Era ends, its rewards apply and the next Era begins. This can't be undone.`}
                  >
                    Close Era
                  </ActionButton>
                </form>
              )}
              <form action={deleteVaultLevel}>
                <input type="hidden" name="id" value={l.id} />
                <ActionButton
                  variant="danger"
                  size="sm"
                  icon="delete"
                  pendingLabel="Deleting..."
                  confirm={`Delete Era ${l.level} "${l.title}"? This can't be undone.`}
                >
                  Delete
                </ActionButton>
              </form>
            </div>
          </Card>
        ))}
        {levels.length === 0 && (
          <Card>
            <EmptyState title="No Eras yet" icon="trophy">
              Add the first Era above.
            </EmptyState>
          </Card>
        )}
      </div>
    </div>
  );
}

// Shared by the add and edit forms; the field names are what the actions read.
function LevelFields({ level: l }: { level?: VaultLevelRow }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Field label="Era #">
          <Input name="level" type="number" min={l ? undefined : 1} required={!l} defaultValue={l?.level} placeholder="6" />
        </Field>
        <Field label="Approved hours needed">
          <Input
            name="energy_required"
            type="number"
            min={l ? undefined : 0}
            required={!l}
            defaultValue={l?.energy_required}
            placeholder="6500"
          />
        </Field>
        <Field label="Name" className="sm:col-span-2">
          <Input name="title" required={!l} maxLength={80} defaultValue={l?.title} placeholder="Automation" />
        </Field>
      </div>
      <Field label="Description (builders see this)">
        <Input
          name="blurb"
          maxLength={400}
          defaultValue={l?.blurb}
          placeholder="What the community is working toward in this Era."
        />
      </Field>
      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[1fr_auto]">
        <Field label="Rewards" hint={REWARDS_HINT}>
          <Textarea name="rewards" rows={3} defaultValue={l ? rewardsText(l) : undefined} />
        </Field>
        <Field label="Sort position">
          <Input name="position" type="number" defaultValue={l?.position} placeholder="6" className="sm:w-28" />
        </Field>
      </div>
    </>
  );
}
