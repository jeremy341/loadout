// There is no identity contract yet, so nobody is ever signed in. The Hack Club identity adapter
// (Phase 2) replaces this module: it will return the verified participant for the request, and every
// caller already handles the `null` case. No token is read from a URL, a header or a cookie here.
export type Session = null;

export async function getSession(): Promise<Session> {
  return null;
}
