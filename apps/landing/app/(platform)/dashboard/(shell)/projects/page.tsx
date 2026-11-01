import type { Metadata } from "next";
import { CoreGauge } from "@/app/_components/platform/CoreGauge";
import { DepthValue } from "@/app/_components/platform/DepthValue";
import { NewProjectDialog, OpenNewProjectButton } from "@/app/_components/platform/NewProjectDialog";
import { ProjectCard } from "@/app/_components/platform/ProjectCard";
import { db } from "@/lib/platform/db";
import { oreBalance, projectHours, sumHours } from "@/lib/platform/progress";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Projects - LOADOUT" };

// The Stasis projects page in LOADOUT's own style, in Stasis's order: a progress card (the core gauge), a stats bar
// with the primary action, two panels, then the project grid with the New Project card first. Designed in Paper
// (file "LOADOUT participant platform", page "E - Projects"). Hours logged is left out until hours exist.
export default async function ProjectsPage() {
  const viewer = await requireViewer();
  const [projects, projectCount] = await Promise.all([
    db().project.findMany({
      where: { ownerId: viewer.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db().project.count({ where: { ownerId: viewer.id } }),
  ]);
  // Account depth: every approved hour is one metre, summed over the projects.
  const depth = sumHours(projects.map((project) => projectHours(project.id)));

  return (
    <>
      <h1 className="pf-sr">Projects</h1>

      <CoreGauge />

      <div className="pf-stats">
        <dl className="pf-stat-list">
          <div>
            <dt>Ore earned</dt>
            <dd>{oreBalance().toLocaleString("en-GB")}</dd>
          </div>
          <div>
            <dt>Cores drilled</dt>
            <dd>{projectCount}</dd>
          </div>
          <div>
            <dt>Depth</dt>
            <dd>
              <DepthValue hours={depth} />
            </dd>
          </div>
        </dl>
        <OpenNewProjectButton />
      </div>

      <div className="pf-split">
        <section className="pf-plain-panel" aria-labelledby="journal-heading">
          <h2 id="journal-heading">Recent journal entries</h2>
          <p>No journal entries yet. Journals open in a later release.</p>
        </section>
        <section className="pf-plain-panel" aria-labelledby="events-heading">
          <h2 id="events-heading">Upcoming events</h2>
          <p>No upcoming events.</p>
        </section>
      </div>

      <ul className="pf-project-grid">
        <li>
          <NewProjectDialog />
        </li>
        {projects.map((project) => (
          <li key={project.id}>
            <ProjectCard project={project} />
          </li>
        ))}
      </ul>
      {projects.length === 0 ? <p className="pf-empty-line">No projects yet. Create your first one!</p> : null}
    </>
  );
}
