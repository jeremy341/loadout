// Reads the SYSTEM note the server writes when a ship matches another YSWS
// (apps/server/src/ysws/doubleDip.ts) so the dashboard can show a banner that
// says what kind of double dip it is. The wording here follows that file; an
// unrecognised note still gets a generic banner, never nothing.
export type DoubleDipKind = "undisclosed" | "disclosed" | "imported" | "reship" | "loadout" | "other";

export interface DoubleDipView {
  kind: DoubleDipKind;
  title: string;
  tone: "danger" | "warning";
  text: string;
}

export function doubleDipView(systemNote: string): DoubleDipView | null {
  const note = systemNote.trim();
  if (!note) return null;
  const text = note.replace(/^SYSTEM:\s*/i, "");
  if (/did NOT disclose/i.test(text))
    return { kind: "undisclosed", title: "Possible undisclosed double dip", tone: "danger", text };
  if (/(?:Player|Builder) disclosed/i.test(text))
    return { kind: "disclosed", title: "Also submitted to another YSWS", tone: "warning", text };
  if (/^Imported from/i.test(text))
    return { kind: "imported", title: "Imported from another YSWS", tone: "warning", text };
  if (/another LOADOUT ship/i.test(text))
    return { kind: "loadout", title: "Matches another LOADOUT ship", tone: "warning", text };
  if (/re-ship/i.test(text))
    return { kind: "reship", title: "Re-ship of an already approved project", tone: "warning", text };
  return { kind: "other", title: "Double dipped with another YSWS", tone: "warning", text };
}
