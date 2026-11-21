// The caller's address for rate limits and audit throttles. A forwarding header is only as honest as whoever set it: a client
// that reaches the app directly can send any x-forwarded-for or x-real-ip, so those are read only when the deployment says a
// proxy it trusts sits in front (LOADOUT_TRUST_PROXY=true, or running on Vercel, which sets VERCEL). Without that, every caller
// shares one constant "unknown" bucket for the instance: coarse, but never a value a client can rotate to dodge a limit.
//
// With a trusted proxy the LAST hop of x-forwarded-for is used, the one that proxy appended itself; earlier hops are whatever
// the client sent. On Vercel x-vercel-forwarded-for (set by the platform, not forwardable) comes first.
//
// API:
//   clientIp(request, env?) -> string      an address, or "unknown"
//   isTrustedProxy(env?) -> boolean
export const UNKNOWN_IP = "unknown";

const IP_PATTERN = /^[0-9A-Fa-f:.]{2,64}$/;

type HeaderSource = Pick<Request, "headers">;
type Env = Record<string, string | undefined>;

export function isTrustedProxy(env: Env = process.env): boolean {
  return env.LOADOUT_TRUST_PROXY === "true" || Boolean(env.VERCEL);
}

function lastHop(value: string | null): string | null {
  if (!value) return null;
  const parts = value.split(",");
  const last = parts[parts.length - 1]?.trim() ?? "";
  return IP_PATTERN.test(last) ? last : null;
}

function single(value: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  return IP_PATTERN.test(trimmed) ? trimmed : null;
}

export function clientIp(request: HeaderSource, env: Env = process.env): string {
  if (!isTrustedProxy(env)) return UNKNOWN_IP;
  const headers = request.headers;
  const vercel = env.VERCEL ? lastHop(headers.get("x-vercel-forwarded-for")) : null;
  return vercel ?? lastHop(headers.get("x-forwarded-for")) ?? single(headers.get("x-real-ip")) ?? UNKNOWN_IP;
}
