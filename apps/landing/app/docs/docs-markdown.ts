import GithubSlugger from 'github-slugger';
import { toString } from 'mdast-util-to-string';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { Root } from 'mdast';
import type { DocsHeading } from './docs-data';

function assignHeadings(tree: Root): DocsHeading[] {
  const slugger = new GithubSlugger();
  const ids = new Set<string>();
  const headings: DocsHeading[] = [];
  for (const node of tree.children) {
    if (node.type !== 'heading') continue;
    if (node.depth < 2 || node.depth > 3) throw new Error('Docs use H2/H3 headings beneath the page title');
    const text = toString(node);
    const explicit = text.match(/\s+\{#([a-z][a-z0-9-]*)\}$/);
    if (explicit) {
      const last = node.children.at(-1);
      if (last?.type === 'text') last.value = last.value.replace(/\s+\{#[a-z][a-z0-9-]*\}$/, '');
    }
    const label = toString(node).trim();
    const id = explicit?.[1] ?? slugger.slug(label);
    if (!id || ids.has(id)) throw new Error(`Duplicate or empty heading id: ${id}`);
    ids.add(id);
    node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
    headings.push({ id, text: label, depth: node.depth as 2 | 3 });
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
