import type { ReactNode } from "react";
import { PageHead } from "@/app/_components/platform/PageHead";
import { CommunityTabs } from "@/app/_components/platform/community/CommunityTabs";

// The top of every Community list page: the title and lead, then the row of Community pages under them, so the tabs read as
// belonging to the page and the heading comes first in reading order. Detail pages have a back link instead of the tabs.
export function CommunityHead({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <>
      <PageHead title={title}>{children}</PageHead>
      <p className="cm-staging">
        <strong>Sample data.</strong> Ideas, Show &amp; Tell sessions and the Era strip are sample content. Voting is not connected. This is a staging build.
      </p>
      <CommunityTabs />
    </>
  );
}
