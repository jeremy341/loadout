import { requirePage } from "@/reviewer-dash/lib/guard";
import { publishNews } from "./actions";
import {
  ActionButton,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Flash,
  Input,
  Muted,
  PageHeader,
  Textarea,
} from "@/reviewer-dash/app/_ui/ui";
import { NEWS_BODY_MAX, NEWS_TITLE_MAX } from "@/lib/platform/content-data";
import { listNews } from "@/lib/platform/community-data";

export const dynamic = "force-dynamic";

// The staff side of the News section: an owner writes a title and the note, and it is published as written to the News
// table (with an audit row, lib/platform/content-data.ts createNews), where the community News page lists it newest
// first. Published notes show below in the same order builders read them. The page and the write both ask for the owner
// role, and the route matrix says the same.
export default async function NewsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  await requirePage("owner");
  const { error, created } = await searchParams;
  const items = await listNews();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="News"
        count={items.length}
        description="Program notes for builders, published as written. A note is plain text; it states nothing as confirmed unless the note itself says so."
      />
      <Flash error={error} ok={created ? "News published." : null} />

      <Card>
        <CardHeader title="Write a note" icon="notification" />
        <form action={publishNews} className="flex flex-col gap-3">
          <Field label="Title">
            <Input name="title" required maxLength={NEWS_TITLE_MAX} placeholder="How Community Eras are meant to work" />
          </Field>
          <Field label="The note" hint={`Plain text, up to ${NEWS_BODY_MAX.toLocaleString("en-GB")} characters. Shown to builders as written.`}>
            <Textarea name="body" rows={5} required maxLength={NEWS_BODY_MAX} placeholder="What has changed, what it means, what comes next." />
          </Field>
          <div>
            <ActionButton pendingLabel="Publishing...">Publish</ActionButton>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Published notes" icon="notification" count={items.length} />
        {items.length === 0 ? (
          <EmptyState title="No news yet" icon="notification">
            The first note published above is the first one builders read.
          </EmptyState>
        ) : (
          <ul className="flex flex-col">
            {items.map((item) => (
              <li
                key={item.id}
                className="p-4 border-t"
                style={{ borderColor: "var(--border)", whiteSpace: "pre-wrap" }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{item.title}</span>
                  <Muted className="text-xs">
                    {item.publishedAt.toISOString().slice(0, 10)} · by {item.authorHandle ?? "the team"}
                  </Muted>
                </div>
                <p className="mt-2 max-w-2xl text-sm">{item.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
