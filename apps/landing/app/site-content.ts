export const heroCopy = {
  headlineLines: ["BUILD YOUR OWN", "TECHNICAL STACK."],
  tagline: "Build your own technical stack.",
  support: "Build tools, systems, compute, and hardware. Earn Bolts for equipment and Track XP in the fields your work uses.",
} as const;

export const projectFitItems = [
  { icon: "document", status: "lower", title: "Copied tutorial site", description: "Recreating a tutorial without adding substantial technical work shows little original work." },
  { icon: "wrench", status: "higher", title: "Workflow command-line tool", description: "Build a command that removes a repeated step from a real workflow." },
  { icon: "people", status: "lower", title: "Basic AI chat screen", description: "A simple screen around an AI model adds little technical work on its own." },
  { icon: "terminal", status: "higher", title: "Inference runtime", description: "Build software that runs a model on a device or GPU. That can show original Compute work." },
] as const;

export const tracks = [
  { name: "Tools", icon: "wrench", topics: "Make tools that help people build and test software, such as command-line tools, debuggers, and automation." },
  { name: "Systems", icon: "gear", topics: "Build the software and infrastructure other projects rely on, such as runtimes, networks, and databases." },
  { name: "Compute", icon: "chip", topics: "Make programs do more or run faster with graphics, GPUs, and model-running software." },
  { name: "Hardware", icon: "board", topics: "Build physical technology such as circuit boards, embedded devices, and robots." },
] as const;

export const shopCategories = [
  { icon: "laptop", title: "Developer hardware" },
  { icon: "board", title: "Embedded boards" },
  { icon: "chip", title: "Compute" },
  { icon: "wrench", title: "Tools" },
  { icon: "storage", title: "Storage" },
  { icon: "flask", title: "Fabrication" },
  { icon: "domain", title: "Domains" },
  { icon: "box", title: "Custom equipment" },
] as const;

export const faqItems = [
  { question: "Who can join?", answer: "LOADOUT is in development. RSVP opens a draft interest form; eligibility and launch details have not been published." },
  { question: "What happens when my project is reviewed?", answer: "Reviewers check project fit and evidence, then score Originality (what is new), Technical Depth (the hard technical work), Execution (whether it works), and Documentation (whether another builder can understand it). They assign Track XP to fields shown by your work. Accepted projects can earn Bolts." },
  { question: "What are Bolts and Track XP?", answer: "Bolts are global, spendable currency for prizes. Track XP cannot be spent; it raises a separate persistent level in Tools, Systems, Compute, or Hardware. Levels do not multiply the Bolts you earn." },
  { question: "Can my project use more than one track?", answer: "Yes. Choose tracks based on the work you do, not just the kind of product you make. Reviewers assign Track XP to the fields supported by your actual work." },
  { question: "Can I work with a team?", answer: "Yes. Keep your journal clear about your own contribution. Reviewers credit each person for their own approved work and assign XP to the tracks that work used." },
  { question: "What kinds of project work may fit?", answer: "Fit depends on the technical work, not just the product label. The examples above are possible directions, not guaranteed approvals. Using AI does not automatically rule out a project; reviewers assess what you built and can explain." },
  { question: "How is work tracked?", answer: "The planned tools are Hackatime for coding and Lapse for eligible hardware and other non-code work. Your journal connects tracked time to notes about what you built, why you made choices, and how you checked the result. Full tracking instructions will be published before launch." },
  { question: "Can I use AI while building?", answer: "Yes. Explain how you used AI and show what you understand and built yourself. AI use alone does not make a project ineligible." },
  { question: "What are Community Eras?", answer: "An Era is a shared technical theme, separate from competitive Seasons. Approved projects add non-spendable Era Points toward a community target. Objectives are optional, and Era changes do not reset your personal progress or accepted projects." },
  { question: "How do Field Requisitions work?", answer: "A matching Requisition raises the savings limit on an eligible order. Each is one-use, never expires, cannot be transferred, and only one can be used per order. Minimum item values and level requirements still apply." },
  { question: "How do Custom Orders work?", answer: "Request specific equipment outside the regular shop. The team reviews the request and sends a quote for you to accept or decline. Requests are not open yet." },
  { question: "How do I RSVP?", answer: "The RSVP link opens an external draft interest form. Sending interest does not enroll you or confirm eligibility." },
] as const;

export const researchCopy = {
  title: "Research Mode",
  description: "An optional modifier for any track: test a technical question and share results another builder can reproduce. It is not a fifth track.",
} as const;
