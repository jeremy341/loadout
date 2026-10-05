export const heroCopy = {
  headlineLines: ["BUILD YOUR OWN", "TECHNICAL STACK."],
  tagline: "Build your own technical stack.",
  support: "Ship tools, systems, compute, and hardware. Grow your Digital Loadout. Equip your next harder build.",
} as const;

export const overviewItems = [
  {
    icon: "layers",
    index: "01",
    title: "Choose a track",
    description: "Pick a technical field that fits what you want to build.",
  },
  {
    icon: "code",
    index: "02",
    title: "Ship real projects",
    description: "Build a working artifact and document how it works.",
  },
  {
    icon: "bolt",
    index: "03",
    title: "Earn Bolts",
    description: "Bolts are global currency for the reward shop.",
  },
  {
    icon: "gift",
    index: "04",
    title: "Grow your loadout",
    description: "Your Digital Loadout grows with shipped work; rewards build your Physical Loadout.",
  },
] as const;

export const processSteps = [
  { icon: "user", title: "Find your next build", description: "Identify a capability you want to create or improve." },
  { icon: "list", title: "Pick a track", description: "Tools, Systems, Compute, or Hardware." },
  { icon: "code", title: "Build and ship", description: "Keep an attributable journal as you build, then ship a working artifact. Hackatime and Lapse are planned tracking tools." },
  { icon: "document", title: "Review & verify", description: "Check project fit, evidence, and quality through review." },
  { icon: "bolt", title: "Earn Bolts", description: "Approved work contributes to global Bolts and per-track XP." },
  { icon: "gift", title: "Grow your loadout", description: "Keep your shipped work. Upgrade equipment for the next build." },
] as const;

export const projectFitItems = [
  { icon: "document", status: "lower", title: "Portfolio clone", description: "A copy of an existing site or tutorial project." },
  { icon: "wrench", status: "higher", title: "Real-world utility", description: "A tool that solves a practical problem or improves a workflow." },
  { icon: "people", status: "lower", title: "Chatbot wrapper", description: "A thin interface around a model without meaningful added work." },
  { icon: "terminal", status: "higher", title: "Custom tool or runtime", description: "A new tool, framework, or system with original functionality." },
] as const;

export const tracks = [
  { name: "Tools", icon: "wrench", topics: "Developer tools, debuggers, SDKs, CLIs, and automation." },
  { name: "Systems", icon: "gear", topics: "Infrastructure, runtimes, networks, protocols, and databases." },
  { name: "Compute", icon: "chip", topics: "GPU work, inference runtimes, graphics, and performance tooling." },
  { name: "Hardware", icon: "board", topics: "Embedded systems, physical devices, robotics, and electronics." },
] as const;

export const progressionMilestones = ["LV.1", "LV.5", "LV.10", "LV.15"] as const;

export const fieldCategories = [
  { icon: "laptop", title: "Laptops & PCs", description: "Equipment for your next technical build." },
  { icon: "gear", title: "Development tools", description: "Tools that help you build, test, and ship." },
  { icon: "cloud", title: "Cloud & compute", description: "Resources for experiments and infrastructure." },
  { icon: "wrench", title: "Makers & hardware", description: "Physical tools for ideas beyond the screen." },
] as const;

export const rewards = [
  { stage: "01", token: "Shipped work", explainer: "A project is shared with enough detail to review what you built." },
  { stage: "02", token: "Quality review", explainer: "Review considers originality, technical depth, execution, and documentation." },
  { stage: "03", token: "Bolts and progress", explainer: "Reviewed work can contribute to track XP and global Bolts." },
] as const;

export const shopCategories = [
  { icon: "laptop", title: "Developer hardware" },
  { icon: "board", title: "Embedded boards" },
  { icon: "chip", title: "Compute" },
  { icon: "wrench", title: "Tools" },
  { icon: "storage", title: "Storage" },
  { icon: "flask", title: "Fabrication" },
  { icon: "domain", title: "Domains" },
  { icon: "box", title: "Custom gear" },
] as const;

export const faqItems = [
  { question: "Who can join?", answer: "LOADOUT is in development. RSVP opens a draft interest form; eligibility and launch details have not been published." },
  { question: "What kinds of projects fit?", answer: "Projects should show original technical work. Examples of project types include a renderer or netcode, an inference runtime or GPU backend, and local-first sync. These are examples, not participant projects or guaranteed approvals." },
  { question: "Can I work with a team or across tracks?", answer: "Teams can collaborate when each person's work is attributable in the journal. A ship that spans tracks receives a final Track XP allocation from reviewers; contributors receive credit for their own approved work." },
  { question: "How is work tracked?", answer: "Planned tracking uses Hackatime for coding and Lapse for eligible hardware and non-code work. Journals connect your tracked time to progress, decisions, and evidence. Full tracking guidelines will be published before launch." },
  { question: "How does AI assistance work?", answer: "AI can help with research, explanation, and debugging. Declare your assistance and show your authorship, understanding, and original work. The full policy will be published before launch." },
  { question: "How do tracks work?", answer: "Tools, Systems, Compute, and Hardware are the four tracks. Track XP is non-spendable and recorded per track across 15 lifetime levels; Bolts are global spendable currency. Research Mode can apply within any track, and research submissions need reproducible technical outputs." },
  { question: "How do Requisitions work?", answer: "Requisition milestones are LV.3, LV.6, LV.9, LV.12, and LV.15. A Requisition is one-use and never expires. Only one can apply to an order, and it cannot bypass Mastery level requirements. Custom Orders remain subject to fit, budget, region, and fulfillment." },
  { question: "How do I RSVP?", answer: "The RSVP link opens an external draft interest form. Sending interest does not enroll you or confirm eligibility." },
] as const;

export const researchCopy = {
  title: "Research Mode",
  description: "Investigate a technical question and share reproducible technical outputs. Research Mode is a modifier, not a separate track.",
} as const;

export const requisitionMilestones = ["LV.3", "LV.6", "LV.9", "LV.12", "LV.15"] as const;
