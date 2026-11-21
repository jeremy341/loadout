/* eslint-disable @next/next/no-img-element */
import { addProjectNote } from "@/reviewer-dash/app/actions";
import { ActionButton, Card, CardHeader, EmptyState, Field, Textarea, formatDateTime } from "@/reviewer-dash/app/_ui/ui";
import type { ProjectNoteRow } from "@/reviewer-dash/lib/db";
import { isAllowedImageSrc, isSafeUrl } from "@/reviewer-dash/lib/safeUrl";

// One steady color per author, so a thread between a few reviewers is easy to
// follow at a glance.
const AUTHOR_COLORS = ["var(--hc-red)", "var(--hc-blue)", "var(--hc-green)", "var(--hc-orange)", "var(--hc-purple)", "var(--hc-cyan)"];

function authorColor(author: string): string {
  let hash = 0;
  for (const ch of author) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AUTHOR_COLORS[hash % AUTHOR_COLORS.length];
}

// Free-form internal notes any reviewer can leave on a project. Not tied to a
// verdict, just context for whoever looks at this project next. Shared between
// the project detail page and the review page, since reviewers work from both.
// Shown as a chat thread: oldest first, with the box to add one at the bottom.
export function ProjectNotes({
  projectId,
  notes,
  className = "",
}: {
  projectId: number;
  notes: ProjectNoteRow[];
  className?: string;
}) {
  const thread = [...notes].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));

  return (
    <div className={className}>
      <Card>
        <CardHeader title="Reviewer notes" icon="message" count={notes.length} />
        {thread.length === 0 ? (
          <EmptyState title="No notes yet" icon="message">
            Leave one for whoever looks at this project next.
          </EmptyState>
        ) : (
          <ol className="hc-chat">
            {thread.map((n) => (
              <li key={n.id} className="hc-chat-message">
                <span className="hc-chat-avatar" style={{ background: authorColor(n.author) }} aria-hidden>
                  {(n.author.trim()[0] ?? "?").toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="hc-chat-meta">
                    <span className="font-bold">{n.author}</span> <span>{formatDateTime(n.created_at)}</span>
                  </p>
                  <div className="hc-chat-bubble">
                    <p className="whitespace-pre-wrap break-words">{n.body}</p>
                    {isSafeUrl(n.image_url) && (
                      <a href={n.image_url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="mt-2 block">
                        {isAllowedImageSrc(n.image_url) && (
                          <img src={n.image_url} alt="" referrerPolicy="no-referrer" className="max-h-48 rounded object-cover" />
                        )}
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
        <form action={addProjectNote} className="mt-4 flex flex-col gap-3 border-t border-[var(--border)] pt-4">
          <input type="hidden" name="projectId" value={projectId} />
          <Textarea
            name="body"
            required
            maxLength={2000}
            rows={2}
            placeholder="Leave a note for whoever looks at this project next..."
          />
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Field label="Screenshot" hint="Optional. PNG, JPEG or WebP.">
              <input name="image" type="file" accept="image/png,image/jpeg,image/webp" className="hc-file" />
            </Field>
            <ActionButton size="sm" icon="send" pendingLabel="Adding...">
              Add note
            </ActionButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
