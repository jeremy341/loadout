import Link from "next/link";
import type { ToolUsedRow } from "@/lib/platform/profile-data";
import { handleLabel, summariseHandles } from "@/lib/platform/profile-view";
import "./profile.css";

type User = { id: string; handle: string | null };

// The Toolbelt on a profile, read only: the tools this builder has equipped (confirmed ones, in public projects) and the
// builders who use this builder's tools. Equipping itself happens on a project page.
export function ProfileToolbelt({ equipped, users, own }: Readonly<{ equipped: ToolUsedRow[]; users: User[]; own: boolean }>) {
  const withHandle = users.filter((user) => user.handle);
  const { shown, more } = summariseHandles(withHandle);
  const unnamed = users.length - withHandle.length;

  return (
    <section className="pf-box pf-prof-belt" aria-labelledby="belt-heading">
      <h2 id="belt-heading">Toolbelt</h2>
      <div className="pf-prof-belt-groups">
        <div>
          <h3>Equipped</h3>
          {equipped.length === 0 ? (
            <p className="pf-muted">
              {own ? (
                <>
                  No tools equipped yet. Equip one from a project page. <Link href="/dashboard/projects">Open Projects</Link>
                </>
              ) : (
                "Has not equipped any tools."
              )}
            </p>
          ) : (
            <ul className="pf-prof-tools">
              {equipped.map((row) => (
                <li key={row.id}>
                  <Link className="pf-prof-tool-title" href={`/dashboard/explore/${row.tool.id}`}>{row.tool.title}</Link>{" "}
                  <span className="pf-muted">
                    by{" "}
                    {row.tool.ownerHandle ? <Link href={`/dashboard/builders/${row.tool.ownerHandle}`}>{row.tool.ownerHandle}</Link> : handleLabel(null)}
                  </span>
                  <p className="pf-clamp pf-prof-note-line">{row.note}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3>Used by</h3>
          {users.length === 0 ? (
            <p className="pf-muted">{own ? "No one uses your tools yet." : "No one has equipped this builder's tools yet."}</p>
          ) : (
            <>
              <p>
                {users.length} {users.length === 1 ? "builder uses" : "builders use"} {own ? "your" : "this builder's"} tools.
              </p>
              <p className="pf-prof-handles">
                {shown.map((user) => (
                  <Link key={user.id} className="pf-prof-handle" href={`/dashboard/builders/${user.handle}`}>{user.handle}</Link>
                ))}
                {more + unnamed > 0 ? <span className="pf-muted">and {more + unnamed} more</span> : null}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
