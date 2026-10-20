"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { EmptyState, PageHeader, PreviewNote, Status, Tag } from "@/components/ui/ui";
import { SAMPLE_PROJECTS } from "./data";
import { formatDay } from "./logic/activity";
import { allTags, filterProjects, paginate, sortProjects, type ProjectSort } from "./logic/query";
import { hiddenCount } from "./logic/moderation";
import { reactionCount, hasReacted } from "./logic/reactions";
import { DRAFT_RULES } from "./logic/rules";
import { makeRef } from "./logic/refs";
import { TRACK_LIST } from "./logic/validate";
import type { SampleProject, TrackName } from "./logic/types";
import { ME_HANDLE, nameOf, setLocationHash, useLocationHash, useModeration, useReactions, useSocial } from "./stores";
import { Byline, CaField, CommentThread, ConductLine, HiddenNotice, Pager, ReactionButton, ReportControl, focusById, useStatus } from "./shared";

// Explore: browse public projects and journals from other builders. Source of the feature set:
// plans/proposals/future-platform-ui.md ("Public project pages and journals", "Social and community").
// Projects below are SAMPLE data; likes, comments, follows and reports are saved only in this browser.

const HASH_PREFIX = "#project-";
const LIST_HEADING = "ca-explore-list";

function projectIdFromHash(hash: string): string | null {
  return hash.startsWith(HASH_PREFIX) ? decodeURIComponent(hash.slice(HASH_PREFIX.length)) : null;
}

