import type { ReactNode } from "react";
import type { Avatar } from "@/lib/platform/avatar";
import { formatOre, type Balances } from "@/lib/platform/ledger";
import { PROFILE_HEADING_ID, OpenProfileEditButton } from "./ProfileEditDialog";
import { ProfileShare } from "./ProfileShare";
import { ScrambleText } from "./ScrambleText";
import { CountUp } from "./CountUp";
import "./notifications.css";
import "./profile.css";
import "./page-polish.css";

type Top = { track: string; level: number } | null;

// After Stasis's left profile card: the avatar (the builder's picture when one is stored, else a plate with the first letter),
// the name (the handle), the bio, the balance, then the buttons. Everyone sees the balance, as in Stasis. The balance is
// confirmed Ore and never negative; pending Ore sits under it for the owner only.
export function ProfileIdentity({
  handle,
  bio,
  top,
  own,
  balance,
  avatar,
  counts,
  relation,
}: Readonly<{
  handle: string;
  bio: string | null;
  top: Top;
  own: boolean;
  balance: Balances | null;
  avatar: Avatar | null;
  // Numbers only, for everyone. Never a list of names here.
  counts?: { followers: number; following: number };
  // The visitor's follow and block controls (a visitor's view only).
  relation?: ReactNode;
}>) {
  const pending = own && balance ? Math.max(0, Math.round(balance.pending)) : 0;
  return (
    <header className="pf-sp-card pf-sp-profile">
      {avatar ? (
        <div className="pf-sp-plate pf-sp-photo" data-track={top ? top.track.toLowerCase() : undefined}>
          {/* The handle is next to the picture, so the picture needs no text of its own. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar.url} alt="" width={160} height={160} decoding="async" referrerPolicy="no-referrer" />
        </div>
      ) : (
        <div className="pf-sp-plate" data-track={top ? top.track.toLowerCase() : undefined} aria-hidden="true">
          <span className="pf-sp-plate-letter">{handle.charAt(0).toUpperCase()}</span>
          <span className="pf-sp-plate-strip" />
        </div>
      )}
      <h1 id={PROFILE_HEADING_ID} tabIndex={-1} className="pf-sp-name"><ScrambleText text={handle} /></h1>
      {bio ? <p className="pf-sp-bio">{bio}</p> : null}
      {counts ? (
        <p className="pf-sp-counts">
          <span>{counts.followers.toLocaleString("en-US")} {counts.followers === 1 ? "follower" : "followers"}</span>
          <span>{counts.following.toLocaleString("en-US")} following</span>
        </p>
      ) : null}

      {balance ? (
        <div className="pf-sp-ore">
          <p className="pf-sp-ore-line">
            <span className="pf-sp-ore-figure"><CountUp value={formatOre(Math.max(0, balance.confirmed)).replace(/ Ore$/, "")} /></span>
            <span className="pf-sp-ore-label">Ore</span>
          </p>
          {pending > 0 ? <p className="pf-sp-pending">{pending.toLocaleString("en-US")} Ore pending review</p> : null}
        </div>
      ) : null}

      <div className="pf-sp-actions">
        {own ? <OpenProfileEditButton className="pf-btn pri pf-sp-btn">Edit profile</OpenProfileEditButton> : null}
        <ProfileShare />
      </div>
      {relation}
    </header>
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
