// Where a form was sent from, so a sample action that changes nothing real can send the person back to the same page (Pixl's own
// actions revalidate and stay put). Only a same-site path is ever returned; anything else gives the fallback.
import { headers } from "next/headers";
import { safeRedirectPath } from "../safeUrl";

export async function refererPath(fallback: string): Promise<string> {
  try {
    const referer = (await headers()).get("referer");
    if (!referer) return fallback;
    const url = new URL(referer);
    return safeRedirectPath(`${url.pathname}${url.search}`, fallback);
  } catch {
    return fallback;
  }
}

// The referer without an old notice, so a success does not show the error the page was left with.
export async function refererClean(fallback: string): Promise<string> {
  const path = await refererPath(fallback);
  const [base, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.delete("error");
  params.delete("ok");
  params.delete("done");
  const rest = params.toString();
  return rest ? `${base}?${rest}` : base;
}

// The same path with one query value set (used for ?error= and ?ok= notices), replacing the old value of that key.
// A #fragment must stay at the very end: appending "?error=..." after it would put the notice inside the fragment,
// where the server never sees it. Split it off first and put it back after the query string.
export function withNotice(path: string, key: "error" | "ok" | "done" | "sent", message: string): string {
  const hashAt = path.indexOf("#");
  const fragment = hashAt >= 0 ? path.slice(hashAt) : "";
  const withoutFragment = hashAt >= 0 ? path.slice(0, hashAt) : path;
  const qAt = withoutFragment.indexOf("?");
  const base = qAt >= 0 ? withoutFragment.slice(0, qAt) : withoutFragment;
  const params = new URLSearchParams(qAt >= 0 ? withoutFragment.slice(qAt + 1) : "");
  for (const old of ["error", "ok", "done", "sent"]) params.delete(old);
  params.set(key, message);
  return `${base}?${params.toString()}${fragment}`;
}
