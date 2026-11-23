// Decides whether the palette's builder and project search should be treated as absent for the rest of the session. A 401, 403 or 404
// means this desk cannot answer; so does a successful or failed response whose body is not JSON (the 404 page is HTML). Other failures
// (a 500, a rate limit) are treated as a bad moment, not as absence, so the next keystroke tries again.
export function searchIsAbsent(res: { ok: boolean; status: number; contentType: string | null }): boolean {
  const json = (res.contentType ?? "").toLowerCase().includes("json");
  if (!json) return true;
  if (res.ok) return false;
  return res.status === 401 || res.status === 403 || res.status === 404;
}
