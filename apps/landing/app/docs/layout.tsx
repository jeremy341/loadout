import { Poppins } from "next/font/google";
import { PlatformShell } from "@/app/_components/platform/PlatformShell";
import { docsLayoutFor } from "@/lib/platform/docs-layout";
import { ledgerBalances } from "@/lib/platform/ledger-data";
import { getOwnProfile } from "@/lib/platform/profile-data";
import { DocsGuides } from "./DocsGuides";
import { docsViewer } from "./docs-viewer";
import { DocsShell } from "./docs-shell";
import { getDocsGroups } from "./docs-source";
import "./docs-embedded.css";

// Poppins is loaded on the docs only, as in the Pixl docs; the homepage keeps its own fonts.
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-poppins", display: "swap" });

// A signed-in participant reads the docs inside the platform shell; a visitor gets the public docs layout. Same pages either way.
export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const groups = getDocsGroups();
  const viewer = await docsViewer();
  if (docsLayoutFor(viewer) === "platform" && viewer) {
    const [{ confirmed, pending }, profile] = await Promise.all([ledgerBalances(viewer.id), getOwnProfile(viewer.id)]);
    return (
      <div className={poppins.variable} style={{ display: "contents" }}>
        <PlatformShell ore={confirmed} orePending={pending} handle={profile?.handle ?? null} docsSide={<DocsGuides groups={groups} />}>
          <div className="docs-embedded" data-docs-layout="platform">
            {children}
          </div>
        </PlatformShell>
      </div>
    );
  }
  return <div className={poppins.variable} style={{ display: "contents" }}><DocsShell groups={groups}>{children}</DocsShell></div>;
}
