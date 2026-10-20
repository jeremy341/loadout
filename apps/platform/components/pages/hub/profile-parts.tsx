"use client";

import { useId } from "react";
import { Tag } from "../../ui/ui";
import { HUB_RULES } from "./data";
import { AVATAR_SPRITES, VISIBILITY_LABELS, type AvatarChoice, type PublicProfile } from "./logic/profile";
import { Avatar, Sprite } from "./shared";

// The pieces of the Profile page that are more than a text field: the avatar choice and the public view card.

function spriteLabel(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function AvatarPicker({ value, displayName, onChange, error }: { value: AvatarChoice; displayName: string; onChange: (next: AvatarChoice) => void; error?: string }) {
  const name = useId();
  const options: { id: AvatarChoice; label: string }[] = [{ id: "initials", label: "Initials" }, ...AVATAR_SPRITES.map((s) => ({ id: s as AvatarChoice, label: spriteLabel(s) }))];
  return (
    <fieldset className="hb-fieldset">
      <legend className="fld-label">Avatar</legend>
      <p className="mut hb-help">Pick a pixel icon or use your initials. Photos cannot be uploaded.</p>
      <div className="hb-avatars">
        {options.map((option) => (
          <label key={option.id} className="hb-avatar-opt">
            <input type="radio" name={name} value={option.id} checked={value === option.id} onChange={() => onChange(option.id)} />
            {option.id === "initials" ? <Avatar choice="initials" name={displayName} size={40} /> : <Sprite name={option.id} size={32} />}
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error ? (
        <span className="fld-error" role="alert">
          {error}
        </span>
      ) : null}
    </fieldset>
  );
}

/** What other people see. It renders only the fields of PublicProfile, which holds public fields and nothing else. */
export function PublicCard({ view }: { view: PublicProfile }) {
  return (
    <article className="hb-public" aria-label={`Public profile of ${view.displayName}`}>
      <div className="hb-public-head">
        <Avatar choice={view.avatar} name={view.displayName} size={72} />
        <div>
          <h3>{view.displayName}</h3>
          <p className="mut">
            @{view.handle}
            {view.pronouns ? ` · ${view.pronouns}` : ""}
          </p>
          <Tag tone="accent">{view.track}</Tag>
        </div>
      </div>
      {view.bio ? <p className="hb-bio">{view.bio}</p> : <p className="mut">No bio yet.</p>}

      {view.links.length > 0 ? (
        <ul className="hb-links" aria-label="Links">
          {view.links.map((link) => (
            <li key={link.url}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {view.projects ? (
        <section aria-label="Projects" className="hb-public-sec">
          <h4>Projects</h4>
          {view.projects.length === 0 ? (
            <p className="mut">No public projects yet.</p>
          ) : (
            <ul className="hb-plain">
              {view.projects.map((project) => (
                <li key={project.id}>
                  <strong>{project.name}</strong> <Tag>{project.track}</Tag> <span className="mut">{project.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {view.journals ? (
        <section aria-label="Journals" className="hb-public-sec">
          <h4>Journals</h4>
          <p>
            {view.journals.entries} {view.journals.entries === 1 ? "entry" : "entries"}, {view.journals.hours} h logged
          </p>
        </section>
      ) : null}

      {view.achievements ? (
        <section aria-label="Achievements" className="hb-public-sec">
          <h4>Achievements</h4>
          {view.achievements.length === 0 ? (
            <p className="mut">None earned yet.</p>
          ) : (
            <ul className="hb-chips">
              {view.achievements.map((name) => (
                <li key={name}>
                  <Tag>{name}</Tag>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {view.stats ? (
        <section aria-label="Stats" className="hb-public-sec">
          <h4>Stats</h4>
          <dl className="hb-dl">
            <div>
              <dt>Approved ships</dt>
              <dd>{view.stats.approvedShips}</dd>
            </div>
            <div>
              <dt>Reviews done</dt>
              <dd>{view.stats.reviewsDone}</dd>
            </div>
            <div>
              <dt>Hours logged</dt>
              <dd>{view.stats.hoursLogged}</dd>
            </div>
            <div>
              <dt>Followers</dt>
              <dd>{view.stats.followers}</dd>
            </div>
            <div>
              <dt>Following</dt>
              <dd>{view.stats.following}</dd>
            </div>
          </dl>
        </section>
      ) : null}
    </article>
  );
}

/** The sections a builder has hidden, in words, so the preview does not look like it forgot them. */
export function hiddenSections(view: PublicProfile): string[] {
  return (Object.keys(VISIBILITY_LABELS) as (keyof typeof VISIBILITY_LABELS)[])
    .filter((key) => view[key] === null)
    .map((key) => VISIBILITY_LABELS[key].label);
}

export const PIN_LIMIT_TEXT = `Pin up to ${HUB_RULES.maxPinned} public projects.`;
