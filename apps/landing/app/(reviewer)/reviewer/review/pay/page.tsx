import { requirePage } from "@/reviewer-dash/lib/guard";
import { REVIEWERS, countsTotal } from "@/lib/platform/review";
import { PERK_REVIEWERS } from "@/lib/reviewer/desk/records-fixtures";
import { PAY_PER_REVIEW, PERKS_PROVISIONAL, PERK_MILESTONES, perkProgress } from "@/lib/reviewer/desk/records-perks";
import { Badge, Button, Card, CardHeader, Mono, PageHeader, Table } from "@/reviewer-dash/app/_ui/ui";

export const metadata = { title: "Pay and perks" };
export const dynamic = "force-dynamic";

// Reviewer pay and milestone perks, owner only. Pay per review is not set, and the perks are provisional. Setting either opens with
// the review service (a stub).
export default async function ReviewPayPage() {
  await requirePage("owner");
  const people = REVIEWERS.filter((person) => PERK_REVIEWERS.includes(person.id));
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Pay and perks" description="What reviewers are paid and the perks they earn at review milestones." />
      <Card>
        <CardHeader title="Pay per review" icon="payment" />
        <div className="flex flex-wrap items-center gap-3">
          <Badge>{PAY_PER_REVIEW}</Badge>
          <span className="hc-caption text-sm">Owner decision pending.</span>
          <Button type="button" variant="outline" size="sm" disabled>
            Set pay per review
          </Button>
        </div>
        <p className="hc-caption mt-3 text-xs">Opens with the review service. Nothing here is saved.</p>
      </Card>
      <Card padding="flush">
        <CardHeader title="Milestone perks" icon="rep" />
        <p className="hc-caption px-4 py-3 text-sm">{PERKS_PROVISIONAL} A milestone is a number of reviews. Reviews are every counted verdict.</p>
        <Table headers={["Milestone", "Reviews", "Perk"]}>
          {PERK_MILESTONES.map((item) => (
            <tr key={item.id}>
              <td className="font-bold">{item.label}</td>
              <td className="hc-mono">{item.reviews}</td>
              <td>{item.perk}</td>
            </tr>
          ))}
        </Table>
      </Card>
      <Card padding="flush">
        <CardHeader title="Progress by reviewer" icon="leaders" count={people.length} />
        <Table headers={["Reviewer", "Reviews", "Next milestone"]}>
          {people.map((person) => {
            const progress = perkProgress(countsTotal(person.verdicts.all));
            return (
              <tr key={person.id}>
                <td className="font-bold">
                  <Mono>@{person.handle}</Mono>
                </td>
                <td className="hc-mono">{progress.reviews}</td>
                <td>{progress.next ? `${progress.next.label}, ${progress.next.remaining} to go` : "Every milestone reached"}</td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}
