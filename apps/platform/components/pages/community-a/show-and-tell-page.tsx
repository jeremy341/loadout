"use client";

import { useId, useMemo, useState } from "react";
import { EmptyState, PageHeader, PreviewNote, Status, Tag } from "@/components/ui/ui";
import { DRAFT_RULES } from "./data";
import { filterPosts, paginate, sortPosts, type PostSort } from "./logic/query";
import { hiddenCount } from "./logic/moderation";
import { hasReacted, reactionCount } from "./logic/reactions";
import { makeRef } from "./logic/refs";
import { nextCandidate } from "./logic/social";
import { parseHttpsUrl } from "./logic/text";
import { TRACK_LIST, type PostDraft, type PostField } from "./logic/validate";
import type { ShowPost, TrackName } from "./logic/types";
import { ME_HANDLE, SAMPLE_HANDLES, nameOf, useComments, useModeration, usePosts, useReactions } from "./stores";
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

// Show & Tell: present finished work to the community (plans/proposals/future-platform-ui.md lists Show & Tell
// as selected; the post fields, limits and the featured strip are Draft preview rules, see SOURCES.md).
// Links must be https; they are rendered only when they parse as https.

const LIST_HEADING = "ca-posts-list";

export function ShowAndTellPage() {
  const posts = usePosts();
  const comments = useComments();
  const reactions = useReactions();
  const moderation = useModeration();
  const [status, setStatus] = useStatus();
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState<TrackName | "all">("all");
  const [sort, setSort] = useState<PostSort>("new");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openThreads, setOpenThreads] = useState<Record<string, boolean>>({});

  const likesOf = (p: ShowPost) => reactionCount(p.baseLikes, reactions.map, makeRef("post", p.id));
  const visible = useMemo(
    () =>
      posts.all.filter(
        (p) => p.handle === ME_HANDLE || (!moderation.state.hidden.includes(makeRef("post", p.id)) && !moderation.blocked.includes(p.handle)),
      ),
    [posts.all, moderation.state.hidden, moderation.blocked],
  );
  const featured = visible.filter((p) => p.featured);
  const filtered = filterPosts(visible, { query, track }, nameOf);
  const sorted = sortPosts(filtered, sort, likesOf);
  const pageInfo = paginate(sorted, page, DRAFT_RULES.postsPerPage);
  const hiddenPosts = hiddenCount(
    moderation.state,
    "post",
    posts.all.map((p) => makeRef("post", p.id)),
  );

  function simulateReaction() {
    const newest = posts.mine[0];
    if (!newest) {
      setStatus("Share a post first, then try the preview tool.");
      return;
    }
    const ref = makeRef("post", newest.id);
    const fan = nextCandidate(SAMPLE_HANDLES, reactions.map[ref] ?? [], moderation.blocked);
    if (fan) reactions.add(ref, fan);
    setStatus(comments.simulateReply(ref, newest.title, "/show-and-tell").message);
  }

  return (
    <>
      <PageHeader eyebrow="Community" title="Show & Tell" lead="Present finished work to the community." />
      <PreviewNote>
        The posts, likes and the featured picks below are sample data. Your posts, likes and comments are saved only in this browser. Nothing is published to anyone.
      </PreviewNote>
      <Status message={status} />
      <div className="pg-stack">
        <section className="pn" aria-labelledby="ca-featured-h">
          <div className="pn-head">
            <h2 id="ca-featured-h">Featured this week</h2>
            <Tag>Sample selection</Tag>
          </div>
          <p className="mut">These picks are chosen by the preview, not by a person. How featuring will work is not decided.</p>
          {featured.length === 0 ? (
            <EmptyState title="Nothing featured">Featured sample posts appear here unless you hide them or block their builders.</EmptyState>
          ) : (
            <ul className="ca-featured ca-after" aria-label="Featured posts">
              {featured.map((p) => (
                <li key={p.id}>
                  <h3>{p.title}</h3>
                  <p className="ca-meta">
                    <Byline handle={p.handle} />
                    <Tag tone="accent">{p.track}</Tag>
                  </p>
                  <p>{p.built.length > 110 ? `${p.built.slice(0, 110)}…` : p.built}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="pn" aria-labelledby="ca-post-new-h">
          <div className="pn-head">
            <h2 id="ca-post-new-h">Share finished work</h2>
          </div>
          <PostForm
            idPrefix="ca-post-new"
            heading="New post"
            submitLabel="Post to Show & Tell"
            resetOnSuccess
            onSubmit={(draft) => {
              const result = posts.add(draft);
              if (result.ok) {
                setQuery("");
                setTrack("all");
                setSort("new");
                setPage(1);
                setStatus(`${result.message} It is first in the list.`);
                focusById(`ca-post-${result.id}-title`);
              }
              return result;
            }}
          />
          <div className="ca-stack ca-after">
            <DraftRuleNote>
              Titles up to {DRAFT_RULES.postTitleMax} characters, what you built {DRAFT_RULES.postBuiltMin} to {DRAFT_RULES.postBuiltMax}, what you learned up to {DRAFT_RULES.postLearnedMax}, https links only, at most {DRAFT_RULES.rate.postsPerDay} posts per day.
            </DraftRuleNote>
          </div>
        </section>

        <section className="pn" aria-labelledby={LIST_HEADING}>
          <div className="pn-head">
            <h2 id={LIST_HEADING} tabIndex={-1}>
              Posts
            </h2>
          </div>
          <form className="toolbar" role="search" aria-label="Search and filter posts" onSubmit={(e) => e.preventDefault()}>
            <CaField id="ca-po-q" label="Search posts">
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
            <CaField id="ca-po-track" label="Track">
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
            <CaField id="ca-po-sort" label="Sort by">
              {(aria) => (
                <select
                  {...aria}
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as PostSort);
                    setPage(1);
                  }}
                >
                  <option value="new">Newest</option>
                  <option value="liked">Most liked</option>
                </select>
              )}
            </CaField>
            {query || track !== "all" ? (
              <button
                type="button"
                className="btn btn-sm btn-quiet"
                onClick={() => {
                  setQuery("");
                  setTrack("all");
                  setPage(1);
                  setStatus("Filters cleared.");
                }}
              >
                Clear filters
              </button>
            ) : null}
          </form>

          {pageInfo.total === 0 ? (
            <EmptyState title="No posts match">
              {visible.length === 0 ? "There are no posts to show. Share your finished work above." : "Try a different search, or clear the filters."}
            </EmptyState>
          ) : (
            <ul className="card-grid" aria-label={`Posts, page ${pageInfo.page} of ${pageInfo.pageCount}`}>
              {pageInfo.items.map((post) => (
                <li key={post.id}>
                  <PostCard
                    post={post}
                    likes={likesOf(post)}
                    liked={hasReacted(reactions.map, makeRef("post", post.id), ME_HANDLE)}
                    editing={editingId === post.id}
                    threadOpen={openThreads[post.id] === true}
                    commentCount={comments.all.filter((c) => c.ref === makeRef("post", post.id) && !moderation.blocked.includes(c.handle) && !moderation.state.hidden.includes(makeRef("comment", c.id))).length}
                    onLike={() => reactions.toggle(makeRef("post", post.id))}
                    onToggleThread={() => setOpenThreads((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                    onEdit={() => setEditingId(post.id)}
                    onCancelEdit={() => {
                      setEditingId(null);
                      focusById(`ca-post-${post.id}-title`);
                    }}
                    onSave={(draft) => {
                      const result = posts.edit(post.id, draft);
                      if (result.ok) {
                        setEditingId(null);
                        setStatus(result.message);
                        focusById(`ca-post-${post.id}-title`);
                      }
                      return result;
                    }}
                    onDelete={() => {
                      setStatus(posts.remove(post.id).message);
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
            noun="posts"
            focusId={LIST_HEADING}
            onPage={setPage}
          />
          <HiddenNotice
            count={hiddenPosts}
            noun="post"
            onShow={() => {
              moderation.unhideAll("post");
              setStatus("Hidden posts are showing again.");
            }}
          />
        </section>

        <PreviewTools>
          <button type="button" className="btn btn-sm btn-quiet" onClick={simulateReaction}>
            Simulate a reply and like on my newest post
          </button>
        </PreviewTools>
        <ConductLine />
      </div>
    </>
  );
}

function ExternalLink({ href }: { href: string }) {
  const safe = parseHttpsUrl(href, DRAFT_RULES.linkMax);
  if (!safe) return <span className="ca-link">{href}</span>;
  return (
    <a className="ca-link" href={safe} target="_blank" rel="noopener noreferrer">
      {safe}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function PostCard({
  post,
  likes,
  liked,
  editing,
  threadOpen,
  commentCount,
  onLike,
  onToggleThread,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onMessage,
  onThreadMessage,
}: {
  post: ShowPost;
  likes: number;
  liked: boolean;
  editing: boolean;
  threadOpen: boolean;
  commentCount: number;
  onLike: () => void;
  onToggleThread: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (draft: PostDraft) => { ok: true; message: string } | { ok: false; message: string; errors: Partial<Record<PostField, string>> };
  onDelete: () => void;
  onMessage: (message: string) => void;
  onThreadMessage: (message: string) => void;
}) {
  const own = post.handle === ME_HANDLE;
  const threadId = useId();
  const titleId = `ca-post-${post.id}-title`;
  return (
    <article className="ca-card" aria-labelledby={titleId}>
      {editing ? (
        <PostForm
          idPrefix={`ca-post-edit-${post.id}`}
          heading={`Edit "${post.title}"`}
          submitLabel="Save changes"
          initial={{ title: post.title, built: post.built, link: post.link, track: post.track, learned: post.learned ?? "" }}
          onSubmit={onSave}
          onCancel={onCancelEdit}
        />
      ) : (
        <>
          <h3 id={titleId} tabIndex={-1}>
            {post.title}
          </h3>
          <p className="ca-meta">
            <Byline handle={post.handle} at={post.at} edited={post.editedAt} />
            <Tag tone="accent">{post.track}</Tag>
          </p>
          <p className="ca-body">{post.built}</p>
          {post.learned ? (
            <p className="ca-body">
              <strong>What I learned:</strong> {post.learned}
            </p>
          ) : null}
          <p>
            <strong>Link:</strong> <ExternalLink href={post.link} />
            {own ? null : <span className="mut"> (sample link)</span>}
          </p>
          <div className="ca-card-foot">
            <ReactionButton verb="Like" doneVerb="Liked" pressed={liked} count={likes} subject={post.title} onToggle={onLike} />
            <button type="button" className="btn btn-sm btn-quiet" aria-expanded={threadOpen} aria-controls={threadId} onClick={onToggleThread}>
              Comments ({commentCount})<span className="sr-only"> on {post.title}</span>
            </button>
            {own ? (
              <>
                <button type="button" className="btn btn-sm btn-quiet" onClick={onEdit}>
                  Edit<span className="sr-only"> {post.title}</span>
                </button>
                <ConfirmButton label="Delete" confirmLabel="Yes, delete" subject={`the post "${post.title}" and its comments`} onConfirm={onDelete} />
              </>
            ) : (
              <ReportControl kind="post" itemId={post.id} label={post.title} authorHandle={post.handle} onDone={onMessage} />
            )}
          </div>
          <div id={threadId} hidden={!threadOpen}>
            {threadOpen ? (
              <CommentThread kind="post" itemId={post.id} itemTitle={post.title} headingId={`ca-post-${post.id}-comments`} level={4} onStatus={onThreadMessage} />
            ) : null}
          </div>
        </>
      )}
    </article>
  );
}

function PostForm({
  idPrefix,
  heading,
  submitLabel,
  initial,
  resetOnSuccess,
  onSubmit,
  onCancel,
}: {
  idPrefix: string;
  heading: string;
  submitLabel: string;
  initial?: PostDraft;
  resetOnSuccess?: boolean;
  onSubmit: (draft: PostDraft) => { ok: true; message: string } | { ok: false; message: string; errors: Partial<Record<PostField, string>> };
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [built, setBuilt] = useState(initial?.built ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [track, setTrack] = useState(initial?.track ?? "");
  const [learned, setLearned] = useState(initial?.learned ?? "");
  const [errors, setErrors] = useState<Partial<Record<PostField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const clear = (field: PostField) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <form
      className="ca-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const result = onSubmit({ title, built, link, track, learned });
        if (result.ok) {
          setErrors({});
          setFormError(null);
          if (resetOnSuccess) {
            setTitle("");
            setBuilt("");
            setLink("");
            setTrack("");
            setLearned("");
          }
          return;
        }
        setErrors(result.errors);
        setFormError(Object.keys(result.errors).length === 0 ? result.message : null);
        const first = (["title", "built", "link", "track", "learned"] as PostField[]).find((f) => result.errors[f]);
        if (first) focusById(`${idPrefix}-${first}`);
      }}
    >
      <fieldset>
        <legend>{heading}</legend>
        <CaField id={`${idPrefix}-title`} label="Title" error={errors.title} counter={<CharCount value={title} max={DRAFT_RULES.postTitleMax} />}>
          {(aria) => (
            <input
              {...aria}
              type="text"
              autoComplete="off"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                clear("title");
              }}
            />
          )}
        </CaField>
        <CaField
          id={`${idPrefix}-built`}
          label="What you built"
          error={errors.built}
          counter={<CharCount value={built} max={DRAFT_RULES.postBuiltMax} />}
          hint={`At least ${DRAFT_RULES.postBuiltMin} characters.`}
        >
          {(aria) => (
            <textarea
              {...aria}
              rows={4}
              value={built}
              onChange={(e) => {
                setBuilt(e.target.value);
                clear("built");
              }}
            />
          )}
        </CaField>
        <CaField id={`${idPrefix}-link`} label="Link to the project" error={errors.link} hint="A full https:// link, for example your public repository.">
          {(aria) => (
            <input
              {...aria}
              type="url"
              inputMode="url"
              autoComplete="off"
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                clear("link");
              }}
            />
          )}
        </CaField>
        <CaField id={`${idPrefix}-track`} label="Track" error={errors.track}>
          {(aria) => (
            <select
              {...aria}
              value={track}
              onChange={(e) => {
                setTrack(e.target.value);
                clear("track");
              }}
            >
              <option value="">Choose a track</option>
              {TRACK_LIST.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </CaField>
        <CaField
          id={`${idPrefix}-learned`}
          label="What I learned (optional)"
          error={errors.learned}
          counter={<CharCount value={learned} max={DRAFT_RULES.postLearnedMax} />}
        >
          {(aria) => (
            <textarea
              {...aria}
              rows={3}
              value={learned}
              onChange={(e) => {
                setLearned(e.target.value);
                clear("learned");
              }}
            />
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
