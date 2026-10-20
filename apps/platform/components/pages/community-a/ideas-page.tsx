"use client";

import { useId, useMemo, useState } from "react";
import { EmptyState, PageHeader, PreviewNote, Status, Tag } from "@/components/ui/ui";
import { DRAFT_RULES } from "./data";
import { canChangeStatus } from "./logic/content";
import { filterIdeas, paginate, sortIdeas, type IdeaSort } from "./logic/query";
import { hiddenCount } from "./logic/moderation";
import { hasReacted, reactionCount } from "./logic/reactions";
import { makeRef } from "./logic/refs";
import { nextCandidate } from "./logic/social";
import { findSimilarTitle } from "./logic/text";
import { IDEA_TRACKS, type IdeaDraft, type IdeaField } from "./logic/validate";
import type { Idea, IdeaStatus, IdeaTrack } from "./logic/types";
import { ME_HANDLE, SAMPLE_HANDLES, nameOf, useComments, useIdeas, useModeration, useReactions } from "./stores";
import {
  Byline,
  CaField,
  CharCount,
  CommentThread,
  ConductLine,
  ConfirmButton,
  DraftRuleNote,
  HiddenNotice,
  Pager,
  PreviewTools,
  ReactionButton,
  ReportControl,
  focusById,
  useStatus,
} from "./shared";

// Ideas: a public idea board with upvotes (plans/proposals/future-platform-ui.md "a public idea board, upvotes").
// Behaviour pattern (new/top ordering, one upvote per idea) follows Pixl's ideas page; see SOURCES.md.
// Statuses are a Draft preview rule: sample ideas show Open, Planned or Done; a participant can only withdraw
// (or reopen) their own idea and can never set Planned or Done.

const LIST_HEADING = "ca-ideas-list";
const STATUSES: IdeaStatus[] = ["Open", "Planned", "Done", "Withdrawn"];

const STATUS_TONE: Record<IdeaStatus, "plain" | "accent" | "ok" | "warn"> = {
  Open: "plain",
  Planned: "accent",
  Done: "ok",
  Withdrawn: "warn",
};

