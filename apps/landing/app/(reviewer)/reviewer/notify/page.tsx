import { requirePage } from "@/reviewer-dash/lib/guard";
import { NotifyForm } from "@/reviewer-dash/app/_components/NotifyForm";
import { Flash, PageHeader } from "@/reviewer-dash/app/_ui/ui";

export const dynamic = "force-dynamic";

export default async function NotifyPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  await requirePage("owner");
  const { sent, error } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notify"
        description="Send a message to builders' notifications on the LOADOUT site. Choose everyone or a single builder."
      />

      <Flash error={error} ok={sent ? `Sent to ${sent === "1" ? "1 builder" : `${sent} builders`}. Sample data. Nothing was saved.` : null} />

      <NotifyForm />
    </div>
  );
}
