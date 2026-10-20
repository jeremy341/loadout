"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { EmptyState, Field, PageHeader, Panel, PreviewNote, Stat, StatGrid, Status, Tag } from "../../ui/ui";
import { usePreviewState } from "../../../lib/preview-store";
import { ME } from "../../../lib/sample/builders";
import { PLAN_RULES } from "./data";
import {
  GEAR_KEYS,
  NO_CODE,
  NO_REFERRALS,
  NO_USAGE,
  addReferralNow,
  advanceReferralNow,
  applyReferralCodeNow,
  removeReferralNow,
  removeUsageNow,
  rewindReferralNow,
  saveUsageNow,
} from "./gear-store";
import { navLead } from "./gear-nav";
import { PreviewTools, formatStamp, useAnnounce } from "./gear-ui";
import {
  LABEL_MAX,
  LABEL_MIN,
  MAX_INVITES,
  REFERRAL_STAGES,
  STAGE_COUNT,
  inviteMessage,
  isQualified,
  qualifiedCount,
  referralCode,
  stageLabel,
  type Referral,
  type UsageEntry,
} from "./logic/referrals";

// Plans/02 sections 16 and 19 (and the Referrals public Docs page). A referral counts only after the invited
// builder verifies, tracks and journals real work, and earns a first approved ship. The reward amounts and any
// milestone ladder are open, so this page never computes or grants Ore. Usage Milestones thresholds and rewards are
// open too, so they are shown as "to be announced".

export function ReferralsPage() {
  const code = referralCode(ME.handle);
  const [referrals] = usePreviewState<Referral[]>(GEAR_KEYS.referrals, NO_REFERRALS);
  const [message, announce] = useAnnounce();
  const qualified = qualifiedCount(referrals);

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      announce(`${what} copied.`);
    } catch {
      announce(`Could not copy automatically. Select the ${what.toLowerCase()} and copy it by hand.`);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Gear" title="Referrals" lead={navLead("referrals")} />
      <PreviewNote>
        Invites here are nicknames kept only in this browser. Nothing is emailed, and the people shown are not real accounts. Rewards are set by the program and are not granted in the preview.
      </PreviewNote>
      <div className="gr-stack">
        <StatGrid>
          <Stat label="Invites" value={referrals.length} hint={`Up to ${MAX_INVITES} in the preview`} />
          <Stat label="Qualified" value={qualified} hint="First approved ship earned" />
          <Stat label="In progress" value={referrals.length - qualified} hint="Not qualified yet" />
        </StatGrid>
        <Status message={message} />

        <Panel title="Your referral code">
          <div className="gr-stack">
            <p>
              <span className="gr-code" aria-label={`Your referral code is ${code}`}>
                {code}
              </span>
            </p>
            <div className="gr-row">
              <button type="button" className="btn btn-sm" onClick={() => copy(code, "Code")}>
                Copy code
              </button>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => copy(inviteMessage(code), "Invite message")}>
                Copy invite message
              </button>
            </div>
            <p className="mut">
              The code comes from your handle, so it never changes. Sign-up links open with accounts; until then the code is for sharing in a message.
            </p>
            <p className="gr-note">
              <strong>Reward set by the program.</strong> The plans leave the reward amounts and any milestone ladder open, so this page shows no figure and grants no Ore. Building stays the main source of Ore.
            </p>
          </div>
        </Panel>

        <Panel title="How a referral qualifies">
          <div className="gr-stack">
            <p>A referral counts when the builder you invited reaches the last step. Accounts alone earn nothing.</p>
            <ol className="gr-steps">
              {REFERRAL_STAGES.map((stage) => (
                <li key={stage.id}>
                  <strong>{stage.label}.</strong> {stage.detail}
                </li>
              ))}
            </ol>
            <p className="gr-note">
              <strong>Anti-abuse.</strong> You cannot refer yourself, and referred accounts fall under the program&apos;s existing anti-fraud rules. Fake accounts, referral rings and rewards for accounts that never build are not allowed.
            </p>
          </div>
        </Panel>

        <InvitesPanel referrals={referrals} announce={announce} />
        <AppliedCodePanel announce={announce} />
        <UsagePanel announce={announce} />

        <Panel title="External contributor achievement">
          <div className="gr-prose">
            <p>
              Every accepted project is open source. The first meaningful contribution to your project from someone outside the project team earns a one-time achievement worth {PLAN_RULES.externalContributorOre} Ore.
            </p>
            <p>
              The contribution must materially improve the project. Typo farming, trivial changes and fake contributor rings do not count. The Achievements tab owns this reward, so nothing is granted here.
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
}

// --- Invites ----------------------------------------------------------------------------------------------------

