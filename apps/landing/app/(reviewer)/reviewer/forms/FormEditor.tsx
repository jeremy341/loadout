"use client";

import { useActionState, useId, useState, type FormEvent } from "react";
import type { FormState } from "@/lib/platform/actions";
import { saveFormConfigState } from "@/reviewer-dash/app/actions";
import { ActionButton, Badge, Button, Callout, Card, Code, Field, Input, Muted, Textarea } from "@/reviewer-dash/app/_ui/ui";
import type { FormConfigRow, FormQuestion } from "@/reviewer-dash/lib/db";

const idle: FormState = { status: "idle" };
const invalidStyle = { borderColor: "var(--hc-red)" } as const;
const errorStyle = { color: "var(--hc-red)" } as const;

type RowErrors = { key?: string; label?: string; duplicate?: boolean };

// A row left completely blank is ignored on save. A row with only one half filled, or a key used twice, is a mistake the
// editor names instead of dropping the row.
function checkQuestions(questions: FormQuestion[]): RowErrors[] {
  const trimmed = questions.map((q) => ({ key: q.key.trim(), label: q.label.trim() }));
  const firstAt = new Map<string, number>();
  trimmed.forEach((q, i) => {
    if (q.key && !firstAt.has(q.key)) firstAt.set(q.key, i);
  });
  return trimmed.map((q, i) => {
    const errors: RowErrors = {};
    if (!q.key && q.label) errors.key = "Add a key for this question.";
    else if (q.key && firstAt.get(q.key) !== i) {
      errors.key = `Key already used by question ${(firstAt.get(q.key) ?? 0) + 1}. Keys must be unique.`;
      errors.duplicate = true;
    }
    if (q.key && !q.label) errors.label = "Add the question text.";
    return errors;
  });
}

