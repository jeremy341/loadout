import { DocsShell } from "./docs-shell";
import { getDocsGroups } from './docs-source';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsShell groups={getDocsGroups()}>{children}</DocsShell>;
}
