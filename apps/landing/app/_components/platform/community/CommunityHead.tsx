import type { ReactNode } from "react";
import { PageHead } from "@/app/_components/platform/PageHead";
import { CommunityTabs } from "@/app/_components/platform/community/CommunityTabs";
import { EraBanner } from "@/app/_components/platform/community/EraBanner";

// The top of every Community list page: the title and lead, one quiet line about the sample numbers, then the row of Community
// pages, so the tabs read as belonging to the page and the heading comes first in reading order. Every page except the
// Overview then carries the slim Era banner. Detail pages have a back link instead of the tabs.
export function CommunityHead({ title, children, era = true }: Readonly<{ title: string; children: ReactNode; era?: boolean }>) {
  return (
    <>
      <PageHead title={title}>{children}</PageHead>
      <p className="cm-staging">Sample Era numbers, ideas and sessions. Closed beta.</p>
      <CommunityTabs />
      {era ? <EraBanner /> : null}
    </>
  );
}
