import Link from "next/link";
import { COMMUNITY_HOME, type Idea } from "@/lib/platform/community";

export function IdeaStatusTag({ status }: { status: Idea["status"] }) {
  return (
    <span className="cm-status" data-status={status.toLowerCase()}>
      {status}
    </span>
  );
}

// Voting does not exist yet, so the button is shown and disabled; the page says when it opens.
export function UpvoteButton({ title }: { title: string }) {
  return (
    <button type="button" className="pf-btn cm-upvote" disabled aria-label={`Upvote: ${title}`}>
      Upvote
    </button>
  );
}

export function IdeaRow({ idea, level = 3 }: { idea: Idea; level?: 2 | 3 }) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <li className="cm-idea">
      <div className="cm-vote">
        <span className="cm-vote-n">{idea.votes}</span>
        <span className="cm-vote-l">{idea.votes === 1 ? "vote" : "votes"}</span>
        <UpvoteButton title={idea.title} />
      </div>
      <div className="cm-idea-main">
        <Heading>
          <Link href={`${COMMUNITY_HOME}/ideas/${idea.id}`}>{idea.title}</Link>
        </Heading>
        <p className="cm-idea-summary">{idea.summary}</p>
        <p className="cm-meta">
          <IdeaStatusTag status={idea.status} />
          <span>by {idea.handle}</span>
        </p>
      </div>
    </li>
  );
}
