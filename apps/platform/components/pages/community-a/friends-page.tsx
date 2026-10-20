"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { EmptyState, PageHeader, PreviewNote, Stat, StatGrid, Status, Tabs, Tag } from "@/components/ui/ui";
import { builderByHandle, SAMPLE_BUILDERS } from "@/lib/sample/builders";
import { DRAFT_RULES, SAMPLE_ACTIVITY, SAMPLE_FOLLOWER_COUNTS } from "./data";
import { formatDay, groupByDay, visibleActivity } from "./logic/activity";
import { reasonLabel } from "./logic/moderation";
import { matchesQuery } from "./logic/query";
import { parseRef } from "./logic/refs";
import { relationOf } from "./logic/social";
import { TRACK_LIST } from "./logic/validate";
import type { TrackName } from "./logic/types";
import { nameOf, useActivity, useModeration, useSocial } from "./stores";
import { CaField, ConductLine, ConfirmButton, DraftRuleNote, PreviewTools, focusById, useStatus } from "./shared";

// Friends: follow builders, send and answer friend requests, per-builder post notifications, a short
// activity list, and safety tools (block, hide, reports). Source: plans/proposals/future-platform-ui.md
// ("builder friends and follows ... post notifications"). Follow vs friend semantics are Draft preview
// rules (logic/rules.ts, SOURCES.md): following is one-way and instant; friends need a request and an accept.

const NETWORK_HEADING = "ca-friends-network";

export function FriendsPage() {
  const { social } = useSocial();
  const moderation = useModeration();
  const [status, setStatus] = useStatus();

  const tabs = [
    { id: "find", label: "Find builders", panel: <FindPanel onStatus={setStatus} /> },
    { id: "requests", label: "Requests", count: social.incoming.length + social.outgoing.length, panel: <RequestsPanel onStatus={setStatus} /> },
    { id: "friends", label: "Friends", count: social.friends.length, panel: <FriendsPanel onStatus={setStatus} /> },
    { id: "following", label: "Following", count: social.following.length, panel: <FollowingPanel onStatus={setStatus} /> },
    { id: "followers", label: "Followers", count: social.followers.length, panel: <FollowersPanel onStatus={setStatus} /> },
    { id: "activity", label: "Activity", panel: <ActivityPanel /> },
    { id: "safety", label: "Safety", count: moderation.blocked.length, panel: <SafetyPanel onStatus={setStatus} /> },
  ];

  return (
    <>
      <PageHeader eyebrow="Community" title="Friends" lead="Follow builders and keep up with what they post." />
      <PreviewNote>
        The builders, follower counts and activity are sample data. Your follows, friends, blocks and settings are saved only in this browser. Nobody is contacted.
      </PreviewNote>
      <Status message={status} />
      <div className="pg-stack">
        <section className="pn" aria-labelledby={NETWORK_HEADING}>
          <div className="pn-head">
            <h2 id={NETWORK_HEADING} tabIndex={-1}>
              Your network
            </h2>
          </div>
          <StatGrid>
            <Stat label="Following" value={social.following.length} />
            <Stat label="Followers" value={social.followers.length} />
            <Stat label="Friends" value={social.friends.length} />
            <Stat label="Requests to answer" value={social.incoming.length} />
          </StatGrid>
          <div className="ca-stack ca-after">
            <DraftRuleNote>
              Following is one-way and takes effect at once. A friendship needs a request and an accept, so following each other does not make two builders friends. Post notifications start off for every builder you follow.
            </DraftRuleNote>
            <Tabs tabs={tabs} label="Friends sections" />
          </div>
        </section>
        <PreviewToolsPanel onStatus={setStatus} />
        <ConductLine />
      </div>
    </>
  );
}

// ---- Shared row ----

