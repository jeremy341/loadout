"use client";

import { useRef, useState, type FormEvent } from "react";
import { RULES } from "./logic/constants";
import { CATEGORIES, SCORE_ANCHORS, countWords, validateReviewInput, type ReviewInputCheck } from "./logic/scoring";
import type { Category, ReviewDraft } from "./logic/types";

/**
 * The scoring form for one assigned ship: four 1 to 9 radio groups and a written reason of at least ten words.
 * The draft is saved as you go (through onDraft) so it survives a reload.
 */
export function ReviewForm({ draft, onDraft, onSubmit }: { draft: ReviewDraft; onDraft: (draft: ReviewDraft) => void; onSubmit: (draft: ReviewDraft) => void }) {
  const [check, setCheck] = useState<ReviewInputCheck | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const words = countWords(draft.reason);
  const enough = words >= RULES.minReasonWords;

  function setScore(category: Category, value: number) {
    onDraft({ ...draft, scores: { ...draft.scores, [category]: value } });
    if (check?.scoreErrors[category]) setCheck({ ...check, scoreErrors: { ...check.scoreErrors, [category]: undefined } });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = validateReviewInput(draft.scores, draft.reason);
    setCheck(result);
    if (!result.ok) {
      setTimeout(() => {
        const form = formRef.current;
        const target = form?.querySelector<HTMLElement>('[data-invalid="true"] input') ?? form?.querySelector<HTMLElement>('textarea[aria-invalid="true"]');
        target?.focus();
      }, 0);
      return;
    }
    onSubmit(draft);
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="pg-stack" aria-label="Score this ship">
      {CATEGORIES.map(({ key, label, question }) => {
        const error = check?.scoreErrors[key];
        const errorId = `score-${key}-error`;
        return (
          <fieldset key={key} className="bd-fieldset bd-score-block" data-invalid={error ? "true" : undefined} aria-describedby={error ? errorId : `score-${key}-hint`}>
            <legend>{label}</legend>
            <p id={`score-${key}-hint`} className="bd-anchors">
              {question} 1 is {SCORE_ANCHORS[1].toLowerCase()}, 5 {SCORE_ANCHORS[5].toLowerCase()}, 9 is {SCORE_ANCHORS[9].toLowerCase()}.
            </p>
            <div className="bd-scale">
              {Array.from({ length: RULES.scoreMax - RULES.scoreMin + 1 }, (_, i) => i + RULES.scoreMin).map((n) => (
                <label key={n} className="bd-score">
                  <input type="radio" name={`score-${key}`} value={n} checked={draft.scores[key] === n} onChange={() => setScore(key, n)} />
                  <span aria-hidden="true">{n}</span>
                  <span className="sr-only">
                    {n}
                    {SCORE_ANCHORS[n] ? ` (${SCORE_ANCHORS[n]})` : ""}
                  </span>
                </label>
              ))}
            </div>
            {error ? (
              <p id={errorId} className="fld-error" role="alert">
                {error}
              </p>
            ) : null}
          </fieldset>
        );
      })}

      <div className="fld">
        <label className="fld-label" htmlFor="review-reason">
          Written reason
        </label>
        <textarea
          id="review-reason"
          rows={5}
          value={draft.reason}
          maxLength={2000}
          aria-invalid={check?.reasonError ? true : undefined}
          aria-describedby={`review-reason-hint${check?.reasonError ? " review-reason-error" : ""}`}
          onChange={(e) => onDraft({ ...draft, reason: e.target.value })}
        />
        <span id="review-reason-hint" className="fld-hint">
          Explain your scores in at least {RULES.minReasonWords} words. The builder reads this, without your name.
        </span>
        <span className="bd-wordcount">
          {words} of {RULES.minReasonWords} words
        </span>
        <span className="sr-only" aria-live="polite">
          {enough ? "Reason is long enough." : `Reason needs ${RULES.minReasonWords - words} more words.`}
        </span>
        {check?.reasonError ? (
          <span id="review-reason-error" className="fld-error" role="alert">
            {check.reasonError}
          </span>
        ) : null}
      </div>

      <div className="bd-actions">
        <button type="submit" className="btn">
          Submit review
        </button>
      </div>
    </form>
  );
}
