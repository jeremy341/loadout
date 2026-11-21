"use client";

import { useState } from "react";

export type HackatimeProject = { name: string; hours: string };

// The Hackatime project picker for the links step: two columns, one row per project with its coding hours, its own scroll
// area. It draws nothing until there are projects, because Hackatime is not connected yet and the page must not show hours
// that are not real (see the links-step test). Ticking a row only changes this list until the connection and the link to a
// project exist.
export function HackatimeProjects({ projects }: Readonly<{ projects: readonly HackatimeProject[] }>) {
  const [picked, setPicked] = useState<readonly string[]>([]);
  if (projects.length === 0) return null;
  return (
    <section className="pf-wiz-hk" aria-labelledby="wiz-hk-heading">
      <h2 id="wiz-hk-heading">Hackatime projects</h2>
      <ul className="pf-wiz-hk-list" tabIndex={0} aria-label="Hackatime projects, scrollable">
        {projects.map((project) => (
          <li key={project.name}>
            <label className="pf-wiz-hk-row">
              <input
                type="checkbox"
                checked={picked.includes(project.name)}
                onChange={(event) => setPicked((current) => (event.target.checked ? [...current, project.name] : current.filter((name) => name !== project.name)))}
              />
              <span className="pf-wiz-hk-name">{project.name}</span>
              <span className="pf-wiz-hk-hours">{project.hours}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
