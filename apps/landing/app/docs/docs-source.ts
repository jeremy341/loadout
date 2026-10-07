import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import MiniSearch from 'minisearch';
import { docsAliases, docsGroupLabels, type DocsPage, type DocsGroup } from './docs-data';
import { parseDocsMarkdown } from './docs-markdown';
import { docsSearchOptions } from './search-options';

export function publicDocsDirectory() {
  const root = join(process.cwd(), 'content', 'docs');
  return existsSync(root) ? root : resolve(process.cwd(), '../../content/docs');
}
export function parsePublicDoc(slug: string, source: string): DocsPage {
  if (!/^[a-z][a-z0-9-]*$/.test(slug)) throw new Error(`Invalid Docs slug: ${slug}`);
  const match = source.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${slug}: frontmatter required`);
  const metadata = parse(match[1]) as Record<string, unknown>;
  const keys = ['title', 'description', 'group', 'order', 'status'];
  if (!metadata || typeof metadata !== 'object' || Object.keys(metadata).some((key) => !keys.includes(key))) throw new Error(`${slug}: invalid metadata keys`);
  if (typeof metadata.title !== 'string' || !metadata.title.trim() || typeof metadata.description !== 'string' || !metadata.description.trim()) throw new Error(`${slug}: title and description required`);
  if (!docsGroupLabels.includes(metadata.group as typeof docsGroupLabels[number])) throw new Error(`${slug}: unknown group`);
  if (!Number.isInteger(metadata.order) || Number(metadata.order) <= 0 || metadata.status !== 'draft') throw new Error(`${slug}: positive order and draft status required`);
  const body = match[2].trim();
  const { headings } = parseDocsMarkdown(body);
  if (!body || !headings.length) throw new Error(`${slug}: body and headings required`);
  return { slug, label: metadata.title, description: metadata.description, group: String(metadata.group), order: Number(metadata.order), status: 'draft', body, headings };
}
export function getDocs(): DocsPage[] {
  const directory = publicDocsDirectory();
  const pages = readdirSync(directory).filter((file) => file.endsWith('.md')).map((file) => parsePublicDoc(file.slice(0, -3), readFileSync(join(directory, file), 'utf8')));
  const orders = new Set<number>();
  for (const page of pages) {
    if (orders.has(page.order)) throw new Error(`Duplicate Docs order: ${page.order}`);
    orders.add(page.order);
  }
  return pages.sort((a, b) => docsGroupLabels.indexOf(a.group as typeof docsGroupLabels[number]) - docsGroupLabels.indexOf(b.group as typeof docsGroupLabels[number]) || a.order - b.order);
}
export function getDocsGroups(pages = getDocs()): DocsGroup[] {
  return docsGroupLabels.map((label) => ({ label, items: pages.filter((page) => page.group === label).map((page) => ({ slug: page.slug, label: page.label, description: page.description, group: page.group, order: page.order, status: page.status })) }));
}
export function getDocsSearchIndex(pages = getDocs()) {
  const index = new MiniSearch(docsSearchOptions);
  for (const page of pages) {
    for (const section of parseDocsMarkdown(page.body).sections) {
      const text = section.text.replace(/\s+/g, ' ').trim();
      if (!text && !section.heading) continue;
      const url = `/docs/${page.slug}${section.id ? `#${section.id}` : ''}`;
      index.add({ id: url, title: page.label, heading: section.heading, text, snippet: text.slice(0, 180), url });
    }
  }
  return index.toJSON();
}
export function validateDocsLinks(pages = getDocs()): string[] {
  const errors: string[] = [];
  for (const page of pages) {
    const { tree } = parseDocsMarkdown(page.body);
    function check(node: { type: string; url?: string; children?: typeof tree.children }) {
      if (node.type === 'link' && node.url) {
        const url = node.url;
        if (url.startsWith('#') || url.startsWith('/docs/')) {
          const [route, anchor] = url.split('#');
          const slug = route ? route.slice('/docs/'.length) : page.slug;
          const target = pages.find((item) => item.slug === (docsAliases[slug] ?? slug));
          if (!target || (anchor && !target.headings.some((heading) => heading.id === anchor))) errors.push(`${page.slug}: broken link ${url}`);
        } else if (!url.startsWith('https://') && url !== '/') errors.push(`${page.slug}: unsupported link ${url}`);
      }
      node.children?.forEach(check);
    }
    tree.children.forEach(check);
  }
  return errors;
}
