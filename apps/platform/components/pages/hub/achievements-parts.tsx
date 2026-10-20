"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { EmptyState, Meter, Panel, Tag } from "../../ui/ui";
import { HUB_RULES } from "./data";
import { submitContributorClaimNow, withdrawContributorClaimNow } from "./actions";
import { rewardLabel, type AchievementRow } from "./logic/achievements";
import { CREDIT_KEY, canSubmit, validateClaim, type ClaimsState } from "./logic/claims";
import { formatDayUtc } from "./logic/text";
import { CheckRow, Sprite, TextField } from "./shared";

export function AchievementCard({ row }: { row: AchievementRow }) {
  const { def } = row;
  const pct = Math.round((row.value / row.target) * 100);
  return (
    <li className="card hb-ach" data-earned={row.earned}>
      <div className="hb-ach-head">
        <span className="hb-ach-icon" data-earned={row.earned}>
          <Sprite name={row.earned ? "xp-star" : "document"} size={32} />
        </span>
        <h3>{def.name}</h3>
      </div>
      <p className="hb-tags">
        <Tag tone={row.earned ? "ok" : "plain"}>{row.earned ? "Earned" : "Locked"}</Tag>
        <Tag>{def.rarity}</Tag>
        <Tag>{def.track ?? "Any track"}</Tag>
        <Tag tone={def.rule === "plan" ? "accent" : "plain"}>{def.rule === "plan" ? "Plan 02" : "Draft preview rule"}</Tag>
      </p>
      <p>{def.criteria}</p>
      <div className="hb-ach-progress">
        <Meter value={row.value} max={row.target} label={`${def.name} progress`} />
        <p className="mut hb-help">
          {row.value} of {row.target}
          {row.earned ? "" : ` (${pct}%)`}
        </p>
      </div>
      <p className="mut">
        {row.earned && row.earnedAt ? (
          <>
            Earned <time dateTime={row.earnedAt}>{formatDayUtc(row.earnedAt)}</time>.{" "}
          </>
        ) : null}
        Reward: {rewardLabel(def)}.
      </p>
    </li>
  );
}

const ATTEST = "I confirm this came from someone outside my project team and materially improved the project. It is not a typo fix or a trivial change.";

/** The plan-defined external-contributor achievement: record the claim, then wait for review. */
export function ContributorPanel({
  claims,
  projects,
  announce,
}: {
  claims: ClaimsState;
  projects: readonly { id: string; name: string }[];
  announce: (message: string) => void;
}) {
  const claim = claims.contributor;
  const [projectId, setProjectId] = useState("");
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [attested, setAttested] = useState(false);
  const [tried, setTried] = useState(false);

  const input = { projectId, link, note, attested };
  const check = validateClaim(input, projects);
  const err = (field: keyof typeof check.errors) => (tried ? check.errors[field] : undefined);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setTried(true);
    if (!check.ok) {
      announce("The claim was not recorded. Fix the fields marked with an error.");
      return;
    }
    const result = submitContributorClaimNow(input, projects);
    if (!result.ok) {
      announce(result.error);
      return;
    }
    setTried(false);
    setLink("");
    setNote("");
    setAttested(false);
    setProjectId("");
    announce("Claim recorded and waiting for review.");
  }

  return (
    <Panel title="First outside contribution" actions={<Tag tone="accent">+{HUB_RULES.contributorOre} Ore, once</Tag>}>
      <p>
        Every accepted project is open source. The first meaningful contribution from someone outside the project team earns a one-time achievement worth +
        {HUB_RULES.contributorOre} Ore. No typo farming, trivial changes or fake contributor rings count.
      </p>

      {claim && claim.status === "pending" ? (
        <div className="hb-claim" role="group" aria-label="Your claim">
          <p>
            <Tag tone="warn">Pending review</Tag>
          </p>
          <dl className="hb-dl hb-dl-wide">
            <div>
              <dt>Project</dt>
              <dd>{claim.projectName}</dd>
            </div>
            <div>
              <dt>Contribution</dt>
              <dd>
                <a href={claim.link} target="_blank" rel="noopener noreferrer">
                  {claim.link}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </dd>
            </div>
            <div>
              <dt>Recorded</dt>
              <dd>{formatDayUtc(claim.submittedAt)}</dd>
            </div>
            {claim.note ? (
              <div>
                <dt>Note</dt>
                <dd>{claim.note}</dd>
              </div>
            ) : null}
          </dl>
          <p className="mut">
            Verification is not built yet, so nothing reviews this automatically. Use the Approve (preview) button under Preview tools to see what approval does.
          </p>
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={() => {
              withdrawContributorClaimNow();
              announce("Claim withdrawn.");
            }}
          >
            Withdraw claim
          </button>
        </div>
      ) : null}

      {claims.credited[CREDIT_KEY] || claim?.status === "approved" ? (
        <div className="hb-claim" role="group" aria-label="Your claim">
          <p>
            <Tag tone="ok">Approved</Tag>
          </p>
          <p>
            {claim ? <>Your contribution to {claim.projectName} was approved. </> : null}
            {claims.credited[CREDIT_KEY] ? (
              <>
                +{HUB_RULES.contributorOre} Ore was added to your ledger on {formatDayUtc(claims.credited[CREDIT_KEY].at)}. It is one-time and cannot be claimed again.
              </>
            ) : (
              <>The Ore was already in your ledger, so none was added again.</>
            )}
          </p>
        </div>
      ) : null}

      {claim?.status === "rejected" ? (
        <p className="hb-claim">
          <Tag tone="bad">Not approved</Tag> Your last claim was not approved. You can record a new one below.
        </p>
      ) : null}

      {canSubmit(claims) ? (
        projects.length === 0 ? (
          <EmptyState
            title="Create a project first"
            action={
              <Link href="/projects" className="btn btn-quiet btn-sm">
                Open Projects
              </Link>
            }
          >
            A claim names the project that received the contribution.
          </EmptyState>
        ) : (
          <form onSubmit={onSubmit} noValidate className="hb-form">
            <h3 className="hb-sub">Record a contribution</h3>
            <div className="fld">
              <label className="fld-label" htmlFor="hb-claim-project">
                Project
              </label>
              <select
                id="hb-claim-project"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                aria-invalid={err("project") ? true : undefined}
                aria-describedby={err("project") ? "hb-claim-project-err" : undefined}
              >
                <option value="">Choose a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {err("project") ? (
                <span className="fld-error" id="hb-claim-project-err" role="alert">
                  {err("project")}
                </span>
              ) : null}
            </div>
            <TextField
              label="Link to the pull request or issue"
              type="url"
              inputMode="url"
              value={link}
              onChange={setLink}
              placeholder="https://"
              error={err("link")}
              hint="An https:// address on the project's public repository."
            />
            <TextField
              label="Note (optional)"
              multiline
              value={note}
              onChange={setNote}
              error={err("note")}
              hint={`What changed and why it matters. Up to ${HUB_RULES.claimNoteMax} characters.`}
            />
            <div>
              <CheckRow label="Self-attestation" help={ATTEST} checked={attested} onChange={setAttested} />
              {err("attested") ? (
                <span className="fld-error" role="alert">
                  {err("attested")}
                </span>
              ) : null}
            </div>
            <div className="pg-actions">
              <button type="submit" className="btn">
                Record claim
              </button>
            </div>
          </form>
        )
      ) : null}
    </Panel>
  );
}
