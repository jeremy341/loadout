// Pixl fetches a hardware ship's bill of materials from a public CSV address. Nothing is fetched here: the sample parts list
// is built into the sample ship (lib/platform/review.ts), so this answers with no rows.
export async function fetchBomRows(url: string): Promise<string[][] | null> {
  void url;
  return null;
}
