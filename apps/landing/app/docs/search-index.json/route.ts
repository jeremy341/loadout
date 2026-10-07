import { getDocsSearchIndex } from '../docs-source';
export const dynamic = 'force-static';
export function GET() { return Response.json({ index: getDocsSearchIndex() }); }
