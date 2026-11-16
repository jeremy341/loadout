"use client";

import { useState } from "react";
import { saveFormConfig } from "@/reviewer-dash/app/actions";
import { ActionButton, Badge, Button, Card, Code, Field, Input, Muted, Textarea } from "@/reviewer-dash/app/_ui/ui";
import type { FormConfigRow, FormQuestion } from "@/reviewer-dash/lib/db";

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

  const updateQuestion = (i: number, patch: Partial<FormQuestion>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const removeQuestion = (i: number) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  const addQuestion = () => setQuestions((qs) => [...qs, { key: "", label: "" }]);

  const closed = !!config.close_at && new Date(config.close_at).getTime() <= Date.now();

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Code>/form/{config.form_key}</Code>
        {closed && <Badge tone="danger">closed, submissions blocked</Badge>}
        <Muted className="ml-auto text-xs">
          {config.updated_by ? `last edited by ${config.updated_by}` : "never edited"}
        </Muted>
      </div>

      <form action={saveFormConfig} className="flex flex-col gap-3">
        <input type="hidden" name="formKey" value={config.form_key} />
        <input type="hidden" name="questionsJson" value={JSON.stringify(questions)} />

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title">
            <Input name="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Closes at" hint="Leave blank for open-ended.">
            <Input type="datetime-local" name="closeAt" value={closeAt} onChange={(e) => setCloseAt(e.target.value)} />
          </Field>
        </div>

        <Field label="Description">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            name="description"
            rows={2}
          />
        </Field>

        <div className="flex flex-col gap-2">
          <span className="hc-label">Questions</span>
          {questions.map((q, i) => (
            <div key={i} className="flex items-start gap-2">
              <Input
                aria-label="Question key"
                placeholder="key (e.g. message)"
                value={q.key}
                onChange={(e) => updateQuestion(i, { key: e.target.value })}
                className="hc-mono w-40 shrink-0"
              />
              <Input
                aria-label="Question label"
                placeholder="Question shown to the submitter"
                value={q.label}
                onChange={(e) => updateQuestion(i, { label: e.target.value })}
                className="flex-1"
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
          ))}
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
      </form>
    </Card>
  );
}
