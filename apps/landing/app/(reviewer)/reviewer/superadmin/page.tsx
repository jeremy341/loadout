import { notFound } from "next/navigation";
import { requireAccess } from "@/lib/platform/session";
import { ActionButton, Card, CardHeader, DescriptionList, Field, Flash, Input, Mono, PageHeader } from "@/reviewer-dash/app/_ui/ui";
import { grantSuperadmin } from "./actions";
import { bootstrapSecret, mayBootstrap } from "./bootstrap";

export const dynamic = "force-dynamic";

export const metadata = { title: "Superadmin" };

// Stasis's /superadmin (references/stasis @ 7a230ced9ad793f0ad4cda30a7d71c02a58da6b6, app/superadmin/page.tsx): one button that
// grants the signed-in person the admin marker. Stasis shows the page to anyone and lets the API say no; here the page itself is
// a 404 until LOADOUT_SUPERADMIN_BOOTSTRAP_SECRET is set (nothing to find while the switch is off), and the page shows who is
// signed in so the person can see which account the grant lands on. The grant is for existing staff: the reviewer site answers
// 404 to a person with no role before this page is reached.
export default async function SuperadminPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  if (!bootstrapSecret()) notFound();
  const viewer = await requireAccess("reviewer");
  // The shared secret alone is not enough: only an owner or someone who already holds the admin marker may open the page.
  if (!mayBootstrap({ isOwner: viewer.access.isOwner, roles: viewer.roles })) notFound();
  const { ok, error } = await searchParams;
  const isAdmin = viewer.roles.includes("admin");

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <PageHeader title="Superadmin" description="Grant yourself the admin marker, which opens impersonation. It adds no other access." />
      <Flash error={error} ok={ok} />
      <Card>
        <CardHeader title="Signed in as" icon="person-card" />
        <DescriptionList
          items={[
            ["Name", viewer.displayName],
            ["Email", <Mono key="email">{viewer.email}</Mono>],
            ["Admin marker", isAdmin ? "Granted" : "Not granted"],
          ]}
        />
      </Card>
      <Card>
        <CardHeader title="Grant admin access" icon="admin-badge" />
        <form action={grantSuperadmin} className="flex flex-col gap-3">
          <Field label="Bootstrap secret" hint="Held by whoever runs the deployment. Every attempt is recorded.">
            <Input name="secret" type="password" required autoComplete="off" />
          </Field>
          <div>
            <ActionButton icon="admin-badge" pendingLabel="Granting...">
              Grant admin access
            </ActionButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
