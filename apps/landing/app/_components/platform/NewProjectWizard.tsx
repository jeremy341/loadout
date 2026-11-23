"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useReducer, useRef, useState, type KeyboardEvent } from "react";
import { TRACK_BUILDS } from "@/app/_components/home/tracks-data";
import { createProject, type FormState } from "@/lib/platform/actions";
import { checkLinkUrl } from "@/lib/platform/profile";
import { kindOfTrack, PROJECT_DESCRIPTION_MAX, PROJECT_TITLE_MAX, SOFTWARE_TRACKS, type ProjectField, type ProjectKind } from "@/lib/platform/projects";
import { SPARKS, sparkGroup, sparkPage, sparkText } from "@/lib/platform/sparks";
import {
  draftDirty,
  EMPTY_DRAFT,
  parseDraft,
  stepOfField,
  stepProblem,
  stepValid,
  WIZARD_STEPS,
  type WizardDraft,
} from "@/lib/platform/wizard";
import { HackatimeProjects, type HackatimeProject } from "./HackatimeProjects";
import { PfModal } from "./PfModal";
import { ProjectPreviewCard } from "./ProjectPreviewCard";
import "./wizard.css";

const STORAGE_KEY = "loadout-new-project";
// Filled from Hackatime once it is connected. Empty until then, so no made-up projects or hours are shown.
const HACKATIME_PROJECTS: readonly HackatimeProject[] = [];
const idle: FormState = { status: "idle" };
const DESCRIPTION_SHIP_MIN = 40;

// Small marks for the two kind cards and the Next arrow (brief .ulpi/design/wizard-focus-layout.md). Hand drawn on a pixel grid,
// square ends, decoration only: the card name and the button label carry the meaning.
const SOFTWARE_ICON = (
  <svg viewBox="0 0 16 12" width="24" height="18" fill="currentColor" focusable="false">
    <path d="M5 1h2v1H5zM4 2h2v1H4zM3 3h2v1H3zM2 4h2v1H2zM1 5h2v1H1zM1 6h2v1H1zM2 7h2v1H2zM3 8h2v1H3zM4 9h2v1H4zM5 10h2v1H5zM9 1h2v1H9zM10 2h2v1h-2zM11 3h2v1h-2zM12 4h2v1h-2zM13 5h2v1h-2zM13 6h2v1h-2zM12 7h2v1h-2zM11 8h2v1h-2zM10 9h2v1h-2zM9 10h2v1H9z" />
  </svg>
);
const HARDWARE_ICON = (
  <svg viewBox="0 0 12 12" width="20" height="20" fill="currentColor" focusable="false">
    <path d="M3 3h6v6H3zm1 1v4h4V4zM5 5h2v2H5zM4 0h1v2H4zM7 0h1v2H7zM4 10h1v2H4zM7 10h1v2H7zM0 4h2v1H0zM0 7h2v1H0zM10 4h2v1h-2zM10 7h2v1h-2z" fillRule="evenodd" />
  </svg>
);
const NEXT_ARROW = (
  <svg viewBox="0 0 12 12" width="14" height="14" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M1 5h8v2H1zM7 3h1v1H7zM8 4h1v1H8zM9 5h1v2H9zM8 7h1v1H8zM7 8h1v1H7z" />
  </svg>
);

// There is one wizard on its page, so its field ids are fixed names.
const FIELD_ID: Record<string, string> = {
  description: "wiz-description",
  title: "wiz-title",
  repoUrl: "wiz-repo-url",
  demoUrl: "wiz-demo-url",
};

type Action = { type: "set"; key: keyof WizardDraft; value: string } | { type: "restore"; draft: WizardDraft } | { type: "reset" };

function reduce(draft: WizardDraft, action: Action): WizardDraft {
  if (action.type === "set") return { ...draft, [action.key]: action.value };
  if (action.type === "restore") return action.draft;
  return EMPTY_DRAFT;
}

