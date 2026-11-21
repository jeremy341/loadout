// Pure helpers for audit rows (kept free of Next/DB imports so they're
// unit-testable). See lib/audit.ts for the writer.

// formData field -> target prefix, checked in this order. The first one
// present becomes the row's target ("project:123").
const TARGET_FIELDS: [string, string][] = [
  ["projectId", "project"],
  ["orderId", "order"],
  ["userId", "user"],
  ["playerId", "user"],
  ["itemId", "shop_item"],
  ["entryId", "entry"],
  ["submissionId", "form_submission"],
  ["reportId", "report"],
  ["banId", "ban"],
  ["proposalId", "ban_proposal"],
  ["roundId", "show_n_tell_round"],
  ["slackId", "slack"],
  ["formKey", "form"],
  ["slug", "slug"],
  ["id", "id"],
];

function isFormDataLike(v: unknown): v is FormData {
  return typeof v === "object" && v !== null && typeof (v as FormData).get === "function" && typeof (v as FormData).keys === "function";
}

// Derives "kind:id" from an action's arguments: a FormData's id fields, or a
// bare number/string first argument (e.g. heartbeatReview(projectId)).
export function targetFromArgs(args: unknown[]): string | null {
  for (const a of args) {
    if (isFormDataLike(a)) {
      for (const [field, kind] of TARGET_FIELDS) {
        const v = a.get(field);
        if (typeof v === "string" && v.trim()) return `${kind}:${v.trim().slice(0, 100)}`;
      }
    } else if (a && typeof a === "object" && !Array.isArray(a)) {
      const o = a as Record<string, unknown>;
      for (const [field, kind] of TARGET_FIELDS) {
        const v = o[field];
        if ((typeof v === "string" && v.trim()) || typeof v === "number")
          return `${kind}:${String(v).slice(0, 100)}`;
      }
    }
  }
  const first = args[0];
  if (typeof first === "number" && Number.isFinite(first)) return `id:${first}`;
  return null;
}

// Field names only, never values: values can be player PII (addresses,
// names, notes), and meta must never hold that.
export function fieldNamesFromArgs(args: unknown[]): string[] {
  const names = new Set<string>();
  for (const a of args) {
    if (isFormDataLike(a)) for (const k of a.keys()) if (!k.startsWith("$ACTION")) names.add(k);
  }
  return [...names].slice(0, 50);
}

// Client IP for audit rows. The FIRST x-forwarded-for hop is whatever the
// client sent (anyone can put "1.2.3.4" there), so it can't be trusted. We
// take the LAST non-empty entry instead: the one appended by our trusted
// ingress (Orchard), which is the address it actually saw the connection from.
// This assumes exactly one trusted proxy sits in front of the app and appends
// to the header; if another proxy layer is ever added in front of it, this
// must skip that many trusted hops from the right. Falls back to x-real-ip.
export function clientIp(get: (name: string) => string | null): string | null {
  const fwd = get("x-forwarded-for");
  if (fwd) {
    const hops = fwd
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    if (hops.length) return hops[hops.length - 1]!.slice(0, 100);
  }
  return get("x-real-ip");
}

// What an audit row records about a thrown error: the class name only, never
// the message. Messages can echo DB values or player PII (a Postgres error
// quotes the offending row), and audit meta must never hold that.
export function errorCode(e: unknown): string {
  if (e && typeof e === "object") {
    const code = (e as { code?: unknown }).code;
    const name = (e as { name?: unknown }).name ?? (e as object).constructor?.name;
    const cls = typeof name === "string" && /^[A-Za-z0-9_.]{1,60}$/.test(name) ? name : "Error";
    // Postgres SQLSTATE / Node error codes are short fixed identifiers, safe to keep.
    if (typeof code === "string" && /^[A-Z0-9_]{1,40}$/.test(code)) return `${cls}:${code}`;
    return cls;
  }
  return typeof e;
}

// Next signals redirect()/notFound() by throwing; those are normal control
// flow, not failures.
export function isNavigationSignal(e: unknown): boolean {
  const digest = (e as { digest?: unknown } | null)?.digest;
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK") || digest === "NEXT_NOT_FOUND")
  );
}
