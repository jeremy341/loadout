import GithubSlugger from 'github-slugger';
import { toString } from 'mdast-util-to-string';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { Root, Heading } from 'mdast';
import type { DocsHeading } from './docs-data';

function explicitHeadingId(node: Heading): string | undefined {
  const explicit = toString(node).match(/\s+\{#([a-z][a-z0-9-]*)\}$/);
  if (!explicit) return undefined;
  const last = node.children.at(-1);
  if (last?.type === 'text') last.value = last.value.replace(/\s+\{#[a-z][a-z0-9-]*\}$/, '');
  return explicit[1];
}
function describeHeading(node: Heading, slugger: GithubSlugger): DocsHeading {
  if (![2, 3].includes(node.depth)) throw new Error('Docs use H2/H3 headings beneath the page title');
  const explicit = explicitHeadingId(node);
  const text = toString(node).trim();
  const id = explicit ?? slugger.slug(text);
  node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
  return { id, text, depth: node.depth as 2 | 3 };
}
function assignHeadings(tree: Root): DocsHeading[] {
  const slugger = new GithubSlugger();
  const headings = tree.children.filter((node): node is Heading => node.type === 'heading').map((node) => describeHeading(node, slugger));
  const ids = new Set<string>();
  for (const { id } of headings) {
    if (!id || ids.has(id)) throw new Error(`Duplicate or empty heading id: ${id}`);
    ids.add(id);
  }
  return headings;
}
export function remarkDocsHeadings() {
  return (tree: Root) => { assignHeadings(tree); };
}
export function parseDocsMarkdown(body: string) {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(body);
  const headings = assignHeadings(tree);
  const sections: { id: string; heading: string; text: string }[] = [{ id: '', heading: '', text: '' }];
  for (const node of tree.children) {
    if (node.type === 'html') continue;
    if (node.type === 'heading') {
      sections.push({ id: String(node.data?.hProperties?.id), heading: toString(node), text: '' });
    } else sections.at(-1)!.text += `${toString(node)} `;
  }
  return { tree, headings, sections };
}