// Storage can be blocked or full, so every access is wrapped.
function readStorage(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
function writeStorage(draft: WizardDraft | null, step = 0) {
  try {
    if (draft && draftDirty(draft)) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, step }));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do: the draft just will not survive a refresh.
  }
}

// Software has an extra step for its track, right after the kind. Hardware has the one track, so it skips that step. The lib's
// five steps stay as they are; the track step lives here. The strip shows six segments for software (owner, 22 Nov 2026: six is fine).
type StepKey = (typeof WIZARD_STEPS)[number]["key"] | "track";
type StepItem = { key: StepKey; label: string; heading: string };
const TRACK_STEP: StepItem = { key: "track", label: "Track", heading: "Which track is it?" };
const stepsFor = (software: boolean): readonly StepItem[] => (software ? [WIZARD_STEPS[0], TRACK_STEP, ...WIZARD_STEPS.slice(1)] : WIZARD_STEPS);
const isSoftwareTrack = (track: string) => (SOFTWARE_TRACKS as readonly string[]).includes(track);

// What stops a step, or null when it is fine.
function problemAt(steps: readonly StepItem[], index: number, draft: WizardDraft, kind: ProjectKind | null): { field: ProjectField; message: string } | null {
  const key = steps[index].key;
  if (key === "kind") return kind ? null : { field: "track", message: "Pick a kind." };
  if (key === "track") return isSoftwareTrack(draft.track) ? null : { field: "track", message: "Pick a track." };
  return stepProblem(WIZARD_STEPS.findIndex((item) => item.key === key), draft);
}

// The last step that may be opened: every step before it is fine.
function reachableIn(steps: readonly StepItem[], draft: WizardDraft, kind: ProjectKind | null): number {
  for (let index = 0; index < steps.length - 1; index += 1) if (problemAt(steps, index, draft, kind)) return index;
  return steps.length - 1;
}

// The step a saved draft was on, never past what the draft allows.
function savedStep(text: string | null, draft: WizardDraft): number {
  const kind = kindOfTrack(draft.track);
  const steps = stepsFor(kind === "software");
  const reachable = reachableIn(steps, draft, kind);
  try {
    const raw = text ? (JSON.parse(text) as { step?: unknown }).step : undefined;
    const step = typeof raw === "number" && Number.isInteger(raw) ? raw : reachable;
    return Math.min(Math.max(step, 0), reachable);
  } catch {
    return reachable;
  }
}

