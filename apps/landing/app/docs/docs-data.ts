export type DocsItem = { slug: string; label: string; description: string; group: string; order: number; status: 'draft' };
export type DocsGroup = { label: string; items: DocsItem[] };
export type DocsHeading = { id: string; text: string; depth: 2 | 3 };
export type DocsPage = DocsItem & { body: string; headings: DocsHeading[] };
export const docsGroupLabels = ['START HERE', 'BUILD & REVIEW', 'PROGRESS & PRIZES', 'COMMUNITY'] as const;
export const docsAliases: Record<string, string> = {
  fit: 'projects', workflow: 'shipping', rewards: 'progress', levels: 'progress', seasons: 'eras',
};
