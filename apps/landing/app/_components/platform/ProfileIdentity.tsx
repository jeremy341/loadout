import type { ReactNode } from "react";
import { PROFILE_HEADING_ID, OpenProfileEditButton } from "./ProfileEditDialog";
import "./profile.css";

type Top = { track: string; level: number } | null;

// The ID plate and the handle: a square paper plate with the first letter, a strip in the top track's colour along its foot,
// then the bio and a boxed row of facts. The handle is the h1. No avatar upload, no real name.
export function ProfileIdentity({
  handle,
  bio,
  joined,
  top,
  projectCount,
  toolbeltCount,
  own,
}: Readonly<{ handle: string; bio: string | null; joined: string; top: Top; projectCount: number; toolbeltCount: number; own: boolean }>) {
  return (
    <section className="pf-prof-id" aria-label="Profile">
      <div className="pf-prof-plate" data-track={top ? top.track.toLowerCase() : undefined} aria-hidden="true">
        <span className="pf-prof-plate-letter">{handle.charAt(0).toUpperCase()}</span>
        <span className="pf-prof-plate-strip" />
      </div>
      <h1 id={PROFILE_HEADING_ID} tabIndex={-1} className="pf-prof-h1">{handle}</h1>
      <div className="pf-prof-rest">
        {bio ? <p className="pf-project-lead">{bio}</p> : own ? <p className="pf-project-lead pf-muted">No bio yet.</p> : null}
        <dl className="pf-meta-box">
          <div>
            <dt>Joined</dt>
            <dd>{joined}</dd>
          </div>
          {own && top ? (
            <div>
              <dt>Top track</dt>
              <dd className="pf-prof-top" data-track={top.track.toLowerCase()}>
                {top.track} LV.{top.level}
              </dd>
            </div>
          ) : null}
          <div>
            <dt>Projects</dt>
            <dd>{projectCount}</dd>
          </div>
          <div>
            <dt>Toolbelt</dt>
            <dd>{toolbeltCount}</dd>
          </div>
        </dl>
        {own ? (
          <p className="pf-hint">Other builders see your approved projects and the ones you show as building. Drafts and work in review stay private.</p>
        ) : null}
      </div>
    </section>
  );
}

// Own profile, no handle yet: the h1 says "Your profile" and the Overview's "Next up" block asks for one.
export function ChooseHandle(): ReactNode {
  return (
    <>
      <h1 id={PROFILE_HEADING_ID} tabIndex={-1} className="pf-prof-h1 pf-prof-h1-solo">Your profile</h1>
      <section className="pf-next" aria-labelledby="choose-handle-heading">
        <div className="pf-next-text">
          <span className="pf-kicker">Next up</span>
          <h2 id="choose-handle-heading">Choose a handle</h2>
          <p>Your handle is how other builders see you. Until you choose one, you have no public profile.</p>
        </div>
        <OpenProfileEditButton primary>Choose a handle</OpenProfileEditButton>
      </section>
    </>
  );
}
