import type { Metadata } from "next";
import { NewProjectWizard } from "@/app/_components/platform/NewProjectWizard";
import { eligibilityRefusal } from "@/lib/platform/eligibility-gate";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "New project - LOADOUT" };

// The project creation wizard: five steps on one page (design brief .ulpi/design/redesign-phase-2-wizard.md). Old projects with no
// track are not affected; a new project always has one.
export default async function NewProjectPage() {
  const viewer = await requireViewer();
  const refusal = await eligibilityRefusal(viewer);
  if (refusal) {
    return (
      <>
        <h1>New project</h1>
        <p className="pf-lead">{refusal}</p>
      </>
    );
  }
  return <NewProjectWizard />;
}
