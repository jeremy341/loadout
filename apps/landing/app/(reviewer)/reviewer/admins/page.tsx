import type { ReactNode } from "react";
import {
  requirePage,
  ownerSlackIds,
  secondPassSlackIds,
  reviewQueueScopeFor,
  REVIEW,
  NO_REVIEW,
  SECOND_PASS,
  EDIT_SUBMISSION,
  FRAUD_REVIEW,
} from "@/reviewer-dash/lib/guard";
import { listAdmins, listHelpers, listFulfillers } from "@/reviewer-dash/lib/db";
import {
  addReviewer,
  addFraudReviewer,
  removeFraudReviewer,
  addHelperAction,
  removeHelperAction,
  addFulfillerAction,
  removeFulfillerAction,
} from "@/reviewer-dash/app/actions";
import { TeamLog } from "@/reviewer-dash/app/_components/TeamLog";
import {
  ActionButton,
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  EmptyRow,
  Field,
  Input,
  Mono,
  Muted,
  PageHeader,
  Table,
  TextLink,
  type GlyphName,
} from "@/reviewer-dash/app/_ui/ui";

export const dynamic = "force-dynamic";

// The team page. Five roles exist (see lib/roles.ts):
// - Owners come from LOADOUT_OWNER_EMAILS only, so they're shown read-only here.
//   Nothing on this page (or anywhere on the site) can make an owner.
// - Reviewers, integrity reviewers (Pixl: fraud reviewers), ticket helpers and fulfillers are managed below.

function SlackIdForm({
  action,
  label,
  withName = false,
}: {
  action: (formData: FormData) => Promise<void>;
  label: string;
  withName?: boolean;
}) {
  return (
    <form action={action} className="flex flex-wrap items-end gap-2 p-4">
      {withName && <Input name="name" placeholder="Name (optional)" className="max-w-48" />}
      <Input name="slackId" required placeholder="Handle" className="hc-mono max-w-56" />
      <ActionButton icon="member-add" pendingLabel="Adding...">
        {label}
      </ActionButton>
    </form>
  );
}

function PeopleCard({
  title,
  icon,
  ids,
  add,
  addLabel,
  remove,
  note,
}: {
  title: string;
  icon: GlyphName;
  ids: string[];
  add: (formData: FormData) => Promise<void>;
  addLabel: string;
  remove: (formData: FormData) => Promise<void>;
  note?: ReactNode;
}) {
  return (
    <Card padding="flush">
      <CardHeader title={title} icon={icon} count={ids.length} />
      <SlackIdForm action={add} label={addLabel} />
      {note && <p className="hc-caption px-4 pb-4 text-sm">{note}</p>}
      <Table headers={["Handle", ""]}>
        {ids.map((id) => (
          <tr key={id}>
            <td className="font-bold">
              <Mono>{id}</Mono>
            </td>
            <td className="text-right">
              <form action={remove}>
                <input type="hidden" name="slackId" value={id} />
                <ActionButton variant="ghost" size="sm" pendingLabel="Removing..." confirm={`Remove ${id}?`}>
                  Remove
                </ActionButton>
              </form>
            </td>
          </tr>
        ))}
        {ids.length === 0 && <EmptyRow colSpan={2} title="Nobody yet" icon={icon} />}
      </Table>
    </Card>
  );
}

