import { execFileSync } from 'node:child_process';
import { parsePublicDoc } from '../app/docs/docs-source';

const [from, to] = process.argv.slice(2);
if (!from || !to || ![from, to].every((ref) => /^[a-f0-9]{7,40}$/i.test(ref))) {
  console.error('Usage: bun run docs:release-summary -- <previous-main-sha> <new-main-sha>');
  process.exit(1);
}
const changed = execFileSync('git', ['diff', '--name-only', `${from}..${to}`, '--', 'content/docs'], { encoding: 'utf8' }).trim().split(/\r?\n/).filter((file) => /^content\/docs\/[a-z][a-z0-9-]*\.md$/.test(file));
console.log('LOADOUT Docs updated — program draft');
console.log('https://loadout-ysws.vercel.app/docs/start');
for (const file of changed) {
  try {
    const source = execFileSync('git', ['show', `${to}:${file}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const slug = file.slice('content/docs/'.length, -3);
    const page = parsePublicDoc(slug, source);
    console.log(`- ${page.label}: https://loadout-ysws.vercel.app/docs/${slug}`);
  } catch {
    console.log(`- Retired topic: ${file.slice('content/docs/'.length, -3)} (check redirects before sharing).`);
  }
}
if (!changed.length) console.log('- Layout/navigation update; public topic files unchanged.');
console.log('Questions and corrections: #loadout-help. LOADOUT has not launched; pending values are not promises.');
console.log(`Source commit: ${to}. Post only after this Production deployment is verified.`);
