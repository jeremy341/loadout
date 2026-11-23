// Placeholder adapters for the external services LOADOUT will talk to once the platform moves onto Hack Club infrastructure:
// Airtable (YSWS submissions), the Unified Database, Ships, Airbridge and HCB. None of them has a live client in this staging build.
// Each adapter answers "not connected" with a plain message, so a screen can show the gap without implying live data.
//
// Rules for this file:
//   - No network call, and no environment variable is read. A key being present does not make a service connected here.
//   - Every value a placeholder would return is data the UI must label as provisional (see provisional.ts) or leave out.
//   - Staging only: the owner decides when a placeholder becomes a real client.

export const PLACEHOLDER_IDS = ["airtable", "unified-database", "ships", "airbridge", "hcb"] as const;
export type PlaceholderId = (typeof PLACEHOLDER_IDS)[number];

export type NotConnected = {
  ok: false;
  state: "not_connected";
  /** Always false: a placeholder never returns live data. */
  live: false;
  message: string;
};

export type PlaceholderAdapter = {
  id: PlaceholderId;
  name: string;
  /** What the service would provide, in one line, for the UI to show next to the gap. */
  purpose: string;
  /** Resolves to not_connected. Kept async so a real client can replace it without changing callers. */
  read(): Promise<NotConnected>;
};

const notConnected = (name: string): NotConnected => ({
  ok: false,
  state: "not_connected",
  live: false,
  message: `${name} is not connected in this staging build, so there is no live data to show.`,
});

function placeholder(id: PlaceholderId, name: string, purpose: string): PlaceholderAdapter {
  return { id, name, purpose, read: async () => notConnected(name) };
}

export const PLACEHOLDER_ADAPTERS: Readonly<Record<PlaceholderId, PlaceholderAdapter>> = {
  airtable: placeholder("airtable", "Airtable", "YSWS submission records and their review fields."),
  "unified-database": placeholder("unified-database", "Unified Database", "Shared people and ship identifiers across Hack Club programmes."),
  ships: placeholder("ships", "Hack Club Ships", "The archive of approved ships that double-dip checks compare against."),
  airbridge: placeholder("airbridge", "Airbridge", "Eligibility and approval previews from the Airbridge service."),
  hcb: placeholder("hcb", "HCB", "Payouts and grant ledgers held by Hack Club Bank."),
};

export type IntegrationStatusLine = { id: PlaceholderId; name: string; state: "not_connected"; live: false; message: string };

/** One status line per placeholder, in a fixed order, for the reviewer and organiser screens. */
export async function placeholderStatuses(): Promise<IntegrationStatusLine[]> {
  return Promise.all(
    PLACEHOLDER_IDS.map(async (id) => {
      const adapter = PLACEHOLDER_ADAPTERS[id];
      const result = await adapter.read();
      return { id, name: adapter.name, state: result.state, live: result.live, message: result.message };
    }),
  );
}