export function ExplorePage() {
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState<TrackName | "all">("all");
  const [tag, setTag] = useState("all");
  const [sort, setSort] = useState<ProjectSort>("newest");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useStatus();
  const reactions = useReactions();
  const moderation = useModeration();
  const hash = useLocationHash();
  const openedByUser = useRef(false);
  const lastSelected = useRef<string | null>(null);

  const visible = useMemo(
    () => SAMPLE_PROJECTS.filter((p) => !moderation.state.hidden.includes(makeRef("project", p.id)) && !moderation.blocked.includes(p.handle)),
    [moderation.state.hidden, moderation.blocked],
  );
  const tags = useMemo(() => allTags(SAMPLE_PROJECTS), []);
  const filtered = filterProjects(visible, { query, track, tag }, nameOf);
  const likesOf = (p: SampleProject) => reactionCount(p.baseLikes, reactions.map, makeRef("project", p.id));
  const sorted = sortProjects(filtered, sort, likesOf);
  const pageInfo = paginate(sorted, page, DRAFT_RULES.projectsPerPage);

  const requestedId = projectIdFromHash(hash);
  const selected = requestedId ? visible.find((p) => p.id === requestedId) ?? null : null;
  const unavailable = requestedId !== null && selected === null;
  const selectedId = selected?.id ?? null;

  // Focus: entering the detail view moves focus to its heading (only when the participant opened it); leaving
  // returns focus to the card that opened it, or to the list heading if that card is gone.
  useEffect(() => {
    if (selectedId && openedByUser.current) {
      openedByUser.current = false;
      focusById(`ca-project-${selectedId}-title`);
    }
    if (!selectedId && lastSelected.current) {
      focusById(`ca-open-${lastSelected.current}`, LIST_HEADING);
    }
    lastSelected.current = selectedId;
  }, [selectedId]);

  function open(id: string) {
    openedByUser.current = true;
    setLocationHash(`${HASH_PREFIX}${encodeURIComponent(id)}`, "push");
  }

  function close() {
    setLocationHash("", "replace");
  }

  const hiddenProjects = hiddenCount(
    moderation.state,
    "project",
    SAMPLE_PROJECTS.map((p) => makeRef("project", p.id)),
  );
  const blockedProjects = SAMPLE_PROJECTS.filter((p) => moderation.blocked.includes(p.handle)).length;

  return (
    <>
      <PageHeader eyebrow="Community" title="Explore" lead="Browse public projects and journals from other builders." />
      <PreviewNote>
        The projects, journals, builders and like counts below are sample data. Your likes, comments, follows and reports are saved only in this browser. Nothing is sent to LOADOUT.
      </PreviewNote>
      <Status message={status} />
      <div className="pg-stack">
        {selected ? (
          <ProjectDetail
            project={selected}
            likes={likesOf(selected)}
            liked={hasReacted(reactions.map, makeRef("project", selected.id), ME_HANDLE)}
            onLike={() => reactions.toggle(makeRef("project", selected.id))}
            onBack={close}
            onStatus={setStatus}
            onHidden={() => close()}
          />
        ) : (
          <section className="pn" aria-labelledby={LIST_HEADING}>
            <div className="pn-head">
              <h2 id={LIST_HEADING} tabIndex={-1}>
                Public projects
              </h2>
            </div>
            {unavailable ? (
              <p className="ca-warn" role="status">
                That project is not available. It may be hidden for you or from a blocked builder.
              </p>
            ) : null}
            <form
              className="toolbar"
              role="search"
              aria-label="Search and filter projects"
              onSubmit={(event) => event.preventDefault()}
            >
              <CaField id="ca-ex-q" label="Search projects" hint="Matches title, summary, builder and tags.">
                {(aria) => (
                  <input
                    {...aria}
                    type="search"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                )}
              </CaField>
              <CaField id="ca-ex-track" label="Track">
                {(aria) => (
                  <select
                    {...aria}
                    value={track}
                    onChange={(e) => {
                      setTrack(e.target.value as TrackName | "all");
                      setPage(1);
                    }}
                  >
                    <option value="all">All tracks</option>
                    {TRACK_LIST.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                )}
              </CaField>
              <CaField id="ca-ex-tag" label="Tag">
                {(aria) => (
                  <select
                    {...aria}
                    value={tag}
                    onChange={(e) => {
                      setTag(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">All tags</option>
                    {tags.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                )}
              </CaField>
              <CaField id="ca-ex-sort" label="Sort by">
                {(aria) => (
                  <select
                    {...aria}
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value as ProjectSort);
                      setPage(1);
                    }}
                  >
                    <option value="newest">Newest</option>
                    <option value="liked">Most liked</option>
                  </select>
                )}
              </CaField>
              {query || track !== "all" || tag !== "all" ? (
                <button
                  type="button"
                  className="btn btn-sm btn-quiet"
                  onClick={() => {
                    setQuery("");
                    setTrack("all");
                    setTag("all");
                    setPage(1);
                    setStatus("Filters cleared.");
                  }}
                >
                  Clear filters
                </button>
              ) : null}
            </form>

            {pageInfo.total === 0 ? (
              <EmptyState title="No projects match">
                {visible.length === 0 ? "Every sample project is hidden or blocked. Show them again below or in Friends." : "Try a different search, or clear the filters."}
              </EmptyState>
            ) : (
              <ul className="card-grid" aria-label={`Projects, page ${pageInfo.page} of ${pageInfo.pageCount}`}>
                {pageInfo.items.map((p) => (
                  <li key={p.id}>
                    <ProjectCard
                      project={p}
                      likes={likesOf(p)}
                      liked={hasReacted(reactions.map, makeRef("project", p.id), ME_HANDLE)}
                      onLike={() => reactions.toggle(makeRef("project", p.id))}
                      onOpen={() => open(p.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
            <Pager
              page={pageInfo.page}
              pageCount={pageInfo.pageCount}
              from={pageInfo.from}
              to={pageInfo.to}
              total={pageInfo.total}
              noun="projects"
              focusId={LIST_HEADING}
              onPage={setPage}
            />
            <HiddenNotice
              count={hiddenProjects}
              noun="project"
              onShow={() => {
                moderation.unhideAll("project");
                setStatus("Hidden projects are showing again.");
              }}
            />
            {blockedProjects > 0 ? (
              <p className="ca-hidden-note">
                {blockedProjects} project{blockedProjects === 1 ? " is" : "s are"} hidden because you blocked their builder. Unblock builders in Friends.
              </p>
            ) : null}
          </section>
        )}
        <ConductLine />
      </div>
    </>
  );
}

function ProjectCard({
  project,
  likes,
  liked,
  onLike,
  onOpen,
}: {
  project: SampleProject;
  likes: number;
  liked: boolean;
  onLike: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="ca-card" aria-labelledby={`ca-card-${project.id}`}>
      <h3 id={`ca-card-${project.id}`}>{project.title}</h3>
      <p className="ca-meta">
        <Byline handle={project.handle} />
        <Tag tone="accent">{project.track}</Tag>
      </p>
      <p>{project.summary}</p>
      <ul className="ca-tags" aria-label="Tags">
        {project.tags.map((t) => (
          <li key={t}>
            <Tag>{t}</Tag>
          </li>
        ))}
      </ul>
      <div className="ca-card-foot">
        <button id={`ca-open-${project.id}`} type="button" className="btn btn-sm" onClick={onOpen}>
          View project<span className="sr-only">: {project.title}</span>
        </button>
        <ReactionButton verb="Like" doneVerb="Liked" pressed={liked} count={likes} subject={project.title} onToggle={onLike} />
      </div>
    </article>
  );
}

function ProjectDetail({
  project,
  likes,
  liked,
  onLike,
  onBack,
  onStatus,
  onHidden,
}: {
  project: SampleProject;
  likes: number;
  liked: boolean;
  onLike: () => void;
  onBack: () => void;
  onStatus: (message: string) => void;
  onHidden: () => void;
}) {
  const titleId = `ca-project-${project.id}-title`;
  const social = useSocial();
  const following = social.social.following.includes(project.handle);
  const journals = [...project.journals].sort((a, b) => (a.at < b.at ? 1 : -1));
  const shareId = useId();
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const urlField = useRef<HTMLInputElement>(null);

  async function share() {
    const url = `${window.location.origin}${window.location.pathname}${HASH_PREFIX}${encodeURIComponent(project.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      setFallbackUrl(null);
      onStatus("Link copied to the clipboard.");
    } catch {
      setFallbackUrl(url);
      onStatus("Your browser blocked copying. The link is selected below; press Ctrl+C or Cmd+C to copy it.");
      window.setTimeout(() => {
        urlField.current?.focus();
        urlField.current?.select();
      }, 0);
    }
  }

  return (
    <section className="pn ca-detail" aria-labelledby={titleId}>
      <div>
        <button type="button" className="btn btn-sm btn-quiet" onClick={onBack}>
          Back to all projects
        </button>
      </div>
      <header>
        <h2 id={titleId} tabIndex={-1}>
          {project.title}
        </h2>
        <p className="ca-meta">
          <Byline handle={project.handle} at={project.at} />
          <Tag tone="accent">{project.track}</Tag>
        </p>
        <p>{project.summary}</p>
        <ul className="ca-tags" aria-label="Tags">
          {project.tags.map((t) => (
            <li key={t}>
              <Tag>{t}</Tag>
            </li>
          ))}
        </ul>
        <p className="mut">
          Source: <span className="ca-link">{project.repoText}</span> (sample text, not a live link; this preview makes no network calls)
        </p>
      </header>

      <div className="ca-actions" role="group" aria-label={`Actions for ${project.title}`}>
        <ReactionButton verb="Like" doneVerb="Liked" pressed={liked} count={likes} subject={project.title} onToggle={onLike} />
        <button
          type="button"
          className={following ? "btn btn-sm btn-quiet" : "btn btn-sm"}
          onClick={() => {
            const result = following ? social.unfollow(project.handle) : social.follow(project.handle);
            onStatus(result.message);
          }}
        >
          {following ? "Unfollow" : "Follow"} {nameOf(project.handle)}
        </button>
        <button type="button" className="btn btn-sm btn-quiet" onClick={share}>
          Copy link to this project
        </button>
        <ReportControl
          kind="project"
          itemId={project.id}
          label={project.title}
          authorHandle={project.handle}
          onDone={(message) => {
            onStatus(message);
            onHidden();
          }}
        />
      </div>

      {fallbackUrl ? (
        <div className="ca-share">
          <label htmlFor={`${shareId}-url`} className="fld-label">
            Link to copy
          </label>
          <input id={`${shareId}-url`} ref={urlField} readOnly value={fallbackUrl} onFocus={(e) => e.currentTarget.select()} />
        </div>
      ) : null}

      {project.track === "Hardware" ? (
        <p className="ca-note">Lapse recordings are visible only to reviewers. This page shows the public project and journal only.</p>
      ) : null}

      <div>
        <h3>Journal ({journals.length})</h3>
        {journals.length === 0 ? (
          <p className="mut">No journal entries yet.</p>
        ) : (
          <ul className="ca-journal">
            {journals.map((j) => (
              <li key={j.id}>
                <h4>{j.title}</h4>
                <p className="mut">
                  <time dateTime={j.at}>{formatDay(j.at)}</time>
                </p>
                <p className="ca-body">{j.excerpt}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CommentThread kind="project" itemId={project.id} itemTitle={project.title} headingId={`ca-project-${project.id}-comments`} onStatus={onStatus} />
    </section>
  );
}
