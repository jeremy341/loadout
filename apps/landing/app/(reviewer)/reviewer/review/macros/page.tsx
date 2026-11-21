import Link from "next/link";
import { requirePage } from "@/reviewer-dash/lib/guard";
import { REVIEW_MACROS } from "@/reviewer-dash/lib/reviewMacros";
import { Card, CardHeader, Mono, Muted, PageHeader, Table } from "@/reviewer-dash/app/_ui/ui";

export const metadata = { title: "Review macros" };
export const dynamic = "force-dynamic";

// The built-in note shortcuts, owner only. A reviewer types a trigger such as /track and a space in the note to the builder and it
// becomes the text. Built-ins are set in code (reviewer-dash/lib/reviewMacros.ts); each reviewer's own macros live in Settings.
export default async function ReviewMacrosPage() {
  await requirePage("owner");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Review macros"
        description="Canned messages for the note to the builder. A reviewer types a trigger such as /track and a space, and it becomes the text."
      />
      <Card padding="flush">
        <CardHeader title="Built-in macros" icon="docs" count={REVIEW_MACROS.length} />
        <Table headers={["Trigger", "Name", "Text"]}>
          {REVIEW_MACROS.map((macro) => (
            <tr key={macro.trigger} className="align-top">
              <td className="whitespace-nowrap">
                <Mono>{macro.trigger}</Mono>
              </td>
              <td className="whitespace-nowrap font-bold">{macro.label}</td>
              <td className="max-w-xl whitespace-normal">
                <span className="whitespace-pre-wrap break-words text-sm">{macro.text}</span>
              </td>
            </tr>
          ))}
        </Table>
        <p className="hc-caption px-4 py-3 text-sm">
          <Mono>{"{track}"}</Mono> in a macro becomes the ship&apos;s one track. Reviewers add their own macros in{" "}
          <Link href="/settings#review" className="hc-link">
            Settings
          </Link>
          . <Muted>Editing the built-in list opens with the review service. Nothing here is saved.</Muted>
        </p>
      </Card>
    </div>
  );
}