function InvitesPanel({ referrals, announce }: { referrals: Referral[]; announce: (message: string) => void }) {
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (attempt > 0) inputRef.current?.focus();
  }, [attempt]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = addReferralNow(label);
    if (!result.ok) {
      setError(result.error);
      setAttempt((n) => n + 1);
      announce(`Invite not added. ${result.error}`);
      return;
    }
    setError(null);
    setLabel("");
    announce(`Invite sent to ${result.referral.label} (kept only in this browser).`);
    inputRef.current?.focus();
  }

  return (
    <Panel title="Invites">
      <div className="gr-stack">
        <form className="gr-stack" onSubmit={submit} noValidate>
          <Field
            label="Nickname"
            hint={`${LABEL_MIN} to ${LABEL_MAX} characters. Use a nickname, never a real name or an email address.`}
            error={error}
          >
            <input
              ref={inputRef}
              type="text"
              value={label}
              maxLength={LABEL_MAX + 10}
              aria-invalid={Boolean(error)}
              autoComplete="off"
              onChange={(event) => setLabel(event.target.value)}
            />
          </Field>
          <div className="gr-row">
            <button type="submit" className="btn btn-sm">
              Add invite
            </button>
          </div>
        </form>

        {referrals.length === 0 ? (
          <EmptyState title="No invites yet">Add a nickname for someone you plan to invite and follow them through the four steps here.</EmptyState>
        ) : (
          <ul className="gr-stack" aria-label="Your invites">
            {referrals.map((referral) => (
              <li key={referral.id} className="gr-order">
                <InviteRow referral={referral} announce={announce} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

function InviteRow({ referral, announce }: { referral: Referral; announce: (message: string) => void }) {
  const [removing, setRemoving] = useState(false);
  const confirmRef = useRef<HTMLParagraphElement>(null);
  const removeBtnRef = useRef<HTMLButtonElement>(null);
  const qualified = isQualified(referral);
  const next = REFERRAL_STAGES[referral.completed];

  useEffect(() => {
    if (removing) confirmRef.current?.focus();
  }, [removing]);

  return (
    <>
      <div className="gr-row-between">
        <h3>{referral.label}</h3>
        <Tag tone={qualified ? "ok" : "plain"}>{qualified ? "Qualified" : stageLabel(referral)}</Tag>
      </div>
      <p className="mut">Invite added {formatStamp(referral.createdAt)}</p>
      <ol className="gr-timeline" aria-label={`Progress of ${referral.label}`}>
        {REFERRAL_STAGES.map((stage, index) => {
          const done = index < referral.completed;
          const isNext = index === referral.completed;
          const stamp = referral.stamps.find((s) => s.stage === index + 1);
          return (
            <li key={stage.id} data-state={done ? "done" : isNext ? "current" : "waiting"}>
              <span className="gr-step-name">
                {index + 1}. {stage.label}
              </span>
              <span className="gr-step-state">
                {done ? `Done${stamp ? `, ${formatStamp(stamp.at)}` : ""}` : isNext ? "Next step" : "Waiting"}
              </span>
            </li>
          );
        })}
      </ol>
      {qualified ? (
        <p>
          <strong>Qualified.</strong> This invite earned a first approved ship. The reward is set by the program and is not granted in the preview.
        </p>
      ) : null}

      {removing ? (
        <div className="gr-confirm" role="group" aria-labelledby={`gr-rm-${referral.id}`}>
          <p id={`gr-rm-${referral.id}`} ref={confirmRef} tabIndex={-1} className="gr-focus-target">
            <strong>Remove the invite for {referral.label}?</strong> Its progress is deleted.
          </p>
          <div className="gr-row">
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                removeReferralNow(referral.id);
                announce(`Invite for ${referral.label} removed.`);
              }}
            >
              Yes, remove
            </button>
            <button
              type="button"
              className="btn btn-quiet btn-sm"
              onClick={() => {
                setRemoving(false);
                window.setTimeout(() => removeBtnRef.current?.focus(), 0);
              }}
            >
              Keep it
            </button>
          </div>
        </div>
      ) : (
        <div className="gr-row">
          <button ref={removeBtnRef} type="button" className="btn btn-quiet btn-sm" onClick={() => setRemoving(true)}>
            Remove invite<span className="sr-only"> for {referral.label}</span>
          </button>
        </div>
      )}

      <PreviewTools level={4} hint="There is no sign-up or review service yet. These buttons stand in for what the invited builder does.">
        {next ? (
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={() => {
              const result = advanceReferralNow(referral.id);
              if (result.referral) {
                announce(
                  result.qualifiedNow
                    ? `${referral.label} reached ${next.label} and now qualifies (simulated).`
                    : `${referral.label} completed step ${result.referral.completed} of ${STAGE_COUNT}: ${next.label} (simulated).`,
                );
              }
            }}
          >
            Simulate: {next.label}
          </button>
        ) : null}
        {referral.completed > 0 ? (
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={() => {
              rewindReferralNow(referral.id);
              announce(`${referral.label} stepped back one stage.`);
            }}
          >
            Step back one stage
          </button>
        ) : null}
      </PreviewTools>
    </>
  );
}

// --- Entering a code you were given ------------------------------------------------------------------------------

function AppliedCodePanel({ announce }: { announce: (message: string) => void }) {
  const [referredBy] = usePreviewState<string | null>(GEAR_KEYS.referredBy, NO_CODE);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = applyReferralCodeNow(input);
    if (!result.ok) {
      setError(result.error);
      announce(`Code not saved. ${result.error}`);
      return;
    }
    setError(null);
    setInput("");
    announce(`Referral code ${result.code} saved.`);
  }

  return (
    <Panel title="Got a code?">
      <div className="gr-stack">
        <p className="mut">
          If a builder shared their code with you, enter it here. The preview only checks the format and that it is not your own, because there is no account service to look codes up.
        </p>
        {referredBy ? (
          <p>
            Code saved: <strong>{referredBy}</strong>
          </p>
        ) : null}
        <form className="gr-stack" onSubmit={submit} noValidate>
          <Field label="Referral code" hint="Looks like LO-ABC234" error={error}>
            <input type="text" value={input} maxLength={12} autoComplete="off" aria-invalid={Boolean(error)} onChange={(event) => setInput(event.target.value)} />
          </Field>
          <div className="gr-row">
            <button type="submit" className="btn btn-sm">
              Save code
            </button>
          </div>
        </form>
      </div>
    </Panel>
  );
}

// --- Usage Milestones --------------------------------------------------------------------------------------------

function UsagePanel({ announce }: { announce: (message: string) => void }) {
  const [entries] = usePreviewState<UsageEntry[]>(GEAR_KEYS.usage, NO_USAGE);
  const [project, setProject] = useState("");
  const [users, setUsers] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const projectRef = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = saveUsageNow({ project, users, note });
    if (!result.ok) {
      setError(result.error);
      announce(`Not saved. ${result.error}`);
      projectRef.current?.focus();
      return;
    }
    setError(null);
    setProject("");
    setUsers("");
    setNote("");
    announce(`Saved ${result.entry.users.toLocaleString("en-GB")} users for ${result.entry.project}.`);
  }

  return (
    <Panel title="Usage Milestones">
      <div className="gr-stack">
        <div className="gr-prose">
          <p>
            Usage Milestones reward verified, real people using a project you shipped. They are separate from Signal, which measures views, stars and downloads.
          </p>
          <p className="gr-note">
            <strong>Thresholds: to be announced. Rewards: to be announced.</strong> The plans leave both open. Counts you enter here are your own notes: nobody verifies them in the preview, and no reward is calculated.
          </p>
        </div>
        <form className="gr-stack" onSubmit={submit} noValidate>
          <div className="form-grid">
            <Field label="Project" error={error}>
              <input ref={projectRef} type="text" value={project} maxLength={60} aria-invalid={Boolean(error)} onChange={(event) => setProject(event.target.value)} />
            </Field>
            <Field label="Verified users" hint="Whole number. Saving a project that is already listed updates it.">
              <input type="text" inputMode="numeric" value={users} onChange={(event) => setUsers(event.target.value)} />
            </Field>
            <div className="wide">
              <Field label="How you count them" hint="Optional, up to 200 characters.">
                <input type="text" value={note} maxLength={200} onChange={(event) => setNote(event.target.value)} />
              </Field>
            </div>
          </div>
          <div className="gr-row">
            <button type="submit" className="btn btn-sm">
              Save count
            </button>
          </div>
        </form>

        {entries.length === 0 ? (
          <EmptyState title="No counts yet">Add a project and the number of verified users to keep track here.</EmptyState>
        ) : (
          <div className="tbl-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="tbl">
              <caption className="sr-only">Usage counts by project</caption>
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col" className="num">
                    Users
                  </th>
                  <th scope="col">Threshold</th>
                  <th scope="col">Reward</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <th scope="row">
                      {entry.project}
                      {entry.note ? <span className="mut"> ({entry.note})</span> : null}
                    </th>
                    <td className="num">{entry.users.toLocaleString("en-GB")}</td>
                    <td>To be announced</td>
                    <td>To be announced</td>
                    <td>
                      {removingId === entry.id ? (
                        <span className="gr-row" role="group" aria-label={`Remove ${entry.project}`}>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              removeUsageNow(entry.id);
                              setRemovingId(null);
                              announce(`${entry.project} removed.`);
                              projectRef.current?.focus();
                            }}
                          >
                            Yes, remove
                          </button>
                          <button type="button" className="btn btn-quiet btn-sm" onClick={() => setRemovingId(null)}>
                            Keep
                          </button>
                        </span>
                      ) : (
                        <span className="gr-row">
                          <button
                            type="button"
                            className="btn btn-quiet btn-sm"
                            onClick={() => {
                              setProject(entry.project);
                              setUsers(String(entry.users));
                              setNote(entry.note);
                              projectRef.current?.focus();
                            }}
                          >
                            Edit<span className="sr-only"> {entry.project}</span>
                          </button>
                          <button type="button" className="btn btn-quiet btn-sm" onClick={() => setRemovingId(entry.id)}>
                            Remove<span className="sr-only"> {entry.project}</span>
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Panel>
  );
}
