import { requirePage } from "@/reviewer-dash/lib/guard";
import { shipById } from "@/lib/platform/review";
import { MIN_JUSTIFICATION } from "@/lib/reviewer/desk/records-age";
import { AGE_EXCEPTIONS } from "@/lib/reviewer/desk/records-fixtures";
import { Button, Card, CardHeader, EmptyState, Mono, PageHeader, TextLink, Table } from "@/reviewer-dash/app/_ui/ui";

export const metadata = { title: "Age exceptions" };
export const dynamic = "force-dynamic";

// Age exceptions, owner only: the list with a justification for each. LOADOUT is for ages 13 to 18. Adding one is a stub: the control
// is laid out and disabled.
export default async function ReviewAgeExceptionsPage() {
  await requirePage("owner");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Age exceptions" description="Builders kept in the program outside ages 13 to 18, and why. Every exception needs a reason." />
      <Card padding="flush">
        <CardHeader title="Age exceptions" icon="important" count={AGE_EXCEPTIONS.length} />
        {AGE_EXCEPTIONS.length === 0 ? (
          <EmptyState title="No age exceptions" icon="checkmark" />
        ) : (
          <Table headers={["Builder", "Ship", "Justification"]}>
            {AGE_EXCEPTIONS.map((item) => {
              const ship = shipById(item.ship);
              return (
                <tr key={item.id} className="align-top">
                  <td className="whitespace-nowrap font-bold">
                    <Mono>@{item.handle}</Mono>
                  </td>
                  <td className="whitespace-nowrap">
                    {ship ? <TextLink href={`/review/${ship.id.replace(/^sh-/, "")}`}>{ship.title}</TextLink> : item.ship}
                  </td>
                  <td className="max-w-xl whitespace-normal">{item.justification}</td>
                </tr>
              );
            })}
          </Table>
        )}
        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] px-4 py-3">
          <Button type="button" variant="outline" size="sm" disabled>
            Add an exception
          </Button>
          <span className="hc-caption text-xs">
            A reason of at least {MIN_JUSTIFICATION} characters is required. Opens with the review service. Nothing here is saved.
          </span>
        </div>
      </Card>
    </div>
  );
}
