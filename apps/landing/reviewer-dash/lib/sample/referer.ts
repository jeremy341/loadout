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
export function withNotice(path: string, key: "error" | "ok" | "done", message: string): string {
  const [base, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.delete("error");
  params.delete("ok");
  params.delete("done");
  params.set(key, message);
  return `${base}?${params.toString()}`;
}
