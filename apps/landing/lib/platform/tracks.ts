import { TRACKS, type Track } from "./progress";

// What each track is about, for its page: one line, and a short list of what counts toward it. Draft wording, written
// from the homepage's track copy; the program rules for eligible work are still to be confirmed.
export const TRACK_ABOUT: Record<Track, { summary: string; counts: readonly string[] }> = {
  Tools: {
    summary: "Software you build to save yourself or others a step. Every approved hour on a Tools project raises this track.",
    counts: ["Command-line tools and scripts", "Editor plugins and small utilities", "Automation that replaces a manual step"],
  },
  Systems: {
    summary: "Software that other programs depend on. Every approved hour on a Systems project raises this track.",
    counts: ["Databases and storage engines", "Chat and API servers", "Networking and protocols"],
  },
  Compute: {
    summary: "Programs that do heavy computation, often on a GPU. Every approved hour on a Compute project raises this track.",
    counts: ["Machine-learning models and training", "GPU programs", "Simulations and data pipelines"],
  },
  Hardware: {
    summary: "Physical things you design and build. Every approved hour on a Hardware project raises this track.",
    counts: ["Custom circuit boards", "Robots and mechanisms", "Firmware that runs on your own hardware"],
  },
};

// The track a page address names ("tools" is Tools), or null for anything else.
export function trackBySlug(slug: string): Track | null {
  return TRACKS.find((track) => track.toLowerCase() === slug.toLowerCase()) ?? null;
}

export function trackSlug(track: Track): string {
  return track.toLowerCase();
}
