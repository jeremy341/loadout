import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

describe('public Markdown source', () => {
  test('all twenty-six public draft pages have one flat canonical source', () => {
    const directory = resolve(import.meta.dir, '../../../../content/docs');
    expect(existsSync(directory)).toBe(true);
    expect(readdirSync(directory).filter((file) => file.endsWith('.md'))).toHaveLength(26);
  });
});