// A datetime-local input wants "YYYY-MM-DDTHH:mm" in local time, not the ISO
// UTC string form_configs.close_at stores. This only affects the editor's
// own display, saveFormConfig re-converts to UTC on submit.
function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function FormEditor({ config }: { config: FormConfigRow }) {
  const [title, setTitle] = useState(config.title);
  const [description, setDescription] = useState(config.description);
  const [closeAt, setCloseAt] = useState(toLocalInputValue(config.close_at));
  const [questions, setQuestions] = useState<FormQuestion[]>(
    config.questions.length ? config.questions : [{ key: "", label: "" }],
  );
  const [state, action] = useActionState(saveFormConfigState, idle);
  // A result stays until the next edit, so "Saved." never describes text that has changed since.
  const [dismissed, setDismissed] = useState<FormState | null>(null);
  const [attempted, setAttempted] = useState(false);
  const baseId = useId();
  const hintId = `${baseId}-hint`;
  const rowErrors = checkQuestions(questions);
  const result = state !== dismissed && state.status !== "idle" ? state : null;
  const edited = () => setDismissed(state);

  const updateQuestion = (i: number, patch: Partial<FormQuestion>) => {
    edited();
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  };
  const removeQuestion = (i: number) => {
    edited();
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  };
  const addQuestion = () => {
    edited();
    setQuestions((qs) => [...qs, { key: "", label: "" }]);
  };

  // Stop a save that would be refused, show every problem and move focus to the first one.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const firstBad = rowErrors.findIndex((e) => e.key || e.label);
    if (firstBad < 0) return;
    event.preventDefault();
    setAttempted(true);
    const field = rowErrors[firstBad].key ? "key" : "label";
    document.getElementById(`${baseId}-${firstBad}-${field}`)?.focus();
  };

  const closed = !!config.close_at && new Date(config.close_at).getTime() <= Date.now();
  const closeAtError = result?.status === "error" && result.field === "closeAt" ? result.message : undefined;
  const generalError = result?.status === "error" && !result.field ? result.message : undefined;
  const questionsError = result?.status === "error" && result.field === "questions" ? result.message : undefined;

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Code>/form/{config.form_key}</Code>
        {closed && <Badge tone="danger">closed, submissions blocked</Badge>}
        <Muted className="ml-auto text-xs">
          {config.updated_by ? `last edited by ${config.updated_by}` : "never edited"}
        </Muted>
      </div>

      <form action={action} onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
        <input type="hidden" name="formKey" value={config.form_key} />
        <input type="hidden" name="questionsJson" value={JSON.stringify(questions)} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Title">
            <Input
              name="title"
              value={title}
              onChange={(e) => {
                edited();
                setTitle(e.target.value);
              }}
            />
          </Field>
          <Field label="Closes at" hint="Leave blank for open-ended.">
            <Input
              type="datetime-local"
              name="closeAt"
              value={closeAt}
              onChange={(e) => {
                edited();
                setCloseAt(e.target.value);
              }}
              aria-invalid={closeAtError ? true : undefined}
              style={closeAtError ? invalidStyle : undefined}
            />
            {closeAtError ? <span className="text-xs" style={errorStyle}>{closeAtError}</span> : null}
          </Field>
        </div>

        <Field label="Description">
          <Textarea
            value={description}
            onChange={(e) => {
              edited();
              setDescription(e.target.value);
            }}
            name="description"
            rows={2}
          />
        </Field>

        <div className="flex flex-col gap-2" role="group" aria-labelledby={`${baseId}-questions`}>
          <span className="hc-label" id={`${baseId}-questions`}>Questions</span>
          <span className="hc-muted text-xs" id={hintId}>Each key must be unique. Rows left completely blank are ignored.</span>
          {questions.map((q, i) => {
            const errors = rowErrors[i];
            // A repeated key shows at once; a missing half waits for a save attempt so a new row is not red while it is filled in.
            const keyError = attempted || errors.duplicate ? errors.key : undefined;
            const labelError = attempted ? errors.label : undefined;
            const keyId = `${baseId}-${i}-key`;
            const labelId = `${baseId}-${i}-label`;
            return (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-start gap-2">
                  <Input
                    id={keyId}
                    aria-label={`Question ${i + 1} key`}
                    aria-invalid={keyError ? true : undefined}
                    aria-describedby={keyError ? `${keyId}-error ${hintId}` : hintId}
                    placeholder="key (e.g. message)"
                    value={q.key}
                    onChange={(e) => updateQuestion(i, { key: e.target.value })}
                    className="hc-mono w-40 shrink-0"
                    style={keyError ? invalidStyle : undefined}
                  />
                  <Input
                    id={labelId}
                    aria-label={`Question ${i + 1} text`}
                    aria-invalid={labelError ? true : undefined}
                    aria-describedby={labelError ? `${labelId}-error` : undefined}
                    placeholder="Question shown to the submitter"
                    value={q.label}
                    onChange={(e) => updateQuestion(i, { label: e.target.value })}
                    className="flex-1"
                    style={labelError ? invalidStyle : undefined}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon="delete"
                    onClick={() => removeQuestion(i)}
                    disabled={questions.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
                {keyError ? <p className="text-xs" id={`${keyId}-error`} style={errorStyle}>{keyError}</p> : null}
                {labelError ? <p className="text-xs" id={`${labelId}-error`} style={errorStyle}>{labelError}</p> : null}
              </div>
            );
          })}
          {questionsError ? <p className="text-xs" role="alert" style={errorStyle}>{questionsError}</p> : null}
          <div>
            <Button type="button" variant="outline" size="sm" icon="plus" onClick={addQuestion}>
              Add question
            </Button>
          </div>
        </div>

        <div>
          <ActionButton size="sm" pendingLabel="Saving...">
            Save
          </ActionButton>
        </div>
        <div role={generalError ? "alert" : "status"}>
          {generalError ? (
            <Callout tone="danger" icon="important">{generalError}</Callout>
          ) : result?.status === "saved" ? (
            <Callout tone="success" icon="checkmark">{result.message}</Callout>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
