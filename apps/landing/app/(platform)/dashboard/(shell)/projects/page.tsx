import type { Metadata } from "next";
import { EmptyState } from "@/app/_components/platform/PlatformNotice";
import { db } from "@/lib/platform/db";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Projects - LOADOUT" };

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });

export default async function ProjectsPage() {
  const viewer = await requireViewer();
  const projects = await db().project.findMany({
    where: { ownerId: viewer.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <>
      <h1>Projects</h1>
      <p className="pf-lead">Projects you are building. Creating one opens in a later release.</p>
      {projects.length === 0 ? (
        <EmptyState title="No projects yet">
          When projects open, your builds will appear here with their status.
        </EmptyState>
      ) : (
        <div className="pf-table-wrap">
          <table className="pf-table">
            <caption className="pf-hint">Your projects, newest first</caption>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Status</th>
                <th scope="col">Created</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>{project.title}</td>
                  <td>{project.status}</td>
                  <td>{dateFormat.format(project.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
