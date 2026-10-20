"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { EmptyState, PageHeader, Panel, PreviewNote, Status, Tag } from "../../ui/ui";
import { HUB_RULES, navLead } from "./data";
import {
  TRACKS,
  VISIBILITY_LABELS,
  buildPublicProfile,
  identityOf,
  resolveIdentity,
  sameIdentity,
  togglePinned,
  validateIdentity,
  type Identity,
  type ProfileLink,
  type Visibility,
} from "./logic/profile";
import { charLength } from "./logic/text";
import { AvatarPicker, PublicCard, hiddenSections } from "./profile-parts";
import { CheckRow, TextField, useAnnounce } from "./shared";
import { useHub, useProfile } from "./state";

// Profile: edit how you appear, choose what is public, and see exactly what others see. Everything is saved in this
// browser. The identity fields are saved with the Save button; the visibility switches and pins save as you change them.

type Touched = Partial<Record<"displayName" | "handle" | "bio" | "pronouns", boolean>>;

export function ProfilePage() {
  const hub = useHub();
  const { profile, saveIdentity, setVisibility, setPinned } = useProfile();
  const [message, announce] = useAnnounce();
  const [draft, setDraft] = useState<Identity | null>(null);
  const [touched, setTouched] = useState<Touched>({});
  const [tried, setTried] = useState(false);
  const addLinkRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const saved = identityOf(profile);
  const form = draft ?? saved;
  const dirty = draft !== null && !sameIdentity(draft, saved);
  const check = validateIdentity(form, saved.handle);
  const show = (field: keyof Touched) => (tried || touched[field] ? check.errors[field] : undefined);

  function edit(patch: Partial<Identity>) {
    setDraft({ ...form, ...patch });
  }
  function touch(field: keyof Touched) {
    setTouched((t) => ({ ...t, [field]: true }));
  }
  function setLink(index: number, patch: Partial<ProfileLink>) {
    edit({ links: form.links.map((link, i) => (i === index ? { ...link, ...patch } : link)) });
  }

  function onSave(event: FormEvent) {
    event.preventDefault();
    setTried(true);
    if (!check.ok) {
      announce("Your profile was not saved. Fix the fields marked with an error.");
      const first = formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.focus();
      return;
    }
    saveIdentity(check.value);
    setDraft(null);
    setTouched({});
    setTried(false);
    announce("Profile saved in this browser.");
  }

  function onDiscard() {
    setDraft(null);
    setTouched({});
    setTried(false);
    announce("Unsaved changes discarded.");
  }

  const publicProjects = hub.build.projects.filter((p) => p.visibility === "public");
  const privateCount = hub.build.projects.length - publicProjects.length;
  const previewIdentity = draft ? resolveIdentity(saved, draft) : saved;
  const view = buildPublicProfile(previewIdentity, profile.visibility, profile.pinned, {
    projects: hub.build.projects,
    journalEntries: hub.build.journalEntries,
    hoursLogged: hub.build.hoursLogged,
    approvedShips: hub.build.approvedShips,
    reviewsDone: hub.build.reviewsDone,
    followers: hub.community.followers,
    following: hub.community.following,
    earnedNames: hub.earnedNames,
  });
  const hidden = hiddenSections(view);

  function onVisibility(key: keyof Visibility, value: boolean) {
    setVisibility(key, value);
    announce(`${VISIBILITY_LABELS[key].label} are now ${value ? "shown on" : "hidden from"} your public profile.`);
  }

  function onPin(id: string) {
    const result = togglePinned(profile.pinned, id);
    if (!result.changed) {
      announce(result.reason ?? "That change was not made.");
      return;
    }
    setPinned(result.pinned);
    announce(result.pinned.includes(id) ? "Project pinned." : "Project unpinned.");
  }

  return (
    <>
      <PageHeader eyebrow="You" title="Profile" lead={navLead("profile")} />
      <PreviewNote>Your profile is saved in this browser only. The public view below is what other builders would see once profiles are live.</PreviewNote>
      <Status message={message} />

      <div className="pg-cols hb-profile">
        <div className="pg-stack">
          <Panel title="Edit profile" actions={dirty ? <Tag tone="warn">Unsaved changes</Tag> : <Tag>Saved</Tag>}>
            <form ref={formRef} onSubmit={onSave} noValidate className="hb-form">
              <div className="form-grid">
                <TextField
                  label="Display name"
                  value={form.displayName}
                  onChange={(v) => edit({ displayName: v })}
                  onBlur={() => touch("displayName")}
                  error={show("displayName")}
                  hint={`${HUB_RULES.displayName.min} to ${HUB_RULES.displayName.max} characters.`}
                  autoComplete="nickname"
                />
                <TextField
                  label="Handle"
                  value={form.handle}
                  onChange={(v) => edit({ handle: v })}
                  onBlur={() => touch("handle")}
                  error={show("handle")}
                  hint="Lowercase letters, numbers and hyphens. Must not match another builder."
                  autoComplete="username"
                />
              </div>
              <TextField
                label="Bio"
                multiline
                value={form.bio}
                onChange={(v) => edit({ bio: v })}
                onBlur={() => touch("bio")}
                error={show("bio")}
                hint={`${charLength(form.bio)} of ${HUB_RULES.bioMax} characters. Public. Keep keys, addresses and personal details out of it.`}
              />
              <div className="form-grid">
                <TextField
                  label="Pronouns (optional)"
                  value={form.pronouns}
                  onChange={(v) => edit({ pronouns: v })}
                  onBlur={() => touch("pronouns")}
                  error={show("pronouns")}
                  hint="Shown only if you fill it in."
                />
                <div className="fld">
                  <label className="fld-label" htmlFor="hb-track">
                    Track
                  </label>
                  <select id="hb-track" value={form.track} onChange={(event) => edit({ track: event.target.value as Identity["track"] })}>
                    {TRACKS.map((track) => (
                      <option key={track} value={track}>
                        {track}
                      </option>
                    ))}
                  </select>
                  <span className="fld-hint">Your main track, shown on your profile.</span>
                </div>
              </div>

              <AvatarPicker value={form.avatar} displayName={form.displayName} onChange={(avatar) => edit({ avatar })} error={check.errors.avatar} />

              <fieldset className="hb-fieldset">
                <legend className="fld-label">Links</legend>
                <p className="mut hb-help">Up to {HUB_RULES.maxLinks}. Addresses must start with https://. A label is optional.</p>
                {form.links.map((link, index) => (
                  <div key={index} className="hb-link-row">
                    <TextField label={`Link ${index + 1} label`} value={link.label} onChange={(v) => setLink(index, { label: v })} maxLength={HUB_RULES.linkLabelMax} />
                    <TextField
                      label={`Link ${index + 1} address`}
                      type="url"
                      inputMode="url"
                      value={link.url}
                      onChange={(v) => setLink(index, { url: v })}
                      error={tried || link.url ? check.errors.links[index] : null}
                      placeholder="https://"
                    />
                    <button
                      type="button"
                      className="btn btn-quiet btn-sm"
                      onClick={() => {
                        edit({ links: form.links.filter((_, i) => i !== index) });
                        announce(`Link ${index + 1} removed.`);
                        addLinkRef.current?.focus();
                      }}
                    >
                      Remove link {index + 1}
                    </button>
                  </div>
                ))}
                {check.errors.linksTotal ? (
                  <span className="fld-error" role="alert">
                    {check.errors.linksTotal}
                  </span>
                ) : null}
                <button
                  type="button"
                  ref={addLinkRef}
                  className="btn btn-quiet btn-sm"
                  disabled={form.links.length >= HUB_RULES.maxLinks}
                  onClick={() => edit({ links: [...form.links, { label: "", url: "" }] })}
                >
                  Add a link
                </button>
              </fieldset>

              <div className="pg-actions">
                <button type="submit" className="btn" disabled={!dirty}>
                  Save profile
                </button>
                <button type="button" className="btn btn-quiet" disabled={!dirty} onClick={onDiscard}>
                  Discard changes
                </button>
              </div>
            </form>
          </Panel>

          <Panel title="What is public">
            <p className="mut">
              Everything is public by default, as the program plans for ships, journals and project pages. Switch a section off to hide it. These save as you change them.
            </p>
            <fieldset className="hb-fieldset">
              <legend className="sr-only">Sections shown on your public profile</legend>
              {(Object.keys(VISIBILITY_LABELS) as (keyof Visibility)[]).map((key) => (
                <CheckRow
                  key={key}
                  label={`Show my ${VISIBILITY_LABELS[key].label.toLowerCase()}`}
                  help={VISIBILITY_LABELS[key].help}
                  checked={profile.visibility[key]}
                  onChange={(checked) => onVisibility(key, checked)}
                />
              ))}
            </fieldset>
            <p className="mut hb-help">
              Lapse recordings are visible only to reviewers and are never part of a profile. Opting out of public rankings is a setting in{" "}
              <Link href="/leaderboards">Leaderboards</Link>.
            </p>
          </Panel>

          <Panel title="Pinned projects">
            {publicProjects.length === 0 ? (
              <EmptyState
                title="No public projects to pin"
                action={
                  <Link href="/projects" className="btn btn-quiet btn-sm">
                    Open Projects
                  </Link>
                }
              >
                Pin a project once you have a public one. A private project is never shown.
              </EmptyState>
            ) : (
              <fieldset className="hb-fieldset">
                <legend className="mut">Pin up to {HUB_RULES.maxPinned} of your public projects. With none pinned, your first public projects are shown.</legend>
                {publicProjects.map((project) => (
                  <CheckRow
                    key={project.id}
                    label={project.name}
                    help={`${project.track}, ${project.status}`}
                    checked={profile.pinned.includes(project.id)}
                    onChange={() => onPin(project.id)}
                  />
                ))}
              </fieldset>
            )}
            {privateCount > 0 ? <p className="mut hb-help">{privateCount} private {privateCount === 1 ? "project is" : "projects are"} never shown on your profile.</p> : null}
          </Panel>
        </div>

        <Panel title="Public view" actions={dirty ? <Tag tone="warn">Showing unsaved edits</Tag> : <Tag>Matches saved profile</Tag>} className="hb-sticky">
          <p className="mut">Only public fields appear here. It is built from your profile and the same numbers the other tabs show.</p>
          <PublicCard view={view} />
          {hidden.length > 0 ? <p className="mut hb-help">Hidden from others: {hidden.join(", ")}.</p> : null}
        </Panel>
      </div>
    </>
  );
}
