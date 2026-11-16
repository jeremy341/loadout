import Link from "next/link";
import type { ProfileProjectRow } from "@/lib/platform/profile-data";
import { MAX_PINNED, normalizeStatus } from "@/lib/platform/profile";
import {
  filterProjects,
  ownProjectTag,
  ownTabs,
  profileHref,
  projectCountLabel,
  publicTabs,
  tabLabel,
  type ProfileQuery,
} from "@/lib/platform/profile-view";
import { EXPLORE_PAGE_SIZE } from "@/lib/platform/explore";
import { TRACKS } from "@/lib/platform/progress";
import { ProjectCard } from "./ProjectCard";
import { ProfileListStatus, ProjectVisibilityControls } from "./ProjectVisibilityControls";
import "./profile.css";

const PRIVATE_STATES = ["draft", "submitted", "in-review", "needs-changes"];

// The list of projects on a profile: a status row and a track row (links, so the state lives in the address and survives a
// reload), then the same two-across grid as the Projects tab. Your own view lists every project with the controls that
// decide what others see; the public view lists only what they may see.
export function ProfileProjects({ rows, query, base, own }: Readonly<{ rows: ProfileProjectRow[]; query: ProfileQuery; base: string; own: boolean }>) {
  const tabs = own ? ownTabs(rows) : publicTabs(rows);
  const shown = filterProjects(rows, query).slice(0, EXPLORE_PAGE_SIZE);
  const pinnedCount = rows.filter((row) => row.pinned && !row.hidden && normalizeStatus(row.status) === "approved").length;
  const hasPrivate = own && rows.some((row) => PRIVATE_STATES.includes(normalizeStatus(row.status)));
  const href = (next: Partial<ProfileQuery>) => profileHref(base, { ...query, ...next }, own);

  return (
    <section className="pf-prof-section" id="profile-projects" aria-labelledby="profile-projects-heading">
      <h2 id="profile-projects-heading">Projects</h2>

      {rows.length === 0 ? (
        own ? (
          <p className="pf-empty-line">
            No projects yet. <Link href="/dashboard/projects">Start one from Projects</Link>
          </p>
        ) : (
          <p className="pf-empty-line">No public projects yet.</p>
        )
      ) : (
        <>
          <nav className="pf-explore-filters pf-prof-filters" aria-label="Project status">
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                href={href({ tab: tab.key as ProfileQuery["tab"] })}
                aria-current={tab.key === query.tab ? "page" : undefined}
                aria-label={projectCountLabel(tab.label, tab.count)}
                data-zero={tab.count === 0 ? "true" : undefined}
              >
                {tab.label} <span className="pf-prof-n">{tab.count}</span>
              </Link>
            ))}
          </nav>
          <nav className="pf-explore-filters pf-prof-filters" aria-label="Filter by track">
            {[null, ...TRACKS].map((item) => (
              <Link key={item ?? "all"} href={href({ track: item })} aria-current={item === query.track ? "page" : undefined}>
                {item ?? "All tracks"}
              </Link>
            ))}
          </nav>
          {own ? (
            <p className="pf-hint pf-prof-note">
              {hasPrivate ? "Private until approved. " : ""}
              <Link href="/dashboard/projects">Start a project</Link>
            </p>
          ) : query.tab === "building" ? (
            <p className="pf-hint pf-prof-note">Projects this builder is working on now.</p>
          ) : null}

          {shown.length === 0 ? (
            <p className="pf-empty-line">
              {query.track ? (
                <>
                  No projects match. <Link href={href({ track: null })}>Clear the filter</Link>
                </>
              ) : (
                <>
                  No {tabLabel(query.tab)} projects. {own ? <Link href={href({ tab: "all" })}>Show all</Link> : null}
                </>
              )}
            </p>
          ) : (
            <ProfileListStatus>
              <ul className="pf-project-grid">
                {shown.map((row) => {
                  const status = normalizeStatus(row.status);
                  return (
                    <li key={row.id}>
                      <div className="pf-prof-item">
                        <ProjectCard
                          project={{ id: row.id, title: row.title, description: row.description, track: row.track, status: row.status }}
                          profile={{ usedBy: row.usedBy, openSource: Boolean(row.repoUrl) }}
                        />
                        {own ? (
                          <ProjectVisibilityControls
                            key={row.id}
                            id={row.id}
                            title={row.title}
                            status={status === "approved" ? "approved" : status === "logging" ? "logging" : "other"}
                            pinned={row.pinned}
                            hidden={row.hidden}
                            showBuilding={row.showBuilding}
                            pinnedCount={pinnedCount}
                            max={MAX_PINNED}
                            tag={ownProjectTag(row)}
                          />
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ProfileListStatus>
          )}
        </>
      )}
    </section>
  );
}
