export type DocsItem = { slug: string; label: string; description: string };
export type DocsGroup = { label: string; items: DocsItem[] };

export const docsGroups: DocsGroup[] = [
  { label: "START HERE", items: [
    { slug: "start", label: "What is LOADOUT?", description: "Program, your Loadout, and current status" },
    { slug: "projects", label: "What can I build?", description: "Project fit, tracks, and Research Mode" },
  ] },
  { label: "BUILD & REVIEW", items: [
    { slug: "shipping", label: "Build & ship", description: "Prepare work, tracking, and journals" },
    { slug: "review", label: "Project review", description: "Fit, quality, AI, and team credit" },
  ] },
  { label: "PROGRESS & PRIZES", items: [
    { slug: "progress", label: "Bolts, XP & levels", description: "Two balances and lasting progress" },
    { slug: "prizes", label: "Prizes & requests", description: "Prices, Requisitions, and Custom Orders" },
  ] },
  { label: "COMMUNITY", items: [
    { slug: "eras", label: "Community Eras", description: "Shared progress and competitive Seasons" },
    { slug: "irl", label: "LOADOUT IRL", description: "The future Ruhr build-weekend concept" },
    { slug: "faq", label: "Quick answers", description: "Common questions about the program" },
  ] },
];

export const docsItems = docsGroups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })));

// Keep old participant-guide links useful after consolidating related topics.
export const docsAliases: Record<string, string> = {
  fit: "projects", tracks: "projects", research: "projects",
  workflow: "shipping", tracking: "shipping",
  "ai-teams": "review",
  rewards: "progress", levels: "progress",
  pricing: "prizes", requisitions: "prizes", "custom-orders": "prizes",
  seasons: "eras",
};
