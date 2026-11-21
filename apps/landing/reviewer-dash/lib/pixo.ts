// Pixl reaches its Slack bot (Pixo) at these addresses. LOADOUT has no such service, so the addresses are placeholders that
// nothing calls (see pixoCall.ts).
export const PIXO_INTERNAL_URL = "https://pixo.invalid";

export function pixorpheusUrl(): string {
  return PIXO_INTERNAL_URL;
}

export function externalDmUrl(): string {
  return `${PIXO_INTERNAL_URL}/api/external/dm`;
}

export function externalTicketsUrl(): string {
  return `${PIXO_INTERNAL_URL}/api/external/tickets`;
}
