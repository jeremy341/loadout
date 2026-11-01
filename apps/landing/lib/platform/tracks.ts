import { TRACKS, type Track } from "./progress";

// The track a page address names ("tools" is Tools), or null for anything else.
export function trackBySlug(slug: string): Track | null {
  return TRACKS.find((track) => track.toLowerCase() === slug.toLowerCase()) ?? null;
}

export function trackSlug(track: Track): string {
  return track.toLowerCase();
}