export default async function AdminsPage() {
  await requirePage("owner");
  const owners = ownerSlackIds();
  const secondPassIds = secondPassSlackIds();
  const [admins, helpers, fulfillers] = await Promise.all([listAdmins(), listHelpers(), listFulfillers()]);
  const reviewers = admins.filter(
    (a) => a.permissions.includes(REVIEW) && !a.permissions.includes(NO_REVIEW),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Team"
        description="Owners can do everything. Reviewers only work the review queue, helpers only work tickets, fulfillers only work the order queue. Every change here is written to the team log."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="flush">
          <CardHeader title="Owners" icon="admin-badge" count={owners.length} />
          <Table headers={["Owner"]}>
            {owners.map((id) => (
              <tr key={id}>
                <td className="font-bold">
                  <Mono>{id}</Mono>
                </td>
              </tr>
            ))}
            {owners.length === 0 && (
              <EmptyRow colSpan={1} title="Nobody is an owner" icon="admin-badge">
                No owner is set in the deployment settings.
              </EmptyRow>
            )}
          </Table>
          <p className="hc-caption p-4 text-sm">
            Owners come from the owner list in the deployment settings only. Change it there and redeploy; it
            can&apos;t be changed from this site or the database.
          </p>
        </Card>

        <Card padding="flush">
          <CardHeader
            title="Reviewers"
            icon="checkmark"
            count={reviewers.length}
            action={
              <ButtonLink href="/reviewers" variant="ghost" size="sm">
                Stats and settings
              </ButtonLink>
            }
          />
          <SlackIdForm action={addReviewer} label="Add reviewer" withName />
          <p className="hc-caption px-4 pb-4 text-sm">
            Final reviewer, queue scope (software or hardware), edit-submission access, prepared draft notes
            and removal are on each reviewer&apos;s page.
          </p>
          <Table headers={["Reviewer", "Handle", "Access", ""]}>
            {reviewers.map((r) => {
              const scope = reviewQueueScopeFor(r.permissions);
              const finalReviewer = r.permissions.includes(SECOND_PASS) || secondPassIds.includes(r.slack_id);
              const href = `/reviewers/${encodeURIComponent(r.slack_id)}`;
              return (
                <tr key={r.slack_id}>
                  <td>
                    <TextLink href={href} className="font-bold">
                      {r.name || r.slack_id}
                    </TextLink>
                  </td>
                  <td>
                    <Mono>{r.slack_id}</Mono>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {finalReviewer && <Badge tone="success">Final reviewer</Badge>}
                      {scope !== "both" && (
                        <Badge outline>
                          <span className="capitalize">{scope}</span> only
                        </Badge>
                      )}
                      {r.permissions.includes(EDIT_SUBMISSION) && <Badge outline>Edit submission</Badge>}
                      {!finalReviewer && scope === "both" && !r.permissions.includes(EDIT_SUBMISSION) && (
                        <Muted>-</Muted>
                      )}
                    </div>
                  </td>
                  <td className="text-right">
                    <ButtonLink href={href} variant="ghost" size="sm">
                      Manage
                    </ButtonLink>
                  </td>
                </tr>
              );
            })}
            {reviewers.length === 0 && <EmptyRow colSpan={4} title="No reviewers yet" icon="checkmark" />}
          </Table>
        </Card>

        <PeopleCard
          title="Integrity reviewers"
          icon="view"
          ids={admins.filter((a) => a.permissions.includes(FRAUD_REVIEW)).map((a) => a.slack_id)}
          add={addFraudReviewer}
          addLabel="Add integrity reviewer"
          remove={removeFraudReviewer}
          note="Sees the Integrity reviews tab (AI-use and double-dip flags) and nothing else. Final reviewers already see it."
        />

        <PeopleCard
          title="Helpers"
          icon="support-fill"
          ids={helpers.map((h) => h.slack_user_id)}
          add={addHelperAction}
          addLabel="Add helper"
          remove={removeHelperAction}
          note="Helpers answer tickets. Nothing else on this site opens for them."
        />

        <PeopleCard
          title="Fulfillers"
          icon="package-seam"
          ids={fulfillers.map((f) => f.slack_user_id)}
          add={addFulfillerAction}
          addLabel="Add fulfiller"
          remove={removeFulfillerAction}
        />
      </div>

      <Card>
        <CardHeader title="Reviewer pay" icon="purse-fill" />
        <p className="hc-caption mb-4 max-w-2xl text-sm">
          What a reviewer is paid for a review has not been decided by the owner. Every amount is Not set, nothing is
          paid, and no amount is shown to a reviewer.
        </p>
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pay per approval">
              <Input value="Not set" readOnly disabled />
            </Field>
            <Field label="Pay held for the first request for changes">
              <Input value="Not set" readOnly disabled />
            </Field>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Muted className="text-xs">Opens with the review service. Nothing here is saved.</Muted>
            <ActionButton icon="checkmark" disabled>
              Save reviewer pay
            </ActionButton>
          </div>
        </div>
      </Card>

      <TeamLog />
    </div>
  );
}
