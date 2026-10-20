// Sample builders shared by Explore, Friends, Leaderboards, Ideas, Show & Tell and Profile. They are invented
// for the preview: no real person, school or account. Replace with real records when identity ships.

export type TrackName = "Tools" | "Systems" | "Compute" | "Hardware";

export interface SampleBuilder {
  handle: string;
  name: string;
  track: TrackName;
  /** Short builder bio, sample text. */
  bio: string;
}

/** The signed-out preview user. Their data is whatever they create in this browser. */
export const ME: SampleBuilder = {
  handle: "you",
  name: "You (preview)",
  track: "Tools",
  bio: "This profile is saved only in this browser.",
};

export const SAMPLE_BUILDERS: SampleBuilder[] = [
  { handle: "ada-cuts", name: "Ada Cuts", track: "Tools", bio: "Builds small CLI tools for people who hate setup." },
  { handle: "bit-ferry", name: "Bit Ferry", track: "Systems", bio: "Writes schedulers and breaks them on purpose." },
  { handle: "coil-kit", name: "Coil Kit", track: "Hardware", bio: "Soldering irons, 3D-printed cases and bad puns." },
  { handle: "dee-gpu", name: "Dee Gpu", track: "Compute", bio: "Shaders, kernels and one very warm laptop." },
  { handle: "eli-lathe", name: "Eli Lathe", track: "Hardware", bio: "Motion control and cable management." },
  { handle: "fern-ops", name: "Fern Ops", track: "Systems", bio: "Self-hosting everything on a shelf." },
  { handle: "gus-parse", name: "Gus Parse", track: "Tools", bio: "Parsers, linters and tiny languages." },
  { handle: "hana-sim", name: "Hana Sim", track: "Compute", bio: "Physics sims that run in a browser tab." },
  { handle: "ivo-trace", name: "Ivo Trace", track: "Systems", bio: "Tracing, profiling and flame graphs." },
  { handle: "jo-pcb", name: "Jo Pcb", track: "Hardware", bio: "Two-layer boards and careful footprints." },
];

export function builderByHandle(handle: string): SampleBuilder | undefined {
  return handle === ME.handle ? ME : SAMPLE_BUILDERS.find((b) => b.handle === handle);
}
