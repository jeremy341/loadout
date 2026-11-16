import type { ReactNode } from "react";
import {
  JOURNAL_ACTION_LABELS,
  JOURNAL_ACTIONS,
  JOURNAL_HOURS,
  ORE_PER_HOUR,
  QUALITY_DIMENSIONS,
  REVIEW_STATUSES,
  STATUS_LABELS,
  STATUS_MEANING,
  USD_PER_TEN_ORE,
  VALIDITY_CHECKS,
  nextStatuses,
} from "@/lib/platform/review";
import { REVIEW_MACROS } from "@/reviewer-dash/lib/reviewMacros";

// The LOADOUT review guidelines, rendered inline in the review onboarding gate (Pixl keeps a snapshot of the YSWS guidelines here; the
// layout, the callout and the gate behaviour are Pixl's, the words are LOADOUT's). The plans own the rules (plans/01 sections 4.5,
// 4.7, 5, 6, 8 and 35, plans/02): these pages are a draft summary of them, so they are labelled as a draft. The last page is a recap
// of the rules that decide most reviews. Bump GUIDELINES_VERSION in guidelines.ts when the rules change.

export interface GuidelinePage {
  title: string;
  body: ReactNode;
}

// A highlighted callout for a rule reviewers must not miss.
function Key({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border-l-4 border-amber-500 bg-amber-500/10 px-3 py-2 text-sm">
      <strong>Important - </strong>
      {children}
    </p>
  );
}

function Terms({ children }: { children: ReactNode }) {
  return <dl className="space-y-2">{children}</dl>;
}

function Term({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div>
      <dt className="font-bold">{name}</dt>
      <dd className="hc-caption">{children}</dd>
    </div>
  );
}

// The rates come from lib/platform/review.ts, the one place that holds them.
const PAYS = `${ORE_PER_HOUR} Ore and ${ORE_PER_HOUR} Track XP for each hour`;
const ORE_VALUE = `Ten Ore is worth $${USD_PER_TEN_ORE.toFixed(2)}.`;

