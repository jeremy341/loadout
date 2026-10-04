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
  { icon: "code", title: "Build and ship", description: "Track real work, journal your progress, and ship a working artifact." },
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
  { question: "Who can join?", answer: "LOADOUT is being prepared for technical builders. Joining and eligibility details will be published when the program is ready to open." },
  { question: "What projects count?", answer: "Build something that meaningfully expands technical capability for you or other builders. Developer tools, runtimes, infrastructure, compute tooling, and embedded systems are good directions. A basic portfolio, CRUD app, game, or chatbot wrapper usually needs deeper original technical work to fit." },
  { question: "Do I need a team?", answer: "You can build solo or collaborate. Team projects need clear contribution records, and the same work must not be claimed twice." },
  { question: "How do tracks work?", answer: "Tools, Systems, Compute, and Hardware are the four tracks. Track XP records progress within a field across 15 lifetime levels. Research Mode is a modifier for experiments and technical investigations, and can apply within any track." },
  { question: "How do I earn Bolts?", answer: "A ship goes through project-fit, validity, and quality review. The quality assessment considers Originality, Technical Depth, Execution, and Documentation. Approved work can earn global Bolts and separate Track XP; reward amounts depend on the program's final policy." },
  { question: "How do rewards work?", answer: "Bolts are the planned spendable currency for rewards that improve your Physical Loadout. Track specialization can improve eligible field pricing. The categories shown are a preview of the planned direction; the catalogue, prices, and availability will be published separately." },
  { question: "What are requisitions and Custom Orders?", answer: "Field Requisitions are rare, one-use opportunities earned through track progression, and do not stack on one purchase. Custom Orders are a planned way to request specialist technical gear outside the regular catalogue. Neither is an active request service yet." },
] as const;
