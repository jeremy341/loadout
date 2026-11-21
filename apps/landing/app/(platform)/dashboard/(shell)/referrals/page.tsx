import type { Metadata } from "next";
import "@/app/_components/platform/expeditions.css";
import { ExFlow } from "@/app/_components/platform/expeditions/Flow";
import { PageHead } from "@/app/_components/platform/PageHead";
import { EmptyState } from "@/app/_components/platform/EmptyState";
import { nextStep, NO_REWARD_SENTENCE, REFERRAL_LINK_SENTENCE, REFERRAL_STEPS, REFERRED_BUILDERS, referralStatus, referralTotals, stepsReached } from "@/lib/platform/referrals";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Referrals - LOADOUT" };

// Referrals, after Pixl's referrals page in structure (its page is an admin ledger; the builder side here is the rule, the
// link and the list). A referral counts real builders, not accounts: it qualifies after the first approved ship. Reward
// amounts are open, so none is stated. There is no link and nobody referred yet, and the page says so.
export default async function ReferralsPage() {
  await requireViewer();
  const totals = referralTotals(REFERRED_BUILDERS);

  return (
    <div className="pf-flat">
      <PageHead title="Referrals">Invite other builders. A referral counts once the builder you invited has an approved ship.</PageHead>

      <p className="pf-event-line">
        <span className="pf-event-dot" aria-hidden="true" />
        Referrals open with the platform release. This page shows how they will work.
      </p>

      <section className="pf-box" aria-labelledby="count-heading">
        <h2 id="count-heading">When a referral counts</h2>
        <p className="pf-panel-lead">A referral counts real builders, not accounts. It qualifies only after the builder you invited has done all of this, in order.</p>
        <ExFlow steps={REFERRAL_STEPS} current={null} label="Steps before a referral counts" />
        <p className="ex-closed">{NO_REWARD_SENTENCE}</p>
      </section>

      <section className="pf-box" aria-labelledby="invite-heading">
        <h2 id="invite-heading">Your invite link</h2>
        <label className="ex-field-label" htmlFor="invite-link">
          Invite link
        </label>
        <div className="ex-invite">
          <input id="invite-link" type="text" value="" placeholder="No link yet" disabled readOnly aria-describedby="invite-note" />
          <button type="button" className="pf-btn" disabled aria-describedby="invite-note">
            Copy link
          </button>
        </div>
        <p className="ex-closed" id="invite-note">
          {REFERRAL_LINK_SENTENCE}
        </p>
      </section>

      <section className="ex-section" aria-labelledby="referred-heading">
        <h2 id="referred-heading">
          Referred builders <span className="ex-label ex-num">{totals.referred}</span>
        </h2>
        {REFERRED_BUILDERS.length === 0 ? (
          <EmptyState title="No referred builders yet">Builders who join through your link are listed here, with the step each one has reached.</EmptyState>
        ) : (
          <div className="pf-table-wrap">
            <table className="pf-table ex-lines">
              <caption className="pf-sr">Builders who joined through your link</caption>
              <thead>
                <tr>
                  <th scope="col">Builder</th>
                  <th scope="col">Step reached</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {REFERRED_BUILDERS.map((builder) => (
                  <tr key={builder.handle}>
                    <th scope="row">{builder.handle}</th>
                    <td className="ex-num">
                      {stepsReached(builder.completed)} of {REFERRAL_STEPS.length}
                      {nextStep(builder.completed) ? `, next: ${nextStep(builder.completed)?.label}` : ""}
                    </td>
                    <td>{referralStatus(builder.completed) === "qualified" ? "Counts" : "Waiting"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
