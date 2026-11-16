// Pixl drafts review notes with a hosted model. LOADOUT sends nothing to a model; the type is kept so the form compiles.
export interface AiReviewDraft {
  summary: string;
  technicalFeatures: string;
  deflationReason: string;
  notes: string;
  redFlags: string[];
  strengths: string[];
  model: string;
}
