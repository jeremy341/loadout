import { requirePage } from "@/reviewer-dash/lib/guard";
import { ERASURE_SAMPLE_HANDLE, erasurePlan } from "@/lib/reviewer/desk/records-erasure";
import { Badge, Button, Card, CardHeader, Field, Input, Mono, PageHeader, Table } from "@/reviewer-dash/app/_ui/ui";

export const metadata = { title: "Erasure" };
export const dynamic = "force-dynamic";

// Erasure, owner only: lists what removing one sample builder would take away and asks for the handle to be typed. The erase action is a
// stub: it is laid out and disabled.
export default async function ReviewErasurePage() {
  await requirePage("owner");
  const plan = erasurePlan(ERASURE_SAMPLE_HANDLE);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Erasure" description="Remove one person's data. Shown on a sample handle." />
      <Card padding="flush">
        <CardHeader title={`What removing @${ERASURE_SAMPLE_HANDLE} takes away`} icon="private" count={plan.length} />
        <Table headers={["Area", "What", "Result"]}>
          {plan.map((item) => (
            <tr key={item.id} className="align-top">
              <td className="whitespace-nowrap font-bold">{item.area}</td>
              <td className="max-w-lg whitespace-normal">{item.detail}</td>
              <td>
                <Badge tone={item.action === "removed" ? "danger" : "neutral"}>{item.action}</Badge>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      <Card>
        <CardHeader title="Confirm" icon="important" />
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Type the handle to confirm" hint={`Type ${ERASURE_SAMPLE_HANDLE} to enable the button.`}>
            <Input disabled placeholder={ERASURE_SAMPLE_HANDLE} aria-label="Handle to confirm" />
          </Field>
          <Button type="button" variant="danger" disabled>
            Erase <Mono>@{ERASURE_SAMPLE_HANDLE}</Mono>
          </Button>
        </div>
        <p className="hc-caption mt-3 text-xs">Opens with the review service. Nothing here is saved.</p>
      </Card>
    </div>
  );
}
