import { describe, expect, test } from 'bun:test';
import MiniSearch from 'minisearch';
import { docsAliases, docsGroupLabels } from './docs-data';
import { getDocs, getDocsGroups, getDocsSearchIndex, parsePublicDoc, validateDocsLinks } from './docs-source';
import { parseDocsMarkdown } from './docs-markdown';
import { docsSearchOptions } from './search-options';

describe('participant documentation scope', () => {
  const pages = getDocs();
  test('all public draft topics have a unique source and ordered directory', () => {
    expect(getDocsGroups().map((group) => group.label)).toEqual([...docsGroupLabels]);
    expect(pages).toHaveLength(18);
    expect(new Set(pages.map((page) => page.slug)).size).toBe(18);
    for (const slug of ['start','projects','shipping','review','progress','prizes','eras','irl','faq']) expect(pages.some((page) => page.slug === slug)).toBe(true);
    expect(pages.every((page) => page.status === 'draft')).toBe(true);
  });
  test('preserves existing heading links and redirects', () => {
    expect(pages.find((page) => page.slug === 'start')?.headings.map((heading) => heading.id)).toContain('status');
    expect(pages.find((page) => page.slug === 'prizes')?.headings.map((heading) => heading.id)).toContain('custom-orders');
    for (const [alias, target] of Object.entries(docsAliases)) {
      expect(pages.some((page) => page.slug === alias)).toBe(false);
      expect(pages.some((page) => page.slug === target)).toBe(true);
    }
    expect(validateDocsLinks(pages)).toEqual([]);
  });
  test('searches public explanation text and points to matching heading anchors', () => {
    const search = MiniSearch.loadJSON(JSON.stringify(getDocsSearchIndex()), docsSearchOptions);
    const result = search.search('Requisition');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => String(item.url).startsWith('/docs/'))).toBe(true);
    expect(result.some((item) => String(item.url).startsWith('/docs/requisitions#'))).toBe(true);
    for (const query of ['CodeScene','GitHub CLI','bootstrap prompt','branch protection']) expect(search.search(query)).toEqual([]);
  });
  test('excludes internal documents and unpublished economy calibration', () => {
    const text = pages.map((page) => page.body).join(' ');
    expect(text).not.toMatch(/GitHub CLI|CodeScene|branch protection|promotion PR|bootstrap prompt|PLAN\/|40%|\+10%|\b14 days\b/);
    for (const slug of ['contributing','architecture','references','operations','library','plans']) expect(pages.some((page) => page.slug === slug)).toBe(false);
    expect(text).toContain('Originality');
    expect(text).toContain('Technical Depth');
    expect(text).toContain('Execution');
    expect(text).toContain('Documentation');
  });
  test('rejects metadata that could accidentally expose a nonpublic document', () => {
    const source = '---\ntitle: Test\ndescription: Test page\ngroup: START HERE\norder: 1\nstatus: draft\n---\n## Overview\nBody';
    expect(parsePublicDoc('example', source).label).toBe('Test');
    expect(() => parsePublicDoc('../PLAN', source)).toThrow('slug');
    expect(() => parsePublicDoc('example', source.replace('status: draft', 'status: live'))).toThrow('draft');
    expect(() => parsePublicDoc('example', source.replace('START HERE', 'INTERNAL'))).toThrow('group');
    expect(() => parsePublicDoc('example', source.replace('order: 1', 'private: false\norder: 1'))).toThrow('keys');
  });
  test('assigns shared H2/H3 IDs and rejects conflicting explicit anchors', () => {
    const parsed = parseDocsMarkdown('## New wording {#old-id}\nBody\n### Evidence\nMore\n## Evidence');
    expect(parsed.headings).toEqual([{id:'old-id',text:'New wording',depth:2},{id:'evidence',text:'Evidence',depth:3},{id:'evidence-1',text:'Evidence',depth:2}]);
    expect(() => parseDocsMarkdown('## One {#same}\n## Two {#same}')).toThrow('Duplicate');
    expect(() => parseDocsMarkdown('# A second page title')).toThrow('H2/H3');
    expect(validateDocsLinks([parsePublicDoc('example', '---\ntitle: T\ndescription: D\ngroup: START HERE\norder: 1\nstatus: draft\n---\n## Overview\n[Missing](/docs/not-a-topic)')])).toEqual(['example: broken link /docs/not-a-topic']);
  });
});
