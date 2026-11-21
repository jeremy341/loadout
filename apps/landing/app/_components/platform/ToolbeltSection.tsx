"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { removeToolUse } from "@/lib/platform/profile-actions";
import { canRemoveUse, TOOLBELT_MAKER_CAP_ORE, TOOLBELT_MAKER_ORE, TOOLBELT_MAX_PER_PROJECT, TOOLBELT_USER_ORE } from "@/lib/platform/toolbelt";
import { handleLabel, SLOTS_CLOSED_TEXT, SLOTS_FULL_TEXT, slotsView } from "@/lib/platform/toolbelt-ui";
import { ConfirmDialog } from "./ConfirmDialog";
import { ProjectResultRow } from "./ProjectResultRow";
import { ProjectExpedition } from "./expeditions/ProjectExpedition";
import { ToolbeltGate } from "./ToolbeltGate";
import { ToolFinder, type FinderTool } from "./ToolFinder";
import { ToolStep } from "./ToolStep";
import "./toolbelt.css";

export type ToolbeltUseView = {
  id: string;
  status: string;
  note: string;
  tool: { id: string; title: string; track: string | null; ownerHandle: string | null; public: boolean };
};

const CHIP_LABEL: Record<string, string> = { pending: "Pending", confirmed: "Confirmed", declined: "Declined" };

export function UseChip({ status, focusKey }: { status: string; focusKey?: string }) {
  return (
    <span className="pf-belt-chip" data-status={status} tabIndex={focusKey ? -1 : undefined} data-focus={focusKey}>
      {status === "confirmed" ? (
        <svg viewBox="0 0 12 12" width="12" height="12" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
          <path d="M1 6h2v2h2v2H3V8H1zM5 8h2V6h2V4h2v2H9v2H7v2H5z" />
        </svg>
      ) : null}
      {CHIP_LABEL[status] ?? status}
    </span>
  );
}

function ToolTitle({ tool }: { tool: ToolbeltUseView["tool"] }) {
  return tool.public ? (
    <Link className="pf-belt-title" href={`/dashboard/explore/${tool.id}`}>{tool.title}</Link>
  ) : (
    <span className="pf-belt-title">{tool.title}</span>
  );
}

function MakerLine({ handle }: { handle: string | null }) {
  return (
    <span className="pf-belt-by">
      by{" "}
      {handle ? <Link href={`/dashboard/builders/${handle}`}>{handle}</Link> : handleLabel(handle)}
    </span>
  );
}