export function IdeasPage() {
  const ideas = useIdeas();
  const comments = useComments();
  const reactions = useReactions();
  const moderation = useModeration();
  const [status, setStatus] = useStatus();
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState<IdeaTrack | "all">("all");
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | "all">("all");
  const [sort, setSort] = useState<IdeaSort>("top");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openThreads, setOpenThreads] = useState<Record<string, boolean>>({});

  const votesOf = (i: Idea) => reactionCount(i.baseVotes, reactions.map, makeRef("idea", i.id));
  const visible = useMemo(
    () =>
      ideas.all.filter(
        (i) => i.handle === ME_HANDLE || (!moderation.state.hidden.includes(makeRef("idea", i.id)) && !moderation.blocked.includes(i.handle)),
      ),
    [ideas.all, moderation.state.hidden, moderation.blocked],
  );
  const filtered = filterIdeas(visible, { query, track, status: statusFilter }, nameOf);
  const sorted = sortIdeas(filtered, sort, votesOf);
  const pageInfo = paginate(sorted, page, DRAFT_RULES.ideasPerPage);
  const hiddenIdeas = hiddenCount(
    moderation.state,
    "idea",
    ideas.all.map((i) => makeRef("idea", i.id)),
  );

  function simulateReaction() {
    const newest = ideas.mine[0];
    if (!newest) {
      setStatus("Post an idea first, then try the preview tool.");
      return;
    }
    const ref = makeRef("idea", newest.id);
    const voter = nextCandidate(SAMPLE_HANDLES, reactions.map[ref] ?? [], moderation.blocked);
    if (voter) reactions.add(ref, voter);
    const result = comments.simulateReply(ref, newest.title, "/ideas");
    setStatus(result.message);
  }

  function simulateStatus() {
    const target = ideas.all.find(
      (i) => i.handle !== ME_HANDLE && i.status === "Open" && hasReacted(reactions.map, makeRef("idea", i.id), ME_HANDLE),
    );
    setStatus(ideas.simulateStatusChange(target).message);
  }

  return (
    <>
      <PageHeader eyebrow="Community" title="Ideas" lead="A public idea board where builders post and upvote ideas." />
      <PreviewNote>
        The ideas, upvote counts and the Planned and Done labels are sample data, not program decisions. Your ideas, votes and comments are saved only in this browser.
      </PreviewNote>
      <Status message={status} />
      <div className="pg-stack">
        <section className="pn" aria-labelledby="ca-ideas-compose-h">
          <div className="pn-head">
            <h2 id="ca-ideas-compose-h">Post an idea</h2>
          </div>
          <IdeaForm
            idPrefix="ca-idea-new"
            heading="New idea"
            submitLabel="Post idea"
            existing={ideas.all}
            resetOnSuccess
            onSubmit={(draft) => {
              const result = ideas.add(draft);
              if (result.ok) {
                setQuery("");
                setTrack("all");
                setStatusFilter("all");
                setSort("new");
                setPage(1);
                setStatus(`${result.message} It is at the top of the New list.`);
                focusById(`ca-idea-${result.id}-title`);
              }
              return result;
            }}
          />
          <div className="ca-stack ca-after">
            <DraftRuleNote>
              Titles up to {DRAFT_RULES.ideaTitleMax} characters, descriptions up to {DRAFT_RULES.ideaBodyMax}, at most {DRAFT_RULES.rate.ideasPerDay} new ideas per day. Statuses are Open, Planned, Done and Withdrawn. You can only withdraw or reopen your own idea; Planned and Done appear on sample ideas only.
            </DraftRuleNote>
          </div>
        </section>

        <section className="pn" aria-labelledby={LIST_HEADING}>
          <div className="pn-head">
            <h2 id={LIST_HEADING} tabIndex={-1}>
              Idea board
            </h2>
          </div>
          <form className="toolbar" role="search" aria-label="Search and filter ideas" onSubmit={(e) => e.preventDefault()}>
            <CaField id="ca-id-q" label="Search ideas">
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
            <CaField id="ca-id-track" label="Track">
              {(aria) => (
                <select
                  {...aria}
                  value={track}
                  onChange={(e) => {
                    setTrack(e.target.value as IdeaTrack | "all");
                    setPage(1);
                  }}
                >
                  <option value="all">All tracks</option>
                  {IDEA_TRACKS.map((t) => (
                    <option key={t} value={t}>
                      {t === "Any" ? "Any track" : t}
                    </option>
                  ))}
                </select>
              )}
            </CaField>
            <CaField id="ca-id-status" label="Status">
              {(aria) => (
                <select
                  {...aria}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as IdeaStatus | "all");
                    setPage(1);
                  }}
                >
                  <option value="all">All statuses</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </CaField>
            <CaField id="ca-id-sort" label="Sort by">
              {(aria) => (
                <select
                  {...aria}
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as IdeaSort);
                    setPage(1);
                  }}
                >
                  <option value="top">Top (most upvotes)</option>
                  <option value="new">New</option>
                </select>
              )}
            </CaField>
            {query || track !== "all" || statusFilter !== "all" ? (
              <button
                type="button"
                className="btn btn-sm btn-quiet"
                onClick={() => {
                  setQuery("");
                  setTrack("all");
                  setStatusFilter("all");
                  setPage(1);
                  setStatus("Filters cleared.");
                }}
              >
                Clear filters
              </button>
            ) : null}
          </form>

          {pageInfo.total === 0 ? (
            <EmptyState title="No ideas match">
              {visible.length === 0 ? "The board is empty. Post the first idea above." : "Try a different search, or clear the filters."}
            </EmptyState>
          ) : (
            <ul className="row-list" aria-label={`Ideas, page ${pageInfo.page} of ${pageInfo.pageCount}`}>
              {pageInfo.items.map((idea) => (
                <li key={idea.id}>
                  <IdeaCard
                    idea={idea}
                    votes={votesOf(idea)}
                    voted={hasReacted(reactions.map, makeRef("idea", idea.id), ME_HANDLE)}
                    editing={editingId === idea.id}
                    threadOpen={openThreads[idea.id] === true}
                    commentCount={comments.all.filter((c) => c.ref === makeRef("idea", idea.id) && !moderation.blocked.includes(c.handle) && !moderation.state.hidden.includes(makeRef("comment", c.id))).length}
                    allIdeas={ideas.all}
                    onVote={() => reactions.toggle(makeRef("idea", idea.id))}
                    onToggleThread={() => setOpenThreads((prev) => ({ ...prev, [idea.id]: !prev[idea.id] }))}
                    onEdit={() => setEditingId(idea.id)}
                    onCancelEdit={() => {
                      setEditingId(null);
                      focusById(`ca-idea-${idea.id}-title`);
                    }}
                    onSave={(draft) => {
                      const result = ideas.edit(idea.id, draft);
                      if (result.ok) {
                        setEditingId(null);
                        setStatus(result.message);
                        focusById(`ca-idea-${idea.id}-title`);
                      }
                      return result;
                    }}
                    onStatus={(next) => {
                      const result = ideas.setStatus(idea.id, next);
                      setStatus(result.message);
                    }}
                    onDelete={() => {
                      const result = ideas.remove(idea.id);
                      setStatus(result.message);
                      focusById(LIST_HEADING);
                    }}
                    onMessage={(message) => {
                      setStatus(message);
                      focusById(LIST_HEADING);
                    }}
                    onThreadMessage={setStatus}
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
            noun="ideas"
            focusId={LIST_HEADING}
            onPage={setPage}
          />
          <HiddenNotice
            count={hiddenIdeas}
            noun="idea"
            onShow={() => {
              moderation.unhideAll("idea");
              setStatus("Hidden ideas are showing again.");
            }}
          />
        </section>

        <PreviewTools>
          <button type="button" className="btn btn-sm btn-quiet" onClick={simulateReaction}>
            Simulate a reply and upvote on my newest idea
          </button>
          <button type="button" className="btn btn-sm btn-quiet" onClick={simulateStatus}>
            Simulate Planned on a sample idea I upvoted
          </button>
          {ideas.hasOverrides ? (
            <button
              type="button"
              className="btn btn-sm btn-quiet"
              onClick={() => {
                ideas.resetStatus();
                setStatus("Sample idea statuses are back to their original values.");
              }}
            >
              Reset sample statuses
            </button>
          ) : null}
        </PreviewTools>
        <ConductLine />
      </div>
    </>
  );
}

function IdeaCard({
  idea,
  votes,
  voted,
  editing,
  threadOpen,
  commentCount,
  allIdeas,
  onVote,
  onToggleThread,
  onEdit,
  onCancelEdit,
  onSave,
  onStatus,
  onDelete,
  onMessage,
  onThreadMessage,
}: {
  idea: Idea;
  votes: number;
  voted: boolean;
  editing: boolean;
  threadOpen: boolean;
  commentCount: number;
  allIdeas: Idea[];
  onVote: () => void;
  onToggleThread: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (draft: IdeaDraft) => { ok: true; message: string } | { ok: false; message: string; errors: Partial<Record<IdeaField, string>> };
  onStatus: (next: "Open" | "Withdrawn") => void;
  onDelete: () => void;
  onMessage: (message: string) => void;
  onThreadMessage: (message: string) => void;
}) {
  const own = idea.handle === ME_HANDLE;
  const threadId = useId();
  const titleId = `ca-idea-${idea.id}-title`;

  return (
    <article className="ca-card" aria-labelledby={titleId}>
      {editing ? (
        <IdeaForm
          idPrefix={`ca-idea-edit-${idea.id}`}
          heading={`Edit "${idea.title}"`}
          submitLabel="Save changes"
          existing={allIdeas}
          ignoreId={idea.id}
          initial={{ title: idea.title, body: idea.body, track: idea.track }}
          onSubmit={onSave}
          onCancel={onCancelEdit}
        />
      ) : (
        <>
          <h3 id={titleId} tabIndex={-1}>
            {idea.title}
          </h3>
          <p className="ca-meta">
            <Byline handle={idea.handle} at={idea.at} edited={idea.editedAt} />
            <Tag tone="accent">{idea.track === "Any" ? "Any track" : idea.track}</Tag>
            <Tag tone={STATUS_TONE[idea.status]}>{idea.status}</Tag>
          </p>
          <p className="ca-body">{idea.body}</p>
          <div className="ca-actions">
            <ReactionButton verb="Upvote" doneVerb="Upvoted" pressed={voted} count={votes} subject={idea.title} onToggle={onVote} />
            <button type="button" className="btn btn-sm btn-quiet" aria-expanded={threadOpen} aria-controls={threadId} onClick={onToggleThread}>
              Comments ({commentCount})<span className="sr-only"> on {idea.title}</span>
            </button>
            {own ? (
              <>
                {idea.status !== "Withdrawn" ? (
                  <button type="button" className="btn btn-sm btn-quiet" onClick={onEdit}>
                    Edit<span className="sr-only"> {idea.title}</span>
                  </button>
                ) : null}
                {canChangeStatus(idea, ME_HANDLE) ? (
                  idea.status === "Open" ? (
                    <button type="button" className="btn btn-sm btn-quiet" onClick={() => onStatus("Withdrawn")}>
                      Withdraw<span className="sr-only"> {idea.title}</span>
                    </button>
                  ) : (
                    <button type="button" className="btn btn-sm btn-quiet" onClick={() => onStatus("Open")}>
                      Reopen<span className="sr-only"> {idea.title}</span>
                    </button>
                  )
                ) : null}
                <ConfirmButton label="Delete" confirmLabel="Yes, delete" subject={`the idea "${idea.title}" and its comments`} onConfirm={onDelete} />
              </>
            ) : (
              <ReportControl kind="idea" itemId={idea.id} label={idea.title} authorHandle={idea.handle} onDone={onMessage} />
            )}
          </div>
          <div id={threadId} hidden={!threadOpen}>
            {threadOpen ? (
              <CommentThread kind="idea" itemId={idea.id} itemTitle={idea.title} headingId={`ca-idea-${idea.id}-comments`} level={4} onStatus={onThreadMessage} />
            ) : null}
          </div>
        </>
      )}
    </article>
  );
}

function IdeaForm({
  idPrefix,
  heading,
  submitLabel,
  existing,
  ignoreId,
  initial,
  resetOnSuccess,
  onSubmit,
  onCancel,
}: {
  idPrefix: string;
  heading: string;
  submitLabel: string;
  existing: Idea[];
  ignoreId?: string;
  initial?: IdeaDraft;
  resetOnSuccess?: boolean;
  onSubmit: (draft: IdeaDraft) => { ok: true; message: string } | { ok: false; message: string; errors: Partial<Record<IdeaField, string>> };
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [track, setTrack] = useState<string>(initial?.track ?? "Any");
  const [errors, setErrors] = useState<Partial<Record<IdeaField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const similar = title.trim().length >= 4 ? findSimilarTitle(title, existing, ignoreId) : null;

  return (
    <form
      className="ca-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const result = onSubmit({ title, body, track });
        if (result.ok) {
          setErrors({});
          setFormError(null);
          if (resetOnSuccess) {
            setTitle("");
            setBody("");
            setTrack("Any");
          }
          return;
        }
        setErrors(result.errors);
        setFormError(Object.keys(result.errors).length === 0 ? result.message : null);
        const first = (["title", "body", "track"] as IdeaField[]).find((f) => result.errors[f]);
        if (first) focusById(`${idPrefix}-${first}`);
      }}
    >
      <fieldset>
        <legend>{heading}</legend>
        <CaField
          id={`${idPrefix}-title`}
          label="Title"
          error={errors.title}
          counter={<CharCount value={title} max={DRAFT_RULES.ideaTitleMax} />}
        >
          {(aria) => (
            <input
              {...aria}
              type="text"
              value={title}
              autoComplete="off"
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
            />
          )}
        </CaField>
        <div aria-live="polite">
          {similar ? (
            <p className="ca-warn">
              A similar idea already exists: &ldquo;{similar.title}&rdquo;. Consider upvoting it instead. You can still post yours.
            </p>
          ) : null}
        </div>
        <CaField
          id={`${idPrefix}-body`}
          label="Description"
          error={errors.body}
          counter={<CharCount value={body} max={DRAFT_RULES.ideaBodyMax} />}
          hint={`At least ${DRAFT_RULES.ideaBodyMin} characters.`}
        >
          {(aria) => (
            <textarea
              {...aria}
              rows={4}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (errors.body) setErrors((prev) => ({ ...prev, body: undefined }));
              }}
            />
          )}
        </CaField>
        <CaField id={`${idPrefix}-track`} label="Track" error={errors.track}>
          {(aria) => (
            <select {...aria} value={track} onChange={(e) => setTrack(e.target.value)}>
              {IDEA_TRACKS.map((t) => (
                <option key={t} value={t}>
                  {t === "Any" ? "Any track" : t}
                </option>
              ))}
            </select>
          )}
        </CaField>
        {formError ? (
          <p className="ca-error" role="alert">
            {formError}
          </p>
        ) : null}
        <div className="ca-actions">
          <button type="submit" className="btn">
            {submitLabel}
          </button>
          {onCancel ? (
            <button type="button" className="btn btn-quiet" onClick={onCancel}>
              Cancel
            </button>
          ) : null}
        </div>
      </fieldset>
    </form>
  );
}
