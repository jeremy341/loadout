// Same-origin check for cookie-authenticated POST routes. Pure. The Origin header (or, when a browser leaves it out, Referer)
// must name the host the request was sent to (the Host header or the request URL). A request with neither header is refused.
//
//   sameOrigin(request) -> boolean
export function sameOrigin(request: Request): boolean {
  const source = request.headers.get("origin") ?? request.headers.get("referer");
  if (!source || source === "null") return false;
  try {
    const from = new URL(source).host.toLowerCase();
    const hosts = [request.headers.get("host"), new URL(request.url).host];
    return hosts.some((host) => host !== null && host.toLowerCase() === from);
  } catch {
    return false;
  }
}
