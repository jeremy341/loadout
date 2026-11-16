// Verdict announcement (area E, Stub): a preview of the community post for each kind of verdict. Nothing is posted.
// A ban is never posted: it goes to the builder privately.

export type AnnounceKind = "approved" | "needs-changes" | "banned";
export const ANNOUNCE_KINDS: readonly AnnounceKind[] = ["approved", "needs-changes", "banned"];
export const ANNOUNCE_LABELS: Record<AnnounceKind, string> = { approved: "Approved", "needs-changes": "Needs changes", banned: "Banned" };

export const PRIVATE_LINE = "Sent privately. Not posted.";

export type AnnounceInput = { kind: AnnounceKind; title: string; builder: string; track: string; hours?: string };
export type Announcement = { kind: AnnounceKind; posted: boolean; channel: string; text: string; footnote: string | null };

export function announcement(input: AnnounceInput): Announcement {
  const { kind, title, builder, track, hours } = input;
  if (kind === "banned") {
    return {
      kind,
      posted: false,
      channel: "Direct message to the builder",
      text: `@${builder}, a reviewer has made a decision on ${title}. The details are in your message from the review team.`,
      footnote: PRIVATE_LINE,
    };
  }
  if (kind === "approved") {
    const credit = hours ? ` ${hours} counted toward the ${track} track.` : "";
    return { kind, posted: true, channel: "Community channel", text: `${title} by @${builder} was approved.${credit}`, footnote: null };
  }
  return { kind, posted: true, channel: "Community channel", text: `${title} by @${builder} was sent back with a note. They can add to it and ship again.`, footnote: null };
}