// The Toolbelt on an owner's project page (stardance-layout.md F): a search to find a tool, an inline step to say how it is used,
// two compact slots, the declined lines, the gate card and the one provisional rewards note. The page refreshes in place after a
// server action and focus goes where the spec says, because the element that had it is often replaced.
export function ToolbeltSection({
  projectId,
  projectStatus,
  uses,
  savedTools,
  hours,
}: Readonly<{
  projectId: string;
  projectStatus: string;
  uses: ToolbeltUseView[];
  savedTools: FinderTool[];
  hours: { approved: number; pending: number };
}>) {
  const root = useRef<HTMLElement>(null);
  const finderInput = useRef<HTMLInputElement>(null);
  const [chosen, setChosen] = useState<FinderTool | null>(null);
  // Bumped after an equip so the finder starts clean (empty text, fresh results).
  const [finderKey, setFinderKey] = useState(0);
  const [removing, setRemoving] = useState<ToolbeltUseView | null>(null);
  const [message, setMessage] = useState("");
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const view = slotsView(uses, projectStatus);
  const reasonId = `belt-reason-${projectId}`;
  const canEquip = !view.closed && !view.full;

  // Where focus goes once the refreshed page has the element (it may arrive a moment after the action finishes).
  useEffect(() => {
    if (!focusKey) return;
    const target = root.current?.querySelector<HTMLElement>(`[data-focus="${focusKey}"]`);
    if (target) {
      target.focus();
      setFocusKey(null);
    }
  }, [focusKey, uses]);
  useEffect(() => {
    if (!focusKey) return;
    const timer = window.setTimeout(() => setFocusKey(null), 4000);
    return () => window.clearTimeout(timer);
  }, [focusKey]);

  const closeRemove = useCallback(() => setRemoving(null), []);
  const choose = useCallback((tool: FinderTool) => setChosen(tool), []);
  const cancelStep = useCallback(() => {
    setChosen(null);
    window.requestAnimationFrame(() => finderInput.current?.focus());
  }, []);
  const equipDone = useCallback((toolId: string) => {
    setChosen(null);
    setFinderKey((key) => key + 1);
    setMessage("Equip sent. It stays Pending until a reviewer confirms it.");
    setFocusKey(`chip-${toolId}`);
  }, []);
  const removeDone = useCallback(() => {
    if (!removing) return;
    setMessage(`Removed ${removing.tool.title}.`);
    setFocusKey(removing.status === "declined" ? "heading" : "finder");
    setRemoving(null);
  }, [removing]);

  const freeSlots = Array.from({ length: view.emptySlots }, (_, index) => view.active.length + index + 1);
  const savedLeft = canEquip ? savedTools.filter((tool) => !view.active.some((use) => use.tool.id === tool.id)) : [];

  return (
    <>
    <section className="pf-box pf-belt" aria-labelledby="toolbelt-heading" ref={root} id="toolbelt">
      <div className="pf-box-head">
        <h2 id="toolbelt-heading" tabIndex={-1} data-focus="heading">Toolbelt</h2>
        <span className="pf-hint">{view.active.length} of {TOOLBELT_MAX_PER_PROJECT} slots in use</span>
      </div>

      {canEquip ? (
        <>
          <ToolFinder key={finderKey} projectId={projectId} chosen={chosen} onChoose={choose} onEdit={() => setChosen(null)} inputRef={finderInput} />
          {chosen ? <ToolStep key={chosen.id} projectId={projectId} tool={chosen} onCancel={cancelStep} onDone={equipDone} /> : null}
        </>
      ) : view.closed ? (
        <p className="pf-hint pf-belt-reason" id={reasonId}>{SLOTS_CLOSED_TEXT}</p>
      ) : (
        <p className="pf-hint pf-belt-reason" id={reasonId}>{SLOTS_FULL_TEXT}</p>
      )}

      <ul className="pf-belt-slots" aria-label="Slots">
        {view.active.map((use) => {
          const removable = canRemoveUse(use.status).ok;
          return (
            <li className="pf-belt-slot" data-status={use.status} key={use.id}>
              <div className="pf-belt-slot-head">
                <UseChip status={use.status} focusKey={`chip-${use.tool.id}`} />
                <ToolTitle tool={use.tool} />
                <MakerLine handle={use.tool.ownerHandle} />
                {removable ? (
                  <button type="button" className="pf-btn pf-belt-remove" aria-label={`Remove ${use.tool.title}`} onClick={() => setRemoving(use)}>
                    Remove
                  </button>
                ) : null}
              </div>
              <p className="pf-belt-note-text">{use.note}</p>
              {removable ? null : <p className="pf-hint">A confirmed use stays on the record.</p>}
            </li>
          );
        })}
        {freeSlots.map((number) => (
          <li className="pf-belt-slot pf-belt-slot-empty" key={`free-${number}`}>
            {view.closed ? `Slot ${number} is empty` : `Slot ${number} is free`}
          </li>
        ))}
      </ul>

      {savedLeft.length > 0 ? (
        <section className="pf-belt-saved" aria-labelledby={`belt-saved-${projectId}`}>
          <div className="pf-belt-saved-head">
            <h3 id={`belt-saved-${projectId}`}>Saved tools</h3>
            <Link href="/dashboard/explore?saved=1">See all saved</Link>
          </div>
          <ul className="pf-belt-saved-list">
            {savedLeft.slice(0, 3).map((tool) => (
              <ProjectResultRow
                as="li"
                row={tool}
                showRepo
                key={tool.id}
                saveSlot={
                  <button type="button" className="pf-btn pf-belt-equip" aria-label={`Equip ${tool.title}`} onClick={() => setChosen(tool)}>
                    Equip
                  </button>
                }
              />
            ))}
          </ul>
        </section>
      ) : null}

      {view.declined.length > 0 ? (
        <ul className="pf-belt-list" aria-label="Declined uses">
          {view.declined.map((use) => (
            <li key={use.id}>
              <UseChip status="declined" />
              <span className="pf-belt-declined-text">
                <span className="pf-belt-title">{use.tool.title}</span>
                <span className="pf-hint">A reviewer or the maker declined this use.</span>
              </span>
              <button type="button" className="pf-btn" aria-label={`Remove ${use.tool.title}`} onClick={() => setRemoving(use)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="pf-belt-status pf-saved" role="status">{message}</p>

      <div className="pf-belt-foot">
        <ToolbeltGate projectId={projectId} hours={hours} />
        <p className="pf-belt-note pf-hint">
          Rewards: {TOOLBELT_USER_ORE} Ore once per tool for the builder who uses it,{" "}
          {TOOLBELT_MAKER_ORE} Ore for the maker for each verified user, up to {TOOLBELT_MAKER_CAP_ORE} Ore per tool each season. Equipping gives no Track XP.
        </p>
      </div>

      <ConfirmDialog
        open={removing !== null}
        onClose={closeRemove}
        onDone={removeDone}
        title={`Remove ${removing?.tool.title ?? "tool"}?`}
        body={<p>Its use note is deleted. You can equip it again later.</p>}
        confirmLabel="Remove tool"
        action={removeToolUse}
        fields={{ useId: removing?.id ?? "" }}
      />
    </section>
    <ProjectExpedition projectId={projectId} />
    </>
  );
}
