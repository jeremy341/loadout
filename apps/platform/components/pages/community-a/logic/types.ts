import type { TrackName } from "../../../../lib/sample/builders";

// Shapes shared by the Explore, Ideas, Show & Tell and Friends tabs. Plain data only: nothing here touches
// React or the browser, so the logic modules and their tests can use it directly.

export type { TrackName };

/** Anything a community post can be tagged with. "Any" is for ideas that do not belong to one track. */
export type IdeaTrack = TrackName | "Any";

/** What a stored item reference points at, e.g. "project:p-quickshell". */
export type RefKind = "project" | "idea" | "post" | "comment";

export interface JournalExcerpt {
  id: string;
  title: string;
  at: string;
  excerpt: string;
}

export interface SampleProject {
  id: string;
  title: string;
  summary: string;
  handle: string;
  track: TrackName;
  tags: string[];
  /** Plain text such as "github.com/ada-cuts/quickshell". Never rendered as a link: this preview makes no network calls. */
  repoText: string;
  at: string;
  /** Sample like count before this browser's own like. */
  baseLikes: number;
  journals: JournalExcerpt[];
}

export type IdeaStatus = "Open" | "Planned" | "Done" | "Withdrawn";

export interface Idea {
  id: string;
  title: string;
  body: string;
  track: IdeaTrack;
  status: IdeaStatus;
  handle: string;
  at: string;
  editedAt?: string;
  /** Sample upvotes before the reactions map; 0 for ideas created in this browser. */
  baseVotes: number;
}

export interface ShowPost {
  id: string;
  title: string;
  built: string;
  learned?: string;
  link: string;
  track: TrackName;
  handle: string;
  at: string;
  editedAt?: string;
  baseLikes: number;
  /** Sample-selected for the "Featured this week" strip. Not an editorial decision. */
  featured?: boolean;
}

export interface CommunityComment {
  id: string;
  /** Item reference the comment belongs to. */
  ref: string;
  handle: string;
  body: string;
  at: string;
}

/** Item reference -> handles that liked or upvoted it, on top of the sample base count. */
export type ReactionMap = Record<string, string[]>;

export interface SocialState {
  following: string[];
  followers: string[];
  friends: string[];
  /** Friend requests other builders sent you, waiting for your answer. */
  incoming: string[];
  /** Friend requests you sent that are still pending. */
  outgoing: string[];
  /** Per followed builder: raise a notification for their new posts. */
  notify: Record<string, boolean>;
}

export type ReportReason = "spam" | "harassment" | "unsafe" | "off-topic" | "other";

export interface ContentReport {
  id: string;
  ref: string;
  /** Title or excerpt captured when the report was filed, so the list still reads after a delete. */
  label: string;
  reason: ReportReason;
  note: string;
  at: string;
}

export interface ModerationState {
  reports: ContentReport[];
  /** Item references hidden for this browser only. */
  hidden: string[];
  /** Handles whose content is hidden everywhere. */
  blocked: string[];
}

export type ActivityKind = "project" | "journal" | "idea" | "showcase";

export interface ActivityEvent {
  id: string;
  handle: string;
  kind: ActivityKind;
  text: string;
  at: string;
  /** Platform path the event opens. */
  href: string;
}
