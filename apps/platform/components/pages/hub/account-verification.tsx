"use client";

import { pushNotification } from "../../../lib/notifications";
import { Panel, Tag } from "../../ui/ui";
import { nowIso } from "./actions";
import { STATUS_TEXT, VERIFICATION_STEPS, transition, type VerificationAction, type VerificationStatus } from "./logic/account";
import { formatDayUtc } from "./logic/text";
import { PreviewTools } from "./shared";
import { useVerification } from "./state";

// Hack Club teen verification, simulated. The real sign-in and verification are not connected, so the status only
// changes through the Preview tools below, and the page says so.

const ACTIONS: { action: VerificationAction; label: string; quiet?: boolean }[] = [
  { action: "start", label: "Start verification (preview)" },
  { action: "verify", label: "Mark verified (preview)" },
  { action: "flag", label: "Mark needs attention (preview)", quiet: true },
  { action: "retry", label: "Try again (preview)" },
  { action: "reset", label: "Reset to not started", quiet: true },
];

const NOTE_TITLE: Partial<Record<VerificationStatus, string>> = {
  pending: "Verification is pending (preview)",
  verified: "Verification complete (preview)",
  needs_attention: "Verification needs attention (preview)",
};

export function VerificationTab({ announce }: { announce: (message: string) => void }) {
  const { state, set } = useVerification();
  const text = STATUS_TEXT[state.status];

  function run(action: VerificationAction) {
    const at = nowIso();
    const result = transition(state, action, at);
    if (!result.ok) {
      announce(result.error);
      return;
    }
    set(result.state);
    const title = NOTE_TITLE[result.state.status];
    if (title && action !== "reset") pushNotification({ kind: "system", title, body: "This is a simulated status. Hack Club was not contacted.", href: "/account" });
    announce(action === "reset" ? "Verification reset to not started." : `Verification is now ${STATUS_TEXT[result.state.status].label.toLowerCase()}.`);
  }

  return (
    <div className="pg-stack">
      <Panel title="Teen verification through Hack Club" actions={<Tag tone={text.tone}>{text.label}</Tag>}>
        <p>{text.detail}</p>
        <p className="mut">Exact Hack Club sign-in and verification integration is not connected yet. The status below is simulated in this browser.</p>

        <ol className="hb-timeline" aria-label="Verification steps">
          {VERIFICATION_STEPS.map((step, index) => {
            const reached = state.status === "verified" || (state.status === "pending" && index <= 1) || (state.status === "not_started" && index === 0);
            const current = state.status === step.status;
            return (
              <li key={step.status} data-reached={reached} aria-current={current ? "step" : undefined}>
                <span className="hb-step-no" aria-hidden="true">
                  {index + 1}
                </span>
                <span>
                  {step.label}
                  {current ? <span className="sr-only"> (current step)</span> : null}
                </span>
              </li>
            );
          })}
        </ol>
        {state.status === "needs_attention" ? (
          <p className="hb-alert" role="note">
            <strong>Needs attention.</strong> This is a separate state from the three steps above. Fix what Hack Club asked for, then try again.
          </p>
        ) : null}

        {state.updatedAt ? <p className="mut">Last change: {formatDayUtc(state.updatedAt)} (UTC).</p> : null}
      </Panel>

      <PreviewTools hint="The real check happens at Hack Club. These buttons stand in for it so you can see each state.">
        <div className="pg-actions">
          {ACTIONS.map((a) => (
            <button
              key={a.action}
              type="button"
              className={`btn btn-sm${a.quiet ? " btn-quiet" : ""}`}
              disabled={!transition(state, a.action, "").ok}
              onClick={() => run(a.action)}
            >
              {a.label}
            </button>
          ))}
        </div>
      </PreviewTools>
    </div>
  );
}