// The five step creation page (design brief .ulpi/design/redesign-phase-2-wizard.md). All state is one reducer; the project is
// posted once, at step 5. The server checks everything again (checkProjectInput), so the client never decides alone.
export function NewProjectWizard() {
  const router = useRouter();
  const [draft, dispatch] = useReducer(reduce, EMPTY_DRAFT);
  const [step, setStep] = useState(0);
  const [kindPick, setKindPick] = useState<ProjectKind | null>(null);
  // The kind just picked, for the lock-in effect. It clears itself, so a restored draft or a re-render never replays it.
  const [burst, setBurst] = useState<string | null>(null);
  const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sparkIndex, setSparkIndex] = useState(0);
  const [undo, setUndo] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [done, setDone] = useState(false);
  // True after a draft from earlier in this session was put back, until the builder dismisses the notice or starts over.
  const [restored, setRestored] = useState(false);

  const heading = useRef<HTMLHeadingElement>(null);
  const focusField = useRef<string | null>(null);
  // False until the first storage effect has run, so the empty first draft never overwrites a saved one.
  const mounted = useRef(false);
  // The step the page last moved focus for. Focus only moves when the step really changes, never on load: React Strict Mode
  // runs every effect twice in development, which used to put a focus ring on the first heading as the page opened.
  const focusedStep = useRef(0);
  // True once the builder has actually moved step. A restored draft is not a move, so it must not pull focus.
  const userMoved = useRef(false);
  const softwareRef = useRef(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (burstTimer.current) clearTimeout(burstTimer.current);
    },
    [],
  );

  const [state, action, pending] = useActionState(async (previous: FormState, data: FormData) => createProject(previous, data), idle);

  // A saved draft comes back after a refresh. It is read after mount so the server and first client render agree.
  useEffect(() => {
    const text = readStorage();
    const saved = parseDraft(text);
    /* eslint-disable react-hooks/set-state-in-effect */
    // A new draft starts with nothing chosen, so nothing is lit and Next waits for a pick.
    if (!draftDirty(saved)) return;
    // Reading sessionStorage has to wait for the browser, so the restore can only happen here.
    dispatch({ type: "restore", draft: saved });
    setKindPick(kindOfTrack(saved.track));
    const restoredStep = savedStep(text, saved);
    // A restore is not a step change by the builder, so it does not pull focus to the heading either.
    focusedStep.current = restoredStep;
    setStep(restoredStep);
    setRestored(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    writeStorage(draft, step);
  }, [draft, step]);

  // Focus follows the step: the heading, or the field a server error names. Never on first load or a restore. Keyboard builders
  // still see the focus indicator (the heading and fields use :focus-visible, which a script's focus() shows after a key press).
  useEffect(() => {
    if (focusedStep.current === step) return;
    // A restored draft sets focusedStep to a later step before this effect first sees step 0. That is not a builder move,
    // so do not put the ring on the heading. React Strict Mode runs this setup twice on mount; the same guard covers both.
    if (step === 0 && focusedStep.current !== 0 && !userMoved.current) return;
    focusedStep.current = step;
    const wanted = focusField.current;
    focusField.current = null;
    const target = wanted ? document.getElementById(wanted) : null;
    (target ?? heading.current)?.focus();
  }, [step]);

  // The server answered. A saved project clears the draft and opens its page. An error naming a field sends the builder to
  // its step; any other error stays on the review step in the error block.
  useEffect(() => {
    if (state.status === "saved") {
      writeStorage(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDone(true);
      router.push(state.href ?? "/dashboard/projects");
    } else if (state.status === "error" && state.field) {
      // The server's answer arrives after render, so showing it on the right step has to happen here.
      focusField.current = FIELD_ID[state.field] ?? null;
      setErrors({ [state.field]: state.message });
      const core = stepOfField(state.field);
      userMoved.current = true;
      setStep(softwareRef.current ? (state.field === "track" ? 1 : core >= 1 ? core + 1 : core) : core);
    }
  }, [state, router]);

  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    },
    [],
  );

  const kind: ProjectKind | null = kindPick ?? kindOfTrack(draft.track);
  const steps = stepsFor(kind === "software");
  const stepKey = steps[Math.min(step, steps.length - 1)].key;
  const reachable = reachableIn(steps, draft, kind);
  useEffect(() => {
    softwareRef.current = kind === "software";
  }, [kind]);
  const sparks = sparkPage(SPARKS[sparkGroup(draft.track || (kind === "hardware" ? "Hardware" : null))], sparkIndex);
  const dirty = draftDirty(draft);

  const set = (key: keyof WizardDraft, value: string) => {
    dispatch({ type: "set", key, value });
    setErrors((current) => (current[key] ? { ...current, [key]: "" } : current));
  };

  const go = useCallback((target: number) => {
    setErrors({});
    userMoved.current = true;
    setStep(target);
  }, []);

  const next = () => {
    if (step >= steps.length - 1) return;
    const problem = problemAt(steps, step, draft, kind);
    if (problem) {
      setErrors({ [problem.field]: problem.message });
      // The kind and track steps have no text field: focus lands on their first choice, which the error describes.
      const target = FIELD_ID[problem.field] ? document.getElementById(FIELD_ID[problem.field]) : document.querySelector<HTMLElement>(".pf-wiz-body input[type=radio]");
      target?.focus();
      return;
    }
    go(step + 1);
  };

  // The lock-in effect for a tile. It clears itself, so a re-render never replays it.
  const flash = (id: string) => {
    setBurst(id);
    if (burstTimer.current) clearTimeout(burstTimer.current);
    burstTimer.current = setTimeout(() => setBurst(null), 900);
  };

  const pickTrack = (name: string) => {
    set("track", name);
    flash(name);
  };

  const pickKind = (value: ProjectKind) => {
    setKindPick(value);
    flash(value);
    setSparkIndex(0);
    if (value === "hardware") set("track", "Hardware");
    else if (!(SOFTWARE_TRACKS as readonly string[]).includes(draft.track)) set("track", "");
  };

  const applySpark = (line: string) => {
    const previous = draft.description;
    set("description", sparkText(line));
    if (undoTimer.current) clearTimeout(undoTimer.current);
    if (previous.trim()) {
      setUndo(previous);
      undoTimer.current = setTimeout(() => setUndo(null), 5000);
    } else {
      setUndo(null);
    }
  };

  // Enter in a one line field or on a radio moves on when the step is valid, and says what is wrong when it is not. It never submits.
  // The idea box is a textarea, so Enter there is a plain new line (owner, 22 Nov 2026): the builder moves on with Next.
  const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    const target = event.target;
    const isText = target instanceof HTMLInputElement && (target.type === "text" || target.type === "url" || target.type === "radio");
    if (isText) {
      event.preventDefault();
      next();
    }
  };

  const checkLinkOnBlur = (key: "repoUrl" | "demoUrl", label: string) => {
    const result = checkLinkUrl(draft[key], label);
    setErrors((current) => ({ ...current, [key]: result.ok ? "" : result.message }));
  };

  const trimmedLength = draft.description.trim().length;
  const hasLinks = draft.repoUrl.trim() !== "" || draft.demoUrl.trim() !== "";
  const current = steps[Math.min(step, steps.length - 1)];
  const serverMessage = state.status === "error" && !state.field ? state.message : null;

  // Drops the restored draft and begins again at the first step.
  const startOver = () => {
    writeStorage(null);
    dispatch({ type: "reset" });
    setKindPick(null);
    setErrors({});
    setUndo(null);
    setRestored(false);
    userMoved.current = true;
    setStep(0);
    requestAnimationFrame(() => heading.current?.focus());
  };

  const leave = () => {
    writeStorage(null);
    dispatch({ type: "reset" });
    router.push("/dashboard/projects");
  };

  return (
    <form className="pf-wiz" action={action} noValidate onKeyDown={onKeyDown}>
      <input type="hidden" name="track" value={draft.track} />
      <input type="hidden" name="description" value={draft.description} />
      <input type="hidden" name="title" value={draft.title} />
      <input type="hidden" name="repoUrl" value={draft.repoUrl} />
      <input type="hidden" name="demoUrl" value={draft.demoUrl} />

      <div className="pf-wiz-top">
        <Link
          className="pf-wiz-close"
          aria-label="Close"
          href="/dashboard/projects"
          onClick={(event) => {
            if (dirty) {
              event.preventDefault();
              setLeaving(true);
            }
          }}
        >
          <span aria-hidden="true">×</span>
        </Link>
      </div>

      {restored ? (
        <div className="pf-hint pf-wiz-notice" role="status">
          <span>Your draft from earlier in this session was restored.</span>{" "}
          <button type="button" className="pf-btn" onClick={startOver}>Start over</button>{" "}
          <button type="button" className="pf-btn" onClick={() => setRestored(false)}>Dismiss</button>
        </div>
      ) : null}

      <ol className="pf-wiz-steps" aria-label="Steps" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((item, index) => (
          <li key={item.key}>
            <button
              type="button"
              className="pf-wiz-step"
              data-state={index < step ? "done" : index === step ? "current" : "todo"}
              aria-current={index === step ? "step" : undefined}
              disabled={index > reachable && index !== step}
              onClick={() => go(index)}
            >
              <span className="pf-wiz-seg" aria-hidden="true" />
              <span className="pf-wiz-step-label">
                <span className="pf-wiz-step-n">{String(index + 1).padStart(2, "0")}</span>
                <span className="pf-wiz-step-name"> {item.label.toLowerCase()}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="pf-wiz-body" key={step} data-step={stepKey}>
        <h1 className="pf-wiz-h1" ref={heading} tabIndex={-1}>{current.heading}</h1>

        {stepKey === "kind" ? (
          <div className="pf-wiz-pane">
            <fieldset className="pf-choices pf-wiz-kinds" aria-describedby="wiz-next-hint wiz-track-error">
              <legend className="pf-sr">Kind</legend>
              <div className="pf-choice-grid">
                <label className="pf-choice pf-wiz-kind" data-burst={burst === "software" ? "true" : undefined}>
                  <input type="radio" name="kind" value="software" checked={kind === "software"} onChange={() => pickKind("software")} />
                  <span className="pf-wiz-burst" aria-hidden="true" />
                  <span className="pf-wiz-icon" aria-hidden="true">{SOFTWARE_ICON}</span>
                  <span className="pf-choice-name">Software</span>
                  <span className="pf-hint">Tools, systems and compute: command line tools, servers, databases, machine learning.</span>
                </label>
                <label className="pf-choice pf-wiz-kind" data-burst={burst === "hardware" ? "true" : undefined}>
                  <input type="radio" name="kind" value="hardware" checked={kind === "hardware"} onChange={() => pickKind("hardware")} />
                  <span className="pf-wiz-burst" aria-hidden="true" />
                  <span className="pf-wiz-icon" aria-hidden="true">{HARDWARE_ICON}</span>
                  <span className="pf-choice-name">Hardware</span>
                  <span className="pf-hint">Circuits, boards, robots: anything you can hold in your hand.</span>
                </label>
              </div>
            </fieldset>
            {!kind && !errors.track ? <p className="pf-hint" id="wiz-next-hint">Pick one to continue.</p> : null}
            <div id="wiz-track-error" aria-live="polite">{stepKey === "kind" && errors.track ? <p className="pf-error">{errors.track}</p> : null}</div>
          </div>
        ) : null}

        {stepKey === "track" ? (
          <div className="pf-wiz-pane">
            <p className="pf-wiz-sub">You can change it until you submit.</p>
            <fieldset className="pf-choices pf-wiz-kinds pf-wiz-tracks" aria-describedby="wiz-next-hint wiz-track-error">
              <legend className="pf-sr">Track</legend>
              <div className="pf-choice-grid pf-wiz-track-grid">
                {TRACK_BUILDS.filter((build) => isSoftwareTrack(build.name)).map((build) => (
                  <label className="pf-choice pf-wiz-kind" data-track={build.name.toLowerCase()} data-burst={burst === build.name ? "true" : undefined} key={build.name}>
                    <input type="radio" name="track-pick" value={build.name} checked={draft.track === build.name} onChange={() => pickTrack(build.name)} />
                    <span className="pf-wiz-burst" aria-hidden="true" />
                    <span className="pf-choice-name">{build.name}</span>
                    <span className="pf-hint">{build.text}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {!isSoftwareTrack(draft.track) && !errors.track ? <p className="pf-hint" id="wiz-next-hint">Pick a track to continue.</p> : null}
            <div id="wiz-track-error" aria-live="polite">{errors.track ? <p className="pf-error">{errors.track}</p> : null}</div>
          </div>
        ) : null}

        {stepKey === "idea" ? (
          <div className="pf-wiz-pane">
            <p className="pf-wiz-sub">It does not have to be big, clever or finished. Just something you would enjoy building. A sentence or two is plenty.</p>
            <div className="pf-field">
              <label htmlFor={FIELD_ID.description} className="pf-sr">Your idea</label>
              <textarea
                id={FIELD_ID.description}
                className="pf-textarea pf-wiz-idea"
                rows={4}
                maxLength={PROJECT_DESCRIPTION_MAX}
                placeholder={kind === "hardware" ? "A board that..." : "A command line tool that..."}
                value={draft.description}
                onChange={(event) => set("description", event.target.value)}
                onBlur={() => {
                  if (draft.description.trim() && !stepValid(1, draft)) setErrors({ description: stepProblem(1, draft)?.message ?? "" });
                }}
                aria-invalid={errors.description ? true : undefined}
                aria-describedby="wiz-description-help wiz-description-error"
              />
              <div className="pf-wiz-meta">
                <span className="pf-hint" id="wiz-description-help">
                  {trimmedLength > 0 && trimmedLength < DESCRIPTION_SHIP_MIN
                    ? `Add a bit more before you ship: ${DESCRIPTION_SHIP_MIN} characters is the minimum.`
                    : "At least 10 characters."}
                </span>
                <span className="pf-hint pf-wiz-count">{draft.description.length} / {PROJECT_DESCRIPTION_MAX}</span>
              </div>
              <div id="wiz-description-error" aria-live="polite">{errors.description ? <p className="pf-error">{errors.description}</p> : null}</div>
            </div>

            <div className="pf-wiz-sparks">
              <div className="pf-wiz-sparks-head">
                <h2>Need a spark?</h2>
                <button type="button" className="pf-btn pf-wiz-more" onClick={() => setSparkIndex((index) => index + 1)}>More ideas</button>
              </div>
              <ul>
                {sparks.map((line) => (
                  <li key={line}>
                    <button type="button" className="pf-wiz-spark" onClick={() => applySpark(line)}>{line}</button>
                  </li>
                ))}
              </ul>
              <div aria-live="polite">
                {undo !== null ? (
                  <button
                    type="button"
                    className="pf-wiz-undo"
                    onClick={() => {
                      set("description", undo);
                      setUndo(null);
                    }}
                  >
                    Undo
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {stepKey === "name" ? (
          <div className="pf-wiz-pane">
            <p className="pf-wiz-sub">A working title is fine. You can rename it any time.</p>
            <div className="pf-field">
              <label htmlFor={FIELD_ID.title} className="pf-sr">Project name</label>
              <input
                id={FIELD_ID.title}
                className="pf-input pf-wiz-title"
                type="text"
                maxLength={PROJECT_TITLE_MAX}
                placeholder="untitled"
                value={draft.title}
                onChange={(event) => set("title", event.target.value)}
                aria-invalid={errors.title ? true : undefined}
                aria-describedby="wiz-title-help wiz-title-error"
              />
              <div className="pf-wiz-meta">
                <span className="pf-hint" id="wiz-title-help">Up to {PROJECT_TITLE_MAX} characters.</span>
                <span className="pf-hint pf-wiz-count">{draft.title.length} / {PROJECT_TITLE_MAX}</span>
              </div>
              <div id="wiz-title-error" aria-live="polite">{errors.title ? <p className="pf-error">{errors.title}</p> : null}</div>
            </div>
            <div className="pf-wiz-preview-wrap">
              <ProjectPreviewCard title={draft.title} description={draft.description} track={draft.track} />
            </div>
            <p className="pf-hint pf-wiz-notice">Every project is public, including drafts and journals. Do not put personal details in them.</p>
          </div>
        ) : null}

        {stepKey === "links" ? (
          <div className="pf-wiz-pane">
            <p className="pf-wiz-sub">This step is optional. Skip it and add any of it from the project page later.</p>
            <div className="pf-wiz-links">
              <div className="pf-field">
                <label htmlFor={FIELD_ID.repoUrl}>Source address</label>
                <input
                  id={FIELD_ID.repoUrl}
                  className="pf-input"
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  placeholder="https://github.com/..."
                  value={draft.repoUrl}
                  onChange={(event) => set("repoUrl", event.target.value)}
                  onBlur={() => checkLinkOnBlur("repoUrl", "source link")}
                  aria-invalid={errors.repoUrl ? true : undefined}
                  aria-describedby="wiz-repo-url-error"
                />
                <div id="wiz-repo-url-error" aria-live="polite">{errors.repoUrl ? <p className="pf-error">{errors.repoUrl}</p> : null}</div>
              </div>
              <div className="pf-field">
                <label htmlFor={FIELD_ID.demoUrl}>Demo address</label>
                <input
                  id={FIELD_ID.demoUrl}
                  className="pf-input"
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  placeholder="https://..."
                  value={draft.demoUrl}
                  onChange={(event) => set("demoUrl", event.target.value)}
                  onBlur={() => checkLinkOnBlur("demoUrl", "demo link")}
                  aria-invalid={errors.demoUrl ? true : undefined}
                  aria-describedby="wiz-demo-url-error"
                />
                <div id="wiz-demo-url-error" aria-live="polite">{errors.demoUrl ? <p className="pf-error">{errors.demoUrl}</p> : null}</div>
              </div>
            </div>
            {kind === "hardware" ? (
              <div className="pf-conn" role="group" aria-label="Lapse">
                <div className="pf-conn-head">
                  <span className="pf-conn-name">Lapse</span>
                </div>
                <p className="pf-conn-reason">Hardware projects use a Lapse recording. You will link it in your journal entry.</p>
                <div className="pf-conn-body">
                  <a className="pf-btn" href="https://lapse.hackclub.com" target="_blank" rel="noopener noreferrer">
                    Open Lapse
                  </a>
                </div>
              </div>
            ) : (
              <HackatimeProjects projects={HACKATIME_PROJECTS} />
            )}
          </div>
        ) : null}

        {stepKey === "review" ? (
          <div className="pf-wiz-pane pf-wiz-review">
            <ProjectPreviewCard title={draft.title} description={draft.description} track={draft.track} />
          </div>
        ) : null}
      </div>

      <div aria-live="polite" className="pf-wiz-server">{serverMessage ? <p className="pf-error" role="alert">{serverMessage}</p> : null}</div>

      <div className="pf-wiz-bar">
        {step > 0 ? (
          <button type="button" className="pf-btn pf-wiz-back" onClick={() => go(step - 1)}>Back</button>
        ) : (
          <span />
        )}
        {/* Next and Create are two different buttons with their own keys. If React reused one node and only changed its type,
            the click on Next at step 4 would turn into a submit while the browser was still handling it. */}
        {step < steps.length - 1 ? (
          // aria-disabled instead of disabled: the button stays focusable and a press says what is missing and moves focus to it.
          <button
            key="next"
            type="button"
            className="pf-btn pri"
            onClick={next}
            aria-disabled={stepKey !== "links" && problemAt(steps, step, draft, kind) !== null ? true : undefined}
            aria-describedby={(stepKey === "kind" || stepKey === "track") && problemAt(steps, step, draft, kind) ? "wiz-next-hint" : undefined}
          >
            {stepKey === "links" && !hasLinks ? "Skip" : "Next"}
            {NEXT_ARROW}
          </button>
        ) : (
          <button key="create" type="submit" className="pf-btn pri" disabled={pending || done}>
            {pending || done ? "Creating" : "Create project"}
          </button>
        )}
      </div>

      <PfModal open={leaving} onClose={() => setLeaving(false)} title="Leave without creating?" size="confirm" closeButton={false} initialFocus="button[data-stay]">
        <div className="pf-wiz-leave">
          <p>Leave without creating? Nothing is saved.</p>
          <div className="pf-wiz-leave-actions">
            <button type="button" className="pf-btn" data-stay onClick={() => setLeaving(false)}>Stay</button>
            <button type="button" className="pf-btn pri" onClick={leave}>Leave</button>
          </div>
        </div>
      </PfModal>
    </form>
  );
}