export const GUIDELINE_PAGES: GuidelinePage[] = [
  {
    title: "How a review goes",
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          A review decides whether the hours a builder claims become approved hours. Approved hours pay {PAYS}. {ORE_VALUE} These pages are a draft summary of the program rules, so check the plan if a rule here looks wrong.
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>First pass.</strong> You open a ship from Needs review, check that the project fits LOADOUT, check the evidence and
            the time, and write a note. Approving at this stage is a proposal: the ship goes to Spot check, where an owner or a final
            reviewer gives the verdict. Requesting changes sends it straight back to the builder. A ban is only a proposal too.
          </li>
          <li>
            <strong>Spot check.</strong> An owner or a final reviewer reads the first reviewer&apos;s note and hours call and gives the
            verdict: approve, request changes or, for owners, ban. Nobody gives a final verdict on a project they own or collaborate on.
          </li>
          <li>
            <strong>Proposed bans.</strong> A first-pass ban never bans outright. A different reviewer has to confirm or overturn it,
            and only an owner can confirm a ban.
          </li>
        </ol>
        <p>
          Fit comes first. The technical core belongs in Tools, Systems, Compute or Hardware, and the capability statement is credible. A
          project can be good and still not be a LOADOUT project.
        </p>
      </div>
    ),
  },
  {
    title: "Validity checklist",
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>The checks every ship goes through, in order, with where to look.</p>
        <Terms>
          {VALIDITY_CHECKS.map((check) => (
            <Term key={check.id} name={check.label}>
              {check.hint}
            </Term>
          ))}
        </Terms>
      </div>
    ),
  },
  {
    title: "Time and journals",
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          Each tracked minute can be assigned to one journal entry only. Time before LOADOUT started, time already used in another YSWS,
          and time spent only reading or watching do not count. A builder writes at least one entry for every {JOURNAL_HOURS} hours of
          development.
        </p>
        <p>On each entry a reviewer can:</p>
        <ul className="list-disc space-y-1 pl-5">
          {JOURNAL_ACTIONS.map((action) => (
            <li key={action}>{JOURNAL_ACTION_LABELS[action]}</li>
          ))}
        </ul>
        <Key>
          You can only lower the hours, never raise them. Lowering them needs a written reason the builder can read. Benefit of the doubt
          on intent, never on the number.
        </Key>
      </div>
    ),
  },
  {
    title: "Evidence",
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <ul className="list-disc space-y-1 pl-5">
          <li>Software time comes from Hackatime. Hardware time comes from Lapse.</li>
          <li>Lapse recordings are visible only to reviewers. Do not copy them anywhere else.</li>
          <li>Hardware ships need design files and a bill of materials with quantities and sources. Check the recordings against the parts list.</li>
          <li>The project page and journals are public. Never publish keys, credentials, private addresses or other personal information.</li>
          <li>
            AI use is declared. Look at commits, journals and code history, and do not rely on AI detectors. Commits signed by an AI tool
            when the builder declared none are flagged on the desk.
          </li>
          <li>Read the commit list against the tracked time. A large commit with almost no coding behind it is worth a question.</li>
        </ul>
      </div>
    ),
  },
  {
    title: "The track",
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          A project has exactly one track: Tools, Systems, Compute or Hardware. The builder picks it when the project is created, and it
          locks when they submit. All Track XP from the ship goes to that track, and a team ship shares one track. You do not set or
          change it.
        </p>
        <Key>
          If the work does not fit the track, request changes with the reason <strong>Does not fit the track</strong> (the{" "}
          <code>/track</code> macro). The builder then adds more work in that track, or changes the track, and ships again. Do not read a
          ship as another track just because its technology appears in the stack.
        </Key>
      </div>
    ),
  },
  {
    title: "Hardware and Research Mode",
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          <strong>Hardware.</strong> Review Lapse recordings in place of Hackatime and read them against the bill of materials. The parts
          list needs quantities and sources, and the design files must be in the public source. There is no per-project funding to check:
          LOADOUT does not fund individual builds.
        </p>
        <p>
          <strong>Research Mode</strong> is a modifier, not a track. Expect a question, a method, measurements and a public write-up. It does
          not lower the shipping requirement and it earns no extra XP.
        </p>
      </div>
    ),
  },
  {
    title: "Age and eligibility",
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          LOADOUT is for builders aged 13 to 18. If a builder turned 19 between shipping and your review, the desk flags it. Do not decide
          that alone: write what you see in the internal note and leave the call to an owner, who can record an age exception with a reason.
        </p>
        <p>
          Projects built as paid work, or as a school assignment, cannot be submitted. Time that was already counted in another YSWS cannot
          be counted again. The desk shows a double-dip banner when the repository, demo or tracked time matches another ship.
        </p>
      </div>
    ),
  },
  {
    title: "The note to the builder",
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          Write a short, friendly note the builder can use. These four dimensions guide it. They are not scores and they do not produce a
          multiplier.
        </p>
        <Terms>
          {QUALITY_DIMENSIONS.map((dimension) => (
            <Term key={dimension.name} name={dimension.name}>
              {dimension.ask}
            </Term>
          ))}
        </Terms>
        <p>Typing a macro in the note swaps in a canned message, which you can then edit:</p>
        <ul className="list-disc space-y-1 pl-5">
          {REVIEW_MACROS.map((macro) => (
            <li key={macro.trigger}>
              <code>{macro.trigger}</code> {macro.label}
            </li>
          ))}
        </ul>
        <p>The internal audit note is separate. Builders never see it. Someone who was not involved should reach the same conclusion you did.</p>
      </div>
    ),
  },
  {
    title: "Where a ship goes next",
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <Terms>
          {REVIEW_STATUSES.map((status) => {
            const next = nextStatuses(status);
            return (
              <Term key={status} name={STATUS_LABELS[status]}>
                {STATUS_MEANING[status]} {next.length === 0 ? "It is final." : `Next: ${next.map((item) => STATUS_LABELS[item]).join(", ")}.`}
              </Term>
            );
          })}
        </Terms>
      </div>
    ),
  },
  {
    title: "Recap: the rules that matter most",
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p className="text-muted-foreground">The whole set matters, but these decide most reviews. Internalize them.</p>
        <ul className="space-y-2">
          <li>
            <Key>
              <strong>One track per project.</strong> All Track XP goes to it. If the work does not fit, ask for changes with the reason
              Does not fit the track.
            </Key>
          </li>
          <li>
            <Key>
              <strong>Lower hours, never raise them.</strong> Every cut has a written reason. Approved hours pay {PAYS}.
            </Key>
          </li>
          <li>
            <Key>
              <strong>Outright fraud means no record.</strong> Fake tracked time, plagiarism or manufactured commits are not approved and
              not recorded as zero hours. Propose a ban and write the evidence in the internal note.
            </Key>
          </li>
          <li>
            <Key>
              <strong>AI slop is sent back.</strong> One prompt and no iteration or learning does not count. AI used with real effort, that
              works and taught the builder something, is fine when declared.
            </Key>
          </li>
          <li>
            <Key>
              <strong>Journals are due every {JOURNAL_HOURS} hours.</strong> A tracked minute is in one entry only.
            </Key>
          </li>
          <li>
            <Key>
              <strong>Hardware needs Lapse recordings and a bill of materials.</strong> Software needs Hackatime time and journals.
            </Key>
          </li>
          <li>
            <Key>
              <strong>Ages 13 to 18.</strong> Flag anything else for an owner. Paid work and school assignments cannot be submitted.
            </Key>
          </li>
          <li>
            <Key>
              <strong>Your note must be checkable by an outsider.</strong> Names, dates, links and numbers. Not &quot;looks good&quot; or
              &quot;checks out&quot;.
            </Key>
          </li>
        </ul>
      </div>
    ),
  },
];
