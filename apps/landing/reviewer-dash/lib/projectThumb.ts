// The stand-in for a project's cover image in the review tables: a square in the track's colour with the project's first letter,
// so a row without a cover reads as a project and not as a broken image. The colour is a word-backed hint only; the track badge
// beside the title still names the track.

export type ThumbTone = "blue" | "green" | "purple" | "orange" | "neutral";

const TRACK_TONE: Record<string, ThumbTone> = {
  tools: "blue",
  systems: "green",
  compute: "purple",
  hardware: "orange",
};

/** The colour family for a track name (case-insensitive); anything else, or no track, is neutral. */
export function thumbTone(track: string | null | undefined): ThumbTone {
  return TRACK_TONE[(track ?? "").trim().toLowerCase()] ?? "neutral";
}

/** The first letter or digit of the name, upper-cased, or "?" when there is none. */
export function projectInitial(name: string | null | undefined): string {
  const match = (name ?? "").match(/[\p{L}\p{N}]/u);
  return match ? match[0].toUpperCase() : "?";
}
