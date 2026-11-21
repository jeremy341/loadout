// Fulfiller order-alert opt-in, switched by DM: "orders on", "orders off", "orders status" (spec section 5).
// API: parseOrdersCommand(text) -> "on" | "off" | "status" | null, createOrderAlerts() -> { set, get, count }.
// Why memory only: the site will own this preference later. Until then a restart resets everyone to off, which is
// the spec default, so nothing is stored about people beyond their Slack id for the life of the process.
export type OrdersCommand = "on" | "off" | "status";

export function parseOrdersCommand(text: string): OrdersCommand | null {
  const m = /^orders\s+(on|off|status)$/i.exec(text.trim());
  const word = m?.[1];
  if (!word) return null;
  return word.toLowerCase() as OrdersCommand;
}

export function createOrderAlerts() {
  const on = new Set<string>();
  return {
    set(slackId: string, enabled: boolean): void {
      if (enabled) on.add(slackId);
      else on.delete(slackId);
    },
    get(slackId: string): boolean {
      return on.has(slackId);
    },
    count: () => on.size,
  };
}
