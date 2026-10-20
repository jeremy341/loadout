import type { RefKind } from "./types";

const KINDS: RefKind[] = ["project", "idea", "post", "comment"];

/** An item reference such as "idea:i-abc". Reactions, comments, reports and hides all key on it. */
export function makeRef(kind: RefKind, id: string): string {
  return `${kind}:${id}`;
}

export function parseRef(ref: string): { kind: RefKind; id: string } | null {
  const index = ref.indexOf(":");
  if (index <= 0) return null;
  const kind = ref.slice(0, index) as RefKind;
  const id = ref.slice(index + 1);
  if (!KINDS.includes(kind) || id.length === 0) return null;
  return { kind, id };
}