function Person({ handle, tags, children }: { handle: string; tags?: ReactNode; children?: ReactNode }) {
  const builder = builderByHandle(handle);
  return (
    <li className="ca-person">
      <div className="ca-person-main">
        <p className="ca-by">
          <strong>{builder?.name ?? handle}</strong> <span className="mut">@{handle}</span>
        </p>
        <p className="ca-meta">
          {builder ? <Tag tone="accent">{builder.track}</Tag> : null}
          {tags}
        </p>
        {builder ? <p className="mut">{builder.bio}</p> : null}
      </div>
      {children ? <div className="ca-actions">{children}</div> : null}
    </li>
  );
}

// ---- Find builders ----

function FindPanel({ onStatus }: { onStatus: (m: string) => void }) {
  const api = useSocial();
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState<TrackName | "all">("all");
  const results = SAMPLE_BUILDERS.filter((b) => (track === "all" || b.track === track) && matchesQuery([b.name, b.handle, b.track, b.bio], query));

  return (
    <div className="ca-stack">
      <form className="toolbar" role="search" aria-label="Find builders" onSubmit={(e) => e.preventDefault()}>
        <CaField id="ca-fr-q" label="Search by name, handle or track">
          {(aria) => <input {...aria} type="search" value={query} onChange={(e) => setQuery(e.target.value)} />}
        </CaField>
        <CaField id="ca-fr-track" label="Track">
          {(aria) => (
            <select {...aria} value={track} onChange={(e) => setTrack(e.target.value as TrackName | "all")}>
              <option value="all">All tracks</option>
              {TRACK_LIST.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </CaField>
      </form>
      <p className="mut" role="status" aria-live="polite">
        {results.length} {results.length === 1 ? "builder" : "builders"} shown. Follower counts are sample data.
      </p>
      {results.length === 0 ? (
        <EmptyState title="No builders match">Try a different name, handle or track.</EmptyState>
      ) : (
        <ul className="row-list" aria-label="Builders">
          {results.map((b) => {
            const rel = relationOf(api.social, b.handle);
            const blocked = api.blocked.includes(b.handle);
            const count = (SAMPLE_FOLLOWER_COUNTS[b.handle] ?? 0) + (rel.following ? 1 : 0);
            return (
              <Person
                key={b.handle}
                handle={b.handle}
                tags={
                  <>
                    <span className="mut">{count} followers (sample)</span>
                    {rel.followsYou ? <Tag>Follows you</Tag> : null}
                    {rel.relation === "friend" ? <Tag tone="ok">Friend</Tag> : null}
                    {rel.relation === "request-sent" ? <Tag tone="warn">Request sent</Tag> : null}
                    {rel.relation === "request-received" ? <Tag tone="warn">Asked to be friends</Tag> : null}
                    {blocked ? <Tag tone="bad">Blocked</Tag> : null}
                  </>
                }
              >
                {blocked ? (
                  <button type="button" className="btn btn-sm btn-quiet" onClick={() => onStatus(api.unblock(b.handle).message)}>
                    Unblock<span className="sr-only"> {b.name}</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className={rel.following ? "btn btn-sm btn-quiet" : "btn btn-sm"}
                      onClick={() => onStatus((rel.following ? api.unfollow(b.handle) : api.follow(b.handle)).message)}
                    >
                      {rel.following ? "Unfollow" : "Follow"}
                      <span className="sr-only"> {b.name}</span>
                    </button>
                    {rel.relation === "none" ? (
                      <button type="button" className="btn btn-sm btn-quiet" onClick={() => onStatus(api.sendRequest(b.handle).message)}>
                        Add friend<span className="sr-only"> {b.name}</span>
                      </button>
                    ) : null}
                    {rel.relation === "request-sent" ? (
                      <button type="button" className="btn btn-sm btn-quiet" onClick={() => onStatus(api.cancelRequest(b.handle).message)}>
                        Cancel request<span className="sr-only"> to {b.name}</span>
                      </button>
                    ) : null}
                    {rel.relation === "request-received" ? (
                      <button type="button" className="btn btn-sm" onClick={() => onStatus(api.accept(b.handle).message)}>
                        Accept request<span className="sr-only"> from {b.name}</span>
                      </button>
                    ) : null}
                    {rel.relation === "friend" ? (
                      <ConfirmButton
                        label="Unfriend"
                        confirmLabel="Yes, unfriend"
                        subject={b.name}
                        onConfirm={() => {
                          onStatus(api.unfriend(b.handle).message);
                          focusById(NETWORK_HEADING);
                        }}
                      />
                    ) : null}
                    <ConfirmButton
                      label="Block"
                      confirmLabel="Yes, block"
                      subject={b.name}
                      onConfirm={() => {
                        onStatus(api.block(b.handle).message);
                        focusById(NETWORK_HEADING);
                      }}
                    />
                  </>
                )}
              </Person>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---- Requests ----

function RequestsPanel({ onStatus }: { onStatus: (m: string) => void }) {
  const api = useSocial();
  const { incoming, outgoing } = api.social;
  return (
    <div className="ca-stack">
      <div>
        <h3>Requests to answer ({incoming.length})</h3>
        {incoming.length === 0 ? (
          <EmptyState title="No requests waiting">When a builder asks to be your friend, the request appears here.</EmptyState>
        ) : (
          <ul className="row-list" aria-label="Incoming friend requests">
            {incoming.map((handle) => (
              <Person key={handle} handle={handle}>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    onStatus(api.accept(handle).message);
                    focusById(NETWORK_HEADING);
                  }}
                >
                  Accept<span className="sr-only"> request from {nameOf(handle)}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-quiet"
                  onClick={() => {
                    onStatus(api.decline(handle).message);
                    focusById(NETWORK_HEADING);
                  }}
                >
                  Decline<span className="sr-only"> request from {nameOf(handle)}</span>
                </button>
              </Person>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3>Requests you sent ({outgoing.length})</h3>
        {outgoing.length === 0 ? (
          <EmptyState title="No pending requests">Use Add friend in Find builders to send one.</EmptyState>
        ) : (
          <ul className="row-list" aria-label="Friend requests you sent">
            {outgoing.map((handle) => (
              <Person key={handle} handle={handle} tags={<Tag tone="warn">Waiting for an answer</Tag>}>
                <button
                  type="button"
                  className="btn btn-sm btn-quiet"
                  onClick={() => {
                    onStatus(api.cancelRequest(handle).message);
                    focusById(NETWORK_HEADING);
                  }}
                >
                  Cancel request<span className="sr-only"> to {nameOf(handle)}</span>
                </button>
              </Person>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---- Friends ----

function FriendsPanel({ onStatus }: { onStatus: (m: string) => void }) {
  const api = useSocial();
  const friends = api.social.friends;
  if (friends.length === 0) {
    return <EmptyState title="No friends yet">Send a friend request from Find builders. A friendship starts when the other builder accepts.</EmptyState>;
  }
  return (
    <ul className="row-list" aria-label="Friends">
      {friends.map((handle) => {
        const rel = relationOf(api.social, handle);
        return (
          <Person key={handle} handle={handle} tags={<>{rel.following ? <Tag>Following</Tag> : null}{rel.followsYou ? <Tag>Follows you</Tag> : null}</>}>
            <ConfirmButton
              label="Unfriend"
              confirmLabel="Yes, unfriend"
              subject={nameOf(handle)}
              onConfirm={() => {
                onStatus(api.unfriend(handle).message);
                focusById(NETWORK_HEADING);
              }}
            />
          </Person>
        );
      })}
    </ul>
  );
}

// ---- Following ----

function FollowingPanel({ onStatus }: { onStatus: (m: string) => void }) {
  const api = useSocial();
  const following = api.social.following;
  if (following.length === 0) {
    return <EmptyState title="You are not following anyone">Follow builders from Find builders, or from a project in Explore.</EmptyState>;
  }
  return (
    <div className="ca-stack">
      <p className="mut">Turn on post notifications for the builders you want to hear from. Off means their posts appear in Activity only.</p>
      <ul className="row-list" aria-label="Builders you follow">
        {following.map((handle) => {
          const rel = relationOf(api.social, handle);
          return (
            <Person key={handle} handle={handle} tags={rel.followsYou ? <Tag>Follows you</Tag> : undefined}>
              <label className="check">
                <input type="checkbox" checked={rel.notify} onChange={(e) => onStatus(api.setNotify(handle, e.target.checked).message)} />
                <span>
                  Notify me about their new posts<span className="sr-only">: {nameOf(handle)}</span>
                </span>
              </label>
              <button
                type="button"
                className="btn btn-sm btn-quiet"
                onClick={() => {
                  onStatus(api.unfollow(handle).message);
                  focusById(NETWORK_HEADING);
                }}
              >
                Unfollow<span className="sr-only"> {nameOf(handle)}</span>
              </button>
            </Person>
          );
        })}
      </ul>
    </div>
  );
}

// ---- Followers ----

function FollowersPanel({ onStatus }: { onStatus: (m: string) => void }) {
  const api = useSocial();
  const followers = api.social.followers;
  if (followers.length === 0) {
    return <EmptyState title="No followers yet">Builders who follow you appear here. Use the preview tools to simulate one.</EmptyState>;
  }
  return (
    <div className="ca-stack">
      <p className="mut">These followers are sample builders. Their number is the sample followers plus any you simulate.</p>
      <ul className="row-list" aria-label="Your followers">
        {followers.map((handle) => {
          const rel = relationOf(api.social, handle);
          return (
            <Person key={handle} handle={handle} tags={rel.following ? <Tag>You follow them</Tag> : undefined}>
              {rel.following ? null : (
                <button type="button" className="btn btn-sm" onClick={() => onStatus(api.follow(handle).message)}>
                  Follow back<span className="sr-only"> {nameOf(handle)}</span>
                </button>
              )}
              <ConfirmButton
                label="Block"
                confirmLabel="Yes, block"
                subject={nameOf(handle)}
                onConfirm={() => {
                  onStatus(api.block(handle).message);
                  focusById(NETWORK_HEADING);
                }}
              />
            </Person>
          );
        })}
      </ul>
    </div>
  );
}

// ---- Activity ----

function ActivityPanel() {
  const { social } = useSocial();
  const moderation = useModeration();
  const activity = useActivity();
  const events = visibleActivity([...activity.created, ...SAMPLE_ACTIVITY], social, moderation.state, DRAFT_RULES.activityLimit);
  const groups = groupByDay(events);

  if (social.following.length === 0) {
    return <EmptyState title="Nothing to show">Follow builders to see what they post. This list shows only the latest {DRAFT_RULES.activityLimit} events.</EmptyState>;
  }
  return (
    <div className="ca-stack">
      <p className="mut">
        The latest {DRAFT_RULES.activityLimit} events from builders you follow, grouped by day. This is a short list, not a feed: there is nothing further to scroll to.
      </p>
      {events.length === 0 ? (
        <EmptyState title="No recent activity">The builders you follow have no events yet.</EmptyState>
      ) : (
        <div>
          {groups.map((group) => (
            <section key={group.day} aria-labelledby={`ca-day-${group.day}`}>
              <h3 id={`ca-day-${group.day}`} className="ca-day">
                {formatDay(`${group.day}T00:00:00.000Z`)}
              </h3>
              <ul className="row-list">
                {group.events.map((e) => (
                  <li key={e.id} className="row-item">
                    <span>
                      <strong>{nameOf(e.handle)}</strong> {e.text}
                    </span>
                    <Link className="ca-link" href={e.href}>
                      Open<span className="sr-only">: {nameOf(e.handle)} {e.text}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Safety ----

function SafetyPanel({ onStatus }: { onStatus: (m: string) => void }) {
  const api = useSocial();
  const moderation = useModeration();
  const { reports, hidden, blocked } = moderation.state;

  return (
    <div className="ca-stack">
      <div>
        <h3>Blocked builders ({blocked.length})</h3>
        {blocked.length === 0 ? (
          <p className="mut">You have not blocked anyone. Blocking hides a builder&rsquo;s projects, ideas, posts and comments everywhere and removes your follows, friendship and requests with them.</p>
        ) : (
          <ul className="row-list" aria-label="Blocked builders">
            {blocked.map((handle) => (
              <Person key={handle} handle={handle}>
                <button
                  type="button"
                  className="btn btn-sm btn-quiet"
                  onClick={() => {
                    onStatus(api.unblock(handle).message);
                    focusById(NETWORK_HEADING);
                  }}
                >
                  Unblock<span className="sr-only"> {nameOf(handle)}</span>
                </button>
              </Person>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3>Items you hid ({hidden.length})</h3>
        <p className="mut">Reported or hidden projects, ideas, posts and comments stay hidden only for you.</p>
        {hidden.length > 0 ? (
          <button
            type="button"
            className="btn btn-sm btn-quiet"
            onClick={() => {
              moderation.unhideAll();
              onStatus("All hidden items are showing again.");
            }}
          >
            Show all hidden items
          </button>
        ) : null}
      </div>
      <div>
        <h3>Reports you filed ({reports.length})</h3>
        {reports.length === 0 ? (
          <p className="mut">No reports. Use Report on any project, idea, post or comment.</p>
        ) : (
          <ul className="row-list" aria-label="Reports you filed">
            {reports.map((r) => (
              <li key={r.id} className="row-item">
                <span>
                  <strong>{r.label}</strong> <span className="mut">({parseRef(r.ref)?.kind ?? "item"})</span>
                  <br />
                  {reasonLabel(r.reason)}
                  {r.note ? `: ${r.note}` : ""}
                </span>
                <time className="mut" dateTime={r.at}>
                  {formatDay(r.at)}
                </time>
              </li>
            ))}
          </ul>
        )}
        <p className="mut">Reports are stored only in this browser. No one reviews them in the preview.</p>
      </div>
    </div>
  );
}

// ---- Preview tools ----

function PreviewToolsPanel({ onStatus }: { onStatus: (m: string) => void }) {
  const api = useSocial();
  const activity = useActivity();
  const [pick, setPick] = useState("");
  const following = api.social.following.filter((h) => !api.blocked.includes(h));
  const target = following.includes(pick) ? pick : following[0];
  const notifyOn = target ? api.social.notify[target] === true : false;

  return (
    <PreviewTools intro="Buttons that create sample events so you can see how notifications behave. They are not real activity.">
      <div className="ca-stack">
        <div className="toolbar">
          <CaField id="ca-sim-builder" label="Simulate a post from" hint={target ? `Notifications are ${notifyOn ? "on" : "off"} for this builder.` : "Follow a builder first."}>
            {(aria) => (
              <select {...aria} value={target ?? ""} onChange={(e) => setPick(e.target.value)} disabled={following.length === 0}>
                {following.length === 0 ? <option value="">No followed builders</option> : null}
                {following.map((h) => (
                  <option key={h} value={h}>
                    {nameOf(h)}
                  </option>
                ))}
              </select>
            )}
          </CaField>
          <button
            type="button"
            className="btn btn-sm btn-quiet"
            disabled={!target}
            onClick={() => target && onStatus(activity.simulatePost(target).message)}
          >
            Simulate a post{target ? ` from ${nameOf(target)}` : ""}
          </button>
        </div>
        <div className="ca-actions">
          <button type="button" className="btn btn-sm btn-quiet" onClick={() => onStatus(api.simulateFollower().message)}>
            Simulate a new follower
          </button>
          <button type="button" className="btn btn-sm btn-quiet" disabled={api.social.outgoing.length === 0} onClick={() => onStatus(api.simulateAcceptance().message)}>
            Simulate a builder accepting my request
          </button>
        </div>
      </div>
    </PreviewTools>
  );
}
