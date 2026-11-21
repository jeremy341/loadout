// Pixl asks Fraudy (an AI-usage service) for a human/AI split of tracked time. LOADOUT has no such service and sends nothing:
// the check always answers "no numbers", which the page shows as a quiet line. Types and helpers are Pixl's, from lib/fraudy.ts.
export interface FraudyAiCheck {
  humanSeconds: number;
  aiSeconds: number;
  /** How much less than the raw total the AI / 3 rule recommends. */
  deflationSeconds: number;
}

export function clearFraudyCache(): void {}

export function fraudyHours(seconds: number): string {
  return (Math.round((seconds / 3600) * 10) / 10).toString();
}

export function fraudyCheckKey(hackatimeId: string | number, project: string): string {
  return `${hackatimeId}:${project}`;
}

export async function fraudyCheckAi(hackatimeId: string | number, project: string): Promise<FraudyAiCheck | null> {
  void hackatimeId;
  void project;
  return null;
}
