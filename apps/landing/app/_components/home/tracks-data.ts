// Each track names one concrete thing you could build, with a tag for what kind of project it is. The homepage Tracks
// section and the participant Overview both read this list, so the copy stays the same in both places.
export const TRACK_BUILDS = [
  { name: "Tools", icon: "wrench", tag: "CLI", text: "Build a command-line tool that removes a step you keep repeating." },
  { name: "Systems", icon: "gear", tag: "Database", text: "Build a small database or a chat server that other programs can use." },
  { name: "Compute", icon: "cpu", tag: "GPU", text: "Build a program that runs a machine-learning model on a GPU." },
  { name: "Hardware", icon: "board", tag: "Board", text: "Build a custom circuit board or a robot." },
] as const;
