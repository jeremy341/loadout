"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { removeToolUse } from "@/lib/platform/profile-actions";
import { canRemoveUse, TOOLBELT_MAKER_CAP_ORE, TOOLBELT_MAKER_ORE, TOOLBELT_MAX_PER_PROJECT, TOOLBELT_USER_ORE } from "@/lib/platform/toolbelt";
import { handleLabel, SLOTS_CLOSED_TEXT, SLOTS_FULL_TEXT, slotsView } from "@/lib/platform/toolbelt-ui";
import { ConfirmDialog } from "./ConfirmDialog";
import { EquipDialog, type EquipTool } from "./EquipDialog";
import { ToolbeltGate } from "./ToolbeltGate";
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

// The Toolbelt box on an owner's project page (design spec 3.14): two slots, the declined lines, the gate card and the one
// provisional rewards note. Equip and Remove run server actions in native dialogs; the page refreshes in place and focus goes where
// the spec says, because the button that opened a dialog is often replaced.
export function ToolbeltSection({
  projectId,
  projectStatus,
  uses,
  tools,
  hours,
}: Readonly<{
  projectId: string;
  projectStatus: string;
  uses: ToolbeltUseView[];
  tools: EquipTool[];
  hours: { approved: number; pending: number };
}>) {
  const root = useRef<HTMLElement>(null);
  const [equipOpen, setEquipOpen] = useState(false);
  // The tools are copied when the dialog opens: the refreshed page arrives with the action's result and must not swap the form out first.
  const [equipTools, setEquipTools] = useState<EquipTool[]>([]);
  const [removing, setRemoving] = useState<ToolbeltUseView | null>(null);
  const [message, setMessage] = useState("");
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const view = slotsView(uses, projectStatus);
  const reasonId = `belt-reason-${projectId}`;

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

  const closeEquip = useCallback(() => setEquipOpen(false), []);
  const closeRemove = useCallback(() => setRemoving(null), []);
  const equipDone = useCallback((toolId: string) => {
    setEquipOpen(false);
    setMessage("Equip sent. It stays Pending until a reviewer confirms it.");
    setFocusKey(`chip-${toolId}`);
  }, []);
  const removeDone = useCallback(() => {
    if (!removing) return;
    setMessage(`Removed ${removing.tool.title}.`);
    setFocusKey(removing.status === "declined" ? "heading" : "equip-slot");
    setRemoving(null);
  }, [removing]);

  const emptySlots = Array.from({ length: view.emptySlots }, (_, index) => index);

  return (
    <section className="pf-box pf-belt" aria-labelledby="toolbelt-heading" ref={root} id="toolbelt">
      <div className="pf-box-head">
        <h2 id="toolbelt-heading" tabIndex={-1} data-focus="heading">Toolbelt</h2>
        <span className="pf-hint">{view.active.length} of {TOOLBELT_MAX_PER_PROJECT} slots in use</span>
      </div>

      <ul className="pf-belt-slots">
        {view.active.map((use) => {
          const removable = canRemoveUse(use.status).ok;
          return (
            <li className="pf-belt-slot" data-status={use.status} key={use.id}>
              <UseChip status={use.status} focusKey={`chip-${use.tool.id}`} />
              <ToolTitle tool={use.tool} />
              <MakerLine handle={use.tool.ownerHandle} />
              <p className="pf-belt-note-text">{use.note}</p>
              {removable ? (
                <button type="button" className="pf-btn" aria-label={`Remove ${use.tool.title}`} onClick={() => setRemoving(use)}>
                  Remove
                </button>
              ) : (
                <p className="pf-hint">A confirmed use stays on the record.</p>
              )}
            </li>
          );
        })}
        {emptySlots.map((index) => (
          <li className="pf-belt-slot pf-belt-slot-empty" key={`empty-${index}`}>
            <button
              type="button"
              className="pf-new-card"
              aria-label="Equip a tool"
              aria-disabled={view.closed ? true : undefined}
              aria-describedby={view.closed ? reasonId : undefined}
              data-focus={index === 0 ? "equip-slot" : undefined}
              onClick={() => {
                if (view.closed) return;
                setEquipTools(tools.filter((tool) => !view.active.some((use) => use.tool.id === tool.id)));
                setEquipOpen(true);
              }}
            >
              <svg className="pf-new-plus" viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
                <rect x="5" y="1" width="2" height="10" />
                <rect x="1" y="5" width="10" height="2" />
              </svg>
              <span className="pf-new-label">Equip a tool</span>
              <span className="pf-new-sub">Pick an approved open-source project.</span>
            </button>
          </li>
        ))}
      </ul>

      {view.closed && view.emptySlots > 0 ? <p className="pf-hint pf-belt-reason" id={reasonId}>{SLOTS_CLOSED_TEXT}</p> : null}
      {view.full ? <p className="pf-hint pf-belt-reason">{SLOTS_FULL_TEXT}</p> : null}

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

      <ToolbeltGate projectId={projectId} hours={hours} />

      <p className="pf-belt-note pf-hint">
        <span className="pf-tag">Provisional</span> Provisional rewards, not paid yet: {TOOLBELT_USER_ORE} Ore once per tool for the builder who uses it,{" "}
        {TOOLBELT_MAKER_ORE} Ore for the maker for each verified user, up to {TOOLBELT_MAKER_CAP_ORE} Ore per tool each season. Equipping gives no Track XP.
      </p>

      <EquipDialog open={equipOpen} onClose={closeEquip} onDone={equipDone} projectId={projectId} tools={equipTools} />
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
  );
}
