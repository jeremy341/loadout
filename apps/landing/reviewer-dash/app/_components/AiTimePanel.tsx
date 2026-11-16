"use client";

import type { Commit } from "@/reviewer-dash/lib/commits";
import { Badge, Callout, EmptyState, Mono, Muted } from "@/reviewer-dash/app/_ui/ui";

// Cross-references what the builder declared with which commits an AI tool signed: two independent, imperfect signals that corroborate
// (or contradict) each other. The AI-usage check itself (an estimate from tracked time) is a stub that opens with the review service.
export function AiTimePanel({
  commits,
  usedAi,
  aiNotes,
}: {
  commits: Commit[];
  usedAi: boolean;
  aiNotes: string | null;
}) {
  const aiCommits = commits.filter((c) => c.ai);
  const mismatch = aiCommits.length > 0 && !usedAi;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <p className="hc-eyebrow mb-1">Builder&apos;s AI declaration</p>
        {usedAi ? (
          <p className="whitespace-pre-wrap break-words text-sm">
            {aiNotes || "Ticked “AI used” but gave no details (pre-dates the details field)."}
          </p>
        ) : (
          <p className="hc-caption text-sm">The builder did not declare AI use.</p>
        )}
      </div>

      {mismatch && (
        <Callout tone="danger" icon="important">
          {aiCommits.length} commit{aiCommits.length === 1 ? "" : "s"} in this repo{" "}
          {aiCommits.length === 1 ? "is" : "are"} signed by an AI tool, but the builder did not tick &ldquo;AI
          used&rdquo;.
        </Callout>
      )}

      <div>
        <p className="hc-eyebrow mb-1">AI-usage check</p>
        <p className="hc-caption text-sm">Opens with the review service. Nothing here is saved.</p>
      </div>

      <div>
        <p className="hc-eyebrow mb-2">Commits signed by an AI tool ({aiCommits.length})</p>
        {aiCommits.length === 0 ? (
          <EmptyState title="No AI-signed commits" icon="checkmark">
            No sign in commit messages or authorship of an AI tool committing directly. This only catches tools
            that announce themselves, so absence proves nothing.
          </EmptyState>
        ) : (
          <ul>
            {aiCommits.map((c) => (
              <li key={c.sha} className="flex flex-col gap-1 border-b border-[var(--border)] py-2 last:border-b-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Mono>{c.sha.slice(0, 7)}</Mono>
                  <Badge tone="warning" icon="important">
                    AI signed
                  </Badge>
                  <Muted className="ml-auto text-xs">{c.author}</Muted>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm">{c.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
