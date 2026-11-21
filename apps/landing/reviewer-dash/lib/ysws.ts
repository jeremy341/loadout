// Pixl checks a ship against the public YSWS archive over the network. No archive is fetched here, so no ship ever matches.
export interface YswsShip {
  ysws: string;
  approvedAt: string | null;
  hours: number;
  codeUrl: string;
  demoUrl: string;
  description: string;
  urlMatch: boolean;
}

export async function yswsShipsFor(
  slackId: string | null | undefined,
  repoUrl: string | null,
  demoUrl: string | null,
): Promise<YswsShip[]> {
  void slackId;
  void repoUrl;
  void demoUrl;
  return [];
}

export type ReviewArchiveLookup = {
  status: "ready" | "loading" | "unavailable";
  ships: YswsShip[];
};

export async function yswsShipsForReview(
  slackId: string | null | undefined,
  repoUrl: string | null,
  demoUrl: string | null,
  maxWaitMs = 1500,
): Promise<ReviewArchiveLookup> {
  void maxWaitMs;
  return { status: "ready", ships: await yswsShipsFor(slackId, repoUrl, demoUrl) };
}
