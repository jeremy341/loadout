import Link from "next/link";
import { COMMUNITY_HOME, type Session } from "@/lib/platform/community";

export function sessionMeta(session: Session): string {
  if (session.status === "upcoming") return "Date to be announced";
  return `${session.showcases.length} ${session.showcases.length === 1 ? "showcase" : "showcases"}`;
}

export function SessionRow({ session }: { session: Session }) {
  return (
    <li className="cm-session">
      <span className="cm-session-no">Session {session.number}</span>
      <div className="cm-session-main">
        <h3>
          <Link href={`${COMMUNITY_HOME}/show-and-tell/${session.id}`}>{session.title}</Link>
        </h3>
        <p>{session.summary}</p>
      </div>
      <span className="cm-session-meta">{sessionMeta(session)}</span>
    </li>
  );
}
