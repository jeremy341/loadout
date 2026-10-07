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
function readHeader(source: string, slug: string) {
  const match = source.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${slug}: frontmatter required`);
  return { metadata: parse(match[1]) as unknown, body: match[2].trim() };
}
function metadataRecord(value: unknown, slug: string): Record<string, unknown> {
  if (!value || typeof value !== 'object') throw new Error(`${slug}: invalid metadata keys`);
  const keys = ['title', 'description', 'group', 'order', 'status'];
  if (Object.keys(value).some((key) => !keys.includes(key))) throw new Error(`${slug}: invalid metadata keys`);
  return value as Record<string, unknown>;
}
function requiredText(value: unknown, slug: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${slug}: title and description required`);
  return value;
}
function publicMetadata(value: unknown, slug: string) {
  const metadata = metadataRecord(value, slug);
  const label = requiredText(metadata.title, slug);
  const description = requiredText(metadata.description, slug);
  const group = metadata.group as typeof docsGroupLabels[number];
  if (!docsGroupLabels.includes(group)) throw new Error(`${slug}: unknown group`);
  const validOrder = Number.isInteger(metadata.order) && Number(metadata.order) > 0;
  if (!validOrder || metadata.status !== 'draft') throw new Error(`${slug}: positive order and draft status required`);
  return { label, description, group, order: Number(metadata.order), status: 'draft' as const };
}
export function parsePublicDoc(slug: string, source: string): DocsPage {
  if (!/^[a-z][a-z0-9-]*$/.test(slug)) throw new Error(`Invalid Docs slug: ${slug}`);
  const { metadata, body } = readHeader(source, slug);
  const details = publicMetadata(metadata, slug);
  const { headings } = parseDocsMarkdown(body);
  if (!body || !headings.length) throw new Error(`${slug}: body and headings required`);
  return { slug, ...details, body, headings };
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
type MarkdownNode = { type: string; url?: string; children?: MarkdownNode[] };
function markdownLinks(node: MarkdownNode): string[] {
  if (node.type === 'link' && node.url) return [node.url];
  return node.children?.flatMap(markdownLinks) ?? [];
}
function linkError(page: DocsPage, pages: DocsPage[], url: string): string | undefined {
  const internal = url.startsWith('#') || url.startsWith('/docs/');
  if (!internal) return url.startsWith('https://') || url === '/' ? undefined : `${page.slug}: unsupported link ${url}`;
  const [route, anchor] = url.split('#');
  const slug = route ? route.slice('/docs/'.length) : page.slug;
  const target = pages.find((item) => item.slug === (docsAliases[slug] ?? slug));
  if (!target) return `${page.slug}: broken link ${url}`;
  if (anchor && !target.headings.some((heading) => heading.id === anchor)) return `${page.slug}: broken link ${url}`;
  return undefined;
}
export function validateDocsLinks(pages = getDocs()): string[] {
  return pages.flatMap((page) => {
    const links = markdownLinks(parseDocsMarkdown(page.body).tree);
    return links.map((url) => linkError(page, pages, url)).filter((error): error is string => error !== undefined);
  });
}
