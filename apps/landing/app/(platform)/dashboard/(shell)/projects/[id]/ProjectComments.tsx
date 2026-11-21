import Link from "next/link";
import { CommentForm, DeleteCommentButton } from "@/app/(platform)/dashboard/(shell)/projects/[id]/CommentForm";
import { HandleMark } from "@/app/_components/platform/ProjectTimeline";
import { ANON_AUTHOR, commentCountLabel } from "@/lib/platform/comments";
import { listProjectComments } from "@/lib/platform/comments-data";
import { relativeTime } from "@/lib/platform/explore-feed";

// The comment section of a public project: the list of builder comments (the writer's handle and when they wrote it),
// a reply box for the signed-in builder, and a Remove press for one's own words. A comment is plain text, kept under
// COMMENTS_SHOWN on a page (the list says so when it cuts) and coloured by nothing: a project's reviews happen on the
// review desk, not here, so a comment says what it says and nothing scores it.
export async function ProjectComments({ projectId, viewerId, idPrefix = "" }: Readonly<{ projectId: string; viewerId: string; idPrefix?: string }>) {
  const { items, total, shown } = await listProjectComments(projectId);

  return (
    <section className="pf-spp-box" aria-labelledby={`${idPrefix}comments-heading`}>
      <h2 id={`${idPrefix}comments-heading`}>{commentCountLabel(total)}</h2>

      {items.length === 0 ? (
        <p className="pf-muted" data-testid="project-comments-empty">
          No builder has commented on this project yet.
        </p>
      ) : (
        <ol data-testid="project-comments">
          {items.map((comment) => {
            const own = comment.authorId === viewerId;
            return (
              <li className="pf-explore-entry" key={comment.id}>
                <div className="pf-explore-entry-head">
                  <h3>
                    <HandleMark handle={comment.authorHandle} />
                    {comment.authorHandle ? (
                      <Link className="pf-meta-link" href={`/dashboard/builders/${comment.authorHandle}`}>
                        {comment.authorHandle}
                      </Link>
                    ) : (
                      <span>{ANON_AUTHOR}</span>
                    )}
                  </h3>
                  <p className="pf-explore-entry-meta">
                    {own ? "You · " : ""}
                    {relativeTime(comment.createdAt)}
                  </p>
                </div>
                <p className="pf-explore-entry-body">{comment.body}</p>
                {own ? <DeleteCommentButton id={comment.id} projectId={projectId} /> : null}
              </li>
            );
          })}
        </ol>
      )}
      {total > shown ? <p className="pf-muted pf-box-note">Showing the newest {shown} of {total} comments.</p> : null}

      <CommentForm projectId={projectId} />
    </section>
  );
}
